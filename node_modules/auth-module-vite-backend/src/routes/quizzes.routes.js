// src/routes/quizzes.routes.js
const express = require("express");
const { pool } = require("../db"); // Debe exportar pool de mysql2/promise
const {
  authenticateToken,
  resolveInstitutionId,
  getMembershipForInstitution,
  requireRolesWithInstitution,
} = require("../middlewares/auth.middleware");
const { randomUUID } = require("crypto");

const router = express.Router();

/* ----------------------------- Config de acceso ----------------------------- */
/**
 * QUIZ_ACCESS_MODE:
 *  - 'GLOBAL': cualquier usuario autenticado puede acceder a quizzes ACTIVOS (ignora 'publico')
 *  - 'PUBLIC_FLAG': solo quizzes con publico=1 y activo=1 (tu comportamiento original)
 */
const QUIZ_ACCESS_MODE = process.env.QUIZ_ACCESS_MODE || "GLOBAL";

/* ------------------------- Helpers de cálculo de severidad ------------------------- */
/**
 * Determina la categoría de severidad en función del puntaje total y el código del quiz.
 * Soporta BAI (Inventario de Ansiedad de Beck) y BDI-II (Inventario de Depresión de Beck II).
 */
function mapSeveridad(codigo, score) {
  if (String(codigo).toUpperCase() === "BAI") {
    // BAI (0–63)
    if (score <= 7) return "MINIMA";
    if (score <= 15) return "LEVE";
    if (score <= 25) return "MODERADA";
    return "SEVERA";
  }
  // BDI-II (0–63)
  if (score <= 13) return "MINIMA";
  if (score <= 19) return "LEVE";
  if (score <= 28) return "MODERADA";
  return "SEVERA";
}

/* ----------------------------- Notificaciones a tutores ----------------------------- */

const ALERT_MIN_SEVERITY = "MODERADA"; // Cambia a 'SEVERA' si quieres solo lo más alto
const SEVERITY_ORDER = ["MINIMA", "LEVE", "MODERADA", "SEVERA"];
const sevAtLeast = (cur, min) =>
  SEVERITY_ORDER.indexOf(String(cur)) >= SEVERITY_ORDER.indexOf(String(min));

// Busca tutores asignados explícitamente; si no hay, cae a ORIENTADOR/PSICOLOGO de la institución
async function findAssignedTutors(institucionId, alumnoId) {
  // Opción A: mapeo explícito tutores_alumnos (si existe en tu DB)
  try {
    const [rows] = await pool.execute(
      `SELECT ta.tutorId, u.email, COALESCE(u.nombreCompleto, u.nombre) AS tutorNombre
         FROM tutores_alumnos ta
         LEFT JOIN usuarios u ON u.id = ta.tutorId
        WHERE ta.institucionId = ? AND ta.alumnoId = ? AND ta.activo = 1`,
      [institucionId, alumnoId]
    );
    if (rows.length) return rows;
  } catch (_) {
    // Si la tabla no existe, caemos a B
  }

  // Opción B: fallback a todos los orientadores/psicólogos de la institución
  const [rows2] = await pool.execute(
    `SELECT ui.usuarioId AS tutorId,
            u.email,
            COALESCE(u.nombreCompleto, u.nombre) AS tutorNombre
       FROM usuario_institucion ui
       JOIN usuarios u ON u.id = ui.usuarioId
      WHERE ui.institucionId = ?
        AND ui.rolInstitucion IN ('ORIENTADOR','PSICOLOGO')
        AND ui.activo = 1`,
    [institucionId]
  );
  return rows2;
}

async function queueTutorNotifications({
  institucionId,
  alumnoId,
  quizId,
  attemptId,
  puntajeTotal,
  severidad,
}) {
  if (!sevAtLeast(severidad, ALERT_MIN_SEVERITY)) return;

  const tutors = await findAssignedTutors(institucionId, alumnoId);
  if (!tutors.length) return;

  const notifTitle = `Alerta ${severidad} en cuestionario`;
  const notifBody = `Se registró un resultado ${severidad} (puntaje ${puntajeTotal}). Respuesta: ${attemptId}. Revise para canalizar.`;

  for (const t of tutors) {
    await pool.execute(
      `INSERT INTO notificaciones (id, usuarioId, tipo, titulo, mensaje, leida, importante, datos, fechaEnvio)
       VALUES (?, ?, 'URGENTE', ?, ?, 0, 1, JSON_OBJECT(
         'respuestaId', ?, 'alumnoId', ?, 'quizId', ?, 'severidad', ?, 'puntaje', ?
       ), NOW())`,
      [
        randomUUID(),
        t.tutorId,
        notifTitle,
        notifBody,
        attemptId,
        alumnoId,
        quizId,
        severidad,
        puntajeTotal,
      ]
    );

    // Si luego quieres emails, crea también una fila en email_outbox aquí.
  }
}

/* ------------------------------ Acceso a un quiz ------------------------------ */
/**
 * Verifica si el usuario autenticado tiene acceso al quiz especificado (por ID).
 * GLOBAL: todos los autenticados a quizzes activos.
 * PUBLIC_FLAG: solo publico=1 y activo=1 (super admin nacional ve todos).
 */
async function ensureQuizAccessForUser(quizId, user) {
  const [rows] = await pool.execute(
    `SELECT q.id, q.institucionId, q.titulo, q.codigo, q.version, q.descripcion, q.activo, q.publico
       FROM quizzes q
      WHERE q.id = ?`,
    [quizId]
  );
  if (!rows.length) return null;
  const quiz = rows[0];

  // Super admin nacional puede ver todo
  if (user?.rol === "SUPER_ADMIN_NACIONAL") return quiz;

  if (QUIZ_ACCESS_MODE === "GLOBAL") {
    // Acceso global: cualquier usuario autenticado puede abrir quizzes ACTIVOS
    if (quiz.activo === 1) return quiz;
    return null;
  }

  // Modo PUBLIC_FLAG (original): solo público y activo
  if (quiz.publico === 1 && quiz.activo === 1) return quiz;
  return null;
}

/* ----------------------------- Definición de Rutas ----------------------------- */

/**
 * GET /api/quizzes/public
 * Lista de quizzes disponibles según el modo de acceso.
 * GLOBAL: todos los activos
 * PUBLIC_FLAG: solo publico=1 y activo=1
 */
router.get("/public", authenticateToken, async (req, res) => {
  try {
    const where = ["q.activo = 1"];
    if (QUIZ_ACCESS_MODE === "PUBLIC_FLAG") where.push("q.publico = 1");

    const [rows] = await pool.execute(
      `SELECT q.id, q.titulo, q.descripcion, q.codigo, q.version
         FROM quizzes q
        WHERE ${where.join(" AND ")}
        ORDER BY q.codigo, q.version DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /api/quizzes/public error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

/**
 * GET /api/quizzes/me/results
 * Resultados del usuario autenticado (estudiante).
 */
router.get("/me/results", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT rq.id, rq.quizId, q.titulo, q.codigo, q.version,
              rq.puntajeTotal, rq.severidad, rq.fechaEnvio
         FROM respuestas_quiz rq
         JOIN quizzes q ON q.id = rq.quizId
        WHERE rq.usuarioId = ?
        ORDER BY rq.fechaEnvio DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /api/quizzes/me/results error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

/**
 * GET /api/quizzes/resultados
 * Listado de intentos para personal autorizado de la institución.
 */
router.get(
  "/resultados",
  ...requireRolesWithInstitution([
    "PSICOLOGO",
    "ORIENTADOR",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const institucionId = req.institucionId; // lo setea el guard
    const {
      codigo = null,
      severidad = null,
      page = 1,
      pageSize = 20,
      debug = 0,
    } = req.query;

    let pageNum = parseInt(page, 10);
    if (!Number.isFinite(pageNum) || pageNum < 1) pageNum = 1;

    let limit = parseInt(pageSize, 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 200) limit = 200;

    const offset = (pageNum - 1) * limit;

    const whereParts = ["rq.institucionId = ?"];
    const params = [String(institucionId)];

    if (codigo) {
      whereParts.push("q.codigo = ?");
      params.push(String(codigo));
    }
    if (severidad) {
      whereParts.push("rq.severidad = ?");
      params.push(String(severidad));
    }
    const whereSQL = `WHERE ${whereParts.join(" AND ")}`;

    const baseFrom = `
      FROM respuestas_quiz rq
      JOIN quizzes  q ON q.id = rq.quizId
      JOIN usuarios u ON u.id = rq.usuarioId
      ${whereSQL}
    `;

    const dataSql = `
      SELECT
        rq.id,
        rq.fechaEnvio,
        rq.puntajeTotal,
        rq.severidad,
        q.id AS quizId,
        q.titulo,
        q.codigo,
        q.\`version\` AS version,
        u.id AS estudianteId,
        COALESCE(u.nombreCompleto, u.nombre) AS estudianteNombre
      ${baseFrom}
      ORDER BY rq.fechaEnvio DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      ${baseFrom}
    `;

    try {
      const [countRows] = await pool.execute(countSql, params);
      const total = Number(countRows?.[0]?.total || 0);

      const [rows] = await pool.execute(dataSql, params);

      if (String(debug) === "1") {
        return res.json({
          success: true,
          total,
          page: pageNum,
          pageSize: limit,
          data: rows,
          debug: {
            whereSQL,
            params,
            countSql: countSql.replace(/\s+/g, " ").trim(),
            dataSql: dataSql.replace(/\s+/g, " ").trim(),
          },
        });
      }

      return res.json({
        success: true,
        total,
        page: pageNum,
        pageSize: limit,
        data: rows,
      });
    } catch (err) {
      console.error("[/quizzes/resultados] error:", {
        code: err?.code,
        errno: err?.errno,
        sqlState: err?.sqlState,
        message: err?.message,
        sql: err?.sql,
      });

      if (String(debug) === "1") {
        return res.status(500).json({
          success: false,
          message: "Error interno",
          error: {
            code: err?.code,
            errno: err?.errno,
            sqlState: err?.sqlState,
            message: err?.message,
            sql: err?.sql,
          },
          debug: {
            whereSQL,
            params,
            countSql: countSql.replace(/\s+/g, " ").trim(),
            dataSql: dataSql.replace(/\s+/g, " ").trim(),
          },
        });
      }

      return res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  }
);

router.get(
  "/analytics",
  ...requireRolesWithInstitution([
    "PSICOLOGO",
    "ORIENTADOR",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    try {
      const institucionId = req.institucionId; // lo setea el guard
      const { codigo = null, desde = null, hasta = null } = req.query;

      const where = ["rq.institucionId = ?"];
      const params = [String(institucionId)];

      if (codigo) {
        where.push("q.codigo = ?");
        params.push(String(codigo));
      }
      // TZ-safe: comparar sobre DATE()
      if (desde) {
        where.push("DATE(rq.fechaEnvio) >= ?");
        params.push(String(desde).slice(0, 10));
      }
      if (hasta) {
        where.push("DATE(rq.fechaEnvio) <= ?");
        params.push(String(hasta).slice(0, 10));
      }

      const WHERE = `WHERE ${where.join(" AND ")}`;

      const [summary] = await pool.execute(
        `SELECT
           COUNT(*)             AS total,
           AVG(rq.puntajeTotal) AS promedio,
           MIN(rq.puntajeTotal) AS minimo,
           MAX(rq.puntajeTotal) AS maximo,
           MAX(rq.fechaEnvio)   AS ultimaMuestra
         FROM respuestas_quiz rq
         JOIN quizzes q ON q.id = rq.quizId
         ${WHERE}`,
        params
      );

      const [bySeverity] = await pool.execute(
        `SELECT rq.severidad, COUNT(*) AS total
           FROM respuestas_quiz rq
           JOIN quizzes q ON q.id = rq.quizId
           ${WHERE}
          GROUP BY rq.severidad
          ORDER BY FIELD(rq.severidad,'MINIMA','LEVE','MODERADA','SEVERA')`,
        params
      );

      const [trend] = await pool.execute(
        `SELECT DATE(rq.fechaEnvio) AS fecha, COUNT(*) AS total
           FROM respuestas_quiz rq
           JOIN quizzes q ON q.id = rq.quizId
           ${WHERE}
          GROUP BY DATE(rq.fechaEnvio)
          ORDER BY fecha ASC
          LIMIT 180`,
        params
      );

      const [byQuiz] = await pool.execute(
        `SELECT q.codigo, q.\`version\` AS version,
                COUNT(*) AS total, AVG(rq.puntajeTotal) AS promedio
           FROM respuestas_quiz rq
           JOIN quizzes q ON q.id = rq.quizId
           ${WHERE}
          GROUP BY q.codigo, q.\`version\`
          ORDER BY q.codigo, q.\`version\``,
        params
      );

      return res.json({
        success: true,
        filters: { institucionId, codigo, desde, hasta },
        summary: summary?.[0] || { total: 0 },
        bySeverity,
        trend,
        byQuiz,
      });
    } catch (err) {
      console.error("[/quizzes/analytics] error:", err);
      return res.status(500).json({ success: false, message: "Error interno" });
    }
  }
);

/**
 * GET /api/quizzes/:quizId
 * Devuelve los metadatos del quiz junto con su lista de preguntas.
 */
router.get("/:quizId", authenticateToken, async (req, res) => {
  try {
    const quiz = await ensureQuizAccessForUser(req.params.quizId, req.user);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz no encontrado o sin acceso",
        code: "QUIZ_NOT_FOUND",
      });
    }
    const [preguntas] = await pool.execute(
      `SELECT p.id, p.orden, p.texto, p.tipo, p.opciones, p.obligatoria
         FROM preguntas p
        WHERE p.quizId = ?
        ORDER BY p.orden ASC`,
      [quiz.id]
    );
    return res.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          titulo: quiz.titulo,
          codigo: quiz.codigo,
          version: quiz.version,
          descripcion: quiz.descripcion,
        },
        preguntas,
      },
    });
  } catch (err) {
    console.error("GET /api/quizzes/:quizId error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

/**
 * POST /api/quizzes/:quizId/submit
 * Guarda un intento de quiz (respuestas de un usuario).
 * Body: { respuestas: [{ preguntaId, valor }...], consentimientoAceptado?: boolean, tiempoInicio?: ISOString }
 */
router.post("/:quizId/submit", authenticateToken, async (req, res) => {
  try {
    const quiz = await ensureQuizAccessForUser(req.params.quizId, req.user);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz no encontrado o sin acceso",
        code: "QUIZ_NOT_FOUND",
      });
    }

    const { respuestas = [], consentimientoAceptado, tiempoInicio } = req.body;

    // --------------------- Selección de institución del intento ---------------------
    let instId =
      resolveInstitutionId(req) ||
      (req.user.instituciones || []).find((m) => m.isMembershipActiva)
        ?.institucionId ||
      (req.user.instituciones || [])[0]?.institucionId ||
      null;

    if (!instId) {
      return res.status(400).json({
        success: false,
        message: "No se pudo determinar la institución del intento",
        code: "NO_INSTITUTION_CONTEXT",
      });
    }

    const membership = getMembershipForInstitution(req.user, instId);
    if (!membership || !membership.isMembershipActiva) {
      return res.status(403).json({
        success: false,
        message:
          "Membresía inactiva o inexistente en la institución seleccionada",
        code: "INSTITUTION_ACCESS_DENIED",
      });
    }

    // --------------------- Validación de preguntas y valores ---------------------
    const [qMeta] = await pool.execute(
      `SELECT p.id, p.obligatoria FROM preguntas p WHERE p.quizId = ?`,
      [quiz.id]
    );
    if (!qMeta.length) {
      return res.status(400).json({
        success: false,
        message: "El quiz no tiene preguntas configuradas",
        code: "QUIZ_WITHOUT_QUESTIONS",
      });
    }

    const MAX_ITEMS = 200;
    if (!Array.isArray(respuestas) || respuestas.length > MAX_ITEMS) {
      return res.status(400).json({
        success: false,
        code: "PAYLOAD_TOO_LARGE",
        message: "Demasiadas respuestas",
      });
    }

    const validIds = new Set(qMeta.map((r) => r.id));
    const seen = new Set();
    const invalidItems = [];

    for (const r of respuestas) {
      const pid = r?.preguntaId;
      const val = Number(r?.valor);
      if (seen.has(pid))
        invalidItems.push({ preguntaId: pid, error: "DUPLICATE" });
      seen.add(pid);
      if (!validIds.has(pid) || !Number.isInteger(val) || val < 0 || val > 3) {
        invalidItems.push({
          preguntaId: pid,
          valor: r?.valor,
          error: "INVALID",
        });
      }
    }
    if (invalidItems.length) {
      return res.status(400).json({
        success: false,
        message:
          "Respuestas inválidas/duplicadas o fuera de rango (0..3) o preguntaId no pertenece al quiz",
        code: "INVALID_ANSWERS",
        detail: invalidItems.slice(0, 20),
      });
    }

    const requiredMissing = qMeta
      .filter((r) => r.obligatoria === 1 && !seen.has(r.id))
      .map((r) => r.id);

    if (requiredMissing.length) {
      return res.status(400).json({
        success: false,
        code: "MISSING_REQUIRED",
        message: "Faltan preguntas obligatorias",
        detail: requiredMissing.slice(0, 50),
      });
    }

    // --------------------- Scoring ---------------------
    let score = 0;
    for (const r of respuestas) score += Number(r.valor);
    const severidad = mapSeveridad(quiz.codigo, score);

    // --------------------- Insert ---------------------
    const attemptId = randomUUID();
    console.log("Generated attemptId:", attemptId, "Length:", attemptId?.length);
    const respuestasJSON = JSON.stringify({
      consentimientoAceptado: !!consentimientoAceptado,
      items: respuestas,
    });
    const inicio = tiempoInicio ? new Date(tiempoInicio) : null;
    const fin = new Date();

    console.log("🔍 Debug INSERT values:");
    console.log("- attemptId:", attemptId, "(type:", typeof attemptId, ")");
    console.log("- req.user.id:", req.user.id, "(type:", typeof req.user.id, ")");
    console.log("- instId:", instId, "(type:", typeof instId, ")");
    console.log("- quiz.id:", quiz.id, "(type:", typeof quiz.id, ")");
    console.log("- respuestasJSON:", respuestasJSON ? "exists" : "null/undefined", "(length:", respuestasJSON?.length, ")");
    console.log("- score:", score, "(type:", typeof score, ")");
    console.log("- severidad:", severidad, "(type:", typeof severidad, ")");
    console.log("- inicio:", inicio, "(type:", typeof inicio, ")");
    console.log("- fin:", fin, "(type:", typeof fin, ")");

    // Validate required fields
    if (!attemptId) throw new Error("attemptId is required");
    if (!req.user.id) throw new Error("usuarioId is required");
    if (!instId) throw new Error("institucionId is required");
    if (!quiz.id) throw new Error("quizId is required");
    if (!respuestasJSON) throw new Error("respuestas JSON is required");

    // Try with minimal required fields first
    console.log("🧪 Attempting INSERT with minimal fields...");

    try {
      await pool.execute(
        `INSERT INTO respuestas_quiz
           (id, usuarioId, institucionId, quizId, respuestas)
         VALUES (?, ?, ?, ?, ?)`,
        [
          attemptId,
          req.user.id,
          instId,
          quiz.id,
          respuestasJSON,
        ]
      );
      console.log("✅ Minimal INSERT succeeded - now adding remaining fields...");

      // If minimal works, update with remaining fields
      await pool.execute(
        `UPDATE respuestas_quiz
         SET puntajeTotal = ?, severidad = ?, completado = ?, tiempoInicio = ?, tiempoFin = ?
         WHERE id = ?`,
        [score, severidad, 1, inicio, fin, attemptId]
      );

    } catch (minimalError) {
      console.error("❌ Even minimal INSERT failed:", minimalError.message);

      // Try without id to see if database can auto-generate
      console.log("🧪 Trying INSERT without manual ID...");
      const [result] = await pool.execute(
        `INSERT INTO respuestas_quiz
           (usuarioId, institucionId, quizId, respuestas, puntajeTotal, severidad, completado, tiempoInicio, tiempoFin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          instId,
          quiz.id,
          respuestasJSON,
          score,
          severidad,
          1,
          inicio,
          fin,
        ]
      );

      console.log("✅ INSERT without ID succeeded, insertId:", result.insertId);
      attemptId = result.insertId;
    }

    // --------------------- Notificar tutores si es alto ---------------------
    await queueTutorNotifications({
      institucionId: instId,
      alumnoId: req.user.id,
      quizId: quiz.id,
      attemptId,
      puntajeTotal: score,
      severidad,
    });

    return res.status(201).json({
      success: true,
      data: {
        attemptId,
        institucionId: instId,
        quiz: {
          id: quiz.id,
          codigo: quiz.codigo,
          titulo: quiz.titulo,
          version: quiz.version,
        },
        puntajeTotal: score,
        severidad,
        fechaEnvio: fin,
      },
    });
  } catch (err) {
    console.error("POST /api/quizzes/:quizId/submit error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

module.exports = router;

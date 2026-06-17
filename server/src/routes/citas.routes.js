const express = require("express");
const { pool } = require("../db");
const {
  authenticateToken,
  requireRolesWithInstitution,
  resolveInstitutionId,
} = require("../middlewares/auth.middleware");

const router = express.Router();

async function getActiveInstitutionId(req) {
  return (
    resolveInstitutionId(req) ||
    (req.user.instituciones || []).find((m) => m.isMembershipActiva)
      ?.institucionId ||
    null
  );
}

// overlap check using fechaHora + duracion
async function hasOverlap(psicologoId, fechaHora, duracion, excludeId = null) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n
       FROM citas
      WHERE psicologoId = ?
        AND estado IN ('ASIGNADA','PROGRAMADA','CONFIRMADA','EN_PROGRESO')
        AND fechaHora IS NOT NULL
        -- (A starts before B ends) AND (A ends after B starts)
        AND fechaHora < DATE_ADD(?, INTERVAL ? MINUTE)
        AND DATE_ADD(fechaHora, INTERVAL duracion MINUTE) > ?
        ${excludeId ? "AND id <> ?" : ""}`,
    excludeId
      ? [
          String(psicologoId),
          new Date(fechaHora),
          Number(duracion),
          new Date(fechaHora),
          String(excludeId),
        ]
      : [
          String(psicologoId),
          new Date(fechaHora),
          Number(duracion),
          new Date(fechaHora),
        ]
  );
  return Number(rows[0]?.n || 0) > 0;
}

/* ----------------- Lists ----------------- */

// Psych: open requests (to claim)
router.get(
  "/requests/open",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const instId = req.institucionId;
    const [rows] = await pool.execute(
      `SELECT id, usuarioId, respuestaId, severidad, fechaCreacion
         FROM citas
        WHERE institucionId = ? AND estado = 'SOLICITADA' AND psicologoId IS NULL
        ORDER BY fechaCreacion DESC
        LIMIT 200`,
      [String(instId)]
    );
    res.json({ success: true, data: rows });
  }
);

// Psych: mine (claimed + booked)
router.get(
  "/mine",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT c.*,
              u.nombreCompleto as estudianteNombre, u.matricula, u.email as estudianteEmail
       FROM citas c
       LEFT JOIN usuarios u ON c.usuarioId = u.id
       WHERE c.psicologoId = ?
         AND c.estado IN ('SOLICITADA','ASIGNADA','PROGRAMADA','CONFIRMADA','EN_PROGRESO')
       ORDER BY (c.fechaHora IS NULL) DESC, c.fechaHora ASC
       LIMIT 200`,
      [String(req.user.id)]
    );
    res.json({ success: true, data: rows });
  }
);

// Psych: agenda (alias for mine for compatibility)
router.get(
  "/agenda",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    try {
      const { fechaDesde, fechaHasta, estado } = req.query;

      let whereClause = "WHERE c.psicologoId = ?";
      let queryParams = [String(req.user.id)];

      if (estado) {
        whereClause += " AND c.estado = ?";
        queryParams.push(estado);
      } else {
        // Default: show relevant states for psychologist agenda
        whereClause += " AND c.estado IN ('SOLICITADA','ASIGNADA','PROGRAMADA','CONFIRMADA','EN_PROGRESO')";
      }

      if (fechaDesde) {
        whereClause += " AND c.fechaHora >= ?";
        queryParams.push(fechaDesde);
      }

      if (fechaHasta) {
        whereClause += " AND c.fechaHora <= ?";
        queryParams.push(fechaHasta);
      }

      const [citas] = await pool.execute(
        `SELECT c.*,
                u.nombreCompleto as estudianteNombre, u.matricula, u.email as estudianteEmail,
                u.telefono as estudianteTelefono
         FROM citas c
         LEFT JOIN usuarios u ON c.usuarioId = u.id
         ${whereClause}
         ORDER BY c.fechaHora ASC, c.fechaCreacion ASC
         LIMIT 200`,
        queryParams
      );

      res.json({
        success: true,
        data: {
          citas,
          total: citas.length
        }
      });
    } catch (error) {
      console.error("Error obteniendo agenda del psicólogo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// Student: see published OPEN slots
router.get("/slots", authenticateToken, async (req, res) => {
  const instId = await getActiveInstitutionId(req);
  if (!instId)
    return res.status(400).json({ success: false, message: "Sin institución" });

  const { from = null, to = null, psicologoId = null } = req.query;
  const where = ["institucionId = ?", "estado = 'ABIERTA'"];
  const params = [String(instId)];
  if (from) {
    where.push("fechaHora >= ?");
    params.push(new Date(from));
  }
  if (to) {
    where.push("DATE_ADD(fechaHora, INTERVAL duracion MINUTE) <= ?");
    params.push(new Date(to));
  }
  if (psicologoId) {
    where.push("psicologoId = ?");
    params.push(String(psicologoId));
  }

  const [rows] = await pool.execute(
    `SELECT id, psicologoId, fechaHora, duracion
         FROM citas
        WHERE ${where.join(" AND ")}
        ORDER BY fechaHora ASC
        LIMIT 500`,
    params
  );
  res.json({ success: true, data: rows });
});

/* ----------------- Actions ----------------- */

// Claim a request (first writer wins)
router.post(
  "/:id/claim",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const instId = req.institucionId;
    const id = req.params.id;
    const [upd] = await pool.execute(
      `UPDATE citas
          SET estado='ASIGNADA', psicologoId=?, holdUntil=DATE_ADD(NOW(3), INTERVAL 30 MINUTE)
        WHERE id=? AND institucionId=? AND estado='SOLICITADA' AND psicologoId IS NULL`,
      [String(req.user.id), id, String(instId)]
    );
    if (upd.affectedRows === 0)
      return res
        .status(409)
        .json({
          success: false,
          message: "Ya fue tomada o no está SOLICITADA",
        });
    res.json({ success: true });
  }
);

// Release a claim (back to SOLICITADA)
router.post(
  "/:id/release",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const instId = req.institucionId;
    const id = req.params.id;
    const [upd] = await pool.execute(
      `UPDATE citas
          SET estado='SOLICITADA', psicologoId=NULL, holdUntil=NULL
        WHERE id=? AND institucionId=? AND estado='ASIGNADA' AND psicologoId=?`,
      [id, String(instId), String(req.user.id)]
    );
    if (upd.affectedRows === 0)
      return res
        .status(409)
        .json({
          success: false,
          message: "No tienes el claim o ya cambió de estado",
        });
    res.json({ success: true });
  }
);

// Schedule a claimed request → PROGRAMADA
router.post(
  "/:id/schedule",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const instId = req.institucionId;
    const id = req.params.id;
    const { fechaHora, duracion = 60 } = req.body;
    if (!fechaHora)
      return res
        .status(400)
        .json({ success: false, message: "fechaHora requerida" });

    // Verify ownership
    const [rows] = await pool.execute(
      `SELECT id, psicologoId FROM citas
        WHERE id=? AND institucionId=? AND estado='ASIGNADA'`,
      [id, String(instId)]
    );
    if (!rows.length || rows[0].psicologoId !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: "Debes tener el claim" });

    // No overlaps
    if (await hasOverlap(req.user.id, fechaHora, duracion, id))
      return res
        .status(409)
        .json({ success: false, message: "Conflicto de horario" });

    const [upd] = await pool.execute(
      `UPDATE citas
          SET estado='PROGRAMADA', fechaHora=?, duracion=?, holdUntil=NULL
        WHERE id=? AND institucionId=? AND estado='ASIGNADA' AND psicologoId=?`,
      [
        new Date(fechaHora),
        Number(duracion),
        id,
        String(instId),
        String(req.user.id),
      ]
    );
    if (upd.affectedRows === 0)
      return res
        .status(409)
        .json({ success: false, message: "No se pudo programar" });
    res.json({ success: true });
  }
);

// Psych publishes OPEN slots (ABIERTA)
router.post(
  "/slots",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const instId = req.institucionId;
    const { blocks = [] } = req.body; // [{fechaHora, duracion}]
    if (!Array.isArray(blocks) || !blocks.length)
      return res.status(400).json({ success: false, message: "blocks vacío" });

    // Create slot appointments for psychologist
    let insertedCount = 0;
    for (const b of blocks) {
      if (!b.fechaHora) continue;

      try {
        const slotId = require("crypto").randomUUID();
        await pool.execute(
          `INSERT INTO citas (id, psicologoId, estado, fechaHora, duracion, fechaCreacion, createdBy, updatedAt)
           VALUES (?, ?, 'ABIERTA', ?, ?, NOW(3), ?, NOW(3))`,
          [
            slotId,
            String(req.user.id),
            new Date(b.fechaHora),
            Number(b.duracion || 60),
            String(req.user.id)
          ]
        );
        insertedCount++;
      } catch (error) {
        console.error("Error creating slot:", error);
      }
    }

    if (insertedCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No se pudieron crear slots" });
    }
    res.status(201).json({ success: true, inserted: insertedCount });
  }
);

// Student creates appointment request
router.post("/", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const {
      psicologoId,
      fechaHora,
      duracion = 60,
      modalidad = "PRESENCIAL",
      motivo,
      ubicacion,
      notas
    } = req.body;

    // Validate required fields
    if (!psicologoId || !fechaHora || !motivo) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: psicologoId, fechaHora, motivo"
      });
    }

    // Verify the psychologist exists and is available
    const [psychologist] = await pool.execute(
      `SELECT u.id FROM usuarios u
       INNER JOIN usuario_institucion ui ON u.id = ui.usuarioId
       WHERE u.id = ?
         AND ui.institucionId = ?
         AND ui.activo = 1
         AND ui.rolInstitucion IN ('PSICOLOGO', 'ORIENTADOR')
         AND u.status = 'ACTIVO'`,
      [psicologoId, String(instId)]
    );

    if (!psychologist.length) {
      return res.status(400).json({
        success: false,
        message: "Psicólogo no disponible"
      });
    }

    // Check for overlaps with existing appointments
    if (await hasOverlap(psicologoId, fechaHora, duracion)) {
      return res.status(409).json({
        success: false,
        message: "El horario seleccionado no está disponible"
      });
    }

    // Create the appointment request
    const appointmentId = require("crypto").randomUUID();
    const [result] = await pool.execute(
      `INSERT INTO citas (
        id, usuarioId, psicologoId, fechaHora, duracion, modalidad, motivo, ubicacion,
        estado, fechaCreacion, createdBy, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SOLICITADA', NOW(3), ?, NOW(3))`,
      [
        appointmentId,
        String(req.user.id),
        String(psicologoId),
        new Date(fechaHora),
        Number(duracion),
        modalidad,
        motivo,
        ubicacion || null,
        String(req.user.id)
      ]
    );

    res.status(201).json({
      success: true,
      message: "Solicitud de cita enviada exitosamente",
      appointmentId: result.insertId
    });

  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// Student books an OPEN slot → PROGRAMADA for that student
router.post("/slots/:id/book", authenticateToken, async (req, res) => {
  const instId = await getActiveInstitutionId(req);
  if (!instId)
    return res.status(400).json({ success: false, message: "Sin institución" });

  const id = req.params.id;
  const [slot] = await pool.execute(
    `SELECT id FROM citas WHERE id=? AND institucionId=? AND estado='ABIERTA'`,
    [id, String(instId)]
  );
  if (!slot.length)
    return res
      .status(404)
      .json({ success: false, message: "Slot no disponible" });

  const [upd] = await pool.execute(
    `UPDATE citas
          SET estado='PROGRAMADA', usuarioId=?
        WHERE id=? AND institucionId=? AND estado='ABIERTA'`,
    [String(req.user.id), id, String(instId)]
  );
  if (upd.affectedRows === 0)
    return res
      .status(409)
      .json({ success: false, message: "Otro usuario tomó el slot" });
  res.json({ success: true });
});

// Close / Cancel / No-show
router.post(
  "/:id/status",
  ...requireRolesWithInstitution([
    "ORIENTADOR",
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  async (req, res) => {
    const instId = req.institucionId;
    const id = req.params.id;
    const { estado } = req.body; // 'COMPLETADA'|'CANCELADA'|'NO_ASISTIO'|'EN_PROGRESO'|'CONFIRMADA'
    const allowed = [
      "COMPLETADA",
      "CANCELADA",
      "NO_ASISTIO",
      "EN_PROGRESO",
      "CONFIRMADA",
    ];
    if (!allowed.includes(String(estado)))
      return res
        .status(400)
        .json({ success: false, message: "estado inválido" });

    const [upd] = await pool.execute(
      `UPDATE citas SET estado=?, updatedAt=NOW(3) WHERE id=? AND institucionId=?`,
      [String(estado), id, String(instId)]
    );
    if (upd.affectedRows === 0)
      return res
        .status(409)
        .json({ success: false, message: "No se pudo cambiar el estado" });
    res.json({ success: true });
  }
);

/* ----------------- Student Appointment Routes ----------------- */

// Obtener citas del estudiante actual
router.get("/mis-citas", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { estado, fechaDesde, fechaHasta, limit = 50, offset = 0 } = req.query;

    let whereClause = "WHERE c.usuarioId = ?";
    let queryParams = [String(req.user.id)];

    if (estado) {
      whereClause += " AND c.estado = ?";
      queryParams.push(estado);
    }

    if (fechaDesde) {
      whereClause += " AND c.fechaHora >= ?";
      queryParams.push(fechaDesde);
    }

    if (fechaHasta) {
      whereClause += " AND c.fechaHora <= ?";
      queryParams.push(fechaHasta);
    }

    const [citas] = await pool.execute(
      `SELECT c.*,
              CONCAT(p.nombre, ' ', p.apellidoPaterno, ' ', COALESCE(p.apellidoMaterno, '')) as psicologoNombre,
              p.especialidades
       FROM citas c
       LEFT JOIN usuarios p ON c.psicologoId = p.id
       ${whereClause}
       ORDER BY c.fechaHora DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Contar total para paginación
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas c ${whereClause}`,
      queryParams
    );

    res.json({
      success: true,
      data: {
        citas,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error obteniendo citas del estudiante:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Cancelar cita
router.patch("/:id/cancelar", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;
    const { motivo } = req.body;

    // Verificar que la cita existe y el usuario tiene permisos
    const [citaRows] = await pool.execute(
      `SELECT * FROM citas WHERE id = ? AND (usuarioId = ? OR psicologoId = ?)`,
      [id, String(req.user.id), String(req.user.id)]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      });
    }

    const cita = citaRows[0];

    // No se puede cancelar una cita que ya está completada
    if (["COMPLETADA", "CANCELADA"].includes(cita.estado)) {
      return res.status(400).json({
        success: false,
        message: "No se puede cancelar una cita que ya está completada o cancelada",
      });
    }

    const [result] = await pool.execute(
      `UPDATE citas SET estado = 'CANCELADA', notas = ?, updatedAt = NOW(3) WHERE id = ?`,
      [motivo || "Cancelada por el usuario", id]
    );

    res.json({
      success: true,
      message: "Cita cancelada exitosamente",
    });
  } catch (error) {
    console.error("Error cancelando cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

/* ----------------- Psicólogos disponibles para estudiantes ----------------- */

// Obtener psicólogos disponibles para estudiantes
router.get("/psicologos", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const [psychologists] = await pool.execute(
      `SELECT DISTINCT u.id, u.nombre, u.apellidoPaterno, u.apellidoMaterno,
              CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', COALESCE(u.apellidoMaterno, '')) as nombreCompleto,
              u.cedulaProfesional, u.especialidades,
              COUNT(dp.id) as horariosDisponibles
       FROM usuarios u
       INNER JOIN usuario_institucion ui ON u.id = ui.usuarioId
       LEFT JOIN disponibilidad_psicologo dp ON u.id = dp.psicologoId AND dp.activo = 1
       WHERE ui.institucionId = ?
         AND ui.activo = 1
         AND ui.rolInstitucion IN ('PSICOLOGO', 'ORIENTADOR')
         AND u.status = 'ACTIVO'
       GROUP BY u.id, u.nombre, u.apellidoPaterno, u.apellidoMaterno, u.nombreCompleto, u.cedulaProfesional, u.especialidades
       ORDER BY u.nombre, u.apellidoPaterno`,
      [String(instId)]
    );

    res.json({ success: true, data: psychologists });
  } catch (error) {
    console.error("Error getting psychologists:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Alias para compatibilidad con frontend
router.get("/psicologos/disponibles", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const [psychologists] = await pool.execute(
      `SELECT DISTINCT u.id, u.nombre, u.apellidoPaterno, u.apellidoMaterno,
              CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', COALESCE(u.apellidoMaterno, '')) as nombreCompleto,
              u.cedulaProfesional, u.especialidades,
              COUNT(dp.id) as horariosDisponibles
       FROM usuarios u
       INNER JOIN usuario_institucion ui ON u.id = ui.usuarioId
       LEFT JOIN disponibilidad_psicologo dp ON u.id = dp.psicologoId AND dp.activo = 1
       WHERE ui.institucionId = ?
         AND ui.activo = 1
         AND ui.rolInstitucion IN ('PSICOLOGO', 'ORIENTADOR')
         AND u.status = 'ACTIVO'
       GROUP BY u.id, u.nombre, u.apellidoPaterno, u.apellidoMaterno, u.nombreCompleto, u.cedulaProfesional, u.especialidades
       ORDER BY u.nombre, u.apellidoPaterno`,
      [String(instId)]
    );

    res.json({ success: true, data: psychologists });
  } catch (error) {
    console.error("Error getting psychologists:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Obtener disponibilidad de un psicólogo por fecha
router.get("/disponibilidad/:psicologoId", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { psicologoId } = req.params;
    const { fecha, duracion = 60 } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: "Fecha requerida"
      });
    }

    const fechaObj = new Date(fecha);
    const diaSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][fechaObj.getDay()];

    // Obtener horarios configurados para ese día
    const [disponibilidad] = await pool.execute(
      `SELECT horaInicio, horaFin FROM disponibilidad_psicologo
       WHERE psicologoId = ? AND diaSemana = ? AND activo = 1`,
      [psicologoId, diaSemana]
    );

    if (!disponibilidad.length) {
      return res.json({ success: true, data: [] });
    }

    // Obtener descansos para ese día
    const [descansos] = await pool.execute(
      `SELECT horaInicio, horaFin, tipo FROM descansos_psicologo
       WHERE psicologoId = ? AND diaSemana = ? AND activo = 1
       ORDER BY horaInicio`,
      [psicologoId, diaSemana]
    );

    // Obtener citas ya programadas para esa fecha
    const [citasOcupadas] = await pool.execute(
      `SELECT TIME(fechaHora) as hora, duracion FROM citas
       WHERE psicologoId = ?
         AND DATE(fechaHora) = ?
         AND estado IN ('PROGRAMADA', 'CONFIRMADA', 'EN_PROGRESO', 'SOLICITADA')
       ORDER BY fechaHora`,
      [psicologoId, fecha]
    );

    // Generar slots disponibles
    const slotsDisponibles = [];
    const duracionSlot = parseInt(duracion) || 60; // usar la duración solicitada

    for (const horario of disponibilidad) {
      const [horaInicioHour, horaInicioMin] = horario.horaInicio.split(':').map(Number);
      const [horaFinHour, horaFinMin] = horario.horaFin.split(':').map(Number);

      const inicioMinutos = horaInicioHour * 60 + horaInicioMin;
      const finMinutos = horaFinHour * 60 + horaFinMin;

      for (let minutos = inicioMinutos; minutos < finMinutos; minutos += duracionSlot) {
        const hora = Math.floor(minutos / 60);
        const min = minutos % 60;
        const horaStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const slotFin = minutos + duracionSlot;

        // Verificar si el slot está ocupado por una cita
        const estaOcupadoPorCita = citasOcupadas.some(cita => {
          const citaHora = cita.hora;
          const citaMinutos = parseInt(citaHora.split(':')[0]) * 60 + parseInt(citaHora.split(':')[1]);
          const citaFin = citaMinutos + (cita.duracion || 60);

          // Verificar si hay solapamiento
          return (minutos < citaFin && slotFin > citaMinutos);
        });

        // Verificar si el slot está ocupado por un descanso
        const estaOcupadoPorDescanso = descansos.some(descanso => {
          const [descansoInicioHour, descansoInicioMin] = descanso.horaInicio.split(':').map(Number);
          const [descansoFinHour, descansoFinMin] = descanso.horaFin.split(':').map(Number);

          const descansoInicio = descansoInicioHour * 60 + descansoInicioMin;
          const descansoFin = descansoFinHour * 60 + descansoFinMin;

          // Verificar si hay solapamiento con el descanso
          return (minutos < descansoFin && slotFin > descansoInicio);
        });

        if (!estaOcupadoPorCita && !estaOcupadoPorDescanso) {
          slotsDisponibles.push(horaStr);
        }
      }
    }

    res.json({
      success: true,
      data: slotsDisponibles,
      debug: {
        disponibilidad: disponibilidad.length,
        descansos: descansos.length,
        citasOcupadas: citasOcupadas.length,
        slotsGenerados: slotsDisponibles.length
      }
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

/* ----------------- Disponibilidad ----------------- */

// Obtener disponibilidad del psicólogo actual
router.get(
  "/disponibilidad",
  authenticateToken,
  async (req, res) => {
    try {
      // Verificar que el usuario tenga rol de psicólogo en alguna institución
      const userRoles = req.user.instituciones?.map(inst => inst.rol) || [];
      if (!userRoles.includes('PSICOLOGO') && !userRoles.includes('ORIENTADOR')) {
        return res.status(403).json({
          success: false,
          message: "Solo psicólogos y orientadores pueden gestionar disponibilidad"
        });
      }

      const psicologoId = req.user.id;

      const [disponibilidad] = await pool.execute(
        `SELECT * FROM disponibilidad_psicologo
         WHERE psicologoId = ? AND activo = 1
         ORDER BY FIELD(diaSemana, 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'), horaInicio`,
        [psicologoId]
      );

      res.json({
        success: true,
        data: disponibilidad,
      });
    } catch (error) {
      console.error("Error obteniendo disponibilidad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// Actualizar disponibilidad del psicólogo
router.put(
  "/disponibilidad",
  authenticateToken,
  async (req, res) => {
    try {
      // Verificar que el usuario tenga rol de psicólogo en alguna institución
      const userRoles = req.user.instituciones?.map(inst => inst.rol) || [];
      if (!userRoles.includes('PSICOLOGO') && !userRoles.includes('ORIENTADOR')) {
        return res.status(403).json({
          success: false,
          message: "Solo psicólogos y orientadores pueden gestionar disponibilidad"
        });
      }

      const psicologoId = req.user.id;
      const { horarios = {}, configuracion = {} } = req.body;

      console.log('🔥 [DISPONIBILIDAD] Actualizando para psicólogo:', psicologoId);
      console.log('📅 [DISPONIBILIDAD] Horarios recibidos:', JSON.stringify(horarios, null, 2));
      console.log('⚙️ [DISPONIBILIDAD] Configuración recibida:', JSON.stringify(configuracion, null, 2));

      // Convertir horarios del frontend al formato que esperamos
      const disponibilidad = [];
      for (const [diaSemana, horario] of Object.entries(horarios)) {
        // Verificar que horario no sea null/undefined y tenga las propiedades necesarias
        if (horario && horario.activo && horario.horaInicio && horario.horaFin) {
          disponibilidad.push({
            diaSemana,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            activo: true
          });
        }
      }

      console.log('🔄 [DISPONIBILIDAD] Disponibilidad convertida:', JSON.stringify(disponibilidad, null, 2));

      // Iniciar transacción
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Primero, desactivar toda la disponibilidad existente
        await conn.execute(
          `UPDATE disponibilidad_psicologo SET activo = 0 WHERE psicologoId = ?`,
          [psicologoId]
        );

        console.log('✅ [DISPONIBILIDAD] Disponibilidad anterior desactivada');

        // Procesar nueva disponibilidad
        for (const item of disponibilidad) {
          const { diaSemana, horaInicio, horaFin, activo = true } = item;

          if (!diaSemana || !horaInicio || !horaFin) {
            console.log('⚠️ [DISPONIBILIDAD] Saltando item incompleto:', item);
            continue;
          }

          // Verificar si ya existe un registro para este psicólogo y día
          const [existingRecord] = await conn.execute(
            `SELECT id FROM disponibilidad_psicologo
             WHERE psicologoId = ? AND diaSemana = ?`,
            [psicologoId, diaSemana]
          );

          if (existingRecord.length > 0) {
            // Actualizar registro existente
            await conn.execute(
              `UPDATE disponibilidad_psicologo
               SET horaInicio = ?, horaFin = ?, activo = ?
               WHERE psicologoId = ? AND diaSemana = ?`,
              [horaInicio, horaFin, activo ? 1 : 0, psicologoId, diaSemana]
            );
            console.log('🔄 [DISPONIBILIDAD] Actualizado:', { diaSemana, horaInicio, horaFin, activo });
          } else {
            // Insertar nuevo registro
            await conn.execute(
              `INSERT INTO disponibilidad_psicologo (psicologoId, diaSemana, horaInicio, horaFin, activo)
               VALUES (?, ?, ?, ?, ?)`,
              [psicologoId, diaSemana, horaInicio, horaFin, activo ? 1 : 0]
            );
            console.log('➕ [DISPONIBILIDAD] Insertado:', { diaSemana, horaInicio, horaFin, activo });
          }
        }

        await conn.commit();
        console.log('✅ [DISPONIBILIDAD] Transacción completada exitosamente');

        res.json({
          success: true,
          message: "Disponibilidad actualizada exitosamente",
        });

      } catch (error) {
        await conn.rollback();
        console.error("❌ [DISPONIBILIDAD] Error en transacción:", error);
        throw error;
      } finally {
        conn.release();
      }

    } catch (error) {
      console.error("❌ [DISPONIBILIDAD] Error actualizando disponibilidad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor: " + error.message,
      });
    }
  }
);

/* ----------------- Break Management Routes ----------------- */

// Get psychologist's breaks
router.get(
  "/descansos",
  authenticateToken,
  async (req, res) => {
    try {
      // Verificar que el usuario tenga rol de psicólogo en alguna institución
      const userRoles = req.user.instituciones?.map(inst => inst.rol) || [];
      if (!userRoles.includes('PSICOLOGO') && !userRoles.includes('ORIENTADOR')) {
        return res.status(403).json({
          success: false,
          message: "Solo psicólogos y orientadores pueden gestionar descansos"
        });
      }

      const psicologoId = req.user.id;

      const [descansos] = await pool.execute(
        `SELECT * FROM descansos_psicologo
         WHERE psicologoId = ? AND activo = 1
         ORDER BY FIELD(diaSemana, 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'), horaInicio`,
        [psicologoId]
      );

      res.json({
        success: true,
        data: descansos,
      });
    } catch (error) {
      console.error("Error obteniendo descansos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// Add or update psychologist's breaks
router.put(
  "/descansos",
  authenticateToken,
  async (req, res) => {
    try {
      // Verificar que el usuario tenga rol de psicólogo en alguna institución
      const userRoles = req.user.instituciones?.map(inst => inst.rol) || [];
      if (!userRoles.includes('PSICOLOGO') && !userRoles.includes('ORIENTADOR')) {
        return res.status(403).json({
          success: false,
          message: "Solo psicólogos y orientadores pueden gestionar descansos"
        });
      }

      const psicologoId = req.user.id;
      const { descansos = [] } = req.body;

      console.log('🔥 [DESCANSOS] Actualizando para psicólogo:', psicologoId);
      console.log('📅 [DESCANSOS] Descansos recibidos:', JSON.stringify(descansos, null, 2));

      // Iniciar transacción
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Primero, desactivar todos los descansos existentes
        await conn.execute(
          `UPDATE descansos_psicologo SET activo = 0 WHERE psicologoId = ?`,
          [psicologoId]
        );

        console.log('✅ [DESCANSOS] Descansos anteriores desactivados');

        // Procesar nuevos descansos
        for (const descanso of descansos) {
          const { diaSemana, horaInicio, horaFin, tipo = 'DESCANSO', descripcion = null } = descanso;

          if (!diaSemana || !horaInicio || !horaFin) {
            console.log('⚠️ [DESCANSOS] Saltando descanso incompleto:', descanso);
            continue;
          }

          // Verificar si ya existe un registro para este psicólogo, día y horario (incluyendo inactivos)
          const [existingRecord] = await conn.execute(
            `SELECT id, activo FROM descansos_psicologo
             WHERE psicologoId = ? AND diaSemana = ? AND horaInicio = ? AND horaFin = ?
             ORDER BY activo DESC, updatedAt DESC LIMIT 1`,
            [psicologoId, diaSemana, horaInicio, horaFin]
          );

          if (existingRecord.length > 0) {
            // Reactivar y actualizar registro existente
            await conn.execute(
              `UPDATE descansos_psicologo
               SET activo = 1, tipo = ?, descripcion = ?, updatedAt = NOW(3)
               WHERE id = ?`,
              [tipo, descripcion, existingRecord[0].id]
            );
            console.log('🔄 [DESCANSOS] Reactivado:', { diaSemana, horaInicio, horaFin, tipo });
          } else {
            // Insertar nuevo registro
            await conn.execute(
              `INSERT INTO descansos_psicologo (psicologoId, diaSemana, horaInicio, horaFin, tipo, descripcion, activo)
               VALUES (?, ?, ?, ?, ?, ?, 1)`,
              [psicologoId, diaSemana, horaInicio, horaFin, tipo, descripcion]
            );
            console.log('➕ [DESCANSOS] Insertado:', { diaSemana, horaInicio, horaFin, tipo });
          }
        }

        await conn.commit();
        console.log('✅ [DESCANSOS] Transacción completada exitosamente');

        res.json({
          success: true,
          message: "Descansos actualizados exitosamente",
        });

      } catch (error) {
        await conn.rollback();
        console.error("❌ [DESCANSOS] Error en transacción:", error);
        throw error;
      } finally {
        conn.release();
      }

    } catch (error) {
      console.error("❌ [DESCANSOS] Error actualizando descansos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor: " + error.message,
      });
    }
  }
);

// Delete a specific break
router.delete(
  "/descansos/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const userRoles = req.user.instituciones?.map(inst => inst.rol) || [];
      if (!userRoles.includes('PSICOLOGO') && !userRoles.includes('ORIENTADOR')) {
        return res.status(403).json({
          success: false,
          message: "Solo psicólogos y orientadores pueden gestionar descansos"
        });
      }

      const psicologoId = req.user.id;
      const { id } = req.params;

      const [result] = await pool.execute(
        `UPDATE descansos_psicologo SET activo = 0, updatedAt = NOW(3)
         WHERE id = ? AND psicologoId = ?`,
        [id, psicologoId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Descanso no encontrado"
        });
      }

      res.json({
        success: true,
        message: "Descanso eliminado exitosamente"
      });
    } catch (error) {
      console.error("Error eliminando descanso:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

/* ----------------- Appointment Detail Routes ----------------- */

// Obtener detalle de una cita específica
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;

    // Verificar que el usuario tiene acceso a esta cita
    const [citaRows] = await pool.execute(
      `SELECT c.*,
              u.nombreCompleto as estudianteNombre, u.matricula, u.telefono as estudianteTelefono, u.email as estudianteEmail,
              u.nombre as estudianteNombreCorto, u.apellidoPaterno as estudianteApellidoPaterno,
              p.nombreCompleto as psicologoNombre, p.especialidades, p.telefono as psicologoTelefono, p.email as psicologoEmail,
              p.nombre as psicologoNombreCorto, p.apellidoPaterno as psicologoApellidoPaterno, p.cedulaProfesional
       FROM citas c
       LEFT JOIN usuarios u ON c.usuarioId = u.id
       LEFT JOIN usuarios p ON c.psicologoId = p.id
       WHERE c.id = ? AND (c.usuarioId = ? OR c.psicologoId = ?)`,
      [id, String(req.user.id), String(req.user.id)]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      });
    }

    const cita = citaRows[0];

    // Estructurar los datos como espera el frontend
    const response = {
      ...cita,
      estudiante: cita.usuarioId ? {
        id: cita.usuarioId,
        nombreCompleto: cita.estudianteNombre,
        nombre: cita.estudianteNombreCorto,
        apellidoPaterno: cita.estudianteApellidoPaterno,
        matricula: cita.matricula,
        telefono: cita.estudianteTelefono,
        email: cita.estudianteEmail
      } : null,
      psicologo: cita.psicologoId ? {
        id: cita.psicologoId,
        nombreCompleto: cita.psicologoNombre,
        nombre: cita.psicologoNombreCorto,
        apellidoPaterno: cita.psicologoApellidoPaterno,
        especialidades: cita.especialidades,
        telefono: cita.psicologoTelefono,
        email: cita.psicologoEmail,
        cedulaProfesional: cita.cedulaProfesional
      } : null
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error obteniendo detalle de cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Actualizar cita (PUT)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;
    const { fechaHora, duracion, modalidad, ubicacion, motivo, notas } = req.body;

    // Verificar que la cita existe y el usuario tiene permisos para editarla
    const [citaRows] = await pool.execute(
      `SELECT * FROM citas WHERE id = ? AND psicologoId = ?`,
      [id, String(req.user.id)]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o sin permisos para editarla",
      });
    }

    const cita = citaRows[0];

    // Solo se pueden editar citas en ciertos estados
    if (!["SOLICITADA", "CONFIRMADA"].includes(cita.estado)) {
      return res.status(400).json({
        success: false,
        message: "No se puede editar una cita en este estado",
      });
    }

    // Verificar si hay conflictos de horario (si se cambia la fecha/hora)
    if (fechaHora && fechaHora !== cita.fechaHora) {
      if (await hasOverlap(cita.psicologoId, fechaHora, duracion || cita.duracion, id)) {
        return res.status(409).json({
          success: false,
          message: "Conflicto de horario con otra cita",
        });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (fechaHora) {
      updateFields.push("fechaHora = ?");
      updateValues.push(new Date(fechaHora));
    }
    if (duracion) {
      updateFields.push("duracion = ?");
      updateValues.push(parseInt(duracion));
    }
    if (modalidad) {
      updateFields.push("modalidad = ?");
      updateValues.push(modalidad);
    }
    if (ubicacion !== undefined) {
      updateFields.push("ubicacion = ?");
      updateValues.push(ubicacion);
    }
    if (motivo) {
      updateFields.push("motivo = ?");
      updateValues.push(motivo);
    }
    if (notas !== undefined) {
      updateFields.push("notas = ?");
      updateValues.push(notas);
    }

    updateFields.push("updatedAt = NOW(3)");
    updateValues.push(id);

    await pool.execute(
      `UPDATE citas SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Obtener datos actualizados
    const [citaActualizada] = await pool.execute(
      `SELECT c.*,
              u.nombreCompleto as estudianteNombre,
              p.nombreCompleto as psicologoNombre
       FROM citas c
       LEFT JOIN usuarios u ON c.usuarioId = u.id
       LEFT JOIN usuarios p ON c.psicologoId = p.id
       WHERE c.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Cita actualizada exitosamente",
      data: citaActualizada[0],
    });
  } catch (error) {
    console.error("Error actualizando cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Agregar notas a una cita
router.post("/:id/notas", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;
    const { notas } = req.body;

    if (!notas || !notas.trim()) {
      return res.status(400).json({
        success: false,
        message: "Las notas no pueden estar vacías",
      });
    }

    // Verificar que la cita existe y el usuario es el psicólogo
    const [citaRows] = await pool.execute(
      `SELECT * FROM citas WHERE id = ? AND psicologoId = ?`,
      [id, String(req.user.id)]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o sin permisos",
      });
    }

    // Actualizar las notas del psicólogo
    await pool.execute(
      `UPDATE citas SET notasPsicologo = ?, updatedAt = NOW(3) WHERE id = ?`,
      [notas.trim(), id]
    );

    // Obtener datos actualizados
    const [citaActualizada] = await pool.execute(
      `SELECT c.*,
              u.nombreCompleto as estudianteNombre,
              p.nombreCompleto as psicologoNombre
       FROM citas c
       LEFT JOIN usuarios u ON c.usuarioId = u.id
       LEFT JOIN usuarios p ON c.psicologoId = p.id
       WHERE c.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Notas agregadas exitosamente",
      data: citaActualizada[0],
    });
  } catch (error) {
    console.error("Error agregando notas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Confirmar cita
router.patch("/:id/confirmar", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE citas SET estado = 'CONFIRMADA', updatedAt = NOW(3)
       WHERE id = ? AND psicologoId = ? AND estado = 'SOLICITADA'`,
      [id, String(req.user.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o no se puede confirmar",
      });
    }

    res.json({
      success: true,
      message: "Cita confirmada exitosamente",
    });
  } catch (error) {
    console.error("Error confirmando cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Rechazar cita
router.patch("/:id/rechazar", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE citas SET estado = 'CANCELADA', updatedAt = NOW(3)
       WHERE id = ? AND psicologoId = ? AND estado = 'SOLICITADA'`,
      [id, String(req.user.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o no se puede rechazar",
      });
    }

    res.json({
      success: true,
      message: "Cita rechazada exitosamente",
    });
  } catch (error) {
    console.error("Error rechazando cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Iniciar sesión
router.patch("/:id/iniciar", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE citas SET estado = 'EN_PROGRESO', horaInicioReal = NOW(3), updatedAt = NOW(3)
       WHERE id = ? AND psicologoId = ? AND estado = 'CONFIRMADA'`,
      [id, String(req.user.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o no se puede iniciar",
      });
    }

    res.json({
      success: true,
      message: "Sesión iniciada exitosamente",
    });
  } catch (error) {
    console.error("Error iniciando sesión:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Completar sesión
router.patch("/:id/completar", authenticateToken, async (req, res) => {
  try {
    const instId = await getActiveInstitutionId(req);
    if (!instId)
      return res.status(400).json({ success: false, message: "Sin institución" });

    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE citas SET estado = 'COMPLETADA', horaFinReal = NOW(3), updatedAt = NOW(3)
       WHERE id = ? AND psicologoId = ? AND estado = 'EN_PROGRESO'`,
      [id, String(req.user.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o no se puede completar",
      });
    }

    res.json({
      success: true,
      message: "Sesión completada exitosamente",
    });
  } catch (error) {
    console.error("Error completando sesión:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

/* ----------------- Admin Appointment Routes ----------------- */

// Obtener todas las citas para administradores
router.get("/admin",
  ...requireRolesWithInstitution([
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL"
  ]),
  async (req, res) => {
    try {
      const instId = req.institucionId;
      const {
        fechaInicio,
        fechaFin,
        estado,
        psicologoId,
        estudianteId,
        modalidad,
        page = 1,
        limit = 20
      } = req.query;

      let whereClause = "WHERE c.institucionId = ?";
      let queryParams = [String(instId)];

      if (fechaInicio) {
        whereClause += " AND c.fechaHora >= ?";
        queryParams.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += " AND c.fechaHora <= ?";
        queryParams.push(fechaFin);
      }

      if (estado) {
        whereClause += " AND c.estado = ?";
        queryParams.push(estado);
      }

      if (psicologoId) {
        whereClause += " AND c.psicologoId = ?";
        queryParams.push(psicologoId);
      }

      if (estudianteId) {
        whereClause += " AND (u.matricula LIKE ? OR u.nombreCompleto LIKE ?)";
        queryParams.push(`%${estudianteId}%`, `%${estudianteId}%`);
      }

      if (modalidad) {
        whereClause += " AND c.modalidad = ?";
        queryParams.push(modalidad);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Obtener citas con información completa
      const [appointments] = await pool.execute(
        `SELECT c.*,
                u.nombreCompleto as estudianteNombre, u.matricula, u.email as estudianteEmail,
                p.nombreCompleto as psicologoNombre, p.especialidades
         FROM citas c
         LEFT JOIN usuarios u ON c.usuarioId = u.id
         LEFT JOIN usuarios p ON c.psicologoId = p.id
         ${whereClause}
         ORDER BY c.fechaHora DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      // Estructurar datos para el frontend
      const formattedAppointments = appointments.map(apt => ({
        ...apt,
        estudiante: apt.usuarioId ? {
          id: apt.usuarioId,
          nombreCompleto: apt.estudianteNombre,
          matricula: apt.matricula,
          email: apt.estudianteEmail
        } : null,
        psicologo: apt.psicologoId ? {
          id: apt.psicologoId,
          nombreCompleto: apt.psicologoNombre,
          especialidades: apt.especialidades
        } : null
      }));

      // Contar total
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM citas c
         LEFT JOIN usuarios u ON c.usuarioId = u.id
         LEFT JOIN usuarios p ON c.psicologoId = p.id
         ${whereClause}`,
        queryParams
      );

      // Obtener estadísticas
      const [statsResult] = await pool.execute(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'SOLICITADA' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado = 'CONFIRMADA' THEN 1 ELSE 0 END) as confirmadas,
          SUM(CASE WHEN estado = 'COMPLETADA' THEN 1 ELSE 0 END) as completadas,
          SUM(CASE WHEN estado = 'CANCELADA' THEN 1 ELSE 0 END) as canceladas
         FROM citas c
         WHERE c.institucionId = ?`,
        [String(instId)]
      );

      const totalPages = Math.ceil(countResult[0].total / parseInt(limit));

      res.json({
        success: true,
        data: {
          appointments: formattedAppointments,
          stats: statsResult[0],
          totalPages,
          currentPage: parseInt(page),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error("Error obteniendo citas para admin:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// Acciones en lote para citas
router.patch("/bulk/:action",
  ...requireRolesWithInstitution([
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL"
  ]),
  async (req, res) => {
    try {
      const instId = req.institucionId;
      const { action } = req.params;
      const { appointmentIds } = req.body;

      if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Lista de citas inválida"
        });
      }

      let newStatus;
      switch (action) {
        case 'confirmar':
          newStatus = 'CONFIRMADA';
          break;
        case 'cancelar':
          newStatus = 'CANCELADA';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Acción no válida"
          });
      }

      const placeholders = appointmentIds.map(() => '?').join(',');
      const [result] = await pool.execute(
        `UPDATE citas SET estado = ?, updatedAt = NOW(3)
         WHERE id IN (${placeholders}) AND institucionId = ?`,
        [newStatus, ...appointmentIds, String(instId)]
      );

      res.json({
        success: true,
        message: `${result.affectedRows} cita(s) ${action === 'confirmar' ? 'confirmadas' : 'canceladas'} exitosamente`,
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error("Error en acción en lote:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// Exportar citas a Excel
router.get("/export",
  ...requireRolesWithInstitution([
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL"
  ]),
  async (req, res) => {
    try {
      const instId = req.institucionId;
      const {
        fechaInicio,
        fechaFin,
        estado,
        psicologoId,
        estudianteId,
        modalidad
      } = req.query;

      let whereClause = "WHERE c.institucionId = ?";
      let queryParams = [String(instId)];

      if (fechaInicio) {
        whereClause += " AND c.fechaHora >= ?";
        queryParams.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += " AND c.fechaHora <= ?";
        queryParams.push(fechaFin);
      }

      if (estado) {
        whereClause += " AND c.estado = ?";
        queryParams.push(estado);
      }

      if (psicologoId) {
        whereClause += " AND c.psicologoId = ?";
        queryParams.push(psicologoId);
      }

      if (estudianteId) {
        whereClause += " AND (u.matricula LIKE ? OR u.nombreCompleto LIKE ?)";
        queryParams.push(`%${estudianteId}%`, `%${estudianteId}%`);
      }

      if (modalidad) {
        whereClause += " AND c.modalidad = ?";
        queryParams.push(modalidad);
      }

      // Obtener datos para exportar
      const [appointments] = await pool.execute(
        `SELECT c.id, c.fechaHora, c.duracion, c.modalidad, c.estado, c.motivo, c.ubicacion,
                u.nombreCompleto as estudiante, u.matricula, u.email as estudianteEmail,
                p.nombreCompleto as psicologo, p.especialidades
         FROM citas c
         LEFT JOIN usuarios u ON c.usuarioId = u.id
         LEFT JOIN usuarios p ON c.psicologoId = p.id
         ${whereClause}
         ORDER BY c.fechaHora DESC`,
        queryParams
      );

      // Por ahora, devolver JSON. En una implementación completa usarías una librería como xlsx
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="citas_${new Date().toISOString().split('T')[0]}.json"`);

      res.json({
        success: true,
        data: appointments,
        exportDate: new Date().toISOString(),
        totalRecords: appointments.length
      });

    } catch (error) {
      console.error("Error exportando citas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);


module.exports = router;

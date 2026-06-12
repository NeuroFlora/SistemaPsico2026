// controllers/profile.controller.js
const { validationResult } = require("express-validator");
const { pool } = require("../db");

const ENV = process.env.NODE_ENV || "development";
const DB_NAME = process.env.MYSQL_DATABASE || "sistema_educativo";

const logSqlError = (err) => {
  if (ENV !== "production") {
    console.error("[SQL ERROR]", err?.sqlMessage || err?.message || err);
  }
};

const sendError = (res, status, code, message, err) => {
  if (err) logSqlError(err);
  return res.status(status).json({ success: false, code, message });
};

/** GET /api/profile/status */
const getStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, "UNAUTHORIZED", "No autorizado");

    const [rows] = await pool.execute(
      "SELECT perfilCompletado FROM usuarios WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!rows.length)
      return sendError(res, 404, "USER_NOT_FOUND", "Usuario no encontrado");

    return res.json({
      success: true,
      data: { perfilCompletado: !!rows[0].perfilCompletado },
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_STATUS_FAILED",
      "Error al obtener el estado del perfil",
      err
    );
  }
};

/** POST /api/profile/complete */
const complete = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, "VALIDATION_ERROR", "Datos inválidos", {
      message: JSON.stringify(errors.array()),
    });
  }

  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, "UNAUTHORIZED", "No autorizado");

    const { telefono, direccion, genero, fechaNacimiento } = req.body || {};

    // Evita completar dos veces
    const [prev] = await pool.execute(
      "SELECT perfilCompletado FROM usuarios WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!prev.length)
      return sendError(res, 404, "USER_NOT_FOUND", "Usuario no encontrado");
    if (prev[0].perfilCompletado === 1) {
      return sendError(
        res,
        409,
        "PROFILE_ALREADY_COMPLETED",
        "El perfil ya está completado"
      );
    }

    // Detectar qué columnas existen para no fallar si no están creadas
    const [colsRows] = await pool.execute(
      `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME   = 'usuarios'
          AND COLUMN_NAME IN ('telefono','direccion','genero','fechaNacimiento','updatedAt','perfilCompletado')`,
      [DB_NAME]
    );
    const columns = new Set(colsRows.map((r) => r.COLUMN_NAME));

    // Construir SET dinámico
    const sets = ["perfilCompletado = 1"];
    const params = [];

    if (columns.has("telefono") && typeof telefono !== "undefined") {
      sets.push("telefono = ?");
      params.push(String(telefono).trim());
    }
    if (columns.has("direccion") && typeof direccion !== "undefined") {
      sets.push("direccion = ?");
      params.push(String(direccion).trim());
    }
    if (columns.has("genero") && typeof genero !== "undefined") {
      sets.push("genero = ?");
      params.push(String(genero).trim());
    }
    if (
      columns.has("fechaNacimiento") &&
      typeof fechaNacimiento !== "undefined"
    ) {
      const d = new Date(fechaNacimiento);
      const ymd = Number.isNaN(d.getTime())
        ? String(fechaNacimiento).slice(0, 10)
        : d.toISOString().slice(0, 10);
      sets.push("fechaNacimiento = ?");
      params.push(ymd);
    }
    if (columns.has("updatedAt")) {
      sets.push("updatedAt = NOW()"); // Regla 4 usa NOW() en login; consistente aquí también
    }

    const sql = `UPDATE usuarios SET ${sets.join(", ")} WHERE id = ? LIMIT 1`;
    params.push(userId);

    const [result] = await pool.execute(sql, params);
    if (result.affectedRows === 0) {
      return sendError(res, 404, "USER_NOT_FOUND", "Usuario no encontrado");
    }

    return res.json({
      success: true,
      message: "Perfil completado",
      data: { perfilCompletado: 1 },
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "PROFILE_COMPLETE_FAILED",
      "Error al completar el perfil",
      err
    );
  }
};

module.exports = { getStatus, complete };

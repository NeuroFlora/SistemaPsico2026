// controllers/citas.controller.js
const { pool } = require("../db");
const { validationResult } = require("express-validator");

/**
 * Crear nueva solicitud de cita (para estudiantes)
 */
const solicitarCita = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const userRole = req.user?.instituciones?.[0]?.rol;
    const institucionId = req.user?.instituciones?.[0]?.institucionId;

    // Solo estudiantes pueden solicitar citas
    if (userRole !== "ESTUDIANTE") {
      return res.status(403).json({
        success: false,
        message: "Solo los estudiantes pueden solicitar citas",
        code: "UNAUTHORIZED_ROLE",
      });
    }

    const {
      psicologoId,
      fechaHora,
      duracion = 60,
      modalidad = "PRESENCIAL",
      motivo,
      ubicacion,
    } = req.body;

    await conn.beginTransaction();

    // Verificar que el psicólogo existe y está activo
    const [psicologoRows] = await conn.execute(
      `SELECT u.id, u.nombreCompleto, ui.rolInstitucion 
       FROM usuarios u
       JOIN usuario_institucion ui ON u.id = ui.usuarioId
       WHERE u.id = ? AND ui.institucionId = ? 
       AND ui.rolInstitucion = 'PSICOLOGO' AND ui.activo = 1`,
      [psicologoId, institucionId]
    );

    if (psicologoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Psicólogo no encontrado o no disponible",
        code: "PSYCHOLOGIST_NOT_FOUND",
      });
    }

    // Verificar disponibilidad en esa fecha/hora
    const fechaSolicitud = new Date(fechaHora);
    const diaSemana = [
      "DOMINGO",
      "LUNES",
      "MARTES",
      "MIERCOLES",
      "JUEVES",
      "VIERNES",
      "SABADO",
    ][fechaSolicitud.getDay()];
    const horaSolicitud = fechaSolicitud.toTimeString().slice(0, 5);

    const [disponibilidadRows] = await conn.execute(
      `SELECT * FROM disponibilidad_psicologo 
       WHERE psicologoId = ? AND diaSemana = ? 
       AND horaInicio <= ? AND horaFin >= ? 
       AND activo = 1`,
      [psicologoId, diaSemana, horaSolicitud, horaSolicitud]
    );

    if (disponibilidadRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El psicólogo no está disponible en esa fecha y hora",
        code: "UNAVAILABLE_TIME",
      });
    }

    // Verificar que no haya conflictos con otras citas
    const [conflictosRows] = await conn.execute(
      `SELECT id FROM citas 
       WHERE psicologoId = ? AND fechaHora = ? 
       AND estado NOT IN ('CANCELADA', 'NO_ASISTIO')`,
      [psicologoId, fechaHora]
    );

    if (conflictosRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una cita programada en ese horario",
        code: "TIME_CONFLICT",
      });
    }

    // Crear la cita
    const citaId = require("crypto").randomUUID();
    await conn.execute(
      `INSERT INTO citas 
       (id, usuarioId, psicologoId, fechaHora, duracion, modalidad, motivo, ubicacion, 
        estado, confirmadaPorPaciente, recordatorio, fechaCreacion, createdBy, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SOLICITADA', 1, 1, NOW(3), ?, NOW(3))`,
      [
        citaId,
        userId,
        psicologoId,
        fechaHora,
        duracion,
        modalidad,
        motivo,
        ubicacion,
        userId,
      ]
    );

    await conn.commit();

    // Obtener datos completos de la cita creada
    const [citaCreada] = await conn.execute(
      `SELECT c.*, u.nombreCompleto as estudianteNombre, p.nombreCompleto as psicologoNombre
       FROM citas c
       JOIN usuarios u ON c.usuarioId = u.id
       JOIN usuarios p ON c.psicologoId = p.id
       WHERE c.id = ?`,
      [citaId]
    );

    res.status(201).json({
      success: true,
      message: "Cita solicitada exitosamente",
      data: citaCreada[0],
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}

    console.error(
      "Error solicitando cita:",
      error?.sqlMessage || error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      code: "INTERNAL_ERROR",
    });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Obtener citas del estudiante
 */
const obtenerMisCitas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user?.instituciones?.[0]?.rol;

    if (userRole !== "ESTUDIANTE") {
      return res.status(403).json({
        success: false,
        message: "Solo los estudiantes pueden ver sus citas",
        code: "UNAUTHORIZED_ROLE",
      });
    }

    const {
      estado,
      fechaDesde,
      fechaHasta,
      limit = 50,
      offset = 0,
    } = req.query;

    let whereClause = "WHERE c.usuarioId = ?";
    let queryParams = [userId];

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
      `SELECT c.*, p.nombreCompleto as psicologoNombre, p.especialidades
       FROM citas c
       JOIN usuarios p ON c.psicologoId = p.id
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
};

/**
 * Obtener agenda del psicólogo
 */
const obtenerAgendaPsicologo = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user?.instituciones?.[0]?.rol;

    if (!["PSICOLOGO", "ORIENTADOR"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Solo los psicólogos y orientadores pueden ver la agenda",
        code: "UNAUTHORIZED_ROLE",
      });
    }

    const {
      fechaDesde,
      fechaHasta,
      estado,
      limit = 100,
      offset = 0,
    } = req.query;

    let whereClause = "WHERE c.psicologoId = ?";
    let queryParams = [userId];

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
      `SELECT c.*, u.nombreCompleto as estudianteNombre, u.matricula, u.semestre, u.carreraId
       FROM citas c
       JOIN usuarios u ON c.usuarioId = u.id
       ${whereClause}
       ORDER BY c.fechaHora ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

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
    console.error("Error obteniendo agenda del psicólogo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

/**
 * Actualizar estado de cita (para psicólogos)
 */
const actualizarEstadoCita = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const userRole = req.user?.instituciones?.[0]?.rol;
    const { citaId } = req.params;
    const { estado, notasPsicologo, horaInicioReal, horaFinReal } = req.body;

    if (!["PSICOLOGO", "ORIENTADOR"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Solo los psicólogos pueden actualizar el estado de las citas",
        code: "UNAUTHORIZED_ROLE",
      });
    }

    // Verificar que la cita existe y pertenece al psicólogo
    const [citaRows] = await conn.execute(
      `SELECT * FROM citas WHERE id = ? AND psicologoId = ?`,
      [citaId, userId]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
        code: "APPOINTMENT_NOT_FOUND",
      });
    }

    await conn.beginTransaction();

    let updateFields = ["estado = ?", "updatedAt = NOW(3)", "updatedBy = ?"];
    let updateValues = [estado, userId];

    if (notasPsicologo !== undefined) {
      updateFields.push("notasPsicologo = ?");
      updateValues.push(notasPsicologo);
    }

    if (horaInicioReal) {
      updateFields.push("horaInicioReal = ?");
      updateValues.push(horaInicioReal);
    }

    if (horaFinReal) {
      updateFields.push("horaFinReal = ?");
      updateValues.push(horaFinReal);
    }

    updateValues.push(citaId);

    await conn.execute(
      `UPDATE citas SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    await conn.commit();

    // Obtener datos actualizados
    const [citaActualizada] = await conn.execute(
      `SELECT c.*, u.nombreCompleto as estudianteNombre, p.nombreCompleto as psicologoNombre
       FROM citas c
       JOIN usuarios u ON c.usuarioId = u.id
       JOIN usuarios p ON c.psicologoId = p.id
       WHERE c.id = ?`,
      [citaId]
    );

    res.json({
      success: true,
      message: "Estado de cita actualizado exitosamente",
      data: citaActualizada[0],
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}

    console.error("Error actualizando estado de cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Cancelar cita
 */
const cancelarCita = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { citaId } = req.params;
    const { motivo } = req.body;

    // Verificar que la cita existe y el usuario tiene permisos
    const [citaRows] = await conn.execute(
      `SELECT * FROM citas WHERE id = ? AND (usuarioId = ? OR psicologoId = ?)`,
      [citaId, userId, userId]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
        code: "APPOINTMENT_NOT_FOUND",
      });
    }

    const cita = citaRows[0];

    // No se puede cancelar una cita que ya está completada
    if (["COMPLETADA", "CANCELADA"].includes(cita.estado)) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede cancelar una cita que ya está completada o cancelada",
        code: "INVALID_STATE",
      });
    }

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE citas SET estado = 'CANCELADA', notas = ?, updatedAt = NOW(3), updatedBy = ? WHERE id = ?`,
      [motivo || "Cancelada por el usuario", userId, citaId]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "Cita cancelada exitosamente",
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}

    console.error("Error cancelando cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Obtener disponibilidad de un psicólogo
 */
const obtenerDisponibilidad = async (req, res) => {
  try {
    const { psicologoId } = req.params;
    const { fechaDesde, fechaHasta } = req.query;

    // Obtener disponibilidad general del psicólogo
    const [disponibilidad] = await pool.execute(
      `SELECT * FROM disponibilidad_psicologo 
       WHERE psicologoId = ? AND activo = 1
       ORDER BY FIELD(diaSemana, 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'), horaInicio`,
      [psicologoId]
    );

    // Si se especifican fechas, obtener citas ocupadas en ese rango
    let citasOcupadas = [];
    if (fechaDesde && fechaHasta) {
      const [citas] = await pool.execute(
        `SELECT fechaHora, duracion FROM citas 
         WHERE psicologoId = ? AND fechaHora BETWEEN ? AND ?
         AND estado NOT IN ('CANCELADA', 'NO_ASISTIO')`,
        [psicologoId, fechaDesde, fechaHasta]
      );
      citasOcupadas = citas;
    }

    res.json({
      success: true,
      data: {
        disponibilidad,
        citasOcupadas,
      },
    });
  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

/**
 * Obtener psicólogos disponibles para una institución
 */
const obtenerPsicologosDisponibles = async (req, res) => {
  try {
    const institucionId = req.user?.instituciones?.[0]?.institucionId;

    if (!institucionId) {
      return res.status(400).json({
        success: false,
        message: "No se pudo determinar la institución del usuario",
      });
    }

    const [psicologos] = await pool.execute(
      `SELECT u.id, u.nombreCompleto, u.especialidades, u.telefono, u.email,
              COUNT(d.id) as horariosDisponibles
       FROM usuarios u
       JOIN usuario_institucion ui ON u.id = ui.usuarioId
       LEFT JOIN disponibilidad_psicologo d ON u.id = d.psicologoId AND d.activo = 1
       WHERE ui.institucionId = ? 
       AND ui.rolInstitucion = 'PSICOLOGO' 
       AND ui.activo = 1 
       AND u.status = 'ACTIVO'
       GROUP BY u.id, u.nombreCompleto, u.especialidades, u.telefono, u.email
       ORDER BY u.nombreCompleto`,
      [institucionId]
    );

    res.json({
      success: true,
      data: psicologos,
    });
  } catch (error) {
    console.error("Error obteniendo psicólogos disponibles:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

/**
 * Obtener detalle de una cita específica
 */
const obtenerDetalleCita = async (req, res) => {
  try {
    const userId = req.user.id;
    const { citaId } = req.params;

    // Verificar que el usuario tiene acceso a esta cita
    const [citaRows] = await pool.execute(
      `SELECT c.*, u.nombreCompleto as estudianteNombre, u.matricula, u.telefono as estudianteTelefono,
              p.nombreCompleto as psicologoNombre, p.especialidades, p.telefono as psicologoTelefono
       FROM citas c
       JOIN usuarios u ON c.usuarioId = u.id
       JOIN usuarios p ON c.psicologoId = p.id
       WHERE c.id = ? AND (c.usuarioId = ? OR c.psicologoId = ?)`,
      [citaId, userId, userId]
    );

    if (citaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
        code: "APPOINTMENT_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: citaRows[0],
    });
  } catch (error) {
    console.error("Error obteniendo detalle de cita:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

module.exports = {
  solicitarCita,
  obtenerMisCitas,
  obtenerAgendaPsicologo,
  actualizarEstadoCita,
  cancelarCita,
  obtenerDisponibilidad,
  obtenerPsicologosDisponibles,
  obtenerDetalleCita,
};

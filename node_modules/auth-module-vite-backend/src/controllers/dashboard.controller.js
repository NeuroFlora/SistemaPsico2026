// controllers/dashboard.controller.js
const { pool } = require("../db");

/**
 * Obtener estadísticas del dashboard para estudiantes
 */
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const institucionId = req.user?.instituciones?.[0]?.institucionId;

    const conn = await pool.getConnection();

    try {
      // Estadísticas del estudiante
      const [studentStats] = await conn.execute(
        `SELECT
           u.nombreCompleto,
           u.carrera,
           u.semestre,
           u.turno,
           COUNT(DISTINCT rq.id) as evaluaciones_completadas,
           AVG(rq.puntajeTotal) as promedio_puntaje,
           MAX(rq.fechaEnvio) as ultima_evaluacion
         FROM usuarios u
         LEFT JOIN respuestas_quiz rq ON u.id = rq.usuarioId AND rq.completado = 1
         WHERE u.id = ?
         GROUP BY u.id`,
        [userId]
      );

      // Próximas citas
      const [citasProximas] = await conn.execute(
        `SELECT COUNT(*) as proximas_citas
         FROM citas c
         WHERE c.usuarioId = ?
         AND c.fechaHora > NOW()
         AND c.estado IN ('SOLICITADA', 'CONFIRMADA', 'PROGRAMADA')`,
        [userId]
      );

      // Quizzes disponibles para hacer
      const [quizzesDisponibles] = await conn.execute(
        `SELECT COUNT(*) as quizzes_disponibles
         FROM quizzes q
         WHERE q.institucionId = ?
         AND q.activo = 1
         AND q.id NOT IN (
           SELECT DISTINCT quizId
           FROM respuestas_quiz
           WHERE usuarioId = ? AND completado = 1
         )`,
        [institucionId, userId]
      );

      // Información del psicólogo asignado
      const [psicologoInfo] = await conn.execute(
        `SELECT
           p.nombreCompleto as psicologo_nombre,
           p.email as psicologo_email
         FROM tutores_alumnos ta
         JOIN usuarios p ON ta.tutorId = p.id
         WHERE ta.alumnoId = ? AND ta.activo = 1`,
        [userId]
      );

      // Últimas evaluaciones con detalles
      const [ultimasEvaluaciones] = await conn.execute(
        `SELECT
           q.titulo,
           rq.puntajeTotal,
           rq.severidad,
           rq.fechaEnvio
         FROM respuestas_quiz rq
         JOIN quizzes q ON rq.quizId = q.id
         WHERE rq.usuarioId = ? AND rq.completado = 1
         ORDER BY rq.fechaEnvio DESC
         LIMIT 3`,
        [userId]
      );

      const stats = studentStats[0] || {};

      res.json({
        success: true,
        data: {
          estudiante: {
            nombre: stats.nombreCompleto,
            carrera: stats.carrera,
            semestre: stats.semestre,
            turno: stats.turno
          },
          estadisticas: {
            evaluaciones_completadas: parseInt(stats.evaluaciones_completadas) || 0,
            promedio_puntaje: stats.promedio_puntaje ? Math.round(stats.promedio_puntaje) : 0,
            proximas_citas: parseInt(citasProximas[0]?.proximas_citas) || 0,
            quizzes_disponibles: parseInt(quizzesDisponibles[0]?.quizzes_disponibles) || 0,
            ultima_evaluacion: stats.ultima_evaluacion
          },
          psicologo: psicologoInfo[0] || null,
          ultimas_evaluaciones: ultimasEvaluaciones || [],
          recomendaciones: [
            {
              titulo: "Técnicas de Relajación",
              descripcion: "Ejercicios para reducir el estrés académico",
              tipo: "recurso",
              color: "blue"
            },
            {
              titulo: "Gestión del Tiempo",
              descripcion: "Estrategias de organización para estudiantes",
              tipo: "recurso",
              color: "green"
            },
            {
              titulo: "Próxima Evaluación",
              descripcion: "Cuestionario de Bienestar Estudiantil disponible",
              tipo: "accion",
              color: "purple"
            }
          ]
        }
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('Error obteniendo dashboard de estudiante:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Obtener estadísticas del dashboard para psicólogos
 */
const getPsychologistDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const institucionId = req.user?.instituciones?.[0]?.institucionId;

    const conn = await pool.getConnection();

    try {
      // Estudiantes asignados
      const [estudiantesAsignados] = await conn.execute(
        `SELECT COUNT(*) as total_estudiantes
         FROM tutores_alumnos ta
         WHERE ta.tutorId = ? AND ta.activo = 1`,
        [userId]
      );

      // Citas próximas
      const [citasProximas] = await conn.execute(
        `SELECT COUNT(*) as proximas_citas
         FROM citas c
         WHERE c.psicologoId = ?
         AND c.fechaHora > NOW()
         AND c.estado IN ('SOLICITADA', 'CONFIRMADA', 'PROGRAMADA')`,
        [userId]
      );

      // Evaluaciones recientes de estudiantes asignados
      const [evaluacionesRecientes] = await conn.execute(
        `SELECT COUNT(*) as evaluaciones_recientes
         FROM respuestas_quiz rq
         JOIN tutores_alumnos ta ON rq.usuarioId = ta.alumnoId
         WHERE ta.tutorId = ?
         AND ta.activo = 1
         AND rq.fechaEnvio >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          estadisticas: {
            total_estudiantes: parseInt(estudiantesAsignados[0]?.total_estudiantes) || 0,
            proximas_citas: parseInt(citasProximas[0]?.proximas_citas) || 0,
            evaluaciones_recientes: parseInt(evaluacionesRecientes[0]?.evaluaciones_recientes) || 0
          }
        }
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('Error obteniendo dashboard de psicólogo:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
};

module.exports = {
  getStudentDashboard,
  getPsychologistDashboard
};
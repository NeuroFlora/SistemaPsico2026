// validators/citas.validators.js
const { body, param } = require("express-validator");

const citaValidation = [
  body("psicologoId")
    .notEmpty()
    .withMessage("El ID del psicólogo es requerido")
    .isUUID()
    .withMessage("El ID del psicólogo debe ser un UUID válido"),

  body("fechaHora")
    .notEmpty()
    .withMessage("La fecha y hora son requeridas")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601")
    .custom((value) => {
      const fecha = new Date(value);
      const ahora = new Date();

      if (fecha <= ahora) {
        throw new Error("La fecha de la cita debe ser futura");
      }

      // No permitir citas con más de 3 meses de anticipación
      const tresMesesAdelante = new Date();
      tresMesesAdelante.setMonth(tresMesesAdelante.getMonth() + 3);

      if (fecha > tresMesesAdelante) {
        throw new Error(
          "No se pueden agendar citas con más de 3 meses de anticipación"
        );
      }

      return true;
    }),

  body("duracion")
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage("La duración debe estar entre 15 y 180 minutos"),

  body("modalidad")
    .optional()
    .isIn(["PRESENCIAL", "VIRTUAL"])
    .withMessage("La modalidad debe ser PRESENCIAL o VIRTUAL"),

  body("motivo")
    .notEmpty()
    .withMessage("El motivo de la cita es requerido")
    .isLength({ min: 10, max: 1000 })
    .withMessage("El motivo debe tener entre 10 y 1000 caracteres"),

  body("ubicacion")
    .optional()
    .isLength({ max: 255 })
    .withMessage("La ubicación no puede exceder 255 caracteres"),
];

const estadoCitaValidation = [
  param("citaId")
    .isUUID()
    .withMessage("El ID de la cita debe ser un UUID válido"),

  body("estado")
    .notEmpty()
    .withMessage("El estado es requerido")
    .isIn([
      "SOLICITADA",
      "ASIGNADA",
      "PROGRAMADA",
      "CONFIRMADA",
      "EN_PROGRESO",
      "COMPLETADA",
      "CANCELADA",
      "NO_ASISTIO",
    ])
    .withMessage("Estado de cita inválido"),

  body("notasPsicologo")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Las notas del psicólogo no pueden exceder 2000 caracteres"),

  body("horaInicioReal")
    .optional()
    .isISO8601()
    .withMessage("La hora de inicio real debe estar en formato ISO 8601"),

  body("horaFinReal")
    .optional()
    .isISO8601()
    .withMessage("La hora de fin real debe estar en formato ISO 8601"),
];

const disponibilidadValidation = [
  body("diaSemana")
    .notEmpty()
    .withMessage("El día de la semana es requerido")
    .isIn([
      "LUNES",
      "MARTES",
      "MIERCOLES",
      "JUEVES",
      "VIERNES",
      "SABADO",
      "DOMINGO",
    ])
    .withMessage("Día de la semana inválido"),

  body("horaInicio")
    .notEmpty()
    .withMessage("La hora de inicio es requerida")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora de inicio debe estar en formato HH:MM"),

  body("horaFin")
    .notEmpty()
    .withMessage("La hora de fin es requerida")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora de fin debe estar en formato HH:MM")
    .custom((value, { req }) => {
      if (req.body.horaInicio && value <= req.body.horaInicio) {
        throw new Error(
          "La hora de fin debe ser posterior a la hora de inicio"
        );
      }
      return true;
    }),

  body("modalidadesPermitidas")
    .optional()
    .isArray()
    .withMessage("Las modalidades permitidas deben ser un arreglo")
    .custom((value) => {
      const modalidadesValidas = ["PRESENCIAL", "VIRTUAL"];
      if (!value.every((modalidad) => modalidadesValidas.includes(modalidad))) {
        throw new Error(
          "Modalidades inválidas. Solo se permiten PRESENCIAL y VIRTUAL"
        );
      }
      return true;
    }),

  body("ubicacion")
    .optional()
    .isLength({ max: 255 })
    .withMessage("La ubicación no puede exceder 255 caracteres"),

  body("notas")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Las notas no pueden exceder 500 caracteres"),
];

module.exports = {
  citaValidation,
  estadoCitaValidation,
  disponibilidadValidation,
};

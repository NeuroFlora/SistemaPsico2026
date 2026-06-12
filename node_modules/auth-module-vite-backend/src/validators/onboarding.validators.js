// validators/onboarding.validators.js
const { body } = require("express-validator");

// Middleware de validación dinámica por rol
const createProfileValidation = (userRole) => {
  const validations = [];

  // Campos básicos - obligatorios solo para estudiantes
  const isStudent = userRole === 'ESTUDIANTE';

  validations.push(
    body("telefono")
      .if(() => isStudent).notEmpty().withMessage("El teléfono es obligatorio para estudiantes")
      .if(() => !isStudent).optional()
      .isString()
      .isLength({ min: 10, max: 15 })
      .withMessage("El teléfono debe tener entre 10 y 15 caracteres")
  );

  validations.push(
    body("fechaNacimiento")
      .if(() => isStudent).notEmpty().withMessage("La fecha de nacimiento es obligatoria para estudiantes")
      .if(() => !isStudent).optional()
      .isISO8601()
      .withMessage("La fecha de nacimiento debe ser válida")
  );

  validations.push(
    body("genero")
      .if(() => isStudent).notEmpty().withMessage("El género es obligatorio para estudiantes")
      .if(() => !isStudent).optional()
      .isIn(["MASCULINO", "FEMENINO", "NO_BINARIO", "PREFIERO_NO_DECIR"])
      .withMessage("Género inválido")
  );

  validations.push(
    body("ciudad")
      .if(() => isStudent).notEmpty().withMessage("La ciudad es obligatoria para estudiantes")
      .if(() => !isStudent).optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("La ciudad debe ser texto de máximo 100 caracteres")
  );

  validations.push(
    body("estado")
      .if(() => isStudent).notEmpty().withMessage("El estado es obligatorio para estudiantes")
      .if(() => !isStudent).optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("El estado debe ser texto de máximo 100 caracteres")
  );

  // Campos específicos para estudiantes
  if (isStudent) {
    validations.push(
      body("semestre")
        .notEmpty()
        .withMessage("El semestre es obligatorio")
        .isInt({ min: 1, max: 12 })
        .withMessage("El semestre debe ser un número entre 1 y 12")
    );

    validations.push(
      body("grupo")
        .optional()
        .isString()
        .isLength({ max: 10 })
        .withMessage("El grupo debe ser texto de máximo 10 caracteres")
    );

    validations.push(
      body("turno")
        .notEmpty()
        .withMessage("El turno es obligatorio")
        .isIn(["MATUTINO", "VESPERTINO", "NOCTURNO", "MIXTO"])
        .withMessage("Turno inválido")
    );

    validations.push(
      body("carrera")
        .notEmpty()
        .withMessage("La carrera es obligatoria")
        .isString()
        .isLength({ max: 100 })
        .withMessage("La carrera debe ser texto de máximo 100 caracteres")
    );
  }

  // Campos para psicólogos (opcionales)
  if (userRole === 'PSICOLOGO') {
    validations.push(
      body("numeroEmpleado")
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage("El número de empleado debe ser texto de máximo 50 caracteres")
    );

    validations.push(
      body("cedulaProfesional")
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage("La cédula profesional debe ser texto de máximo 50 caracteres")
    );

    validations.push(
      body("departamento")
        .optional()
        .isString()
        .isLength({ max: 100 })
        .withMessage("El departamento debe ser texto de máximo 100 caracteres")
    );

    validations.push(
      body("telefonoEmergencia")
        .optional()
        .isString()
        .isLength({ max: 20 })
        .withMessage("El teléfono de emergencia debe ser texto de máximo 20 caracteres")
    );
  }

  // Campos para orientadores y admins (opcionales)
  if (['ORIENTADOR', 'ADMIN_INSTITUCION'].includes(userRole)) {
    validations.push(
      body("departamento")
        .optional()
        .isString()
        .isLength({ max: 100 })
        .withMessage("El departamento debe ser texto de máximo 100 caracteres")
    );

    validations.push(
      body("telefonoEmergencia")
        .optional()
        .isString()
        .isLength({ max: 20 })
        .withMessage("El teléfono de emergencia debe ser texto de máximo 20 caracteres")
    );
  }

  // Términos y condiciones (obligatorio para todos)
  validations.push(
    body("aceptaTerminos")
      .notEmpty()
      .withMessage("Debes aceptar los términos y condiciones")
      .isBoolean()
      .withMessage("Términos y condiciones debe ser verdadero o falso")
      .custom((value) => {
        if (!value) {
          throw new Error("Debes aceptar los términos y condiciones para continuar");
        }
        return true;
      })
  );

  return validations;
};

// Validaciones obsoletas - ahora se usan validaciones dinámicas
const profileValidation = [];

const onboardingValidation = [
  body("objetivos")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Los objetivos deben ser texto de máximo 1000 caracteres"),

  body("experienciaPrevia")
    .optional()
    .isIn(["nunca", "poco", "moderada", "mucha"])
    .withMessage(
      "La experiencia previa debe ser: nunca, poco, moderada o mucha"
    ),

  body("expectativas")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Las expectativas deben ser texto de máximo 500 caracteres"),

  body("notificaciones")
    .optional()
    .isBoolean()
    .withMessage("Las notificaciones deben ser verdadero o falso"),

  body("tutorialesAdicionales")
    .optional()
    .isBoolean()
    .withMessage("Los tutoriales adicionales deben ser verdadero o falso"),
];

module.exports = {
  createProfileValidation,
  profileValidation, // Mantenido por compatibilidad
  onboardingValidation,
};

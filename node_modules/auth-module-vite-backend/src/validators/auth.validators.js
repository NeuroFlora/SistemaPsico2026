const { body, param } = require("express-validator");

const allowedRoles = [
  "ESTUDIANTE",
  "PSICOLOGO",
  "ORIENTADOR",
  "ADMIN_INSTITUCION",
  "SUPER_ADMIN_NACIONAL",
];

const loginValidation = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("Password requerido"),
  // institucionId opcional (si hay multi-institución con mismo email)
];

const institutionParamValidation = [
  param("institucionId").notEmpty().withMessage("institucionId requerido"),
];

const registerValidation = [
  body("nombre").trim().notEmpty().withMessage("nombre es requerido"),
  body("apellidoPaterno")
    .trim()
    .notEmpty()
    .withMessage("apellidoPaterno es requerido"),
  body("email").isEmail().withMessage("email inválido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("password mínimo 8 caracteres"),
  body("rol").isIn(allowedRoles).withMessage("rol inválido"),
  body("institucionId").notEmpty().withMessage("institucionId es requerido"),
];

module.exports = {
  loginValidation,
  institutionParamValidation,
  registerValidation,
};

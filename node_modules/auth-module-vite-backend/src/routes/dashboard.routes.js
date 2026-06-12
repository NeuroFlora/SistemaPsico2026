// routes/dashboard.routes.js
const express = require("express");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { getStudentDashboard, getPsychologistDashboard } = require("../controllers/dashboard.controller");

const router = express.Router();

// Rutas protegidas - requieren autenticación
router.use(authenticateToken);

// GET /api/dashboard/student - Dashboard para estudiantes
router.get("/student", getStudentDashboard);

// GET /api/dashboard/psychologist - Dashboard para psicólogos
router.get("/psychologist", getPsychologistDashboard);

module.exports = router;
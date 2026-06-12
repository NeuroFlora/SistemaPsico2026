// routes/onboarding.routes.js
const express = require("express");
const {
  completeProfile,
  completeOnboarding,
  getProfileData,
  resetOnboarding,
  testUpdatePerfil,
} = require("../controllers/onboarding.controller");

const { authenticateToken } = require("../middlewares/auth.middleware");
const { profileValidation } = require("../validators/onboarding.validators");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/onboarding/complete-profile - Completar perfil con datos reales
router.post("/complete-profile", profileValidation, completeProfile);

// POST /api/onboarding/complete - Completar onboarding simple (sin datos)
router.post("/complete", completeOnboarding);

// GET /api/onboarding/profile - Obtener datos del perfil del usuario
router.get("/profile", getProfileData);

// POST /api/onboarding/reset - Reiniciar onboarding (para testing)
router.post("/reset", resetOnboarding);

// POST /api/onboarding/test-update - Test directo para actualizar perfilCompletado
router.post("/test-update", testUpdatePerfil);

module.exports = router;

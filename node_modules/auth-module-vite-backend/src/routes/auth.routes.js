const express = require("express");
const {
  login,
  logout,
  getProfile,
  updateProfile,
  verifyToken,
  register,
} = require("../controllers/auth.controller");

const {
  authenticateToken,
  requireRoles,
  requireSuperAdminNacional,
  requireInstitutionAdmin,
} = require("../middlewares/auth.middleware");

const {
  loginValidation,
  institutionParamValidation,
  registerValidation,
} = require("../validators/auth.validators");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.get("/verify", authenticateToken, verifyToken);

// Rutas de prueba de roles (si las usas)
router.get("/test-roles/super-admin", requireSuperAdminNacional, (req, res) => {
  res.json({
    success: true,
    message: "Acceso autorizado para Super Admin Nacional",
    user: req.user,
  });
});

router.get(
  "/test-roles/institution-admin/:institucionId",
  institutionParamValidation,
  requireInstitutionAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: "Acceso autorizado para Admin de Institución",
      institucionId: req.params.institucionId,
      user: req.user,
    });
  }
);

router.get(
  "/test-roles/psychologist",
  authenticateToken,
  requireRoles([
    "PSICOLOGO",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ]),
  (req, res) => {
    res.json({
      success: true,
      message: "Acceso autorizado para Psicólogo",
      user: req.user,
    });
  }
);

module.exports = router;

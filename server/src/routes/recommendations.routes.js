const express = require("express");
const {
  getRecommendations,
  getPersonalizedRecommendations,
  getRecommendedResources,
  getRecommendedExercises,
  getWellnessTechniques,
  getCategories,
  getProgressStats,
  markAsViewed,
  toggleFavorite,
  recordInteraction,
  searchRecommendations
} = require("../controllers/recommendations.controller");

const {
  authenticateToken,
  requireRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/recommendations - Obtener recomendaciones generales
router.get("/", getRecommendations);

// GET /api/recommendations/personalized - Recomendaciones personalizadas
router.get("/personalized", getPersonalizedRecommendations);

// GET /api/recommendations/resources - Recursos educativos
router.get("/resources", getRecommendedResources);

// GET /api/recommendations/exercises - Ejercicios y actividades
router.get("/exercises", getRecommendedExercises);

// GET /api/recommendations/wellness - Técnicas de bienestar
router.get("/wellness", getWellnessTechniques);

// GET /api/recommendations/categories - Categorías disponibles
router.get("/categories", getCategories);

// GET /api/recommendations/progress - Estadísticas de progreso del usuario
router.get("/progress", getProgressStats);

// GET /api/recommendations/search - Buscar recomendaciones
router.get("/search", searchRecommendations);

// POST /api/recommendations/:id/view - Marcar recomendación como vista
router.post("/:id/view", markAsViewed);

// POST /api/recommendations/:id/favorite - Toggle estado de favorito
router.post("/:id/favorite", toggleFavorite);

// POST /api/recommendations/:id/interaction - Registrar interacción del usuario
router.post("/:id/interaction", recordInteraction);

module.exports = router;
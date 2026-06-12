// controllers/recommendations.controller.js
const { validationResult } = require("express-validator");
const { pool } = require("../db");

const ENV = process.env.NODE_ENV || "development";

const logSqlError = (err) => {
  if (ENV !== "production") {
    console.error("[SQL ERROR]", err?.sqlMessage || err?.message || err);
  }
};

const sendError = (res, status, code, message, err) => {
  if (err) logSqlError(err);
  return res.status(status).json({ success: false, code, message });
};

/**
 * GET /api/recommendations - Obtener recomendaciones generales
 */
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      category = 'all',
      status = 'all',
      priority = 'all',
      search = '',
      limit = 20,
      offset = 0
    } = req.query;

    // Por ahora devolver datos mock hasta implementar la base de datos
    const mockRecommendations = [
      {
        id: 1,
        title: 'Técnicas de Respiración para Ansiedad',
        description: 'Basado en tu última evaluación, te recomendamos practicar ejercicios de respiración para manejar los niveles de ansiedad.',
        category: 'Ansiedad',
        priority: 'high',
        type: 'technique',
        duration: '10-15 min',
        difficulty: 'Fácil',
        completedBy: 1250,
        rating: 4.8,
        isViewed: false,
        tags: ['Respiración', 'Relajación', 'Ansiedad'],
        createdAt: new Date()
      },
      {
        id: 2,
        title: 'Artículo: Manejo del Estrés Académico',
        description: 'Estrategias efectivas para estudiantes que enfrentan presión académica y estrés relacionado con los estudios.',
        category: 'Estrés',
        priority: 'medium',
        type: 'article',
        duration: '5 min lectura',
        difficulty: 'Intermedio',
        completedBy: 890,
        rating: 4.6,
        isViewed: false,
        tags: ['Estrés', 'Estudiantes', 'Académico'],
        createdAt: new Date()
      }
    ];

    // Filtrar según parámetros
    let filteredRecommendations = mockRecommendations;

    if (category !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(r =>
        r.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (priority !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(r => r.priority === priority);
    }

    if (search) {
      filteredRecommendations = filteredRecommendations.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginación
    const startIndex = parseInt(offset);
    const itemsPerPage = parseInt(limit);
    const paginatedResults = filteredRecommendations.slice(startIndex, startIndex + itemsPerPage);

    return res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total: filteredRecommendations.length,
        limit: itemsPerPage,
        offset: startIndex,
        hasMore: startIndex + itemsPerPage < filteredRecommendations.length
      }
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_RECOMMENDATIONS_FAILED",
      "Error al obtener recomendaciones",
      err
    );
  }
};

/**
 * GET /api/recommendations/personalized - Recomendaciones personalizadas
 */
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Mock de recomendaciones personalizadas basadas en el perfil del usuario
    const personalizedRecommendations = [
      {
        id: 1,
        title: 'Técnicas de Respiración para Ansiedad',
        description: 'Basado en tu última evaluación, te recomendamos practicar ejercicios de respiración para manejar los niveles de ansiedad.',
        category: 'Ansiedad',
        priority: 'high',
        type: 'technique',
        duration: '10-15 min',
        difficulty: 'Fácil',
        completedBy: 1250,
        rating: 4.8,
        isViewed: false,
        tags: ['Respiración', 'Relajación', 'Ansiedad'],
        personalizedReason: 'Basado en tu evaluación reciente de ansiedad'
      },
      {
        id: 2,
        title: 'Meditación Guiada: Mindfulness Básico',
        description: 'Introducción al mindfulness con ejercicios guiados para principiantes.',
        category: 'Mindfulness',
        priority: 'medium',
        type: 'audio',
        duration: '20 min',
        difficulty: 'Principiante',
        completedBy: 2100,
        rating: 4.9,
        isViewed: false,
        tags: ['Meditación', 'Mindfulness', 'Audio'],
        personalizedReason: 'Recomendado para tu nivel de estrés actual'
      }
    ];

    return res.json({
      success: true,
      data: personalizedRecommendations
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_PERSONALIZED_FAILED",
      "Error al obtener recomendaciones personalizadas",
      err
    );
  }
};

/**
 * GET /api/recommendations/resources - Recursos educativos
 */
const getRecommendedResources = async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    const mockResources = [
      {
        id: 4,
        title: 'Guía Completa de Salud Mental para Estudiantes',
        description: 'Recurso integral sobre bienestar psicológico en el ámbito académico.',
        type: 'pdf',
        category: 'Educacional',
        duration: '45 min lectura',
        rating: 4.7,
        downloads: 3200,
        tags: ['Salud Mental', 'Estudiantes', 'Guía']
      },
      {
        id: 5,
        title: 'Video: Técnicas de Estudio Efectivas',
        description: 'Aprende métodos probados para mejorar tu rendimiento académico y reducir el estrés.',
        type: 'video',
        category: 'Productividad',
        duration: '25 min',
        rating: 4.5,
        views: 12500,
        tags: ['Estudio', 'Productividad', 'Video']
      },
      {
        id: 6,
        title: 'Podcast: Conversaciones sobre Bienestar',
        description: 'Serie de entrevistas con expertos en salud mental y bienestar estudiantil.',
        type: 'audio',
        category: 'Bienestar',
        duration: '35 min',
        rating: 4.8,
        listens: 8900,
        tags: ['Podcast', 'Bienestar', 'Expertos']
      }
    ];

    let filteredResources = mockResources;
    if (type !== 'all') {
      filteredResources = mockResources.filter(r => r.type === type);
    }

    return res.json({
      success: true,
      data: filteredResources
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_RESOURCES_FAILED",
      "Error al obtener recursos",
      err
    );
  }
};

/**
 * GET /api/recommendations/exercises - Ejercicios y actividades
 */
const getRecommendedExercises = async (req, res) => {
  try {
    const { category = 'all' } = req.query;

    const mockExercises = [
      {
        id: 7,
        title: 'Ejercicio de Relajación Progresiva',
        description: 'Técnica para liberar tensión física y mental a través de la relajación muscular.',
        category: 'Relajación',
        difficulty: 'Fácil',
        duration: '15 min',
        completions: 1800,
        benefits: ['Reduce tensión', 'Mejora sueño', 'Calma ansiedad'],
        steps: 5
      },
      {
        id: 8,
        title: 'Diario de Gratitud Digital',
        description: 'Actividad diaria para desarrollar una perspectiva positiva y mejorar el estado de ánimo.',
        category: 'Positividad',
        difficulty: 'Fácil',
        duration: '5 min',
        completions: 2500,
        benefits: ['Mejora ánimo', 'Aumenta gratitud', 'Reduce negatividad'],
        steps: 3
      },
      {
        id: 9,
        title: 'Técnica de Visualización',
        description: 'Ejercicio mental para reducir ansiedad ante situaciones específicas como exámenes.',
        category: 'Visualización',
        difficulty: 'Intermedio',
        duration: '20 min',
        completions: 950,
        benefits: ['Reduce ansiedad', 'Mejora confianza', 'Prepara mentalmente'],
        steps: 7
      }
    ];

    let filteredExercises = mockExercises;
    if (category !== 'all') {
      filteredExercises = mockExercises.filter(e =>
        e.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    return res.json({
      success: true,
      data: filteredExercises
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_EXERCISES_FAILED",
      "Error al obtener ejercicios",
      err
    );
  }
};

/**
 * GET /api/recommendations/wellness - Técnicas de bienestar
 */
const getWellnessTechniques = async (req, res) => {
  try {
    const mockWellnessTechniques = [
      {
        id: 10,
        title: 'Rutina Matutina para el Bienestar',
        description: 'Conjunto de actividades para comenzar el día con energía positiva y claridad mental.',
        category: 'Rutinas',
        timeOfDay: 'Mañana',
        duration: '30 min',
        difficulty: 'Fácil',
        benefits: ['Energía', 'Claridad', 'Motivación'],
        activities: ['Meditación', 'Ejercicio ligero', 'Afirmaciones']
      },
      {
        id: 11,
        title: 'Técnicas de Respiración 4-7-8',
        description: 'Método científicamente respaldado para reducir estrés y mejorar el sueño.',
        category: 'Respiración',
        timeOfDay: 'Cualquiera',
        duration: '10 min',
        difficulty: 'Fácil',
        benefits: ['Calma', 'Mejor sueño', 'Reduce estrés'],
        activities: ['Respiración controlada', 'Concentración', 'Relajación']
      }
    ];

    return res.json({
      success: true,
      data: mockWellnessTechniques
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_WELLNESS_FAILED",
      "Error al obtener técnicas de bienestar",
      err
    );
  }
};

/**
 * GET /api/recommendations/categories - Categorías disponibles
 */
const getCategories = async (req, res) => {
  try {
    const mockCategories = [
      { id: 1, name: 'Ansiedad', count: 45 },
      { id: 2, name: 'Estrés', count: 38 },
      { id: 3, name: 'Mindfulness', count: 29 },
      { id: 4, name: 'Autoestima', count: 22 },
      { id: 5, name: 'Sueño', count: 18 },
      { id: 6, name: 'Productividad', count: 15 },
      { id: 7, name: 'Relajación', count: 12 }
    ];

    return res.json({
      success: true,
      data: mockCategories
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_CATEGORIES_FAILED",
      "Error al obtener categorías",
      err
    );
  }
};

/**
 * GET /api/recommendations/progress - Estadísticas de progreso
 */
const getProgressStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Mock de estadísticas de progreso
    const mockStats = {
      totalRecommendations: 127,
      completedRecommendations: 34,
      favoriteRecommendations: 12,
      weeklyProgress: 8,
      completionRate: 27,
      streak: 5,
      categoriesExplored: 6,
      hoursSpent: 45
    };

    return res.json({
      success: true,
      data: mockStats
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "GET_PROGRESS_FAILED",
      "Error al obtener estadísticas",
      err
    );
  }
};

/**
 * POST /api/recommendations/:id/view - Marcar como vista
 */
const markAsViewed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: recommendationId } = req.params;

    // TODO: Implementar lógica de base de datos para marcar como vista

    return res.json({
      success: true,
      message: 'Recomendación marcada como vista'
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "MARK_VIEWED_FAILED",
      "Error al marcar recomendación",
      err
    );
  }
};

/**
 * POST /api/recommendations/:id/favorite - Toggle favorito
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: recommendationId } = req.params;

    // TODO: Implementar lógica de base de datos para favoritos

    return res.json({
      success: true,
      message: 'Estado de favorito actualizado',
      data: { isFavorite: true } // mock
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "TOGGLE_FAVORITE_FAILED",
      "Error al actualizar favorito",
      err
    );
  }
};

/**
 * POST /api/recommendations/:id/interaction - Registrar interacción
 */
const recordInteraction = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: recommendationId } = req.params;
    const { type, ...data } = req.body;

    // TODO: Implementar lógica de base de datos para interacciones

    return res.json({
      success: true,
      message: 'Interacción registrada'
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "RECORD_INTERACTION_FAILED",
      "Error al registrar interacción",
      err
    );
  }
};

/**
 * GET /api/recommendations/search - Buscar recomendaciones
 */
const searchRecommendations = async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;

    if (!query || query.trim().length < 2) {
      return sendError(
        res,
        400,
        "INVALID_QUERY",
        "La consulta debe tener al menos 2 caracteres"
      );
    }

    // Mock de búsqueda
    const allRecommendations = [
      {
        id: 1,
        title: 'Técnicas de Respiración para Ansiedad',
        description: 'Ejercicios de respiración para manejar los niveles de ansiedad.',
        category: 'Ansiedad',
        type: 'technique'
      },
      {
        id: 2,
        title: 'Artículo: Manejo del Estrés Académico',
        description: 'Estrategias para estudiantes con presión académica.',
        category: 'Estrés',
        type: 'article'
      }
    ];

    const searchResults = allRecommendations.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );

    return res.json({
      success: true,
      data: searchResults,
      pagination: {
        total: searchResults.length,
        query: query
      }
    });
  } catch (err) {
    return sendError(
      res,
      500,
      "SEARCH_FAILED",
      "Error en la búsqueda",
      err
    );
  }
};

module.exports = {
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
};
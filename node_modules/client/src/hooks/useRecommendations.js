import { useState, useEffect, useCallback } from 'react';
import recommendationsService from '../services/recommendationsService';

/**
 * Hook personalizado para manejar el estado y operaciones de recomendaciones
 */
export const useRecommendations = () => {
  const [state, setState] = useState({
    personalized: [],
    resources: [],
    exercises: [],
    wellness: [],
    categories: [],
    progressStats: null,
    favorites: new Set(),
    loading: true,
    searchLoading: false,
    error: null
  });

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [personalizedRes, resourcesRes, exercisesRes, wellnessRes, categoriesRes, statsRes] = await Promise.allSettled([
        recommendationsService.getPersonalizedRecommendations(),
        recommendationsService.getRecommendedResources(),
        recommendationsService.getRecommendedExercises(),
        recommendationsService.getWellnessTechniques(),
        recommendationsService.getCategories(),
        recommendationsService.getProgressStats()
      ]);

      const newState = { loading: false, error: null };

      // Procesar resultados exitosos
      if (personalizedRes.status === 'fulfilled' && personalizedRes.value.success) {
        newState.personalized = personalizedRes.value.data || [];
      }
      if (resourcesRes.status === 'fulfilled' && resourcesRes.value.success) {
        newState.resources = resourcesRes.value.data || [];
      }
      if (exercisesRes.status === 'fulfilled' && exercisesRes.value.success) {
        newState.exercises = exercisesRes.value.data || [];
      }
      if (wellnessRes.status === 'fulfilled' && wellnessRes.value.success) {
        newState.wellness = wellnessRes.value.data || [];
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        newState.categories = categoriesRes.value.data || [];
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        newState.progressStats = statsRes.value.data;
      }

      // Si alguna falló, usar datos mock
      if (!newState.personalized?.length) {
        newState.personalized = getMockPersonalizedRecommendations();
      }
      if (!newState.resources?.length) {
        newState.resources = getMockResources();
      }
      if (!newState.exercises?.length) {
        newState.exercises = getMockExercises();
      }
      if (!newState.wellness?.length) {
        newState.wellness = getMockWellnessTechniques();
      }
      if (!newState.categories?.length) {
        newState.categories = getMockCategories();
      }
      if (!newState.progressStats) {
        newState.progressStats = getMockProgressStats();
      }

      setState(prev => ({ ...prev, ...newState }));

    } catch (error) {
      console.error('Error loading recommendations:', error);

      // Cargar datos mock en caso de error completo
      setState(prev => ({
        ...prev,
        personalized: getMockPersonalizedRecommendations(),
        resources: getMockResources(),
        exercises: getMockExercises(),
        wellness: getMockWellnessTechniques(),
        categories: getMockCategories(),
        progressStats: getMockProgressStats(),
        loading: false,
        error: 'Error cargando recomendaciones. Mostrando datos de ejemplo.'
      }));
    }
  }, []);

  // Buscar recomendaciones
  const searchRecommendations = useCallback(async (query, filters = {}) => {
    if (!query?.trim()) return;

    setState(prev => ({ ...prev, searchLoading: true }));

    try {
      const result = await recommendationsService.searchRecommendations(query, filters);

      if (result.success) {
        setState(prev => ({
          ...prev,
          searchLoading: false,
          // Actualizar solo los resultados relevantes basados en filtros
          ...(filters.type === 'personalized' && { personalized: result.data || [] }),
          ...(filters.type === 'resources' && { resources: result.data || [] }),
          ...(filters.type === 'exercises' && { exercises: result.data || [] }),
          ...(filters.type === 'wellness' && { wellness: result.data || [] }),
        }));
      }
    } catch (error) {
      console.error('Error searching recommendations:', error);
      setState(prev => ({ ...prev, searchLoading: false }));
    }
  }, []);

  // Toggle favorito
  const toggleFavorite = useCallback(async (recommendationId) => {
    try {
      const result = await recommendationsService.toggleFavorite(recommendationId);

      setState(prev => {
        const newFavorites = new Set(prev.favorites);
        if (newFavorites.has(recommendationId)) {
          newFavorites.delete(recommendationId);
        } else {
          newFavorites.add(recommendationId);
        }
        return { ...prev, favorites: newFavorites };
      });

      return { success: true, message: result.message || 'Favorito actualizado' };
    } catch (error) {
      console.error('Error toggling favorite:', error);

      // Fallback: actualizar localmente
      setState(prev => {
        const newFavorites = new Set(prev.favorites);
        if (newFavorites.has(recommendationId)) {
          newFavorites.delete(recommendationId);
        } else {
          newFavorites.add(recommendationId);
        }
        return { ...prev, favorites: newFavorites };
      });

      return { success: false, error: 'Error actualizando favorito' };
    }
  }, []);

  // Marcar como vista
  const markAsViewed = useCallback(async (recommendationId) => {
    try {
      await recommendationsService.markAsViewed(recommendationId);

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        personalized: prev.personalized.map(item =>
          item.id === recommendationId ? { ...item, isViewed: true } : item
        ),
        resources: prev.resources.map(item =>
          item.id === recommendationId ? { ...item, isViewed: true } : item
        ),
        exercises: prev.exercises.map(item =>
          item.id === recommendationId ? { ...item, isViewed: true } : item
        ),
        wellness: prev.wellness.map(item =>
          item.id === recommendationId ? { ...item, isViewed: true } : item
        ),
      }));
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  }, []);

  // Registrar interacción
  const recordInteraction = useCallback(async (recommendationId, type, data = {}) => {
    try {
      await recommendationsService.recordInteraction(recommendationId, type, data);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }, []);

  // Actualizar progreso
  const updateProgress = useCallback(async () => {
    try {
      const result = await recommendationsService.getProgressStats();
      if (result.success) {
        setState(prev => ({ ...prev, progressStats: result.data }));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, []);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // Estado
    ...state,

    // Métodos
    loadInitialData,
    searchRecommendations,
    toggleFavorite,
    markAsViewed,
    recordInteraction,
    updateProgress,

    // Utilidades
    isFavorite: (id) => state.favorites.has(id),
    getTotalCount: () => ({
      personalized: state.personalized.length,
      resources: state.resources.length,
      exercises: state.exercises.length,
      wellness: state.wellness.length,
    }),
  };
};

// Funciones helper para datos mock
const getMockPersonalizedRecommendations = () => [
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
    tags: ['Respiración', 'Relajación', 'Ansiedad']
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
    isViewed: true,
    tags: ['Estrés', 'Estudiantes', 'Académico']
  },
  {
    id: 3,
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
    tags: ['Meditación', 'Mindfulness', 'Audio']
  }
];

const getMockResources = () => [
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

const getMockExercises = () => [
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

const getMockWellnessTechniques = () => [
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

const getMockCategories = () => [
  { id: 1, name: 'Ansiedad', count: 45 },
  { id: 2, name: 'Estrés', count: 38 },
  { id: 3, name: 'Mindfulness', count: 29 },
  { id: 4, name: 'Autoestima', count: 22 },
  { id: 5, name: 'Sueño', count: 18 }
];

const getMockProgressStats = () => ({
  totalRecommendations: 127,
  completedRecommendations: 34,
  favoriteRecommendations: 12,
  weeklyProgress: 8,
  completionRate: 27,
  streak: 5
});

export default useRecommendations;
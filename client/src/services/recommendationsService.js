import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../utils/constants';

// Crear instancia de axios para recomendaciones
const api = axios.create({
  baseURL: API_CONFIG.API_BASE,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class RecommendationsService {
  /**
   * Obtener todas las recomendaciones del usuario
   */
  async getRecommendations(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const response = await api.get(`/recommendations${queryString ? `?${queryString}` : ''}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo recomendaciones',
      };
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener recomendaciones personalizadas basadas en evaluaciones
   */
  async getPersonalizedRecommendations() {
    try {
      const response = await api.get('/recommendations/personalized');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo recomendaciones personalizadas',
      };
    } catch (error) {
      console.error('Error obteniendo recomendaciones personalizadas:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener una recomendación específica
   */
  async getRecommendation(recommendationId) {
    try {
      const response = await api.get(`/recommendations/${recommendationId}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo recomendación',
      };
    } catch (error) {
      console.error('Error obteniendo recomendación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Marcar recomendación como vista
   */
  async markAsViewed(recommendationId) {
    try {
      const response = await api.post(`/recommendations/${recommendationId}/view`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Recomendación marcada como vista',
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error marcando recomendación',
      };
    } catch (error) {
      console.error('Error marcando recomendación como vista:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Marcar recomendación como favorita
   */
  async toggleFavorite(recommendationId) {
    try {
      const response = await api.post(`/recommendations/${recommendationId}/favorite`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Estado de favorito actualizado',
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error actualizando favorito',
      };
    } catch (error) {
      console.error('Error actualizando favorito:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener categorías de recomendaciones disponibles
   */
  async getCategories() {
    try {
      const response = await api.get('/recommendations/categories');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo categorías',
      };
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener recursos recomendados (artículos, videos, libros)
   */
  async getRecommendedResources(type = 'all') {
    try {
      const response = await api.get(`/recommendations/resources?type=${type}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo recursos',
      };
    } catch (error) {
      console.error('Error obteniendo recursos:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener ejercicios y actividades recomendadas
   */
  async getRecommendedExercises(category = 'all') {
    try {
      const response = await api.get(`/recommendations/exercises?category=${category}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo ejercicios',
      };
    } catch (error) {
      console.error('Error obteniendo ejercicios:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener técnicas de bienestar recomendadas
   */
  async getWellnessTechniques() {
    try {
      const response = await api.get('/recommendations/wellness');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo técnicas de bienestar',
      };
    } catch (error) {
      console.error('Error obteniendo técnicas de bienestar:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Registrar interacción del usuario con una recomendación
   */
  async recordInteraction(recommendationId, interactionType, data = {}) {
    try {
      const response = await api.post(`/recommendations/${recommendationId}/interaction`, {
        type: interactionType, // 'view', 'click', 'complete', 'like', 'share'
        ...data
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Interacción registrada',
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error registrando interacción',
      };
    } catch (error) {
      console.error('Error registrando interacción:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener estadísticas de progreso del usuario
   */
  async getProgressStats() {
    try {
      const response = await api.get('/recommendations/progress');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo estadísticas',
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Buscar recomendaciones
   */
  async searchRecommendations(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      });

      const response = await api.get(`/recommendations/search?${params.toString()}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error en la búsqueda',
      };
    } catch (error) {
      console.error('Error buscando recomendaciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }
}

// Crear instancia única
const recommendationsService = new RecommendationsService();

export default recommendationsService;
import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../utils/constants';

// Crear instancia de axios para user endpoints
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
      // Token expirado o inválido
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class UserService {
  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(profileData) {
    try {
      // Usar el endpoint PUT /auth/profile para actualizar el perfil
      const response = await api.put('/auth/profile', profileData);

      if (response.data.success) {
        // Actualizar datos en localStorage
        const updatedUser = response.data.data;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

        return {
          success: true,
          message: response.data.message || 'Perfil actualizado correctamente',
          data: updatedUser,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error actualizando perfil',
      };
    } catch (error) {
      console.error('Error actualizando perfil:', error);

      // Si el perfil no está completado, intentar con el endpoint de onboarding
      if (error.response?.status === 409 || error.response?.data?.code === 'PROFILE_ALREADY_COMPLETED') {
        try {
          const response = await api.post('/onboarding/complete-profile', profileData);

          if (response.data.success) {
            // Actualizar datos en localStorage
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
            const updatedUser = { ...currentUser, ...profileData, perfilCompletado: true };
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

            return {
              success: true,
              message: response.data.message || 'Perfil actualizado correctamente',
              data: updatedUser,
            };
          }
        } catch (onboardingError) {
          console.warn('También falló el endpoint de onboarding:', onboardingError);
        }
      }

      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Contraseña actualizada correctamente',
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error cambiando contraseña',
      };
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Subir foto de perfil
   */
  async uploadProfilePhoto(file) {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/users/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.success && response.data.archivo) {
        // Actualizar foto en localStorage
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
        const updatedUser = { ...currentUser, foto: response.data.archivo.url };
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

        return {
          success: true,
          message: response.data.message || 'Foto actualizada correctamente',
          data: { photoUrl: response.data.archivo.url },
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error subiendo foto',
      };
    } catch (error) {
      console.error('Error subiendo foto:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener configuraciones del usuario
   */
  async getUserSettings() {
    try {
      const response = await api.get('/user/settings');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo configuraciones',
      };
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Guardar configuraciones del usuario
   */
  async updateUserSettings(settings) {
    try {
      const response = await api.post('/user/settings', settings);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Configuraciones guardadas correctamente',
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error guardando configuraciones',
      };
    } catch (error) {
      console.error('Error guardando configuraciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/user/notifications${params ? `?${params}` : ''}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error obteniendo notificaciones',
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.patch(`/user/notifications/${notificationId}/read`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Notificación marcada como leída',
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error marcando notificación',
      };
    } catch (error) {
      console.error('Error marcando notificación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/user/notifications/${notificationId}`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Notificación eliminada',
        };
      }

      return {
        success: false,
        error: response.data.message || 'Error eliminando notificación',
      };
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error de conexión',
      };
    }
  }
}

// Crear instancia única
const userService = new UserService();

export default userService;
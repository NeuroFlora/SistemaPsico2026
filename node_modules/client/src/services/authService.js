import axios from "axios";
import { API_CONFIG, AUTH_ENDPOINTS, STORAGE_KEYS } from "../utils/constants";

// Configurar axios con interceptores
const api = axios.create({
  baseURL: API_CONFIG.API_BASE,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
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
      authService.logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * Iniciar sesión
   */
  async login(credentials) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);

      if (response.data.success) {
        const { accessToken, user } = response.data.data;

        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

        return {
          success: true,
          data: { token: accessToken, user },
        };
      }

      return {
        success: false,
        error: response.data.message || "Error de login",
      };
    } catch (error) {
      console.error("Error en login:", error);

      return {
        success: false,
        error: error.response?.data?.message || "Error de conexión",
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      // Intentar notificar al servidor (opcional)
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        await api.post(AUTH_ENDPOINTS.LOGOUT);
      }
    } catch (error) {
      console.warn("Error notificando logout al servidor:", error);
    } finally {
      // Limpiar localStorage siempre
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  /**
   * Obtener perfil del usuario
   */
  async getProfile() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.PROFILE);

      if (response.data.success) {
        const user = response.data.data;

        // Actualizar datos en localStorage
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

        return {
          success: true,
          data: user,
        };
      }

      return {
        success: false,
        error: response.data.message || "Error obteniendo perfil",
      };
    } catch (error) {
      console.error("Error obteniendo perfil:", error);

      return {
        success: false,
        error: error.response?.data?.message || "Error de conexión",
      };
    }
  }

  /**
   * Verificar si el token es válido
   */
  async verifyToken() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.VERIFY);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message || "Token inválido",
      };
    } catch (error) {
      console.error("Error verificando token:", error);

      return {
        success: false,
        error: error.response?.data?.message || "Token inválido",
      };
    }
  }

  /**
   * Obtener token actual
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Obtener datos del usuario actual
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parseando datos de usuario:", error);
      return null;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles) {
    const user = this.getCurrentUser();
    return roles.includes(user?.rol);
  }

  /**
   * Verificar si el usuario puede acceder a una institución específica
   */
  canAccessInstitution(institucionId) {
    const user = this.getCurrentUser();

    // Super Admin Nacional puede acceder a todo
    if (user?.rol === "SUPER_ADMIN_NACIONAL") {
      return true;
    }

    // Otros usuarios solo a su institución
    return user?.institucionId === parseInt(institucionId);
  }
}

// Crear instancia única
const authService = new AuthService();

// Helper functions for authenticated HTTP requests
export const authGet = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Auth GET error:', error);
    throw error.response?.data || error;
  }
};

export const authPost = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('Auth POST error:', error);
    throw error.response?.data || error;
  }
};

export const authPut = async (endpoint, data) => {
  try {
    const response = await api.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('Auth PUT error:', error);
    throw error.response?.data || error;
  }
};

export const authDelete = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error('Auth DELETE error:', error);
    throw error.response?.data || error;
  }
};

export default authService;

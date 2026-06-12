import { API_CONFIG } from "./constants";

/**
 * Realiza una petición autenticada usando fetch con el token almacenado
 * @param {string} url - URL relativa de la API (ej: "/api/citas")
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>} - Respuesta de fetch
 */
export const authenticatedFetch = async (url, options = {}) => {
  // Obtener token del localStorage (prioritizar auth_token que es el principal)
  const token = localStorage.getItem("auth_token") ||
                localStorage.getItem("authToken:v1") ||
                localStorage.getItem("accessToken") ||
                localStorage.getItem("token");

  // Construir URL completa si es relativa
  const fullUrl = url.startsWith("http") ? url : `${API_CONFIG.API_BASE}${url}`;

  // Configurar headers por defecto
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Merger headers con los proporcionados
  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(fullUrl, mergedOptions);

    // Si es 401, redirigir a login
    if (response.status === 401) {
      localStorage.removeItem("authToken:v1");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error en authenticatedFetch:", error);
    throw error;
  }
};

export default { authenticatedFetch };
import { authGet, authPost, authPut, authDelete } from './authService';

const USERS_ENDPOINT = '/users';

export const usersService = {
  // Get all users for the institution
  getUsers: async (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);

    const query = searchParams.toString();
    const endpoint = query ? `${USERS_ENDPOINT}?${query}` : USERS_ENDPOINT;

    return authGet(endpoint);
  },

  // Get specific user by ID
  getUserById: async (userId) => {
    return authGet(`${USERS_ENDPOINT}/${userId}`);
  },

  // Create new user
  createUser: async (userData) => {
    return authPost(USERS_ENDPOINT, userData);
  },

  // Update user
  updateUser: async (userId, userData) => {
    return authPut(`${USERS_ENDPOINT}/${userId}`, userData);
  },

  // Deactivate user (soft delete)
  deactivateUser: async (userId) => {
    return authDelete(`${USERS_ENDPOINT}/${userId}`);
  },

  // Reactivate user
  activateUser: async (userId) => {
    return authPost(`${USERS_ENDPOINT}/${userId}/activate`);
  },

  // Get user statistics
  getUserStats: async () => {
    return authGet(`${USERS_ENDPOINT}/stats/overview`);
  },

  // User roles available for institution admins
  getUserRoles: () => [
    { value: 'ESTUDIANTE', label: 'Estudiante' },
    { value: 'PSICOLOGO', label: 'Psicólogo' },
    { value: 'ORIENTADOR', label: 'Orientador' },
    { value: 'ADMIN_INSTITUCION', label: 'Administrador de Institución' }
  ],

  // User statuses
  getUserStatuses: () => [
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'INACTIVO', label: 'Inactivo' },
    { value: 'BLOQUEADO', label: 'Bloqueado' }
  ]
};
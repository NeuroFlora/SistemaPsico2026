import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../utils/constants";

// Componente de loading mientras se verifica la autenticación
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Verificando autenticación...</p>
    </div>
  </div>
);

/**
 * Componente para proteger rutas que requieren autenticación
 */
const ProtectedRoute = ({
  children,
  requiredRoles = null,
  fallbackPath = ROUTES.LOGIN,
  skipOnboardingCheck = false, // Nueva prop para saltar verificación de onboarding
}) => {
  const { isAuthenticated, isLoading, user, activeRole, hasAnyRole } = useAuth();
  const location = useLocation();

  console.log('🛡️ [PROTECTED_ROUTE] Verificando acceso:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    userRole: user?.rol,
    activeRole,
    userInstituciones: user?.instituciones,
    requiredRoles,
    fallbackPath,
    perfilCompletado: user?.perfilCompletado
  });

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    console.log('⏳ [PROTECTED_ROUTE] Mostrando loading screen');
    return <LoadingScreen />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('❌ [PROTECTED_ROUTE] Usuario no autenticado, redirigiendo a:', fallbackPath);
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar si el usuario necesita completar el onboarding
  if (!skipOnboardingCheck && user && !user.perfilCompletado) {
    console.log('🚧 [PROTECTED_ROUTE] Usuario necesita completar onboarding');
    // El OnboardingModal se encargará de mostrarse automáticamente
    // Pero aquí podemos bloquear la navegación hasta que se complete
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completa tu Perfil</h2>
          <p className="text-gray-600 mb-4">
            Antes de continuar, necesitas completar la información de tu perfil.
          </p>
          <p className="text-sm text-gray-500">
            El formulario de bienvenida se abrirá automáticamente...
          </p>
        </div>
      </div>
    );
  }

  // Si se especificaron roles requeridos, verificar que el usuario los tenga
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = hasAnyRole(requiredRoles);

    console.log('🔍 [PROTECTED_ROUTE] Verificando roles:', {
      requiredRoles,
      hasRequiredRole,
      activeRole,
      userInstituciones: user?.instituciones
    });

    if (!hasRequiredRole) {
      console.log('❌ [PROTECTED_ROUTE] Usuario no tiene los roles requeridos');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección.</p>
            <p className="text-sm text-gray-500 mb-4">
              Rol requerido: {requiredRoles.join(', ')}<br/>
              Tu rol: {activeRole || 'No definido'}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Regresar
            </button>
          </div>
        </div>
      );
    }
  }

  // Si todo está bien, renderizar el componente hijo
  console.log('✅ [PROTECTED_ROUTE] Acceso autorizado, renderizando children');
  return children;
};

/**
 * Componente para rutas que solo pueden acceder usuarios NO autenticados (como login)
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Si no está autenticado, mostrar la ruta pública
  return children;
};

/**
 * Componente para verificar acceso a institución específica
 */
const InstitutionProtectedRoute = ({
  children,
  requireInstitutionAccess = true,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Extraer institucionId de los parámetros de la URL
  const pathSegments = location.pathname.split("/");
  const institucionIdFromPath = pathSegments.find(
    (segment, index) => pathSegments[index - 1] === "institucion"
  );

  if (requireInstitutionAccess && institucionIdFromPath) {
    const institucionId = parseInt(institucionIdFromPath);

    // Super Admin Nacional puede acceder a cualquier institución
    if (user?.rol === "SUPER_ADMIN_NACIONAL") {
      return children;
    }

    // Otros usuarios solo pueden acceder a su propia institución
    if (user?.institucionId !== institucionId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a esta institución.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Regresar
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

/**
 * HOC para crear rutas protegidas específicas por rol
 */
const createRoleProtectedRoute = (allowedRoles, skipOnboardingCheck = false) => {
  return ({ children }) => (
    <ProtectedRoute
      requiredRoles={allowedRoles}
      skipOnboardingCheck={skipOnboardingCheck}
    >
      {children}
    </ProtectedRoute>
  );
};

// Rutas protegidas específicas por rol
export const SuperAdminNacionalRoute = createRoleProtectedRoute([
  "SUPER_ADMIN_NACIONAL",
]);
export const SuperAdminInstitucionRoute = createRoleProtectedRoute([
  "SUPER_ADMIN_NACIONAL",
  "SUPER_ADMIN_INSTITUCION",
]);
export const PsicologoRoute = createRoleProtectedRoute([
  "SUPER_ADMIN_NACIONAL",
  "SUPER_ADMIN_INSTITUCION",
  "PSICOLOGO",
]);
export const EstudianteRoute = createRoleProtectedRoute(["ESTUDIANTE"]);
export const OrientadorRoute = createRoleProtectedRoute(["ORIENTADOR"]);

// Rutas combinadas (psicólogos + admins)
export const PsychologyStaffRoute = createRoleProtectedRoute([
  "SUPER_ADMIN_NACIONAL",
  "SUPER_ADMIN_INSTITUCION",
  "PSICOLOGO",
  "ORIENTADOR",
]);

export { ProtectedRoute, PublicOnlyRoute, InstitutionProtectedRoute };
export default ProtectedRoute;

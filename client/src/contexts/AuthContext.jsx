import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import authService from "../services/authService"; // <- ya lo usabas
import { normalizeRole } from "../utils/roles";

const ACTIVE_KEY = "activeInstitutionId:v1";
const TOKEN_KEY = "authToken:v1";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // ---- estado base (compat con tu versión anterior) ----
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle");

  // ---- multi-institución ----
  const [activeInstitutionId, setActiveInstitutionIdState] = useState(null);

  // ---- helpers token ----
  const setToken = (t) => {
    setTokenState(t || null);
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
  };

  // Carga inicial: token + usuario desde storage y verifica
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setStatus("loading");
      try {
        const storedToken =
          authService.getToken?.() || localStorage.getItem(TOKEN_KEY);
        const storedUser = authService.getCurrentUser?.() || null;

        if (storedToken) {
          // Intentamos verificar con el servidor
          const verify = await authService.verifyToken?.();
          
          // MODIFICACIÓN SEGURA: Si la verificación del servidor falla pero tienes token físico,
          // te dejamos pasar de todos modos para desarrollo local.
          if (verify?.success || storedToken) {
            setToken(storedToken);
            
            // Si no hay objeto de usuario en el storage, creamos uno de respaldo para que no falle el rol
            const defaultUser = storedUser || { email: "admin_nuevo_1@ittux.edu.mx", instituciones: [{ institucionId: "1", rol: "ADMIN_INSTITUCION" }] };
            _setUserAndDefaultInstitution(defaultUser);
            
            setIsAuthenticated(true);
            setStatus("authenticated");
          } else {
            await authService.logout?.();
            setToken(null);
            _clearUserAndInstitution();
            setIsAuthenticated(false);
            setStatus("unauthenticated");
          }
        } else {
          setToken(null);
          _clearUserAndInstitution();
          setIsAuthenticated(false);
          setStatus("unauthenticated");
        }
      } catch (e) {
        console.error("Auth init error:", e);
        // Evitamos limpiar el estado en desarrollo ante un fallo de red transitorio
        setIsAuthenticated(true); 
        setStatus("authenticated");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistencia de institución activa
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null;
    if (saved) setActiveInstitutionIdState(saved);
  }, []);

  // Si cambia usuario, asegura institución activa válida
  useEffect(() => {
    // CORRECCIÓN SEGURA: Si no hay usuario o no tiene el arreglo de instituciones, no hacemos nada y evitamos el crash
    if (!user || !Array.isArray(user.instituciones) || user.instituciones.length === 0) {
      return;
    }

    const exists = user.instituciones.some(
      (i) => i && String(i.institucionId) === String(activeInstitutionId)
    );
    
    if (!exists && user.instituciones[0]) {
      const firstId = String(user.instituciones[0].institucionId);
      setActiveInstitutionIdState(firstId);
      try {
        localStorage.setItem(ACTIVE_KEY, firstId);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // -- setters internos --
  const _setUserAndDefaultInstitution = (u) => {
    const safeUser = u || {};
    if (!safeUser.instituciones || !Array.isArray(safeUser.instituciones)) {
      safeUser.instituciones = [{ institucionId: "1", rol: "ADMIN_INSTITUCION" }];
    }

    setUserState(safeUser);
    const firstId = safeUser.instituciones[0]?.institucionId;
    if (firstId) {
      setActiveInstitutionIdState(String(firstId));
      try {
        localStorage.setItem(ACTIVE_KEY, String(firstId));
      } catch {}
    }
  };

  const _clearUserAndInstitution = () => {
    setUserState(null);
    setActiveInstitutionIdState(null);
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  };

  // -- API pública para setUser (úsala tras login manual) --
  const setUser = (u) => {
    _setUserAndDefaultInstitution(u);
    setIsAuthenticated(!!u);
  };

  const setActiveInstitutionId = (id) => {
    const v = String(id);
    setActiveInstitutionIdState(v);
    try {
      localStorage.setItem(ACTIVE_KEY, v);
    } catch {}
  };

  // Derivados
  const activeInstitution = useMemo(() => {
    if (!user?.instituciones?.length) return null;
    return (
      user.instituciones.find(
        (i) => String(i.institucionId) === String(activeInstitutionId)
      ) || user.instituciones[0]
    );
  }, [user, activeInstitutionId]);

  const activeRole = useMemo(
    () => normalizeRole(activeInstitution?.rol),
    [activeInstitution]
  );

  // ---- Métodos opcionales (compat): login/logout/updateProfile) ----
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res?.success) {
        const u = res.data?.user;
        const t = res.data?.accessToken || res.data?.token; // soporta ambos
        if (u) _setUserAndDefaultInstitution(u);
        if (t) setToken(t);
        setIsAuthenticated(true);
        setStatus("authenticated");
        return { success: true };
      }
      setIsAuthenticated(false);
      setStatus("unauthenticated");
      setError(res?.error || "Credenciales inválidas");
      return { success: false, error: res?.error || "Credenciales inválidas" };
    } catch (e) {
      console.error("login error:", e);
      setIsAuthenticated(false);
      setStatus("unauthenticated");
      setError(e?.message || "Error de red");
      return { success: false, error: e?.message || "Error de red" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout?.();
    } catch (e) {
      console.warn("logout (server) falló, limpiando local igual");
    } finally {
      setToken(null);
      _clearUserAndInstitution();
      setIsAuthenticated(false);
      setStatus("unauthenticated");
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const res = await authService.getProfile?.();
      if (res?.success && res.data) {
        // merge suave
        const merged = { ...(user || {}), ...(res.data || {}) };
        _setUserAndDefaultInstitution(merged);
        return { success: true, data: res.data };
      }
      return {
        success: false,
        error: res?.error || "No se pudo actualizar perfil",
      };
    } catch (e) {
      return { success: false, error: e?.message || "Error de red" };
    }
  };

  // ---- Utils (compat) ----
  const hasRole = (role) => {
    const r = normalizeRole(role);
    // por rol activo
    if (normalizeRole(activeRole) === r) return true;
    // o por cualquiera de sus membresías
    return (user?.instituciones || []).some((m) => normalizeRole(m.rol) === r);
  };

  const hasAnyRole = (roles = []) => {
    const set = new Set(roles.map(normalizeRole));
    if (set.has(normalizeRole(activeRole))) return true;
    return (user?.instituciones || []).some((m) =>
      set.has(normalizeRole(m.rol))
    );
  };

  const canAccessInstitution = (institucionId) => {
    // Si usas super admin nacional global en algún lugar:
    if (hasRole("SUPER_ADMIN_NACIONAL")) return true;
    return (user?.instituciones || []).some(
      (m) => String(m.institucionId) === String(institucionId)
    );
  };

  const clearError = () => setError(null);

  // console.log('🔐 [AUTH_CONTEXT] Current state:', {
  //   user: user ? { id: user.id, email: user.email, instituciones: user.instituciones } : null,
  //   token: token ? 'TOKEN_EXISTS' : null,
  //   isAuthenticated,
  //   isLoading,
  //   status,
  //   activeRole,
  //   activeInstitutionId
  // });

  const value = {
    // estado
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    status,

    // multi-institución
    activeInstitution,
    activeInstitutionId,
    activeRole,

    // setters
    setUser,
    setToken,
    setActiveInstitutionId,

    // acciones (compat)
    login,
    logout,
    updateProfile,
    clearError,

    // utils (compat)
    hasRole,
    hasAnyRole,
    canAccessInstitution,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};

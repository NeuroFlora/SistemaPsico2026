// middleware/auth.js
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const isActive = (s) =>
  ["ACTIVO", "ACTIVA", "ACTIVE"].includes(String(s || "").toUpperCase());

/**
 * Resuelve el institucionId objetivo a partir del request:
 * Prioridad: params > header > query > body
 */
function resolveInstitutionId(req) {
  const cand =
    req.params?.institucionId ??
    req.headers["x-institution-id"] ??    // inglés
    req.headers["x-institucion-id"] ??    // alias español (por si acaso)
    req.query?.institucionId ??
    req.body?.institucionId ??
    null;

  if (cand == null) return null;

  // Soporta arrays (por proxies), números o strings
  const val = String(Array.isArray(cand) ? cand[0] : cand).trim();

  // Evita valores vacíos o literales "null"/"undefined"
  if (!val || val.toLowerCase() === "null" || val.toLowerCase() === "undefined") {
    return null;
  }

  return val;
}

/**
 * Devuelve la membresía del usuario para una institución dada
 */
function getMembershipForInstitution(user, institucionId) {
  if (!user?.instituciones?.length || !institucionId) return null;
  return (
    user.instituciones.find(
      (m) => String(m.institucionId) === String(institucionId)
    ) || null
  );
}

/**
 * Middleware principal de autenticación JWT
 * - Carga usuario base
 * - Carga membresías (usuario_instituciones) + nombre/status de institución
 * - Arma req.user con { id, email, nombreCompleto, instituciones: [...] }
 * - Mantiene compat con usuarios.rol para SUPER_ADMIN_NACIONAL si aún lo usas
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
        code: "NO_TOKEN",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expirado",
          code: "TOKEN_EXPIRED",
        });
      }
      if (e.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Token inválido",
          code: "TOKEN_INVALID",
        });
      }
      throw e;
    }

    // 1) Usuario base (sin rol/inst única)
    const [userRows] = await pool.execute(
      `SELECT u.id, u.nombre, u.apellidoPaterno, u.apellidoMaterno, u.nombreCompleto, 
              u.email, u.status, u.emailVerificado, u.perfilCompletado, u.lastLogin, u.rol as rolGlobal
       FROM usuarios u
       WHERE u.id = ? AND u.status = 'ACTIVO'`,
      [decoded.id]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado o inactivo",
        code: "USER_NOT_FOUND",
      });
    }

    const base = userRows[0];

    // 2) Membresías por institución (ajusta nombres de tabla/columnas si difieren)
    // ---- consulta de membresías (usa tu tabla real) ----
    const [mRows] = await pool.execute(
      `SELECT ui.institucionId,
          ui.rolInstitucion AS rol,
          ui.activo AS membershipActiva,
          i.nombre AS institucionNombre,
          i.status AS institucionStatus
   FROM usuario_institucion ui
   JOIN instituciones i ON i.id = ui.institucionId
   WHERE ui.usuarioId = ?`,
      [decoded.id]
    );

    // ---- mapeo consistente ----
    const instituciones = (mRows || []).map((r) => ({
      institucionId: String(r.institucionId),
      institucionNombre: r.institucionNombre,
      rol: r.rol, // viene del AS rol
      institucionStatus: r.institucionStatus,
      membershipStatus: r.membershipActiva ? "ACTIVO" : "INACTIVO",
      isInstitucionActiva: isActive(r.institucionStatus),
      isMembershipActiva: !!r.membershipActiva,
    }));

    // Si no hay membresías y TAMPOCO es super admin global -> acceso denegado
    const isSuperAdminNacional =
      String(base.rolGlobal || "") === "SUPER_ADMIN_NACIONAL";
    if (!instituciones.length && !isSuperAdminNacional) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin instituciones asignadas",
        code: "NO_INSTITUTIONS",
      });
    }

    req.user = {
      id: base.id,
      nombre: base.nombre,
      apellidoPaterno: base.apellidoPaterno,
      apellidoMaterno: base.apellidoMaterno,
      nombreCompleto: base.nombreCompleto,
      email: base.email,
      status: base.status,
      emailVerificado: base.emailVerificado,
      perfilCompletado: base.perfilCompletado,
      lastLogin: base.lastLogin,
      // compat: dejar rol global SOLO para SUPER_ADMIN_NACIONAL
      rol: isSuperAdminNacional ? "SUPER_ADMIN_NACIONAL" : undefined,
      instituciones,
    };

    next();
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error interno del servidor",
        code: "INTERNAL_ERROR",
      });
  }
};

/**
 * Middleware GLOBAL por rol (¡ojo! no usa institución).
 * Úsalo solo para rutas “nacionales” (ej. panel nacional).
 * Acepta si el usuario:
 *   a) tiene rol global requerido (p.ej. SUPER_ADMIN_NACIONAL), o
 *   b) tiene CUALQUIER membresía con un rol permitido (si realmente quieres eso).
 * Si quieres atarlo a institución, usa requireRolesWithInstitution.
 */
const requireRoles = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Usuario no autenticado",
          code: "NOT_AUTHENTICATED",
        });
    }

    // a) rol global
    if (req.user.rol && roles.includes(req.user.rol)) return next();

    // b) CUALQUIER membresía (si no quieres esto, comenta este bloque)
    const hasAnyMembershipRole = (req.user.instituciones || []).some((m) =>
      roles.includes(m.rol)
    );
    if (hasAnyMembershipRole) return next();

    return res.status(403).json({
      success: false,
      message: "Permisos insuficientes",
      code: "INSUFFICIENT_PERMISSIONS",
      required: roles,
      current: req.user.rol || null,
    });
  };
};

/**
 * Verifica que el usuario tenga acceso a una institución específica
 * - SUPER_ADMIN_NACIONAL: acceso total
 * - Si no, debe tener membresía activa en esa institución
 * - La institución debe estar ACTIVA (si bloqueas acceso a inactivas)
 */
const requireInstitutionAccess = (req, res, next) => {
  const institucionId = resolveInstitutionId(req);
  if (!institucionId) {
    return res.status(400).json({
      success: false,
      message: "ID de institución requerido",
      code: "INSTITUTION_ID_REQUIRED",
    });
  }

  if (req.user?.rol === "SUPER_ADMIN_NACIONAL") return next();

  const membership = getMembershipForInstitution(req.user, institucionId);
  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "Sin acceso a esta institución",
      code: "INSTITUTION_ACCESS_DENIED",
    });
  }

  // Opcional: exigir que institución y membresía estén activas
  if (!membership.isInstitucionActiva) {
    return res.status(403).json({
      success: false,
      message: "Institución inactiva",
      code: "INSTITUTION_INACTIVE",
    });
  }
  if (!membership.isMembershipActiva) {
    return res.status(403).json({
      success: false,
      message: "Membresía inactiva en la institución",
      code: "MEMBERSHIP_INACTIVE",
    });
  }

  // Exponer en req para handlers posteriores
  req.institucionId = institucionId; // deja disponible para handlers
  req.membership = membership; // si quieres exponerlo

  next();
};

/**
 * Requiere rol específico en la institución objetivo
 * - SUPER_ADMIN_NACIONAL pasa directo
 * - Si no, valida que su rol en ESA institución esté en allowedRoles
 */
const requireRolesWithInstitution = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return [
    authenticateToken,
    requireInstitutionAccess,
    (req, res, next) => {
      if (req.user?.rol === "SUPER_ADMIN_NACIONAL") return next();
      const m =
        req.membership ||
        getMembershipForInstitution(req.user, resolveInstitutionId(req));
      if (!m) {
        return res.status(403).json({
          success: false,
          message: "Sin membresía en la institución objetivo",
          code: "NO_MEMBERSHIP_FOR_INSTITUTION",
        });
      }
      if (!roles.includes(m.rol)) {
        return res.status(403).json({
          success: false,
          message: "Permisos insuficientes en la institución",
          code: "INSUFFICIENT_INSTITUTION_PERMISSIONS",
          required: roles,
          current: m.rol,
        });
      }
      next();
    },
  ];
};

/** Solo SUPER_ADMIN_NACIONAL (global) */
const requireSuperAdminNacional = [
  authenticateToken,
  requireRoles("SUPER_ADMIN_NACIONAL"),
];

/** Admin de institución (permite SUPER_ADMIN_INSTITUCION, ADMIN_INSTITUCION y el nacional) */
const requireInstitutionAdmin = requireRolesWithInstitution([
  "ADMIN_INSTITUCION",
  "SUPER_ADMIN_INSTITUCION",
  "SUPER_ADMIN_NACIONAL", // por si tu membresía lo lleva como rol por inst (o por compat)
]);

/** Psicólogos (incluye admins y nacional) */
function requirePsychologist(req, res, next) {
  const rolesPermitidos = [
    "PSICOLOGO",
    "ORIENTADOR",
    "ADMIN_INSTITUCION",
    "SUPER_ADMIN_NACIONAL",
  ];
  if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
    return res
      .status(403)
      .json({ success: false, message: "Acceso no autorizado" });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireRoles,
  requireInstitutionAccess,
  requireRolesWithInstitution,
  requireSuperAdminNacional,
  requireInstitutionAdmin,
  requirePsychologist,
  // helpers por si los quieres usar en otros módulos:
  resolveInstitutionId,
  getMembershipForInstitution,
};

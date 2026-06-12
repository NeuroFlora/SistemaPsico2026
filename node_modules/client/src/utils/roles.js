// src/utils/roles.js
export const ROLE_ALIASES = {
  SUPER_ADMIN_NACIONAL: "SUPER_ADMIN_NACIONAL",
  "SUPER ADMIN NACIONAL": "SUPER_ADMIN_NACIONAL",
  SUPER_ADMIN_INSTITUCION: "SUPER_ADMIN_INSTITUCION",
  "SUPER ADMIN INSTITUCION": "SUPER_ADMIN_INSTITUCION",
  ADMIN_INSTITUCION: "ADMIN_INSTITUCION",
  "ADMIN INSTITUCION": "ADMIN_INSTITUCION",
  PSICOLOGO: "PSICOLOGO",
  PSICÓLOGO: "PSICOLOGO",
  TUTOR: "TUTOR",
  ORIENTADOR: "TUTOR", // ⬅️ alias clave
  ESTUDIANTE: "ESTUDIANTE",
};

export function normalizeRole(role) {
  if (!role) return undefined;
  const base = String(role)
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return ROLE_ALIASES[base] || base.replace(/\s+/g, "_");
}

export const roleGradient = {
  SUPER_ADMIN_NACIONAL: "from-purple-500 to-purple-700",
  SUPER_ADMIN_INSTITUCION: "from-blue-500 to-blue-700",
  ADMIN_INSTITUCION: "from-indigo-500 to-indigo-700", // ⬅️ faltaba
  PSICOLOGO: "from-green-500 to-green-700",
  TUTOR: "from-amber-500 to-amber-700",
  ESTUDIANTE: "from-pink-500 to-pink-700",
};

export const getRoleColor = (role) =>
  roleGradient[normalizeRole(role)] || "from-gray-500 to-gray-700";

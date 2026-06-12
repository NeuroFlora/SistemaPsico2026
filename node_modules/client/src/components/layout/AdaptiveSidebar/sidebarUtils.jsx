import { normalizeRole } from "../../../utils/roles";

export const getRoleColor = (rol) => {
  const role = normalizeRole(rol);
  const colors = {
    SUPER_ADMIN_NACIONAL: "from-[#4c1d95] to-[#527ceb]",
    SUPER_ADMIN_INSTITUCION: "from-[#527ceb] to-[#3730a3]",
    ADMIN_INSTITUCION: "from-[#3730a3] to-[#527ceb]",
    PSICOLOGO: "from-[#cdb4db] to-[#527ceb]",
    ESTUDIANTE: "from-[#527ceb] to-[#10cfbd]",
    ORIENTADOR: "from-[#3730a3] to-[#cdb4db]",
    TUTOR: "from-[#3730a3] to-[#cdb4db]",
  };
  return colors[role] || "from-gray-500 to-gray-700";
};

export const getRoleLabel = (rol) => {
  const role = normalizeRole(rol);
  const labels = {
    SUPER_ADMIN_NACIONAL: "Super Admin Nacional",
    SUPER_ADMIN_INSTITUCION: "Admin Institución",
    ADMIN_INSTITUCION: "Administrador/a de Institución",
    PSICOLOGO: "Psicólogo/a",
    ESTUDIANTE: "Estudiante",
    ORIENTADOR: "Orientador/a",
    TUTOR: "Tutor/a",
  };
  return labels[role] || role;
};

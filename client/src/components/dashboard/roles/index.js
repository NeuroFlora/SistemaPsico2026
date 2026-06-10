import SuperAdminNacional from "./SuperAdminNacional";
import SuperAdminInstitucion from "./SuperAdminInstitucion";
import AdminInstitucion from "./AdminInstitucion"; // crea este archivo si no existe
import Psicologo from "./Psicologo";
import Estudiante from "./Estudiante";
import Orientador from "./Orientador";

export const ROLE_COMPONENTS = {
  SUPER_ADMIN_NACIONAL: SuperAdminNacional,
  SUPER_ADMIN_INSTITUCION: SuperAdminInstitucion,
  ADMIN_INSTITUCION: AdminInstitucion,
  PSICOLOGO: Psicologo,
  ESTUDIANTE: Estudiante,
  TUTOR: Orientador, // alias de ORIENTADOR
  ORIENTADOR: Orientador,
};

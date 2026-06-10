import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../utils/constants";
import {
  Home,
  Users,
  Brain,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Bell,
  ChevronRight,
  Building,
  BarChart3,
  Calendar,
  FileText,
  Heart,
  ClipboardList,
  MessageSquare,
  BookOpen,
  UserPlus,
  TrendingUp,
} from "lucide-react";

const AdaptiveSidebar = ({ user, onLogout, isCollapsed, onToggle }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  // Función para obtener los elementos del menú según el rol
  const getMenuItems = () => {
    const baseItems = [
      {
        href: ROUTES.DASHBOARD,
        icon: Home,
        label: "Dashboard",
        roles: ["all"],
      },
    ];

    const roleSpecificItems = [
      // Super Admin Nacional
      {
        href: ROUTES.INSTITUCIONES,
        icon: Building,
        label: "Instituciones",
        roles: ["SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.ESTADISTICAS_GLOBALES,
        icon: TrendingUp,
        label: "Estadísticas Globales",
        roles: ["SUPER_ADMIN_NACIONAL"],
      },

      // Super Admin Institución
      {
        href: ROUTES.USUARIOS,
        icon: Users,
        label: "Gestión de Usuarios",
        roles: ["SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.PSICOLOGOS,
        icon: Brain,
        label: "Psicólogos",
        roles: ["SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.ESTUDIANTES,
        icon: GraduationCap,
        label: "Estudiantes",
        roles: ["SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.MODULOS,
        icon: Settings,
        label: "Módulos Sistema",
        roles: ["SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },

      // Psicólogo
      {
        href: ROUTES.QUIZ_APLICAR,
        icon: ClipboardList,
        label: "Aplicar Quiz",
        roles: ["PSICOLOGO", "SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.CANALIZACIONES,
        icon: Heart,
        label: "Canalizaciones",
        roles: ["PSICOLOGO", "SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.CITAS,
        icon: Calendar,
        label: "Gestión de Citas",
        roles: ["PSICOLOGO", "SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },
      {
        href: ROUTES.SESIONES,
        icon: MessageSquare,
        label: "Notas de Sesión",
        roles: ["PSICOLOGO", "SUPER_ADMIN_INSTITUCION", "SUPER_ADMIN_NACIONAL"],
      },

      // Estudiante
      {
        href: ROUTES.QUIZ_CONTESTAR,
        icon: FileText,
        label: "Contestar Quizzes",
        roles: ["ESTUDIANTE"],
      },
      {
        href: ROUTES.MIS_CITAS,
        icon: Calendar,
        label: "Mis Citas",
        roles: ["ESTUDIANTE"],
      },
      {
        href: ROUTES.RECOMENDACIONES,
        icon: BookOpen,
        label: "Recomendaciones",
        roles: ["ESTUDIANTE"],
      },

      // Orientador
      {
        href: "/orientacion",
        icon: UserPlus,
        label: "Orientación",
        roles: [
          "ORIENTADOR",
          "SUPER_ADMIN_INSTITUCION",
          "SUPER_ADMIN_NACIONAL",
        ],
      },

      // Reportes (para personal administrativo y psicológico)
      {
        href: "/reportes",
        icon: BarChart3,
        label: "Reportes",
        roles: [
          "PSICOLOGO",
          "SUPER_ADMIN_INSTITUCION",
          "SUPER_ADMIN_NACIONAL",
          "ORIENTADOR",
        ],
      },
    ];

    // Filtrar según el rol del usuario
    const filteredItems = roleSpecificItems.filter(
      (item) => item.roles.includes("all") || item.roles.includes(user?.rol)
    );

    return [...baseItems, ...filteredItems];
  };

  const menuItems = getMenuItems();

  // Función para obtener el color del rol
const getRoleColor = () => {
  const colors = {
    SUPER_ADMIN_NACIONAL: "from-[#4c1d95] to-[#527ceb]", // morado profundo → azul confianza
    ADMIN_INSTITUCION: "from-[#527ceb] to-[#3730a3]", // azul → morado institucional
    PSICOLOGO: "from-[#cdb4db] to-[#527ceb]", // lavanda → azul → calmante/terapéutico
    ESTUDIANTE: "from-[#527ceb] to-[#10cfbd]", // azul → turquesa → juvenil y fresco
    ORIENTADOR: "from-[#3730a3] to-[#cdb4db]", // morado oscuro → lavanda → guía/acompañamiento
  };
  return colors[user?.rol] || "from-gray-500 to-gray-700";
};

  // Función para obtener el label del rol
  const getRoleLabel = () => {
    const labels = {
      SUPER_ADMIN_NACIONAL: "Super Admin Nacional",
      SUPER_ADMIN_INSTITUCION: "Admin Institución",
      PSICOLOGO: "Psicólogo",
      ESTUDIANTE: "Estudiante",
      ORIENTADOR: "Orientador",
    };
    return labels[user?.rol] || user?.rol;
  };

  // Componente MenuItem, cambie los iconos y texto de gris a Blanco para ser mas notorios
  const MenuItem = ({ href, icon: Icon, label, isCollapsed }) => {
    const isActive = location.pathname === href;

    return (
      <div className="relative group">
        <Link
      to={href}
      className={`
        flex items-center px-4 py-3 text-sm font-medium rounded-xl
        transition-all duration-300
        ${
          isActive
            ? "bg-[#2b333c] text-white shadow-lg" // activo con texto blanco
            : "text-white hover:bg-[#2b333c]/50 hover:text-[#f0f0f0]" // inactivo con texto blanco
        }
        ${isCollapsed ? "justify-center px-3" : ""}
      `}
    >
      <Icon
        className={`
          ${isCollapsed ? "h-6 w-6" : "h-5 w-5 mr-3"}
          transition-transform duration-200
          ${isActive ? "" : "group-hover:scale-110"}
        `}
      />
      {!isCollapsed && <span>{label}</span>}
    </Link>

        {/* Tooltip para cuando está contraída */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-[#2b333c] text-[#f7f7f7] text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              {label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#2b333c]" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Función para manejar el toggle del menú de usuario
  const toggleUserMenu = () => {
    if (isCollapsed) {
      // Si está contraída, primero expandir
      onToggle();
      setTimeout(() => setShowUserMenu(true), 300);
    } else {
      // Si está expandida, toggle del menú
      setShowUserMenu(!showUserMenu);
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden
          transition-opacity duration-300
          ${!isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onToggle}
      />
      {/* cambie el color de la barra de un solido marino a un degradado entre morado y azul marino */}
      <div
        className={`
          bg-gradient-to-b from-purple-800 via-purple-400 to-blue-700
          border-r border-[#2b333c]/50
          transition-all duration-500 ease-in-out flex flex-col
          ${isCollapsed ? "w-20" : "w-64"}
          shadow-2xl z-30
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2b333c]/30">
          {!isCollapsed && (
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-[#f7f7f7]">
                Sistema Psicológico
              </h1>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-white hover:bg-[#2b333c]/50 hover:text-cyan-300
                     transition-all duration-300 hover:scale-110"
            title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Sección de Usuario */}
        <div className="p-4 border-b border-[#2b333c]/30">
          <div
            className={`
              group flex items-center cursor-pointer rounded-xl p-3
              bg-[#2b333c]/20 hover:bg-[#2b333c]/40
              transition-all duration-300
              ${isCollapsed ? "justify-center" : ""}
              ${showUserMenu && !isCollapsed ? "bg-[#2b333c]/40" : ""}
            `}
            onClick={toggleUserMenu}
            title={isCollapsed ? `Usuario: ${user?.nombreCompleto}` : ""}
          >
            <div className="relative">
              <div
                className={`
                flex items-center justify-center w-10 h-10 rounded-full shadow-lg 
                transition-all duration-300 group-hover:scale-105
                bg-gradient-to-br ${getRoleColor()}
              `}
              >
                <User className="h-5 w-5 text-[#f7f7f7]" />
              </div>
              {/* Indicador de estado online */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#10cfbd] rounded-full border-2 border-[#21252d]" />
            </div>

            {!isCollapsed && (
              <>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f7f7f7] truncate">
                    {user?.nombreCompleto}
                  </p>
                  <p className="text-xs text-[#7c777a] group-hover:text-[#f0f0f0] transition-colors truncate">
                    {getRoleLabel()}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-[#7c777a] group-hover:text-[#f0f0f0] transition-colors truncate">
                      {user.email}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#7c777a] transition-all duration-300 flex-shrink-0
                            ${showUserMenu ? "rotate-180 text-[#10cfbd]" : ""}`}
                />
              </>
            )}
          </div>

          {/* Menú desplegable del usuario CAMBIE LOS COLORES DEL TEXTO y el hover*/}
          {showUserMenu && !isCollapsed && (
            <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
              <Link
                to={ROUTES.PROFILE}
                className="flex items-center px-3 py-2 text-sm text-gray-100 hover:text-white 
           hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                Mi Perfil
              </Link>
              <Link
                to={ROUTES.NOTIFICATIONS}
                className="flex items-center px-3 py-2 text-sm text-gray-100 hover:text-white
           hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                Notificaciones
              </Link>
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm 
           text-gray-100 hover:text-red-500 
           hover:bg-red-500/20 
           rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2b333c]/30 mt-auto">
          {!isCollapsed ? (
            <div className="text-xs text-center space-y-2">
  <p className="font-semibold text-white">
    ¿Necesitas ayuda o soporte?
  </p>
  <Link
    to={ROUTES.SUPPORT}
    className="text-white hover:text-cyan-200 hover:underline transition-colors"
  >
    Contáctanos
  </Link>
</div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-2 h-2 bg-[#10cfbd] rounded-full animate-pulse"
                title="Sistema activo"
              />
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para móvil */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-40 p-3 bg-[#21252d] text-[#f7f7f7] 
                   rounded-xl shadow-2xl border border-[#2b333c]/50 lg:hidden
                   transition-all duration-300 hover:scale-110"
          title="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default AdaptiveSidebar;

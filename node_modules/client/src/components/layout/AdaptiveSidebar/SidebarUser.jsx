import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, ChevronDown, LogOut, Bell } from "lucide-react";
import { ROUTES } from "../../../utils/constants";
import { getRoleColor, getRoleLabel } from "./sidebarUtils";

// 👇 usa el contexto para rol/inst. activa
import { useAuth } from "../../../contexts/AuthContext";

const SidebarUser = ({ user, onLogout, isCollapsed }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { activeRole, activeInstitution } = useAuth();

  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);

  return (
    <div className="p-4 border-b border-[#2b333c]/30">
      <div
        className={`group flex items-center cursor-pointer rounded-xl p-3
          bg-[#2b333c]/20 hover:bg-[#2b333c]/40
          transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
        onClick={toggleUserMenu}
      >
        <div className="relative">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg 
              transition-all duration-300 group-hover:scale-105
              bg-gradient-to-br ${getRoleColor(activeRole)}`}
          >
            <User className="h-5 w-5 text-[#f7f7f7]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#10cfbd] rounded-full border-2 border-[#21252d]" />
        </div>

        {!isCollapsed && (
          <>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f7f7f7] truncate">
                {user?.nombreCompleto}
              </p>
              <p className="text-xs text-[#7c777a] truncate">
                {activeInstitution?.institucionNombre || "—"} •{" "}
                {getRoleLabel(activeRole)}
              </p>
              {user?.email && (
                <p className="text-xs text-[#7c777a] truncate">{user.email}</p>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#7c777a] transition-all duration-300 flex-shrink-0
                ${showUserMenu ? "rotate-180 text-[#10cfbd]" : ""}`}
            />
          </>
        )}
      </div>

      {showUserMenu && !isCollapsed && (
        <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
          <Link
            to={ROUTES.PROFILE}
            className="flex items-center px-3 py-2 text-sm text-[#7c777a] hover:text-[#f7f7f7] 
                     hover:bg-[#2b333c]/50 rounded-lg transition-all duration-200"
          >
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            Mi Perfil
          </Link>
          <Link
            to="/notificaciones"
            className="flex items-center px-3 py-2 text-sm text-[#7c777a] hover:text-[#f7f7f7] 
                     hover:bg-[#2b333c]/50 rounded-lg transition-all duration-200"
          >
            <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
            Notificaciones
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-[#ef4444] 
                     hover:text-[#f87171] hover:bg-[#ef4444]/10 
                     rounded-lg transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarUser;

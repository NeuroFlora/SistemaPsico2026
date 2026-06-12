import React from "react";
import { Link } from "react-router-dom";

const SidebarFooter = ({ isCollapsed }) => {
  return (
    <div className="p-4 border-t border-[#2b333c]/30 mt-auto">
      {!isCollapsed ? (
        <div className="text-xs text-[#7c777a] text-center space-y-2">
          <p className="font-medium text-[#f7f7f7]">
            ¿Necesitas ayuda o soporte?
          </p>
          <Link
            to="/soporte"
            className="text-[#10cfbd] hover:underline transition-colors hover:text-[#10cfbd]/80"
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
  );
};

export default SidebarFooter;

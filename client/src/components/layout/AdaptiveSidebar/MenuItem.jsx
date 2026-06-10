import React from "react";
import { Link, useLocation } from "react-router-dom";

const MenuItem = ({ href, icon: Icon, label, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
   <Link
      to={href}
      className={`
        flex items-center px-4 py-3 text-sm font-medium rounded-xl
        transition-all duration-300
        ${
          isActive
            ? "bg-[#2b333c] text-white shadow-lg" // activo con texto blanco
            : "text-white hover:bg-[#2b333c]/50 hover:text-[#f0f0f0]" // inactivo con texto blancos
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
  );
};

export default MenuItem;

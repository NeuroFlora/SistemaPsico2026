import React from "react";
import { baseItems, roleSpecificItems } from "./sidebarConfig";
import MenuItem from "./MenuItem";
import SidebarHeader from "./SidebarHeader";
import SidebarUser from "./SidebarUser";
import SidebarFooter from "./SidebarFooter";

import { useAuth } from "../../../contexts/AuthContext";
import { normalizeRole } from "../../../utils/roles";

const AdaptiveSidebar = ({ user, onLogout, isCollapsed, onToggle }) => {
  const { activeRole } = useAuth();

  // 1) rol desde contexto; 2) fallback al legacy user?.rol; 3) "DESCONOCIDO"
  const resolvedRole =
    normalizeRole(activeRole) || normalizeRole(user?.rol) || "DESCONOCIDO";

  const canSee = (item) =>
    item.roles.includes("all") ||
    item.roles.map(normalizeRole).includes(resolvedRole);

  const menuItems = [...baseItems, ...roleSpecificItems.filter(canSee)];

  // DEBUG (borra si quieres)
  console.log("[Sidebar] role:", resolvedRole, "items:", menuItems.map(i => i.label));

  return (
    <div
      className={`sticky top-0 h-screen min-h-0 bg-[#21252d] overflow-hidden border-r border-[#2b333c]/50 shadow-2xl
      flex flex-col transition-all duration-500 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <SidebarHeader isCollapsed={isCollapsed} onToggle={onToggle} />
      <SidebarUser user={user} onLogout={onLogout} isCollapsed={isCollapsed} />
      <nav className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto overscroll-contain sidebar-scroll">
        {menuItems.map((item) => (
          <MenuItem key={item.href} {...item} isCollapsed={isCollapsed} />
        ))}
      </nav>
      <SidebarFooter isCollapsed={isCollapsed} />
    </div>
  );
};

export default AdaptiveSidebar;

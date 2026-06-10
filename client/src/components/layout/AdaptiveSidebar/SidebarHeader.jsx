import React from "react";
import { ChevronRight, X } from "lucide-react";

const SidebarHeader = ({ isCollapsed, onToggle }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#2b333c]/30">
      {!isCollapsed && (
        <h1 className="text-xl font-bold text-[#f7f7f7]">
          Sistema Psicológico
        </h1>
      )}
      <button
        onClick={onToggle}
        className="p-2 rounded-lg text-[#7c777a] hover:bg-[#2b333c]/50 hover:text-[#f7f7f7] 
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
  );
};

export default SidebarHeader;

"use client";
import React from "react";
import { useAuth } from "../../contexts/AuthContext"; // ajusta ruta si cambia
import { ROLE_COMPONENTS } from "./roles";
import { normalizeRole } from "../../utils/roles"; // ajusta ruta si cambia

const RoleRenderer = ({ rol }) => {
  const { activeRole } = useAuth();
  const resolved = normalizeRole(rol || activeRole);
  const Cmp = ROLE_COMPONENTS[resolved];

  if (!Cmp) {
    return (
      <div className="text-center py-12 text-gray-600">
        No hay contenido para el rol{" "}
        <span className="font-semibold">{resolved || "desconocido"}</span>.
      </div>
    );
  }
  return <Cmp />;
};

export default RoleRenderer;

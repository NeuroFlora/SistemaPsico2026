"use client";
import React from "react";
import { useAuth } from "../../contexts/AuthContext"; // ajusta ruta si cambia
import { getRoleColor, normalizeRole } from "../../utils/roles";

const ROLE_LABEL = {
  SUPER_ADMIN_NACIONAL: "Sistema Nacional",
  SUPER_ADMIN_INSTITUCION: "Administrador/a de Institución",
  ADMIN_INSTITUCION: "Administrador/a de Institución",
  PSICOLOGO: "Psicólogo/a",
  TUTOR: "Tutor/a",
  ESTUDIANTE: "Estudiante",
};

export default function GreetingHeader() {
  const { user, activeInstitution, activeRole } = useAuth();
  const roleKey = normalizeRole(activeRole);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.nombre || "Usuario"}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeInstitution?.institucionNombre
              ? `${activeInstitution.institucionNombre} • `
              : ""}
            {ROLE_LABEL[roleKey] || "Usuario"}
          </p>
        </div>
        <div
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRoleColor(
            roleKey
          )} flex items-center justify-center shadow-lg`}
        >
          <span className="text-white text-xl font-bold">
            {user?.nombre?.charAt(0) || "U"}
          </span>
        </div>
      </div>
    </div>
  );
}

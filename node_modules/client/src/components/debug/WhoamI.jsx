"use client";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function WhoAmI() {
  const { user, activeRole, activeInstitution, activeInstitutionId } =
    useAuth();
  return (
    <pre className="text-xs bg-gray-50 border rounded p-3">
      {JSON.stringify(
        {
          activeRole,
          activeInstitutionId,
          activeInstitution,
          instituciones: user?.instituciones,
        },
        null,
        2
      )}
    </pre>
  );
}

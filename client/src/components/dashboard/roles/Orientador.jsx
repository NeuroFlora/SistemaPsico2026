import React from "react";
import StatCard from "../StatCard";
import { Card, CardContent } from "../../../components/ui/Card";
import { Users, FileText, Calendar, AlertCircle } from "lucide-react";

const Orientador = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Estudiantes Atendidos"
          value="67"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Evaluaciones Pendientes"
          value="11"
          icon={FileText}
          color="bg-orange-500"
        />
        <StatCard
          title="Citas Programadas"
          value="9"
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="Alertas Activas"
          value="4"
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumen del Día</h3>
          <p className="text-sm text-gray-600">
            Tienes 3 seguimientos prioritarios y 2 nuevas solicitudes.
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default Orientador;

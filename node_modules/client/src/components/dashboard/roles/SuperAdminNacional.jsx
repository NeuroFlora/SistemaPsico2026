import React from "react";
import StatCard from "../StatCard";
import { Card, CardContent } from "../../../components/ui/Card";
import { Users, FileText, AlertCircle } from "lucide-react";

const SuperAdminNacional = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Instituciones Activas"
          value="24"
          icon={Users}
          color="bg-blue-500"
          trend="8"
        />
        <StatCard
          title="Usuarios Totales"
          value="1,248"
          icon={Users}
          color="bg-green-500"
          trend="12"
        />
        <StatCard
          title="Evaluaciones Realizadas"
          value="3,456"
          icon={FileText}
          color="bg-purple-500"
          trend="15"
        />
        <StatCard
          title="Casos Activos"
          value="89"
          icon={AlertCircle}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Instituciones por Región
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Centro</span>
                <span className="font-medium">8 instituciones</span>
              </div>
              <div className="flex justify-between">
                <span>Norte</span>
                <span className="font-medium">6 instituciones</span>
              </div>
              <div className="flex justify-between">
                <span>Sur</span>
                <span className="font-medium">10 instituciones</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Nueva institución registrada</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Reporte mensual generado</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Actualización del sistema</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SuperAdminNacional;

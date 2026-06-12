import React from "react";
import StatCard from "../StatCard";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  Brain,
  Users,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";

const SuperAdminInstitucion = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Psicólogos Activos"
          value="8"
          icon={Brain}
          color="bg-green-500"
        />
        <StatCard
          title="Estudiantes Registrados"
          value="1,245"
          icon={Users}
          color="bg-blue-500"
          trend="5"
        />
        <StatCard
          title="Evaluaciones este Mes"
          value="156"
          icon={FileText}
          color="bg-purple-500"
          trend="23"
        />
        <StatCard
          title="Citas Programadas"
          value="34"
          icon={Calendar}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estado de Módulos</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Módulo Psicológico</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Evaluaciones</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Citas</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  Configurando
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Últimas Acciones</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Psicólogo registrado</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Evaluación pendiente</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm">10 estudiantes nuevos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SuperAdminInstitucion;

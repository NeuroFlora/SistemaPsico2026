import React from "react";
import StatCard from "../StatCard";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  Users,
  FileText,
  Calendar,
  Heart,
  AlertCircle,
  Clock,
} from "lucide-react";

const Psicologo = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Estudiantes Asignados"
          value="42"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Evaluaciones Pendientes"
          value="8"
          icon={FileText}
          color="bg-orange-500"
        />
        <StatCard
          title="Citas Esta Semana"
          value="12"
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="Casos Canalizados"
          value="5"
          icon={Heart}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Próximas Citas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Ana García</p>
                  <p className="text-sm text-gray-600">Seguimiento</p>
                </div>
                <span className="text-sm text-gray-500">14:00</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Carlos López</p>
                  <p className="text-sm text-gray-600">Primera consulta</p>
                </div>
                <span className="text-sm text-gray-500">15:30</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Casos Prioritarios</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">2 casos de alto riesgo</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">3 seguimientos pendientes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Psicologo;

import React, { useState, useEffect } from "react";
import StatCard from "../StatCard";
import { Card, CardContent } from "../../../components/ui/Card";
import { CheckCircle, Calendar, BookOpen, Heart, User, GraduationCap } from "lucide-react";
import { API_CONFIG } from "../../../utils/constants";

const Estudiante = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.API_BASE}/dashboard/student`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      } else {
        throw new Error('Error al cargar datos del dashboard');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  const stats = dashboardData?.estadisticas || {};
  const estudiante = dashboardData?.estudiante || {};
  const psicologo = dashboardData?.psicologo || {};
  const recomendaciones = dashboardData?.recomendaciones || [];

  return (
    <>
      {/* Información del estudiante */}
      {estudiante.carrera && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{estudiante.carrera}</h3>
                <p className="text-gray-600">
                  {estudiante.semestre}° Semestre • Turno {estudiante.turno?.toLowerCase()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Evaluaciones Completadas"
          value={stats.evaluaciones_completadas?.toString() || "0"}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Próximas Citas"
          value={stats.proximas_citas?.toString() || "0"}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          title="Evaluaciones Disponibles"
          value={stats.quizzes_disponibles?.toString() || "0"}
          icon={BookOpen}
          color="bg-purple-500"
        />
        <StatCard
          title="Promedio Puntaje"
          value={stats.promedio_puntaje ? `${stats.promedio_puntaje}%` : "N/A"}
          icon={Heart}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del psicólogo asignado */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mi Psicólogo/a</h3>
            {psicologo ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{psicologo.psicologo_nombre}</p>
                    <p className="text-sm text-gray-600">
                      {psicologo.psicologo_email}
                    </p>
                  </div>
                </div>
                {stats.ultima_evaluacion && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Última evaluación: {new Date(stats.ultima_evaluacion).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No tienes psicólogo asignado aún</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recursos recomendados */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recursos Recomendados</h3>
            <div className="space-y-3">
              {recomendaciones.map((rec, index) => {
                const colorClasses = {
                  blue: "bg-blue-50 text-blue-900 border-blue-200",
                  green: "bg-green-50 text-green-900 border-green-200",
                  purple: "bg-purple-50 text-purple-900 border-purple-200",
                  orange: "bg-orange-50 text-orange-900 border-orange-200"
                };

                return (
                  <div key={index} className={`p-3 rounded-lg border ${colorClasses[rec.color] || colorClasses.blue}`}>
                    <p className="font-medium">{rec.titulo}</p>
                    <p className="text-sm opacity-80">{rec.descripcion}</p>
                  </div>
                );
              })}

              {recomendaciones.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">No hay recomendaciones disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Estudiante;

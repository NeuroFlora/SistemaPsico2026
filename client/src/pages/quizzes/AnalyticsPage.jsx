import React from "react";
import { quizzesApi } from "../../services/quizzesService";
import SeverityBadge from "../../components/quizzes/SeverityBadge";
import { useAuth } from "../../contexts/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import {
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

const ADMIN_ROLES = new Set([
  USER_ROLES.PSICOLOGO,
  USER_ROLES.ORIENTADOR,
  USER_ROLES.ADMIN_INSTITUCION,
  USER_ROLES.SUPER_ADMIN_INSTITUCION,
  USER_ROLES.SUPER_ADMIN_NACIONAL,
]);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const canAccess = ADMIN_ROLES.has(user?.rol) ||
    user?.instituciones?.some(i => ADMIN_ROLES.has(i.rol));

  const [institutionId, setInstitutionId] = React.useState(
    user?.instituciones?.find((m) => m.isMembershipActiva)?.institucionId ||
      user?.instituciones?.[0]?.institucionId ||
      ""
  );

  const [dateRange, setDateRange] = React.useState({
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    hasta: new Date().toISOString().split('T')[0] // today
  });

  const [selectedQuizCode, setSelectedQuizCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [analytics, setAnalytics] = React.useState(null);

  const fetchAnalytics = React.useCallback(() => {
    if (!institutionId) return;

    setLoading(true);
    setError("");

    quizzesApi
      .analytics({
        institutionId,
        codigo: selectedQuizCode || undefined,
        desde: dateRange.desde,
        hasta: dateRange.hasta
      })
      .then((res) => {
        setAnalytics(res.data || null);
      })
      .catch((e) => setError(e.data?.message || e.message || "Error cargando analytics"))
      .finally(() => setLoading(false));
  }, [institutionId, selectedQuizCode, dateRange]);

  React.useEffect(() => {
    if (canAccess) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, canAccess]);

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a los análisis estadísticos.</p>
        </div>
      </div>
    );
  }

  const severityDistribution = analytics?.severityDistribution || {};
  const totalResponses = Object.values(severityDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <ChartBarIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Análisis Estadístico</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Visualiza tendencias y patrones en las evaluaciones de bienestar mental de tu institución.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Análisis</h3>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institución</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {(user?.instituciones || []).map((m) => (
                  <option key={m.institucionId} value={m.institucionId}>
                    {m.institucionNombre || m.institucionId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evaluación</label>
              <select
                value={selectedQuizCode}
                onChange={(e) => setSelectedQuizCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las evaluaciones</option>
                <option value="BAI">BAI - Ansiedad</option>
                <option value="BDI2">BDI-II - Depresión</option>
                <option value="PHQ9">PHQ-9 - Depresión</option>
                <option value="GAD7">GAD-7 - Ansiedad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
              <input
                type="date"
                value={dateRange.desde}
                onChange={(e) => setDateRange(prev => ({ ...prev, desde: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
              <input
                type="date"
                value={dateRange.hasta}
                onChange={(e) => setDateRange(prev => ({ ...prev, hasta: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generando..." : "Actualizar Análisis"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generando análisis estadístico...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalResponses || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Estudiantes Únicos</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.uniqueStudents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Puntaje Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.averageScore ? Math.round(analytics.averageScore * 10) / 10 : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Período Analizado</p>
                    <p className="text-sm font-bold text-gray-900">
                      {Math.ceil((new Date(dateRange.hasta) - new Date(dateRange.desde)) / (1000 * 60 * 60 * 24))} días
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Distribución por Severidad</h3>

              {totalResponses > 0 ? (
                <div className="space-y-4">
                  {['MINIMA', 'LEVE', 'MODERADA', 'SEVERA'].map((severity) => {
                    const count = severityDistribution[severity] || 0;
                    const percentage = Math.round((count / totalResponses) * 100);

                    return (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SeverityBadge value={severity} size="md" showTooltip={true} />
                          <span className="text-sm text-gray-600">
                            {count} estudiante{count !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                severity === 'MINIMA' ? 'bg-green-500' :
                                severity === 'LEVE' ? 'bg-yellow-500' :
                                severity === 'MODERADA' ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay datos disponibles para el período seleccionado.
                </p>
              )}
            </div>

            {/* Recent Trends */}
            {analytics.recentTrends && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Tendencias Recientes</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Evaluaciones por Semana</h4>
                    <div className="space-y-2">
                      {analytics.recentTrends.weeklyResponses?.map((week, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">Semana {index + 1}</span>
                          <span className="font-medium">{week.count} evaluaciones</span>
                        </div>
                      )) || <p className="text-gray-500 text-sm">No hay datos disponibles</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Alertas de Severidad Alta</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Casos severos</span>
                        <span className="font-medium text-red-600">
                          {severityDistribution.SEVERA || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Casos moderados</span>
                        <span className="font-medium text-orange-600">
                          {severityDistribution.MODERADA || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <ChartBarIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-600">
              Selecciona una institución y período para generar el análisis estadístico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
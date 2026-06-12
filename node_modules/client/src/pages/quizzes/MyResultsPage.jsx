import React from "react";
import { quizzesApi } from "../../services/quizzesService";
import SeverityBadge from "../../components/quizzes/SeverityBadge";
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function MyResultsPage() {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState("");
  const [sortBy, setSortBy] = React.useState("fecha");
  const [sortOrder, setSortOrder] = React.useState("desc");

  React.useEffect(() => {
    let alive = true;

    // Debug: Check current user
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log("👤 Current user ID:", user.id);
        console.log("👤 Current user email:", user.email);
      } catch (e) {
        console.error("❌ Error parsing user data:", e);
      }
    } else {
      console.warn("⚠️ No user data in localStorage");
    }

    quizzesApi
      .myResults()
      .then((res) => {
        console.log("📊 Quiz results received:", res);
        alive && setRows(res.data || []);
      })
      .catch((e) => {
        console.error("❌ Error fetching results:", e);
        setError(e.data?.message || e.message || "Error cargando resultados");
      })
      .finally(() => setLoading(false));
    return () => (alive = false);
  }, []);

  const sortedRows = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "fecha":
          aVal = new Date(a.fechaEnvio);
          bVal = new Date(b.fechaEnvio);
          break;
        case "titulo":
          aVal = a.titulo.toLowerCase();
          bVal = b.titulo.toLowerCase();
          break;
        case "codigo":
          aVal = a.codigo.toLowerCase();
          bVal = b.codigo.toLowerCase();
          break;
        case "puntaje":
          aVal = Number(a.puntajeTotal);
          bVal = Number(b.puntajeTotal);
          break;
        case "severidad":
          const severityOrder = { "MINIMA": 1, "LEVE": 2, "MODERADA": 3, "SEVERA": 4 };
          aVal = severityOrder[a.severidad] || 0;
          bVal = severityOrder[b.severidad] || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [rows, sortBy, sortOrder]);

  const stats = React.useMemo(() => {
    if (rows.length === 0) return null;

    const totalQuizzes = rows.length;
    const uniqueQuizzes = new Set(rows.map(r => r.codigo)).size;
    const avgScore = rows.reduce((sum, r) => sum + Number(r.puntajeTotal), 0) / totalQuizzes;
    const latestResult = rows.reduce((latest, current) =>
      new Date(current.fechaEnvio) > new Date(latest.fechaEnvio) ? current : latest
    );

    const severityCounts = rows.reduce((acc, r) => {
      acc[r.severidad] = (acc[r.severidad] || 0) + 1;
      return acc;
    }, {});

    return {
      totalQuizzes,
      uniqueQuizzes,
      avgScore: Math.round(avgScore * 10) / 10,
      latestResult,
      severityCounts
    };
  }, [rows]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <TrophyIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Resultados</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Revisa el historial completo de tus evaluaciones y el progreso en tu bienestar mental.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardDocumentListIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aún no tienes resultados</h3>
            <p className="text-gray-600 mb-6">
              Completa tu primera evaluación para comenzar a ver tu progreso aquí.
            </p>
            <a
              href="/quiz/contestar"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Ver Evaluaciones Disponibles
            </a>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Evaluaciones</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tipos Únicos</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.uniqueQuizzes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <TrophyIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Puntaje Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Última Evaluación</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(stats.latestResult.fechaEnvio).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Historial de Evaluaciones</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Haz clic en las columnas para ordenar los resultados
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("fecha")}
                      >
                        <div className="flex items-center gap-1">
                          Fecha
                          {sortBy === "fecha" && (
                            <span className="text-blue-600">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("titulo")}
                      >
                        <div className="flex items-center gap-1">
                          Evaluación
                          {sortBy === "titulo" && (
                            <span className="text-blue-600">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("codigo")}
                      >
                        <div className="flex items-center gap-1">
                          Código
                          {sortBy === "codigo" && (
                            <span className="text-blue-600">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-700">Versión</th>
                      <th
                        className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("puntaje")}
                      >
                        <div className="flex items-center gap-1">
                          Puntaje
                          {sortBy === "puntaje" && (
                            <span className="text-blue-600">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("severidad")}
                      >
                        <div className="flex items-center gap-1">
                          Severidad
                          {sortBy === "severidad" && (
                            <span className="text-blue-600">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedRows.map((r, index) => (
                      <tr key={r.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="p-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {new Date(r.fechaEnvio).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(r.fechaEnvio).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="font-medium text-gray-900">{r.titulo}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {r.codigo}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{r.version}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="text-lg font-bold text-gray-900">{r.puntajeTotal}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <SeverityBadge value={r.severidad} showTooltip={true} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { quizzesApi } from "../../services/quizzesService";
import { ROUTES } from "../../utils/constants";
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

export default function PublicQuizzesPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  React.useEffect(() => {
    let alive = true;
    quizzesApi
      .listPublic()
      .then((res) => alive && setItems(res.data || []))
      .catch((e) =>
        setError(e.data?.message || e.message || "Error cargando quizzes")
      )
      .finally(() => setLoading(false));
    return () => (alive = false);
  }, []);

  const filteredItems = React.useMemo(() => {
    return items.filter(quiz => {
      const matchesSearch = quiz.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (quiz.descripcion && quiz.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || quiz.codigo.toLowerCase().includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const categories = React.useMemo(() => {
    const codes = items.map(q => q.codigo);
    const uniqueCodes = [...new Set(codes)];
    return uniqueCodes;
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando quizzes disponibles...</p>
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
            <ClipboardDocumentListIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluaciones Disponibles</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Completa las evaluaciones psicológicas para obtener información valiosa sobre tu bienestar mental y emocional.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar evaluaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(code => (
                  <option key={code} value={code.toLowerCase()}>{code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay evaluaciones disponibles</h3>
            <p className="text-gray-600">
              Actualmente no hay evaluaciones públicas activas. Contacta a tu institución para más información.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros de búsqueda o explora todas las evaluaciones disponibles.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando {filteredItems.length} de {items.length} evaluaciones disponibles
              </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {q.codigo}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Versión {q.version}</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {q.titulo}
                    </h3>

                    {q.descripcion && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {q.descripcion}
                      </p>
                    )}

                    {q.estimatedTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <ClockIcon className="h-4 w-4" />
                        <span>~{q.estimatedTime} minutos</span>
                      </div>
                    )}

                    <Link
                      to={ROUTES.QUIZ_CONTESTAR_DETALLE.replace(":quizId", q.id)}
                      className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium group"
                    >
                      <span>Comenzar Evaluación</span>
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Público</span>
                      <span>Disponible ahora</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

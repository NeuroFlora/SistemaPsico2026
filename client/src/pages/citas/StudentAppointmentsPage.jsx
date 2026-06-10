// client/src/pages/citas/StudentAppointmentsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/authUtils";
import AppointmentBookingForm from "../../components/citas/AppointmentBookingForm";

const StudentAppointmentsPage = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [filters, setFilters] = useState({
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    cargarCitas();
  }, [filters]);

  const cargarCitas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await authenticatedFetch(
        `/api/citas/mis-citas?${params}`
      );
      if (response && response.ok) {
        const result = await response.json();
        setCitas(result.data.citas || []);
      }
    } catch (error) {
      console.error("Error cargando citas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (citaId) => {
    if (!confirm("¿Estás seguro de que quieres cancelar esta cita?")) return;

    try {
      const response = await authenticatedFetch(
        `/api/citas/${citaId}/cancelar`,
        {
          method: "PATCH",
          body: JSON.stringify({ motivo: "Cancelada por el estudiante" }),
        }
      );

      if (response && response.ok) {
        cargarCitas(); // Recargar la lista
      }
    } catch (error) {
      console.error("Error cancelando cita:", error);
    }
  };

  const handleBookingSuccess = (nuevaCita) => {
    setShowBookingForm(false);
    setCitas((prev) => [nuevaCita, ...prev]);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      SOLICITADA: "bg-yellow-100 text-yellow-800",
      CONFIRMADA: "bg-green-100 text-green-800",
      EN_PROGRESO: "bg-blue-100 text-blue-800",
      COMPLETADA: "bg-gray-100 text-gray-800",
      CANCELADA: "bg-red-100 text-red-800",
      NO_ASISTIO: "bg-orange-100 text-orange-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      SOLICITADA: "Solicitada",
      CONFIRMADA: "Confirmada",
      EN_PROGRESO: "En Progreso",
      COMPLETADA: "Completada",
      CANCELADA: "Cancelada",
      NO_ASISTIO: "No Asistió",
    };
    return textos[estado] || estado;
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (showBookingForm) {
    return (
      <AppointmentBookingForm
        onSuccess={handleBookingSuccess}
        onCancel={() => setShowBookingForm(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Citas</h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus citas con psicólogos
            </p>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Nueva Cita
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, estado: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="SOLICITADA">Solicitada</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="EN_PROGRESO">En Progreso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    fechaDesde: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    fechaHasta: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({ estado: "", fechaDesde: "", fechaHasta: "" })
                }
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Citas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando citas...</span>
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No tienes citas programadas
          </h3>
          <p className="text-gray-600 mb-4">
            Agenda tu primera cita con un psicólogo
          </p>
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Solicitar Cita
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Dr. {cita.psicologoNombre}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                          cita.estado
                        )}`}
                      >
                        {getEstadoTexto(cita.estado)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">📅</span>
                        <span>{formatearFecha(cita.fechaHora)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">⏱️</span>
                        <span>{cita.duracion} minutos</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">💻</span>
                        <span>
                          {cita.modalidad === "PRESENCIAL"
                            ? "Presencial"
                            : "Virtual"}
                        </span>
                      </div>

                      {cita.ubicacion && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">📍</span>
                          <span>{cita.ubicacion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {/* Botón Ver Detalles */}
                    <button
                      onClick={() => navigate(`/cita/${cita.id}`)}
                      className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      Ver
                    </button>

                    {/* Botón Cancelar (solo si es posible) */}
                    {["SOLICITADA", "CONFIRMADA"].includes(cita.estado) && (
                      <button
                        onClick={() => handleCancelAppointment(cita.id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Motivo */}
                {cita.motivo && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Motivo:</span> {cita.motivo}
                    </p>
                  </div>
                )}

                {/* Notas del psicólogo */}
                {cita.notasPsicologo && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notas del psicólogo:</span>{" "}
                      {cita.notasPsicologo}
                    </p>
                  </div>
                )}

                {/* Información adicional para citas en progreso/completadas */}
                {(cita.horaInicioReal || cita.horaFinReal) && (
                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {cita.horaInicioReal && (
                        <div>
                          <span className="font-medium">Inicio real:</span>{" "}
                          {formatearFecha(cita.horaInicioReal)}
                        </div>
                      )}
                      {cita.horaFinReal && (
                        <div>
                          <span className="font-medium">Fin real:</span>{" "}
                          {formatearFecha(cita.horaFinReal)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAppointmentsPage;

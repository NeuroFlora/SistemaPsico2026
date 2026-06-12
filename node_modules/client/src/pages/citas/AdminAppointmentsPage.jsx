// client/src/pages/citas/AdminAppointmentsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, APPOINTMENT_STATUSES, APPOINTMENT_MODALITIES } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

const AdminAppointmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    psicologoId: '',
    estudianteId: '',
    modalidad: ''
  });

  const [psicologos, setPsicologos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0
  });

  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPsychologists();
    loadAppointments();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filters, currentPage]);

  const loadPsychologists = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/usuarios/psicologos`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setPsicologos(result.data || []);
      }
    } catch (error) {
      console.error("Error loading psychologists:", error);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Agregar filtros
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      params.append('page', currentPage);
      params.append('limit', 20);

      const response = await fetch(`${API_CONFIG.API_BASE}/citas/admin?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setAppointments(result.data?.appointments || []);
        setStats(result.data?.stats || stats);
        setTotalPages(result.data?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      psicologoId: '',
      estudianteId: '',
      modalidad: ''
    });
    setCurrentPage(1);
  };

  const toggleSelectAppointment = (appointmentId) => {
    setSelectedAppointments(prev =>
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const selectAllAppointments = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map(apt => apt.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedAppointments.length === 0) return;

    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/bulk/${action}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ appointmentIds: selectedAppointments }),
      });

      if (response.ok) {
        loadAppointments();
        setSelectedAppointments([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
    }
  };

  const exportAppointments = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`${API_CONFIG.API_BASE}/citas/export?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `citas_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting appointments:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [APPOINTMENT_STATUSES.SOLICITADA]: 'bg-yellow-100 text-yellow-800',
      [APPOINTMENT_STATUSES.CONFIRMADA]: 'bg-blue-100 text-blue-800',
      [APPOINTMENT_STATUSES.EN_PROGRESO]: 'bg-green-100 text-green-800',
      [APPOINTMENT_STATUSES.COMPLETADA]: 'bg-gray-100 text-gray-800',
      [APPOINTMENT_STATUSES.CANCELADA]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      [APPOINTMENT_STATUSES.SOLICITADA]: 'Pendiente',
      [APPOINTMENT_STATUSES.CONFIRMADA]: 'Confirmada',
      [APPOINTMENT_STATUSES.EN_PROGRESO]: 'En progreso',
      [APPOINTMENT_STATUSES.COMPLETADA]: 'Completada',
      [APPOINTMENT_STATUSES.CANCELADA]: 'Cancelada',
    };
    return texts[status] || status;
  };

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administración de Citas</h1>
              <p className="text-gray-600 mt-1">Gestiona todas las citas de la institución</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportAppointments}
                className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                📊 Exportar
              </button>
              <button
                onClick={() => navigate('/citas/reportes')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📈 Ver Reportes
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmadas}</div>
            <div className="text-sm text-gray-600">Confirmadas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-red-600">{stats.canceladas}</div>
            <div className="text-sm text-gray-600">Canceladas</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {Object.values(APPOINTMENT_STATUSES).map(status => (
                  <option key={status} value={status}>{getStatusText(status)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modalidad
              </label>
              <select
                value={filters.modalidad}
                onChange={(e) => handleFilterChange('modalidad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Psicólogo
              </label>
              <select
                value={filters.psicologoId}
                onChange={(e) => handleFilterChange('psicologoId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {psicologos.map(psi => (
                  <option key={psi.id} value={psi.id}>{psi.nombreCompleto}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estudiante
              </label>
              <input
                type="text"
                value={filters.estudianteId}
                onChange={(e) => handleFilterChange('estudianteId', e.target.value)}
                placeholder="Buscar por matrícula"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAppointments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-blue-700 font-medium">
                  {selectedAppointments.length} cita(s) seleccionada(s)
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showBulkActions ? 'Ocultar acciones' : 'Mostrar acciones'}
                </button>
              </div>
              <button
                onClick={() => setSelectedAppointments([])}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Deseleccionar todo
              </button>
            </div>

            {showBulkActions && (
              <div className="flex space-x-3 mt-3">
                <button
                  onClick={() => handleBulkAction('confirmar')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => handleBulkAction('cancelar')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                      onChange={selectAllAppointments}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha / Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Psicólogo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No se encontraron citas con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAppointments.includes(appointment.id)}
                          onChange={() => toggleSelectAppointment(appointment.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.fechaHora)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.fechaHora)} ({appointment.duracion}min)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.estudiante?.nombreCompleto}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.estudiante?.matricula}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.psicologo?.nombreCompleto}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.psicologo?.especialidades}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.estado)}`}>
                          {getStatusText(appointment.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.modalidad === 'VIRTUAL' ? '💻 Virtual' : '👥 Presencial'}
                        </div>
                        {appointment.ubicacion && (
                          <div className="text-sm text-gray-500">
                            📍 {appointment.ubicacion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/cita/${appointment.id}`)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentsPage;
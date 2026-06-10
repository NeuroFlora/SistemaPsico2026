// client/src/pages/citas/AgendaPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, APPOINTMENT_STATUSES, APPOINTMENT_MODALITIES } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

const AgendaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [currentDate, view]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const response = await fetch(
        `${API_CONFIG.API_BASE}/citas/agenda?inicio=${startDate}&fin=${endDate}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAppointments(result.data || []);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    switch (view) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split('T')[0];
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      default:
        return date.toISOString().split('T')[0];
    }
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    switch (view) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() - date.getDay() + 6);
        return endOfWeek.toISOString().split('T')[0];
      case 'month':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      default:
        return date.toISOString().split('T')[0];
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const response = await fetch(
        `${API_CONFIG.API_BASE}/citas/${appointmentId}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        loadAppointments(); // Recargar citas
        setShowAppointmentModal(false);
      }
    } catch (error) {
      console.error(`Error ${action} appointment:`, error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [APPOINTMENT_STATUSES.SOLICITADA]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [APPOINTMENT_STATUSES.CONFIRMADA]: 'bg-blue-100 text-blue-800 border-blue-200',
      [APPOINTMENT_STATUSES.EN_PROGRESO]: 'bg-green-100 text-green-800 border-green-200',
      [APPOINTMENT_STATUSES.COMPLETADA]: 'bg-gray-100 text-gray-800 border-gray-200',
      [APPOINTMENT_STATUSES.CANCELADA]: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt =>
      apt.fechaHora.split('T')[0] === dateStr
    ).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {formatDate(currentDate)}
          </h2>
        </div>

        {dayAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <p className="text-gray-500">No tienes citas programadas para este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowAppointmentModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-medium text-gray-900">
                        {formatTime(appointment.fechaHora)}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(appointment.estado)}`}>
                        {getStatusText(appointment.estado)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {appointment.modalidad === 'VIRTUAL' ? '💻' : '👥'} {appointment.modalidad}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium text-gray-800">
                        {appointment.estudiante?.nombreCompleto}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.motivo}
                      </p>
                      {appointment.ubicacion && (
                        <p className="text-sm text-gray-500 mt-1">
                          📍 {appointment.ubicacion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {appointment.duracion} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'}`}>
                <div className="text-sm font-medium">
                  {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold">
                  {day.getDate()}
                </div>
              </div>

              <div className="space-y-1">
                {dayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white border rounded p-2 text-xs cursor-pointer hover:shadow-sm"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowAppointmentModal(true);
                    }}
                  >
                    <div className="font-medium truncate">
                      {formatTime(appointment.fechaHora)}
                    </div>
                    <div className="text-gray-600 truncate">
                      {appointment.estudiante?.nombreCompleto}
                    </div>
                    <div className={`mt-1 px-1 py-0.5 rounded text-xs ${getStatusColor(appointment.estado)}`}>
                      {getStatusText(appointment.estado)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Agenda</h1>
              <p className="text-gray-600 mt-1">Gestiona tus citas y horarios</p>
            </div>
            <button
              onClick={() => navigate('/disponibilidad')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configurar Disponibilidad
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-lg font-semibold text-gray-900">
                {view === 'day' && formatDate(currentDate)}
                {view === 'week' && `Semana del ${getViewStartDate()}`}
                {view === 'month' && currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </div>

              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hoy
              </button>
            </div>

            {/* View Selector */}
            <div className="flex bg-gray-100 rounded-lg">
              {['day', 'week'].map((viewOption) => (
                <button
                  key={viewOption}
                  onClick={() => setView(viewOption)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    view === viewOption
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewOption === 'day' ? 'Día' : 'Semana'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {view === 'day' && renderDayView()}
              {view === 'week' && renderWeekView()}
            </>
          )}
        </div>

        {/* Appointment Modal */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles de la Cita</h3>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Estudiante</p>
                  <p className="font-medium">{selectedAppointment.estudiante?.nombreCompleto}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.estudiante?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora</p>
                  <p className="font-medium">
                    {formatDate(new Date(selectedAppointment.fechaHora))} - {formatTime(selectedAppointment.fechaHora)}
                  </p>
                  <p className="text-sm text-gray-500">Duración: {selectedAppointment.duracion} minutos</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Modalidad</p>
                  <p className="font-medium">
                    {selectedAppointment.modalidad === 'VIRTUAL' ? '💻 Virtual' : '👥 Presencial'}
                  </p>
                  {selectedAppointment.ubicacion && (
                    <p className="text-sm text-gray-500">📍 {selectedAppointment.ubicacion}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Motivo</p>
                  <p className="font-medium">{selectedAppointment.motivo}</p>
                </div>

                {selectedAppointment.notas && (
                  <div>
                    <p className="text-sm text-gray-600">Notas</p>
                    <p className="font-medium">{selectedAppointment.notas}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusColor(selectedAppointment.estado)}`}>
                    {getStatusText(selectedAppointment.estado)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                {selectedAppointment.estado === APPOINTMENT_STATUSES.SOLICITADA && (
                  <>
                    <button
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'confirmar')}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'cancelar')}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Rechazar
                    </button>
                  </>
                )}

                {selectedAppointment.estado === APPOINTMENT_STATUSES.CONFIRMADA && (
                  <>
                    <button
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'iniciar')}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => handleAppointmentAction(selectedAppointment.id, 'cancelar')}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}

                {selectedAppointment.estado === APPOINTMENT_STATUSES.EN_PROGRESO && (
                  <button
                    onClick={() => handleAppointmentAction(selectedAppointment.id, 'completar')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Completar Sesión
                  </button>
                )}

                <button
                  onClick={() => navigate(`/cita/${selectedAppointment.id}`)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Ver Detalle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaPage;
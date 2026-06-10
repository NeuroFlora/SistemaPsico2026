// client/src/pages/citas/AppointmentDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_CONFIG, APPOINTMENT_STATUSES, APPOINTMENT_MODALITIES } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

const AppointmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);

  // Determinar si el usuario es el psicólogo o el estudiante
  const isProUser = user?.rol === 'PSICOLOGO' || user?.instituciones?.[0]?.rol === 'PSICOLOGO';
  const isStudent = user?.rol === 'ESTUDIANTE' || user?.instituciones?.[0]?.rol === 'ESTUDIANTE';

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/${id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setAppointment(result.data);
        setEditForm({
          fechaHora: result.data.fechaHora,
          duracion: result.data.duracion,
          modalidad: result.data.modalidad,
          ubicacion: result.data.ubicacion || '',
          motivo: result.data.motivo || '',
          notas: result.data.notas || ''
        });
      } else if (response.status === 404) {
        setMessage({ type: 'error', text: 'Cita no encontrada' });
      } else {
        setMessage({ type: 'error', text: 'Error al cargar la cita' });
      }
    } catch (error) {
      console.error("Error loading appointment:", error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!appointment) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/${appointment.id}/${action}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setAppointment(result.data);
        setMessage({ type: 'success', text: `Cita ${action} exitosamente` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || `Error al ${action} la cita` });
      }
    } catch (error) {
      console.error(`Error ${action} appointment:`, error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/${appointment.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const result = await response.json();
        setAppointment(result.data);
        setShowEditModal(false);
        setMessage({ type: 'success', text: 'Cita actualizada exitosamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Error al actualizar la cita' });
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNotes = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/${appointment.id}/notas`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ notas: notes }),
      });

      if (response.ok) {
        const result = await response.json();
        setAppointment(result.data);
        setShowNotesModal(false);
        setNotes('');
        setMessage({ type: 'success', text: 'Notas agregadas exitosamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al agregar notas' });
      }
    } catch (error) {
      console.error("Error adding notes:", error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setUpdating(false);
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
      [APPOINTMENT_STATUSES.SOLICITADA]: 'Pendiente de confirmación',
      [APPOINTMENT_STATUSES.CONFIRMADA]: 'Confirmada',
      [APPOINTMENT_STATUSES.EN_PROGRESO]: 'En progreso',
      [APPOINTMENT_STATUSES.COMPLETADA]: 'Completada',
      [APPOINTMENT_STATUSES.CANCELADA]: 'Cancelada',
    };
    return texts[status] || status;
  };

  const canEdit = () => {
    if (!appointment) return false;
    return isProUser && [APPOINTMENT_STATUSES.SOLICITADA, APPOINTMENT_STATUSES.CONFIRMADA].includes(appointment.estado);
  };

  const canCancel = () => {
    if (!appointment) return false;
    const appointmentDate = new Date(appointment.fechaHora);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

    return hoursUntilAppointment > 24 &&
           [APPOINTMENT_STATUSES.SOLICITADA, APPOINTMENT_STATUSES.CONFIRMADA].includes(appointment.estado);
  };

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString('es-ES', {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la cita...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cita no encontrada</h1>
          <p className="text-gray-600 mb-4">La cita que buscas no existe o no tienes permisos para verla.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Detalle de Cita</h1>
                <p className="text-gray-600 mt-1">ID: {appointment.id}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              {isProUser && canEdit() && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Editar
                </button>
              )}

              {isProUser && appointment.estado === APPOINTMENT_STATUSES.COMPLETADA && (
                <button
                  onClick={() => setShowNotesModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Agregar Notas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Estado de la Cita</h2>
                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(appointment.estado)}`}>
                  {getStatusText(appointment.estado)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isProUser && appointment.estado === APPOINTMENT_STATUSES.SOLICITADA && (
                  <>
                    <button
                      onClick={() => handleAction('confirmar')}
                      disabled={updating}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Confirmar Cita
                    </button>
                    <button
                      onClick={() => handleAction('rechazar')}
                      disabled={updating}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </>
                )}

                {isProUser && appointment.estado === APPOINTMENT_STATUSES.CONFIRMADA && (
                  <button
                    onClick={() => handleAction('iniciar')}
                    disabled={updating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Iniciar Sesión
                  </button>
                )}

                {isProUser && appointment.estado === APPOINTMENT_STATUSES.EN_PROGRESO && (
                  <button
                    onClick={() => handleAction('completar')}
                    disabled={updating}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Completar Sesión
                  </button>
                )}

                {canCancel() && (
                  <button
                    onClick={() => handleAction('cancelar')}
                    disabled={updating}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Cita</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Información General</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-medium">{formatDate(appointment.fechaHora)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hora</p>
                      <p className="font-medium">{formatTime(appointment.fechaHora)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duración</p>
                      <p className="font-medium">{appointment.duracion} minutos</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Modalidad</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Tipo</p>
                      <p className="font-medium">
                        {appointment.modalidad === 'VIRTUAL' ? '💻 Virtual' : '👥 Presencial'}
                      </p>
                    </div>
                    {appointment.ubicacion && (
                      <div>
                        <p className="text-sm text-gray-600">Ubicación</p>
                        <p className="font-medium">📍 {appointment.ubicacion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Motivo de la Cita</h3>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                  {appointment.motivo || 'No especificado'}
                </p>
              </div>

              {appointment.notas && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Notas Adicionales</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                    {appointment.notas}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participant Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {isProUser ? 'Estudiante' : 'Psicólogo'}
              </h3>

              {isProUser && appointment.estudiante && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {appointment.estudiante.nombre?.charAt(0)}{appointment.estudiante.apellidoPaterno?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.estudiante.nombreCompleto}</p>
                      <p className="text-sm text-gray-600">{appointment.estudiante.email}</p>
                    </div>
                  </div>
                  {appointment.estudiante.matricula && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Matrícula:</span> {appointment.estudiante.matricula}
                    </p>
                  )}
                  {appointment.estudiante.telefono && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Teléfono:</span> {appointment.estudiante.telefono}
                    </p>
                  )}
                </div>
              )}

              {isStudent && appointment.psicologo && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium">
                        {appointment.psicologo.nombre?.charAt(0)}{appointment.psicologo.apellidoPaterno?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.psicologo.nombreCompleto}</p>
                      <p className="text-sm text-gray-600">{appointment.psicologo.email}</p>
                    </div>
                  </div>
                  {appointment.psicologo.especialidades && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Especialidades:</span> {appointment.psicologo.especialidades}
                    </p>
                  )}
                  {appointment.psicologo.cedulaProfesional && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Cédula:</span> {appointment.psicologo.cedulaProfesional}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                {appointment.modalidad === 'VIRTUAL' && appointment.estado === APPOINTMENT_STATUSES.CONFIRMADA && (
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    🎥 Unirse a videollamada
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  🖨️ Imprimir detalles
                </button>

                {isStudent && (
                  <button
                    onClick={() => navigate('/mis-citas')}
                    className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    📅 Ver mis citas
                  </button>
                )}

                {isProUser && (
                  <button
                    onClick={() => navigate('/agenda')}
                    className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    📅 Ver agenda
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Editar Cita</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.fechaHora?.slice(0, 16)}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fechaHora: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (minutos)
                  </label>
                  <select
                    value={editForm.duracion}
                    onChange={(e) => setEditForm(prev => ({ ...prev, duracion: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modalidad
                  </label>
                  <select
                    value={editForm.modalidad}
                    onChange={(e) => setEditForm(prev => ({ ...prev, modalidad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>

                {editForm.modalidad === 'PRESENCIAL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={editForm.ubicacion}
                      onChange={(e) => setEditForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Consultorio, edificio, etc."
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Agregar Notas de Sesión</h3>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas de la sesión
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe lo trabajado en la sesión, observaciones, recomendaciones..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddNotes}
                  disabled={updating || !notes.trim()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Guardar Notas'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentDetailPage;
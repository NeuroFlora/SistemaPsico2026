// client/src/pages/citas/BookAppointmentPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, APPOINTMENT_STATUSES, APPOINTMENT_MODALITIES, TIME_SLOTS } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: Seleccionar psicólogo, 2: Seleccionar fecha/hora, 3: Detalles, 4: Confirmación
  const [formData, setFormData] = useState({
    psicologoId: "",
    fecha: "",
    hora: "",
    duracion: 60,
    modalidad: "PRESENCIAL",
    motivo: "",
    ubicacion: "",
    notas: ""
  });

  const [psicologos, setPsicologos] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar psicólogos disponibles
  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/psicologos`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setPsicologos(result.data || []);
      } else {
        setErrors({ general: "Error al cargar psicólogos disponibles" });
      }
    } catch (error) {
      console.error("Error loading psychologists:", error);
      setErrors({ general: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  // Cargar horarios disponibles cuando se selecciona psicólogo y fecha
  useEffect(() => {
    if (formData.psicologoId && formData.fecha) {
      loadAvailableSlots();
    }
  }, [formData.psicologoId, formData.fecha]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.API_BASE}/citas/disponibilidad/${formData.psicologoId}?fecha=${formData.fecha}`,
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
        setAvailableSlots(result.data || []);
      }
    } catch (error) {
      console.error("Error loading available slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar errores específicos
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.psicologoId) {
          newErrors.psicologoId = "Selecciona un psicólogo";
        }
        break;
      case 2:
        if (!formData.fecha) {
          newErrors.fecha = "Selecciona una fecha";
        }
        if (!formData.hora) {
          newErrors.hora = "Selecciona un horario";
        }
        break;
      case 3:
        if (!formData.motivo) {
          newErrors.motivo = "Describe el motivo de la cita";
        }
        if (formData.modalidad === "PRESENCIAL" && !formData.ubicacion) {
          newErrors.ubicacion = "Especifica la ubicación para citas presenciales";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const submitAppointment = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const appointmentData = {
        ...formData,
        fechaHora: `${formData.fecha} ${formData.hora}:00`,
        estado: APPOINTMENT_STATUSES.SOLICITADA
      };

      const response = await fetch(`${API_CONFIG.API_BASE}/citas`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        setStep(4); // Ir a confirmación
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || "Error al agendar la cita" });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setErrors({ general: "Error de conexión al agendar la cita" });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 90 días adelante
    return maxDate.toISOString().split('T')[0];
  };

  const selectedPsychologist = psicologos.find(p => p.id === formData.psicologoId);

  if (loading && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendar Cita</h1>
          <p className="text-gray-600">Programa una cita con un psicólogo de tu institución</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex items-center ${stepNum <= step ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    stepNum <= step
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`w-16 h-0.5 ${
                      stepNum < step ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span>Psicólogo</span>
            <span>Fecha/Hora</span>
            <span>Detalles</span>
            <span>Confirmación</span>
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Step 1: Seleccionar Psicólogo */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Selecciona un Psicólogo</h2>
              {psicologos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay psicólogos disponibles en este momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {psicologos.map((psicologo) => (
                    <div
                      key={psicologo.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.psicologoId === psicologo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('psicologoId', psicologo.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {psicologo.nombre?.charAt(0)}{psicologo.apellidoPaterno?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {psicologo.nombreCompleto}
                          </h3>
                          {psicologo.especialidades && (
                            <p className="text-sm text-gray-600 mt-1">
                              {psicologo.especialidades}
                            </p>
                          )}
                          {psicologo.cedulaProfesional && (
                            <p className="text-xs text-gray-500 mt-1">
                              Cédula: {psicologo.cedulaProfesional}
                            </p>
                          )}
                        </div>
                        {formData.psicologoId === psicologo.id && (
                          <div className="text-blue-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.psicologoId && (
                <p className="mt-2 text-sm text-red-600">{errors.psicologoId}</p>
              )}
            </div>
          )}

          {/* Step 2: Seleccionar Fecha y Hora */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Selecciona Fecha y Hora</h2>

              {selectedPsychologist && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Psicólogo seleccionado:</p>
                  <p className="text-gray-600">{selectedPsychologist.nombreCompleto}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de la cita
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.fecha && (
                    <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>
                  )}
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración
                  </label>
                  <select
                    value={formData.duracion}
                    onChange={(e) => handleInputChange('duracion', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                  </select>
                </div>
              </div>

              {/* Horarios disponibles */}
              {formData.fecha && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Horarios disponibles
                  </label>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-gray-500 py-4">No hay horarios disponibles para esta fecha</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleInputChange('hora', slot)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.hora === slot
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.hora && (
                    <p className="mt-2 text-sm text-red-600">{errors.hora}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Detalles */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Detalles de la Cita</h2>

              {/* Resumen */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Resumen de la cita:</h3>
                <p><span className="font-medium">Psicólogo:</span> {selectedPsychologist?.nombreCompleto}</p>
                <p><span className="font-medium">Fecha:</span> {new Date(formData.fecha).toLocaleDateString('es-ES')}</p>
                <p><span className="font-medium">Hora:</span> {formData.hora}</p>
                <p><span className="font-medium">Duración:</span> {formData.duracion} minutos</p>
              </div>

              <div className="space-y-6">
                {/* Modalidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Modalidad de la cita
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(APPOINTMENT_MODALITIES).map((modalidad) => (
                      <button
                        key={modalidad}
                        type="button"
                        onClick={() => handleInputChange('modalidad', modalidad)}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          formData.modalidad === modalidad
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">
                          {modalidad === 'PRESENCIAL' ? '👥 Presencial' : '💻 Virtual'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {modalidad === 'PRESENCIAL'
                            ? 'En las instalaciones de la institución'
                            : 'Por videollamada'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ubicación (solo si es presencial) */}
                {formData.modalidad === 'PRESENCIAL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación preferida
                    </label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                      placeholder="Ej: Consultorio 1, Edificio de Psicología"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.ubicacion && (
                      <p className="mt-1 text-sm text-red-600">{errors.ubicacion}</p>
                    )}
                  </div>
                )}

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la cita *
                  </label>
                  <textarea
                    value={formData.motivo}
                    onChange={(e) => handleInputChange('motivo', e.target.value)}
                    placeholder="Describe brevemente el motivo de tu cita..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.motivo && (
                    <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>
                  )}
                </div>

                {/* Notas adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    placeholder="Cualquier información adicional que consideres importante..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmación */}
          {step === 4 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita Solicitada!</h2>
                <p className="text-gray-600">
                  Tu solicitud de cita ha sido enviada. El psicólogo la revisará y te confirmará pronto.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Detalles de tu cita:</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Psicólogo:</span> {selectedPsychologist?.nombreCompleto}</p>
                  <p><span className="font-medium">Fecha:</span> {new Date(formData.fecha).toLocaleDateString('es-ES')}</p>
                  <p><span className="font-medium">Hora:</span> {formData.hora}</p>
                  <p><span className="font-medium">Duración:</span> {formData.duracion} minutos</p>
                  <p><span className="font-medium">Modalidad:</span> {formData.modalidad}</p>
                  <p><span className="font-medium">Estado:</span> Pendiente de confirmación</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/mis-citas')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver mis citas
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Volver al dashboard
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={step === 1 ? () => navigate(-1) : prevStep}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {step === 1 ? 'Cancelar' : 'Anterior'}
              </button>

              <button
                onClick={step === 3 ? submitAppointment : nextStep}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : step === 3 ? (
                  'Agendar cita'
                ) : (
                  'Siguiente'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
// client/src/components/citas/AppointmentBookingForm.jsx
import React, { useState, useEffect } from "react";
import { authenticatedFetch } from "../../utils/authUtils";

const AppointmentBookingForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    psicologoId: "",
    fechaHora: "",
    duracion: 60,
    modalidad: "PRESENCIAL",
    motivo: "",
    ubicacion: "",
  });

  const [psicologos, setPsicologos] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar psicólogos disponibles
  useEffect(() => {
    const cargarPsicologos = async () => {
      try {
        const response = await authenticatedFetch(
          "/api/citas/psicologos"
        );
        if (response && response.ok) {
          const result = await response.json();
          setPsicologos(result.data || []);
        }
      } catch (error) {
        console.error("Error cargando psicólogos:", error);
      }
    };

    cargarPsicologos();
  }, []);

  // Cargar slots disponibles cuando se selecciona psicólogo, fecha o duración
  useEffect(() => {
    if (formData.psicologoId && formData.fechaHora) {
      cargarSlotsDisponibles();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.psicologoId, formData.fechaHora, formData.duracion]);

  const cargarSlotsDisponibles = async () => {
    try {
      setLoadingSlots(true);
      setErrors(prev => ({ ...prev, fechaHora: "" }));

      const fecha = formData.fechaHora.split("T")[0]; // Extract date part
      const response = await authenticatedFetch(
        `/api/citas/disponibilidad/${formData.psicologoId}?fecha=${fecha}&duracion=${formData.duracion}`
      );

      if (response && response.ok) {
        const result = await response.json();
        console.log("Disponibilidad recibida:", result);

        setAvailableSlots(result.data || []);

        // Show debug info in console
        if (result.debug) {
          console.log("Debug info:", result.debug);
        }

        // Clear the time part if the selected time is no longer available
        if (formData.fechaHora.includes("T")) {
          const selectedTime = formData.fechaHora.split("T")[1]?.substring(0, 5);
          if (selectedTime && !result.data.includes(selectedTime)) {
            setFormData(prev => ({
              ...prev,
              fechaHora: fecha // Reset to just the date
            }));
          }
        }
      } else {
        const errorResult = await response.json();
        setErrors(prev => ({
          ...prev,
          fechaHora: errorResult.message || "Error obteniendo disponibilidad"
        }));
      }
    } catch (error) {
      console.error("Error cargando slots disponibles:", error);
      setErrors(prev => ({
        ...prev,
        fechaHora: "Error de conexión al obtener disponibilidad"
      }));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.psicologoId) {
      newErrors.psicologoId = "Selecciona un psicólogo";
    }

    if (!formData.fechaHora) {
      newErrors.fechaHora = "Selecciona fecha y hora";
    } else {
      const fechaSeleccionada = new Date(formData.fechaHora);
      if (fechaSeleccionada <= new Date()) {
        newErrors.fechaHora = "La fecha debe ser futura";
      }
    }

    if (!formData.motivo || formData.motivo.trim().length < 10) {
      newErrors.motivo = "El motivo debe tener al menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authenticatedFetch("/api/citas", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response && response.ok) {
        const result = await response.json();
        onSuccess && onSuccess(result.data);
      } else {
        const errorResult = await response.json();
        setErrors({
          submit: errorResult.message || "Error al solicitar la cita",
        });
      }
    } catch (error) {
      console.error("Error solicitando cita:", error);
      setErrors({ submit: "Error de conexión. Intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };


  const psicologoSeleccionado = psicologos.find(
    (p) => p.id === formData.psicologoId
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Solicitar Cita Psicológica
        </h2>
        <p className="text-gray-600">
          Completa el formulario para solicitar una cita con un psicólogo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Psicólogo */}
        <div>
          <label
            htmlFor="psicologoId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Psicólogo *
          </label>
          <select
            id="psicologoId"
            name="psicologoId"
            value={formData.psicologoId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.psicologoId ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Selecciona un psicólogo</option>
            {psicologos.map((psicologo) => (
              <option key={psicologo.id} value={psicologo.id}>
                {psicologo.nombreCompleto}
                {psicologo.especialidades && ` - ${psicologo.especialidades}`}
              </option>
            ))}
          </select>
          {errors.psicologoId && (
            <p className="text-red-500 text-sm mt-1">{errors.psicologoId}</p>
          )}

          {psicologoSeleccionado && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{psicologoSeleccionado.nombreCompleto}</strong>
                {psicologoSeleccionado.especialidades && (
                  <span className="block text-blue-600">
                    Especialidades: {psicologoSeleccionado.especialidades}
                  </span>
                )}
                <span className="block text-blue-600">
                  Horarios disponibles:{" "}
                  {psicologoSeleccionado.horariosDisponibles || 0}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Duración */}
        <div>
          <label
            htmlFor="duracion"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Duración (minutos) *
          </label>
          <select
            id="duracion"
            name="duracion"
            value={formData.duracion}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label
            htmlFor="fechaHora"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Fecha *
          </label>
          <input
            type="date"
            id="fechaHora"
            name="fechaHora"
            value={formData.fechaHora.split("T")[0]}
            onChange={(e) => {
              const fecha = e.target.value;
              setFormData((prev) => ({
                ...prev,
                fechaHora: fecha,
              }));
            }}
            min={new Date().toISOString().split("T")[0]}
            max={
              new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.fechaHora ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.fechaHora && (
            <p className="text-red-500 text-sm mt-1">{errors.fechaHora}</p>
          )}
        </div>

        {/* Hora */}
        {formData.fechaHora && (
          <div>
            <label
              htmlFor="hora"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Hora *
            </label>
            <select
              id="hora"
              name="hora"
              value={formData.fechaHora.split("T")[1]?.substring(0, 5) || ""}
              onChange={(e) => {
                const hora = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  fechaHora: `${prev.fechaHora.split("T")[0]}T${hora}:00`,
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingSlots}
            >
              <option value="">
                {loadingSlots ? "Cargando horarios..." : "Selecciona una hora"}
              </option>
              {availableSlots.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
            {loadingSlots && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Verificando disponibilidad...
              </div>
            )}
          </div>
        )}

        {/* Modalidad */}
        <div>
          <label
            htmlFor="modalidad"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Modalidad *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="radio"
                id="presencial"
                name="modalidad"
                value="PRESENCIAL"
                checked={formData.modalidad === "PRESENCIAL"}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="presencial" className="text-sm text-gray-700">
                Presencial
              </label>
            </div>
            <div className="relative group">
              <div
                className="opacity-50 cursor-not-allowed"
              >
                <input
                  type="radio"
                  id="virtual"
                  name="modalidad"
                  value="VIRTUAL"
                  checked={formData.modalidad === "VIRTUAL"}
                  onChange={handleInputChange}
                  className="mr-2"
                  disabled
                />
                <label htmlFor="virtual" className="text-sm text-gray-400 cursor-not-allowed">
                  Virtual
                </label>
              </div>
              <div className="absolute -top-10 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                No disponible por el momento
              </div>
            </div>
          </div>
        </div>


        {/* Motivo */}
        <div>
          <label
            htmlFor="motivo"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Motivo de la consulta *
          </label>
          <textarea
            id="motivo"
            name="motivo"
            value={formData.motivo}
            onChange={handleInputChange}
            rows={4}
            placeholder="Describe brevemente el motivo de tu consulta..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.motivo ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.motivo && (
            <p className="text-red-500 text-sm mt-1">{errors.motivo}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {formData.motivo.length}/1000 caracteres
          </p>
        </div>

        {/* Ubicación (opcional para presencial) */}
        {formData.modalidad === "PRESENCIAL" && (
          <div>
            <label
              htmlFor="ubicacion"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ubicación preferida (opcional)
            </label>
            <input
              type="text"
              id="ubicacion"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleInputChange}
              placeholder="Ej: Consultorio 1, Edificio A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Error general */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Solicitando..." : "Solicitar Cita"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AppointmentBookingForm;

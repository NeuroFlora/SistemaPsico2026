// client/src/pages/citas/AvailabilityPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, DAYS_OF_WEEK, TIME_SLOTS } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
import { authenticatedFetch } from "../../utils/authUtils";

const AvailabilityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [descansos, setDescansos] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Estado para configuración general
  const [config, setConfig] = useState({
    duracionDefault: 60,
    anticipacionMinima: 24, // horas
    anticipacionMaxima: 720, // horas (30 días)
    descansoEntreCitas: 15, // minutos
  });

  const daysOfWeek = [
    { key: 'LUNES', label: 'Lunes' },
    { key: 'MARTES', label: 'Martes' },
    { key: 'MIERCOLES', label: 'Miércoles' },
    { key: 'JUEVES', label: 'Jueves' },
    { key: 'VIERNES', label: 'Viernes' },
    { key: 'SABADO', label: 'Sábado' },
    { key: 'DOMINGO', label: 'Domingo' },
  ];

  useEffect(() => {
    loadAvailability();
    loadDescansos();
  }, []);

  const loadDescansos = async () => {
    try {
      const response = await authenticatedFetch("/citas/descansos");
      if (response && response.ok) {
        const result = await response.json();
        setDescansos(result.data || []);
      }
    } catch (error) {
      console.error("Error cargando descansos:", error);
    }
  };

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/disponibilidad`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        // Convert backend format to frontend format
        const backendData = result.data || [];
        const formattedAvailability = {};

        backendData.forEach(item => {
          formattedAvailability[item.diaSemana] = {
            activo: item.activo === 1,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            descansos: [] // Backend doesn't support breaks yet
          };
        });

        setAvailability(formattedAvailability);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      setMessage({ type: 'error', text: 'Error al cargar la disponibilidad' });
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/citas/disponibilidad`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          horarios: availability,
          configuracion: config
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Disponibilidad guardada correctamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al guardar la disponibilidad' });
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      setMessage({ type: 'error', text: 'Error de conexión al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDayAvailability = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day] ? null : {
        activo: true,
        horaInicio: '09:00',
        horaFin: '17:00',
        descansos: [
          { inicio: '12:00', fin: '13:00', nombre: 'Almuerzo' }
        ]
      }
    }));
  };

  const updateDaySchedule = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const addBreak = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        descansos: [
          ...(prev[day]?.descansos || []),
          { inicio: '12:00', fin: '13:00', nombre: 'Descanso' }
        ]
      }
    }));
  };

  const updateBreak = (day, breakIndex, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        descansos: prev[day].descansos.map((br, index) =>
          index === breakIndex ? { ...br, [field]: value } : br
        )
      }
    }));
  };

  const removeBreak = (day, breakIndex) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        descansos: prev[day].descansos.filter((_, index) => index !== breakIndex)
      }
    }));
  };

  const copyToAllDays = (day) => {
    const dayConfig = availability[day];
    if (!dayConfig) return;

    const newAvailability = {};
    daysOfWeek.forEach(({ key }) => {
      newAvailability[key] = JSON.parse(JSON.stringify(dayConfig));
    });
    setAvailability(newAvailability);
  };

  const clearAllSchedules = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todos los horarios?')) {
      setAvailability({});
    }
  };

  const generateTimeOptions = () => {
    return TIME_SLOTS.map(time => (
      <option key={time} value={time}>{time}</option>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurar Disponibilidad</h1>
              <p className="text-gray-600 mt-1">Define tus horarios disponibles y descansos</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/agenda')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver a Agenda
              </button>
              <button
                onClick={saveAvailability}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
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

        {/* Content */}
          <div>
            {/* Configuration Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración por defecto (minutos)
              </label>
              <select
                value={config.duracionDefault}
                onChange={(e) => setConfig(prev => ({ ...prev, duracionDefault: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anticipación mínima (horas)
              </label>
              <input
                type="number"
                value={config.anticipacionMinima}
                onChange={(e) => setConfig(prev => ({ ...prev, anticipacionMinima: parseInt(e.target.value) }))}
                min="1"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anticipación máxima (horas)
              </label>
              <input
                type="number"
                value={config.anticipacionMaxima}
                onChange={(e) => setConfig(prev => ({ ...prev, anticipacionMaxima: parseInt(e.target.value) }))}
                min="24"
                max="2160"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descanso entre citas (minutos)
              </label>
              <input
                type="number"
                value={config.descansoEntreCitas}
                onChange={(e) => setConfig(prev => ({ ...prev, descansoEntreCitas: parseInt(e.target.value) }))}
                min="0"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Acciones Rápidas</h3>
            <div className="flex space-x-2">
              <button
                onClick={clearAllSchedules}
                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Limpiar Todo
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-4">
          {daysOfWeek.map(({ key, label }) => {
            const dayAvailability = availability[key];
            const isActive = dayAvailability?.activo;

            return (
              <div key={key} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!!dayAvailability}
                      onChange={() => toggleDayAvailability(key)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                  </div>

                  {dayAvailability && (
                    <button
                      onClick={() => copyToAllDays(key)}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                    >
                      Copiar a todos los días
                    </button>
                  )}
                </div>

                {dayAvailability && (
                  <div className="space-y-4">
                    {/* Basic Schedule */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora de inicio
                        </label>
                        <select
                          value={dayAvailability.horaInicio || '09:00'}
                          onChange={(e) => updateDaySchedule(key, 'horaInicio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {generateTimeOptions()}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora de fin
                        </label>
                        <select
                          value={dayAvailability.horaFin || '17:00'}
                          onChange={(e) => updateDaySchedule(key, 'horaFin', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {generateTimeOptions()}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={dayAvailability.activo !== false}
                            onChange={(e) => updateDaySchedule(key, 'activo', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Día activo</span>
                        </label>
                      </div>
                    </div>

                    {/* Breaks */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Descansos</h4>
                        <button
                          onClick={() => addBreak(key)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          + Agregar Descanso
                        </button>
                      </div>

                      {dayAvailability.descansos?.map((breakTime, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                            <input
                              type="text"
                              value={breakTime.nombre}
                              onChange={(e) => updateBreak(key, index, 'nombre', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nombre del descanso"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                            <select
                              value={breakTime.inicio}
                              onChange={(e) => updateBreak(key, index, 'inicio', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {generateTimeOptions()}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Fin</label>
                            <select
                              value={breakTime.fin}
                              onChange={(e) => updateBreak(key, index, 'fin', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {generateTimeOptions()}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeBreak(key, index)}
                              className="px-2 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!dayAvailability.descansos || dayAvailability.descansos.length === 0) && (
                        <p className="text-sm text-gray-500 italic">Sin descansos programados</p>
                      )}
                    </div>
                  </div>
                )}

                {!dayAvailability && (
                  <p className="text-gray-500 italic">No disponible</p>
                )}
              </div>
            );
          })}
        </div>

            {/* Summary */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Resumen de tu disponibilidad</h3>
              <div className="text-sm text-blue-800 space-y-1">
                {(() => {
                  const activeDays = Object.entries(availability).filter(([_, config]) => config && config.activo !== false);
                  const totalBreaks = activeDays.reduce((sum, [_, config]) => sum + (config.descansos?.length || 0), 0);

                  if (activeDays.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No tienes días configurados como disponibles.</p>
                        <p className="text-gray-400 text-xs mt-1">Configura al menos un día para empezar a recibir citas.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Días disponibles:</span>
                          <span className="ml-2 text-sm text-green-600 font-semibold">{activeDays.length} de 7</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Duración por defecto:</span>
                          <span className="ml-2 text-sm text-blue-600 font-semibold">{config.duracionDefault} min</span>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Horarios configurados:</h4>
                        <div className="space-y-1">
                          {activeDays.map(([day, dayConfig]) => (
                            <div key={day} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">{day}</span>
                              <span className="text-gray-800 font-medium">
                                {dayConfig.horaInicio} - {dayConfig.horaFin}
                                {dayConfig.descansos?.length > 0 && (
                                  <span className="ml-2 text-orange-600">({dayConfig.descansos.length} descansos)</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Anticipación mínima:</span>
                          <span className="ml-1 text-gray-800 font-medium">{config.anticipacionMinima}h</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Descanso entre citas:</span>
                          <span className="ml-1 text-gray-800 font-medium">{config.descansoEntreCitas} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;
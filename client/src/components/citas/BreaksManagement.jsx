import React, { useState, useEffect } from "react";
import { authenticatedFetch } from "../../utils/authUtils";

const BreaksManagement = () => {
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
  const tiposDescanso = ['ALMUERZO', 'DESCANSO', 'CAFE', 'PERSONAL', 'OTRO'];

  // Cargar descansos existentes
  useEffect(() => {
    cargarDescansos();
  }, []);

  const cargarDescansos = async () => {
    try {
      setLoading(true);
      setMessage("");

      // Debug: Check token availability
      const tokens = {
        auth_token: localStorage.getItem("auth_token"),
        authTokenV1: localStorage.getItem("authToken:v1"),
        accessToken: localStorage.getItem("accessToken"),
        token: localStorage.getItem("token")
      };
      console.log("🔐 Available tokens:", Object.fromEntries(
        Object.entries(tokens).map(([k, v]) => [k, v ? `${v.substring(0, 10)}...` : null])
      ));

      const response = await authenticatedFetch("/citas/descansos");
      console.log("📡 Response received:", {
        url: "/api/citas/descansos",
        status: response?.status,
        statusText: response?.statusText,
        ok: response?.ok
      });

      if (response && response.ok) {
        const result = await response.json();
        console.log("✅ Descansos cargados:", result.data);
        setBreaks(result.data || []);
        if (result.data && result.data.length === 0) {
          setMessage("No tienes descansos configurados. Puedes agregar algunos usando el botón de arriba.");
        }
      } else if (response) {
        console.error("❌ Error HTTP:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error data:", errorData);

        if (response.status === 401) {
          setMessage("❌ Error de autenticación. Por favor, inicia sesión nuevamente.");
        } else if (response.status === 404) {
          setMessage("❌ Endpoint no encontrado. Verifica que el servidor esté actualizado.");
        } else {
          setMessage(`❌ Error cargando descansos: ${errorData.message || response.statusText}`);
        }
      } else {
        setMessage("❌ No se recibió respuesta del servidor");
      }
    } catch (error) {
      console.error("❌ Error cargando descansos:", error);
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const agregarDescanso = () => {
    const nuevoDescanso = {
      id: Date.now(), // ID temporal para el frontend
      diaSemana: 'LUNES',
      horaInicio: '12:00',
      horaFin: '13:00',
      tipo: 'ALMUERZO',
      descripcion: ''
    };
    setBreaks([...breaks, nuevoDescanso]);
  };

  const eliminarDescanso = (index) => {
    const nuevosDescansos = breaks.filter((_, i) => i !== index);
    setBreaks(nuevosDescansos);
  };

  const actualizarDescanso = (index, campo, valor) => {
    const nuevosDescansos = [...breaks];
    nuevosDescansos[index] = {
      ...nuevosDescansos[index],
      [campo]: valor
    };
    setBreaks(nuevosDescansos);
  };

  const guardarDescansos = async () => {
    try {
      setSaving(true);
      setMessage("");

      // Validar datos antes de enviar
      const descansosValidos = breaks.filter(descanso =>
        descanso.diaSemana && descanso.horaInicio && descanso.horaFin
      );

      const descansosInvalidos = breaks.length - descansosValidos.length;
      if (descansosInvalidos > 0) {
        setMessage(`⚠️ Se omitirán ${descansosInvalidos} descanso(s) incompleto(s)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log("💾 Guardando descansos:", descansosValidos);

      const response = await authenticatedFetch("/citas/descansos", {
        method: "PUT",
        body: JSON.stringify({ descansos: descansosValidos })
      });

      if (response && response.ok) {
        setMessage("✅ Descansos guardados exitosamente");
        await cargarDescansos(); // Recargar para obtener IDs reales
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await response.json().catch(() => ({}));
        setMessage(`❌ Error guardando: ${error.message || response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Error guardando descansos:", error);
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando descansos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Gestión de Descansos
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Configura tus descansos semanales (almuerzo, café, etc.)
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Agregar almuerzo común (12:00-13:00) a días laborales
                const diasLaborales = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
                const nuevosDescansos = [...breaks];
                diasLaborales.forEach(dia => {
                  const existeAlmuerzo = nuevosDescansos.some(d =>
                    d.diaSemana === dia && d.tipo === 'ALMUERZO'
                  );
                  if (!existeAlmuerzo) {
                    nuevosDescansos.push({
                      id: Date.now() + Math.random(),
                      diaSemana: dia,
                      horaInicio: '12:00',
                      horaFin: '13:00',
                      tipo: 'ALMUERZO',
                      descripcion: 'Hora de almuerzo'
                    });
                  }
                });
                setBreaks(nuevosDescansos);
              }}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              + Almuerzo Semanal
            </button>
            <button
              onClick={agregarDescanso}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nuevo Descanso
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes("Error")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {breaks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="max-w-sm mx-auto">
                <div className="text-4xl mb-4">☕</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay descansos configurados
                </h3>
                <p className="text-gray-500 mb-4">
                  Configura tus descansos para que no se puedan agendar citas durante esos horarios.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const diasLaborales = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
                      const nuevosDescansos = [];
                      diasLaborales.forEach(dia => {
                        nuevosDescansos.push({
                          id: Date.now() + Math.random(),
                          diaSemana: dia,
                          horaInicio: '12:00',
                          horaFin: '13:00',
                          tipo: 'ALMUERZO',
                          descripcion: 'Hora de almuerzo'
                        });
                      });
                      setBreaks(nuevosDescansos);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
                  >
                    Crear Almuerzos Automáticos
                  </button>
                  <button
                    onClick={agregarDescanso}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Agregar Manualmente
                  </button>
                </div>
              </div>
            </div>
          ) : (
            breaks.map((descanso, index) => {
              const tipoIcons = {
                'ALMUERZO': '🍽️',
                'CAFE': '☕',
                'DESCANSO': '⏰',
                'PERSONAL': '👤',
                'OTRO': '📝'
              };
              const tipoColors = {
                'ALMUERZO': 'bg-orange-50 border-orange-200',
                'CAFE': 'bg-yellow-50 border-yellow-200',
                'DESCANSO': 'bg-blue-50 border-blue-200',
                'PERSONAL': 'bg-purple-50 border-purple-200',
                'OTRO': 'bg-gray-50 border-gray-200'
              };

              return (
                <div key={descanso.id || index} className={`border rounded-lg p-4 ${tipoColors[descanso.tipo] || tipoColors['OTRO']}`}>
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">{tipoIcons[descanso.tipo] || tipoIcons['OTRO']}</span>
                    <span className="font-medium text-gray-700">{descanso.diaSemana}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{descanso.horaInicio} - {descanso.horaFin}</span>
                    <span className="ml-auto text-xs bg-white px-2 py-1 rounded border">
                      {descanso.tipo}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  {/* Día de la semana */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día
                    </label>
                    <select
                      value={descanso.diaSemana}
                      onChange={(e) => actualizarDescanso(index, 'diaSemana', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {diasSemana.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </div>

                  {/* Hora inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={descanso.horaInicio}
                      onChange={(e) => actualizarDescanso(index, 'horaInicio', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Hora fin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={descanso.horaFin}
                      onChange={(e) => actualizarDescanso(index, 'horaFin', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={descanso.tipo}
                      onChange={(e) => actualizarDescanso(index, 'tipo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {tiposDescanso.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={descanso.descripcion || ''}
                      onChange={(e) => actualizarDescanso(index, 'descripcion', e.target.value)}
                      placeholder="Opcional"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Botón eliminar */}
                  <div>
                    <button
                      onClick={() => eliminarDescanso(index)}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {breaks.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={guardarDescansos}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Descansos"}
            </button>
          </div>
        )}

        {/* Summary Section */}
        {breaks.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-3">📊 Resumen de Descansos</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'].map(dia => {
                const descansosDelDia = breaks.filter(d => d.diaSemana === dia);
                return (
                  <div key={dia} className="text-center">
                    <div className="font-medium text-gray-700">{dia.slice(0, 3)}</div>
                    <div className="text-blue-600">{descansosDelDia.length} descanso(s)</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">💡 Información:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los descansos se aplicarán automáticamente al calendario de disponibilidad</li>
            <li>• Durante los descansos no se podrán agendar citas</li>
            <li>• Puede configurar diferentes tipos de descansos (almuerzo, café, personal, etc.)</li>
            <li>• Los descansos se pueden configurar por día de la semana</li>
            <li>• Use "Almuerzo Semanal" para agregar descansos comunes rápidamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BreaksManagement;
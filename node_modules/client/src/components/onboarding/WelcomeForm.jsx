import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { API_CONFIG } from "../../utils/constants";

const card =
  "rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100";
const inputBase =
  "w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#527ceb] focus:border-[#527ceb]";

const WelcomeForm = () => {
  const { user, completeOnboarding } = useOnboarding();
  const userRole = user?.instituciones?.[0]?.rol || "ESTUDIANTE";

  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [formData, setFormData] = useState({
    telefono: "",
    fechaNacimiento: "",
    genero: "",
    ciudad: "",
    estado: "",
    ...(userRole === "ESTUDIANTE" && {
      semestre: "",
      grupo: "",
      turno: "",
      carrera: "",
    }),
    ...(userRole === "PSICOLOGO" && {
      numeroEmpleado: "",
      cedulaProfesional: "",
      departamento: "",
      telefonoEmergencia: "",
    }),
    ...(["ORIENTADOR", "ADMIN_INSTITUCION"].includes(userRole) && {
      departamento: "",
      telefonoEmergencia: "",
    }),
    aceptaTerminos: false, // <- requerido
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (formErrors[name]) {
      const copy = { ...formErrors };
      delete copy[name];
      setFormErrors(copy);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError("");

    if (!formData.aceptaTerminos) {
      setSubmitError("Debes aceptar el aviso de privacidad para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSend = {};
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (typeof value === "boolean") dataToSend[key] = value;
        else if (typeof value === "number") dataToSend[key] = value;
        else if (typeof value === "string" && value.trim() !== "")
          dataToSend[key] = value.trim();
      });

      const response = await fetch(
        `${API_CONFIG.API_BASE}/onboarding/complete-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
          body: JSON.stringify(dataToSend),
        }
      );

      if (response.ok) {
        await response.json().catch(() => ({}));
        completeOnboarding();
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          errorData.errors.forEach((er) => {
            if (er.path) fieldErrors[er.path] = er.msg;
          });
          setFormErrors(fieldErrors);
          setSubmitError("Por favor corrige los campos marcados.");
        } else {
          setSubmitError(
            errorData?.message || "No se pudo guardar. Intenta nuevamente."
          );
        }
      }
    } catch {
      setSubmitError("Error de conexión. Verifica tu red e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName =
    user?.nombre || user?.nombreCompleto?.split(" ")[0] || "Usuario";
  const roleLabel =
    {
      ESTUDIANTE: "Estudiante",
      PSICOLOGO: "Psicólogo/a",
      ORIENTADOR: "Orientador/a",
      ADMIN_INSTITUCION: "Administrador",
      SUPER_ADMIN_INSTITUCION: "Super Administrador",
      SUPER_ADMIN_NACIONAL: "Super Administrador Nacional",
    }[userRole] || "Usuario";

  return (
    <div className="max-w-4xl mx-auto pb-4">
      {/* Header */}
      <div className="mb-6">
        <div
          className={`${card} p-5 md:p-6`}
          style={{
            background: "linear-gradient(135deg, #527ceb 0%, #6762b3 100%)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold">Hola, {firstName}</h2>
          <p className="text-white/90 mt-1 text-sm md:text-base">
            Bienvenido como <span className="font-semibold">{roleLabel}</span>
          </p>
        </div>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6 text-red-700">
          <p className="font-medium">No se pudo continuar</p>
          <p className="text-sm mt-1">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info personal */}
        <div className={`${card} p-5`}>
          <h3 className="text-lg md:text-xl font-semibold text-[#21252d]">
            Información personal
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Teléfono {userRole === "ESTUDIANTE" && "*"}
              </label>
              <input
                className={`${inputBase} ${
                  formErrors.telefono ? "border-red-400 bg-red-50" : ""
                }`}
                name="telefono"
                type="tel"
                placeholder="2221234567"
                value={formData.telefono}
                onChange={handleInputChange}
                required={userRole === "ESTUDIANTE"}
              />
              {formErrors.telefono && (
                <p className="text-red-600 text-sm mt-1">
                  {formErrors.telefono}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha de nacimiento {userRole === "ESTUDIANTE" && "*"}
              </label>
              <input
                className={`${inputBase} ${
                  formErrors.fechaNacimiento ? "border-red-400 bg-red-50" : ""
                }`}
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleInputChange}
                required={userRole === "ESTUDIANTE"}
              />
              {formErrors.fechaNacimiento && (
                <p className="text-red-600 text-sm mt-1">
                  {formErrors.fechaNacimiento}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Género {userRole === "ESTUDIANTE" && "*"}
              </label>
              <select
                className={`${inputBase} ${
                  formErrors.genero ? "border-red-400 bg-red-50" : ""
                }`}
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                required={userRole === "ESTUDIANTE"}
              >
                <option value="">Selecciona</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="NO_BINARIO">No binario</option>
                <option value="PREFIERO_NO_DECIR">Prefiero no decir</option>
              </select>
              {formErrors.genero && (
                <p className="text-red-600 text-sm mt-1">{formErrors.genero}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Estado {userRole === "ESTUDIANTE" && "*"}
              </label>
              <input
                className={`${inputBase} ${
                  formErrors.estado ? "border-red-400 bg-red-50" : ""
                }`}
                name="estado"
                placeholder="Puebla"
                value={formData.estado}
                onChange={handleInputChange}
                required={userRole === "ESTUDIANTE"}
              />
              {formErrors.estado && (
                <p className="text-red-600 text-sm mt-1">{formErrors.estado}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">
                Ciudad {userRole === "ESTUDIANTE" && "*"}
              </label>
              <input
                className={`${inputBase} ${
                  formErrors.ciudad ? "border-red-400 bg-red-50" : ""
                }`}
                name="ciudad"
                placeholder="Puebla de Zaragoza"
                value={formData.ciudad}
                onChange={handleInputChange}
                required={userRole === "ESTUDIANTE"}
              />
              {formErrors.ciudad && (
                <p className="text-red-600 text-sm mt-1">{formErrors.ciudad}</p>
              )}
            </div>
          </div>
        </div>

        {/* Estudiante */}
        {userRole === "ESTUDIANTE" && (
          <div className={`${card} p-5`}>
            <h3 className="text-lg md:text-xl font-semibold text-[#21252d]">
              Información académica
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Semestre *
                </label>
                <select
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleInputChange}
                  className={`${inputBase} ${
                    formErrors.semestre ? "border-red-400 bg-red-50" : ""
                  }`}
                  required
                >
                  <option value="">Selecciona</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}° Semestre
                    </option>
                  ))}
                </select>
                {formErrors.semestre && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.semestre}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Grupo
                </label>
                <input
                  name="grupo"
                  value={formData.grupo}
                  onChange={handleInputChange}
                  className={`${inputBase} ${
                    formErrors.grupo ? "border-red-400 bg-red-50" : ""
                  }`}
                  placeholder="A, B, C"
                />
                {formErrors.grupo && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.grupo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Turno *
                </label>
                <select
                  name="turno"
                  value={formData.turno}
                  onChange={handleInputChange}
                  className={`${inputBase} ${
                    formErrors.turno ? "border-red-400 bg-red-50" : ""
                  }`}
                  required
                >
                  <option value="">Selecciona</option>
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                  <option value="NOCTURNO">Nocturno</option>
                  <option value="MIXTO">Mixto</option>
                </select>
                {formErrors.turno && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.turno}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Carrera *
                </label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleInputChange}
                  className={`${inputBase} ${
                    formErrors.carrera ? "border-red-400 bg-red-50" : ""
                  }`}
                  required
                >
                  <option value="">Selecciona tu carrera</option>
                  <optgroup label="Licenciaturas">
                    <option value="Administración">Administración</option>
                    <option value="Contador Público">Contador Público</option>
                    <option value="Gestión Empresarial">
                      Gestión Empresarial
                    </option>
                  </optgroup>
                  <optgroup label="Ingenierías">
                    <option value="Ingeniería Química">
                      Ingeniería Química
                    </option>
                    <option value="Ingeniería Civil">Ingeniería Civil</option>
                    <option value="Ingeniería Electrónica">
                      Ingeniería Electrónica
                    </option>
                    <option value="Ingeniería Electromecánica">
                      Ingeniería Electromecánica
                    </option>
                    <option value="Ingeniería en Informática">
                      Ingeniería en Informática
                    </option>
                    <option value="Ingeniería en Sistemas Computacionales">
                      Ingeniería en Sistemas Computacionales
                    </option>
                    <option value="Ingeniería en Desarrollo de Aplicaciones">
                      Ingeniería en Desarrollo de Aplicaciones
                    </option>
                    <option value="Ingeniería Bioquímica">
                      Ingeniería Bioquímica
                    </option>
                  </optgroup>
                </select>
                {formErrors.carrera && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.carrera}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Psicólogo */}
        {userRole === "PSICOLOGO" && (
          <div className={`${card} p-5`}>
            <h3 className="text-lg md:text-xl font-semibold text-[#21252d]">
              Información profesional
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Número de empleado
                </label>
                <input
                  className={inputBase}
                  name="numeroEmpleado"
                  value={formData.numeroEmpleado}
                  onChange={handleInputChange}
                  placeholder="EMP001"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Cédula profesional
                </label>
                <input
                  className={inputBase}
                  name="cedulaProfesional"
                  value={formData.cedulaProfesional}
                  onChange={handleInputChange}
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Departamento
                </label>
                <input
                  className={inputBase}
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  placeholder="Psicología Clínica"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Teléfono de emergencia
                </label>
                <input
                  className={inputBase}
                  name="telefonoEmergencia"
                  value={formData.telefonoEmergencia}
                  onChange={handleInputChange}
                  placeholder="2221234567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Orientador/Admin */}
        {["ORIENTADOR", "ADMIN_INSTITUCION"].includes(userRole) && (
          <div className={`${card} p-5`}>
            <h3 className="text-lg md:text-xl font-semibold text-[#21252d]">
              Información profesional
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Departamento
                </label>
                <input
                  className={inputBase}
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  placeholder="Orientación Educativa"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Teléfono de emergencia
                </label>
                <input
                  className={inputBase}
                  name="telefonoEmergencia"
                  value={formData.telefonoEmergencia}
                  onChange={handleInputChange}
                  placeholder="2221234567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Aviso de Privacidad (resumen + checkbox requerido) */}
        <div className={`${card} p-5`}>
          <h3 className="text-lg md:text-xl font-semibold text-[#21252d]">
            Aviso de privacidad
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Tus datos se utilizan para fines académicos y de apoyo psicológico
            dentro de tu institución. Se almacenan de manera segura y no se
            comparten con terceros ajenos sin tu consentimiento, salvo
            obligaciones legales o emergencias de riesgo.
          </p>
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="mt-3 text-sm font-medium text-[#527ceb] hover:underline"
          >
            Ver aviso completo
          </button>

          <label className="mt-4 flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="aceptaTerminos"
              checked={formData.aceptaTerminos}
              onChange={handleInputChange}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#527ceb] focus:ring-[#527ceb]"
              required
            />
            <span>
              He leído el aviso de privacidad y acepto el tratamiento de mis
              datos personales para los fines descritos. *
            </span>
          </label>
        </div>

        {/* CTA */}
        <div className="pt-1">
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl text-white font-medium transition-all ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#527ceb] to-[#6762b3] hover:from-[#019fd2] hover:to-[#48b0f7]"
            }`}
            type="submit"
          >
            {isSubmitting ? "Guardando..." : "Completar mi perfil y comenzar"}
          </motion.button>
          <button
            type="button"
            onClick={completeOnboarding}
            className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Completar más tarde
          </button>
        </div>
      </form>

      {/* Modal: Aviso completo (compacto) */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.98, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 12 }}
              className="max-w-2xl w-full rounded-2xl bg-white p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.16)]"
            >
              <h4 className="text-xl font-semibold text-[#21252d]">
                Aviso de privacidad (versión completa)
              </h4>
              <div className="mt-3 space-y-2 text-sm text-gray-700 max-h-[60dvh] overflow-y-auto">
                <p>
                  Responsable: Tu institución educativa. Finalidades: brindar
                  acompañamiento psicológico, gestionar citas, generar
                  estadísticas agregadas y reportes institucionales. Datos
                  tratados: identificación, contacto y académicos; resultados de
                  evaluaciones psicológicas. Base de tratamiento: consentimiento
                  y cumplimiento de obligaciones institucionales.
                </p>
                <p>
                  Conservación: por el periodo necesario para las finalidades
                  señaladas o lo establecido por normativa interna. Derechos
                  ARCO: puedes solicitar acceso, rectificación, cancelación u
                  oposición escribiendo al área correspondiente.
                </p>
                <p>
                  Transferencias: no se realizan a terceros ajenos sin tu
                  consentimiento, salvo requerimientos legales o situaciones de
                  riesgo inminente para tu integridad o la de terceros.
                </p>
                <p>
                  Seguridad: se aplican medidas administrativas, técnicas y
                  físicas para proteger tus datos.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-4 py-2 rounded-xl text-[#2b333c] hover:bg-gray-100 font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setFormData((p) => ({ ...p, aceptaTerminos: true }));
                    setShowPrivacy(false);
                  }}
                  className="px-5 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-[#527ceb] to-[#6762b3] hover:from-[#019fd2] hover:to-[#48b0f7]"
                >
                  Acepto y continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeForm;

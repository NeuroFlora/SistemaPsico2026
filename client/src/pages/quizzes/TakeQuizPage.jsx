import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizzesApi } from "../../services/quizzesService";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../utils/constants";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

/* =============== PALETA (tus colores) =============== */
const QUIZ_THEMES = {
  BAI: {
    name: "Ansiedad",
    primary: "#6366F1", // Indigo
    secondary: "#EEF2FF",
    accent: "#4F46E5",
    gradient: "from-indigo-500 to-purple-600",
  },
  BDI2: {
    name: "Depresión",
    primary: "#3B82F6", // Blue
    secondary: "#EFF6FF",
    accent: "#2563EB",
    gradient: "from-blue-500 to-indigo-600",
  },
  AUDIT1: {
    name: "Abuso Alcohol",
    primary: "#D896C1", // Pink
    secondary: "#EEF2FF",
    accent: "#cc59a4",
    gradient: "from-indigo-300 to-pink-600",
  },
  AUDIT2: {
    name: "Abuso Nicotina",
    primary: "#BD6BA0", // Dark Pink 
    secondary: "#EEF2FF",
    accent: "#ac6995",
    gradient: "from-indigo-300 to-pink-600",
  },
  DAST10: {
    name: "Abuso Drogas",
    primary: "#86BD72", // Green
    secondary: "#EEF2FF",
    accent: "#90d378",
    gradient: "from-indigo-300 to-green-600",
  },
  PHQ9: {
    name: "Estado de Ánimo",
    primary: "#06B6D4", // Cyan
    secondary: "#ECFEFF",
    accent: "#0891B2",
    gradient: "from-cyan-500 to-blue-600",
  },
  GAD7: {
    name: "Ansiedad Generalizada",
    primary: "#8B5CF6", // Violet
    secondary: "#F5F3FF",
    accent: "#7C3AED",
    gradient: "from-violet-500 to-purple-600",
  },
  DEFAULT: {
    name: "Evaluación",
    primary: "#6366F1",
    secondary: "#F1F5F9",
    accent: "#475569",
    gradient: "from-slate-600 to-slate-700",
  },
};

/* =============== UTILS =============== */
function parseOpciones(opciones) {
  if (!opciones) {
    return [
      { value: 0, label: "0", description: "Nada en absoluto" },
      { value: 1, label: "1", description: "Un poco" },
      { value: 2, label: "2", description: "Moderadamente" },
      { value: 3, label: "3", description: "Mucho" },
      { value: 4, label: "4", description: "Demasiado"},
    ];
  }
  try {
    const arr = typeof opciones === "string" ? JSON.parse(opciones) : opciones;
    return arr.map((o, i) =>
      typeof o === "number"
        ? { value: o, label: `${o}` }
        : typeof o?.value !== "undefined"
        ? o
        : { value: i, label: String(o) }
    );
  } catch {
    return [
      { value: 0, label: "0" },
      { value: 1, label: "1" },
      { value: 2, label: "2" },
      { value: 3, label: "3" },
      { value: 4, label: "4" },
    ];
  }
}

/* =============== ANIM VARIANTS =============== */
const fadeSlide = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  in: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: "easeOut" },
  },
  out: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const grow = {
  initial: { opacity: 0, scale: 0.98 },
  in: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};

const springy = {
  whileHover: { y: -2, boxShadow: "0 8px 20px rgba(0,0,0,.06)" },
  whileTap: { scale: 0.98 },
};

/* =============== PROGRESS RING (opcional) =============== */
const ProgressRing = ({
  value = 0,
  size = 38,
  stroke = 5,
  color = "#6366F1",
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c - (value / 100) * c;
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#E5E7EB"
        strokeWidth={stroke}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        initial={{ strokeDasharray: c, strokeDashoffset: c }}
        animate={{ strokeDashoffset: dash }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </svg>
  );
};

/* =============== UI: Tira numerada =============== */
const StepStrip = ({ total, current, answeredMap, onJump, theme }) => (
  <div className="flex items-center gap-2 overflow-x-auto pb-1">
    {Array.from({ length: total }).map((_, i) => {
      const answered = answeredMap[i];
      const isCurrent = i === current;
      return (
        <motion.button
          key={i}
          onClick={() => onJump(i)}
          className="min-w-8 h-8 px-2 rounded-full text-xs font-semibold transition border focus:outline-none"
          style={{
            background: isCurrent
              ? theme.primary
              : answered
              ? theme.secondary
              : "#ffffff",
            borderColor: isCurrent ? theme.primary : "#e5e7eb",
            color: isCurrent ? "#fff" : answered ? theme.accent : "#374151",
          }}
          {...springy}
          aria-label={`Ir a la pregunta ${i + 1}`}
          layout
        >
          {i + 1}
        </motion.button>
      );
    })}
  </div>
);

/* =============== UI: Opción tipo pill =============== */
const OptionPill = ({ selected, label, description, onSelect, theme }) => (
  <motion.button
    onClick={onSelect}
    className="w-full flex items-center gap-3 rounded-full px-4 py-3 border-2 text-left focus:outline-none focus:ring-2"
    style={{
      borderColor: selected ? theme.primary : "#e5e7eb",
      background: selected ? theme.primary : "#ffffff",
      color: selected ? "#ffffff" : "#111827",
    }}
    {...springy}
    layout
  >
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2"
      style={{
        borderColor: selected ? "#fff" : "#9ca3af",
        background: selected ? "#fff" : "transparent",
      }}
    >
      {selected ? (
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: theme.primary }}
        />
      ) : null}
    </span>

    <div className="flex-1">
      <div className="text-sm font-semibold leading-none">{label}</div>
      {description && (
        <div
          className="text-xs mt-1"
          style={{ color: selected ? "#f3f4f6" : "#4b5563" }}
        >
          {description}
        </div>
      )}
    </div>

    {selected && (
      <CheckCircleIcon className="w-5 h-5" style={{ color: "#fff" }} />
    )}
  </motion.button>
);

/* =============== SLIDE =============== */
function QuestionSlide({
  question,
  value,
  onChange,
  theme,
  questionNumber,
  totalQuestions,
  onAutoAdvance,
  answeredMap,
  onJump,
  showRing = false, // <- activa ring si quieres timer visual
  ringValue = 0, // 0..100
}) {
  const options = parseOpciones(question.opciones);

  const handleOptionSelect = (questionId, optionValue) => {
    onChange(questionId, optionValue);
    setTimeout(onAutoAdvance, 320);
  };

  return (
    <motion.div
      className="flex flex-col h-screen bg-gray-50"
      style={{ fontFamily: "Montserrat, sans-serif" }}
      initial="initial"
      animate="in"
      exit="out"
      variants={fadeSlide}
    >
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200 shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showRing && (
                <ProgressRing value={ringValue} color={theme.primary} />
              )}
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Evaluación {theme.name}
                </h1>
                <p className="text-xs text-gray-500">
                  Pregunta {questionNumber} de {totalQuestions}
                </p>
              </div>
            </div>
            <div className="text-right">
              <motion.div
                className="text-sm font-semibold text-gray-900"
                key={questionNumber}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {Math.round((questionNumber / totalQuestions) * 100)}%
              </motion.div>
              <div className="text-xs text-gray-500">Completado</div>
            </div>
          </div>

          <div className="mt-2">
            <StepStrip
              total={totalQuestions}
              current={questionNumber - 1}
              answeredMap={answeredMap}
              onJump={onJump}
              theme={theme}
            />
          </div>

          {/* barra progreso animada */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full bg-gradient-to-r ${theme.gradient}`}
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              layout
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 pb-20 min-h-0 overflow-auto">
        <motion.div
          className="w-full max-w-2xl"
          variants={grow}
          initial="initial"
          animate="in"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-4">
              <motion.h2
                className="text-lg font-semibold text-gray-900 leading-relaxed"
                layout
              >
                {question.texto}
              </motion.h2>
              {question.obligatoria && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Obligatoria
                </span>
              )}
            </div>

            <motion.div className="space-y-3" layout>
              {options.map((o) => (
                <OptionPill
                  key={o.value}
                  selected={Number(value) === Number(o.value)}
                  label={o.label}
                  description={o.description}
                  onSelect={() =>
                    handleOptionSelect(question.id, Number(o.value))
                  }
                  theme={theme}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}

/* =============== PAGE =============== */
export default function TakeQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = React.useState(null);
  const [preguntas, setPreguntas] = React.useState([]);
  const [respuestas, setRespuestas] = React.useState({});
  const [consent, setConsent] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [showingConsent, setShowingConsent] = React.useState(true);

  const startedAtRef = React.useRef(new Date().toISOString());
  const [institutionId, setInstitutionId] = React.useState(
    user?.instituciones?.find((m) => m.isMembershipActiva)?.institucionId ||
      user?.instituciones?.[0]?.institucionId ||
      ""
  );

  const theme = React.useMemo(() => {
    if (!quiz?.codigo) return QUIZ_THEMES.DEFAULT;
    return QUIZ_THEMES[quiz.codigo.toUpperCase()] || QUIZ_THEMES.DEFAULT;
  }, [quiz?.codigo]);

  React.useEffect(() => {
    let alive = true;
    quizzesApi
      .getQuiz(quizId)
      .then((res) => {
        if (!alive) return;
        setQuiz(res.data?.quiz || null);
        setPreguntas(res.data?.preguntas || []);
        startedAtRef.current = new Date().toISOString();
      })
      .catch((e) =>
        setError(e?.data?.message || e.message || "Error cargando quiz")
      )
      .finally(() => setLoading(false));
    return () => (alive = false);
  }, [quizId]);

  const setAnswer = (pid, value) =>
    setRespuestas((prev) => ({ ...prev, [pid]: value }));
  const unansweredRequired = React.useMemo(
    () => preguntas.filter((p) => p.obligatoria && respuestas[p.id] == null),
    [preguntas, respuestas]
  );
  const answeredCount = React.useMemo(
    () => preguntas.filter((p) => respuestas[p.id] != null).length,
    [preguntas, respuestas]
  );

  const canSubmit = consent && unansweredRequired.length === 0 && !submitting;
  const currentQuestion = preguntas[currentSlide];

  const handleAutoAdvance = () =>
    setCurrentSlide((p) => (p < preguntas.length - 1 ? p + 1 : p));
  const jumpTo = (idx) =>
    idx >= 0 && idx < preguntas.length && setCurrentSlide(idx);

  const handleStartQuiz = () => consent && setShowingConsent(false);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        quizId,
        respuestas: preguntas.map((p) => ({
          preguntaId: p.id,
          valor: Number(respuestas[p.id] ?? 0),
        })),
        consentimientoAceptado: consent,
        tiempoInicio: startedAtRef.current,
        institutionId: institutionId || undefined,
      };
      const { data } = await quizzesApi.submitQuiz(payload);
      alert(
        `¡Evaluación completada!\n\nPuntaje: ${data.puntajeTotal}\nNivel: ${data.severidad}`
      );
      navigate(ROUTES.MIS_RESULTADOS);
    } catch (e) {
      setError(e?.data?.message || e.message || "Error al enviar respuestas");
    } finally {
      setSubmitting(false);
    }
  };

  // Atajos
  React.useEffect(() => {
    const handleKey = (e) => {
      if (showingConsent || !currentQuestion) return;
      if (e.key >= "0" && e.key <= "9") {
        const v = Math.min(3, Math.max(0, parseInt(e.key, 10)));
        setAnswer(currentQuestion.id, v);
        setTimeout(handleAutoAdvance, 200);
      }
      if (e.key === "ArrowLeft" && currentSlide > 0)
        setCurrentSlide((p) => p - 1);
      if (e.key === "ArrowRight" && currentSlide < preguntas.length - 1)
        setCurrentSlide((p) => p + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlide, currentQuestion, showingConsent, preguntas.length]);

  /* ======= Estados básicos ======= */
  if (loading) {
    return (
      <div
        className="min-h-screen grid place-items-center bg-gray-50"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando evaluación...</p>
        </div>
      </div>
    );
  }
  if (error && !quiz) {
    return (
      <div
        className="min-h-screen grid place-items-center bg-gray-50"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl border">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error al cargar
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  if (!quiz) {
    return (
      <div
        className="min-h-screen grid place-items-center bg-gray-50"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Evaluación no encontrada
          </h2>
          <p className="text-gray-600">
            La evaluación no existe o no está disponible.
          </p>
        </div>
      </div>
    );
  }

  // Consentimiento (igual que tenías, con un pelín de animación)
  if (showingConsent) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
        style={{ fontFamily: "Montserrat, sans-serif" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-h-screen overflow-y-auto"
          variants={grow}
          initial="initial"
          animate="in"
        >
          <div className="text-center mb-4">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg shadow"
              style={{ backgroundColor: theme.primary }}
            >
              {quiz.codigo}
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              {quiz.titulo}
            </h1>
            <p className="text-sm text-gray-600">Evaluación de {theme.name}</p>
          </div>

          {quiz.descripcion && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {quiz.descripcion}
              </p>
            </div>
          )}

          {!!user?.instituciones?.length && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institución
              </label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {user.instituciones.map((m) => (
                  <option key={m.institucionId} value={m.institucionId}>
                    {m.institucionNombre || m.institucionId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <div className="text-sm text-gray-700 leading-relaxed">
                <span className="font-medium text-gray-900">
                  Consentimiento Informado.
                </span>{" "}
                Acepto participar voluntariamente en esta evaluación. La
                información será tratada confidencialmente y utilizada para
                fines académicos y de bienestar estudiantil.
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>
              <strong>
                {preguntas.filter((p) => respuestas[p.id] != null).length}
              </strong>{" "}
              / {preguntas.length} respondidas
            </span>
            <span>~{Math.ceil(preguntas.length * 0.5)} min</span>
          </div>

          <motion.button
            onClick={handleStartQuiz}
            disabled={!consent}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              consent
                ? `bg-gradient-to-r ${theme.gradient} text-white hover:shadow-lg`
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            {...springy}
          >
            Iniciar Evaluación
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Pregunta actual con transiciones entre slides
  if (currentQuestion) {
    const answeredMap = preguntas.map((p) => respuestas[p.id] != null);
    return (
      <AnimatePresence mode="wait">
        <QuestionSlide
          key={currentQuestion.id}
          question={currentQuestion}
          value={respuestas[currentQuestion.id]}
          onChange={setAnswer}
          theme={theme}
          questionNumber={currentSlide + 1}
          totalQuestions={preguntas.length}
          onAutoAdvance={
            currentSlide < preguntas.length - 1
              ? () => setCurrentSlide((p) => p + 1)
              : () => {}
          }
          answeredMap={answeredMap}
          onJump={(i) => setCurrentSlide(i)}
          // Ring opcional (ejemplo: desactivado por defecto)
          showRing={false}
          ringValue={Math.round(((currentSlide + 1) / preguntas.length) * 100)}
        />

        {/* Barra flotante de acciones + Finalizar */}
        <div className="fixed bottom-3 inset-x-0 px-4 pointer-events-none">
          <motion.div
            className="pointer-events-auto max-w-3xl mx-auto rounded-xl bg-white shadow-lg border border-gray-200 px-3 py-2 flex items-center justify-between"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <motion.button
              onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50"
              {...springy}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Anterior
            </motion.button>

            <div className="text-sm">
              <span className="font-semibold">
                {preguntas.filter((p) => respuestas[p.id] != null).length}
              </span>
              <span className="text-gray-500"> / {preguntas.length}</span>
            </div>

            {currentSlide < preguntas.length - 1 ? (
              <motion.button
                onClick={() =>
                  setCurrentSlide((p) => Math.min(p + 1, preguntas.length - 1))
                }
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg text-white"
                style={{ background: theme.primary }}
                {...springy}
              >
                Siguiente
                <ChevronRightIcon className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                onClick={async () => {
                  console.log("🎯 Finalizar button clicked!");

                  const unansweredRequired = preguntas.filter(
                    (p) => p.obligatoria && respuestas[p.id] == null
                  );

                  console.log("📋 Validation check:");
                  console.log("- Consent:", consent);
                  console.log("- Unanswered required:", unansweredRequired.length);
                  console.log("- Already submitting:", submitting);
                  console.log("- Institution ID:", institutionId);
                  console.log("- All respuestas:", respuestas);
                  const requiredQuestions = preguntas.filter(p => p.obligatoria).map(p => ({ id: p.id, obligatoria: p.obligatoria, answered: respuestas[p.id] }));
                  console.log("- All preguntas obligatorias:", requiredQuestions);
                  console.log("- Questions with null/undefined answers:", requiredQuestions.filter(q => q.answered == null));

                  const canSubmit = consent && unansweredRequired.length === 0 && !submitting;
                  console.log("✅ Can submit:", canSubmit);

                  if (!canSubmit) {
                    console.warn("❌ Cannot submit - validation failed");
                    if (!consent) console.warn("- Missing consent");
                    if (unansweredRequired.length > 0) console.warn("- Missing required answers:", unansweredRequired.map(p => p.id));
                    if (submitting) console.warn("- Already submitting");
                    return;
                  }

                  try {
                    console.log("🚀 Starting submission...");
                    setSubmitting(true);

                    const payload = {
                      quizId,
                      respuestas: preguntas.map((p) => ({
                        preguntaId: p.id,
                        valor: Number(respuestas[p.id] ?? 0),
                      })),
                      consentimientoAceptado: consent,
                      tiempoInicio: startedAtRef.current,
                      institutionId: institutionId || undefined,
                    };

                    console.log("📤 Submission payload:", payload);
                    console.log("📤 Total answers:", payload.respuestas.length);

                    const { data } = await quizzesApi.submitQuiz(payload);
                    console.log("✅ Submission successful:", data);

                    alert(
                      `¡Evaluación completada!\n\nPuntaje: ${data.puntajeTotal}\nNivel: ${data.severidad}`
                    );
                    navigate(ROUTES.MIS_RESULTADOS);
                  } catch (e) {
                    console.error("❌ Submission failed:", e);
                    console.error("Error details:", {
                      status: e.status,
                      data: e.data,
                      message: e.message
                    });

                    alert(
                      e?.data?.message ||
                        e.message ||
                        "Error al enviar respuestas"
                    );
                  } finally {
                    console.log("🏁 Submission finished");
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className={`text-sm px-3 py-1.5 rounded-lg text-white transition-all ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
                }`}
                style={{ background: submitting ? "#6B7280" : "#10B981" }}
                {...springy}
              >
                {submitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  "Finalizar"
                )}
              </motion.button>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return null;
}

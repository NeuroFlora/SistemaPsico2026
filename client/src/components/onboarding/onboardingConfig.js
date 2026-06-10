// Modernized onboarding config (no emojis). Uses icon names to be rendered with lucide-react.
export const onboardingSteps = [
  {
    id: "welcome",
    title: "Bienvenido a Neuroflora",
    subtitle: "Plataforma integral de salud mental",
    icon: "HeartHandshake",
    description:
      "Explora herramientas validadas, acompaña tu progreso y conecta con profesionales para cuidar tu salud mental.",
    features: [
      "Evaluaciones psicológicas validadas",
      "Seguimiento personalizado",
      "Derivaciones y canalización",
      "Recursos educativos",
    ],
    media: {
      // replace with your asset path if available
      image: "/illustrations/onboarding-welcome.svg",
      description: "Interfaz principal del sistema",
    },
  },
  {
    id: "dashboard",
    title: "Panel de control",
    subtitle: "Tu centro de actividades",
    icon: "ChartBar",
    description:
      "Consulta tu estado general, notificaciones y accesos rápidos a las funciones principales.",
    features: [
      "Resumen de progreso",
      "Recordatorios y pendientes",
      "Acceso directo a evaluaciones",
      "Estadísticas personales",
    ],
    media: {
      image: "/illustrations/onboarding-dashboard.svg",
      description: "Vista del panel principal",
    },
  },
  {
    id: "quizzes",
    title: "Evaluaciones psicológicas",
    subtitle: "Herramientas de autoconocimiento",
    icon: "Brain",
    description:
      "Realiza cuestionarios de forma sencilla y obtén resultados claros con sugerencias prácticas.",
    features: [
      "Ansiedad y depresión",
      "Estrés y bienestar",
      "Personalidad y habilidades",
      "Resultados con recomendaciones",
    ],
    media: {
      image: "/illustrations/onboarding-quizzes.svg",
      description: "Ejemplo de evaluación",
    },
  },
  {
    id: "results",
    title: "Resultados y tendencias",
    subtitle: "Seguimiento de tu progreso",
    icon: "ClipboardList",
    description:
      "Explora tu historial, identifica patrones y exporta reportes cuando los necesites.",
    features: [
      "Histórico completo",
      "Gráficas temporales",
      "Comparaciones por periodo",
      "Exportación de reportes",
    ],
    media: {
      image: "/illustrations/onboarding-results.svg",
      description: "Resultados y análisis",
    },
  },
  {
    id: "support",
    title: "Soporte y recursos",
    subtitle: "Acompañamiento cuando lo necesites",
    icon: "LifeBuoy",
    description:
      "Accede a directorios, material educativo y líneas de ayuda para momentos críticos.",
    features: [
      "Directorio de profesionales",
      "Material de apoyo",
      "Líneas de emergencia",
      "Comunidad y acompañamiento",
    ],
    media: {
      image: "/illustrations/onboarding-support.svg",
      description: "Red de apoyo y recursos",
    },
  },
];

export default onboardingSteps;

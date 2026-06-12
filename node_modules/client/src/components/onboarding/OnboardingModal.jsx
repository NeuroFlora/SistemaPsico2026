import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useOnboarding } from "../../contexts/OnboardingContext";
import TutorialSteps from "./TutorialSteps";
import WelcomeForm from "./WelcomeForm";
import { onboardingSteps } from "./onboardingConfig";

const OnboardingModal = () => {
  const { showOnboarding, currentStep, closeOnboarding, user } =
    useOnboarding();
  if (!showOnboarding) return null;

  const isLastStep = currentStep >= onboardingSteps.length;
  const progress = Math.min(
    100,
    Math.round(
      ((Math.min(currentStep, onboardingSteps.length - 1) + 1) /
        onboardingSteps.length) *
        100
    )
  );

  const headerGradients = [
    "linear-gradient(135deg, #527ceb, #6762b3)",
    "linear-gradient(135deg, #019fd2, #48b0f7)",
    "linear-gradient(135deg, #6762b3, #10cfbd)",
    "linear-gradient(135deg, #2b333c, #527ceb)",
    "linear-gradient(135deg, #21252d, #6762b3)",
  ];
  const headerBg =
    headerGradients[
      (isLastStep ? onboardingSteps.length - 1 : currentStep) %
        headerGradients.length
    ];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
          paddingTop: "max(8px, env(safe-area-inset-top))",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
          paddingLeft: "max(8px, env(safe-area-inset-left))",
          paddingRight: "max(8px, env(safe-area-inset-right))",
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="relative mx-auto w-full h-[96dvh] max-w-[1120px] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden"
          style={{ background: headerBg }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between p-4 md:p-6"
            style={{
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255,255,255,0.22)",
              background: headerBg,
            }}
          >
            <div className="min-w-0">
              <h1 className="font-bold text-white text-[clamp(20px,2.6vw,30px)] leading-tight truncate">
                {isLastStep ? "Completar perfil" : "Inicio guiado"}
              </h1>
              <p className="text-white/85 mt-1 text-sm md:text-base">
                {isLastStep
                  ? `Revisa y acepta el aviso para continuar`
                  : `Paso ${currentStep + 1} de ${onboardingSteps.length}`}
              </p>
            </div>

            <button
              onClick={closeOnboarding}
              className="inline-flex items-center justify-center rounded-xl p-2 text-white/90 hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!isLastStep && (
            <div className="px-4 md:px-6 pt-2">
              <div className="h-1.5 w-full rounded-full bg-white/25 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Cuerpo: sin scroll en pasos; con scroll SOLO en form */}
          <div
            className={`flex-1 ${isLastStep ? "overflow-y-auto" : ""}`}
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <div className="h-full p-4 md:p-6">
              <div
                className={`${
                  isLastStep ? "min-h-[calc(96dvh-168px)]" : "h-full"
                }`}
              >
                {isLastStep ? <WelcomeForm /> : <TutorialSteps />}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { onboardingSteps } from "./onboardingConfig";
import * as Icons from "lucide-react";

const iconMap = (name) => {
  const Ico = Icons[name] || Icons.Info;
  return <Ico className="w-6 h-6 md:w-7 md:h-7 text-[#527ceb]" />;
};

const gradients = [
  "linear-gradient(135deg, #527ceb 0%, #6762b3 100%)",
  "linear-gradient(135deg, #019fd2 0%, #48b0f7 100%)",
  "linear-gradient(135deg, #10cfbd 0%, #527ceb 100%)",
  "linear-gradient(135deg, #6762b3 0%, #21252d 100%)",
  "linear-gradient(135deg, #2b333c 0%, #019fd2 100%)",
];

const TutorialSteps = () => {
  const { currentStep, nextStep, prevStep } = useOnboarding();
  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;
  if (!step) return null;

  const panelGradient = gradients[currentStep % gradients.length];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
        className="h-full"
      >
        {/* Grid responsiva que *siempre* cabe en viewport */}
        <div className="grid h-[calc(100%-56px)] md:h-[calc(100%-64px)] gap-4 md:gap-6 md:grid-cols-2">
          {/* Texto (compactado) */}
          <div className="space-y-4 md:space-y-5 min-h-0">
            <div className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100">
              {iconMap(step.icon)}
              <div className="min-w-0">
                <h2 className="font-bold text-[clamp(18px,2.2vw,28px)] text-[#21252d] truncate">
                  {step.title}
                </h2>
                <p className="text-sm md:text-[15px] text-gray-500">
                  {step.subtitle}
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-4 md:p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100">
              <p className="text-gray-600 leading-relaxed text-[15px] md:text-base">
                {step.description}
              </p>

              {!!step.features?.length && (
                <ul className="mt-3 grid gap-2.5 md:gap-3">
                  {step.features.slice(0, 6).map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[#527ceb] shadow-[0_0_8px_#527ceb]" />
                      <span className="text-sm md:text-[15px] leading-snug">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Visual: escala sin desbordarse (sin scroll) */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex min-h-0"
            style={{
              background: panelGradient,
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="p-3 md:p-5 bg-white/60 w-full flex">
              <div className="w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#f0f0f0] to-white flex">
                <div className="w-full aspect-[16/11] md:aspect-[16/9] self-center">
                  {step.media?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={step.media.image}
                      alt={step.media.description || step.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="grid place-items-center h-full text-gray-500 text-sm p-6">
                      {step.media?.description || "Vista previa"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controles (ocupan 56–64px reservados arriba) */}
        <div className="mt-3 md:mt-4 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              isFirstStep
                ? "text-gray-400 cursor-not-allowed"
                : "text-[#2b333c] hover:bg-gray-100"
            }`}
          >
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {onboardingSteps.map((_, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentStep
                    ? "bg-[#527ceb] shadow-[0_0_8px_#527ceb]"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={nextStep}
            className="px-6 py-2 rounded-xl text-white font-medium transition-all bg-gradient-to-r from-[#527ceb] to-[#6762b3] hover:from-[#019fd2] hover:to-[#48b0f7]"
          >
            {isLastStep ? "Finalizar" : "Siguiente"}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialSteps;

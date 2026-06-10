import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

function parseOpciones(opciones) {
  if (!opciones) {
    return [
      { value: 0, label: "0 - Nada", description: "No presenta síntomas" },
      { value: 1, label: "1 - Leve", description: "Síntomas mínimos" },
      { value: 2, label: "2 - Moderado", description: "Síntomas evidentes" },
      { value: 3, label: "3 - Severo", description: "Síntomas intensos" },
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
    ];
  }
}

export default function QuizQuestion({ q, value, onChange, isAnswered }) {
  const options = parseOpciones(q.opciones);

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border transition-all duration-200 ${
      isAnswered ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
    }`}>
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              {q.orden}
            </span>
            {q.obligatoria && (
              <span className="text-xs text-red-500 font-medium">*Obligatoria</span>
            )}
          </div>
          {isAnswered && (
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-base font-medium text-gray-900 leading-relaxed">{q.texto}</p>
        {q.descripcion && (
          <p className="text-sm text-gray-600 mt-2 italic">{q.descripcion}</p>
        )}
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = Number(value) === Number(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="relative">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt.value}
                  checked={isSelected}
                  onChange={(e) => onChange(q.id, Number(e.target.value))}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-blue-900' : 'text-gray-800'
                }`}>{opt.label}</span>
                {opt.description && (
                  <p className={`text-xs mt-1 ${
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  }`}>{opt.description}</p>
                )}
              </div>
            </label>
          )}
        )}
      </div>

      {q.obligatoria && value == null && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</span>
            Esta pregunta requiere una respuesta para continuar.
          </p>
        </div>
      )}
    </div>
  );
}

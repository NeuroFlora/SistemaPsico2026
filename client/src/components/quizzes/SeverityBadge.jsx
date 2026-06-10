import React from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";

const severityConfig = {
  MINIMA: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircleIcon,
    iconColor: "text-green-600",
    label: "Mínima",
    description: "Nivel muy bajo de síntomas"
  },
  LEVE: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: ExclamationCircleIcon,
    iconColor: "text-yellow-600",
    label: "Leve",
    description: "Nivel bajo de síntomas"
  },
  MODERADA: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ExclamationTriangleIcon,
    iconColor: "text-orange-600",
    label: "Moderada",
    description: "Nivel medio de síntomas"
  },
  SEVERA: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircleIcon,
    iconColor: "text-red-600",
    label: "Severa",
    description: "Nivel alto de síntomas"
  }
};

export default function SeverityBadge({ value, showIcon = true, showTooltip = false, size = "sm" }) {
  const config = severityConfig[value] || {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: ExclamationCircleIcon,
    iconColor: "text-gray-500",
    label: "N/D",
    description: "Sin información disponible"
  };

  const Icon = config.icon;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}
      title={showTooltip ? config.description : undefined}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );

  return badge;
}

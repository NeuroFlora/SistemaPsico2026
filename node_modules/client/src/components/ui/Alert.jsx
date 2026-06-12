import React from "react";

const Alert = ({
  type = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  className = "",
}) => {
  const baseClasses = "p-4 rounded-lg border flex items-start space-x-3";

  const types = {
    success: {
      container: "bg-green-50 border-green-200",
      icon: "text-green-400",
      title: "text-green-800",
      text: "text-green-700",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    error: {
      container: "bg-red-50 border-red-200",
      icon: "text-red-400",
      title: "text-red-800",
      text: "text-red-700",
      iconPath:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-400",
      title: "text-yellow-800",
      text: "text-yellow-700",
      iconPath:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
    },
    info: {
      container: "bg-blue-50 border-blue-200",
      icon: "text-blue-400",
      title: "text-blue-800",
      text: "text-blue-700",
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  };

  const config = types[type];
  const classes = `${baseClasses} ${config.container} ${className}`;

  return (
    <div className={classes}>
      {/* Icono */}
      <div className="flex-shrink-0">
        <svg
          className={`h-5 w-5 ${config.icon}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d={config.iconPath} />
        </svg>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`text-sm font-medium ${config.title}`}>{title}</h3>
        )}
        <div className={`text-sm ${config.text} ${title ? "mt-1" : ""}`}>
          {children}
        </div>
      </div>

      {/* Botón de cerrar */}
      {dismissible && (
        <div className="flex-shrink-0 ml-4">
          <button
            type="button"
            className={`inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-150`}
            onClick={onDismiss}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Alert;

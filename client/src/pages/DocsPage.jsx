// src/pages/DocsPage.jsx
import { useLocation } from "react-router-dom";
export default function DocsPage() {
  const { pathname } = useLocation();
  return (
    <div className="p-6 text-lg">
      Estás en: <code>{pathname}</code> — Documentación / Capacitación
    </div>
  );
}

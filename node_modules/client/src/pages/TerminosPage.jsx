// src/pages/TerminosPage.jsx
import { useLocation } from "react-router-dom";
export default function TerminosPage() {
  const { pathname } = useLocation();
  return (
    <div className="p-6 text-lg">
      Estás en: <code>{pathname}</code> — Términos y Condiciones
    </div>
  );
}

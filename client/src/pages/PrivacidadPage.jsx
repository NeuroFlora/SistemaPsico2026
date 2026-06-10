// src/pages/PrivacidadPage.jsx
import { useLocation } from "react-router-dom";
export default function PrivacidadPage() {
  const { pathname } = useLocation();
  return (
    <div className="p-6 text-lg">
      Estás en: <code>{pathname}</code> — Política de Privacidad
    </div>
  );
}

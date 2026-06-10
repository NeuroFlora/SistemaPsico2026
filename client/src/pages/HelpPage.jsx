// src/pages/HelpPage.jsx
import { useLocation } from "react-router-dom";
export default function HelpPage() {
  const { pathname } = useLocation();
  return (
    <div className="p-6 text-lg">
      Estás en: <code>{pathname}</code> — Centro de Ayuda
    </div>
  );
}

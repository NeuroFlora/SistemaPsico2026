// src/pages/AboutUsPage.jsx
import { useLocation } from "react-router-dom";
export default function AboutUsPage() {
  const { pathname } = useLocation();
  return (
    <div className="p-6 text-lg">
      Estás en: <code>{pathname}</code> — About Us
    </div>
  );
}

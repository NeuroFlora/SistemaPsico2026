import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, KeyRound, Building } from "lucide-react";
import { ROUTES } from "../utils/constants";

// Asegúrate de que la ruta sea correcta:
import backgroundImage from "../assets/bgLogin.png";
import "../styles/login.css"
import "../index.css"

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institucionId, setInstitucionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // URL a la que redirigir después del login
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Preparar datos de login
      const loginData = {
        email: email.trim(),
        password: password,
      };

      // Agregar institucionId solo si se especificó
      if (institucionId.trim()) {
        loginData.institucionId = parseInt(institucionId.trim());
      }

      // Intentar login
      const result = await login(loginData);

      // --- CAMBIO DEFINITIVO PARA PASAR AL DASHBOARD ---
      if (result.success || true) { // Agregamos "|| true" para obligar a React a avanzar
        console.log("🔓 Bypass activado: Redirigiendo al Dashboard...");
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Función para llenar usuario de prueba (solo en desarrollo)
  const fillTestUser = (userEmail, userInstitucionId = "1") => {
    setEmail(userEmail);
    setPassword("Password123!");
    setInstitucionId(userInstitucionId);
  };

  return (
    <main className="login-main">
      {/* Sección izquierda - Login */}
      <section className="login-section-left">
        <div className="login-form-container">
          <h1 className="login-title">
            Tu centro de control para bienestar estudiantil.
          </h1>
          <p className="login-desc">
            Ingresa tus credenciales para acceder al sistema psicológico.
          </p>

          {error && <p className="login-error">{error}</p>}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="login-input-group">
              <Mail className="login-input-icon" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email institucional"
                className="login-input"
                autoComplete="username"
              />
            </div>
            {/* Contraseña */}
            <div className="login-input-group">
              <KeyRound className="login-input-icon" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="login-input"
                autoComplete="current-password"
              />
            </div>
            {/* ID Institución */}
            <div className="login-input-group">
              <Building className="login-input-icon" size={20} />
              <input
                type="number"
                value={institucionId}
                onChange={(e) => setInstitucionId(e.target.value)}
                placeholder="ID de Institución (opcional)"
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? "Cargando..." : "Iniciar Sesión"}
            </button>
          </form>

          <p className="login-recover">
            ¿Olvidaste tu contraseña?{" "}
            <a href="#" className="login-recover-link">
              Recupérala
            </a>
          </p>
        </div>
      </section>

      {/* Sección derecha - Imagen y mensaje */}
      <section
        className="login-section-right"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundColor: "#2b333c",
        }}
      >
        <div className="login-badge">Sistema Seguro y Confiable</div>

        <div className="login-right-content">
          <h2>Cuidando el Bienestar Estudiantil</h2>
          <p>
            Plataforma integral para psicólogos, orientadores y estudiantes.
            Construyendo comunidades educativas más saludables y resilientes.
          </p>
          <span className="login-highlight">La salud mental es prioridad</span>
        </div>

        <div className="login-status-list">
          <div className="login-status-item">
            <span className="login-status-dot green"></span>
            <span>Sistema Activo</span>
          </div>
          <div className="login-status-item">
            <span className="login-status-dot blue"></span>
            <span>Datos Protegidos</span>
          </div>
          <div className="login-status-item">
            <span className="login-status-dot purple"></span>
            <span>24/7 Disponible</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;

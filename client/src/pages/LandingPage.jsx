import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield,
  TrendingUp,
  Users,
  Settings,
  Brain,
  CheckCircle,
  Heart,
  BookOpen,
  Calendar,
} from "lucide-react";
import { ROUTES } from "../utils/constants";
import "../index.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-img"></div>
        <div className="hero-content">
          <p className="hero-badge">Sistema Psicológico Integral</p>
          <h1 className="hero-title">
            Bienestar estudiantil <span className="accent">para todos</span>
          </h1>
          <p className="hero-description">
            La plataforma integral para instituciones educativas donde
            psicólogos, orientadores y estudiantes trabajan juntos para promover
            la salud mental y el bienestar académico.
          </p>
          <Link to={ROUTES.LOGIN}>
            <button className="cta-btn">Acceder al Sistema</button>
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2 className="benefits-title">
          Una plataforma en la que puedes confiar
        </h2>
        <p className="benefits-desc">
          Diseñado específicamente para el entorno educativo, garantizando la
          privacidad y el cuidado que los estudiantes merecen.
        </p>
        <div className="benefits-list">
          <div className="benefit-card">
            <div className="benefit-icon icon-blue">
              <Shield size={32} />
            </div>
            <h3>Privacidad y confidencialidad</h3>
            <p>
              Cumplimos con los más altos estándares de privacidad y
              confidencialidad para proteger la información personal y
              psicológica de los estudiantes.
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon icon-green">
              <TrendingUp size={32} />
            </div>
            <h3>Seguimiento integral del bienestar</h3>
            <p>
              Herramientas de evaluación psicológica y seguimiento que permiten
              detectar tempranamente situaciones de riesgo y brindar apoyo
              oportuno.
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon icon-purple">
              <Users size={32} />
            </div>
            <h3>Colaboración interdisciplinaria</h3>
            <p>
              Facilita la comunicación entre psicólogos, orientadores y personal
              académico para un enfoque integral del bienestar estudiantil.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-section">
        <h2 className="how-title">Cómo funciona nuestro sistema</h2>
        <p className="how-desc">
          Un proceso simple y efectivo para el cuidado integral de la salud
          mental estudiantil.
        </p>
        <div className="how-steps">
          <div className="how-step">
            <div
              className="how-icon"
              style={{
                background: "linear-gradient(135deg,#527ceb 0%,#764ba2 100%)",
              }}
            >
              <Brain size={40} />
            </div>
            <h3>1. Evaluación</h3>
            <p>
              Los estudiantes completan evaluaciones psicológicas validadas que
              ayudan a identificar áreas de atención y fortalezas personales.
            </p>
          </div>
          <div className="how-step">
            <div
              className="how-icon"
              style={{
                background: "linear-gradient(135deg,#764ba2 0%,#ee609c 100%)",
              }}
            >
              <Heart size={40} />
            </div>
            <h3>2. Canalización</h3>
            <p>
              Basándose en los resultados, los psicólogos canalizan casos que
              requieren atención especializada hacia los recursos apropiados.
            </p>
          </div>
          <div className="how-step">
            <div
              className="how-icon"
              style={{
                background: "linear-gradient(135deg,#2eca7f 0%,#10cfbd 100%)",
              }}
            >
              <Calendar size={40} />
            </div>
            <h3>3. Seguimiento</h3>
            <p>
              Se programan sesiones de seguimiento y se mantiene un registro
              detallado del progreso para asegurar el bienestar continuo.
            </p>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="roles-section">
        <h2 className="roles-title">
          Diseñado para cada rol en tu institución
        </h2>
        <div className="roles-list">
          <div className="role-card">
            <div className="role-icon role-blue">
              <Brain size={28} />
            </div>
            <h3>Psicólogos</h3>
            <p>Aplican evaluaciones, canalizan casos y realizan seguimiento</p>
          </div>
          <div className="role-card">
            <div className="role-icon role-green">
              <BookOpen size={28} />
            </div>
            <h3>Orientadores</h3>
            <p>Brindan apoyo académico y personal a los estudiantes</p>
          </div>
          <div className="role-card">
            <div className="role-icon role-purple">
              <Users size={28} />
            </div>
            <h3>Estudiantes</h3>
            <p>Acceden a evaluaciones y reciben apoyo personalizado</p>
          </div>
          <div className="role-card">
            <div className="role-icon role-orange">
              <Settings size={28} />
            </div>
            <h3>Administradores</h3>
            <p>Gestionan usuarios y supervisan el sistema</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <h2>¿Listo para transformar el bienestar en tu institución?</h2>
        <p>
          Únete a las instituciones que ya están cuidando la salud mental de sus
          estudiantes.
        </p>
        <Link to={ROUTES.LOGIN}>
          <button className="cta-btn-alt">Comenzar Ahora</button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-main">
            <div>
              <h3 className="footer-title">Sistema Psicológico</h3>
              <p className="footer-desc">
                Plataforma integral para el bienestar estudiantil, diseñada para
                instituciones educativas que priorizan la salud mental de su
                comunidad.
              </p>
            </div>
            <div>
              <h4
                className="footer-title"
                style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem" }}
              >
                Información
              </h4>
              <ul className="footer-links">
                <li>
                  <Link to={ROUTES.ABOUTUS} className="footer-link">
                    Acerca de Nosotros
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.HELP} className="footer-link">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.DOCUMENTACION} className="footer-link">
                    Documentación
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="footer-title"
                style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem" }}
              >
                Soporte
              </h4>
              <ul className="footer-links">
                <li>
                  <Link to={ROUTES.SUPPORT} className="footer-link">
                    Contáctanos
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.HELP} className="footer-link">
                    Preguntas Frecuentes
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Sistema Psicológico. Todos los derechos reservados.</p>
            <div className="footer-bottom-links">
              <Link to={ROUTES.TERMINOS} className="footer-bottom-link">
                Términos de Servicio
              </Link>
              <Link to={ROUTES.PRIVACIDAD} className="footer-bottom-link">
                Política de Privacidad
              </Link>
              <Link to={ROUTES.CONFINDENCIALIDAD} className="footer-bottom-link">
                Confidencialidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

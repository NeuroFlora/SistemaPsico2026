import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants";

export default function Footer() {
  return (
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
              Soporte
            </h4>
            <ul className="footer-links">
              <li>
                <Link to={ROUTES.HELP}>Centro de Ayuda</Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUTUS}>Contacto</Link>
              </li>
              <li>
                <Link to={ROUTES.DOCUMENTACION}>Capacitación</Link>
              </li>
              <li>
                <Link to={ROUTES.DOCUMENTACION}>Documentación</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Sistema Psicológico. Todos los derechos
            reservados.
          </p>
          <div className="footer-bottom-links">
            <Link to={ROUTES.TERMINOS}>Términos de Servicio</Link>
            <Link to={ROUTES.PRIVACIDAD}>Política de Privacidad</Link>
            <Link to={ROUTES.CONFINDENCIALIDAD}>Confidencialidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

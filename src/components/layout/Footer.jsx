import { Link } from 'react-router-dom';
import { storeConfig } from '../../config/store';
import RoadDivider from '../ui/RoadDivider';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__divider">
        <RoadDivider doubleYellow />
      </div>
      <div className="footer__content container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo" title="Moto Accesorios - Inicio">
              <span className="footer__logo-word footer__logo-word--first">Moto</span>
              <span className="footer__logo-word footer__logo-word--second">Accesorios</span>
            </Link>
            <p className="footer__description">
              Accesorios y equipamiento seleccionado para motociclistas. Seguridad y estilo en cada viaje.
            </p>
          </div>

          <div className="footer__links">
            <h4 className="footer__heading">Productos</h4>
            <Link to="/productos?categoria=cascos" className="footer__link" title="Cascos">Cascos</Link>
            <Link to="/productos?categoria=guantes" className="footer__link" title="Guantes">Guantes</Link>
            <Link to="/productos?categoria=indumentaria" className="footer__link" title="Indumentaria">Indumentaria</Link>
            <Link to="/productos?categoria=proteccion" className="footer__link" title="Protección">Protección</Link>
            <Link to="/productos?categoria=accesorios" className="footer__link" title="Accesorios">Accesorios</Link>
          </div>

          <div className="footer__links">
            <h4 className="footer__heading">Empresa</h4>
            <Link to="/nosotros" className="footer__link" title="Conocé nuestra historia">Nosotros</Link>
            <Link to="/contacto" className="footer__link" title="Contactanos">Contacto</Link>
          </div>

          <div className="footer__links">
            <h4 className="footer__heading">Contacto</h4>
            <a href={`https://wa.me/${storeConfig.whatsapp}`} target="_blank" rel="noopener noreferrer" className="footer__link" title="Contactanos por WhatsApp">
              WhatsApp
            </a>
            <a href={storeConfig.instagram} target="_blank" rel="noopener noreferrer" className="footer__link" title="Seguinos en Instagram">
              Instagram
            </a>
            <a href={`mailto:${storeConfig.email}`} className="footer__link" title="Envianos un email">
              {storeConfig.email}
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} {storeConfig.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

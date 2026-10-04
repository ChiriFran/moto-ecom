import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import RoadDivider from '../components/ui/RoadDivider';
import './About.css';

const About = () => {
  const imageBgRef = useRef(null);
  const sectionsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = [imageBgRef.current, ...sectionsRef.current].filter(Boolean);
    const frameId = requestAnimationFrame(() => {
      elements.forEach((element) => {
        observer.observe(element);

        const { top, bottom } = element.getBoundingClientRect();
        if (top < window.innerHeight && bottom > 0) {
          element.classList.add('is-visible');
        }
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const addSectionRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="about">
      <section className="about__hero section" ref={addSectionRef}>
        <div className="container">
          <div className="about__hero-content">
            <span className="about__tag">Nuestra historia</span>
            <h1 className="about__title">Somos Moto Accesorios</h1>
            <p className="about__subtitle">
              Una marca dedicada a ofrecer los mejores accesorios y equipamiento para motociclistas,
              seleccionados con dedicación y pasión por la seguridad.
            </p>
          </div>
        </div>
      </section>

      <section className="about__content section" ref={addSectionRef}>
        <div className="container">
          <div className="about__grid">
            <div className="about__text">
              <h2 className="about__section-title">Nuestra misión</h2>
              <p>
                En Moto Accesorios creemos que cada viaje merece el mejor equipamiento.
                Por eso seleccionamos cada casco, cada guante y cada accesorio
                con el estándar más alto de calidad y seguridad.
              </p>
              <p>
                Trabajamos con fabricantes y proveedores de confianza para garantizar que cada
                producto que llega a tus manos sea certificado, resistente y confiable.
              </p>
            </div>
            <div className="about__image">
              <div className="about__image-bg" ref={imageBgRef}>
                <div className="about__image-placeholder" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about__values section" ref={addSectionRef}>
        <div className="container">
          <h2 className="section-title">Nuestros valores</h2>
          <div className="about__values-grid">
            <div className="about__value">
              <div className="about__value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Seguridad</h3>
              <p>Productos homologados que protegen en cada viaje.</p>
            </div>
            <div className="about__value">
              <div className="about__value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Calidad</h3>
              <p>Seleccionamos cada producto con estándares estrictos.</p>
            </div>
            <div className="about__value">
              <div className="about__value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3>Confianza</h3>
              <p>Transparencia en cada paso, desde la selección hasta tu hogar.</p>
            </div>
            <div className="about__value">
              <div className="about__value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </div>
              <h3>Pasión</h3>
              <p>Amamos las dos ruedas y se nota en cada detalle.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about__cta section" ref={addSectionRef}>
        <div className="about__cta-divider">
          <RoadDivider />
        </div>
        <div className="container">
          <div className="about__cta-content">
            <h2>¿Querés conocernos mejor?</h2>
            <p>Visitá nuestro catálogo y descubrí todos los productos que tenemos para vos.</p>
            <Link to="/productos" className="btn btn-primary btn-lg" title="Ver productos">
              Ver productos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToProducts } from '../services/products';
import { getAllCategories } from '../services/categories';
import ProductCard from '../components/products/ProductCard';
import FeaturedProducts from '../components/products/FeaturedProducts';
import MobileSlider from '../components/ui/MobileSlider';
import Spinner from '../components/ui/Spinner';
import RoadDivider from '../components/ui/RoadDivider';
import './Home.css';

const Home = () => {
  const [cascoProducts, setCascoProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionsRef = useRef([]);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((products) => {
      setCascoProducts(products.filter((p) => p.categoria === 'Cascos' && p.activo));
      setLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setLoading(false);
    });
    getAllCategories().then(setCategories);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section--visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const addSectionRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__container container">
          <div className="hero__content">
            <span className="hero__tag">Accesorios y equipamiento para motociclistas</span>
            <h1 className="hero__title">
              Equipamiento y accesorios para tu moto <span className="hero__title-highlight">Calidad en cada kilómetro</span>
            </h1>
            <p className="hero__subtitle">
              Comprá online cascos, guantes, indumentaria, protecciones y accesorios premium seleccionados en Argentina.
            </p>
          </div>
          <div className="hero__visual">
            <div className="hero__image-wrapper">
              <div className="hero__blob"></div>
              <img src="/images/hero-moto.png" alt="Accesorios para motociclistas" title="Accesorios para moto Moto Accesorios Buenos Aires" className="hero__image" />
            </div>
          </div>
          <div className="hero__cta">
            <Link to="/productos" className="btn btn-primary btn-lg" title="Ver todos nuestros productos">
              Ver productos
            </Link>
            <Link to="/productos?categoria=cascos" className="btn btn-outline btn-lg" title="Comprar cascos para moto">
              Conocé nuestros cascos
            </Link>
          </div>
        </div>
        <div className="hero__decoration">
          <RoadDivider />
        </div>
      </section>

      {/* Categories */}
      <section className="categories section" ref={addSectionRef}>
        <div className="container">
          <h2 className="section-title">Comprá accesorios para moto y equipamiento</h2>
          <p className="section-subtitle">Encontrá cascos, guantes, indumentaria, protecciones y accesorios en un solo lugar.</p>
          <div className="categories__grid">
            {loading ? (
              <Spinner />
            ) : categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/productos?categoria=${cat.slug}`}
                className="category-circle"
              >
                <div className="category-circle__image">
                  <img src={cat.imagen} alt={cat.nombre} title={`Categoría ${cat.nombre} - Accesorios para moto`} />
                </div>
                <span className="category-circle__name">{cat.nombre}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cascos */}
      <section className="cascos section" ref={addSectionRef}>
        <div className="container">
          <h2 className="section-title">Cascos para cada tipo de viaje</h2>
          <p className="section-subtitle">Comprá cascos integrales, abiertos y cross online con homologación certificada.</p>
          {loading ? (
            <Spinner />
          ) : (
            <div className="cascos__grid">
              {cascoProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Editorial 1 */}
      <section className="editorial section" ref={addSectionRef}>
        <div className="container">
          <div className="editorial__grid editorial__grid--reverse">
            <div className="editorial__image">
              <img src="/images/editorial-1.png" alt="Equipamiento seleccionado" title="Nuestra selección de equipamiento para moto" className="editorial__img" />
            </div>
            <div className="editorial__content">
              <span className="editorial__tag">Nuestra historia</span>
              <h2 className="editorial__title">Equipamiento seleccionado para cada motociclista</h2>
              <p className="editorial__text">
                En Moto Accesorios seleccionamos cascos, guantes, camperas, protecciones y accesorios
                de marcas referentes para ofrecer seguridad y estilo con calidad. Armamos cada producto
                pensando en tu ruta, tu ciudad y tus viajes.
              </p>
              <Link to="/nosotros" className="btn btn-outline" title="Conocé nuestra historia">
                Conocé más
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Editorial 2 */}
      <section className="editorial section" ref={addSectionRef}>
        <div className="container">
          <div className="editorial__grid">
            <div className="editorial__content">
              <span className="editorial__tag">Seguridad garantizada</span>
              <h2 className="editorial__title">Calidad y seguridad en cada accesorio</h2>
              <p className="editorial__text">
                Cada producto que llega a tus manos fue cuidadosamente seleccionado y certificado.
                Trabajamos con proveedores de confianza para ofrecer equipamiento
                seguro, resistente y pensado para la ruta.
              </p>
              <Link to="/productos" className="btn btn-outline" title="Explorar catálogo de productos">
                Explorar productos
              </Link>
            </div>
            <div className="editorial__image">
              <img src="/images/editorial-2.png" alt="Equipamiento seleccionado" title="Nuestra selección de equipamiento para moto" className="editorial__img" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits section" ref={addSectionRef}>
        <div className="container">
          <MobileSlider gridClass="benefits-grid">
            <div className="benefit">
              <div className="benefit__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="benefit__title">Seguridad certificada</h3>
              <p className="benefit__text">Seleccionamos productos homologados con estándares estrictos de calidad.</p>
            </div>
            <div className="benefit">
              <div className="benefit__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </div>
              <h3 className="benefit__title">Asesoramiento experto</h3>
              <p className="benefit__text">Te ayudamos a elegir el equipo correcto para tu moto y tu estilo de manejo.</p>
            </div>
            <div className="benefit">
              <div className="benefit__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 className="benefit__title">Envío rápido</h3>
              <p className="benefit__text">Recibí tu pedido en el menor tiempo posible, en todo el país.</p>
            </div>
          </MobileSlider>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final section" ref={addSectionRef}>
        <div className="cta-final__divider">
          <RoadDivider />
        </div>
        <div className="container">
          <div className="cta-final__content">
            <h2 className="cta-final__title">Comprá accesorios para moto online en Buenos Aires</h2>
            <p className="cta-final__text">
              Explorá el catálogo de Moto Accesorios y encontrá el equipamiento ideal para vos.
            </p>
            <Link to="/productos" className="btn btn-primary btn-lg" title="Ver catálogo completo">
              Ver catálogo completo
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials section" ref={addSectionRef}>
        <div className="container">
          <h2 className="section-title">Opiniones sobre nuestro equipamiento</h2>
          <p className="section-subtitle">Testimonios reales de quienes ya confiaron en nuestros productos.</p>
          <MobileSlider gridClass="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-card__stars">★★★★★</div>
              <p className="testimonial-card__text">
                "Excelente calidad y muy buena atención. El casco es cómodo y llega rapidísimo."
              </p>
              <span className="testimonial-card__author">— María G.</span>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-card__stars">★★★★★</div>
              <p className="testimonial-card__text">
                "La campera es increíble, se nota la diferencia con otros productos del mercado."
              </p>
              <span className="testimonial-card__author">— Carlos R.</span>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-card__stars">★★★★★</div>
              <p className="testimonial-card__text">
                "Compro regularmente para todo mi grupo de moto. Siempre llega en perfecto estado."
              </p>
              <span className="testimonial-card__author">— Laura M.</span>
            </div>
          </MobileSlider>
        </div>
      </section>
    </div>
  );
};

export default Home;
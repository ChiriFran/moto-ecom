import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToProducts } from '../../services/products';
import ProductCard from './ProductCard';
import Spinner from '../ui/Spinner';
import RoadDivider from '../ui/RoadDivider';
import './FeaturedProducts.css';

const FeaturedProducts = ({ limit = 4 }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((products) => {
      setFeaturedProducts(products.filter((product) => product.destacado && product.activo).slice(0, limit));
      setLoading(false);
    }, (error) => {
      console.error('Error loading featured products:', error);
      setLoading(false);
    });
    return unsubscribe;
  }, [limit]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section--visible');
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="featured section section--animate" ref={sectionRef}>
      <div className="featured__divider">
        <RoadDivider />
      </div>
      <div className="container">
        <h2 className="section-title">Accesorios y equipamiento más elegidos</h2>
        <p className="section-subtitle">Descubrí los productos favoritos de nuestros clientes en Buenos Aires.</p>
        {loading ? (
          <Spinner />
        ) : (
          <div className="featured__grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="featured__cta">
          <Link to="/productos" className="btn btn-primary" title="Ver todos los productos">
            Ver todos los productos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;

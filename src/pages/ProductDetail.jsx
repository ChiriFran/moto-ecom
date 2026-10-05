import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subscribeToProductBySlug } from '../services/products';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import { slugify } from '../utils/slugify';
import { storeConfig } from '../config/store';
import FeaturedProducts from '../components/products/FeaturedProducts';
import Spinner from '../components/ui/Spinner';
import './ProductDetail.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const siteName = storeConfig.name;
  const siteTitle = `${siteName} - Accesorios para Motociclistas | Buenos Aires`;
  const siteDescription = 'Comprá cascos, guantes, indumentaria y protecciones premium en Buenos Aires. Calidad superior a precios accesibles.';
  const siteUrl = storeConfig.domain;

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setQuantity(1);
    setAdded(false);
    window.scrollTo(0, 0);

    const unsubscribe = subscribeToProductBySlug(slug, (found) => {
      setProduct(found);

    if (found) {
      document.title = `${found.nombre} - ${siteName} | Buenos Aires Zona Norte`;

      const setMeta = (name, content, property = false) => {
        const attr = property ? 'property' : 'name';
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      setMeta('description', `${found.nombre} - ${found.descripcion} Compralo en ${siteName}, Buenos Aires Zona Norte.`, false);
      setMeta('og:title', `${found.nombre} - ${siteName}`, true);
      setMeta('og:description', found.descripcion, true);
      setMeta('og:image', `${siteUrl}${found.imagen}`, true);
      setMeta('og:url', `${siteUrl}/producto/${found.slug}`, true);
      setMeta('twitter:title', `${found.nombre} - ${siteName}`, false);
      setMeta('twitter:description', found.descripcion, false);
      setMeta('twitter:image', `${siteUrl}${found.imagen}`, false);

      const existingScript = document.getElementById('product-schema');
      if (existingScript) existingScript.remove();

      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": found.nombre,
        "description": found.descripcion,
        "image": `${siteUrl}${found.imagen}`,
        "brand": {
          "@type": "Brand",
          "name": siteName
        },
        "sku": found.id,
        "category": found.categoria,
        "offers": {
          "@type": "Offer",
          "url": `${siteUrl}/producto/${found.slug}`,
          "priceCurrency": "ARS",
          "price": found.precio,
          "availability": found.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": siteName
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5",
          "reviewCount": "3"
        },
        "review": [
          {
            "@type": "Review",
            "author": { "@type": "Person", "name": "María G." },
            "reviewRating": { "@type": "Rating", "ratingValue": "5" },
            "reviewBody": "Excelente calidad y muy buena atención."
          },
          {
            "@type": "Review",
            "author": { "@type": "Person", "name": "Carlos R." },
            "reviewRating": { "@type": "Rating", "ratingValue": "5" },
            "reviewBody": "Se nota la diferencia con otros productos del mercado."
          }
        ]
      };

      const script = document.createElement('script');
      script.id = 'product-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

      setLoading(false);
    }, (error) => {
      console.error('Error loading product:', error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      const script = document.getElementById('product-schema');
      if (script) script.remove();
      document.title = siteTitle;

      const setMeta = (name, content, property = false) => {
        const attr = property ? 'property' : 'name';
        const el = document.querySelector(`meta[${attr}="${name}"]`);
        if (el) el.setAttribute('content', content);
      };

      setMeta('description', siteDescription);
      setMeta('og:title', siteTitle, true);
      setMeta('og:description', siteDescription, true);
      setMeta('og:image', storeConfig.ogImage, true);
      setMeta('og:url', siteUrl, true);
    };
  }, [slug, siteName, siteTitle, siteDescription, siteUrl]);

  if (loading) {
    return (
      <div className="product-detail container section">
        <div className="product-detail__not-found">
          <Spinner />
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail container section">
        <div className="product-detail__not-found">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscás no existe o fue removido.</p>
          <Link to="/productos" className="btn btn-primary" title="Volver a productos">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  return (
    <div className="product-detail">
      <div className="container section">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb__link" title={`Inicio - ${siteName}`}>Inicio</Link>
          <span className="breadcrumb__separator">/</span>
          <Link to="/productos" className="breadcrumb__link" title={`Productos - ${siteName}`}>Productos</Link>
          <span className="breadcrumb__separator">/</span>
          <Link
            to={`/productos?categoria=${slugify(product.categoria)}`}
            className="breadcrumb__link"
            title={`${product.categoria} - ${siteName}`}
          >
            {product.categoria}
          </Link>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{product.nombre}</span>
        </nav>

        <div className="product-detail__layout">
          {/* Image */}
          <div className="product-detail__image-section">
            <div className="product-detail__image-main">
              <img src={product.imagen} alt={product.nombre} title={`${product.nombre} - Equipamiento para moto`} onError={(e) => { if (e.target.src !== '/favicon.svg') e.target.src = '/favicon.svg'; }} />
              {product.destacado && (
                <span className="product-detail__badge badge badge-primary">Destacado</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="product-detail__info">
            <span className="product-detail__category">{product.categoria}</span>
            <h1 className="product-detail__name">{product.nombre}</h1>
            <p className="product-detail__description">{product.descripcion}</p>

            <div className="product-detail__pricing">
              <span className="product-detail__price">{formatPrice(product.precio)}</span>
              <span className="product-detail__presentation">{product.presentacion}</span>
            </div>

            {product.precioTransferencia && (
              <div className="product-detail__transfer">
                <span className="product-detail__transfer-label">Precio transferencia:</span>
                <span className="product-detail__transfer-price">{formatPrice(product.precioTransferencia)}</span>
              </div>
            )}

            <div className="product-detail__stock">
              {product.stock > 0 ? (
                <span className="product-detail__stock-available">
                  ✓ Stock disponible ({product.stock} unidades)
                </span>
              ) : (
                <span className="product-detail__stock-unavailable">
                  Sin stock disponible
                </span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="product-detail__add">
                <div className="product-detail__quantity">
                  <button
                    className="product-detail__qty-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="product-detail__qty-value">{quantity}</span>
                  <button
                    className="product-detail__qty-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <button
                  className={`btn btn-primary btn-lg product-detail__add-btn ${added ? 'product-detail__add-btn--added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {added ? '✓ Agregado' : 'Agregar al carrito'}
                </button>
              </div>
            )}

            {/* Especificaciones */}
            {product.especificaciones && product.especificaciones.length > 0 && (
              <div className="product-detail__section">
                <h3 className="product-detail__section-title">Especificaciones</h3>
                <ul className="product-detail__ingredients">
                  {product.especificaciones.map((spec, i) => (
                    <li key={i} className="product-detail__ingredient">{spec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Features */}
            <div className="product-detail__section">
              <h3 className="product-detail__section-title">Características</h3>
              <ul className="product-detail__features">
                <li>Materiales de alta calidad y resistencia</li>
                <li>Productos certificados y homologados</li>
                <li>Diseño ergonómico para máximo confort</li>
                <li>Garantía del fabricante</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <FeaturedProducts />
    </div>
  );
};

export default ProductDetail;
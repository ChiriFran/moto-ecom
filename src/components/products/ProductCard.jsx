import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import './ProductCard.css';

const ProductCard = ({ product, showDescription = true }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link to={`/producto/${product.slug}`} className="product-card" title={`Ver detalle de ${product.nombre}`}>
      <div className="product-card__image-wrapper">
        <img
          src={product.imagen}
          alt={product.nombre}
          title={`${product.nombre} - Comprar online`}
          className="product-card__image"
          loading="lazy"
          onError={(e) => { if (e.target.src !== '/favicon.svg') e.target.src = '/favicon.svg'; }}
        />
        {product.destacado && (
          <span className="product-card__badge badge badge-primary">Destacado</span>
        )}
        <div className="product-card__overlay">
          <button className="btn btn-primary btn-sm" onClick={handleAddToCart}>
            Agregar al carrito
          </button>
        </div>
      </div>
      <div className="product-card__content">
        <span className="product-card__category">{product.categoria}</span>
        <h3 className="product-card__name">{product.nombre}</h3>
        {showDescription && <p className="product-card__description">{product.descripcionCorta}</p>}
        <div className="product-card__footer">
          <div className="product-card__pricing">
            <span className="product-card__price">{formatPrice(product.precio)}</span>
            <span className="product-card__presentation">{product.presentacion}</span>
          </div>
          {product.stock > 0 ? (
            <span className="product-card__stock product-card__stock--available">Disponible</span>
          ) : (
            <span className="product-card__stock product-card__stock--unavailable">Sin stock</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

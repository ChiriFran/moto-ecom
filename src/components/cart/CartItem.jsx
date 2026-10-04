import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item__image">
        <img src={item.imagen} alt={item.nombre} title={`${item.nombre} - Carrito Moto Accesorios`} onError={(e) => { if (e.target.src !== '/favicon.svg') e.target.src = '/favicon.svg'; }} />
      </div>
      <div className="cart-item__info">
        <h3 className="cart-item__name">{item.nombre}</h3>
        <p className="cart-item__presentation">{item.presentacion}</p>
        <p className="cart-item__price">{formatPrice(item.precio)}</p>
      </div>
      <div className="cart-item__actions">
        <div className="cart-item__quantity">
          <button
            className="cart-item__qty-btn"
            onClick={() => decreaseQuantity(item.id)}
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span className="cart-item__qty-value">{item.cantidad}</span>
          <button
            className="cart-item__qty-btn"
            onClick={() => increaseQuantity(item.id)}
            aria-label="Aumentar cantidad"
            disabled={item.cantidad >= item.stock}
          >
            +
          </button>
        </div>
        <p className="cart-item__subtotal">{formatPrice(item.precio * item.cantidad)}</p>
        <button
          className="cart-item__remove"
          onClick={() => removeFromCart(item.id)}
          aria-label="Eliminar producto"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default CartItem;

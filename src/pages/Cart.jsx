import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';
import { formatPrice } from '../utils/formatPrice';
import './Cart.css';

const Cart = () => {
  const { items, getCartTotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page container section">
        <div className="cart-page__empty">
          <div className="cart-page__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Agregá productos para comenzar tu compra.</p>
          <Link to="/productos" className="btn btn-primary" title="Ver productos disponibles">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page container section">
      <h1 className="cart-page__title">Tu carrito</h1>

      <div className="cart-page__layout">
        <div className="cart-page__items">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          <div className="cart-page__actions">
            <button className="btn btn-ghost btn-sm" onClick={clearCart}>
              Vaciar carrito
            </button>
            <Link to="/productos" className="btn btn-ghost btn-sm" title="Seguir comprando">
              Seguir comprando
            </Link>
          </div>
        </div>

        <div className="cart-page__summary">
          <h3 className="cart-page__summary-title">Resumen</h3>
          <div className="cart-page__summary-row">
            <span>Productos ({items.length})</span>
            <span>{formatPrice(getCartTotal())}</span>
          </div>
          <div className="cart-page__summary-row cart-page__summary-row--shipping">
            <span>Envío</span>
            <span>A coordinar</span>
          </div>
          <div className="cart-page__summary-total">
            <span>Total</span>
            <span>{formatPrice(getCartTotal())}</span>
          </div>
          <Link to="/checkout" className="btn btn-primary btn-lg cart-page__checkout-btn" title="Finalizar compra">
            Finalizar compra
          </Link>
          <p className="cart-page__summary-note">
            El envío se coordinará después de confirmar el pedido.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;

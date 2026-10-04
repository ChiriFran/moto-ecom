import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartIcon.css';

const CartIcon = ({ onClick }) => {
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <Link to="/carrito" className="cart-icon" onClick={onClick} aria-label={`Carrito (${count} productos)`} title="Ir al carrito de compras">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      {count > 0 && <span className="cart-icon__badge">{count}</span>}
    </Link>
  );
};

export default CartIcon;

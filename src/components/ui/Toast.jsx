import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';

const Toast = () => {
  const { toast } = useCart();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  useEffect(() => {
    if (toast) {
      setMessage(toast.message);
      setType(toast.type || 'success');
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!visible || !message) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success' && '✓ '}
        {type === 'error' && '✕ '}
        {message}
      </div>
    </div>
  );
};

export default Toast;

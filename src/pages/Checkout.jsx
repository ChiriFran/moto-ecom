import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import { createOrder } from '../services/orders';
import './Checkout.css';

const Checkout = () => {
  const { items, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    localidad: '',
    codigoPostal: '',
    referencia: '',
    metodoEntrega: 'envio',
    metodoPago: 'transferencia',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'Requerido';
    if (!form.apellido.trim()) newErrors.apellido = 'Requerido';
    if (!form.telefono.trim()) newErrors.telefono = 'Requerido';
    if (!form.email.trim()) newErrors.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email inválido';
    if (form.metodoEntrega === 'envio') {
      if (!form.direccion.trim()) newErrors.direccion = 'Requerido';
      if (!form.localidad.trim()) newErrors.localidad = 'Requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitting(true);

    try {
      const order = {
        cliente: {
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          email: form.email,
        },
        entrega: {
          tipo: form.metodoEntrega,
          direccion: form.direccion,
          localidad: form.localidad,
          codigoPostal: form.codigoPostal,
          referencia: form.referencia,
        },
        productos: items.map((item) => ({
          productId: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precio * item.cantidad,
        })),
        subtotal: getCartTotal(),
        total: getCartTotal(),
        metodoPago: form.metodoPago,
      };

      const savedOrder = await createOrder(order, items);

      clearCart();
      navigate('/pedido-confirmado', { state: { order: savedOrder } });
    } catch (error) {
      console.error('Error creating order:', error);
      const message = error.message?.startsWith('STOCK_INSUFFICIENT:')
        ? `El producto ${error.message.replace('STOCK_INSUFFICIENT:', '')} ya no tiene suficiente stock. Revisá tu carrito.`
        : 'Hubo un error al procesar tu pedido. Intentá nuevamente.';
      alert(message);
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/carrito');
    }
  }, [items.length, submitting, navigate]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="checkout container section">
      <h1 className="checkout__title">Checkout</h1>

      <form className="checkout__form" onSubmit={handleSubmit}>
        <div className="checkout__layout">
          <div className="checkout__fields">
            {/* Personal Data */}
            <div className="checkout__section">
              <h2 className="checkout__section-title">Datos personales</h2>
              <div className="checkout__grid">
                <div className="checkout__field">
                  <label className="checkout__label">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className={errors.nombre ? 'checkout__input--error' : ''}
                  />
                  {errors.nombre && <span className="checkout__error">{errors.nombre}</span>}
                </div>
                <div className="checkout__field">
                  <label className="checkout__label">Apellido *</label>
                  <input
                    type="text"
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    className={errors.apellido ? 'checkout__input--error' : ''}
                  />
                  {errors.apellido && <span className="checkout__error">{errors.apellido}</span>}
                </div>
                <div className="checkout__field">
                  <label className="checkout__label">Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    className={errors.telefono ? 'checkout__input--error' : ''}
                  />
                  {errors.telefono && <span className="checkout__error">{errors.telefono}</span>}
                </div>
                <div className="checkout__field">
                  <label className="checkout__label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={errors.email ? 'checkout__input--error' : ''}
                  />
                  {errors.email && <span className="checkout__error">{errors.email}</span>}
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="checkout__section">
              <h2 className="checkout__section-title">Entrega</h2>
              <div className="checkout__radio-group">
                <label className="checkout__radio">
                  <input
                    type="radio"
                    name="metodoEntrega"
                    value="envio"
                    checked={form.metodoEntrega === 'envio'}
                    onChange={handleChange}
                  />
                  <span className="checkout__radio-label">Envío a domicilio</span>
                </label>
                <label className="checkout__radio">
                  <input
                    type="radio"
                    name="metodoEntrega"
                    value="retiro"
                    checked={form.metodoEntrega === 'retiro'}
                    onChange={handleChange}
                  />
                  <span className="checkout__radio-label">Retiro en local</span>
                </label>
              </div>

              {form.metodoEntrega === 'envio' && (
                <div className="checkout__grid">
                  <div className="checkout__field checkout__field--full">
                    <label className="checkout__label">Dirección *</label>
                    <input
                      type="text"
                      name="direccion"
                      value={form.direccion}
                      onChange={handleChange}
                      className={errors.direccion ? 'checkout__input--error' : ''}
                    />
                    {errors.direccion && <span className="checkout__error">{errors.direccion}</span>}
                  </div>
                  <div className="checkout__field">
                    <label className="checkout__label">Localidad *</label>
                    <input
                      type="text"
                      name="localidad"
                      value={form.localidad}
                      onChange={handleChange}
                      className={errors.localidad ? 'checkout__input--error' : ''}
                    />
                    {errors.localidad && <span className="checkout__error">{errors.localidad}</span>}
                  </div>
                  <div className="checkout__field">
                    <label className="checkout__label">Código postal</label>
                    <input
                      type="text"
                      name="codigoPostal"
                      value={form.codigoPostal}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="checkout__field checkout__field--full">
                    <label className="checkout__label">Referencias</label>
                    <textarea
                      name="referencia"
                      value={form.referencia}
                      onChange={handleChange}
                      rows="2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="checkout__section">
              <h2 className="checkout__section-title">Método de pago</h2>
              <div className="checkout__radio-group">
                <label className="checkout__radio">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="transferencia"
                    checked={form.metodoPago === 'transferencia'}
                    onChange={handleChange}
                  />
                  <span className="checkout__radio-label">Transferencia bancaria</span>
                </label>
                <label className="checkout__radio">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="efectivo"
                    checked={form.metodoPago === 'efectivo'}
                    onChange={handleChange}
                  />
                  <span className="checkout__radio-label">Efectivo</span>
                </label>
              </div>
              <p className="checkout__payment-note">
                Los datos para la transferencia se enviarán después de confirmar el pedido.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="checkout__summary">
            <h3 className="checkout__summary-title">Tu pedido</h3>
            <div className="checkout__summary-items">
              {items.map((item) => (
                <div key={item.id} className="checkout__summary-item">
                  <div className="checkout__summary-item-info">
                    <span className="checkout__summary-item-name">{item.nombre}</span>
                    <span className="checkout__summary-item-qty">x{item.cantidad}</span>
                  </div>
                  <span className="checkout__summary-item-price">{formatPrice(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="checkout__summary-total">
              <span>Total</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg checkout__submit"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;

import {
  canCancel,
  getStatusActions,
  getStatusColor,
  getStatusLabel,
  buildWhatsAppUrl,
} from '../config/orderStatus';
import { formatPrice } from '../utils/formatPrice';

const AdminOrderDetail = ({
  order,
  showTitle = true,
  busy = false,
  onStatusChange,
  onCancel,
}) => {
  if (!order) return null;

  const cliente = order.cliente || {};
  const entrega = order.entrega || {};
  const productos = order.productos || [];
  const statusActions = getStatusActions(order.estado);
  const cancelable = canCancel(order.estado);

  return (
    <>
      {showTitle && <h2 className="admin__detail-title">Pedido {order.id}</h2>}

      <div className="admin__detail-section">
        <h3>Estado</h3>
        <span className={`admin__status ${getStatusColor(order.estado)}`}>
          {getStatusLabel(order.estado)}
        </span>
        {statusActions.length > 0 && (
          <div className="admin__status-buttons">
            {statusActions.map((status) => (
              <button
                key={status}
                className="btn btn-outline btn-sm"
                type="button"
                disabled={busy}
                onClick={() => onStatusChange(order.id, status)}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        )}
        {statusActions.length === 0 && !cancelable && (
          <p className="admin__detail-hint">
            Este pedido está cancelado: no se puede volver a cambiar su estado.
          </p>
        )}
      </div>

      {cancelable && (
        <div className="admin__detail-section">
          <button
            className="btn btn-danger btn-sm"
            type="button"
            disabled={busy}
            onClick={() => onCancel(order)}
          >
            Cancelar y devolver stock
          </button>
          <p className="admin__detail-hint">La cancelación es definitiva.</p>
        </div>
      )}

      <div className="admin__detail-section">
        <h3>Cliente</h3>
        <p>{`${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '—'}</p>
        <p>Tel: {cliente.telefono || '—'}</p>
        <p>Email: {cliente.email || '—'}</p>
        {cliente.telefono && (
          <a
            className="admin__whatsapp-link"
            href={buildWhatsAppUrl(cliente.telefono, `Hola ${cliente.nombre || ''}, te contacto por tu pedido ${order.id}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        )}
      </div>

      <div className="admin__detail-section">
        <h3>Entrega</h3>
        <p>{entrega.tipo === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</p>
        {entrega.tipo === 'envio' && (
          <>
            <p>{entrega.direccion || '—'}</p>
            <p>{entrega.localidad || '—'}</p>
          </>
        )}
      </div>

      <div className="admin__detail-section">
        <h3>Productos</h3>
        {productos.length === 0 ? (
          <p>Sin productos.</p>
        ) : (
          productos.map((item, index) => (
            <div key={item.productId || index} className="admin__detail-product">
              <span>{item.nombre || 'Producto'} x{item.cantidad || 0}</span>
              <span>{formatPrice(item.subtotal ?? 0)}</span>
            </div>
          ))
        )}
        <div className="admin__detail-total">
          <span>Total</span>
          <span>{formatPrice(order.total ?? 0)}</span>
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetail;
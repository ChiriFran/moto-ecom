export const STATUS = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  ENVIADA: 'enviada',
  ENTREGADA: 'entregada',
  CANCELADA: 'cancelada',
};

export const STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  enviada: 'Enviada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

export const STATUS_COLORS = {
  pendiente: 'admin__status--pendiente',
  confirmada: 'admin__status--confirmada',
  enviada: 'admin__status--enviada',
  entregada: 'admin__status--entregada',
  cancelada: 'admin__status--cancelada',
};

// 'confirmada' no se puede asignar desde el panel. Sigue en STATUS_LABELS y
// STATUS_COLORS unicamente para poder renderizar pedidos viejos que quedaron
// en ese estado antes de quitarlo del flujo.
export const ASSIGNABLE_STATUSES = ['pendiente', 'enviada', 'entregada'];

// Estados en los que el pedido ya salio del local: son los unicos que cuentan
// como venta para ingresos y productos vendidos.
export const SOLD_STATUSES = [STATUS.ENVIADA, STATUS.ENTREGADA];

// La cancelacion no es un cambio de estado mas: ademas devuelve el stock, por
// eso se maneja con su propio boton y no aparece en la lista de estados.
export const ALLOWED_TRANSITIONS = {
  pendiente: ['enviada', 'entregada', 'cancelada'],
  confirmada: ['enviada', 'entregada', 'cancelada'],
  enviada: ['entregada', 'cancelada'],
  entregada: ['cancelada'],
  cancelada: [],
};

export const ERROR_CODES = {
  NOT_FOUND: 'ORDER_NOT_FOUND',
  ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
};

export const isSold = (status) => SOLD_STATUSES.includes(status);

export const isCancelled = (status) => status === STATUS.CANCELADA;

export const getStatusLabel = (status) => STATUS_LABELS[status] || '—';

export const getStatusColor = (status) => STATUS_COLORS[status] || '';

export const canCancel = (status) => ALLOWED_TRANSITIONS[status]?.includes(STATUS.CANCELADA) ?? false;

export const canTransition = (from, to) => ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

// Estados que el admin puede asignar sobre un pedido en su estado actual.
export const getStatusActions = (status) =>
  ASSIGNABLE_STATUSES.filter((target) => target !== status && canTransition(status, target));

export const formatOrderDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
};

export const normalizeWhatsAppPhone = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');

  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('54')) {
    digits = digits.slice(2).replace(/^0/, '');
    return `549${digits}`;
  }

  return `549${digits.replace(/^0/, '')}`;
};

export const buildWhatsAppUrl = (phone, message) =>
  `https://wa.me/${normalizeWhatsAppPhone(phone)}?text=${encodeURIComponent(message)}`;
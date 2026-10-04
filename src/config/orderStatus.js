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
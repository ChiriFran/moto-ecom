import { useMemo, useState } from 'react';
import { formatPrice } from '../utils/formatPrice';
import { STATUS_LABELS, normalizeWhatsAppPhone, buildWhatsAppUrl } from '../config/orderStatus';
import './Admin.css';

const getInitials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => (p[0] || '').toUpperCase())
    .join('');

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
};

const AdminCustomers = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const customers = useMemo(() => {
    const map = new Map();

    orders.forEach((order) => {
      const cliente = order.cliente || {};
      const nombre = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Cliente';
      const telefono = String(cliente.telefono || '').trim();
      const email = String(cliente.email || '').trim();
      const localidad = (order.entrega && order.entrega.localidad) || '';
      const digits = telefono.replace(/\D/g, '');
      const nameKey = `${nombre.toLowerCase()}|${email.toLowerCase()}`;
      const key = digits
        ? `tel:${digits}|${nameKey}`
        : email
          ? `mail:${nameKey}`
          : `anon:${nameKey}|${order.id}`;
      const createdAt = order.createdAt || '';

      if (!map.has(key)) {
        map.set(key, {
          key,
          nombre,
          primerNombre: nombre.split(' ')[0],
          telefono,
          email,
          localidad,
          pedidos: 0,
          total: 0,
          ultimo: createdAt,
          ordenes: [],
        });
      }

      const customer = map.get(key);
      customer.pedidos += 1;
      customer.total += order.total || 0;
      if (createdAt && createdAt > customer.ultimo) customer.ultimo = createdAt;
      customer.ordenes.push({ id: order.id, total: order.total || 0, createdAt, estado: order.estado });
    });

    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.ultimo).getTime() || 0;
      const timeB = new Date(b.ultimo).getTime() || 0;
      return timeB - timeA || b.pedidos - a.pedidos;
    });
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase('es-AR');
    if (!term) return customers;
    return customers.filter((customer) =>
      `${customer.nombre} ${customer.telefono} ${customer.email} ${customer.localidad}`
        .toLowerCase('es-AR')
        .includes(term)
    );
  }, [customers, searchTerm]);

  const selectedCustomer = customers.find((customer) => customer.key === selectedKey) || null;

  const handleSelectCustomer = (customer) => {
    setSelectedKey(customer.key);
    if (window.innerWidth <= 768) {
      setDrawerOpen(true);
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;

    const phone = normalizeWhatsAppPhone(selectedCustomer.telefono);
    const whatsappUrl = phone
      ? buildWhatsAppUrl(selectedCustomer.telefono, `Hola ${selectedCustomer.primerNombre}, te escribimos de Moto Accesorios.`)
      : '';

    return (
      <>
        <div className="admin__detail-section">
          <h3>Contacto</h3>
          <p>Tel: {selectedCustomer.telefono || '—'}</p>
          <p>Email: {selectedCustomer.email || '—'}</p>
          <p>Localidad: {selectedCustomer.localidad || '—'}</p>
          {whatsappUrl && (
            <a className="btn btn-primary btn-sm admin__customer-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          )}
        </div>

        <div className="admin__detail-section">
          <h3>Resumen</h3>
          <p>{selectedCustomer.pedidos} {selectedCustomer.pedidos === 1 ? 'pedido' : 'pedidos'} · {formatPrice(selectedCustomer.total)} gastados</p>
          <p>Último pedido: {formatDate(selectedCustomer.ultimo)}</p>
        </div>

        <div className="admin__detail-section">
          <h3>Pedidos</h3>
          {selectedCustomer.ordenes.length === 0 ? (
            <p>Sin pedidos registrados.</p>
          ) : (
            selectedCustomer.ordenes.map((order) => (
              <div key={order.id} className="admin__detail-product">
                <span>{order.id}</span>
                <span>{formatDate(order.createdAt)} · {formatPrice(order.total)}</span>
                <span>{STATUS_LABELS[order.estado] || order.estado || ''}</span>
              </div>
            ))
          )}
        </div>
      </>
    );
  };

  const whatsAppUrlFor = (customer) =>
    normalizeWhatsAppPhone(customer.telefono)
      ? buildWhatsAppUrl(customer.telefono, `Hola ${customer.primerNombre}, te escribimos de Moto Accesorios.`)
      : '';

  return (
    <div className="admin__customers">
      <div className="admin__toolbar">
        <label className="admin__search-label" htmlFor="admin-customer-search">Buscar por cliente</label>
        <input
          id="admin-customer-search"
          className="admin__search"
          type="search"
          placeholder="Nombre, teléfono, email o localidad"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <span className="admin__customers-count">{filteredCustomers.length} clientes</span>
      </div>

      <div className="admin__layout">
        <div className="admin__list">
          {filteredCustomers.length === 0 ? (
            <p className="admin__empty">No hay clientes que coincidan con la búsqueda.</p>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.key}
                className={`admin__customer-card ${selectedCustomer?.key === customer.key ? 'admin__customer-card--selected' : ''}`}
                onClick={() => handleSelectCustomer(customer)}
              >
                <div className="admin__customer-header">
                  <span className="admin__customer-avatar">{getInitials(customer.nombre)}</span>
                  <div className="admin__customer-id">
                    <span className="admin__customer-name">{customer.nombre}</span>
                    <span className="admin__customer-contact">
                      {customer.telefono || 'Sin teléfono'}
                      {customer.localidad ? ` · ${customer.localidad}` : ''}
                    </span>
                  </div>
                </div>
                <div className="admin__order-info">
                  <span>{customer.pedidos} {customer.pedidos === 1 ? 'pedido' : 'pedidos'}</span>
                  <span>{formatPrice(customer.total)}</span>
                </div>
                <div className="admin__order-date">
                  Último pedido: {formatDate(customer.ultimo)}
                </div>
                {whatsAppUrlFor(customer) && (
                  <a
                    className="admin__whatsapp-link"
                    href={whatsAppUrlFor(customer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {selectedCustomer && (
          <div className="admin__detail">
            <h2 className="admin__detail-title">{selectedCustomer.nombre}</h2>
            {renderCustomerDetail()}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <>
          <div
            className={`admin__drawer-backdrop ${drawerOpen ? 'admin__drawer-backdrop--open' : ''}`}
            onClick={closeDrawer}
          />
          <div className={`admin__drawer ${drawerOpen ? 'admin__drawer--open' : ''}`}>
            <div className="admin__drawer-header">
              <h2>{selectedCustomer.nombre}</h2>
              <button className="admin__drawer-close" onClick={closeDrawer}>✕</button>
            </div>
            <div className="admin__drawer-content">
              {renderCustomerDetail()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCustomers;
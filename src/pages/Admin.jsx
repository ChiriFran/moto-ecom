import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';
import { getAllOrders, updateOrderStatus, cancelOrder } from '../services/orders';
import { auth } from '../services/firebase';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import {
  STATUS,
  ERROR_CODES,
  isSold,
  getStatusLabel,
  getStatusColor,
  formatOrderDate,
  buildWhatsAppUrl,
} from '../config/orderStatus';
import AdminOrderDetail from './AdminOrderDetail';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';
import './Admin.css';

const TIME_FILTERS = {
  'este-mes': () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  },
  'mes-pasado': () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  },
  'ultimos-3-meses': () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  },
};

const describeError = (error) => {
  switch (error?.message) {
    case ERROR_CODES.ALREADY_CANCELLED:
      return 'Este pedido ya estaba cancelado.';
    case ERROR_CODES.INVALID_TRANSITION:
      return 'Ese cambio de estado no está permitido.';
    case ERROR_CODES.NOT_FOUND:
      return 'El pedido ya no existe.';
    default:
      return 'No se pudo actualizar el pedido.';
  }
};

const matchesTimeFilter = (order, timeFilter) => {
  const getFrom = TIME_FILTERS[timeFilter];
  if (!getFrom) return true;

  const orderDate = new Date(order.createdAt);
  if (Number.isNaN(orderDate.getTime())) return false;

  const from = getFrom();
  const now = new Date();

  if (timeFilter === 'mes-pasado') {
    return orderDate.getFullYear() === from.getFullYear()
      && orderDate.getMonth() === from.getMonth();
  }

  if (timeFilter === 'este-mes') {
    return orderDate.getFullYear() === now.getFullYear()
      && orderDate.getMonth() === now.getMonth();
  }

  return orderDate >= from;
};

const Admin = () => {
  const { showToast } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [timeFilter, setTimeFilter] = useState('todos');
  const [showOverview, setShowOverview] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [pendingId, setPendingId] = useState(null);

  // El resumen es una fila unica con scroll horizontal: hay que saber si todavia
  // hay contenido hacia atras/adelante para mostrar las flechas y los bordes.
  const overviewRef = useRef(null);
  const [overviewScroll, setOverviewScroll] = useState({ canStart: false, canEnd: false });

  const syncOverviewScroll = useCallback(() => {
    const track = overviewRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setOverviewScroll({
      canStart: track.scrollLeft > 4,
      canEnd: maxScroll > 4 && track.scrollLeft < maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    const track = overviewRef.current;
    if (!track) return undefined;

    track.scrollLeft = 0;
    setOverviewScroll({ canStart: false, canEnd: false });
    syncOverviewScroll();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(syncOverviewScroll);
    observer.observe(track);
    return () => observer.disconnect();
  }, [syncOverviewScroll, showOverview, activeTab]);

  const scrollOverview = (direction) => {
    const track = overviewRef.current;
    if (!track) return;

    const card = track.querySelector('.admin__overview-card');
    const step = card ? card.offsetWidth + 12 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const loadOrders = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setOrders(await getAllOrders());
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoadError('No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSelectOrder = (order) => {
    setSelectedOrderId(order.id);
    if (window.innerWidth <= 768) {
      setDrawerOpen(true);
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('es-AR');

    return orders.filter((order) => {
      const cliente = order.cliente || {};
      const matchesStatus = statusFilter === 'todos' || order.estado === statusFilter;

      if (!matchesStatus || !matchesTimeFilter(order, timeFilter)) return false;
      if (!term) return true;

      return `${cliente.nombre || ''} ${cliente.apellido || ''} ${cliente.telefono || ''} ${order.id}`
        .toLocaleLowerCase('es-AR')
        .includes(term);
    });
  }, [orders, searchTerm, statusFilter, timeFilter]);

  // Derivado del listado para que el panel nunca muestre un pedido viejo.
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const overview = useMemo(() => {
    const counts = {};
    const stats = {
      total: orders.length,
      revenue: 0,
      soldUnits: 0,
      pending: 0,
      delivered: 0,
      shipped: 0,
      cancelled: 0,
      legacyConfirmed: 0,
    };

    orders.forEach((order) => {
      // Ingresos y productos vendidos solo cuentan pedidos que ya salieron
      // del local (enviados o entregados).
      if (isSold(order.estado)) {
        stats.revenue += Number(order.total) || 0;
        (order.productos || []).forEach((item) => {
          const qty = Number(item.cantidad) || 0;
          const name = item.nombre || 'Producto';
          counts[name] = (counts[name] || 0) + qty;
          stats.soldUnits += qty;
        });
      }

      if (order.estado === STATUS.PENDIENTE) stats.pending += 1;
      if (order.estado === STATUS.ENTREGADA) stats.delivered += 1;
      if (order.estado === STATUS.ENVIADA) stats.shipped += 1;
      if (order.estado === STATUS.CANCELADA) stats.cancelled += 1;
      if (order.estado === STATUS.CONFIRMADA) stats.legacyConfirmed += 1;
    });

    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    return {
      ...stats,
      shipped: stats.shipped + stats.legacyConfirmed,
      topName: top ? top[0] : null,
      topQty: top ? top[1] : 0,
    };
  }, [orders]);

  const handleExportOrders = () => {
    const orderRows = filteredOrders.map((order) => ({
      'ID pedido': order.id,
      Estado: getStatusLabel(order.estado),
      'Fecha de creación': formatOrderDate(order.createdAt),
      Total: order.total ?? '',
      'Cliente - Nombre': order.cliente?.nombre || '',
      'Cliente - Apellido': order.cliente?.apellido || '',
      'Cliente - Teléfono': order.cliente?.telefono || '',
      'Cliente - Email': order.cliente?.email || '',
      'Entrega - Tipo': order.entrega?.tipo || '',
      'Entrega - Dirección': order.entrega?.direccion || '',
      'Entrega - Localidad': order.entrega?.localidad || '',
      Productos: (order.productos || [])
        .map((item) => `${item.nombre || 'Producto'} x${item.cantidad || 0}`)
        .join(', '),
    }));

    const productRows = filteredOrders.flatMap((order) =>
      (order.productos || []).map((item) => ({
        'ID pedido': order.id,
        'Fecha de creación': formatOrderDate(order.createdAt),
        Estado: getStatusLabel(order.estado),
        Cliente: `${order.cliente?.nombre || ''} ${order.cliente?.apellido || ''}`.trim(),
        Producto: item.nombre || '',
        'ID producto': item.productId || '',
        Cantidad: item.cantidad ?? '',
        'Precio unitario': item.precio ?? '',
        Subtotal: item.subtotal ?? '',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orderRows), 'Pedidos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productRows), 'Productos');
    XLSX.writeFile(workbook, `pedidos-moto-accesorios-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleStatusChange = async (orderId, status) => {
    setPendingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, estado: status } : o)));
      showToast(`Pedido ${orderId}: ${getStatusLabel(status)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(describeError(error), 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleCancelOrder = async (order) => {
    const units = (order.productos || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
    const accepted = confirm(
      `¿Cancelar el pedido ${order.id}?\n\nSe devolverán ${units} unidad(es) al stock y la cancelación no se puede deshacer.`
    );
    if (!accepted) return;

    setPendingId(order.id);
    try {
      await cancelOrder(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, estado: STATUS.CANCELADA } : o)));
      showToast(`Pedido ${order.id} cancelado y stock devuelto`);
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast(describeError(error), 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('No se pudo cerrar la sesión.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin container section">
        <p>Cargando pedidos...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin container section">
        <div className="admin__empty">
          <p>{loadError}</p>
          <button className="btn btn-primary btn-sm" type="button" onClick={loadOrders}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin container section">
      <div className="admin__heading">
        <div>
          <h1 className="admin__title">Panel de administración</h1>
          <p className="admin__subtitle">{orders.length} pedidos registrados</p>
        </div>
        <div className="admin__actions">
          <button className="btn btn-primary btn-sm" type="button" onClick={handleExportOrders} disabled={filteredOrders.length === 0}>
            Descargar Excel
          </button>
          <button className="btn btn-outline btn-sm" type="button" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="admin__tabs">
        <button
          className={`admin__tab ${activeTab === 'orders' ? 'admin__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('orders')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
          Pedidos
        </button>
        <button
          className={`admin__tab ${activeTab === 'products' ? 'admin__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('products')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 2L3 7v11h14V7l-7-5zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z"/></svg>
          Productos
        </button>
        <button
          className={`admin__tab ${activeTab === 'customers' ? 'admin__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('customers')}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zm7 0a3 3 0 100-2 3 3 0 000 2zm.5 1H13a1.5 1.5 0 00-1.5 1.5V12H6V8.5A1.5 1.5 0 004.5 7H3a2 2 0 00-2 2v9h18v-9a2 2 0 00-2-2h-1.5a1.5 1.5 0 00-1.5 1.5V12h-6V8.5A1.5 1.5 0 007.5 7z"/></svg>
          Clientes
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          <button
            className="admin__overview-toggle"
            type="button"
            aria-expanded={showOverview}
            onClick={() => setShowOverview((prev) => !prev)}
          >
            {showOverview ? 'Ocultar resumen' : 'Mostrar resumen'}
            <span className={`admin__overview-toggle-icon ${showOverview ? 'admin__overview-toggle-icon--open' : ''}`}>▾</span>
          </button>

          {showOverview && (
            <div
              className={`admin__overview ${overviewScroll.canStart ? 'admin__overview--can-start' : ''} ${overviewScroll.canEnd ? 'admin__overview--can-end' : ''}`}
            >
              <div
                className="admin__overview-track"
                ref={overviewRef}
                onScroll={syncOverviewScroll}
                tabIndex={0}
                role="group"
                aria-label="Resumen de pedidos"
              >
                <div className="admin__overview-card">
                  <span className="admin__overview-label">Pedidos</span>
                  <span className="admin__overview-value">{overview.total}</span>
                </div>
                <div className="admin__overview-card admin__overview-card--pendiente">
                  <span className="admin__overview-label">Pendientes</span>
                  <span className="admin__overview-value">{overview.pending}</span>
                </div>
                <div className="admin__overview-card admin__overview-card--entregada">
                  <span className="admin__overview-label">Entregadas</span>
                  <span className="admin__overview-value">{overview.delivered}</span>
                </div>
                <div className="admin__overview-card">
                  <span className="admin__overview-label">Envíos activos</span>
                  <span className="admin__overview-value">{overview.shipped}</span>
                </div>
                <div className="admin__overview-card">
                  <span className="admin__overview-label">Canceladas</span>
                  <span className="admin__overview-value">{overview.cancelled}</span>
                </div>
                <div className="admin__overview-card">
                  <span className="admin__overview-label">Unidades vendidas</span>
                  <span className="admin__overview-value">{overview.soldUnits}</span>
                  <span className="admin__overview-sub">Enviadas + entregadas</span>
                </div>
                <div className="admin__overview-card">
                  <span className="admin__overview-label">Ingresos</span>
                  <span className="admin__overview-value">{formatPrice(overview.revenue)}</span>
                  <span className="admin__overview-sub">Enviadas + entregadas</span>
                </div>
                <div className="admin__overview-card admin__overview-card--top">
                  <span className="admin__overview-label">Más vendido</span>
                  <span className="admin__overview-value admin__overview-value--name">
                    {overview.topName || '—'}
                  </span>
                  <span className="admin__overview-sub">
                    {overview.topName ? `${overview.topQty} uds vendidas` : ''}
                  </span>
                </div>
              </div>

              {overviewScroll.canStart && (
                <button
                  className="admin__overview-nav admin__overview-nav--prev"
                  type="button"
                  aria-label="Ver tarjetas anteriores"
                  onClick={() => scrollOverview(-1)}
                >
                  ‹
                </button>
              )}

              {overviewScroll.canEnd && (
                <button
                  className="admin__overview-nav admin__overview-nav--next"
                  type="button"
                  aria-label="Ver tarjetas siguientes"
                  onClick={() => scrollOverview(1)}
                >
                  ›
                </button>
              )}
            </div>
          )}

          <div className="admin__toolbar">
            <label className="admin__search-label" htmlFor="admin-order-search">Buscar</label>
            <input
              id="admin-order-search"
              className="admin__search"
              type="search"
              placeholder="Nombre, teléfono o N° de pedido"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="admin__filter"
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {Object.values(STATUS).map((value) => (
                <option key={value} value={value}>{getStatusLabel(value)}</option>
              ))}
            </select>
            <select
              className="admin__filter"
              aria-label="Filtrar por período"
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value)}
            >
              <option value="todos">Todo el tiempo</option>
              <option value="este-mes">Este mes</option>
              <option value="mes-pasado">Mes pasado</option>
              <option value="ultimos-3-meses">Últimos 3 meses</option>
            </select>
          </div>

          <div className="admin__layout">
            <div className="admin__list">
              {filteredOrders.length === 0 ? (
                <p className="admin__empty">
                  {orders.length === 0
                    ? 'Todavía no hay pedidos.'
                    : 'No hay pedidos que coincidan con los filtros.'}
                </p>
              ) : (
                filteredOrders.map((order) => {
                  const cliente = order.cliente || {};
                  return (
                    <div
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      className={`admin__order-card ${selectedOrder?.id === order.id ? 'admin__order-card--selected' : ''}`}
                      onClick={() => handleSelectOrder(order)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSelectOrder(order);
                        }
                      }}
                    >
                      <div className="admin__order-header">
                        <span className="admin__order-id">{order.id}</span>
                        <span className={`admin__status ${getStatusColor(order.estado)}`}>
                          {getStatusLabel(order.estado)}
                        </span>
                      </div>
                      <div className="admin__order-info">
                        <span>{`${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '—'}</span>
                        <span>{formatPrice(order.total ?? 0)}</span>
                      </div>
                      <div className="admin__order-date">
                        {formatOrderDate(order.createdAt)}
                      </div>
                      {cliente.telefono && (
                        <a
                          className="admin__whatsapp-link"
                          href={buildWhatsAppUrl(cliente.telefono, `Hola ${cliente.nombre || ''}, te contacto por tu pedido ${order.id}.`)}
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
                  );
                })
              )}
            </div>

            {selectedOrder && (
              <div className="admin__detail">
                <AdminOrderDetail
                  order={selectedOrder}
                  busy={pendingId === selectedOrder.id}
                  onStatusChange={handleStatusChange}
                  onCancel={handleCancelOrder}
                />
              </div>
            )}
          </div>

          {selectedOrder && (
            <>
              <div
                className={`admin__drawer-backdrop ${drawerOpen ? 'admin__drawer-backdrop--open' : ''}`}
                onClick={closeDrawer}
              />
              <div className={`admin__drawer ${drawerOpen ? 'admin__drawer--open' : ''}`}>
                <div className="admin__drawer-header">
                  <h2>Pedido {selectedOrder.id}</h2>
                  <button className="admin__drawer-close" type="button" aria-label="Cerrar" onClick={closeDrawer}>✕</button>
                </div>
                <div className="admin__drawer-content">
                  <AdminOrderDetail
                    order={selectedOrder}
                    showTitle={false}
                    busy={pendingId === selectedOrder.id}
                    onStatusChange={handleStatusChange}
                    onCancel={handleCancelOrder}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'products' && <AdminProducts />}

      {activeTab === 'customers' && <AdminCustomers orders={orders} />}
    </div>
  );
};

export default Admin;
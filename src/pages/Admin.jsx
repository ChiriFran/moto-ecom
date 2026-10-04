import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';
import { getAllOrders, updateOrderStatus, restoreStock } from '../services/orders';
import { auth } from '../services/firebase';
import { formatPrice } from '../utils/formatPrice';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  buildWhatsAppUrl,
} from '../config/orderStatus';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';
import './Admin.css';

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [timeFilter, setTimeFilter] = useState('todos');
  const [showOverview, setShowOverview] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    if (window.innerWidth <= 768) {
      setDrawerOpen(true);
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  const filteredOrders = orders.filter((order) => {
    const customerName = `${order.cliente?.nombre || ''} ${order.cliente?.apellido || ''}`.toLocaleLowerCase('es-AR');
    const matchesName = customerName.includes(searchTerm.trim().toLocaleLowerCase('es-AR'));
    const matchesStatus = statusFilter === 'todos' || order.estado === statusFilter;

    if (timeFilter === 'todos') return matchesName && matchesStatus;

    const orderDate = new Date(order.createdAt);
    if (Number.isNaN(orderDate.getTime())) return false;

    const now = new Date();
    let matchesTime = true;

    if (timeFilter === 'este-mes') {
      matchesTime = orderDate.getFullYear() === now.getFullYear()
        && orderDate.getMonth() === now.getMonth();
    } else if (timeFilter === 'mes-pasado') {
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      matchesTime = orderDate.getFullYear() === previousMonth.getFullYear()
        && orderDate.getMonth() === previousMonth.getMonth();
    } else if (timeFilter === 'ultimos-3-meses') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      matchesTime = orderDate >= threeMonthsAgo;
    }

    return matchesName && matchesStatus && matchesTime;
  });

  const topProduct = (() => {
    const counts = {};
    orders.forEach((o) => {
      (o.productos || []).forEach((p) => {
        const name = p.nombre || 'Producto';
        counts[name] = (counts[name] || 0) + (p.cantidad || 1);
      });
    });
    let best = null;
    for (const [name, qty] of Object.entries(counts)) {
      if (!best || qty > best.qty) best = { name, qty };
    }
    return best;
  })();

  const overviewStats = {
    total: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    pendientes: orders.filter((o) => o.estado === 'pendiente').length,
    confirmadas: orders.filter((o) => o.estado === 'confirmada').length,
    enviadas: orders.filter((o) => o.estado === 'enviada').length,
    entregadas: orders.filter((o) => o.estado === 'entregada').length,
    canceladas: orders.filter((o) => o.estado === 'cancelada').length,
  };

  const handleExportOrders = () => {
    const orderRows = filteredOrders.map((order) => ({
      'ID pedido': order.id,
      Estado: STATUS_LABELS[order.estado] || order.estado || '',
      'Fecha de creación': order.createdAt || '',
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
        'Fecha de creación': order.createdAt || '',
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, estado: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRestoreStock = async (order) => {
    if (!confirm(`¿Restaurar stock para el pedido ${order.id}? Se devolverán ${order.productos.length} productos al stock.`)) return;
    try {
      await restoreStock(order);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, estado: 'cancelada' } : o))
      );
      setSelectedOrder((prev) => (prev?.id === order.id ? { ...prev, estado: 'cancelada' } : prev));
      alert('Stock restaurado y pedido cancelado');
    } catch (error) {
      console.error('Error restoring stock:', error);
      alert('Error al restaurar stock');
    }
  };

  if (loading) {
    return (
      <div className="admin container section">
        <p>Cargando pedidos...</p>
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
          <button className="btn btn-outline btn-sm" type="button" onClick={() => signOut(auth)}>
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
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zm7 0a1 1 0 100-2 1 1 0 000 2zm.5 1H13a1.5 1.5 0 00-1.5 1.5V12H6V8.5A1.5 1.5 0 004.5 7H3a2 2 0 00-2 2v9h18v-9a2 2 0 00-2-2h-1.5a1.5 1.5 0 00-1.5 1.5V12h-6V8.5A1.5 1.5 0 007.5 7z"/></svg>
          Clientes
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          <button
            className="admin__overview-toggle"
            type="button"
            onClick={() => setShowOverview((prev) => !prev)}
          >
            {showOverview ? 'Ocultar resumen' : 'Mostrar resumen'}
            <span className={`admin__overview-toggle-icon ${showOverview ? 'admin__overview-toggle-icon--open' : ''}`}>▾</span>
          </button>

          {showOverview && (
            <div className="admin__overview">
              <div className="admin__overview-card">
                <span className="admin__overview-label">Pedidos</span>
                <span className="admin__overview-value">{overviewStats.total}</span>
              </div>
              <div className="admin__overview-card">
                <span className="admin__overview-label">Ingresos</span>
                <span className="admin__overview-value">{formatPrice(overviewStats.totalRevenue)}</span>
              </div>
              <div className="admin__overview-card admin__overview-card--pendiente admin__overview-card--hide-mobile">
                <span className="admin__overview-label">Pendientes</span>
                <span className="admin__overview-value">{overviewStats.pendientes}</span>
              </div>
              <div className="admin__overview-card admin__overview-card--entregada">
                <span className="admin__overview-label">Entregadas</span>
                <span className="admin__overview-value">{overviewStats.entregadas}</span>
              </div>
              <div className="admin__overview-card admin__overview-card--hide-mobile">
                <span className="admin__overview-label">Envíos activos</span>
                <span className="admin__overview-value">{overviewStats.confirmadas + overviewStats.enviadas}</span>
              </div>
              <div className="admin__overview-card admin__overview-card--top">
                <span className="admin__overview-label">Más vendido</span>
                <span className="admin__overview-value admin__overview-value--name">{topProduct ? topProduct.name : '—'}</span>
                <span className="admin__overview-sub">{topProduct ? `${topProduct.qty} uds vendidas` : ''}</span>
              </div>
            </div>
          )}

          <div className="admin__toolbar">
            <label className="admin__search-label" htmlFor="admin-order-search">Buscar por nombre</label>
            <input
              id="admin-order-search"
              className="admin__search"
              type="search"
              placeholder="Nombre o apellido"
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
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
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
                <p className="admin__empty">No hay pedidos que coincidan con los filtros.</p>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`admin__order-card ${selectedOrder?.id === order.id ? 'admin__order-card--selected' : ''}`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="admin__order-header">
                      <span className="admin__order-id">{order.id}</span>
                      <span className={`admin__status ${STATUS_COLORS[order.estado]}`}>
                        {STATUS_LABELS[order.estado]}
                      </span>
                    </div>
                    <div className="admin__order-info">
                      <span>{order.cliente.nombre} {order.cliente.apellido}</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                    <div className="admin__order-date">
                      {new Date(order.createdAt).toLocaleDateString('es-AR')}
                    </div>
                    {order.cliente.telefono && (
                      <a
                        className="admin__whatsapp-link"
                        href={buildWhatsAppUrl(order.cliente.telefono, `Hola ${order.cliente.nombre}, te contacto por tu pedido ${order.id}.`)}
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

            {selectedOrder && (
              <div className="admin__detail">
                <h2 className="admin__detail-title">Pedido {selectedOrder.id}</h2>

                <div className="admin__detail-section">
                  <h3>Cliente</h3>
                  <p>{selectedOrder.cliente.nombre} {selectedOrder.cliente.apellido}</p>
                  <p>Tel: {selectedOrder.cliente.telefono}</p>
                  <p>Email: {selectedOrder.cliente.email}</p>
                </div>

                <div className="admin__detail-section">
                  <h3>Entrega</h3>
                  <p>{selectedOrder.entrega.tipo === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</p>
                  {selectedOrder.entrega.tipo === 'envio' && (
                    <>
                      <p>{selectedOrder.entrega.direccion}</p>
                      <p>{selectedOrder.entrega.localidad}</p>
                    </>
                  )}
                </div>

                <div className="admin__detail-section">
                  <h3>Productos</h3>
                  {selectedOrder.productos.map((item, i) => (
                    <div key={i} className="admin__detail-product">
                      <span>{item.nombre} x{item.cantidad}</span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="admin__detail-total">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="admin__detail-section">
                  <h3>Estado</h3>
                  <div className="admin__status-buttons">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        className={`btn btn-sm ${selectedOrder.estado === key ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleStatusChange(selectedOrder.id, key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrder.estado !== 'cancelada' && (
                  <div className="admin__detail-section">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRestoreStock(selectedOrder)}
                    >
                      Cancelar y restaurar stock
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer lateral - mobile */}
          {selectedOrder && (
            <>
              <div
                className={`admin__drawer-backdrop ${drawerOpen ? 'admin__drawer-backdrop--open' : ''}`}
                onClick={closeDrawer}
              />
              <div className={`admin__drawer ${drawerOpen ? 'admin__drawer--open' : ''}`}>
                <div className="admin__drawer-header">
                  <h2>Pedido {selectedOrder.id}</h2>
                  <button className="admin__drawer-close" onClick={closeDrawer}>✕</button>
                </div>
                <div className="admin__drawer-content">
                  <div className="admin__detail-section">
                    <h3>Cliente</h3>
                    <p>{selectedOrder.cliente.nombre} {selectedOrder.cliente.apellido}</p>
                    <p>Tel: {selectedOrder.cliente.telefono}</p>
                    <p>Email: {selectedOrder.cliente.email}</p>
                  </div>

                  <div className="admin__detail-section">
                    <h3>Entrega</h3>
                    <p>{selectedOrder.entrega.tipo === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</p>
                    {selectedOrder.entrega.tipo === 'envio' && (
                      <>
                        <p>{selectedOrder.entrega.direccion}</p>
                        <p>{selectedOrder.entrega.localidad}</p>
                      </>
                    )}
                  </div>

                  <div className="admin__detail-section">
                    <h3>Productos</h3>
                    {selectedOrder.productos.map((item, i) => (
                      <div key={i} className="admin__detail-product">
                        <span>{item.nombre} x{item.cantidad}</span>
                        <span>{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="admin__detail-total">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>

                  <div className="admin__detail-section">
                    <h3>Estado</h3>
                    <div className="admin__status-buttons">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          className={`btn btn-sm ${selectedOrder.estado === key ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => handleStatusChange(selectedOrder.id, key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedOrder.estado !== 'cancelada' && (
                    <div className="admin__detail-section">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          handleRestoreStock(selectedOrder);
                          closeDrawer();
                        }}
                      >
                        Cancelar y restaurar stock
                      </button>
                    </div>
                  )}
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

import { collection, getDocs, doc, getDoc, query, orderBy, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import {
  STATUS,
  ERROR_CODES,
  canCancel,
  canTransition,
  isCancelled,
} from '../config/orderStatus';

const ORDERS_COLLECTION = 'ordenes';
const PRODUCTS_COLLECTION = 'productos';

export const createOrder = async (order, cartItems) => {
  const orderRef = doc(collection(db, ORDERS_COLLECTION));

  const orderData = {
    ...order,
    id: orderRef.id,
    estado: STATUS.PENDIENTE,
    createdAt: new Date().toISOString(),
  };

  await runTransaction(db, async (transaction) => {
    const productRefs = cartItems.map((item) => doc(db, PRODUCTS_COLLECTION, item.id));
    const productSnapshots = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));

    productSnapshots.forEach((productSnap, index) => {
      const item = cartItems[index];
      const stock = productSnap.exists() ? Number(productSnap.data().stock) || 0 : 0;
      if (!productSnap.exists() || stock < item.cantidad) {
        throw new Error(`STOCK_INSUFFICIENT:${item.nombre}`);
      }
    });

    transaction.set(orderRef, orderData);
    productSnapshots.forEach((productSnap, index) => {
      const productRef = productRefs[index];
      transaction.update(productRef, { stock: (Number(productSnap.data().stock) || 0) - cartItems[index].cantidad });
    });
  });

  return orderData;
};

export const getOrderById = async (id) => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

export const getAllOrders = async () => {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// El cambio de estado se valida contra el documento leido dentro de la
// transaccion, no contra el snapshot del cliente, para que dos tabs del panel
// no puedan pisarse.
export const updateOrderStatus = async (id, status) => {
  // Cancelar tiene su propio camino (cancelOrder) porque ademas devuelve stock.
  if (status === STATUS.CANCELADA) throw new Error(ERROR_CODES.INVALID_TRANSITION);

  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, ORDERS_COLLECTION, id);
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) throw new Error(ERROR_CODES.NOT_FOUND);

    if (!canTransition(orderSnap.data().estado, status)) {
      throw new Error(ERROR_CODES.INVALID_TRANSITION);
    }

    transaction.update(orderRef, { estado: status });
  });
};

// Cancela el pedido y devuelve el stock exactamente una vez: el chequeo de
// estado vive dentro de la transaccion, asi que un segundo intento (o dos
// clicks seguidos) falla en vez de sumar stock dos veces.
export const cancelOrder = async (id) => {
  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, ORDERS_COLLECTION, id);
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) throw new Error(ERROR_CODES.NOT_FOUND);

    const order = orderSnap.data();

    if (isCancelled(order.estado)) throw new Error(ERROR_CODES.ALREADY_CANCELLED);
    if (!canCancel(order.estado)) throw new Error(ERROR_CODES.INVALID_TRANSITION);

    const items = (order.productos || []).filter((item) => item && item.productId);
    const productRefs = items.map((item) => doc(db, PRODUCTS_COLLECTION, String(item.productId)));
    const productSnapshots = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));

    productSnapshots.forEach((productSnap, index) => {
      if (!productSnap.exists()) return;
      const cantidad = Number(items[index].cantidad) || 0;
      if (cantidad <= 0) return;
      const currentStock = Number(productSnap.data().stock) || 0;
      transaction.update(productRefs[index], { stock: currentStock + cantidad });
    });

    transaction.update(orderRef, { estado: STATUS.CANCELADA });
  });
};
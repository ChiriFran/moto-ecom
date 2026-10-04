import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

const ORDERS_COLLECTION = 'ordenes';
const PRODUCTS_COLLECTION = 'productos';

export const createOrder = async (order, cartItems) => {
  const orderRef = doc(collection(db, ORDERS_COLLECTION));

  const orderData = {
    ...order,
    id: orderRef.id,
    estado: 'pendiente',
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

export const updateOrderStatus = async (id, status) => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, { estado: status });
};

export const restoreStock = async (order) => {
  await runTransaction(db, async (transaction) => {
    const productRefs = order.productos.map((item) => doc(db, PRODUCTS_COLLECTION, item.productId));
    const productSnapshots = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));

    productSnapshots.forEach((productSnap, index) => {
      if (productSnap.exists()) {
        const currentStock = Number(productSnap.data().stock) || 0;
        transaction.update(productRefs[index], {
          stock: currentStock + order.productos[index].cantidad,
        });
      }
    });

    transaction.update(doc(db, ORDERS_COLLECTION, order.id), { estado: 'cancelada' });
  });
};

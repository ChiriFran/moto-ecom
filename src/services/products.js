import { collection, getDocs, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const PRODUCTS_COLLECTION = 'productos';

const mapProduct = (productDoc) => ({ id: productDoc.id, ...productDoc.data() });

export const getAllProducts = async () => {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(mapProduct);
};

export const subscribeToProducts = (onProducts, onError) =>
  onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => onProducts(snapshot.docs.map(mapProduct)),
    onError
  );

export const getProductBySlug = async (slug) => {
  const q = query(collection(db, PRODUCTS_COLLECTION), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return mapProduct(doc);
};

export const subscribeToProductBySlug = (slug, onProduct, onError) => {
  const productsQuery = query(collection(db, PRODUCTS_COLLECTION), where('slug', '==', slug));
  return onSnapshot(
    productsQuery,
    (snapshot) => onProduct(snapshot.empty ? null : mapProduct(snapshot.docs[0])),
    onError
  );
};

export const getProductsByCategory = async (category) => {
  const q = query(collection(db, PRODUCTS_COLLECTION), where('categoria', '==', category), where('activo', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapProduct);
};

export const getFeaturedProducts = async () => {
  const q = query(collection(db, PRODUCTS_COLLECTION), where('destacado', '==', true), where('activo', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapProduct);
};

export const createProduct = async (data) => {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
  return docRef.id;
};

export const updateProduct = async (id, data) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, data);
};

export const deleteProduct = async (id) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
};

export const uploadProductImage = async (file, fileName) => {
  const storageRef = ref(storage, `images/products/${fileName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

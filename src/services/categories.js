import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const CATEGORIES_COLLECTION = 'categorias';

export const getAllCategories = async () => {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('orden'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

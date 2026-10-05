import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLACEHOLDER_IMAGE = '/images/placeholder-product.svg';

const products = [
  { id: 'casco-integral-volt-matte', nombre: 'Casco Integral Volt Matte Negro', slug: 'casco-integral-volt-matte', descripcion: 'Casco integral de policarbonato con homologación ECE R22-06, visera anti rayaduras y sistema de ventilación ajustable. Máxima seguridad y confort en cada viaje.', descripcionCorta: 'Casco integral monocasco de policarbonato.', categoria: 'Cascos', imagen: PLACEHOLDER_IMAGE, precio: 185000, precioTransferencia: 176500, presentacion: 'Talle M', especificaciones: ['Policarbonato inyectado', 'Homologación ECE R22-06', 'Visera anti rayaduras', 'Interior desmontable y lavable'], stock: 12, destacado: true, activo: true, orden: 1 },
  { id: 'casco-abierto-cruiser', nombre: 'Casco Abierto Cruiser', slug: 'casco-abierto-cruiser', descripcion: 'Casco abierto estilo cruiser, liviano y cómodo. Ideal para ciudad y rutas cortas. Certificación DOT.', descripcionCorta: 'Casco abierto cruiser liviano.', categoria: 'Cascos', imagen: PLACEHOLDER_IMAGE, precio: 142000, precioTransferencia: 135500, presentacion: 'Talle L', especificaciones: ['Casco abierto 3/4', 'Certificación DOT', 'Interior desmontable', 'Cierre con trinquete'], stock: 8, destacado: true, activo: true, orden: 2 },
  { id: 'casco-cross-terrain', nombre: 'Casco Cross Terrain', slug: 'casco-cross-terrain', descripcion: 'Casco estilo rally con visera extendida y protección total para aventura y off-road. Homologado ECE.', descripcionCorta: 'Casco cross estilo rally.', categoria: 'Cascos', imagen: PLACEHOLDER_IMAGE, precio: 158000, precioTransferencia: 151000, presentacion: 'Única', especificaciones: ['Diseño estilo rally', 'Visera extendida', 'Homologación ECE R22-06', 'Ventilación integrada'], stock: 10, destacado: false, activo: true, orden: 3 },
  { id: 'guantes-urbanos-skin', nombre: 'Guantes Urbanos Skin Negro', slug: 'guantes-urbanos-skin', descripcion: 'Guantes urbanos de cuero con cierre de velcro, compatible con pantalla táctil y refuerzos en la palma. Comfort y estilo para todos los días.', descripcionCorta: 'Guantes urbanos de cuero.', categoria: 'Guantes', imagen: PLACEHOLDER_IMAGE, precio: 32000, precioTransferencia: 30500, presentacion: 'Talle M', especificaciones: ['Cuero genuino', 'Toque táctil en pulgar e índice', 'Cierre velcro', 'Refuerzo en palma'], stock: 25, destacado: true, activo: true, orden: 1 },
  { id: 'guantes-invierno-termal', nombre: 'Guantes Invierno Termal', slug: 'guantes-invierno-termal', descripcion: 'Guantes térmicos impermeables con forro polar y protectores de metacarpo. Mantené tus manos cálidas y protegidas en los días fríos.', descripcionCorta: 'Guantes térmicos impermeables.', categoria: 'Guantes', imagen: PLACEHOLDER_IMAGE, precio: 45000, precioTransferencia: 42900, presentacion: 'Talle L', especificaciones: ['Forro térmico polar', 'Membrana impermeable', 'Protectores de metacarpo', 'Puño reforzado'], stock: 15, destacado: false, activo: true, orden: 2 },
  { id: 'campera-rider-impermeable', nombre: 'Campera Rider Impermeable', slug: 'campera-rider-impermeable', descripcion: 'Campera textil 600D impermeable con protectores de hombros y codos. Diseñada para resistencia y confort en todo clima.', descripcionCorta: 'Campera textil con protectores.', categoria: 'Indumentaria', imagen: PLACEHOLDER_IMAGE, precio: 129000, precioTransferencia: 123500, presentacion: 'Talle M', especificaciones: ['Textil 600D', 'Membrana impermeable', 'Protectores hombros y codos', 'Ventilación laterales'], stock: 10, destacado: true, activo: true, orden: 1 },
  { id: 'pantalon-viaje-multipocket', nombre: 'Pantalón de Viaje MultiPocket', slug: 'pantalon-viaje-multipocket', descripcion: 'Pantalón textil reforzado con rodilleras extraíbles y bolsillos cargo. Preparado para viajes largos y uso diario.', descripcionCorta: 'Pantalón con rodilleras extraíbles.', categoria: 'Indumentaria', imagen: PLACEHOLDER_IMAGE, precio: 98000, precioTransferencia: 93500, presentacion: 'Talle L', especificaciones: ['Textil reforzado', 'Rodilleras extraíbles', 'Bolsillos cargo', 'Cintura ajustable'], stock: 12, destacado: false, activo: true, orden: 2 },
  { id: 'buzo-termico-motociclista', nombre: 'Buzo Térmico Motociclista', slug: 'buzo-termico-motociclista', descripcion: 'Buzo polar de corte ajustado con cuello alto, ideal como primera capa térmica bajo la campera.', descripcionCorta: 'Buzo polar térmico de capa base.', categoria: 'Indumentaria', imagen: PLACEHOLDER_IMAGE, precio: 38000, precioTransferencia: 36200, presentacion: 'Talle M', especificaciones: ['Polar térmico', 'Corte ajustado', 'Cuello alto', 'Antipilling'], stock: 20, destacado: false, activo: true, orden: 3 },
  { id: 'protecciones-pecho-espalda', nombre: 'Protecciones', slug: 'protecciones-pecho-espalda', descripcion: 'Chaleco de protección EVA para pecho y espalda, liviano y flexible. Compatible con la mayoría de las camperas.', descripcionCorta: 'Chaleco protector EVA.', categoria: 'Protección', imagen: PLACEHOLDER_IMAGE, precio: 55000, precioTransferencia: 52500, presentacion: 'Única', especificaciones: ['Chaleco EVA', 'Protección pecho y espalda', 'Liviano y flexible', 'Cierres regulables'], stock: 9, destacado: true, activo: true, orden: 1 },
  { id: 'rodilleras-coderas-moto', nombre: 'Rodilleras y Coderas de Moto', slug: 'rodilleras-coderas-moto', descripcion: 'Set de rodilleras y coderas con protectores removibles, talles ajustables y materiales transpirables.', descripcionCorta: 'Set de rodilleras y coderas.', categoria: 'Protección', imagen: PLACEHOLDER_IMAGE, precio: 48000, precioTransferencia: 45800, presentacion: 'Única', especificaciones: ['Set rodilleras + coderas', 'Protectores removibles', 'Talle ajustable', 'Tejido transpirable'], stock: 14, destacado: false, activo: true, orden: 2 },
  { id: 'soporte-celular-universal', nombre: 'Soporte de Celular Universal', slug: 'soporte-celular-universal', descripcion: 'Soporte antivibración con ajuste universal para manubrio. Instalación fácil y sujeción segura para tu dispositivo.', descripcionCorta: 'Soporte antivibración universal.', categoria: 'Accesorios', imagen: PLACEHOLDER_IMAGE, precio: 22000, precioTransferencia: 21000, presentacion: 'Universal', especificaciones: ['Ajuste universal', 'Sistema antivibración', 'Instalación sin herramientas', 'Pantalla giratoria 360°'], stock: 30, destacado: true, activo: true, orden: 1 },
  { id: 'candado-disco-alarma', nombre: 'Candado de Disco con Alarma', slug: 'candado-disco-alarma', descripcion: 'Candado de disco de acero templado con alarma de 100 dB. Máxima protección contra el robo.', descripcionCorta: 'Candado de disco con alarma.', categoria: 'Accesorios', imagen: PLACEHOLDER_IMAGE, precio: 28000, precioTransferencia: 26700, presentacion: 'Única', especificaciones: ['Acero templado', 'Alarma 100 dB', 'Incluye funda de transporte', 'Detector de movimiento'], stock: 18, destacado: false, activo: true, orden: 2 },
  { id: 'kit-lubricacion-cadena', nombre: 'Kit Lubricación de Cadena', slug: 'kit-lubricacion-cadena', descripcion: 'Kit completo para el mantenimiento de la cadena: limpiador, lubricante y cepillo de aplicación. Alarga la vida útil de tu transmisión.', descripcionCorta: 'Kit limpieza y lubricación de cadena.', categoria: 'Accesorios', imagen: PLACEHOLDER_IMAGE, precio: 18000, precioTransferencia: 17100, presentacion: 'Kit', especificaciones: ['Limpia cadena desengrasante', 'Lubricante de cadena', 'Cepillo de aplicación', 'Presentaciones de 400 ml'], stock: 22, destacado: false, activo: true, orden: 3 },
];

const categories = [
  { id: 'cascos', nombre: 'Cascos', slug: 'cascos', imagen: '/images/categories/1.png', orden: 1 },
  { id: 'guantes', nombre: 'Guantes', slug: 'guantes', imagen: '/images/categories/2.png', orden: 2 },
  { id: 'indumentaria', nombre: 'Indumentaria', slug: 'indumentaria', imagen: '/images/categories/3.png', orden: 3 },
  { id: 'protecciones', nombre: 'Protecciones', slug: 'protecciones', imagen: '/images/categories/4.png', orden: 4 },
  { id: 'accesorios', nombre: 'Accesorios', slug: 'accesorios', imagen: '/images/categories/5.png', orden: 5 },
];

async function seedProducts() {
  const productsRef = collection(db, 'productos');
  for (const product of products) {
    const { id, ...productData } = product;
    await setDoc(doc(productsRef, id), productData);
    console.log(`Producto subido: ${product.nombre}`);
  }
}

async function seedCategories() {
  const categoriesRef = collection(db, 'categorias');
  for (const category of categories) {
    const { id, ...categoryData } = category;
    await setDoc(doc(categoriesRef, id), categoryData);
    console.log(`Categoria subida: ${category.nombre}`);
  }
}

async function main() {
  try {
    console.log('Subiendo productos a Firestore...');
    await seedProducts();
    console.log('\nSubiendo categorias a Firestore...');
    await seedCategories();
    console.log('\nSeed completado exitosamente');
  } catch (error) {
    console.error('Error durante el seed:', error);
  }
}

main();
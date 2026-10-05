# Moto Accesorios

E-commerce de accesorios y equipamiento para motociclistas (cascos, guantes, indumentaria, protecciones y accesorios).

## Stack

- React 19 + React Router 7
- Vite 8
- Firebase (Firestore + Auth)
- CSS puro con variables CSS (sin framework)
- Oxlint

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
npm run lint     # oxlint
npm run seed     # sube productos y categorías de ejemplo a Firestore
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar las credenciales de Firebase:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_UID=
```

## Estructura

```
src/
  components/   # layout, productos, carrito, ui
  config/       # datos de la tienda, estados de pedido, seed
  context/      # CartContext
  pages/        # Home, Products, ProductDetail, Cart, Checkout, OrderSuccess, About, Admin
  services/     # firebase, products, categories, orders
  styles/       # variables.css y globals.css
  utils/        # formatPrice, slugify, whatsapp
public/images/  # recursos estáticos (hero, editoriales, categorías)
```

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Home |
| `/productos` | Catálogo con filtros |
| `/producto/:slug` | Detalle de producto |
| `/carrito` | Carrito |
| `/checkout` | Checkout |
| `/pedido-confirmado` | Confirmación de pedido |
| `/nosotros` | Nosotros |
| `/admin` | Panel de administración (protegido) |

## Datos de la tienda

Nombre, tagline, WhatsApp, email, Instagram y dominio se configuran en `src/config/store.js`.

## Deploy

Vercel. `vercel.json` ya tiene el rewrite de SPA hacia `index.html`.
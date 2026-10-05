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

## Estados de pedido

El flujo y las transiciones validas viven en `src/config/orderStatus.js`.

```
pendiente ──> enviada ──> entregada
    │            │
    └────────────┴──────> cancelada (terminal)
```

- `confirmada` ya no se asigna desde el panel. El estado se conserva en
  `STATUS_LABELS` solo para poder mostrar pedidos viejos que quedaron ahi; esos
  pedidos se pueden migrar a `enviada` o `entregada`.
- `cancelada` es terminal: no tiene transiciones de salida, asi que un pedido
  cancelado no se puede volver a marcar como enviado o entregado.
- La cancelacion se hace solo con su propio boton (`cancelOrder` en
  `src/services/orders.js`) porque ademas devuelve el stock. `updateOrderStatus`
  rechaza `cancelada` para que nadie pueda cancelar sin devolver stock.
- `cancelOrder` valida el estado **dentro de la transaccion**, asi que un
  segundo intento de cancelar el mismo pedido falla en vez de sumar el stock dos
  veces.

Los ingresos, las unidades vendidas y el producto mas vendido del resumen cuentan
solo pedidos en `enviada` o `entregada`.

## Deploy

Vercel. `vercel.json` ya tiene el rewrite de SPA hacia `index.html`.

Las variables `VITE_*` hay que definirlas tambien en el dashboard de Vercel: al
estar `.env` en `.gitignore` nunca se sube al repo. Si falta `VITE_ADMIN_UID` en
el entorno de deploy, `/admin` rechaza el acceso.
import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import About from './pages/About';
import Admin from './pages/Admin';
import AdminRoute from './components/AdminRoute';

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const { documentElement } = document;
    const previousScrollBehavior = documentElement.style.scrollBehavior;

    documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
    window.scrollTo(0, 0);

    const restoreScrollBehavior = requestAnimationFrame(() => {
      if (previousScrollBehavior) {
        documentElement.style.scrollBehavior = previousScrollBehavior;
      } else {
        documentElement.style.removeProperty('scroll-behavior');
      }
    });

    return () => cancelAnimationFrame(restoreScrollBehavior);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/producto/:slug" element={<ProductDetail />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido-confirmado" element={<OrderSuccess />} />
            <Route path="/nosotros" element={<About />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;

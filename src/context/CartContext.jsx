import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToProducts } from '../services/products';

const CartContext = createContext();

const CART_STORAGE_KEY = 'moto-accesorios-cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((products) => {
      const productsById = new Map(products.map((product) => [product.id, product]));
      setItems((prev) => prev
        .map((item) => {
          const currentProduct = productsById.get(item.id);
          if (!currentProduct) return null;
          const stock = Math.max(0, Number(currentProduct.stock) || 0);
          return { ...item, ...currentProduct, cantidad: Math.min(item.cantidad, stock) };
        })
        .filter((item) => item && item.cantidad > 0)
      );
    }, (error) => {
      console.error('Error syncing product stock:', error);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    const availableStock = Math.max(0, Number(product.stock) || 0);
    if (availableStock < 1) {
      showToast('Este producto ya no tiene stock disponible', 'error');
      return false;
    }

    const existing = items.find((item) => item.id === product.id);
    if (existing && existing.cantidad >= availableStock) {
      showToast(`Solo hay ${availableStock} unidad(es) disponible(s)`, 'error');
      return false;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.cantidad + quantity, availableStock);
        return prev.map((item) =>
          item.id === product.id ? { ...item, cantidad: newQty } : item
        );
      }
      return [...prev, { ...product, cantidad: Math.min(quantity, availableStock) }];
    });
    showToast(`${product.nombre} agregado al carrito`);
    return true;
  }, [items, showToast]);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const increaseQuantity = useCallback((productId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, cantidad: Math.min(item.cantidad + 1, Math.max(0, Number(item.stock) || 0)) }
          : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((productId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, cantidad: Math.max(item.cantidad - 1, 1) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.precio * item.cantidad, 0);
  }, [items]);

  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.cantidad, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        toast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

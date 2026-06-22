import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Auto-clean stale offer items whenever cart changes
    setCart(prevCart => {
      const hasStale = prevCart.some(item => {
        if (!item.linkedBuyKey) return false;
        const buyItem = prevCart.find(b => b.cartKey === item.linkedBuyKey);
        if (!buyItem) return true;
        const requiredQty = item.offerBuyQuantity || 1;
        if (buyItem.quantity < requiredQty) return true;
        return false;
      });
      if (!hasStale) return prevCart;
      return prevCart.filter(item => {
        if (!item.linkedBuyKey) return true;
        const buyItem = prevCart.find(b => b.cartKey === item.linkedBuyKey);
        if (!buyItem) return false;
        const requiredQty = item.offerBuyQuantity || 1;
        if (buyItem.quantity < requiredQty) return false;
        return true;
      });
    });
  }, [cart]);

  // Generate unique item key based on product ID and selected size (if any)
  const getItemKey = (product, selectedSize) => {
    return selectedSize ? `${product._id}_${selectedSize}` : product._id;
  };

  const addToCart = (product, quantity = 1, selectedSize = null) => {
    const itemKey = getItemKey(product, selectedSize);

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.cartKey === itemKey);

      if (existingItem) {
        return prevCart.map(item =>
          item.cartKey === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Normalize price once: store the discounted unit price
      const discountPercent = product.discountPercent || 0;
      const originalPrice = product.price;
      const discountedPrice = discountPercent
        ? originalPrice * (100 - discountPercent) / 100
        : originalPrice;

      return [...prevCart, {
        ...product,
        cartKey: itemKey,
        selectedSize,
        quantity,
        price: discountedPrice,
        originalPrice,
        discountPercent
      }];
    });
  };

  const removeFromCart = (cartKey) => {
    setCart(prevCart => {
      return prevCart.filter(item => {
        // Remove the item itself
        if (item.cartKey === cartKey) return false;
        // Also remove any offer get-items linked to this buy product
        if (item.linkedBuyKey === cartKey) return false;
        return true;
      });
    });
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    setCart(prevCart => {
      const updated = prevCart.map(item =>
        item.cartKey === cartKey ? { ...item, quantity } : item
      );

      // Cleanup: remove any get-items whose linked buy product has dropped below threshold
      return updated.filter(item => {
        // Keep non-offer items
        if (!item.linkedBuyKey) return true;
        // Check if linked buy product still exists and meets threshold
        const buyItem = updated.find(b => b.cartKey === item.linkedBuyKey);
        if (!buyItem) return false; // Buy product removed
        const requiredQty = item.offerBuyQuantity || 1;
        if (buyItem.quantity < requiredQty) return false; // Below threshold
        return true;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getEffectivePrice = (item) => item.price;

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + getEffectivePrice(item) * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Force cleanup of stale offer items — can be called manually
  const cleanCart = () => {
    setCart(prevCart => {
      return prevCart.filter(item => {
        if (!item.linkedBuyKey) return true;
        const buyItem = prevCart.find(b => b.cartKey === item.linkedBuyKey);
        if (!buyItem) return false;
        const requiredQty = item.offerBuyQuantity || 1;
        if (buyItem.quantity < requiredQty) return false;
        return true;
      });
    });
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    cleanCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

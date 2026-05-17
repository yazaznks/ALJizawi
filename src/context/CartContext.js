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

      return [...prevCart, {
        ...product,
        cartKey: itemKey,
        selectedSize,
        quantity,
        // Store the effective price (from selected size or base price)
        price: selectedSize
          ? (product.sizes?.find(s => s.name === selectedSize)?.price || product.price)
          : product.price
      }];
    });
  };

  const removeFromCart = (cartKey) => {
    setCart(prevCart => prevCart.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.cartKey === cartKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item.discountPercent ? item.price * (100 - item.discountPercent) / 100 : item.price;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
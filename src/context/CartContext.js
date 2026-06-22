import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useOffers } from './OfferContext';
import { useProducts } from './ProductContext';

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
      let updated;

      if (existingItem) {
        updated = prevCart.map(item =>
          item.cartKey === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Normalize price once
        const discountPercent = product.discountPercent || 0;
        const originalPrice = product.price;
        const discountedPrice = discountPercent
          ? originalPrice * (100 - discountPercent) / 100
          : originalPrice;

        updated = [...prevCart, {
          ...product,
          cartKey: itemKey,
          selectedSize,
          quantity,
          price: discountedPrice,
          originalPrice,
          discountPercent
        }];
      }

      // Re-evaluate offers with the updated cart
      if (offers && products) {
        return applyOffersInternal(updated, offers, products);
      }
      return updated;
    });
  };

  const removeFromCart = (cartKey) => {
    setCart(prevCart => {
      const updated = prevCart.filter(item => item.cartKey !== cartKey);
      // Re-evaluate offers with the updated cart
      if (offers && products) {
        return applyOffersInternal(updated, offers, products);
      }
      return updated;
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
      // Re-evaluate offers with the updated cart
      if (offers && products) {
        return applyOffersInternal(updated, offers, products);
      }
      return updated;
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

  // Auto-apply offers: if cart contains enough of the buy product,
  // automatically add the get product at the offer price (if not already there)
  const { offers } = useOffers();
  const { products } = useProducts();

  // Pure function: apply offers to a given cart snapshot and return the new cart
  const applyOffersInternal = (currentCart, offersList, allProducts) => {
    if (!offersList || !allProducts) return currentCart;
    const activeOffers = offersList.filter(o => o.active);
    const updated = [...currentCart];

    activeOffers.forEach(offer => {
      const buyKey = offer.buyProductSize
        ? `${offer.buyProductId}_${offer.buyProductSize}`
        : offer.buyProductId;
      const getKey = offer.getProductSize
        ? `${offer.getProductId}_${offer.getProductSize}`
        : offer.getProductId;

      // Remove existing get item first (to handle updates/reprice)
      const existingIdx = updated.findIndex(item => item.cartKey === getKey);
      if (existingIdx !== -1) {
        updated.splice(existingIdx, 1);
      }

      // Find buy item in cart
      const buyItem = updated.find(item => item.cartKey === buyKey);
      if (!buyItem) return;

      // Check if quantity is enough
      const buyQty = buyItem.quantity || 0;
      const requiredQty = offer.buyQuantity || 1;
      if (buyQty < requiredQty) return;

      // Find the get product details
      const getProduct = allProducts.find(p => p._id === offer.getProductId);
      if (!getProduct) return;

      // Use offer price
      const offerPrice = parseFloat(offer.getPrice) || 0;
      const getSize = offer.getProductSize || null;

      updated.push({
        ...getProduct,
        cartKey: getKey,
        selectedSize: getSize,
        quantity: 1,
        price: offerPrice,
        originalPrice: getSize
          ? (getProduct.sizes && getProduct.sizes.find(s => s.name === getSize))
            ? parseFloat(getProduct.sizes.find(s => s.name === getSize).price)
            : getProduct.price
          : getProduct.price,
        discountPercent: 0,
        appliedOffer: true,
        offerId: offer.id
      });
    });

    return updated;
  };

  // Wrapper: reads current cart from state, applies offers, writes back
  const applyOffers = useCallback((offersList, allProducts) => {
    setCart(prevCart => applyOffersInternal(prevCart, offersList, allProducts));
  }, []);

  // Auto-apply offers whenever offers or products change
  useEffect(() => {
    if (offers && products && offers.length > 0 && products.length > 0) {
      setCart(prevCart => applyOffersInternal(prevCart, offers, products));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, products]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    applyOffers
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
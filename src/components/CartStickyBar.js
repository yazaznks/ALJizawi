import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const CartStickyBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartCount, getCartTotal } = useCart();
  const { formatCurrency, t } = useLanguage();

  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  // Don't show on empty cart, cart page, or admin pages
  if (cartTotal === 0) return null;
  if (location.pathname === '/cart') return null;
  if (location.pathname.startsWith('/admin')) return null;

  const handleClick = () => {
    navigate('/cart');
  };

  return (
    <div
      onClick={handleClick}
      className="cart-sticky-bar"
    >
      <span className="cart-sticky-bar-label">
        {t('cart')} ({cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'})
      </span>
      <div className="cart-sticky-bar-right">
        <span className="cart-sticky-bar-total">
          {formatCurrency(cartTotal)}
        </span>
        <span className="cart-sticky-bar-btn">
          إتمام الطلب ←
        </span>
      </div>
    </div>
  );
};

export default CartStickyBar;
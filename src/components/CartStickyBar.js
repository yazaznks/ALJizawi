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
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
        color: 'white',
        padding: '14px 20px',
        borderRadius: '16px',
        margin: '0 12px 12px 12px',
        width: 'calc(100% - 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
        cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        direction: 'rtl'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🛒</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '15px', fontWeight: '600' }}>
            {t('cart')} ({cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'})
          </span>
          <span style={{ fontSize: '13px', opacity: 0.95 }}>
            اضغط لإتمام الطلب
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '18px', fontWeight: '700' }}>
          {formatCurrency(cartTotal)}
        </span>
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          إتمام الطلب ←
        </span>
      </div>
    </div>
  );
};

export default CartStickyBar;
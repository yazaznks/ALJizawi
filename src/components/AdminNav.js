import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdminNav = () => {
  const { t } = useLanguage();
  return (
    <div className="admin-nav">
      <Link to="/admin">📊 {t('dashboard')}</Link>
      <Link to="/admin/products">📦 {t('products')}</Link>
      <Link to="/admin/orders">📋 {t('orders')}</Link>
      <Link to="/admin/ads">📢 {t('ads')}</Link>
      <Link to="/admin/offers">🎁 العروض</Link>
      <Link to="/admin/manual-sales">🛒 مبيعات يدوية</Link>

    </div>
  );
};

export default AdminNav;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { products } = useProducts();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Listen to orders collection
    const ordersQuery = query(collection(db, 'ecommerce_orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeOrders = onSnapshot(ordersQuery, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
    });

    // Calculate stats when products or orders change
    const calculateStats = () => {
      const totalProducts = products.filter(p => p.active).length;
      const lowStockProducts = products.filter(p => p.active && p.stock < 10).length;

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);

      const statsData = {
        statistics: {
          totalOrders,
          pendingOrders,
          totalRevenue,
          totalProducts,
          lowStockProducts,
          totalCustomers: new Set(orders.map(o => o.customerInfo.phone)).size
        },
        recentOrders: orders.slice(0, 5)
      };

      setStats(statsData);
      setLoading(false);
    };

    calculateStats();

    return () => unsubscribeOrders();
  }, [products, orders]);

  if (loading) return <div className="loading">{t('loadingDashboard')}</div>;

  return (
    <div className="container">
      <h1>{t('dashboard')}</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
        <Link to="/admin/ads">{t('ads')}</Link>
      </div>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.statistics.totalOrders}</div>
              <div className="stat-label">{t('totalOrders')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.statistics.pendingOrders}</div>
              <div className="stat-label">{t('pendingOrders')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">د.أ ${stats.statistics.totalRevenue.toFixed(2)}</div>
              <div className="stat-label">{t('totalRevenue')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.statistics.totalProducts}</div>
              <div className="stat-label">{t('totalProducts')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.statistics.lowStockProducts}</div>
              <div className="stat-label">{t('lowStockProducts')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.statistics.totalCustomers}</div>
              <div className="stat-label">{t('totalCustomers')}</div>
            </div>
          </div>

          <h2>{t('recentOrders')}</h2>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('orderNumber')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.customerInfo.name}</td>
                    <td>د.أ ${order.pricing.total.toFixed(2)}</td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

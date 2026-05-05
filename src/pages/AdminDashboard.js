import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">{t('loadingDashboard')}</div>;

  return (
    <div className="container">
      <h1>{t('dashboard')}</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
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
              <div className="stat-value">${stats.statistics.totalRevenue.toFixed(2)}</div>
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
                    <td>${order.pricing.total.toFixed(2)}</td>
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

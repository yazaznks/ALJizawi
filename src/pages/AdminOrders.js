import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdminOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        // Sort by newest first
        parsedOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    try {
      const updatedOrders = orders.map(order =>
        order.orderNumber === orderId
          ? { ...order, status: newStatus }
          : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      alert(t('orderStatusUpdated') || 'Order status updated successfully');
    } catch (error) {
      alert(t('errorUpdatingStatus') || 'Error updating order status');
    }
  };

  if (loading) return <div className="loading">{t('loadingOrders')}</div>;

  return (
    <div className="container">
      <h1>{t('manageOrders')}</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('orderNumber')}</th>
              <th>{t('customer')}</th>
              <th>{t('phone')}</th>
              <th>{t('total')}</th>
              <th>{t('status')}</th>
              <th>{t('date')}</th>
              <th>{t('actions')}</th>
              <th>{t('whatsapp')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.orderNumber}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customerInfo.name}</td>
                  <td>{order.customerInfo.phone}</td>
                  <td>${order.pricing.total.toFixed(2)}</td>
                  <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.timestamp).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.orderNumber, e.target.value)}
                      style={{padding: '5px'}}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        const message = `*Order ${order.orderNumber}*\n\nCustomer: ${order.customerInfo.name}\nPhone: ${order.customerInfo.phone}\n\nItems: ${order.items.map(item => `${item.name} x ${item.quantity}`).join(', ')}\n\nTotal: $${order.pricing.total.toFixed(2)}`;
                        const whatsappUrl = `https://wa.me/${order.customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="btn-success"
                      style={{padding: '5px 10px'}}
                    >
                      WhatsApp
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;

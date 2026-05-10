import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load orders from Firestore with real-time updates
  useEffect(() => {
    const q = query(collection(db, 'ecommerce_orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'ecommerce_orders', orderId), { status: newStatus });
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'confirmed': return '#3498db';
      case 'processing': return '#9b59b6';
      case 'shipped': return '#2ecc71';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
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
        <Link to="/admin/ads">{t('ads')}</Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('orderNumber')}</th>
              <th>{t('customer')}</th>
              <th>{t('phone')}</th>
              <th>المحافظة</th>
              <th>{t('total')}</th>
              <th>{t('status')}</th>
              <th>{t('date')}</th>
              <th>{t('actions')}</th>
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
                <tr key={order.id || order.orderNumber} style={{cursor: 'pointer'}} onClick={() => setSelectedOrder(order)}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customerInfo?.name}</td>
                  <td>{order.customerInfo?.phone}</td>
                  <td>{order.shippingAddress?.governorate}</td>
                  <td>JOD ${order.pricing?.total?.toFixed(2)}</td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      background: getStatusColor(order.status),
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{padding: '5px', borderRadius: '6px', border: '1px solid #ddd'}}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={() => setSelectedOrder(null)}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >✕</button>

            <h2 style={{marginBottom: '20px'}}>تفاصيل الطلب</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>رقم الطلب: <strong>{selectedOrder.orderNumber}</strong></p>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>معلومات العميل</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <tbody>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600', width: '120px'}}>الاسم:</td><td style={{padding: '6px 10px'}}>{selectedOrder.customerInfo?.name}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>رقم الهاتف:</td><td style={{padding: '6px 10px'}}>{selectedOrder.customerInfo?.phone}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>عنوان التوصيل</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <tbody>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600', width: '120px'}}>المحافظة:</td><td style={{padding: '6px 10px'}}>{selectedOrder.shippingAddress?.governorate}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>الشارع:</td><td style={{padding: '6px 10px'}}>{selectedOrder.shippingAddress?.street}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>رقم البناية:</td><td style={{padding: '6px 10px'}}>{selectedOrder.shippingAddress?.building}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>المنتجات</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: '#f8f9fa'}}>
                    <th style={{padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #ddd'}}>المنتج</th>
                    <th style={{padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #ddd'}}>الكمية</th>
                    <th style={{padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd'}}>السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td style={{padding: '8px 10px', borderBottom: '1px solid #eee'}}>{item.name}</td>
                      <td style={{padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #eee'}}>{item.quantity}</td>
                      <td style={{padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #eee'}}>JOD ${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>المجموع</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <tbody>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600', width: '120px'}}>المجموع الفرعي:</td><td style={{padding: '6px 10px'}}>JOD ${selectedOrder.pricing?.subtotal?.toFixed(2)}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>رسوم التوصيل:</td><td style={{padding: '6px 10px'}}>JOD ${selectedOrder.pricing?.shippingFee?.toFixed(2)}</td></tr>
                  <tr style={{fontWeight: 'bold', fontSize: '18px'}}><td style={{padding: '6px 10px', borderTop: '2px solid #333'}}>الإجمالي:</td><td style={{padding: '6px 10px', borderTop: '2px solid #333', color: '#27ae60'}}>JOD ${selectedOrder.pricing?.total?.toFixed(2)}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '10px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>حالة الطلب</h3>
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  handleStatusChange(selectedOrder.id, e.target.value);
                  setSelectedOrder({...selectedOrder, status: e.target.value});
                }}
                style={{padding: '8px 12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', width: '100%'}}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <p style={{color: '#999', fontSize: '12px', marginTop: '20px'}}>
              تاريخ الطلب: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
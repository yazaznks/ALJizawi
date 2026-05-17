import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
 const { t, formatCurrency } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    governorate: '',
    street: '',
    building: ''
  });

  // Jordan governorates
  const jordanGovernorates = [
    'عمان', 'الزرقاء', 'إربد', 'البلقاء', 'الكرك', 'المفرق',
    'مأدبا', 'جرش', 'عجلون', 'العقبة', 'معان', 'الطفيلة'
  ];

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const subtotal = getCartTotal();
      const total = subtotal;

      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.discountPercent ? item.price * (100 - item.discountPercent) / 100 : item.price
        })),
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone
        },
        shippingAddress: {
          governorate: shippingAddress.governorate,
          street: shippingAddress.street,
          building: shippingAddress.building
        },
        pricing: {
          subtotal,
          shippingFee: 0,
          tax: 0,
          total
        },
        orderNumber: `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Save order to Firestore
      await addDoc(collection(db, 'ecommerce_orders'), orderData);

      setSuccess('تم تقديم الطلب بنجاح!');
      clearCart();

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setError('خطأ في تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const total = subtotal;

  return (
    <div className="container">
      <h1>{t('checkout')}</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="checkout-grid" style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px'}}>
        <div>
          <form onSubmit={handleSubmit} className="card">
            <h2>معلومات العميل</h2>
            <div className="form-group">
              <label>الاسم *</label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                required
                placeholder="الاسم الكامل"
              />
            </div>
            
            <div className="form-group">
              <label>رقم الهاتف *</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                required
                placeholder="مثال: 0791234567"
              />
            </div>

            <h2>عنوان التوصيل</h2>
            
            <div className="form-group">
              <label>المحافظة *</label>
              <select
                value={shippingAddress.governorate}
                onChange={(e) => setShippingAddress({...shippingAddress, governorate: e.target.value})}
                required
              >
                <option value="">اختر المحافظة</option>
                {jordanGovernorates.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>الشارع *</label>
              <input
                type="text"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                required
                placeholder="اسم الشارع"
              />
            </div>

            <div className="form-group">
              <label>رقم البناية / معلم قريب*</label>
              <input
                type="text"
                value={shippingAddress.building}
                onChange={(e) => setShippingAddress({...shippingAddress, building: e.target.value})}
                required
                placeholder="رقم أو اسم البناية"
              />
            </div>

            <button type="submit" className="btn-success" style={{width: '100%', marginTop: '20px'}} disabled={loading}>
              {loading ? 'جاري تقديم الطلب...' : 'تأكيد الطلب'}
            </button>
          </form>
        </div>

        <div>
          <div className="checkout-summary">
            <h2>ملخص الطلب</h2>
            {cart.map(item => (
              <div key={item._id} style={{padding: '10px 0', borderBottom: '1px solid #ddd'}}>
                <div>{item.name} x {item.quantity}</div>
                <div>JOD ${((item.discountPercent ? item.price * (100 - item.discountPercent) / 100 : item.price) * item.quantity).toFixed(2)}</div>
              </div>
            ))}

            <div className="order-summary-item" style={{marginTop: '20px'}}>
              <span>المجموع:</span>
              <span>JOD ${subtotal.toFixed(2)}</span>
            </div>
            <div className="order-summary-item">
              <span className="order-total">الإجمالي:</span>
              <span className="order-total">JOD ${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
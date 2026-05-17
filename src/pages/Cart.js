import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
 const { t, formatCurrency } = useLanguage();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    governorate: '',
    street: '',
    building: ''
  });
  const [loading, setLoading] = useState(false);

  // Jordan governorates
  const jordanGovernorates = [
    'عمان',
    'الزرقاء',
    'إربد',
    'البلقاء',
    'الكرك',
    'المفرق',
    'مأدبا',
    'جرش',
    'عجلون',
    'العقبة',
    'معان',
    'الطفيلة'
  ];

  // Handle order placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      // Clear cart and reset form
      clearCart();
      setCustomerInfo({ name: '', phone: '' });
      setShippingAddress({ governorate: '', street: '', building: '' });

      alert('تم تقديم الطلب بنجاح!');

    } catch (error) {
      alert('خطأ في تقديم الطلب: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container">
        <h1>{t('shoppingCart')}</h1>
        <div className="card" style={{textAlign: 'center', padding: '40px'}}>
          <p>{t('emptyCart')}</p>
          <Link to="/products"><button className="btn-primary">{t('browseProducts')}</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{t('shoppingCart')}</h1>
      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px'}} className="cart-grid">
        <div>
          {cart.map(item => (
            <div key={item._id} className="cart-item">
              <div className="cart-item-image">
                {item.images && item.images[0] ? (
                  <img src={item.images[0].url} alt={item.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <div style={{width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{t('noImage')}</div>
                )}
              </div>
              <div className="cart-item-info">
                <h3>{item.name}</h3>
               <p className="product-price">
                  {item.discountPercent ? (
                    <>
                      <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px',marginLeft: '6px', fontSize: '14px'}}>{formatCurrency(item.price)}</span>
                      <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{formatCurrency(item.price * (100 - item.discountPercent) / 100)}</span>
                    </>
                  ) : (
                    formatCurrency(item.price)
                  )}
                </p>
              </div>
              <div className="cart-item-actions">
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="btn-secondary">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="btn-secondary">+</button>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="btn-danger">{t('remove')}</button>
              </div>
            </div>
          ))}
          
        </div>
        
        <div className="card" style={{height: 'fit-content'}}>
          <h2>{t('cartSummary')}</h2>
          <div style={{marginTop: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ddd'}}>
              <span>{t('subtotal')}:</span>
              <span>{formatCurrency(getCartTotal())}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
              <span style={{fontSize: '20px', fontWeight: 'bold'}}>{t('total')}:</span>
              <span style={{fontSize: '20px', fontWeight: 'bold', color: '#28a745'}}>{formatCurrency(getCartTotal())}</span>
       
            </div>
             <Link to="/products"><button className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>{t('continueShopping')}</button></Link>
          </div>

          {/* Customer Information Form */}
          <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee'}}>
            <h3 style={{marginBottom: '20px', color: '#333'}}>استكمال الطلب: </h3>
            <h3 style={{marginBottom: '20px', color: '#333'}}>معلومات العميل</h3>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label>الاسم الكامل *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  required
                  placeholder="Enter your full name"
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

              <h4 style={{marginTop: '20px', marginBottom: '15px'}}>عنوان التوصيل</h4>

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
                <label>رقم البناية أو معلم قريب*</label>
                <input
                  type="text"
                  value={shippingAddress.building}
                  onChange={(e) => setShippingAddress({...shippingAddress, building: e.target.value})}
                  required
                  placeholder="رقم البناية أو معلم قريب"
                />
              </div>

              <button type="submit" className="btn-success" style={{width: '100%', marginTop: '20px'}} disabled={loading}>
                {loading ? 'جاري تقديم الطلب...' : 'تأكيد الطلب'}
              </button>
            </form>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default Cart;

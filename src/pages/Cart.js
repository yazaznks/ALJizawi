import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const [showOrderForm, setShowOrderForm] = useState(false);
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
          price: item.discountPercent ? item.price * (100 - item.discountPercent) / 100 : item.price,
          image: item.images && item.images[0]
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

      // Clear cart and close form
      clearCart();
      setShowOrderForm(false);
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
                      <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '14px'}}>د.أ ${item.price.toFixed(2)}</span>
                      <span style={{color: '#e74c3c', fontWeight: 'bold'}}>د.أ ${(item.price * (100 - item.discountPercent) / 100).toFixed(2)}</span>
                    </>
                  ) : (
                    `د.أ ${item.price.toFixed(2)}`
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
              <span>د.أ ${getCartTotal().toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
              <span style={{fontSize: '20px', fontWeight: 'bold'}}>{t('total')}:</span>
              <span style={{fontSize: '20px', fontWeight: 'bold', color: '#28a745'}}>د.أ ${getCartTotal().toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setShowOrderForm(true)} className="btn-success" style={{width: '100%', marginTop: '20px'}}>Place Order</button>
          <Link to="/products"><button className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>{t('continueShopping')}</button></Link>

          {/* Order Form Modal */}
          {showOrderForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div className="card" style={{maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto'}}>
                <h2 style={{textAlign: 'center', marginBottom: '20px'}}>تقديم الطلب</h2>
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

                  <h3 style={{marginTop: '20px'}}>عنوان التوصيل</h3>

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
                    <label>رقم البناية *</label>
                    <input
                      type="text"
                      value={shippingAddress.building}
                      onChange={(e) => setShippingAddress({...shippingAddress, building: e.target.value})}
                      required
                      placeholder="رقم أو اسم البناية"
                    />
                  </div>

                  <div style={{marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px'}}>
                    <h4>Order Summary:</h4>
                    {cart.map(item => (
                      <div key={item._id} style={{display: 'flex', justifyContent: 'space-between', margin: '5px 0'}}>
                        <span>{item.name} x {item.quantity}</span>
                        <span>د.أ ${((item.discountPercent ? item.price * (100 - item.discountPercent) / 100 : item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <hr style={{margin: '10px 0'}} />
                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
                      <span>Total:</span>
                      <span>د.أ ${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                    <button type="submit" className="btn-success" style={{flex: 1}} disabled={loading}>
                      {loading ? 'جاري تقديم الطلب...' : 'تأكيد الطلب'}
                    </button>
                    <button type="button" onClick={() => setShowOrderForm(false)} className="btn-secondary">
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;

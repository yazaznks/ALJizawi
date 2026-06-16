import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  DELIVERY_OFFERS,
  GOVERNORATES_ORDERED,
  calculateDeliveryFee,
  getBestFreeDeliverySuggestion,
} from '../services/deliveryConfig';

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
  const [success, setSuccess] = useState('');

  const subtotal = getCartTotal();
  const deliveryInfo = calculateDeliveryFee(shippingAddress.governorate, subtotal);
  const deliveryFee = shippingAddress.governorate ? deliveryInfo.fee : null;
  const total = shippingAddress.governorate ? subtotal + deliveryInfo.fee : subtotal;

  // Determine the best suggestion for free delivery (when no governorate is selected)
  const suggestion = !shippingAddress.governorate ? getBestFreeDeliverySuggestion(subtotal) : null;
  // If a governorate with a freeThreshold is selected but not yet met, show progress
  const selectedGovConfig = shippingAddress.governorate ? DELIVERY_OFFERS[shippingAddress.governorate] : null;
  const needsMore = selectedGovConfig && selectedGovConfig.freeThreshold !== null && subtotal < selectedGovConfig.freeThreshold;
  const remainingForFree = needsMore ? selectedGovConfig.freeThreshold - subtotal : 0;
  const progressPct = selectedGovConfig && selectedGovConfig.freeThreshold !== null
    ? Math.min(100, (subtotal / selectedGovConfig.freeThreshold) * 100)
    : 0;

  // Handle order placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          selectedSize: item.selectedSize || null,
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
          shippingFee: deliveryInfo.fee,
          isFreeShipping: deliveryInfo.isFree,
          freeThreshold: deliveryInfo.freeThreshold,
          tax: 0,
          total
        },
        orderNumber: `#${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Save order to Firestore
      await addDoc(collection(db, 'ecommerce_orders'), orderData);

      // Clear cart and reset form
      clearCart();
      setCustomerInfo({ name: '', phone: '' });
      setShippingAddress({ governorate: '', street: '', building: '' });

      setSuccess('تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال ١-٧ ايام حسب الوصول الى منطقتك');

    } catch (error) {
      setSuccess('خطأ في تقديم الطلب: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show success/error modal BEFORE empty cart check, because clearCart runs on success
  if (success) {
    const isError = success.includes('خطأ');
    return (
      <div className="container">
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000}}>
          <div style={{background: 'white', borderRadius: '16px', padding: '40px 30px', maxWidth: '420px', width: '90%', textAlign: 'center'}}>
            <div style={{fontSize: '56px', marginBottom: '16px'}}>{isError ? '❌' : '✅'}</div>
            <h2 style={{margin: '0 0 16px', fontSize: '17px', lineHeight: '1.6', color: '#262626'}}>{success}</h2>
            <button
              onClick={() => { setSuccess(''); if (!isError) navigate('/products'); }}
              className="btn-success"
              style={{marginTop: '24px', padding: '12px 40px', fontSize: '16px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer'}}
            >
              موافق
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* ========== FREE SHIPPING BANNERS ========== */}

      {/* When a governorate with free threshold is selected but not met: show progress bar */}
      {shippingAddress.governorate && needsMore && !deliveryInfo.isFree && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #fff8e1, #ffecb3)',
          border: '1px solid #ffe082',
          padding: '16px 20px',
          marginBottom: '16px',
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
            <span style={{fontSize: '24px'}}>📦</span>
            <div>
              <strong style={{color: '#e65100', fontSize: '15px'}}>
                أضف {formatCurrency(remainingForFree)} إضافية للحصول على توصيل مجاني!
              </strong>
              <p style={{fontSize: '13px', color: '#795548', marginTop: '2px'}}>
                الطلب من {shippingAddress.governorate} يصبح التوصيل مجاناً عند شراء بقيمة {formatCurrency(selectedGovConfig.freeThreshold)} أو أكثر
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff9800, #f44336)',
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginTop: '4px'}}>
            <span>{formatCurrency(subtotal)}</span>
            <span>{formatCurrency(selectedGovConfig.freeThreshold)}</span>
          </div>
        </div>
      )}

      {/* When the selected governorate qualifies for free delivery: celebration */}
      {shippingAddress.governorate && deliveryInfo.isFree && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
          border: '1px solid #a5d6a7',
          padding: '16px 20px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <span style={{fontSize: '32px', display: 'block', marginBottom: '6px'}}>🎉</span>
          <strong style={{color: '#2e7d32', fontSize: '17px'}}>
            توصيل مجاني! طلبك مؤهل للتوصيل المجاني إلى {shippingAddress.governorate}
          </strong>
        </div>
      )}

      {/* When no governorate selected: suggest the best option */}
      {!shippingAddress.governorate && suggestion && suggestion.remaining > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
          border: '1px solid #90caf9',
          padding: '16px 20px',
          marginBottom: '16px',
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{fontSize: '24px'}}>🚚</span>
            <div>
              <strong style={{color: '#1565c0', fontSize: '15px'}}>
                وفر على التوصيل!
              </strong>
              <p style={{fontSize: '13px', color: '#455a64', marginTop: '2px'}}>
                أضف {formatCurrency(suggestion.remaining)} فقط إلى سلّتك واحصل على توصيل مجاني إلى {suggestion.governorate} (عند الطلب بقيمة {formatCurrency(suggestion.threshold)} أو أكثر)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* If subtotal already meets one of the lower thresholds: hint without governorate */}
      {!shippingAddress.governorate && subtotal > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
          border: '1px solid #f48fb1',
          padding: '14px 20px',
          marginBottom: '16px',
        }}>
          <p style={{fontSize: '14px', color: '#c62828', textAlign: 'center', fontWeight: '600'}}>
            💡 اختر محافظة من الأسفل لمعرفة رسوم التوصيل وإمكانية الحصول على توصيل مجاني
          </p>
        </div>
      )}

      {/* ========== CART CONTENT ========== */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px'}} className="cart-grid">
        <div>
          {cart.map(item => (
            <div key={item.cartKey || item._id} className="cart-item">
              <div className="cart-item-image">
                {item.images && item.images[0] ? (
                  <img src={item.images[0].url} alt={item.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <div style={{width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{t('noImage')}</div>
                )}
              </div>
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                {item.selectedSize && (
                  <p style={{color: '#666', fontSize: '14px', margin: '4px 0'}}>
                    <span style={{fontWeight: '600'}}>الحجم:</span> {item.selectedSize}
                  </p>
                )}
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
                  <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className="btn-secondary">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className="btn-secondary">+</button>
                </div>
                <button onClick={() => removeFromCart(item.cartKey)} className="btn-danger">{t('remove')}</button>
              </div>
            </div>
          ))}
          
        </div>
        
        <div className="card" style={{height: 'fit-content'}}>
          <h2>{t('cartSummary')}</h2>
          <div style={{marginTop: '20px'}}>
            {/* Subtotal */}
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ddd'}}>
              <span>{t('subtotal')}:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* Delivery Fee */}
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ddd'}}>
              <span>رسوم التوصيل:</span>
              <span>
                {deliveryFee === null ? (
                  <span style={{color: '#999', fontSize: '14px'}}>اختر المحافظة</span>
                ) : deliveryInfo.isFree ? (
                  <span style={{color: '#28a745', fontWeight: '600'}}>مجاناً 🎉</span>
                ) : (
                  <span style={{color: '#e67e22', fontWeight: '600'}}>{formatCurrency(deliveryFee)}</span>
                )}
              </span>
            </div>

            {/* Total */}
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
              <span style={{fontSize: '20px', fontWeight: 'bold'}}>{t('total')}:</span>
              <span style={{fontSize: '20px', fontWeight: 'bold', color: '#28a745'}}>
                {formatCurrency(total)}
              </span>
            </div>

            <Link to="/products"><button className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>{t('continueShopping')}</button></Link>
          </div>

          {/* Customer Information Form */}
          <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee'}}>
            <h3 style={{marginBottom: '20px', color: '#333'}}>معلومات العميل</h3>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label>الاسم الكامل *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  required
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div className="form-group">
                <label>رقم الهاتف *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  required
                  placeholder="مثال: ******0798"
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
                  {GOVERNORATES_ORDERED.map(gov => {
                    const cfg = DELIVERY_OFFERS[gov];
                    const feeLabel = cfg.freeThreshold !== null && subtotal >= cfg.freeThreshold
                      ? ' (توصيل مجاني 🎉)'
                      : ` (${cfg.baseFee} د.أ)`;
                    return (
                      <option key={gov} value={gov}>{gov}{feeLabel}</option>
                    );
                  })}
                </select>

                {/* Delivery fee hint below the select */}
                {shippingAddress.governorate && (
                  <p style={{
                    marginTop: '6px',
                    fontSize: '13px',
                    color: deliveryInfo.isFree ? '#28a745' : '#e67e22',
                    fontWeight: '600'
                  }}>
                    {deliveryInfo.isFree
                      ? `✅ التوصيل إلى ${shippingAddress.governorate} مجاناً!`
                      : remainingForFree > 0
                        ? `🚚 رسوم التوصيل ${formatCurrency(deliveryFee)} — أضف ${formatCurrency(remainingForFree)} لتحصل على توصيل مجاني`
                        : `🚚 رسوم التوصيل إلى ${shippingAddress.governorate}: ${formatCurrency(deliveryFee)}`}
                  </p>
                )}
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
                <label>رقم البناية / مَعلَم قريب*</label>
                <input
                  type="text"
                  value={shippingAddress.building}
                  onChange={(e) => setShippingAddress({...shippingAddress, building: e.target.value})}
                  required
                  placeholder="رقم البناية أو  مَعلَم قريب"
                />
              </div>

              {/* Order total summary before submit */}
              {shippingAddress.governorate && (
                <div style={{
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginTop: '16px',
                  fontSize: '14px'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                    <span>رسوم التوصيل:</span>
                    <span style={{color: deliveryInfo.isFree ? '#28a745' : '#e67e22', fontWeight: '600'}}>
                      {deliveryInfo.isFree ? 'مجاناً 🎉' : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #dee2e6', paddingTop: '8px', marginTop: '4px'}}>
                    <span>الإجمالي:</span>
                    <span style={{color: '#28a745'}}>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

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
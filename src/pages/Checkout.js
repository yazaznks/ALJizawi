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
  const [lastOrder, setLastOrder] = useState(null); // Store last submitted order for WhatsApp
  
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
          selectedSize: item.selectedSize || null,
          quantity: item.quantity,
          price: item.price
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

      // Store order details for WhatsApp sharing
      setLastOrder(orderData);
      setSuccess('تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال ١-٧ ايام حسب الوصول الى منطقتك');
      clearCart();
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

      {success && (
        <div className="modal-overlay" onClick={() => { setSuccess(''); navigate('/products'); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{textAlign: 'center', padding: '40px 30px'}}>
              <div style={{fontSize: '56px', marginBottom: '16px'}}>✅</div>
              <h2 style={{margin: '0 0 16px', fontSize: '18px', lineHeight: '1.6', color: '#262626'}}>{success}</h2>
              {lastOrder && (
                <button
                  onClick={() => {
                    // Build WhatsApp message with order details
                    const itemsList = lastOrder.items.map(item => {
                      const amount = parseFloat(item.price * item.quantity);
                      const formattedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1);
                      const sizeText = item.selectedSize ? ` (${item.selectedSize})` : '';
                      return `* ${item.name}${sizeText}: العدد:${item.quantity} - السعر ${formattedAmount} د.أ`;
                    }).join('\n');
                    const totalAmount = parseFloat(lastOrder.pricing?.total || 0);
                    const formattedTotal = totalAmount % 1 === 0 ? totalAmount.toFixed(0) : totalAmount.toFixed(1);
                    const message =
                      `*طلب جديد*\n` +
                      `رقم الطلب: ${lastOrder.orderNumber}\n` +
                      `الاسم: ${lastOrder.customerInfo?.name}\n` +
                      `الهاتف: ${lastOrder.customerInfo?.phone}\n` +
                      `العنوان: ${lastOrder.shippingAddress?.governorate || ''}, ${lastOrder.shippingAddress?.street || ''}, ${lastOrder.shippingAddress?.building || ''}\n` +
                      `المنتجات:\n${itemsList}\n` +
                      `الإجمالي: ${formattedTotal} د.أ`;
                    const whatsappUrl = `https://wa.me/962771530015?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: '2px solid #25D366',
                    background: '#25D366',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  📱 إرسال الطلب عبر واتساب
                </button>
              )}
              <br />
              <button
                onClick={() => { setSuccess(''); navigate('/products'); }}
                className="btn-success"
                style={{marginTop: '16px', padding: '12px 40px', fontSize: '16px', fontWeight: '600', borderRadius: '8px'}}
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}

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
                placeholder="  رقم البناية او معلم قريب"
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
            <div>{item.name}{item.selectedSize ? ` (${item.selectedSize})` : ''} x {item.quantity}</div>
                <div>{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}

            <div className="order-summary-item" style={{marginTop: '20px'}}>
              <span>المجموع:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="order-summary-item">
              <span className="order-total">الإجمالي:</span>
              <span className="order-total">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
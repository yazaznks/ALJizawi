import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    whatsappNumber: '' // For WhatsApp notifications
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    city: '',
    exactLocation: '', // Optional field for detailed location
    coordinates: { lat: null, lng: null }
  });

  // Jordan cities dropdown options
  const jordanCities = {
    'الزرقاء': 'Zarqa',
    'عمان': 'Amman',
    'إربد': 'Irbid',
    'السلط': 'Salt',
    'المفرق': 'Mafraq',
    'الكرك': 'Karak',
    'مأدبا': 'Madaba',
    'جرش': 'Jerash',
    'عجلون': 'Ajloun',
    'العقبة': 'Aqaba',
    'معان': 'Maan',
    'الطفيلة': 'Tafilah'
  };
  
  const [shippingDetails, setShippingDetails] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);





  // Generate WhatsApp message with order details
  const generateWhatsAppMessage = (orderData, orderNumber) => {
    const items = orderData.items.map(item =>
      `• ${item.name} x ${item.quantity} = $${((item.discountPrice || item.price) * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = `*طلب جديد - رقم الطلب: ${orderNumber}*\n\n` +
      `*معلومات العميل:*\n` +
      `الاسم: ${orderData.customerInfo.name}\n` +
      `الهاتف: ${orderData.customerInfo.phone}\n` +
      `واتساب: ${orderData.customerInfo.whatsappNumber}\n\n` +
      `*عنوان التوصيل:*\n` +
      `المدينة: ${orderData.shippingAddress.city}\n` +
      `الموقع المحدد: ${orderData.shippingAddress.exactLocation || 'غير محدد'}\n\n` +
      `*تفاصيل الطلب:*\n${items}\n\n` +
      `*الأسعار:*\n` +
      `المجموع الفرعي: $${orderData.pricing.subtotal.toFixed(2)}\n` +
      `رسوم التوصيل: $${orderData.pricing.shippingFee.toFixed(2)}\n` +
      `الإجمالي: $${orderData.pricing.total.toFixed(2)}\n\n` +
      `*طريقة الدفع:* الدفع عند التسليم\n` +
      `*المسافة المقدرة:* ${orderData.shippingDetails.distance} كم\n` +
      `*وقت التوصيل المقدر:* ${orderData.shippingDetails.estimatedDelivery}`;

    return message;
  };

  // Send WhatsApp message
  const sendWhatsAppMessage = (phoneNumber, message) => {
    // Remove any non-numeric characters and ensure it starts with country code
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('962') ? cleanNumber :
                           cleanNumber.startsWith('0') ? '962' + cleanNumber.substring(1) :
                           '962' + cleanNumber;

    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!shippingAddress.coordinates.lat || !shippingAddress.coordinates.lng) {
      setError('Please provide your location for shipping calculation');
      setLoading(false);
      return;
    }

    try {
      const subtotal = getCartTotal();
      const shippingFee = shippingDetails ? shippingDetails.shippingFee : 5.00;
      const total = subtotal + shippingFee;

      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.discountPrice || item.price,
          image: item.images && item.images[0]
        })),
        customerInfo,
        shippingAddress,
        pricing: {
          subtotal,
          shippingFee,
          tax: 0,
          total
        },
        shippingDetails: {
          distance: shippingDetails?.distance || 0,
          estimatedDelivery: shippingDetails?.estimatedDelivery || '2-3 days'
        },
        paymentMethod: 'cash_on_delivery'
      };

      // Save order to Firebase
      const orderNumber = `ORD-${Date.now()}`;
      const orderWithNumber = {
        ...orderData,
        orderNumber,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'ecommerce_orders'), orderWithNumber);

      // Generate and send WhatsApp message
      const whatsappMessage = generateWhatsAppMessage(orderData, orderNumber);
      sendWhatsAppMessage(customerInfo.whatsappNumber, whatsappMessage);

      setSuccess(`Order placed successfully! Order Number: ${orderNumber}`);
      clearCart();

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setError('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const shippingFee = shippingDetails ? shippingDetails.shippingFee : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="container">
      <h1>{t('checkout')}</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="checkout-grid" style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px'}}>
        <div>
          <form onSubmit={handleSubmit} className="card">
            <h2>{t('customerInformation')}</h2>
            <div className="form-group">
              <label>{t('fullName')} *</label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('phone')} *</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>WhatsApp Number *</label>
              <input
                type="tel"
                value={customerInfo.whatsappNumber}
                onChange={(e) => setCustomerInfo({...customerInfo, whatsappNumber: e.target.value})}
                placeholder="e.g., +962123456789"
                required
              />
              <small style={{color: '#666', fontSize: '12px'}}>Order confirmation will be sent to this WhatsApp number</small>
            </div>

            <h2>{t('shippingInformation')}</h2>
            
            <div className="form-group">
              <label>{t('city')} *</label>
              <select
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                required
              >
                <option value="">Select your city</option>
                {Object.keys(jordanCities).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('exactLocation')} (Optional)</label>
              <input
                type="text"
                value={shippingAddress.exactLocation}
                onChange={(e) => setShippingAddress({...shippingAddress, exactLocation: e.target.value})}
                placeholder="e.g., Building name, street number, landmark"
              />
            </div>
            




            {shippingDetails && (
              <div className="shipping-info">
                <h3>{t('shippingInformationTitle')}</h3>
                <p><strong>{t('distance')}:</strong> {shippingDetails.distance} {t('km')}</p>
                <p><strong>{t('shippingFee')}:</strong> ${shippingDetails.shippingFee.toFixed(2)}</p>
                <p><strong>{t('estimatedDelivery')}:</strong> {shippingDetails.estimatedDelivery}</p>
              </div>
            )}

            <button type="submit" className="btn-success" style={{width: '100%', marginTop: '20px'}} disabled={loading || !shippingDetails}>
              {loading ? t('placingOrder') : t('cashOnDelivery')}
            </button>
          </form>
        </div>

        <div>
          <div className="checkout-summary">
            <h2>{t('orderSummary')}</h2>
            {cart.map(item => (
              <div key={item._id} style={{padding: '10px 0', borderBottom: '1px solid #ddd'}}>
                <div>{item.name} x {item.quantity}</div>
                <div>${((item.discountPrice || item.price) * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            
            <div className="order-summary-item" style={{marginTop: '20px'}}>
              <span>{t('subtotal')}:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="order-summary-item">
              <span>{t('shippingFee')}:</span>
              <span>${shippingFee.toFixed(2)}</span>
            </div>
            <div className="order-summary-item">
              <span className="order-total">{t('total')}:</span>
              <span className="order-total">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

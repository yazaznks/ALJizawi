import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  // Generate order number
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}${random}`;
  };

  // Generate WhatsApp message with order details
  const generateWhatsAppMessage = (orderData, orderNumber) => {
    const items = orderData.items.map(item =>
      `• ${item.name} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = `*طلب جديد - رقم الطلب: ${orderNumber}*\n\n` +
      `*معلومات العميل:*\n` +
      `الاسم: ${orderData.customerInfo.name}\n` +
      `الهاتف: ${orderData.customerInfo.phone}\n\n` +
      `*تفاصيل الطلب:*\n${items}\n\n` +
      `*الأسعار:*\n` +
      `المجموع الفرعي: $${orderData.pricing.subtotal.toFixed(2)}\n` +
      `الإجمالي: $${orderData.pricing.total.toFixed(2)}\n\n` +
      `*طريقة الدفع:* الدفع عند التسليم\n` +
      `*ملاحظة:* سيتم التواصل لتحديد عنوان التوصيل`;

    return message;
  };

  // Send WhatsApp message to business number
  const sendWhatsAppMessage = (message) => {
    // Fixed business WhatsApp number
    const businessNumber = '962782274569'; // Your business number

    const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Handle order placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subtotal = getCartTotal();
      const total = subtotal; // No shipping fee for simplified checkout

      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.images && item.images[0]
        })),
        customerInfo,
        pricing: {
          subtotal,
          shippingFee: 0,
          tax: 0,
          total
        },
        orderNumber: generateOrderNumber(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Save order to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('orders', JSON.stringify(existingOrders));

      // Generate and send WhatsApp message
      const whatsappMessage = generateWhatsAppMessage(orderData, orderData.orderNumber);
      sendWhatsAppMessage(whatsappMessage);

      // Clear cart and close form
      clearCart();
      setShowOrderForm(false);
      setCustomerInfo({ name: '', phone: '' });

      alert(`Order placed successfully! Order Number: ${orderData.orderNumber}\nWhatsApp message has been opened.`);

    } catch (error) {
      alert('Error placing order: ' + error.message);
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
                <p className="product-price">${item.price.toFixed(2)}</p>
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
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
              <span style={{fontSize: '20px', fontWeight: 'bold'}}>{t('total')}:</span>
              <span style={{fontSize: '20px', fontWeight: 'bold', color: '#28a745'}}>${getCartTotal().toFixed(2)}</span>
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
                <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Place Your Order</h2>
                <form onSubmit={handlePlaceOrder}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      required
                      placeholder="e.g., +962123456789"
                    />
                  </div>



                  <div style={{marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px'}}>
                    <h4>Order Summary:</h4>
                    {cart.map(item => (
                      <div key={item._id} style={{display: 'flex', justifyContent: 'space-between', margin: '5px 0'}}>
                        <span>{item.name} x {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <hr style={{margin: '10px 0'}} />
                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
                      <span>Total:</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                    <button type="submit" className="btn-success" style={{flex: 1}} disabled={loading}>
                      {loading ? 'Placing Order...' : 'Confirm Order & Open WhatsApp'}
                    </button>
                    <button type="button" onClick={() => setShowOrderForm(false)} className="btn-secondary">
                      Cancel
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

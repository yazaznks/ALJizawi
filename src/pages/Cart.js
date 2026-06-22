import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffers } from '../context/OfferContext';
import { useProducts } from '../context/ProductContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  DELIVERY_OFFERS,
  GOVERNORATES_ORDERED,
  calculateDeliveryFee,
  getBestFreeDeliverySuggestion,
} from '../services/deliveryConfig';

const OfferSection = ({ item, offer, products, cart, addToCart, removeFromCart, updateQuantity, formatCurrency }) => {
  const itemQty = item.quantity || 0;
  const requiredQty = offer ? (offer.buyQuantity || 1) : 0;
  const offerMet = offer && itemQty >= requiredQty;
  const missingQty = offer ? Math.max(0, requiredQty - itemQty) : 0;
  const getProduct = offer ? products.find(p => p._id === offer.getProductId) : null;

  const getKey = offer
    ? (offer.getProductSize ? `${offer.getProductId}_${offer.getProductSize}` : offer.getProductId)
    : null;

  const existingGet = getKey ? cart.find(c => c.cartKey === getKey) : null;
  const getQty = existingGet ? existingGet.quantity : 0;

  const handleMinus = () => {
    if (!getKey) return;
    if (existingGet) {
      if (existingGet.quantity <= 1) {
        removeFromCart(getKey);
      } else {
        updateQuantity(getKey, existingGet.quantity - 1);
      }
    }
  };

  const getLimit = offer?.getLimit || 0;

  const handlePlus = () => {
    if (!getKey) return;
    if (existingGet) {
      // Respect the limit
      if (getLimit > 0 && existingGet.quantity >= getLimit) return;
      updateQuantity(getKey, existingGet.quantity + 1);
    } else if (getProduct) {
      addToCart({
        ...getProduct,
        _id: offer.getProductId,
        price: parseFloat(offer.getPrice) || 0,
        discountPercent: 0,
        offerGetItem: true,
        linkedBuyKey: item.cartKey,
        offerBuyQuantity: requiredQty
      }, 1, offer.getProductSize || null);
    }
  };

  if (!offer) return null;

  return (
    <div style={{
      width: '100%',
      marginTop: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      background: offerMet ? '#f0fdf4' : '#fff7ed',
      border: `1px solid ${offerMet ? '#86efac' : '#fed7aa'}`,
      direction: 'rtl'
    }}>
      {!offerMet ? (
        <div style={{fontSize: '14px', fontWeight: '600', color: '#9a3412', textAlign: 'center'}}>
          🎁 أضف {missingQty} من "{item.name}" واحصل على "{getProduct?.name || ''}" بسعر {formatCurrency(offer.getPrice)}
        </div>
      ) : (
        <>
          <div style={{fontSize: '14px', fontWeight: '700', color: '#166534', marginBottom: '10px'}}>
            🎉 تم تفعيل العرض! اشتري {requiredQty} واحصل على:
            {getLimit > 0 && <span style={{fontWeight: '500', color: '#f97316', marginRight: '8px', fontSize: '13px'}}>(الحد الأقصى: {getLimit})</span>}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '10px',
              background: '#f5f5f5', overflow: 'hidden', flexShrink: 0
            }}>
              {getProduct?.images?.[0] ? (
                <img src={getProduct.images[0].url} alt={getProduct.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px'}}>🎁</div>
              )}
            </div>
            <div style={{flex: 1}}>
              <div style={{fontWeight: '700', fontSize: '14px', color: '#111'}}>
                {getProduct?.name} {offer.getProductSize && <span style={{color: '#6366f1'}}>({offer.getProductSize})</span>}
              </div>
              <div style={{fontWeight: '700', fontSize: '16px', color: '#ef4444'}}>
                {formatCurrency(offer.getPrice)}
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <button onClick={handleMinus} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid #ef4444', background: '#fef2f2',
                color: '#ef4444', fontSize: '18px', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: 0, lineHeight: 1
              }}>−</button>
              <span style={{minWidth: '20px', textAlign: 'center', fontWeight: '700', fontSize: '15px'}}>{getQty}</span>
              <button onClick={handlePlus} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid #22c55e', background: '#f0fdf4',
                color: '#22c55e', fontSize: '18px', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: 0, lineHeight: 1
              }}>+</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart, addToCart } = useCart();
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

  const suggestion = !shippingAddress.governorate ? getBestFreeDeliverySuggestion(subtotal) : null;
  const selectedGovConfig = shippingAddress.governorate ? DELIVERY_OFFERS[shippingAddress.governorate] : null;
  const needsMore = selectedGovConfig && selectedGovConfig.freeThreshold !== null && subtotal < selectedGovConfig.freeThreshold;
  const remainingForFree = needsMore ? selectedGovConfig.freeThreshold - subtotal : 0;
  const progressPct = selectedGovConfig && selectedGovConfig.freeThreshold !== null
    ? Math.min(100, (subtotal / selectedGovConfig.freeThreshold) * 100)
    : 0;

  // Load offers and products for inline offer display
  const { offers } = useOffers();
  const { products: allProducts } = useProducts();

  // For each cart item, find an applicable offer where this item is the buy product
  const getOfferForItem = (item) => {
    return offers.find(o => {
      if (!o.active) return false;
      const buyMatch = item.cartKey === o.buyProductId || item.cartKey === `${o.buyProductId}_${o.buyProductSize}`;
      return buyMatch;
    });
  };

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

      await addDoc(collection(db, 'ecommerce_orders'), orderData);

      clearCart();
      setCustomerInfo({ name: '', phone: '' });
      setShippingAddress({ governorate: '', street: '', building: '' });

      const totalItems = getCartCount();
      let deliveryMessage;
      if (totalItems >= 1 && totalItems <= 5) {
        deliveryMessage = 'تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال ١-١٠ ايام حسب الوصول الى منطقتك';
      } else if (totalItems >= 6 && totalItems <= 10) {
        deliveryMessage = 'تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال ١-٧ ايام حسب الوصول الى منطقتك';
      } else if (totalItems >= 11 && totalItems <= 20) {
        deliveryMessage = 'تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال ١-٣ ايام حسب الوصول الى منطقتك';
      } else if (totalItems >= 21 && totalItems <= 50) {
        deliveryMessage = 'تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال يومين من تقديم الطلب';
      } else {
        deliveryMessage = 'تم تقديم الطلب بنجاح، سيتواصل معك مندوب التوصيل خلال يومين من تقديم الطلب';
      }

      setSuccess(deliveryMessage);

    } catch (error) {
      setSuccess('خطأ في تقديم الطلب: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
                أضف {formatCurrency(suggestion.remaining)} فقط إلى سلّتك واحصل على توصيل مجاني إلى {suggestion.governorate}
              </p>
            </div>
          </div>
        </div>
      )}

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

      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px'}} className="cart-grid">
        <div>
          {/* Filter out offer get-items — they render inside their parent's OfferSection instead */}
          {cart.filter(item => !item.offerGetItem).map(item => {
            const offer = getOfferForItem(item);
            return (
              <div key={item.cartKey || item._id} className="cart-item" style={{flexDirection: 'column'}}>
                <div style={{display: 'flex', gap: '24px', width: '100%', alignItems: 'center'}}>
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
                          <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px', marginLeft: '6px', fontSize: '14px'}}>{formatCurrency(item.originalPrice || item.price)}</span>
                          <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{formatCurrency(item.price)}</span>
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
                <OfferSection
                  item={item}
                  offer={offer}
                  products={allProducts}
                  cart={cart}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  updateQuantity={updateQuantity}
                  formatCurrency={formatCurrency}
                />
              </div>
            );
          })}
        </div>

        <div className="card" style={{height: 'fit-content'}}>
          <h2>{t('cartSummary')}</h2>
          <div style={{marginTop: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ddd'}}>
              <span>{t('subtotal')}:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

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

            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
              <span style={{fontSize: '20px', fontWeight: 'bold'}}>{t('total')}:</span>
              <span style={{fontSize: '20px', fontWeight: 'bold', color: '#28a745'}}>
                {formatCurrency(total)}
              </span>
            </div>

            <Link to="/products"><button className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>{t('continueShopping')}</button></Link>
          </div>

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
                <label>المنطقة *</label>
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                  required
                  placeholder="المنطقة"
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
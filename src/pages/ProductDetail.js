import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useOffers } from '../context/OfferContext';
import { useLanguage } from '../context/LanguageContext';
import MediaGallery from '../components/MediaGallery';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity: updateCartQty, cart } = useCart();
  const { getProduct } = useProducts();
  const { offers } = useOffers();
  const { t, formatCurrency } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  // const [showConfirm, setShowConfirm] = useState(false); // disabled — stepper handles add feedback
  const [offerActivated, setOfferActivated] = useState(false);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = () => {
    const foundProduct = getProduct(id);
    setProduct(foundProduct);
    if (foundProduct) {
      if (foundProduct.sizes && foundProduct.sizes.length > 0) {
        setSelectedSize(foundProduct.sizes[0]);
      }
      setLoading(false);
    }
  };

  // Find an active offer where this product is the "buy" product
  const buyOffer = product ? offers.find(o => {
    if (!o.active) return false;
    const buyId = selectedSize ? `${product._id}_${selectedSize.name}` : product._id;
    return buyId === o.buyProductId || buyId === `${o.buyProductId}_${o.buyProductSize}`;
  }) : null;

  // Find the "get" product for that offer
  const getProductForOffer = buyOffer ? (() => {
    const prod = getProduct(buyOffer.getProductId);
    if (!prod) return null;
    const price = parseFloat(buyOffer.getPrice);
    const size = buyOffer.getProductSize || null;
    const image = prod.images && prod.images[0] ? prod.images[0].url : null;
    return {
      ...prod,
      offerPrice: price,
      offerSize: size,
      offerImage: image
    };
  })() : null;

  // Count how many of this product variant are in the cart (for offer progress)
  const cartQtyForThisProduct = cart.filter(item => {
    const buyKey = selectedSize ? `${product?._id}_${selectedSize.name}` : product?._id;
    return item.cartKey === buyKey || item.product === product?._id;
  }).reduce((sum, item) => sum + item.quantity, 0);

  // Auto-add free offer get-product once buy threshold is reached (useEffect runs after cart commits)
  React.useEffect(() => {
    if (!buyOffer || parseFloat(buyOffer.getPrice) !== 0 || offerActivated) return;
    if (!product) return;

    const buyKey = selectedSize ? `${product._id}_${selectedSize.name}` : product._id;
    const buyQty = cart
      .filter(i => i.cartKey === buyKey || i.product === product._id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (buyQty >= buyOffer.buyQuantity) {
      const getItemKey = buyOffer.getProductSize
        ? `${buyOffer.getProductId}_${buyOffer.getProductSize}`
        : buyOffer.getProductId;

      if (cart.some(item => item.cartKey === getItemKey)) return;

      const getProd = getProduct(buyOffer.getProductId);
      if (getProd) {
        addToCart({
          ...getProd,
          _id: buyOffer.getProductId,
          price: 0,
          discountPercent: 0,
          offerGetItem: true,
          linkedBuyKey: buyKey,
          offerBuyQuantity: buyOffer.buyQuantity
        }, 1, buyOffer.getProductSize || null);
        setOfferActivated(true);
      }
    }
  }, [cart, buyOffer, offerActivated, product, selectedSize, getProduct, addToCart]);

  // Actually add one of this product to cart (called by stepper +)
  const doAddToCart = () => {
    const basePrice = selectedSize ? parseFloat(selectedSize.price) : product.price;
    const item = {
      ...product,
      selectedSize: selectedSize ? selectedSize.name : null,
      price: basePrice,
      discountPercent: product.discountPercent || 0
    };
    addToCart(item, 1, selectedSize ? selectedSize.name : null);
  };

  // Big button at bottom — just go back to products (no add)
  const goToProducts = () => {
    navigate('/products');
  };

  // Add the offer product directly (for manual offer claim button)
  const handleAddOfferToCart = () => {
    if (!buyOffer || !getProductForOffer) return;
    
    const getProd = getProduct(buyOffer.getProductId);
    const price = parseFloat(buyOffer.getPrice);
    
    if (price === 0) {
      // Free offer
      addToCart({
        ...getProd,
        _id: buyOffer.getProductId,
        price: 0,
        discountPercent: 0,
        offerGetItem: true,
        linkedBuyKey: selectedSize ? `${product._id}_${selectedSize.name}` : product._id,
        offerBuyQuantity: buyOffer.buyQuantity
      }, 1, buyOffer.getProductSize || null);
      setOfferActivated(true);
      // setShowConfirm(true); // disabled
    } else {
      // Paid offer
      addToCart({
        ...getProd,
        _id: buyOffer.getProductId,
        price: price,
        discountPercent: 0,
        offerGetItem: true,
        linkedBuyKey: selectedSize ? `${product._id}_${selectedSize.name}` : product._id,
        offerBuyQuantity: buyOffer.buyQuantity
      }, 1, buyOffer.getProductSize || null);
      // setShowConfirm(true); // disabled
    }
  };

  // Keep trying to load product if it's not found yet
  useEffect(() => {
    if (!product && !loading) {
      const interval = setInterval(() => {
        const foundProduct = getProduct(id);
        if (foundProduct) {
          setProduct(foundProduct);
          if (foundProduct.sizes && foundProduct.sizes.length > 0) {
            setSelectedSize(foundProduct.sizes[0]);
          }
          setLoading(false);
          clearInterval(interval);
        }
      }, 300);
      setTimeout(() => {
        clearInterval(interval);
        setLoading(false);
      }, 8000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, loading, id]);

  // Apply discount to a price if the product has a discountPercent
  const applyDiscount = (price) => {
    if (!product || !product.discountPercent) return price;
    return price * (100 - product.discountPercent) / 100;
  };

  // Format price for display – show "مجاناً" instead of 0
  const fmt = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    if (n === 0) return 'مجاناً';
    const fixed = n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
    return `${fixed} د.أ`;
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    if (product.sizes && product.sizes.length > 0 && selectedSize) {
      const sizePrice = parseFloat(selectedSize.price);
      return applyDiscount(sizePrice);
    }
    return product.discountPercent
      ? product.price * (100 - product.discountPercent) / 100
      : product.price;
  };

  const handleContinueShopping = () => {
    // no-op — modal is disabled
  };

  if (loading && !product) return <div className="loading">{t('loadingProduct')}</div>;
  if (!product) return <div className="container" style={{textAlign: 'center', padding: '40px'}}><p>{t('productNotFound')}</p></div>;

  const currentPrice = getCurrentPrice();
  const hasDiscount = product.discountPercent > 0;

  return (
    <div className="container">
      {loading && <div className="loading" style={{padding: '10px'}}>{t('loadingProduct')}</div>}
      <div className="card" style={{maxWidth: '600px', margin: '0 auto', overflow: 'hidden'}}>
        {/* Media Gallery with fullscreen viewer */}
        {product.images && product.images.length > 0 ? (
          <MediaGallery media={product.images} productName={product.name} />
        ) : (
          <div className="product-image" style={{width: '100%', height: '300px', borderRadius: '8px 8px 0 0'}}>
            <span>{t('noImage')}</span>
          </div>
        )}
        
        <div style={{padding: '20px'}}>
          <h1>{product.name}</h1>
          
          {/* Price Display */}
          <div className="product-price" style={{fontSize: '28px', margin: '15px 0'}}>
            {product.sizes && product.sizes.length > 0 ? (
              selectedSize ? (
                <>
                  {hasDiscount && (
                    <span style={{textDecoration: 'line-through', color: '#999', fontSize: '20px', marginRight: '10px'}}>
                      {formatCurrency(parseFloat(selectedSize.price))}
                    </span>
                  )}
                  <span style={{color: hasDiscount ? '#e74c3c' : 'inherit', fontWeight: hasDiscount ? 'bold' : 'normal'}}>
                    {formatCurrency(currentPrice)}
                  </span>
                </>
              ) : (
                <span>
                  {formatCurrency(applyDiscount(Math.min(...product.sizes.map(s => parseFloat(s.price)))))} - {formatCurrency(applyDiscount(Math.max(...product.sizes.map(s => parseFloat(s.price)))))}
                </span>
              )
            ) : hasDiscount ? (
              <>
                <span style={{textDecoration: 'line-through', color: '#999', fontSize: '20px', marginRight: '10px'}}>{formatCurrency(product.price)}</span>
                <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{formatCurrency(currentPrice)}</span>
              </>
            ) : (
              formatCurrency(product.price)
            )}
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div style={{margin: '15px 0'}}>
              <label style={{fontWeight: '600', display: 'block', marginBottom: '8px'}}>اختر الحجم:</label>
              <div className="size-selector" style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {product.sizes.map((size, index) => {
                  const isSelected = selectedSize && selectedSize.name === size.name;
                  const originalPrice = parseFloat(size.price);
                  const discountedPrice = applyDiscount(originalPrice);
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #3498db' : '1px solid #ddd',
                        background: isSelected ? '#ebf5fb' : 'white',
                        color: isSelected ? '#3498db' : '#333',
                        cursor: 'pointer',
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {size.name}
                      <span style={{display: 'block', fontSize: '12px', color: isSelected ? '#3498db' : '#666', marginTop: '2px'}}>
                        {hasDiscount ? (
                          <>
                            <span style={{textDecoration: 'line-through', color: '#999', marginRight: '4px'}}>
                              {formatCurrency(originalPrice)}
                            </span>
                            <span style={{color: '#e74c3c', fontWeight: 'bold'}}>
                              {formatCurrency(discountedPrice)}
                            </span>
                          </>
                        ) : (
                          formatCurrency(originalPrice)
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasDiscount && (
            <div style={{backgroundColor: '#fef2f2', color: '#e74c3c', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', marginBottom: '10px'}}>
              خصم {product.discountPercent}% على جميع الأحجام!
            </div>
          )}

          <p style={{color: '#666', lineHeight: '1.6'}}>{product.description}</p>
          
          <div style={{margin: '15px 0'}}>
            <strong>{t('category')}:</strong> {product.category}<br />
            <strong>{t('stock')}:</strong> {product.stock} {t('available')}
          </div>
          
          {/* Auto-add quantity stepper */}
          <div style={{marginTop: '20px'}}>
            <label><strong>{t('quantity')}:</strong></label>
            <div style={{display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center'}}>
              <button onClick={() => {
                const newQty = Math.max(0, quantity - 1);
                setQuantity(newQty);
                const key = selectedSize ? `${product._id}_${selectedSize.name}` : product._id;
                const existing = cart.find(i => i.cartKey === key);
                if (existing && newQty !== quantity) {
                  updateCartQty(key, newQty);
                }
              }} className="btn-secondary">-</button>
              <span style={{minWidth: '40px', textAlign: 'center', fontWeight: '700', fontSize: '18px'}}>{quantity}</span>
              <button onClick={() => {
                const newQty = Math.min(product.stock, quantity + 1);
                setQuantity(newQty);
                doAddToCart();
              }} className="btn-secondary">+</button>
            </div>
          </div>
          
          {/* Offer Section */}
          {buyOffer && getProductForOffer && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: offerActivated ? '#f0fdf4' : '#fff7ed',
              border: `2px solid ${offerActivated ? '#86efac' : '#fed7aa'}`
            }}>
              {!offerActivated ? (
                <>
                  <div style={{fontSize: '14px', fontWeight: '600', color: '#9a3412', marginBottom: '8px', textAlign: 'center'}}>
                    🎁 عرض خاص: اشتري {buyOffer.buyQuantity} من هذا المنتج واحصل على "{getProductForOffer.name}"
                    {buyOffer.getProductSize && <span style={{color: '#6366f1'}}> (حجم: {buyOffer.getProductSize})</span>}
                    {' '}{parseFloat(buyOffer.getPrice) === 0 ? 'مجاناً' : <>بسعر <strong>{fmt(buyOffer.getPrice)}</strong></>}
                  </div>
                  <div style={{fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '10px'}}>
                    لديك {cartQtyForThisProduct} في السلة • تحتاج {buyOffer.buyQuantity}
                  </div>
                  <button
                    onClick={handleAddOfferToCart}
                    className="btn-success"
                    style={{width: '100%', fontSize: '16px'}}
                    disabled={cartQtyForThisProduct < buyOffer.buyQuantity}
                  >
                    {cartQtyForThisProduct >= buyOffer.buyQuantity ? '✨ احصل على العرض' : `أضف ${buyOffer.buyQuantity - cartQtyForThisProduct} المزيد لتفعيل العرض`}
                  </button>
                </>
              ) : (
                <div style={{textAlign: 'center', fontSize: '15px', fontWeight: '600', color: '#166534'}}>
                  ✅ حصلت على "{getProductForOffer.name}" مجاناً!
                </div>
              )}
            </div>
          )}

          <button onClick={goToProducts} className="btn-primary" style={{width: '100%', marginTop: buyOffer ? '12px' : '20px', fontSize: '18px'}}>
            متابعة التسوق
          </button>
        </div>
      </div>

      {/* Confirmation modal disabled — stepper auto-adds to cart */}
      {/* {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{textAlign: 'center', padding: '30px'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
              <h2 style={{margin: '0 0 8px', fontSize: '20px'}}>{t('productAddedToCart')}</h2>
              <button
                onClick={handleContinueShopping}
                className="btn-primary"
                style={{marginTop: '20px', padding: '12px 32px', fontSize: '16px', fontWeight: '600'}}
              >
                متابعة التسوق
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default ProductDetail;
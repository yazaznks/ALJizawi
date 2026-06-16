import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import MediaGallery from '../components/MediaGallery';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { getProduct } = useProducts();
  const { t, formatCurrency } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleAddToCart = () => {
    // Set price to the base price (original, not discounted)
    // The discountPercent is kept so getCartTotal() and order saving will apply it consistently
    const basePrice = selectedSize ? parseFloat(selectedSize.price) : product.price;
    const item = {
      ...product,
      selectedSize: selectedSize ? selectedSize.name : null,
      price: basePrice,
      // Keep the product's discountPercent so getEffectivePrice() in CartContext applies it
      discountPercent: product.discountPercent || 0
    };
    addToCart(item, quantity, selectedSize ? selectedSize.name : null);
    setShowConfirm(true);
  };

  const handleContinueShopping = () => {
    setShowConfirm(false);
    navigate('/products');
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
          
          <div style={{marginTop: '20px'}}>
            <label><strong>{t('quantity')}:</strong></label>
            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-secondary">-</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" max={product.stock} style={{width: '80px', textAlign: 'center'}} />
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="btn-secondary">+</button>
            </div>
          </div>
          
          <button onClick={handleAddToCart} className="btn-success" style={{width: '100%', marginTop: '20px', fontSize: '18px'}} disabled={product.stock === 0}>
            {product.stock === 0 ? t('outOfStock') : t('addToCart')}
          </button>
        </div>
      </div>

      {/* Custom confirmation modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{textAlign: 'center', padding: '30px'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
              <h2 style={{margin: '0 0 8px', fontSize: '20px'}}>{t('productAddedToCart')}</h2>
              <button
                onClick={handleContinueShopping}
                className="btn-success"
                style={{marginTop: '20px', padding: '12px 32px', fontSize: '16px', fontWeight: '600'}}
              >
                متابعة التسوق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
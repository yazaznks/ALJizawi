import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useBanner } from '../context/BannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useOffers } from '../context/OfferContext';

// Helper: get optimized image URL with Cloudflare image transformation for smaller thumbnails
const getOptimizedImageUrl = (url, width = 400) => {
  if (url && url.includes('r2.dev')) {
    return `${url}?w=${width}&format=auto&fit=cover`;
  }
  return url;
};

// Skeleton card component for instant visual feedback
const SkeletonCard = () => (
  <div className="product-card skeleton-card">
    <div className="product-image skeleton-image shimmer" />
    <div className="product-info">
      <div className="skeleton-line skeleton-name shimmer" />
      <div className="skeleton-line skeleton-price shimmer" />
      <div className="skeleton-line skeleton-stock shimmer" />
    </div>
  </div>
);

// Size selection modal with +/- stepper for each size
const SizeSelectModal = ({ product, onClose }) => {
  const { formatCurrency } = useLanguage();
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();

  // Get cart quantity for a specific size
  const getSizeCartQty = (sizeName) => {
    const itemKey = `${product._id}_${sizeName}`;
    const item = cart.find(i => i.cartKey === itemKey);
    return item ? item.quantity : 0;
  };

  // Add one of a specific size
  const handleAdd = (size) => {
    const originalPrice = parseFloat(size.price);
    addToCart(
      {
        ...product,
        price: originalPrice,
        discountPercent: product.discountPercent || 0
      },
      1,
      size.name
    );
  };

  // Remove one of a specific size
  const handleRemove = (size) => {
    const itemKey = `${product._id}_${size.name}`;
    const item = cart.find(i => i.cartKey === itemKey);
    if (item) {
      if (item.quantity <= 1) {
        removeFromCart(itemKey);
      } else {
        updateQuantity(itemKey, item.quantity - 1);
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 10000 }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '380px', padding: '20px' }}
      >
        <h3 style={{ margin: '0 0 16px', textAlign: 'center', fontSize: '18px' }}>
          اختر الكمية لكل حجم
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {product.sizes.map((size, index) => {
            const originalPrice = parseFloat(size.price);
            const discountedPrice = product.discountPercent
              ? originalPrice * (100 - product.discountPercent) / 100
              : originalPrice;
            const sizeQty = getSizeCartQty(size.name);
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '60px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>{size.name}</span>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: product.discountPercent ? '#e74c3c' : '#333' }}>
                    {product.discountPercent ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px', marginLeft: '4px' }}>
                          {formatCurrency(originalPrice)}
                        </span>
                        {formatCurrency(discountedPrice)}
                      </>
                    ) : (
                      formatCurrency(originalPrice)
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleAdd(size)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      border: '1px solid #22c55e',
                      background: '#f0fdf4',
                      color: '#22c55e',
                      fontSize: '18px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      padding: 0
                    }}
                  >
                    +
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>
                    {sizeQty}
                  </span>
                  <button
                    onClick={() => handleRemove(size)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      border: `1px solid ${sizeQty <= 0 ? '#d1d5db' : '#ef4444'}`,
                      background: sizeQty <= 0 ? '#f9fafb' : '#fef2f2',
                      color: sizeQty <= 0 ? '#d1d5db' : '#ef4444',
                      fontSize: '18px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      padding: 0
                    }}
                  >
                    {sizeQty <= 0 ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                      </svg>
                    ) : (
                      '−'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '14px',
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: '#f3f4f6',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
            fontWeight: '500'
          }}
        >
          تم
        </button>
      </div>
    </div>
  );
};

// Quick-add button with quantity stepper
const QuickAddButton = ({ product }) => {
  const { addToCart, removeFromCart, cart, updateQuantity } = useCart();
  const [mode, setMode] = useState('plus');
  const [showSizes, setShowSizes] = useState(false);
  const timerRef = useRef(null);

  // Get current quantity in cart for this product (single-size only)
  const cartItem = cart.find(item => item.cartKey === product._id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const hasSizes = product.sizes && product.sizes.length > 0;

  // For multi-size products, check if any size is in cart
  const totalMultiQty = hasSizes
    ? cart.reduce((sum, item) => {
        if (item.cartKey && item.cartKey.startsWith(product._id + '_')) {
          return sum + item.quantity;
        }
        return sum;
      }, 0)
    : 0;

  const totalQty = hasSizes ? totalMultiQty : cartQuantity;

  // Add to cart using the ORIGINAL price - let CartContext handle the discount
  const handleAddToCart = useCallback((selectedSizeName = null) => {
    let originalPrice;
    if (hasSizes && selectedSizeName) {
      const size = product.sizes.find(s => s.name === selectedSizeName);
      originalPrice = size ? parseFloat(size.price) : parseFloat(product.sizes[0].price);
    } else {
      originalPrice = product.price;
    }

    addToCart(
      {
        ...product,
        price: originalPrice,
        discountPercent: product.discountPercent || 0
      },
      1,
      selectedSizeName
    );
  }, [product, addToCart, hasSizes]);

  // Remove 1 from cart immediately (single-size only)
  const handleRemoveOne = useCallback(() => {
    if (cartQuantity <= 1) {
      removeFromCart(product._id);
    } else {
      updateQuantity(product._id, cartQuantity - 1);
    }
  }, [product, cartQuantity, removeFromCart, updateQuantity]);

  // Start timers to auto-close stepper
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMode('plus');
    }, 4000);
  }, []);

  // Clicking the plus button
  const handlePlusClick = (e) => {
    e.stopPropagation();

    if (hasSizes) {
      setShowSizes(true);
    } else {
      handleAddToCart(null);
      setMode('stepper');
      resetTimer();
    }
  };

  // Stepper - increase: add 1 to cart immediately (single-size only)
  const handleIncrease = (e) => {
    e.stopPropagation();
    if (hasSizes) {
      setShowSizes(true);
    } else {
      handleAddToCart(null);
      resetTimer();
    }
  };

  // Stepper - decrease: remove 1 from cart immediately, close if 0 (single-size only)
  const handleDecrease = (e) => {
    e.stopPropagation();
    if (cartQuantity <= 1) {
      removeFromCart(product._id);
      if (timerRef.current) clearTimeout(timerRef.current);
      setMode('plus');
    } else {
      handleRemoveOne();
      resetTimer();
    }
  };

  // For multi-size products: always show a "plus" button with count badge
  if (hasSizes) {
    return (
      <>
        <div className="quick-add-plus-wrapper">
          <button
            className={`quick-add-plus ${totalQty > 0 ? 'has-count' : ''}`}
            onClick={handlePlusClick}
            aria-label="Add to cart"
          >
            {totalQty > 0 ? (
              <span className="quick-add-plus-count">{totalQty}</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
        </div>
        {showSizes && (
          <SizeSelectModal
            product={product}
            onClose={() => setShowSizes(false)}
          />
        )}
      </>
    );
  }

  // Single-size product: normal stepper behavior
  if (mode === 'stepper') {
    return (
      <div className="quick-add-stepper">
        <button
          className="quick-add-stepper-btn"
          onClick={handleIncrease}
        >
          +
        </button>
        <span className="quick-add-stepper-qty">
          {cartQuantity > 0 ? cartQuantity : 1}
        </span>
        <button
          className="quick-add-stepper-btn"
          onClick={handleDecrease}
        >
          {cartQuantity <= 1 ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          ) : (
            '−'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="quick-add-plus-wrapper">
      <button
        className={`quick-add-plus ${cartQuantity > 0 ? 'has-count' : ''}`}
        onClick={handlePlusClick}
        aria-label="Add to cart"
      >
        {cartQuantity > 0 ? (
          <span className="quick-add-plus-count">{cartQuantity}</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>
    </div>
  );
};

// Product card that navigates to detail page on click (but not when clicking buttons)
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { t, formatCurrency } = useLanguage();

  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="product-image">
        {product.images && product.images[0] ? (
          product.images[0].type?.startsWith('video/') ? (
            <div style={{width: '100%', height: '100%', position: 'relative', background: '#000'}}>
              <video
                src={product.images[0].url}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                muted
              />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '40px',
                opacity: 0.8,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}>▶️</span>
            </div>
          ) : (
            <img 
              src={getOptimizedImageUrl(product.images[0].url, 400)} 
              alt={product.name} 
              loading="lazy"
            />
          )
        ) : (
          <span>{t('noImage')}</span>
        )}
        <div onClick={e => e.stopPropagation()}>
          <QuickAddButton product={product} formatCurrency={formatCurrency} t={t} />
        </div>
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">
          {product.sizes && product.sizes.length > 0 ? (
            (() => {
              const sortedPrices = product.sizes.map(s => parseFloat(s.price)).sort((a, b) => a - b);
              const minPrice = sortedPrices[0];
              const discMin = product.discountPercent ? minPrice * (100 - product.discountPercent) / 100 : minPrice;
              return (
                <span style={{color: '#e74c3c', fontWeight: 'bold'}}>
                  يبدأ من {formatCurrency(discMin)}
                </span>
              );
            })()
          ) : product.discountPercent ? (
            <>
              <span style={{textDecoration: 'line-through', color: '#999', marginRight: '8px', marginLeft: '8px'}}>{formatCurrency(product.price)}</span>
              <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{formatCurrency(product.price * (100 - product.discountPercent) / 100)}</span>
            </>
          ) : (
            formatCurrency(product.price)
          )}
        </div>
        <div className="product-stock">{t('stock')}: {product.stock}</div>
      </div>
    </div>
  );
};

const Products = () => {
  const { t, formatCurrency, language } = useLanguage();
  const { products, loading, hasMore, loadProducts } = useProducts();
  const { banners } = useBanner();
  const [currentBanner, setCurrentBanner] = useState(0);
  const loadMoreRef = useRef(null);

  const activeBanners = banners.filter(b => b.active);

  // Load offers for the offers section
  const { offers, loading: offersLoading } = useOffers();
  
  // Only active offers and matching existing products
  const activeOffers = offers.filter(o => 
    o.active && 
    products.some(p => p._id === o.buyProductId) && 
    products.some(p => p._id === o.getProductId)
  );
  
  // Split products: featured first, then regular
  const featured = products.filter(p => p.featured);
  const regular = products.filter(p => !p.featured);
  const sortedProducts = [...featured, ...regular];

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const prevBanner = () => {
    setCurrentBanner(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const nextBanner = () => {
    setCurrentBanner(prev => (prev + 1) % activeBanners.length);
  };

  // Infinite scroll: load more products when user scrolls to bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadProducts(true);
        }
      },
      { rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadProducts]);

  return (
    <div className="container">
      {activeBanners.length > 0 && (
        <div className="banner-carousel" style={{position: 'relative', marginBottom: '20px'}}>
          <div className="banner-slide">
            {(() => {
              const banner = activeBanners[currentBanner];
              if (banner.type === 'video') {
                if (banner.videoData) {
                  return (
                    <video
                      className="banner-video"
                      src={banner.videoData}
                      controls
                      style={{width: '100%', height: '100%', objectFit: 'contain', background: '#000'}}
                    />
                  );
                }
                return (
                  <iframe
                    src={banner.content}
                    title="Banner Ad"
                    className="banner-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              } else if (banner.type === 'image') {
                return (
                  <img src={banner.imageData} alt="Banner" className="banner-image" />
                );
              } else {
                return (
                  <div className="banner-text">
                    {banner.content}
                  </div>
                );
              }
            })()}
          </div>
          {activeBanners.length > 1 && (
            <>
              <button 
                onClick={language === 'ar' ? nextBanner : prevBanner} 
                className="banner-nav-btn" 
                style={{left: '10px'}}
              >
                {language === 'ar' ? '❯' : '❮'} 
              </button>
              <button 
                onClick={language === 'ar' ? prevBanner : nextBanner} 
                className="banner-nav-btn" 
                style={{right: '10px'}}
              >
                {language === 'ar' ? '❮' : '❯'} 
              </button>
              <div className="banner-dots">
                {activeBanners.map((_, i) => (
                  <button key={i} onClick={() => setCurrentBanner(i)} className={`banner-dot ${i === currentBanner ? 'active' : ''}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {loading && products.length === 0 ? (
        <div className="products-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p style={{textAlign: 'center', padding: '40px'}}>{t('noProducts') || 'لا توجد منتجات'}</p>
      ) : (
        <>
          {/* Offers Section - اقوى العروض */}
          {/* {activeOffers.length > 0 && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '36px',
                marginBottom: '24px'
              }}>
                <span style={{
                 
                  color: 'white',
                  fontSize: '22px',
                  padding: '8px 14px',
                  borderRadius: '14px',
                  lineHeight: 1
                }}>🔥</span>
                <h2 style={{
                  margin: 0,
                  padding: 0,
                  fontSize: '28px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  اقوى العروض
                </h2>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {activeOffers.map(offer => {
                  const buyProduct = products.find(p => p._id === offer.buyProductId);
                  const getProduct = products.find(p => p._id === offer.getProductId);
                  if (!buyProduct || !getProduct) return null;
                  return (
                    <Link
                      key={offer.id}
                      to={`/products/${buyProduct._id}`}
                      style={{textDecoration: 'none', color: 'inherit'}}
                    >
                      <div style={{
                        background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                        borderRadius: '20px',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        border: '2px solid rgba(249, 115, 22, 0.2)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        boxShadow: '0 2px 12px rgba(249, 115, 22, 0.08)'
                      }}>
                        <div style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '16px',
                          background: '#fff',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #fee2e2'
                        }}>
                          {getProduct.images && getProduct.images[0] ? (
                            <img 
                              src={getOptimizedImageUrl(getProduct.images[0].url, 120)} 
                              alt={getProduct.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            />
                          ) : (
                            <span style={{fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>📦</span>
                          )}
                        </div>
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#9a3412',
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            🛒 اشتري {offer.buyQuantity} من "{buyProduct.name}" {offer.buyProductSize ? <span style={{fontSize: '14px', fontWeight: '600', color: '#6366f1'}}>(حجم: {offer.buyProductSize})</span> : ''}
                          </div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#065f46',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            🎁 واحصل على "{getProduct.name}" {offer.getProductSize ? <span style={{fontSize: '14px', fontWeight: '600', color: '#6366f1'}}>(حجم: {offer.getProductSize})</span> : ''} بسعر <span style={{fontSize: '18px'}}>{formatCurrency(offer.getPrice)}</span>
                          </div>
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          عرض خاص 🔥
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )} */}

          {/* Featured Products Section */}
          {featured.length > 0 && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '32px',
                marginBottom: '20px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: 'white',
                  fontSize: '20px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  lineHeight: 1
                }}>⭐</span>
                <h2 style={{
                  margin: 0,
                  padding: 0,
                  fontSize: '26px',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  المنتجات المميزة
                </h2>
              </div>
              <div className="products-grid">
                {featured.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          )}

          {/* All Products Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: featured.length > 0 ? '48px' : '32px',
            marginBottom: '20px'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontSize: '18px',
              padding: '8px 12px',
              borderRadius: '12px',
              lineHeight: 1
            }}>📦</span>
            <h2 style={{
              margin: 0,
              padding: 0,
              fontSize: '26px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {t('allProducts')}
            </h2>
          </div>
          <div className="products-grid">
            {regular.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Loading more indicator and infinite scroll sentinel */}
          <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '20px', minHeight: '60px' }}>
            {loading && hasMore && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <span style={{ width: '18px', height: '18px', border: '2px solid #ddd', borderTopColor: '#3498db', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                جاري تحميل المزيد...
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p style={{ color: '#999', fontSize: '14px' }}>لا يوجد مزيد من المنتجات</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useBanner } from '../context/BannerContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

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

// Quick-add button with quantity stepper
const QuickAddButton = ({ product }) => {
  const { addToCart, removeFromCart, cart, updateQuantity } = useCart();
  const [mode, setMode] = useState('plus'); // 'plus' | 'stepper'
  const timerRef = useRef(null);

  // Get current quantity in cart for this product
  const cartItem = cart.find(item => item.cartKey === product._id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // Compute effective price
  const getPrice = () => {
    if (product.sizes && product.sizes.length > 0) {
      const sortedPrices = product.sizes.map(s => parseFloat(s.price)).sort((a, b) => a - b);
      const minPrice = sortedPrices[0];
      return product.discountPercent ? minPrice * (100 - product.discountPercent) / 100 : minPrice;
    }
    return product.discountPercent ? product.price * (100 - product.discountPercent) / 100 : product.price;
  };

  // Add 1 to cart immediately
  const handleAddOne = useCallback(() => {
    addToCart({ ...product, price: getPrice() }, 1);
  }, [product, addToCart]);

  // Remove 1 from cart immediately (or fully remove if last)
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

  // Clicking the plus button → opens stepper, adds 1 to cart
  const handlePlusClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddOne();
    setMode('stepper');
    resetTimer();
  };

  // Stepper - increase: add 1 to cart immediately
  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddOne();
    resetTimer();
  };

  // Stepper - decrease: remove 1 from cart immediately, close if 0
  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity <= 1) {
      // Last item, remove and close stepper
      removeFromCart(product._id);
      if (timerRef.current) clearTimeout(timerRef.current);
      setMode('plus');
    } else {
      handleRemoveOne();
      resetTimer();
    }
  };

  if (mode === 'stepper') {
    return (
      <div className="quick-add-stepper">
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
        <span className="quick-add-stepper-qty">
          {cartQuantity > 0 ? cartQuantity : 1}
        </span>
        <button
          className="quick-add-stepper-btn"
          onClick={handleIncrease}
        >
          +
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

const Products = () => {
  const { t, formatCurrency } = useLanguage();
  const { getProducts, loading } = useProducts();
  const { banners } = useBanner();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsLoading, setProductsLoading] = useState(true);

  const activeBanners = banners.filter(b => b.active);

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

  // Load products - re-run when page or loading state changes
  useEffect(() => {
    const loadProducts = () => {
      const result = getProducts({ page: currentPage, limit: 12 });
      setProducts(result.products);
      setTotalPages(result.totalPages);
      setProductsLoading(false);
    };

    if (!loading) {
      setProductsLoading(true);
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, loading]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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
              <button onClick={prevBanner} className="banner-nav-btn" style={{left: '10px'}}>❮</button>
              <button onClick={nextBanner} className="banner-nav-btn" style={{right: '10px'}}>❯</button>
              <div className="banner-dots">
                {activeBanners.map((_, i) => (
                  <button key={i} onClick={() => setCurrentBanner(i)} className={`banner-dot ${i === currentBanner ? 'active' : ''}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      <h1>{t('allProducts')}</h1>
      
      {productsLoading ? (
        <div className="products-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p style={{textAlign: 'center', padding: '40px'}}>{t('noProducts') || 'لا توجد منتجات'}</p>
      ) : (
        <>
          <div className="products-grid">
            {products.map(product => (
              <Link to={`/products/${product._id}`} key={product._id} style={{textDecoration: 'none', color: 'inherit'}}>
                <div className="product-card">
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
                    <QuickAddButton product={product} formatCurrency={formatCurrency} t={t} />
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
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-wrapper" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              marginTop: '30px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: currentPage === 1 ? '#f5f5f5' : 'white',
                  color: currentPage === 1 ? '#ccc' : '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                ❮ السابق
              </button>
              
              {renderPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: page === currentPage ? '2px solid #3498db' : '1px solid #ddd',
                    background: page === currentPage ? '#3498db' : 'white',
                    color: page === currentPage ? 'white' : '#333',
                    cursor: 'pointer',
                    fontWeight: page === currentPage ? '700' : '500',
                    fontSize: '14px',
                    minWidth: '38px'
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: currentPage === totalPages ? '#f5f5f5' : 'white',
                  color: currentPage === totalPages ? '#ccc' : '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                التالي ❯
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
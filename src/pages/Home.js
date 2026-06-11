import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';

// Helper: get optimized image URL with Cloudflare image transformation for smaller thumbnails
const getOptimizedImageUrl = (url, width = 400) => {
  // If the URL is from Cloudflare R2, add image transformation params
  if (url && url.includes('r2.dev')) {
    // Cloudflare Image Resizing: ?w=400&format=auto&fit=cover
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

const Home = () => {
  const { t, formatCurrency } = useLanguage();
  const { getProducts, loading } = useProducts();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [contentReady, setContentReady] = useState(false);

  const loadFeaturedProducts = () => {
    const result = getProducts({ featured: true, limit: 8 });
    setFeaturedProducts(result.products);
    if (result.products.length > 0) {
      setContentReady(true);
    }
  };

  useEffect(() => {
    // Load featured products immediately and keep re-checking when products become available
    loadFeaturedProducts();
    
    // Even though loading=false immediately, products may take time to arrive from Firestore
    // So we poll briefly for early results
    const interval = setInterval(() => {
      const result = getProducts({ featured: true, limit: 8 });
      if (result.products.length > 0) {
        setFeaturedProducts(result.products);
        setContentReady(true);
        clearInterval(interval);
      }
    }, 300);
    
    // Clear interval after 15 seconds max (should never take that long)
    setTimeout(() => clearInterval(interval), 15000);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      const result = getProducts({ featured: true, limit: 8 });
      setFeaturedProducts(result.products);
      if (result.products.length > 0) {
        setContentReady(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Always show the page structure immediately, even while loading
  return (
    <div className="container">
      <div className="card" style={{textAlign: 'center', padding: '40px', marginTop: '20px'}}>
        <h1>{t('welcomeMessage')}</h1>
        <p style={{fontSize: '18px', color: '#666', margin: '20px 0'}}>
          {t('shopWithLocation')}
        </p>
        <Link to="/products">
          <button className="btn-primary" style={{fontSize: '18px', padding: '15px 30px'}}>
            {t('browseProducts')}
          </button>
        </Link>
      </div>

      <h2 style={{marginTop: '40px', marginBottom: '20px'}}>{t('featuredProducts')}</h2>
      
      {/* Show skeleton cards INSTANTLY while products load - no spinner */}
      {!contentReady ? (
        <div className="products-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : featuredProducts.length === 0 ? (
        <p>{t('noFeaturedProducts')}</p>
      ) : (
        <div className="products-grid fade-in">
          {featuredProducts.map(product => (
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
                            preload="none"
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
                          style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                        />
                      )
                    ) : (
                      <span>{t('noImage')}</span>
                    )}
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
                          <span style={{color: '#e74c3c', fontWeight: 'bold', fontSize: '14px'}}>
                            يبدأ من {formatCurrency(discMin)}
                          </span>
                        );
                      })()
                    ) : product.discountPercent ? (
                      <>
                        <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '14px'}}>{formatCurrency(product.price)}</span>
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
      )}
    </div>
  );
};

export default Home;

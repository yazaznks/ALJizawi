import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t, formatCurrency } = useLanguage();
  const { getProducts, loading } = useProducts();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    // Load featured products immediately and keep re-checking when products become available
    loadFeaturedProducts();
    
    // If products are still loading, poll briefly for early results
    if (loading) {
      const interval = setInterval(() => {
        const result = getProducts({ featured: true, limit: 8 });
        if (result.products.length > 0) {
          setFeaturedProducts(result.products);
          setContentReady(true);
          clearInterval(interval);
        }
      }, 200);
      
      // Clear interval after 10 seconds max
      setTimeout(() => clearInterval(interval), 10000);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const result = getProducts({ featured: true, limit: 8 });
      setFeaturedProducts(result.products);
      setContentReady(true);
    }
  }, [loading]);

  const loadFeaturedProducts = () => {
    const result = getProducts({ featured: true, limit: 8 });
    setFeaturedProducts(result.products);
    if (result.products.length > 0) {
      setContentReady(true);
    }
  };

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
      
      {!contentReady && loading ? (
        <div className="loading" style={{padding: '20px'}}>{t('loading')}</div>
      ) : featuredProducts.length === 0 ? (
        <p>{t('noFeaturedProducts')}</p>
      ) : (
        <div className="products-grid">
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
                          src={product.images[0].url} 
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
                      <span style={{color: '#666', fontSize: '14px'}}>حسب الحجم</span>
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

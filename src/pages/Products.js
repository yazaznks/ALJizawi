import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useBanner } from '../context/BannerContext';
import { useLanguage } from '../context/LanguageContext';

const Products = () => {
  const { t } = useLanguage();
  const { getProducts, loading } = useProducts();
  const { banners } = useBanner();
  const [currentBanner, setCurrentBanner] = useState(0);

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
  const [products, setProducts] = useState([]);
  const [currentPage] = useState(1);

  useEffect(() => {
    if (!loading) {
      const result = getProducts({ page: currentPage, limit: 12 });
      setProducts(result.products);
    }
  }, [currentPage, loading]);

  if (loading) return <div className="loading">{t('loadingProducts')}</div>;

  return (
    <div className="container">
      {activeBanners.length > 0 && (
        <div className="banner-carousel" style={{position: 'relative', marginBottom: '20px'}}>
          <div className="banner-slide">
            {(() => {
              const banner = activeBanners[currentBanner];
              if (banner.type === 'video') {
                // If there's an uploaded video file, use the <video> tag
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
                // Otherwise use embed URL
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
      <div className="products-grid">
        {products.map(product => (
          <Link to={`/products/${product._id}`} key={product._id} style={{textDecoration: 'none', color: 'inherit'}}>
            <div className="product-card">
              <div className="product-image">
                {product.images && product.images[0] ? (
                  <img src={product.images[0].url} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <span>{t('noImage')}</span>
                )}
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-price">
                  {product.discountPercent ? (
                    <>
                      <span style={{textDecoration: 'line-through', color: '#999', marginRight: '8px'}}>د.أ ${product.price.toFixed(2)}</span>
                      <span style={{color: '#e74c3c', fontWeight: 'bold'}}>د.أ ${(product.price * (100 - product.discountPercent) / 100).toFixed(2)}</span>
                    </>
                  ) : (
                    `د.أ ${product.price.toFixed(2)}`
                  )}
                </div>
                <div className="product-stock">{t('stock')}: {product.stock}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Products;

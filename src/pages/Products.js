import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useBanner } from '../context/BannerContext';
import { useLanguage } from '../context/LanguageContext';

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

  const formatPriceRange = (product) => {
    if (!product.sizes || product.sizes.length === 0) return null;
    const applyDiscount = (price) => product.discountPercent ? price * (100 - product.discountPercent) / 100 : price;
    const prices = product.sizes.map(s => applyDiscount(parseFloat(s.price)));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
      return product.discountPercent
        ? (
            <>
              <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '14px'}}>{formatCurrency(parseFloat(product.sizes[0].price))}</span>
              <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{formatCurrency(min)}</span>
            </>
          )
        : formatCurrency(min);
    }
    const originalPrices = product.sizes.map(s => parseFloat(s.price));
    const origMin = Math.min(...originalPrices);
    const origMax = Math.max(...originalPrices);
    const origRange = origMin === origMax ? formatCurrency(origMin) : `${formatCurrency(origMin)} - ${formatCurrency(origMax)}`;
    const discRange = min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`;
    return product.discountPercent
      ? (
          <>
            <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '14px'}}>{origRange}</span>
            <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{discRange}</span>
          </>
        )
      : discRange;
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
        <div className="loading" style={{padding: '40px'}}>{t('loadingProducts')}</div>
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
                      <img 
                        src={product.images[0].url} 
                        alt={product.name} 
                        loading="lazy"
                        style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                      />
                    ) : (
                      <span>{t('noImage')}</span>
                    )}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">
                      {product.sizes && product.sizes.length > 0 ? (
                        <span style={{color: '#e74c3c', fontWeight: 'bold'}}>(حسب الحجم)</span>
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
            <div style={{
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
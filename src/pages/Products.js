import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useBanner } from '../context/BannerContext';
import { useLanguage } from '../context/LanguageContext';

const Products = () => {
  const { t } = useLanguage();
  const { getProducts, loading } = useProducts();
  const { banner } = useBanner();
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
      {banner && banner.active && (banner.content || banner.imageData) && (
        <div className="banner-ad">
          {banner.type === 'video' ? (
            <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px'}}>
              <iframe
                src={banner.content}
                title="Banner Ad"
                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none'}}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : banner.type === 'image' ? (
            <div style={{marginBottom: '20px', borderRadius: '8px', overflow: 'hidden'}}>
              <img src={banner.imageData} alt="Banner" style={{width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px'}} />
            </div>
          ) : (
            <div className="banner-text" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px'}}>
              {banner.content}
            </div>
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
                      <span style={{textDecoration: 'line-through', color: '#999', marginRight: '8px'}}>${product.price.toFixed(2)}</span>
                      <span style={{color: '#e74c3c', fontWeight: 'bold'}}>${(product.price * (100 - product.discountPercent) / 100).toFixed(2)}</span>
                    </>
                  ) : (
                    `$${product.price.toFixed(2)}`
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();
  const { getProducts, loading } = useProducts();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = () => {
    const result = getProducts({ featured: true, limit: 8 });
    setFeaturedProducts(result.products);
  };

  if (loading) return <div className="loading">{t('loading')}</div>;

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
      
      {featuredProducts.length === 0 ? (
        <p>{t('noFeaturedProducts')}</p>
      ) : (
        <div className="products-grid">
          {featuredProducts.map(product => (
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
                  <div className="product-price">JOD ${product.price.toFixed(2)}</div>
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

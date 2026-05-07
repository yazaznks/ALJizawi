import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';

const Products = () => {
  const { t } = useLanguage();
  const { getProducts, loading } = useProducts();
  const [products, setProducts] = useState([]);
  //const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, [currentPage]);

  const loadProducts = () => {
    const result = getProducts({ page: currentPage, limit: 12 });
    setProducts(result.products);
  };

  if (loading) return <div className="loading">{t('loadingProducts')}</div>;

  return (
    <div className="container">
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
                <div className="product-price">${product.price.toFixed(2)}</div>
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

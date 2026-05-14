import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { getProduct } = useProducts();
  const { t, formatCurrency } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = () => {
    const foundProduct = getProduct(id);
    setProduct(foundProduct);
    setLoading(false);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(t('productAddedToCart'));
    navigate('/cart');
  };

  if (loading) return <div className="loading">{t('loadingProduct')}</div>;
  if (!product) return <div className="container"><p>{t('productNotFound')}</p></div>;

  return (
    <div className="container">
      <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="product-image" style={{width: '100%', maxHeight: '500px', borderRadius: '8px 8px 0 0', overflow: 'hidden'}}>
          {product.images && product.images[0] ? (
            <img src={product.images[0].url} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <span>{t('noImage')}</span>
          )}
        </div>
        
        <div style={{padding: '20px'}}>
          <h1>{product.name}</h1>
          <div className="product-price" style={{fontSize: '28px', margin: '15px 0'}}>
            {product.discountPercent ? (
              <>
                <span style={{textDecoration: 'line-through', color: '#999', fontSize: '20px', marginRight: '10px'}}>{formatCurrency(product.price)}</span>
                <span style={{color: '#e74c3c', fontWeight: 'bold'}}>{formatCurrency(product.price * (100 - product.discountPercent) / 100)}</span>
              </>
            ) : (
              formatCurrency(product.price)
            )}
          </div>
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
    </div>
  );
};

export default ProductDetail;

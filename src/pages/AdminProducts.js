import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
//import { useAuth } from '../context/AuthContext';
//import { useLanguage } from '../context/LanguageContext';

const AdminProducts = () => {
 // const { t } = useLanguage();
  const { products, loading, createProduct, updateProduct, deleteProduct, removeProductImage } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    featured: false,
    images: []
  });

  const handleDelete = async (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      const result = deleteProduct(id);
      if (result.success) {
        alert(t('productDeleted'));
      } else {
        alert(t('errorDeleting'));
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      featured: product.featured,
      images: []
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (editingProduct) {
        result = await updateProduct(editingProduct._id, formData, formData.images);
        if (result.success) {
          alert(t('productUpdated'));
        }
      } else {
        result = await createProduct(formData, formData.images);
        if (result.success) {
          alert(t('productAdded'));
        }
      }

      if (result.success) {
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          stock: '',
          featured: false,
          images: []
        });
      } else {
        alert(`Error ${editingProduct ? 'updating' : 'adding'} product: ` + result.message);
      }
    } catch (error) {
      alert(`Error ${editingProduct ? 'updating' : 'adding'} product: ` + error.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      featured: false,
      images: []
    });
  };

  // const handleRemoveImage = (productId, imageIndex) => {
  //   if (window.confirm('Remove this image?')) {
  //     removeProductImage(productId, imageIndex);
  //   }
  // };

  if (loading) return <div className="loading">{t('loadingProducts')}</div>;

  return (
    <div className="container">
      <h1>{t('manageProducts')}</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
      </div>

      <div style={{marginBottom: '20px'}}>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
        >
          {showForm ? `✖ ${t('cancel')}` : `➕ ${t('addNewProduct')}`}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom: '20px'}}>
          <h2>{editingProduct ? t('editProduct') : t('addNewProduct')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('productName')} *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('description')} *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                rows="4"
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div className="form-group">
                <label>{t('price')} ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('stock')} *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('category')} *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="e.g., Electronics, Clothing, Books"
                required
              />
            </div>

            <div className="file-upload">
              <label>{t('productImages')}</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setFormData({...formData, images: files});
                }}
              />

              {/* Show existing images when editing */}
              {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                <div style={{marginTop: '12px'}}>
                  <p>{t('currentImages')}</p>
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px'}}>
                    {editingProduct.images.map((image, index) => (
                      <img
                        key={`existing-${index}`}
                        src={image.url}
                        alt={`Current ${index + 1}`}
                        className="image-preview"
                        style={{width: '100px', height: '100px', objectFit: 'cover'}}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show newly selected images */}
              {formData.images && formData.images.length > 0 && (
                <div style={{marginTop: '12px'}}>
                  <p>{t('newImagesToUpload')} {formData.images.length} {t('selected')}</p>
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px'}}>
                    {formData.images.map((file, index) => (
                      <img
                        key={`new-${index}`}
                        src={URL.createObjectURL(file)}
                        alt={`New Preview ${index + 1}`}
                        className="image-preview"
                        style={{width: '100px', height: '100px', objectFit: 'cover'}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  style={{width: 'auto', marginRight: '10px'}}
                />
                {t('featuredProduct')}
              </label>
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button type="submit" className="btn-success">{editingProduct ? t('updateProduct') : t('addProduct')}</button>
              <button type="button" onClick={handleCancel} className="btn-secondary">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('category')}</th>
              <th>{t('price')}</th>
              <th>{t('stock')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>{product.active ? t('active') : t('inactive')}</td>
                <td>
                  <button onClick={() => handleEdit(product)} className="btn-secondary" style={{padding: '5px 10px', marginRight: '5px'}}>{t('edit')}</button>
                  <button onClick={() => handleDelete(product._id)} className="btn-danger" style={{padding: '5px 10px'}}>{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
//import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AdminNav from '../components/AdminNav';

const AdminProducts = () => {
  const { t, formatCurrency } = useLanguage();
  const { products, loading, hasMore, loadProducts, createProduct, updateProduct, deleteProduct } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [keptImages, setKeptImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPercent: '',
    category: '',
    stock: '',
    featured: false,
    images: [],
    sizes: [],
    imageSizes: {} // map of image URL -> size name (or 'all')
  });

  const handleDelete = async (firestoreId, customId) => {
    if (window.confirm(t('deleteConfirm'))) {
      const result = await deleteProduct(firestoreId, customId);
      if (result.success) {
        alert(t('productDeleted'));
      } else {
        alert(t('errorDeleting') + (result.message ? ': ' + result.message : ''));
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setKeptImages(product.images ? [...product.images] : []);
    // Restore image size tags from product data
    const restoredImageSizes = {};
    if (product.imageSizes && typeof product.imageSizes === 'object') {
      Object.assign(restoredImageSizes, product.imageSizes);
    }
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      discountPercent: product.discountPercent ? product.discountPercent.toString() : '',
      category: product.category,
      stock: product.stock.toString(),
      featured: product.featured,
      images: [],
      sizes: product.sizes ? product.sizes.map(s => ({ ...s })) : [],
      imageSizes: restoredImageSizes
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (editingProduct) {
        result = await updateProduct(editingProduct._id, formData, formData.images, keptImages);
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
        discountPercent: '',
        category: '',
        stock: '',
        featured: false,
        images: [],
        sizes: [],
        imageSizes: {}
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
    setKeptImages([]);
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPercent: '',
      category: '',
      stock: '',
      featured: false,
      images: [],
      sizes: [],
      imageSizes: {}
    });
  };

  // Sizes management
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { name: '', price: '' }]
    }));
  };

  const removeSize = (index) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateSize = (index, field, value) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes[index] = { ...newSizes[index], [field]: value };
      return { ...prev, sizes: newSizes };
    });
  };

  if (loading) return <div className="loading">{t('loadingProducts')}</div>;

  return (
    <div className="container">
      <h1>{t('manageProducts')}</h1>
      <AdminNav />

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

            <div className="admin-products-form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div className="form-group">
                <label>{t('price')} (د.أ) * {formData.sizes.length > 0 && <span style={{color: '#999', fontSize: '12px'}}>(سيتم تجاهله عند وجود أحجام)</span>}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount (%) (optional)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({...formData, discountPercent: e.target.value})}
                  placeholder="e.g., 50 for 50% off"
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

            {/* Sizes Section */}
            <div className="form-group" style={{border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fafafa'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                <label style={{fontWeight: '600', fontSize: '15px', margin: 0}}>خيارات الأحجام (اختياري)</label>
                <button type="button" onClick={addSize} style={{padding: '6px 14px', borderRadius: '6px', border: '1px dashed #3498db', background: 'white', color: '#3498db', cursor: 'pointer', fontSize: '13px', fontWeight: '500'}}>
                  ➕ إضافة حجم
                </button>
              </div>
              
              {formData.sizes.length === 0 && (
                <p style={{color: '#999', fontSize: '13px', margin: 0}}>لا توجد أحجام. سعر المنتج الأساسي سيتم استخدامه.</p>
              )}
              
              {formData.sizes.map((size, index) => (
                <div key={index} style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px'}}>
                  <input
                    type="text"
                    placeholder="اسم الحجم (مثال: كبير)"
                    value={size.name}
                    onChange={(e) => updateSize(index, 'name', e.target.value)}
                    style={{flex: '1', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'}}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="السعر (د.أ)"
                    value={size.price}
                    onChange={(e) => updateSize(index, 'price', e.target.value)}
                    style={{flex: '1', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'}}
                    required
                  />
                  <button type="button" onClick={() => removeSize(index)} style={{padding: '6px 12px', borderRadius: '6px', border: '1px solid #e74c3c', background: 'white', color: '#e74c3c', cursor: 'pointer', fontSize: '16px', lineHeight: '1'}}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="file-upload">
              <label>{t('productImages')}</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setFormData({...formData, images: files});
                  }}
                />
                <p style={{color: '#999', fontSize: '12px', marginTop: '4px'}}>يمكنك رفع صور وفيديوهات</p>

              {/* Show existing images when editing — with remove and size tagging */}
              {editingProduct && keptImages && keptImages.length > 0 && (
                <div style={{marginTop: '12px'}}>
                  <p>الصور الحالية (اضغط ✕ لحذف):</p>
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px'}}>
                    {keptImages.map((image, index) => (
                      <div key={`existing-${index}`} style={{position: 'relative', width: '120px'}}>
                        <img
                          src={image.url}
                          alt={`Current ${index + 1}`}
                          className="image-preview"
                          style={{width: '100px', height: '100px', objectFit: 'cover'}}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newKept = keptImages.filter((_, i) => i !== index);
                            setKeptImages(newKept);
                            const newImageSizes = {...formData.imageSizes};
                            delete newImageSizes[image.url];
                            setFormData({...formData, imageSizes: newImageSizes});
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                        <div style={{marginTop: '4px'}}>
                          <select
                            value={formData.imageSizes[image.url] || 'all'}
                            onChange={(e) => setFormData({...formData, imageSizes: {...formData.imageSizes, [image.url]: e.target.value}})}
                            style={{width: '100px', fontSize: '11px', padding: '2px', borderRadius: '4px', border: '1px solid #ddd', direction: 'rtl'}}
                          >
                            <option value="all">جميع الأحجام</option>
                            {formData.sizes.filter(s => s.name).map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show newly selected images */}
              {formData.images && formData.images.length > 0 && (
                <div style={{marginTop: '12px'}}>
                  <p>{t('newImagesToUpload')} {formData.images.length} {t('selected')}</p>
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px'}}>
                    {formData.images.map((file, index) => {
                      const fakeUrl = `temp-${index}`;
                      return (
                        <div key={`new-${index}`} style={{position: 'relative'}}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New Preview ${index + 1}`}
                            className="image-preview"
                            style={{width: '100px', height: '100px', objectFit: 'cover'}}
                          />
                          <div style={{marginTop: '4px'}}>
                            <select
                              value={formData.imageSizes[fakeUrl] || 'all'}
                              onChange={(e) => setFormData({...formData, imageSizes: {...formData.imageSizes, [fakeUrl]: e.target.value}})}
                              style={{width: '100px', fontSize: '11px', padding: '2px', borderRadius: '4px', border: '1px solid #ddd', direction: 'rtl'}}
                            >
                              <option value="all">جميع الأحجام</option>
                              {formData.sizes.filter(s => s.name).map(s => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
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
        <div className="table-responsive">
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
                <td>
                  {product.sizes && product.sizes.length > 0 ? (
                    <span>{formatCurrency(product.sizes[0].price)}{product.sizes.length > 1 ? ` - ${formatCurrency(product.sizes[product.sizes.length - 1].price)}` : ''}</span>
                  ) : (
                    formatCurrency(product.price)
                  )}
                </td>
                <td>{product.stock}</td>
                <td>{product.active ? t('active') : t('inactive')}</td>
                <td>
                  <button onClick={() => handleEdit(product)} className="btn-secondary" style={{padding: '5px 10px', marginRight: '5px'}}>{t('edit')}</button>
                  <button onClick={() => handleDelete(product.id, product._id)} className="btn-danger" style={{padding: '5px 10px'}}>{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {hasMore && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button
              onClick={() => loadProducts(true)}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : 'تحميل المزيد من المنتجات'}
            </button>
          </div>
        )}
        {!hasMore && products.length > 12 && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', padding: '10px' }}>
            تم تحميل جميع المنتجات ({products.length})
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
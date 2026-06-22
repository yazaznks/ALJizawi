import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useOffers } from '../context/OfferContext';
import { useLanguage } from '../context/LanguageContext';

const AdminOffers = () => {
  const { products } = useProducts();
  const { offers, addOffer, updateOffer, deleteOffer } = useOffers();
  const { t, formatCurrency } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    buyProductId: '',
    buyQuantity: '1',
    buyProductSize: '',
    getProductId: '',
    getPrice: '',
    getProductSize: '',
    getLimit: ''
  });

  const resetForm = () => {
    setFormData({ buyProductId: '', buyQuantity: '1', buyProductSize: '', getProductId: '', getPrice: '', getProductSize: '', getLimit: '' });
    setEditingOffer(null);
    setShowForm(false);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      buyProductId: offer.buyProductId || '',
      buyQuantity: offer.buyQuantity ? offer.buyQuantity.toString() : '1',
      buyProductSize: offer.buyProductSize || '',
      getProductId: offer.getProductId || '',
      getPrice: offer.getPrice ? offer.getPrice.toString() : '',
      getProductSize: offer.getProductSize || '',
      getLimit: offer.getLimit ? offer.getLimit.toString() : ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (editingOffer) {
      result = await updateOffer(editingOffer.id, formData);
    } else {
      result = await addOffer(formData);
    }
    if (result.success) {
      resetForm();
    } else {
      alert('Error: ' + result.message);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      await deleteOffer(id);
    }
  };

  const getProductName = (productId) => {
    const p = products.find(pr => pr._id === productId);
    return p ? p.name : '(غير موجود)';
  };

  const getProductSizes = (productId) => {
    const p = products.find(pr => pr._id === productId);
    return p && p.sizes ? p.sizes : [];
  };

  return (
    <div className="container">
      <h1>العروض</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
        <Link to="/admin/ads">{t('ads')}</Link>
        <Link to="/admin/offers" style={{ background: 'rgba(99, 102, 241, 0.15)', fontWeight: '700' }}>العروض</Link>
      </div>

      <div style={{marginBottom: '20px'}}>
        <button
          onClick={() => { if (!showForm) { setShowForm(true); setEditingOffer(null); } else { resetForm(); } }}
          className="btn-primary"
        >
          {showForm ? '✖ إلغاء' : '➕ إضافة عرض جديد'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom: '20px'}}>
          <h2 style={{marginBottom: '20px'}}>{editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2>
          <form onSubmit={handleSubmit}>
            {/* اشتري Section */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px', color: '#92400e', fontSize: '20px' }}>🛒 اشتري</h3>
              <div className="form-group">
                <label>المنتج</label>
                <select
                  value={formData.buyProductId}
                  onChange={(e) => setFormData({...formData, buyProductId: e.target.value, buyProductSize: ''})}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                >
                  <option value="">-- اختر منتج --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {formData.buyProductId && (() => {
                const selectedProduct = products.find(p => p._id === formData.buyProductId);
                if (selectedProduct && selectedProduct.sizes && selectedProduct.sizes.length > 0) {
                  return (
                    <div className="form-group" style={{marginTop: '12px'}}>
                      <label>الحجم</label>
                      <select
                        value={formData.buyProductSize}
                        onChange={(e) => setFormData({...formData, buyProductSize: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                      >
                        <option value="">-- اختر الحجم --</option>
                        {selectedProduct.sizes.map((s, idx) => (
                          <option key={idx} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="form-group" style={{marginTop: '12px'}}>
                <label>الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={formData.buyQuantity}
                  onChange={(e) => setFormData({...formData, buyQuantity: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* واحصل على Section */}
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px', color: '#065f46', fontSize: '20px' }}>🎁 واحصل على</h3>
              <div className="form-group">
                <label>المنتج</label>
                <select
                  value={formData.getProductId}
                  onChange={(e) => setFormData({...formData, getProductId: e.target.value, getProductSize: ''})}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                >
                  <option value="">-- اختر منتج --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {formData.getProductId && (() => {
                const selectedProduct = products.find(p => p._id === formData.getProductId);
                if (!selectedProduct) return null;
                const hasSizes = selectedProduct.sizes && selectedProduct.sizes.length > 0;
                return (
                  <>
                    {hasSizes && (
                      <div className="form-group" style={{marginTop: '12px'}}>
                        <label>الحجم</label>
                        <select
                          value={formData.getProductSize}
                          onChange={(e) => setFormData({...formData, getProductSize: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                        >
                          <option value="">-- اختر الحجم --</option>
                          {selectedProduct.sizes.map((s, idx) => (
                            <option key={idx} value={s.name}>{s.name} - {formatCurrency(parseFloat(s.price))}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      background: '#f0fdf4',
                      borderRadius: '10px',
                      border: '1px solid #bbf7d0',
                      fontSize: '14px',
                      color: '#166534',
                      fontWeight: '600'
                    }}>
                      💰 السعر الحالي: {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                        <span>يبدأ من {formatCurrency(Math.min(...selectedProduct.sizes.map(s => parseFloat(s.price))))}</span>
                      ) : (
                        <span>{formatCurrency(selectedProduct.price)}</span>
                      )}
                      {selectedProduct.discountPercent > 0 && (
                        <span style={{marginRight: '8px', color: '#e74c3c'}}>| الخصم: {selectedProduct.discountPercent}%</span>
                      )}
                    </div>
                  </>
                );
              })()}
              <div className="form-group" style={{marginTop: '12px'}}>
                <label>السعر (د.أ)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.getPrice}
                  onChange={(e) => setFormData({...formData, getPrice: e.target.value})}
                  required
                  placeholder="مثال: 5.99"
                />
              </div>
              <div className="form-group" style={{marginTop: '12px'}}>
                <label>الحد الأقصى (0 = غير محدود)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.getLimit}
                  onChange={(e) => setFormData({...formData, getLimit: e.target.value})}
                  placeholder="0 = بدون حد أقصى"
                />
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button type="submit" className="btn-success">
                {editingOffer ? 'تحديث العرض' : 'إضافة العرض'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Current Offers List */}
      <div className="card">
        <h2>العروض الحالية</h2>
        {offers.length === 0 ? (
          <p style={{color: '#666', padding: '20px 0'}}>لا توجد عروض بعد. أضف عرضاً جديداً أعلاه.</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
            {offers.map(offer => (
              <div key={offer.id} style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fafafa'
              }}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '15px', fontWeight: '600', marginBottom: '4px'}}>
                    🛒 اشتري <strong>{offer.buyQuantity}</strong> من "{getProductName(offer.buyProductId)}" {offer.buyProductSize ? <span style={{color: '#6366f1'}}>(حجم: {offer.buyProductSize})</span> : ''}
                  </div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: '#065f46'}}>
                  🎁 واحصل على "{getProductName(offer.getProductId)}" {offer.getProductSize ? <span style={{color: '#6366f1'}}>(حجم: {offer.getProductSize})</span> : ''} بسعر <strong>{formatCurrency(offer.getPrice)}</strong> {offer.getLimit > 0 && <span style={{color: '#f97316', fontSize: '13px', fontWeight: '500'}}>(الحد الأقصى: {offer.getLimit})</span>}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    background: offer.active ? '#22c55e' : '#ef4444',
                    color: 'white'
                  }}>
                    {offer.active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => handleEdit(offer)} className="btn-secondary" style={{padding: '6px 12px', fontSize: '13px'}}>
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(offer.id)} className="btn-danger" style={{padding: '6px 12px', fontSize: '13px'}}>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOffers;
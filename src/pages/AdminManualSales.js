import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useSales } from '../context/SaleContext';
import { useLanguage } from '../context/LanguageContext';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقداً' },
  { value: 'card', label: 'بطاقة' },
  { value: 'transfer', label: 'تحويل بنكي' },
  { value: 'other', label: 'أخرى' }
];

const AdminManualSales = () => {
  const { t, formatCurrency } = useLanguage();
  const { products } = useProducts();
  const { createSale, updateSale } = useSales();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSizeName, setSelectedSizeName] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSale, setEditingSale] = useState(null);

  const activeProducts = products
    .filter(p => p.active)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

  const selectedProduct = activeProducts.find(p => p._id === selectedProductId);
  const selectedProductSizes = selectedProduct?.sizes || [];

  const getProductPrice = (product) => {
    if (product.sizes && product.sizes.length > 0) {
      return Math.min(...product.sizes.map(s => parseFloat(s.price)));
    }
    return product.discountPercent
      ? product.price * (100 - product.discountPercent) / 100
      : product.price;
  };

  const getSizePrice = (product, sizeName) => {
    if (!product.sizes) return product.price;
    const size = product.sizes.find(s => s.name === sizeName);
    if (!size) return product.price;
    const basePrice = parseFloat(size.price);
    return product.discountPercent
      ? basePrice * (100 - product.discountPercent) / 100
      : basePrice;
  };

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product._id && !i.selectedSize);
      if (existing) {
        return prev.map(i =>
          i.productId === product._id && !i.selectedSize
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      const price = getProductPrice(product);
      return [...prev, {
        productId: product._id,
        name: product.name,
        selectedSize: null,
        quantity: 1,
        unitPrice: price,
        lineTotal: price,
        discountPercent: product.discountPercent || 0
      }];
    });
  };

  const addSizeItem = (product, size) => {
    const price = getSizePrice(product, size.name);
    const key = `${product._id}_${size.name}`;
    setItems(prev => {
      const existing = prev.find(i => i.productId === product._id && i.selectedSize === size.name);
      if (existing) {
        return prev.map(i =>
          i.productId === product._id && i.selectedSize === size.name
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        selectedSize: size.name,
        quantity: 1,
        unitPrice: price,
        lineTotal: price,
        discountPercent: product.discountPercent || 0
      }];
    });
  };

  const updateItemQty = (index, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: q, lineTotal: q * item.unitPrice } : item
    ));
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const validDiscount = Math.min(Math.max(0, parseFloat(discount) || 0), subtotal);
  const total = subtotal - validDiscount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setMessage('❌ يجب إضافة منتج واحد على الأقل');
      return;
    }

    setSaving(true);
    setMessage('');

    const saleData = {
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        discountPercent: item.discountPercent
      })),
      subtotal,
      discount: validDiscount,
      total,
      paymentMethod,
      notes,
      createdBy: 'مدير النظام'
    };

    let result;
    if (editingSale) {
      result = await updateSale(editingSale.id, saleData, 'مدير النظام');
    } else {
      result = await createSale(saleData);
    }

    if (result.success) {
      setMessage('✅ ' + (editingSale ? 'تم تحديث البيع بنجاح!' : 'تم تسجيل البيع بنجاح!'));
      if (!editingSale) {
        setItems([]);
        setDiscount(0);
        setPaymentMethod('cash');
        setNotes('');
      }
    } else {
      setMessage('❌ خطأ: ' + result.message);
    }
    setSaving(false);
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setItems(sale.items.map(item => ({ ...item })));
    setDiscount(sale.discount || 0);
    setPaymentMethod(sale.paymentMethod || 'cash');
    setNotes(sale.notes || '');
    setMessage('');
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
    setItems([]);
    setDiscount(0);
    setPaymentMethod('cash');
    setNotes('');
    setMessage('');
  };

  return (
    <div className="container">
      <h1>{editingSale ? 'تعديل بيع يدوي' : 'مبيعات يدوية'}</h1>
      <div className="admin-nav">
        <Link to="/admin">لوحة التحكم</Link>
        <Link to="/admin/products">المنتجات</Link>
        <Link to="/admin/orders">الطلبات</Link>
        <Link to="/admin/ads">الإعلانات</Link>
        <Link to="/admin/offers">العروض</Link>
        <Link to="/admin/manual-sales" style={{ background: 'rgba(99, 102, 241, 0.15)', fontWeight: '700' }}>مبيعات يدوية</Link>

      </div>

      {message && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', background: message.includes('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.includes('✅') ? '#86efac' : '#fecaca'}`, borderRadius: '12px', fontWeight: '600', fontSize: '15px' }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '16px' }}>{editingSale ? 'تعديل الفاتورة' : 'فاتورة جديدة'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Product Select Dropdown */}
          <div className="form-group">
            <label>اختر منتج</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedSizeName('');
              }}
              style={{ marginBottom: '8px' }}
            >
              <option value="">-- اختر منتج --</option>
              {activeProducts.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name}
                  {product.sizes && product.sizes.length > 0
                    ? ` (${product.sizes.map(s => s.name).join(', ')})`
                    : ` - ${formatCurrency(getProductPrice(product))}`}
                </option>
              ))}
            </select>
          </div>

          {/* Size Select Dropdown */}
          {selectedProductId && selectedProductSizes.length > 0 && (
            <div className="form-group">
              <label>اختر الحجم</label>
              <select
                value={selectedSizeName}
                onChange={(e) => setSelectedSizeName(e.target.value)}
                style={{ marginBottom: '8px' }}
              >
                <option value="">-- اختر الحجم --</option>
                {selectedProductSizes.map(size => (
                  <option key={size.name} value={size.name}>
                    {size.name} - {formatCurrency(getSizePrice(selectedProduct, size.name))}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Button */}
          {selectedProductId && (!selectedProductSizes.length || selectedSizeName) && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (selectedProductSizes.length > 0 && selectedSizeName) {
                  const size = selectedProductSizes.find(s => s.name === selectedSizeName);
                  if (size) addSizeItem(selectedProduct, size);
                } else {
                  addItem(selectedProduct);
                }
                setSelectedProductId('');
                setSelectedSizeName('');
              }}
              style={{ marginBottom: '16px' }}
            >
              + إضافة إلى الفاتورة
            </button>
          )}

          {/* Items Table */}
          {items.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>المنتجات المضافة</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: '500px' }}>
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الحجم</th>
                      <th>سعر الوحدة</th>
                      <th>الكمية</th>
                      <th>المجموع</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td>{item.selectedSize || '—'}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQty(index, e.target.value)}
                            style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ fontWeight: '700', color: '#e74c3c' }}>{formatCurrency(item.lineTotal)}</td>
                        <td>
                          <button type="button" onClick={() => removeItem(index)} className="btn-danger" style={{ padding: '4px 10px', fontSize: '13px' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{
            marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>المجموع الفرعي:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>الخصم:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{ width: '100px', padding: '6px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}
                />
                <span>د.أ</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid #dee2e6', paddingTop: '10px' }}>
              <span>الإجمالي النهائي:</span>
              <span style={{ color: '#28a745' }}>{formatCurrency(total)}</span>
            </div>
          </div>

          {validDiscount < (parseFloat(discount) || 0) && (
            <p style={{ color: '#e74c3c', fontSize: '13px', marginTop: '4px' }}>⚠️ الخصم لا يمكن أن يتجاوز {formatCurrency(subtotal)}</p>
          )}

          {/* Payment & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label>طريقة الدفع</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>ملاحظات (اختياري)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn-success" disabled={saving || items.length === 0} style={{ flex: 1, fontSize: '16px', fontWeight: '700' }}>
              {saving ? 'جاري الحفظ...' : (editingSale ? '💾 تحديث الفاتورة' : '💾 تأكيد البيع')}
            </button>
            {editingSale && (
              <button type="button" onClick={handleCancelEdit} className="btn-secondary">إلغاء التعديل</button>
            )}
          </div>
        </form>
      </div>

      {/* Recent Sales */}
      <RecentSales onEdit={handleEditSale} formatCurrency={formatCurrency} />
    </div>
  );
};

// Recent Sales component
const RecentSales = ({ onEdit, formatCurrency }) => {
  const { sales } = useSales();

  const activeSales = sales.filter(s => s.status === 'active').slice(0, 10);

  if (activeSales.length === 0) return null;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '16px' }}>آخر المبيعات</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ</th>
              <th>عدد المنتجات</th>
              <th>المجموع</th>
              <th>طريقة الدفع</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeSales.map((sale, idx) => (
              <tr key={sale.id}>
                <td>{idx + 1}</td>
                <td>{new Date(sale.createdAt).toLocaleDateString('ar-JO')}</td>
                <td>{sale.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td style={{ fontWeight: '700', color: '#28a745' }}>{formatCurrency(sale.total)}</td>
                <td>{PAYMENT_METHODS.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}</td>
                <td>
                  <button onClick={() => onEdit(sale)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '13px' }}>تعديل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManualSales;
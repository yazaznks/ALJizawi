import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSales } from '../context/SaleContext';
import { useLanguage } from '../context/LanguageContext';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقداً' },
  { value: 'card', label: 'بطاقة' },
  { value: 'transfer', label: 'تحويل بنكي' },
  { value: 'other', label: 'أخرى' }
];

const AdminSalesHistory = () => {
  const { t, formatCurrency } = useLanguage();
  const { sales, cancelSale } = useSales();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedSale, setExpandedSale] = useState(null);
  const [message, setMessage] = useState('');

  const filteredSales = useMemo(() => {
    let result = sales;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(sale =>
        sale.items.some(item => item.name.toLowerCase().includes(q)) ||
        sale.notes?.toLowerCase().includes(q) ||
        sale.paymentMethod?.toLowerCase().includes(q) ||
        sale.createdBy?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(sale => sale.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(sale => new Date(sale.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(sale => new Date(sale.createdAt) <= to);
    }

    return result;
  }, [sales, search, statusFilter, dateFrom, dateTo]);

  const handleCancel = async (saleId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا البيع؟')) return;
    const result = await cancelSale(saleId, 'مدير النظام');
    if (result.success) {
      setMessage('✅ تم إلغاء البيع بنجاح');
    } else {
      setMessage('❌ خطأ: ' + result.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExportCSV = () => {
    const rows = [['#', 'التاريخ', 'المنتجات', 'المجموع الفرعي', 'الخصم', 'الإجمالي', 'طريقة الدفع', 'ملاحظات', 'الحالة', 'بواسطة']];
    filteredSales.forEach((sale, idx) => {
      rows.push([
        idx + 1,
        new Date(sale.createdAt).toLocaleDateString('ar-JO'),
        sale.items.map(i => `${i.name} (${i.quantity}x${formatCurrency(i.unitPrice)})`).join(' | '),
        formatCurrency(sale.subtotal),
        formatCurrency(sale.discount),
        formatCurrency(sale.total),
        PAYMENT_METHODS.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod,
        sale.notes || '',
        sale.status === 'active' ? 'نشط' : sale.status === 'cancelled' ? 'ملغي' : sale.status,
        sale.createdBy || ''
      ]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `المبيعات_اليدوية_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setMessage('✅ تم تصدير الملف بنجاح');
    setTimeout(() => setMessage(''), 3000);
  };

  const stats = useMemo(() => {
    const active = sales.filter(s => s.status === 'active');
    return {
      total: active.length,
      revenue: active.reduce((sum, s) => sum + s.total, 0),
      discount: active.reduce((sum, s) => sum + (s.discount || 0), 0),
      net: active.reduce((sum, s) => sum + s.total, 0)
    };
  }, [sales]);

  return (
    <div className="container">
      <h1>سجل المبيعات اليدوية</h1>
      <div className="admin-nav">
        <Link to="/admin">لوحة التحكم</Link>
        <Link to="/admin/products">المنتجات</Link>
        <Link to="/admin/orders">الطلبات</Link>
        <Link to="/admin/ads">الإعلانات</Link>
        <Link to="/admin/offers">العروض</Link>
        <Link to="/admin/manual-sales">مبيعات يدوية</Link>
        <Link to="/admin/sales-history" style={{ background: 'rgba(99, 102, 241, 0.15)', fontWeight: '700' }}>سجل المبيعات</Link>
      </div>

      {message && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', background: message.includes('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.includes('✅') ? '#86efac' : '#fecaca'}`, borderRadius: '12px', fontWeight: '600', fontSize: '15px' }}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #28a745' }}>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">إجمالي المبيعات</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="stat-value">{formatCurrency(stats.revenue)}</div>
          <div className="stat-label">إجمالي الإيرادات</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f97316' }}>
          <div className="stat-value">{formatCurrency(stats.discount)}</div>
          <div className="stat-label">إجمالي الخصومات</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #e74c3c' }}>
          <div className="stat-value">{sales.filter(s => s.status === 'cancelled').length}</div>
          <div className="stat-label">ملغية</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>بحث</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 بحث..."
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>الحالة</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>من تاريخ</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={handleExportCSV} className="btn-primary" style={{ width: '100%' }}>
              📥 تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>المبيعات ({filteredSales.length})</h2>
        {filteredSales.length === 0 ? (
          <p style={{ color: '#666', padding: '20px 0', textAlign: 'center' }}>لا توجد مبيعات</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSales.map((sale, idx) => {
              const isExpanded = expandedSale === sale.id;
              return (
                <div key={sale.id} style={{
                  border: `1px solid ${sale.status === 'cancelled' ? '#fecaca' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  background: sale.status === 'cancelled' ? '#fef2f2' : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong>#{idx + 1}</strong>
                      <span style={{ color: '#666', fontSize: '14px', marginRight: '10px' }}>
                        {new Date(sale.createdAt).toLocaleDateString('ar-JO')} — {new Date(sale.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px',
                        background: sale.status === 'active' ? '#22c55e' : '#ef4444', color: 'white', marginRight: '8px'
                      }}>
                        {sale.status === 'active' ? 'نشط' : 'ملغي'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '18px', color: sale.status === 'cancelled' ? '#999' : '#28a745' }}>
                        {formatCurrency(sale.total)}
                      </span>
                      <button onClick={() => setExpandedSale(isExpanded ? null : sale.id)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '13px' }}>
                        {isExpanded ? '▲' : '▼'}
                      </button>
                      {sale.status === 'active' && (
                        <button onClick={() => handleCancel(sale.id)} className="btn-danger" style={{ padding: '4px 10px', fontSize: '13px' }}>إلغاء</button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    <span>{PAYMENT_METHODS.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}</span>
                    {sale.createdBy && <span style={{ marginRight: '16px' }}>بواسطة: {sale.createdBy}</span>}
                    {sale.cancelledBy && <span style={{ marginRight: '16px', color: '#ef4444' }}>ملغي بواسطة: {sale.cancelledBy}</span>}
                    {sale.notes && <span style={{ marginRight: '16px' }}>📝 {sale.notes}</span>}
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                      <table className="table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>المنتج</th>
                            <th>الحجم</th>
                            <th>سعر الوحدة</th>
                            <th>الكمية</th>
                            <th>المجموع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items.map((item, i) => (
                            <tr key={i}>
                              <td>{item.name}</td>
                              <td>{item.selectedSize || '—'}</td>
                              <td>{formatCurrency(item.unitPrice)}</td>
                              <td>{item.quantity}</td>
                              <td style={{ fontWeight: '700' }}>{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ marginTop: '8px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>المجموع الفرعي: <strong>{formatCurrency(sale.subtotal)}</strong></span>
                          <span>الخصم: <strong style={{ color: '#f97316' }}>{formatCurrency(sale.discount || 0)}</strong></span>
                          <span>الإجمالي: <strong style={{ color: '#28a745' }}>{formatCurrency(sale.total)}</strong></span>
                        </div>
                      </div>
                      {sale.cancelledAt && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                          🗑️ ملغي في: {new Date(sale.cancelledAt).toLocaleDateString('ar-JO')} {sale.cancelledBy ? `بواسطة: ${sale.cancelledBy}` : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesHistory;
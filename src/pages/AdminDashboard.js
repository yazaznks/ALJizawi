import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';
import { useSales } from '../context/SaleContext';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const AdminDashboard = () => {
  const { t, formatCurrency } = useLanguage();
  const { products } = useProducts();
  const { sales } = useSales();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const ordersQuery = query(collection(db, 'ecommerce_orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setOrders(data);
    }, () => setOrders([]));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (orders.length === 0 && !loading) {
      setStats(null);
      setLoading(false);
      return;
    }
    if (orders.length === 0) return;

    const totalOrders = orders.filter(o => o.status !== 'cancelled').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const onlineRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const totalDiscounts = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => {
      const sub = o.pricing?.subtotal || 0;
      const disc = (sub - (o.pricing?.total || 0));
      return sum + Math.max(0, disc);
    }, 0);

    const activeSales = sales.filter(s => s.status === 'active');
    const manualRevenue = activeSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const manualDiscounts = activeSales.reduce((sum, s) => sum + (s.discount || 0), 0);
    const totalRevenue = onlineRevenue + manualRevenue;
    const totalDiscountsAll = totalDiscounts + manualDiscounts;

    const totalClients = new Set(orders.filter(o => o.status !== 'cancelled').map(o => o.customerInfo?.phone).filter(Boolean)).size;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const totalProducts = products.filter(p => p.active).length;
    const lowStock = products.filter(p => p.active && p.stock > 0 && p.stock < 5).length;
    const outOfStock = products.filter(p => p.active && p.stock === 0).length;

    // Top selling product from manual sales items (excluding cancelled orders)
    const productCounts = {};
    [...orders.filter(o => o.status !== 'cancelled'), ...activeSales].forEach(source => {
      (source.items || []).forEach(item => {
        const n = item.name || item.product || 'unknown';
        productCounts[n] = (productCounts[n] || 0) + (item.quantity || 1);
      });
    });
    const topSelling = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

    setStats({
      totalOrders,
      pendingOrders,
      onlineRevenue,
      manualRevenue,
      totalRevenue,
      totalDiscounts: totalDiscountsAll,
      totalClients,
      avgOrderValue,
      totalProducts,
      lowStock,
      outOfStock,
      topSelling: topSelling ? { name: topSelling[0], qty: topSelling[1] } : null
    });
    setLoading(false);
  }, [orders, sales, products]);

  // Revenue trend: last 7 days
  const revenueTrend = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const label = d.toLocaleDateString('ar-JO', { weekday: 'short', day: 'numeric' });
      const dayOnline = orders
        .filter(o => {
          const od = new Date(o.createdAt);
          return o.status !== 'cancelled' && od >= d && od < next;
        })
        .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
      const dayManual = sales
        .filter(s => {
          const sd = new Date(s.createdAt);
          return s.status === 'active' && sd >= d && sd < next;
        })
        .reduce((sum, s) => sum + (s.total || 0), 0);
      days.push({ label, online: dayOnline, manual: dayManual, total: dayOnline + dayManual });
    }
    return days;
  }, [orders, sales]);

  const maxTrend = Math.max(...revenueTrend.map(d => d.total), 1);

  // Top products from all sales (excluding cancelled orders)
  const topProducts = useMemo(() => {
    const counts = {};
    [...orders.filter(o => o.status !== 'cancelled'), ...sales.filter(s => s.status === 'active')].forEach(source => {
      (source.items || []).forEach(item => {
        const n = item.name || item.product || 'unknown';
        counts[n] = (counts[n] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders, sales]);

  const maxTop = topProducts.length ? topProducts[0][1] : 1;

  // Filters (memoized before early return to satisfy hooks rules)
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        (o.customerInfo?.name || '').toLowerCase().includes(q) ||
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.customerInfo?.phone || '').includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(o => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= to);
    }
    return result;
  }, [orders, search, dateFrom, dateTo]);

  const filteredSales = useMemo(() => {
    let result = sales;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.items?.some(i => (i.name || '').toLowerCase().includes(q)) ||
        (s.notes || '').toLowerCase().includes(q) ||
        (s.paymentMethod || '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(s => new Date(s.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(s => new Date(s.createdAt) <= to);
    }
    return result;
  }, [sales, search, dateFrom, dateTo]);

  if (loading) return <div className="loading">جاري التحميل...</div>;

  return (
    <div className="container">
      <h1>{t('dashboard')}</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
        <Link to="/admin/ads">{t('ads')}</Link>
        <Link to="/admin/offers">العروض</Link>
        <Link to="/admin/manual-sales">مبيعات يدوية</Link>
 
      </div>

 

      {/* Revenue Section */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '14px', fontSize: '18px', color: '#1e293b' }}>💰 الإيرادات</h2>
        <div className="stats-grid">
          <div className="stat-card" style={{ borderTop: '3px solid #10b981' }}>
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">إجمالي الإيرادات</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="stat-value">{formatCurrency(stats.onlineRevenue)}</div>
            <div className="stat-label">إيرادات أونلاين</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #6366f1' }}>
            <div className="stat-value">{formatCurrency(stats.manualRevenue)}</div>
            <div className="stat-label">إيرادات يدوية</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #f97316' }}>
            <div className="stat-value">{formatCurrency(stats.totalDiscounts)}</div>
            <div className="stat-label">الخصومات</div>
          </div>
        </div>
      </div>

      {/* Operations Section */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '14px', fontSize: '18px', color: '#1e293b' }}>⚙️ العمليات</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">إجمالي المبيعات</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingOrders}</div>
            <div className="stat-label">طلبات قيد الانتظار</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalClients}</div>
            <div className="stat-label">العملاء</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(stats.avgOrderValue)}</div>
            <div className="stat-label">متوسط قيمة الطلب</div>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '14px', fontSize: '18px', color: '#1e293b' }}>📦 المخزون</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">إجمالي المنتجات</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #f97316' }}>
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">منخفض المخزون</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}>
            <div className="stat-value">{stats.outOfStock}</div>
            <div className="stat-label">نفذت الكمية</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="stat-value" style={{ fontSize: '16px' }}>{stats.topSelling?.name || '—'}</div>
            <div className="stat-label">الأكثر مبيعاً ({stats.topSelling?.qty || 0})</div>
          </div>
        </div>
      </div>


      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Revenue Trend Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📈 الإيرادات (آخر 7 أيام)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {revenueTrend.map((day, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '60px', fontSize: '12px', color: '#666' }}>{day.label}</span>
                <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                  <div style={{
                    height: '18px', borderRadius: '4px',
                    background: '#3b82f6',
                    width: `${day.online ? (day.online / maxTrend) * 100 : 0}%`,
                    minWidth: day.online ? '4px' : '0',
                    transition: 'width 0.3s'
                  }} title={`أونلاين: ${formatCurrency(day.online)}`} />
                  <div style={{
                    height: '18px', borderRadius: '4px',
                    background: '#6366f1',
                    width: `${day.manual ? (day.manual / maxTrend) * 100 : 0}%`,
                    minWidth: day.manual ? '4px' : '0',
                    transition: 'width 0.3s'
                  }} title={`يدوي: ${formatCurrency(day.manual)}`} />
                </div>
                <span style={{ width: '70px', fontSize: '12px', fontWeight: '600', textAlign: 'left' }}>{formatCurrency(day.total)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', color: '#666' }}>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px', marginLeft: '4px' }}></span>أونلاين</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px', marginLeft: '4px' }}></span>يدوي</span>
            </div>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>🏆 المنتجات الأكثر مبيعاً</h3>
          {topProducts.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>لا توجد بيانات بعد</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topProducts.map(([name, qty], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['#10b981', '#3b82f6', '#6366f1', '#f97316', '#e74c3c'][i] || '#999', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: ['#10b981', '#3b82f6', '#6366f1', '#f97316', '#e74c3c'][i] || '#999', borderRadius: '3px', width: `${(qty / maxTop) * 100}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151', minWidth: '30px', textAlign: 'left' }}>{qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
     {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>بحث</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 بحث بالاسم، الرقم، الهاتف..."
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>من تاريخ</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {(search || dateFrom || dateTo) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }} className="btn-secondary" style={{ width: '100%' }}>
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Recent Activity */}
      <div className="card">
        <h3 style={{ marginBottom: '14px', fontSize: '16px' }}>🕐 آخر النشاطات</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {(() => {
            const recentOrders = filteredOrders.slice(0, 8).map(o => ({
              type: 'order',
              id: o.id,
              date: new Date(o.createdAt),
              label: `طلب ${o.orderNumber || ''} — ${o.customerInfo?.name || 'عميل'}`,
              amount: o.pricing?.total || 0,
              status: o.status
            }));
            const recentSales = filteredSales.slice(0, 8).map(s => ({
              type: 'sale',
              id: s.id,
              date: new Date(s.createdAt),
              label: `بيع يدوي — ${s.items?.[0]?.name || 'عدة منتجات'}${s.items?.length > 1 ? ` +${s.items.length - 1}` : ''}`,
              amount: s.total || 0,
              status: s.status
            }));
            const all = [...recentOrders, ...recentSales]
              .sort((a, b) => b.date - a.date)
              .slice(0, 12);
            if (all.length === 0) return <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>لا توجد نشاطات بعد</p>;
            return all.map((item, i) => (
              <div key={`${item.type}-${item.id}-${i}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: i < all.length - 1 ? '1px solid #f3f4f6' : 'none',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: item.type === 'order' ? '#3b82f6' : '#6366f1'
                  }} />
                  <span>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '6px',
                    background: item.status === 'active' ? '#dcfce7' : item.status === 'pending' ? '#fef3c7' : '#fef2f2',
                    color: item.status === 'active' ? '#166534' : item.status === 'pending' ? '#92400e' : '#991b1b'
                  }}>
                    {item.status === 'active' ? 'نشط' : item.status === 'pending' ? 'قيد الانتظار' : 'ملغي'}
                  </span>
                  <span style={{ fontWeight: '700', minWidth: '80px', textAlign: 'left' }}>{formatCurrency(item.amount)}</span>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdminNav from '../components/AdminNav';
import { useProducts } from '../context/ProductContext';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminOrders = () => {
  const { t, formatCurrency } = useLanguage();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterGovernorate, setFilterGovernorate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverGovernorate, setDriverGovernorate] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [showDriverConfirm, setShowDriverConfirm] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [confirmDriverId, setConfirmDriverId] = useState('');


  // Strip 962 prefix and leading 0 for display (e.g. "96278xxxx" -> "78xxxx")
  const normalizePhoneDisplay = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d]/g, '');
    cleaned = cleaned.replace(/^962/, '');
    return cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  };

  // Convert display number to full WhatsApp number (96278xxxxxxx)
  const toWhatsAppNumber = (displayNumber) => {
    if (!displayNumber) return '';
    let cleaned = displayNumber.replace(/[^\d]/g, '');
    cleaned = cleaned.replace(/^0+/, '');
    cleaned = cleaned.replace(/^962/, '');
    return '962' + cleaned;
  };

  // Load orders from Firestore with real-time updates
  useEffect(() => {
    const q = query(collection(db, 'ecommerce_orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load drivers from Firestore
  useEffect(() => {
    const q = query(collection(db, 'drivers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const driversData = [];
      querySnapshot.forEach((doc) => {
        driversData.push({ id: doc.id, ...doc.data() });
      });
      setDrivers(driversData);
    }, (error) => {
      console.error('Error loading drivers:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب بالكامل؟')) {
      try {
        await deleteDoc(doc(db, 'ecommerce_orders', orderId));
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('خطأ في حذف الطلب');
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      await updateDoc(doc(db, 'ecommerce_orders', orderId), updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!driverName || !driverGovernorate || !driverPhone) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }
    try {
      await addDoc(collection(db, 'drivers'), {
        name: driverName,
        governorate: driverGovernorate,
        phone: toWhatsAppNumber(driverPhone),
        createdAt: new Date().toISOString()
      });
      setDriverName('');
      setDriverGovernorate('');
      setDriverPhone('');
      setShowAddDriver(false);
    } catch (error) {
      console.error('Error adding driver:', error);
      alert('خطأ في إضافة السائق');
    }
  };

  // Jordan governorates
  const governorates = [
    'عمان', 'الزرقاء', 'إربد', 'البلقاء', 'الكرك', 'المفرق',
    'مأدبا', 'جرش', 'عجلون', 'العقبة', 'معان', 'الطفيلة'
  ];

  // Filter orders by governorate and status
  const filteredOrders = orders.filter(o => {
    if (filterGovernorate && o.shippingAddress?.governorate !== filterGovernorate) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'sent_to_driver': return '#3498db';
      case 'picked_up': return '#8e44ad';
      case 'payment_collected': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'قيد الإنتظار';
      case 'sent_to_driver': return 'تم إرسال الطلب إلى السائق';
      case 'picked_up': return 'تم تحميل الطلب';
      case 'payment_collected': return 'تم تحصيل المبلغ';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'قيد الإنتظار' },
    { value: 'sent_to_driver', label: 'تم إرسال الطلب إلى السائق' },
    { value: 'picked_up', label: 'تم تحميل الطلب' },
    { value: 'payment_collected', label: 'تم تحصيل المبلغ' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  // Selection management
  const toggleSelection = (orderId, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // Bulk status change - applies immediately when dropdown is selected
  const handleBulkStatusChangeWithStatus = async (status) => {
    if (!status || selectedIds.size === 0) return;
    const selectedOrders = filteredOrders.filter(o => selectedIds.has(o.id));
    const updates = selectedOrders.map(o => {
      const updateData = { status };
      return updateDoc(doc(db, 'ecommerce_orders', o.id), updateData);
    });
    await Promise.all(updates);
    setBulkStatus('');
    setSelectedIds(new Set());
  };

  // Format a single order item for WhatsApp
  const formatItemForWhatsApp = (item) => {
    const unitPrice = parseFloat(item.price);
    const formattedUnit = unitPrice % 1 === 0 ? unitPrice.toFixed(0) : unitPrice.toFixed(1);
    const lineTotal = unitPrice * item.quantity;
    const formattedTotal = lineTotal % 1 === 0 ? lineTotal.toFixed(0) : lineTotal.toFixed(1);
    const sizeText = item.selectedSize ? ` (${item.selectedSize})` : '';
    return `* ${item.name}${sizeText}: ${formattedUnit} د.أ × ${item.quantity} = ${formattedTotal} د.أ`;
  };

  // Get delivery timeline based on total items
  const getDeliveryTimeline = (totalItems) => {
    const count = totalItems || 0;
    if (count <= 5) return 'من 1 إلى 10 أيام';
    if (count <= 10) return 'من 1 إلى 7 أيام';
    if (count <= 20) return 'من 1 إلى 3 أيام';
    return 'خلال يومين'; 
  };

  // Send order confirmation to customer via WhatsApp
  const sendCustomerConfirmation = (order) => {
    const customerPhone = order.customerInfo?.phone;
    if (!customerPhone) {
      alert('لا يوجد رقم هاتف للعميل');
      return;
    }

    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const deliveryTimeline = getDeliveryTimeline(totalItems);

    const itemsList = order.items?.map(item => formatItemForWhatsApp(item)).join('\n') || '  لا توجد منتجات';
    const subtotal = parseFloat(order.pricing?.subtotal || 0);
    const shippingFee = parseFloat(order.pricing?.shippingFee || 0);
    const totalAmount = parseFloat(order.pricing?.total || 0);
    const formattedSubtotal = subtotal % 1 === 0 ? subtotal.toFixed(0) : subtotal.toFixed(1);
    const formattedShipping = shippingFee % 1 === 0 ? shippingFee.toFixed(0) : shippingFee.toFixed(1);
    const formattedTotal = totalAmount % 1 === 0 ? totalAmount.toFixed(0) : totalAmount.toFixed(1);
    const feeLabel = shippingFee === 0 ? 'مجاناً' : `${formattedShipping} د.أ`;

    const message =
     
      `مزارع ومشاتل الجيزاوي ترحب بكم\n\n` +
       `شكراً لطلبكم \n` +
      `تم استلام الطلب بنجاح، ونعمل حالياً على تجهيزه.\n\n` +
      `تفاصيل الطلب:\n${itemsList}\n\n` +
      `المجموع الفرعي: ${formattedSubtotal} د.أ\n` +
      `رسوم التوصيل: ${feeLabel}\n` +
      `الإجمالي: ${formattedTotal} د.أ\n\n` +
      `سيتواصل مندوب التوصيل معكم ${deliveryTimeline} لتأكيد الطلب وترتيب عملية التسليم.\n\n` +
      `شكراً لاختياركم مزارع ومشاتل الجيزاوي.`;
const encodedText = encodeURIComponent(message);

    const whatsappUrl = `https://wa.me/${toWhatsAppNumber(customerPhone)}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // Send driver assignment notification to customer
  const sendDriverNotification = (order) => {
    setConfirmOrderId(order.id);
    setConfirmDriverId(order.driverPhone || (drivers[0]?.phone || ''));
    setShowDriverConfirm(true);
  };

  const confirmSendDriverNotification = () => {
    const order = orders.find(o => o.id === confirmOrderId);
    if (!order) return;

    const customerPhone = order.customerInfo?.phone;
    if (!customerPhone) {
      alert('لا يوجد رقم هاتف للعميل');
      setShowDriverConfirm(false);
      return;
    }

    const selectedDriver = drivers.find(d => d.phone === confirmDriverId);
    const driverNameToUse = selectedDriver?.name || 'غير محدد';
    const driverPhoneToUse = confirmDriverId;

    const message =
      `🚚 طلبكم الآن مع السائق وجاهز للتسليم.\n\n` +
      `السائق: ${driverNameToUse}\n` +
      `رقم التواصل: ${normalizePhoneDisplay(driverPhoneToUse)}\n\n` +
      `شكراً لاختياركم مزارع ومشاتل الجيزاوي.`;

    const whatsappUrl = `https://wa.me/${toWhatsAppNumber(customerPhone)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowDriverConfirm(false);
  };

  // Format a single order for WhatsApp message
  const formatOrderForWhatsApp = (order, index) => {
    const itemsList = order.items?.map(item => formatItemForWhatsApp(item)).join('\n');
    const subtotal = parseFloat(order.pricing?.subtotal || 0);
    const shippingFee = parseFloat(order.pricing?.shippingFee || 0);
    const totalAmount = parseFloat(order.pricing?.total || 0);
    const formattedSubtotal = subtotal % 1 === 0 ? subtotal.toFixed(0) : subtotal.toFixed(1);
    const formattedShipping = shippingFee % 1 === 0 ? shippingFee.toFixed(0) : shippingFee.toFixed(1);
    const formattedTotal = totalAmount % 1 === 0 ? totalAmount.toFixed(0) : totalAmount.toFixed(1);
    const feeLabel = shippingFee === 0 ? 'مجاناً' : `${formattedShipping} د.أ`;

    return (
      `*طلب ${index + 1}: #${order.orderNumber}*\n` +
      `العميل: ${order.customerInfo?.name || 'غير محدد'}\n` +
      `رقم الهاتف: ${order.customerInfo?.phone || 'غير محدد'}\n` +
      `العنوان: ${order.shippingAddress?.governorate || ''}, ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.building || ''}\n` +
      `المنتجات:\n${itemsList || '  لا توجد منتجات'}\n` +
      `المجموع الفرعي: ${formattedSubtotal} د.أ\n` +
      `رسوم التوصيل: ${feeLabel} د.أ\n` +
      `الإجمالي: ${formattedTotal} د.أ\n` +
      `التاريخ: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}\n`
    );
  };

  // Send selected orders to driver via WhatsApp
  const sendToWhatsApp = async () => {
    if (selectedIds.size === 0) {
      alert('الرجاء اختيار طلب واحد على الأقل');
      return;
    }

    if (!selectedDriverId) {
      alert('الرجاء اختيار سائق');
      return;
    }

    const selectedDriver = drivers.find(d => d.id === selectedDriverId);
    if (!selectedDriver) return;

    const selectedOrders = filteredOrders.filter(o => selectedIds.has(o.id));

    // Auto-update all selected orders to "sent_to_driver" and save driver id and phone
    const batchUpdates = selectedOrders.filter(o => o.status !== 'sent_to_driver').map(o =>
      updateDoc(doc(db, 'ecommerce_orders', o.id), { 
        status: 'sent_to_driver', 
        driverId: selectedDriver.id,
        driverPhone: selectedDriver.phone 
      })
    );
    if (batchUpdates.length > 0) {
      await Promise.all(batchUpdates);
    }

    const separator = '------------------------\n\n';
    let message = '*توصيل الطلبات*\n';
    message += separator;

    selectedOrders.forEach((order, index) => {
      message += formatOrderForWhatsApp(order, index);
      message += separator;
    });

    message += 'تم إرسال الطلبات بنجاح';

    const whatsappUrl = `https://wa.me/${selectedDriver.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <div className="loading">{t('loadingOrders')}</div>;

  return (
    <div className="container">
      <h1>{t('manageOrders')}</h1>
      <AdminNav />

      <div className="card">
        {/* Add Driver Button */}
        <div style={{marginBottom: '15px', display: 'flex', justifyContent: 'flex-end'}}>
          <button
            onClick={() => setShowAddDriver(!showAddDriver)}
            className="btn-primary"
            style={{padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
          >
            {showAddDriver ? 'إلغاء' : '➕ إضافة سائق'}
          </button>
        </div>

        {/* Add Driver Form */}
        {showAddDriver && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{marginBottom: '15px', fontSize: '16px'}}>إضافة سائق جديد</h3>
            <form onSubmit={handleAddDriver}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px'}}>
                <div className="form-group" style={{margin: 0}}>
                  <label>اسم السائق *</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                    placeholder="اسم السائق"
                  />
                </div>
                <div className="form-group" style={{margin: 0}}>
                  <label>المحافظة *</label>
                  <select
                    value={driverGovernorate}
                    onChange={(e) => setDriverGovernorate(e.target.value)}
                    required
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{margin: 0}}>
                  <label>رقم الهاتف *</label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    required
                    placeholder="78xxxxxxx"
                    style={{direction: 'ltr'}}
                  />
                </div>
              </div>
              <button type="submit" className="btn-success" style={{padding: '8px 20px', fontSize: '14px', fontWeight: '600'}}>
                حفظ السائق
              </button>
            </form>
          </div>
        )}

        {/* Filters Row */}
        <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
          {/* Governorate Filter */}
          <label style={{fontWeight: '600', fontSize: '14px'}}>المحافظة:</label>
          <select
            value={filterGovernorate}
            onChange={(e) => setFilterGovernorate(e.target.value)}
            style={{padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '160px'}}
          >
            <option value="">الكل</option>
            {governorates.map(gov => (
              <option key={gov} value={gov}>
                {gov} ({orders.filter(o => o.shippingAddress?.governorate === gov).length})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <label style={{fontWeight: '600', fontSize: '14px'}}>الحالة:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '160px'}}
          >
            <option value="">الكل</option>
            <option value="pending">🟡 قيد الإنتظار ({orders.filter(o => o.status === 'pending').length})</option>
            <option value="sent_to_driver">🔵 تم إرسال الطلب إلى السائق ({orders.filter(o => o.status === 'sent_to_driver').length})</option>
            <option value="picked_up">🟣 تم تحميل الطلب ({orders.filter(o => o.status === 'picked_up').length})</option>
            <option value="payment_collected">✅ تم تحصيل المبلغ ({orders.filter(o => o.status === 'payment_collected').length})</option>
            <option value="cancelled">🔴 ملغي ({orders.filter(o => o.status === 'cancelled').length})</option>
          </select>

          {(filterGovernorate || filterStatus) && (
            <button
              onClick={() => { setFilterGovernorate(''); setFilterStatus(''); }}
              style={{padding: '6px 12px', borderRadius: '6px', border: '1px solid #e74c3c', background: 'white', color: '#e74c3c', cursor: 'pointer', fontSize: '13px', fontWeight: '500'}}
            >
              إلغاء التصفية
            </button>
          )}
          <span style={{color: '#666', fontSize: '13px'}}>
            {filterGovernorate || filterStatus ? `عرض ${filteredOrders.length} من ${orders.length} طلب` : `${orders.length} طلب`}
          </span>
        </div>

        {/* WhatsApp Send Section */}
        <div style={{
          marginBottom: '15px',
          padding: '16px',
          background: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center'
        }}>
          <span style={{fontWeight: '600', fontSize: '15px', color: '#166534'}}>📱 إرسال إلى السائق عبر واتساب</span>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #86efac',
              fontSize: '14px'
            }}
          >
            <option value="">اختر السائق...</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name} - {driver.governorate} ({normalizePhoneDisplay(driver.phone)})
              </option>
            ))}
          </select>
          <button
            onClick={sendToWhatsApp}
            className="btn-success"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              opacity: selectedIds.size === 0 ? 0.6 : 1
            }}
            disabled={selectedIds.size === 0}
          >
            📨 إرسال ({selectedIds.size}) طلب
          </button>
        </div>

        <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th style={{width: '40px'}}>
                <input
                  type="checkbox"
                  checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                  onChange={selectAll}
                  style={{width: '18px', height: '18px', cursor: 'pointer'}}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th>{t('customer')}</th>
              <th>المحافظة</th>
              <th>{t('total')}</th>
              <th>{t('status')}</th>
              <th>{t('date')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                  لا توجد طلبات
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isChecked = selectedIds.has(order.id);
                return (
                <tr
                  key={order.id || order.orderNumber}
                  style={{
                    cursor: 'pointer',
                    background: isChecked ? '#f0fdf4' : 'transparent'
                  }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td onClick={(e) => toggleSelection(order.id, e)}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{width: '18px', height: '18px', cursor: 'pointer'}}
                    />
                  </td>
                  <td>{order.customerInfo?.name}</td>
                  <td>{order.shippingAddress?.governorate}</td>
                  <td>{formatCurrency(order.pricing?.total)}</td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      background: getStatusColor(order.status)
                    }}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                      <button
                        onClick={() => sendCustomerConfirmation(order)}
                        className="btn-success"
                        style={{padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap'}}
                        title="إرسال تأكيد للعميل"
                      >
                        📱
                      </button>
                      {order.status === 'picked_up' && (
                        <button
                          onClick={() => sendDriverNotification(order)}
                          className="btn-primary"
                          style={{padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap'}}
                          title="إشعار العميل بوصول السائق"
                        >
                          🚚
                        </button>
                      )}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{padding: '6px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', minWidth: '120px'}}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {/* Bulk Actions Footer */}
        {selectedIds.size > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: '#f8f9fa',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{fontSize: '13px', color: '#666'}}>({selectedIds.size} محدد)</span>
            <select
              value={bulkStatus}
              onChange={(e) => {
                setBulkStatus(e.target.value);
                if (e.target.value) {
                  handleBulkStatusChangeWithStatus(e.target.value);
                }
              }}
              style={{padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', minWidth: '140px'}}
            >
              <option value="">تغيير الحالة...</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={async () => {
                if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} طلب؟`)) {
                  const deletes = filteredOrders.filter(o => selectedIds.has(o.id)).map(o => deleteDoc(doc(db, 'ecommerce_orders', o.id)));
                  await Promise.all(deletes);
                  setSelectedIds(new Set());
                }
              }}
              className="btn-danger"
              style={{padding: '6px 12px', fontSize: '13px', fontWeight: '600'}}
            >
              🗑 حذف المحدد
            </button>
          </div>
        )}
      </div>

      {/* Driver Confirmation Modal */}
      {showDriverConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }} onClick={() => setShowDriverConfirm(false)}>
          <div className="card" style={{
            maxWidth: '420px', width: '90%', maxHeight: '85vh', overflow: 'auto', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDriverConfirm(false)}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
              }}
            >✕</button>

            <h3 style={{marginBottom: '12px', fontSize: '16px'}}>تأكيد إرسال إشعار السائق</h3>
            <p style={{marginBottom: '12px', color: '#444'}}>يرجى اختيار السائق الذي تريد إرسال الإشعار باسمه:</p>

            <select
              value={confirmDriverId}
              onChange={(e) => setConfirmDriverId(e.target.value)}
              style={{width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '16px'}}
            >
              <option value="">اختر السائق...</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.phone}>{driver.name} - {normalizePhoneDisplay(driver.phone)}</option>
              ))}
            </select>

            <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowDriverConfirm(false)} className="btn-secondary" style={{padding: '8px 14px', fontSize: '13px'}}>إلغاء</button>
              <button onClick={confirmSendDriverNotification} className="btn-primary" style={{padding: '8px 14px', fontSize: '13px'}}>تأكيد الإرسال</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={() => setSelectedOrder(null)}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >✕</button>

            <h2 style={{marginBottom: '20px'}}>تفاصيل الطلب</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>رقم الطلب: <strong>{selectedOrder.orderNumber}</strong></p>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>معلومات العميل</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <tbody>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600', width: '120px'}}>الاسم:</td><td style={{padding: '6px 10px'}}>{selectedOrder.customerInfo?.name}</td></tr>
                  {selectedOrder.driverPhone && (
                    <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>رقم السائق:</td><td style={{padding: '6px 10px', direction: 'ltr', textAlign: 'left'}}>{normalizePhoneDisplay(selectedOrder.driverPhone)}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>عنوان التوصيل</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <tbody>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600', width: '120px'}}>المحافظة:</td><td style={{padding: '6px 10px'}}>{selectedOrder.shippingAddress?.governorate}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>المنطقة:</td><td style={{padding: '6px 10px'}}>{selectedOrder.shippingAddress?.street}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>رقم البناية أو مَعلَم قريب:</td><td style={{padding: '6px 10px'}}>{selectedOrder.shippingAddress?.building}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>المنتجات</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr style={{background: '#f8f9fa'}}>
                      <th style={{padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #ddd'}}>الصورة</th>
                      <th style={{padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #ddd'}}>المنتج</th>
          
                      <th style={{padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #ddd'}}>الكمية</th>
                      
                      <th style={{padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd'}}>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => {
                    const product = products.find(p => p._id === item.product);
                    const itemImage = product?.images?.[0]?.url;
                    return (
                    <tr key={index}>
                      <td style={{padding: '8px 10px', borderBottom: '1px solid #eee'}}>
                        {itemImage ? (
                          <img src={itemImage} alt={item.name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px'}} />
                        ) : (
                          <div style={{width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999'}}>لا توجد</div>
                        )}
                      </td>
                      <td style={{padding: '8px 10px', borderBottom: '1px solid #eee'}}>
                        {item.name} - 
                        {formatCurrency(item.price)}
                        {item.selectedSize && (
                          <span style={{display: 'block', fontSize: '12px', color: '#666', marginTop: '2px'}}>
                            الحجم: {item.selectedSize}
                          </span>
                        )}
                      </td>
                      <td style={{padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #eee'}}>{item.quantity}</td>
                     
                      <td style={{padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #eee'}}>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>المجموع</h3>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <tbody>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600', width: '120px'}}>المجموع الفرعي:</td><td style={{padding: '6px 10px'}}>{formatCurrency(selectedOrder.pricing?.subtotal)}</td></tr>
                  <tr><td style={{padding: '6px 10px', fontWeight: '600'}}>رسوم التوصيل:</td><td style={{padding: '6px 10px'}}>{formatCurrency(selectedOrder.pricing?.shippingFee)}</td></tr>
                  <tr style={{fontWeight: 'bold', fontSize: '18px'}}><td style={{padding: '6px 10px', borderTop: '2px solid #333'}}>الإجمالي:</td><td style={{padding: '6px 10px', borderTop: '2px solid #333', color: '#27ae60'}}>{formatCurrency(selectedOrder.pricing?.total)}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{marginBottom: '10px'}}>
              <h3 style={{fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #eee', paddingBottom: '8px'}}>حالة الطلب</h3>
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  handleStatusChange(selectedOrder.id, e.target.value);
                  setSelectedOrder({...selectedOrder, status: e.target.value});
                }}
                style={{padding: '8px 12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', width: '100%'}}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <p style={{color: '#999', fontSize: '12px', marginTop: '20px'}}>
              تاريخ الطلب: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
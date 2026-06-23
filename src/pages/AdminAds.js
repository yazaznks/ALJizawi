import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBanner } from '../context/BannerContext';
import { useLanguage } from '../context/LanguageContext';

const AdminAds = () => {
  const { banners, addBanner, deleteBanner } = useBanner();
  const { t } = useLanguage();
  const [bannerType, setBannerType] = useState('text');
  const [bannerContent, setBannerContent] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerVideoFile, setBannerVideoFile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const videoFileInputRef = useRef(null);
  const imageFileInputRef = useRef(null);

  const handleAddBanner = async (e) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');
    const bannerData = {
      type: bannerType,
      content: bannerContent,
      active: true,
      imageFile: bannerImageFile
    };
    // If video type and a file is uploaded, pass the video file
    if (bannerType === 'video') {
      bannerData.videoFile = bannerVideoFile;
    }
    const result = await addBanner(bannerData);
      if (result.success) {
        setMessage('تم إضافة البانر بنجاح!');
      setBannerType('text');
      setBannerContent('');
      setBannerImageFile(null);
      setBannerVideoFile(null);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      } else {
        setMessage('خطأ في إضافة البانر: ' + result.message);
    }
    setAdding(false);
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البانر؟')) {
      await deleteBanner(id);
    }
  };

  return (
    <div className="container">
      <h1>{t('ads')}</h1>
      <div className="admin-nav">
        <Link to="/admin">{t('dashboard')}</Link>
        <Link to="/admin/products">{t('products')}</Link>
        <Link to="/admin/orders">{t('orders')}</Link>
        <Link to="/admin/ads">{t('ads')}</Link>
        <Link to="/admin/offers">العروض</Link>
        <Link to="/admin/manual-sales">مبيعات يدوية</Link>
      
      </div>

      <div className="card" style={{marginTop: '30px'}}>
        <h2>إضافة بانر جديد</h2>
        <p>أضف إعلانات تظهر في أعلى صفحة المنتجات في معرض منزلق.</p>

        <form onSubmit={handleAddBanner}>
          <div className="form-group">
            <label>نوع البانر</label>
            <select value={bannerType} onChange={(e) => { setBannerType(e.target.value); setBannerImageFile(null); }}>
              <option value="text">نص</option>
              <option value="video">فيديو (رابط التضمين)</option>
              <option value="image">صورة</option>
            </select>
          </div>

          <div className="form-group">
            {bannerType === 'video' ? (
              <>
                <label>رابط تضمين الفيديو (اختياري، مثل رابط يوتيوب)</label>
                <input
                  type="text"
                  value={bannerContent}
                  onChange={(e) => setBannerContent(e.target.value)}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <label style={{marginTop: '16px', display: 'block'}}>أو ارفع ملف فيديو خاص بك</label>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setBannerVideoFile(file);
                  }}
                />
                {bannerVideoFile && (
                  <p style={{marginTop: '8px', fontSize: '14px', color: '#666'}}>تم اختيار: {bannerVideoFile.name}</p>
                )}
              </>
            ) : bannerType === 'image' ? (
               <>
                <label>ارفع صورة البانر</label>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setBannerImageFile(file);
                    setBannerVideoFile(null);
                  }}
                />
                {bannerImageFile && (
                  <p style={{marginTop: '8px', fontSize: '14px', color: '#666'}}>تم اختيار: {bannerImageFile.name}</p>
                )}
              </>
            ) : (
              <>
                <label>نص البانر</label>
                <textarea
                  value={bannerContent}
                  onChange={(e) => setBannerContent(e.target.value)}
                  rows="3"
                  placeholder="أدخل نص الإعلان هنا..."
                />
              </>
            )}
          </div>

          {message && (
            <p style={{color: message.includes('Error') ? 'red' : 'green', marginBottom: '10px'}}>{message}</p>
          )}

          <button type="submit" className="btn-primary" disabled={adding}>
            {adding ? 'جاري الإضافة...' : 'إضافة بانر'}
          </button>
        </form>

        <div style={{marginTop: '30px'}}>
          <h3>البانرات الحالية ({banners.filter(b => b.active).length} نشط)</h3>
          {banners.length === 0 ? (
            <p style={{color: '#666'}}>لا توجد بانرات بعد. أضف واحداً أعلاه.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
              {banners.map(banner => (
                <div key={banner.id} style={{padding: '15px', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{flex: 1}}>
                    <strong>{banner.type === 'text' ? 'نص' : banner.type === 'video' ? 'فيديو' : 'صورة'}</strong>
                    {banner.type === 'video' && (
                      <span style={{marginLeft: '10px', color: '#666'}}>
                        {banner.videoData ? '[فيديو مرفوع]' : banner.content}
                      </span>
                    )}
                    {banner.type === 'text' && <span style={{marginLeft: '10px', color: '#666'}}>{banner.content}</span>}
                    {banner.type === 'image' && banner.imageData && (
                      <img src={banner.imageData} alt="Banner" style={{maxWidth: '100px', maxHeight: '50px', objectFit: 'cover', borderRadius: '4px', marginLeft: '10px'}} />
                    )}
                    <span style={{marginLeft: '10px', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', background: banner.active ? '#28a745' : '#dc3545', color: 'white'}}>
                      {banner.active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteBanner(banner.id)} className="btn-danger" style={{padding: '5px 10px'}}>حذف</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAds;
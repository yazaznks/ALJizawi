import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBanner } from '../context/BannerContext';
//import { useLanguage } from '../context/LanguageContext';

const Admin = () => {
  //const { t } = useLanguage();
  const { banner, saveBanner } = useBanner();
  const [bannerType, setBannerType] = useState(banner?.type || 'text');
  const [bannerContent, setBannerContent] = useState(banner?.content || '');
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerActive, setBannerActive] = useState(banner?.active !== false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const result = await saveBanner({
      type: bannerType,
      content: bannerContent,
      active: bannerActive,
      imageFile: bannerImageFile
    });
    if (result.success) {
      setMessage('Banner saved successfully!');
    } else {
      setMessage('Error saving banner: ' + result.message);
    }
    setSaving(false);
  };

  return (
    <div className="container">
      <h1>Admin Panel</h1>
      <div className="admin-nav">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/main">Admin</Link>
      </div>

      <div className="card">
        <h2>Welcome to Admin Panel</h2>
        <p>This is the main admin page. Use the navigation above to manage different aspects of the application.</p>

        <div className="admin-actions">
          <div className="action-card">
            <h3>Dashboard</h3>
            <p>View statistics and overview</p>
            <Link to="/admin" className="btn">Go to Dashboard</Link>
          </div>

          <div className="action-card">
            <h3>Products</h3>
            <p>Manage product inventory</p>
            <Link to="/admin/products" className="btn">Manage Products</Link>
          </div>

          <div className="action-card">
            <h3>Orders</h3>
            <p>View and manage orders</p>
            <Link to="/admin/orders" className="btn">View Orders</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop: '30px'}}>
        <h2>Manage Banner Ad</h2>
        <p>Set a banner ad that appears at the top of the products page.</p>

        <form onSubmit={handleSaveBanner}>
          <div className="form-group">
            <label>Banner Type</label>
            <select value={bannerType} onChange={(e) => { setBannerType(e.target.value); setBannerImageFile(null); }}>
              <option value="text">Text</option>
              <option value="video">Video (Embed URL)</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div className="form-group">
            {bannerType === 'video' ? (
              <>
                <label>Video Embed URL (e.g., YouTube embed link)</label>
                <input
                  type="text"
                  value={bannerContent}
                  onChange={(e) => setBannerContent(e.target.value)}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
              </>
            ) : bannerType === 'image' ? (
              <>
                <label>Upload Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setBannerImageFile(file);
                  }}
                />
                {bannerImageFile && (
                  <p style={{marginTop: '8px', fontSize: '14px', color: '#666'}}>Selected: {bannerImageFile.name}</p>
                )}
                {banner?.imageData && !bannerImageFile && (
                  <div style={{marginTop: '8px'}}>
                    <img src={banner.imageData} alt="Current banner" style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px'}} />
                  </div>
                )}
              </>
            ) : (
              <>
                <label>Banner Text</label>
                <textarea
                  value={bannerContent}
                  onChange={(e) => setBannerContent(e.target.value)}
                  rows="3"
                  placeholder="Enter your banner text here..."
                />
              </>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={(e) => setBannerActive(e.target.checked)}
                style={{width: 'auto', marginRight: '10px'}}
              />
              Active
            </label>
          </div>

          {message && (
            <p style={{color: message.includes('Error') ? 'red' : 'green', marginBottom: '10px'}}>{message}</p>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Banner'}
          </button>
        </form>

        {banner && (banner.content || banner.imageData) && (
          <div style={{marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px'}}>
            <h3>Preview</h3>
            {banner.type === 'video' ? (
              <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', marginTop: '10px'}}>
                <iframe
                  src={banner.content}
                  title="Banner Preview"
                  style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none'}}
                  allowFullScreen
                />
              </div>
            ) : banner.type === 'image' ? (
              <div style={{marginTop: '10px'}}>
                <img src={banner.imageData} alt="Banner" style={{maxWidth: '100%', maxHeight: '300px', borderRadius: '8px'}} />
              </div>
            ) : (
              <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginTop: '10px'}}>
                {banner.content}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

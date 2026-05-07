import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBanner } from '../context/BannerContext';

const Admin = () => {
  const { banners, addBanner, deleteBanner } = useBanner();
  const [bannerType, setBannerType] = useState('text');
  const [bannerContent, setBannerContent] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddBanner = async (e) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');
    const result = await addBanner({
      type: bannerType,
      content: bannerContent,
      active: true,
      imageFile: bannerImageFile
    });
    if (result.success) {
      setMessage('Banner added successfully!');
      setBannerType('text');
      setBannerContent('');
      setBannerImageFile(null);
    } else {
      setMessage('Error adding banner: ' + result.message);
    }
    setAdding(false);
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm('Delete this banner?')) {
      await deleteBanner(id);
    }
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
        <h2>Manage Banners</h2>
        <p>Add banners that appear at the top of the products page in a sliding carousel.</p>

        <form onSubmit={handleAddBanner}>
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

          {message && (
            <p style={{color: message.includes('Error') ? 'red' : 'green', marginBottom: '10px'}}>{message}</p>
          )}

          <button type="submit" className="btn-primary" disabled={adding}>
            {adding ? 'Adding...' : 'Add Banner'}
          </button>
        </form>

        <div style={{marginTop: '30px'}}>
          <h3>Current Banners ({banners.filter(b => b.active).length} active)</h3>
          {banners.length === 0 ? (
            <p style={{color: '#666'}}>No banners yet. Add one above.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
              {banners.map(banner => (
                <div key={banner.id} style={{padding: '15px', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{flex: 1}}>
                    <strong>{banner.type}</strong>
                    {banner.type === 'video' && <span style={{marginLeft: '10px', color: '#666'}}>{banner.content}</span>}
                    {banner.type === 'text' && <span style={{marginLeft: '10px', color: '#666'}}>{banner.content}</span>}
                    {banner.type === 'image' && banner.imageData && (
                      <img src={banner.imageData} alt="Banner" style={{maxWidth: '100px', maxHeight: '50px', objectFit: 'cover', borderRadius: '4px', marginLeft: '10px'}} />
                    )}
                    <span style={{marginLeft: '10px', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', background: banner.active ? '#28a745' : '#dc3545', color: 'white'}}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteBanner(banner.id)} className="btn-danger" style={{padding: '5px 10px'}}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

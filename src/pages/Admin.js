import React from 'react';
import { Link } from 'react-router-dom';
//import { useLanguage } from '../context/LanguageContext';

const Admin = () => {
  //const { t } = useLanguage();

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
    </div>
  );
};

export default Admin;
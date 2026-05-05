import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    if (!showLogin) {
      setShowLogin(true);
      return null; // Don't render anything initially
    }

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        await login(email, password);
        setShowLogin(false);
        setError('');
      } catch (err) {
        setError(err.message);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div className="card" style={{maxWidth: '400px', width: '90%'}}>
          <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@ecommerce.com"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>
            {error && <div className="error" style={{marginBottom: '15px'}}>{error}</div>}
            <button type="submit" className="btn-primary" style={{width: '100%'}}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (adminOnly && !user) {
    return <div className="container"><p>Access denied.</p></div>;
  }

  return children;
};

export default PrivateRoute;

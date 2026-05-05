import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h1>{t('login')}</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('email')}</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={loading}>
            {loading ? t('loggingIn') : t('signIn')}
          </button>
        </form>
        <p style={{marginTop: '20px', textAlign: 'center'}}>
          {t('dontHaveAccount')} <Link to="/register">{t('register')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

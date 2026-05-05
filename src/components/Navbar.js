import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import LoginModal from './LoginModal';
import logo from "../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { t, toggleLanguage, language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    closeMenu();
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLoginSuccess = () => {
    navigate('/admin');
  };

  return (
    <nav className="navbar ">
      <div className="container">
        <Link to="/" className="navbar-brand" >
          <img src={logo} alt="Logo" style={{ height: "250px", marginBottom:"-15px"  }}/>
        </Link>
        <button className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`navbar-nav ${isMenuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={closeMenu}>{t('home')}</Link></li>
          <li><Link to="/products" onClick={closeMenu}>{t('products')}</Link></li>
          <li>
            <Link to="/cart" onClick={closeMenu}>
              {t('cart')} {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
            </Link>
          </li>
           {user && (
             <>
               {isAdmin && (
                 <>
                   <li><Link to="/admin" onClick={closeMenu}>{t('admin')}</Link></li>
                   <li><Link to="/admin/main" onClick={closeMenu}>Admin Panel</Link></li>
                 </>
               )}
               <li><span>{language === 'ar' ? 'مرحباً' : 'Hi'}, {user.name}</span></li>
               <li><button onClick={() => { logout(); closeMenu(); }} className="btn-secondary" style={{padding: '5px 15px'}}>{t('logout')}</button></li>
             </>
           )}
          {!user && (
            <li>
              <button
                onClick={openLoginModal}
                className="btn-secondary"
                style={{padding: '5px 15px'}}
              >
                Admin Login
              </button>
            </li>
          )}
          <li>
            <button
              onClick={() => { toggleLanguage(); closeMenu(); }}
              className="btn-secondary"
              style={{padding: '5px 15px', marginLeft: '10px'}}
              title={t('language')}
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </button>
          </li>
        </ul>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </nav>
  );
};

export default Navbar;

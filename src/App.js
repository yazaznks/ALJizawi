import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { BannerProvider } from './context/BannerContext';
import { OfferProvider } from './context/OfferContext';
import Navbar from './components/Navbar';
import CartStickyBar from './components/CartStickyBar';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';


import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminOffers from './pages/AdminOffers';

import AdminAds from './pages/AdminAds';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ProductProvider>
            <BannerProvider>
            <OfferProvider>
            <CartProvider>
            <Router>
            <div className="App">
              <Navbar />
              <CartStickyBar />
              <Routes>
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute adminOnly={true}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <PrivateRoute adminOnly={true}>
                    <AdminProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <PrivateRoute adminOnly={true}>
                    <AdminOrders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/ads"
                element={
                  <PrivateRoute adminOnly={true}>
                    <AdminAds />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/offers"
                element={
                  <PrivateRoute adminOnly={true}>
                    <AdminOffers />
                  </PrivateRoute>
                }
              />
              </Routes>
            </div>
          </Router>
          </CartProvider>
          </OfferProvider>
        </BannerProvider>
        </ProductProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
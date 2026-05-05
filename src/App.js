import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';


import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import Admin from './pages/Admin';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <Router>
            <div className="App">
              <Navbar />
              <Routes>
              <Route path="/" element={<Home />} />
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
                path="/admin/main"
                element={
                  <PrivateRoute adminOnly={true}>
                    <Admin />
                  </PrivateRoute>
                }
              />
              </Routes>
            </div>
          </Router>
        </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

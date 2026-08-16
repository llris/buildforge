import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetails from './pages/ProductDetails';
import ComparisonPage from './pages/ComparisonPage';
import PCBuilder from './pages/PCBuilder';
import SavedBuilds from './pages/SavedBuilds';
import ShoppingCart from './pages/ShoppingCart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import InventoryManagement from './pages/InventoryManagement';
import OrderManagement from './pages/OrderManagement';
import UserReviewManagement from './pages/UserReviewManagement';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="products" element={<ProductCatalog />} />
                <Route path="products/:slug" element={<ProductDetails />} />
                <Route path="compare" element={<ComparisonPage />} />
                <Route path="builder" element={<PCBuilder />} />
                
                {/* Cart and Wishlist */}
                <Route path="cart" element={<ShoppingCart />} />
                <Route path="wishlist" element={<Wishlist />} />

                {/* Protected Routes */}
                <Route path="builds" element={<ProtectedRoute><SavedBuilds /></ProtectedRoute>} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="admin/products" element={<AdminRoute><ProductManagement /></AdminRoute>} />
                <Route path="admin/inventory" element={<AdminRoute><InventoryManagement /></AdminRoute>} />
                <Route path="admin/orders" element={<AdminRoute><OrderManagement /></AdminRoute>} />
                <Route path="admin/users" element={<AdminRoute><UserReviewManagement /></AdminRoute>} />
              </Route>
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

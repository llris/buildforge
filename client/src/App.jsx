import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetails from './pages/ProductDetails';
import CategoryPage from './pages/CategoryPage';
import SearchResults from './pages/SearchResults';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="catalog" element={<ProductCatalog />} />
          <Route path="product/:slug" element={<ProductDetails />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="builder" element={<PCBuilder />} />
          <Route path="builds" element={<SavedBuilds />} />
          <Route path="cart" element={<ShoppingCart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="tracking" element={<OrderTracking />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/products" element={<ProductManagement />} />
          <Route path="admin/inventory" element={<InventoryManagement />} />
          <Route path="admin/orders" element={<OrderManagement />} />
          <Route path="admin/users" element={<UserReviewManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

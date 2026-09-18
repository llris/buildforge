import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers & Error Boundaries
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import PageLoader from './components/Common/PageLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

// Layouts
import Layout from './components/Layout';
import AdminLayout from './components/Admin/AdminLayout';

// Storefront Pages (Lazy Loaded)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const PCBuilder = lazy(() => import('./pages/PCBuilder'));
const BuildGallery = lazy(() => import('./pages/BuildGallery'));
const SharedBuildDetails = lazy(() => import('./pages/SharedBuildDetails'));
const SavedBuilds = lazy(() => import('./pages/SavedBuilds'));
const ShoppingCart = lazy(() => import('./pages/ShoppingCart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Copyright = lazy(() => import('./pages/Copyright'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProductManagement = lazy(() => import('./pages/ProductManagement'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));
const OrderManagement = lazy(() => import('./pages/OrderManagement'));
const ReturnManagement = lazy(() => import('./pages/ReturnManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ModerationManagement = lazy(() => import('./pages/ModerationManagement'));
const CouponManagement = lazy(() => import('./pages/CouponManagement'));
const AuditLogViewer = lazy(() => import('./pages/AuditLogViewer'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Storefront Routes */}
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
                      <Route path="gallery" element={<BuildGallery />} />
                      <Route path="builds/:shareId" element={<SharedBuildDetails />} />
                      <Route path="builds/shared/:shareId" element={<SharedBuildDetails />} />
                      <Route path="terms" element={<Terms />} />
                      <Route path="disclaimer" element={<Disclaimer />} />
                      <Route path="privacy" element={<Privacy />} />
                      <Route path="copyright" element={<Copyright />} />

                      {/* Cart and Wishlist */}
                      <Route path="cart" element={<ShoppingCart />} />
                      <Route path="wishlist" element={<Wishlist />} />

                      {/* Protected Customer Routes */}
                      <Route
                        path="builds"
                        element={
                          <ProtectedRoute>
                            <SavedBuilds />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="order-confirmation/:id"
                        element={
                          <ProtectedRoute>
                            <OrderConfirmation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="orders"
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="orders/:id"
                        element={
                          <ProtectedRoute>
                            <OrderDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="tracking"
                        element={
                          <ProtectedRoute>
                            <OrderTracking />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="dashboard"
                        element={
                          <ProtectedRoute>
                            <UserDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Storefront 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Dedicated Admin Portal Routes */}
                    <Route
                      path="admin"
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<ProductManagement />} />
                      <Route path="inventory" element={<InventoryManagement />} />
                      <Route path="orders" element={<OrderManagement />} />
                      <Route path="returns" element={<ReturnManagement />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="moderation" element={<ModerationManagement />} />
                      <Route path="coupons" element={<CouponManagement />} />
                      <Route path="audit" element={<AuditLogViewer />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </Router>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

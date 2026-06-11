import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import Loader from '../components/common/Loader.jsx';
import { useAuthStore } from '../store/auth.store.js';

const Login = lazy(() => import('../features/auth/pages/Login.jsx'));
const Register = lazy(() => import('../features/auth/pages/Register.jsx'));

// Farmer
const FarmerDashboard = lazy(() => import('../features/farmer/pages/FarmerDashboard.jsx'));
const CropCycles = lazy(() => import('../features/farmer/pages/CropCycles.jsx'));
const CropCycleDetail = lazy(() => import('../features/farmer/pages/CropCycleDetail.jsx'));
const Inventory = lazy(() => import('../features/inventory/pages/Inventory.jsx'));
const FarmerListings = lazy(() => import('../features/farmer/pages/FarmerListings.jsx'));
const FarmerOrders = lazy(() => import('../features/farmer/pages/FarmerOrders.jsx'));

// Buyer
const BuyerDashboard = lazy(() => import('../features/buyer/pages/BuyerDashboard.jsx'));
const Purchases = lazy(() => import('../features/buyer/pages/Purchases.jsx'));
const Cart = lazy(() => import('../features/buyer/pages/Cart.jsx'));
const BuyerProfile = lazy(() => import('../features/buyer/pages/BuyerProfile.jsx'));

// Shared
const TransactionsList = lazy(() => import('../features/transactions/pages/TransactionsList.jsx'));
const TransactionDetail = lazy(() => import('../features/transactions/pages/TransactionDetail.jsx'));
const Notifications = lazy(() => import('../features/notifications/pages/Notifications.jsx'));
const Analytics = lazy(() => import('../features/analytics/pages/Analytics.jsx'));
const Marketplace = lazy(() => import('../features/marketplace/pages/Marketplace.jsx'));

// Agronomy
const WeatherSupport = lazy(() => import('../features/agronomy/pages/WeatherSupport.jsx'));
const MarketPrices = lazy(() => import('../features/agronomy/pages/MarketPrices.jsx'));
const AIFarming = lazy(() => import('../features/agronomy/pages/AIFarming.jsx'));

// Admin & Reports
const ReportIssue = lazy(() => import('../features/reports/pages/ReportIssue.jsx'));
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard.jsx'));

const HomeRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
  if (user.role === 'BUYER') return <Navigate to="/buyer/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<Loader fullPage />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/transactions" element={<TransactionsList />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/reports" element={<ReportIssue />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['FARMER']} />}>
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
        <Route path="/farmer/crop-cycles" element={<CropCycles />} />
        <Route path="/farmer/crop-cycles/:id" element={<CropCycleDetail />} />
        <Route path="/farmer/inventory" element={<Inventory />} />
        <Route path="/farmer/weather" element={<WeatherSupport />} />
        <Route path="/farmer/market-prices" element={<MarketPrices />} />
        <Route path="/farmer/ai-assistant" element={<AIFarming />} />
        <Route path="/farmer/listings" element={<FarmerListings />} />
        <Route path="/farmer/orders" element={<FarmerOrders />} />
        <Route path="/farmer/profile" element={<BuyerProfile />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/purchases" element={<Purchases />} />
        <Route path="/buyer/cart" element={<Cart />} />
        <Route path="/buyer/profile" element={<BuyerProfile />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;

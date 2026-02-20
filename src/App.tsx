import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Helper for named exports
const lazyNamed = (importFn: () => Promise<any>, name: string) =>
  lazy(() => importFn().then(module => ({ default: module[name] })));

// Lazy load pages - Named Exports
const LandingPage = lazyNamed(() => import('./pages/LandingPage'), 'LandingPage');
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage');
const SignupPage = lazyNamed(() => import('./pages/SignupPage'), 'SignupPage');
const VerificationPage = lazyNamed(() => import('./pages/VerificationPage'), 'VerificationPage'); // Was VerifyPage
const PhoneVerificationPage = lazyNamed(() => import('./pages/PhoneVerificationPage'), 'PhoneVerificationPage');
const CategoryListingPage = lazyNamed(() => import('./pages/CategoryListingPage'), 'CategoryListingPage');
const PostAdPage = lazyNamed(() => import('./pages/PostAdPage'), 'PostAdPage');
const ProductDetailPage = lazyNamed(() => import('./pages/ProductDetailPage'), 'ProductDetailPage'); // Was ListingDetailsPage
const MyAdsPage = lazyNamed(() => import('./pages/MyAdsPage'), 'MyAdsPage');
const WalletPage = lazyNamed(() => import('./pages/WalletPage'), 'WalletPage');
const SettingsPage = lazyNamed(() => import('./pages/SettingsPage'), 'SettingsPage'); // Was ProfilePage
const NotificationsPage = lazyNamed(() => import('./pages/NotificationsPage'), 'NotificationsPage');
const FavoritesPage = lazyNamed(() => import('./pages/FavoritesPage'), 'FavoritesPage'); // Was SavedAdsPage
const HelpCenterPage = lazyNamed(() => import('./pages/HelpCenterPage'), 'HelpCenterPage'); // Was HelpPage
const AdminDashboard = lazyNamed(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const OverviewDashboard = lazyNamed(() => import('./pages/OverviewDashboard'), 'OverviewDashboard');
const EditAdPage = lazyNamed(() => import('./pages/EditAdPage'), 'EditAdPage');
const SellerProfilePage = lazyNamed(() => import('./pages/SellerProfilePage'), 'SellerProfilePage');
const SearchResultsPage = lazyNamed(() => import('./pages/SearchResultsPage'), 'SearchResultsPage');
const AboutPage = lazyNamed(() => import('./pages/AboutPage'), 'AboutPage');
const SafetyTipsPage = lazyNamed(() => import('./pages/SafetyTipsPage'), 'SafetyTipsPage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');
const PromotionPage = lazyNamed(() => import('./pages/PromotionPage'), 'PromotionPage');

// Lazy load pages - Default Exports (Admin/Agent Pages)
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminPromotionsPage = lazy(() => import('./pages/admin/AdminPromotionsPage'));
const AdminVouchersPage = lazy(() => import('./pages/admin/AdminVouchersPage'));
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/phone-verification" element={<PhoneVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<OverviewDashboard />} />
              <Route path="/post-ad" element={<PostAdPage />} />
              <Route path="/my-ads" element={<MyAdsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/edit-ad/:id" element={<EditAdPage />} />
              <Route path="/promote/:adId" element={<PromotionPage />} />
              <Route path="/agent-dashboard" element={<AgentDashboard />} />
            </Route>

            {/* Public Pages with Layout */}
            <Route path="/category/:categoryId" element={<CategoryListingPage />} />
            <Route path="/listing/:listingId" element={<ProductDetailPage />} />
            <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/safety" element={<SafetyTipsPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="promotions" element={<AdminPromotionsPage />} />
              <Route path="vouchers" element={<AdminVouchersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

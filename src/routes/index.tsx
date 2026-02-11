import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { CategoryListingPage } from '../pages/CategoryListingPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { OverviewDashboard } from '../pages/OverviewDashboard';
import { MyAdsPage } from '../pages/MyAdsPage';
import { PostAdPage } from '../pages/PostAdPage';
import { EditAdPage } from '../pages/EditAdPage';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AboutPage } from '../pages/AboutPage';
import { SafetyTipsPage } from '../pages/SafetyTipsPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { MessagesPage } from '../pages/MessagesPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { VerificationPage } from '../pages/VerificationPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';
import { SocialAuthCallback } from '../pages/SocialAuthCallback';
import { WalletPage } from '../pages/WalletPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/category/:categoryId" element={<CategoryListingPage />} />
            <Route path="/ad/:adId" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchResultsPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<SocialAuthCallback />} />

            {/* Public Static Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/safety" element={<SafetyTipsPage />} />
            <Route path="/terms" element={<div className="p-40 text-center font-bold text-gray-400 italic">Terms & Conditions (Content Coming Soon)</div>} />
            <Route path="/privacy" element={<div className="p-40 text-center font-bold text-gray-400 italic">Privacy Policy (Content Coming Soon)</div>} />
            <Route path="/help" element={<HelpCenterPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<OverviewDashboard />} />
                <Route path="/my-ads" element={<MyAdsPage />} />
                <Route path="/post-ad" element={<PostAdPage />} />
                <Route path="/edit-ad/:id" element={<EditAdPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/verification" element={<VerificationPage />} />
                <Route path="/wallet" element={<WalletPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;

import React, { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingScreen } from './components/OnboardingScreen';
import { CookieBanner } from './components/CookieBanner';
import { useCurrencyStore } from './store/useCurrencyStore';
import { detectCurrencyFromIP } from './utils/detectCurrency';
import { useLocationStore } from './store/useLocationStore';

// Helper for named exports
const lazyNamed = (importFn: () => Promise<any>, name: string) =>
  lazy(() => importFn().then(module => ({ default: module[name] })));

// Lazy load pages - Named Exports
const LandingPage = lazyNamed(() => import('./pages/LandingPage'), 'LandingPage');
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage');
const SignupPage = lazyNamed(() => import('./pages/SignupPage'), 'SignupPage');
const VerificationPage = lazyNamed(() => import('./pages/VerificationPage'), 'VerificationPage'); // Was VerifyPage
const PhoneVerificationPage = lazyNamed(() => import('./pages/PhoneVerificationPage'), 'PhoneVerificationPage');
const EmailVerificationPage = lazyNamed(() => import('./pages/EmailVerificationPage'), 'EmailVerificationPage');
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
const MessagesPage = lazyNamed(() => import('./pages/MessagesPage'), 'MessagesPage');
const KaalayHeedhePage = lazy(() => import('./pages/KaalayHeedhePage'));
const PrivacyPolicyPage = lazyNamed(() => import('./pages/PrivacyPolicyPage'), 'PrivacyPolicyPage');
const TermsPage = lazyNamed(() => import('./pages/TermsPage'), 'TermsPage');
const DeleteAccountPage = lazyNamed(() => import('./pages/DeleteAccountPage'), 'DeleteAccountPage');
const SocialAuthCallback = lazyNamed(() => import('./pages/SocialAuthCallback'), 'SocialAuthCallback');
const FeedbackPage = lazyNamed(() => import('./pages/FeedbackPage'), 'FeedbackPage');
const FollowersPage = lazyNamed(() => import('./pages/FollowersPage'), 'FollowersPage');
const PerformancePage = lazyNamed(() => import('./pages/PerformancePage'), 'PerformancePage');
const ProSalesPage = lazyNamed(() => import('./pages/ProSalesPage'), 'ProSalesPage');
const PremiumPage = lazyNamed(() => import('./pages/PremiumPage'), 'PremiumPage');
const DiscoveryFeedPage = lazy(() => import('./pages/DiscoveryFeedPage'));

// Lazy load pages - Default Exports (Admin/Agent Pages)
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminPromotionsPage = lazy(() => import('./pages/admin/AdminPromotionsPage'));
const AdminVouchersPage = lazy(() => import('./pages/admin/AdminVouchersPage'));
const AdminListingsPage = lazy(() => import('./pages/admin/AdminListingsPage'));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage'));
const AdminMarketingPage = lazy(() => import('./pages/admin/AdminMarketingPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const WebEditorPage = lazyNamed(() => import('./pages/admin/WebEditorPage'), 'WebEditorPage');
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      // Never retry on 401/403/404 — retrying auth failures just floods the console
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

type AppPhase = 'onboarding' | 'app';

const App: React.FC = () => {
  const onboardingSeen = localStorage.getItem('suqafuran-onboarding-seen') === '1';
  const [phase, setPhase] = useState<AppPhase>(onboardingSeen ? 'app' : 'onboarding');
  const { autoDetected, setAutoDetected, setCurrency } = useCurrencyStore();
  const { permissionAsked, setPermissionAsked, setLocation } = useLocationStore();

  useEffect(() => {
    if (autoDetected) return;
    detectCurrencyFromIP().then(currency => {
      setCurrency(currency);
      setAutoDetected(true);
    });
  }, []);

  useEffect(() => {
    if (permissionAsked || !navigator.geolocation) return;
    setPermissionAsked(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            null;
          setLocation(city, lat, lng);
        } catch {
          setLocation(null, lat, lng);
        }
      },
      () => { /* user denied — do nothing */ },
      { timeout: 8000 }
    );
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setPhase('app');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {phase === 'onboarding' && <OnboardingScreen onDone={handleOnboardingDone} />}
        <ScrollToTop />
        <CookieBanner />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/phone-verification" element={<PhoneVerificationPage />} />
            <Route path="/email-verification" element={<EmailVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<SocialAuthCallback />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<OverviewDashboard />} />
              <Route path="/post-ad" element={<PostAdPage />} />
              <Route path="/edit-ad/:id" element={<PostAdPage />} />
              <Route path="/my-ads" element={<MyAdsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/edit-ad/:id" element={<EditAdPage />} />
              <Route path="/promote/:adId" element={<PromotionPage />} />
              <Route path="/dashboard/verify" element={<VerificationPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/pro-sales" element={<ProSalesPage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/followers" element={<FollowersPage />} />
              <Route path="/agent-dashboard" element={<AgentDashboard />} />
            </Route>

            {/* Messages — accessible to all, guards internally */}
            <Route path="/messages" element={<MessagesPage />} />

            {/* Public Pages with Layout */}
            <Route path="/category/:categoryId" element={<CategoryListingPage />} />
            <Route path="/listing/:listingId" element={<ProductDetailPage />} />
            <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/safety" element={<SafetyTipsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route path="/kh" element={<KaalayHeedhePage />} />
            <Route path="/discovery" element={<DiscoveryFeedPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="listings" element={<AdminListingsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="promotions" element={<AdminPromotionsPage />} />
              <Route path="vouchers" element={<AdminVouchersPage />} />
              <Route path="verifications" element={<AdminVerificationsPage />} />
              <Route path="marketing" element={<AdminMarketingPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="editor" element={<WebEditorPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

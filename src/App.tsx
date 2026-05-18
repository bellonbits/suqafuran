import React, { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
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
import { NotificationPoller } from './components/NotificationPoller';
import { SplashScreen } from './components/SplashScreen';

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
const ContactPage = lazyNamed(() => import('./pages/ContactPage'), 'ContactPage');
const DownloadPage = lazyNamed(() => import('./pages/DownloadPage'), 'DownloadPage');

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
const UnusualAccountsPage = lazy(() => import('./pages/admin/UnusualAccountsPage'));
const FraudModerationPage = lazy(() => import('./pages/admin/FraudModerationPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'));
const WebEditorPage = lazyNamed(() => import('./pages/admin/WebEditorPage'), 'WebEditorPage');
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));
const ProgrammaticSEOPage = lazy(() => import('./pages/ProgrammaticSEOPage'));

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

type AppPhase = 'splash' | 'onboarding' | 'app';

const App: React.FC = () => {
  const onboardingSeen = localStorage.getItem('suqafuran-onboarding-seen') === '1';
  const [phase, setPhase] = useState<AppPhase>('splash');
  const { autoDetected, setAutoDetected, setCurrency } = useCurrencyStore();
  const { permissionAsked, setPermissionAsked, setLocation } = useLocationStore();
  const [storeUpdate, setStoreUpdate] = useState<{
    needed: boolean;
    storeUrl: string;
    latestVersion: string;
    currentVersion: string;
  }>({
    needed: false,
    storeUrl: '',
    latestVersion: '',
    currentVersion: ''
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapApp.getInfo().then(async (info) => {
        const currentVersion = info.version;
        try {
          const res = await fetch('/api/v1/content/version');
          if (res.ok) {
            const data = await res.json();
            const platform = Capacitor.getPlatform();
            const latestVersion = platform === 'ios' ? data.latest_ios_version : data.latest_android_version;
            const storeUrl = platform === 'ios' ? data.ios_store_url : data.android_store_url;

            if (latestVersion && latestVersion !== currentVersion) {
              setStoreUpdate({
                needed: true,
                storeUrl,
                latestVersion,
                currentVersion
              });
            }
          }
        } catch (err) {
          console.error('Failed to check for native updates', err);
        }
      }).catch(err => {
        console.error('Failed to get Capacitor app info', err);
      });
    }
  }, []);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, r) {
      if (r) {
        // Automatically check for updates every 3 minutes (180,000 ms)
        setInterval(() => {
          r.update().catch(() => {});
        }, 180_000);
      }
    }
  });

  useEffect(() => {
    const handleFocus = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.update().catch(() => {});
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  
  useEffect(() => {
    if (phase !== 'splash') {
      document.body.style.backgroundColor = '#ffffff';
    } else {
      document.body.style.backgroundColor = '#0c4a6e';
    }
  }, [phase]);

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
          const countryCode = data.address?.country_code?.toUpperCase();
          if (countryCode && !autoDetected) {
            // Check if we have a mapping for this country
            const mappings: Record<string, any> = {
              'KE': 'KES', 'UG': 'UGX', 'TZ': 'TZS', 'ET': 'ETB', 'RW': 'RWF', 'SO': 'SOS'
            };
            if (mappings[countryCode]) {
              setCurrency(mappings[countryCode]);
              setAutoDetected(true);
            }
          }
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

  const handleSplashDone = useCallback(() => {
    setPhase(onboardingSeen ? 'app' : 'onboarding');
  }, [onboardingSeen]);

  const handleOnboardingDone = useCallback(() => {
    setPhase('app');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {phase === 'splash' && <SplashScreen onDone={handleSplashDone} />}
        {phase === 'onboarding' && <OnboardingScreen onDone={handleOnboardingDone} />}
        <Toaster position="top-center" reverseOrder={false} />
        <ScrollToTop />
        <CookieBanner />
        <NotificationPoller />
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
              <Route path="/agent-dashboard" element={<ProtectedRoute requireAgent><AgentDashboard /></ProtectedRoute>} />
            </Route>

            {/* Messages — accessible to all, guards internally */}
            <Route path="/messages" element={<MessagesPage />} />

            {/* Public Pages with Layout */}
            <Route path="/category/:categoryId" element={<CategoryListingPage />} />
            <Route path="/listing/:listingId" element={<ProductDetailPage />} />
            <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/download" element={<DownloadPage />} />

            <Route path="/safety" element={<SafetyTipsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route path="/kh" element={<KaalayHeedhePage />} />
            <Route path="/discovery" element={<DiscoveryFeedPage />} />
            <Route path="/discover" element={<ProgrammaticSEOPage />} />

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
              <Route path="fraud-moderation" element={<FraudModerationPage />} />
              <Route path="unusual-accounts" element={<UnusualAccountsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="editor" element={<WebEditorPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      {needRefresh && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 bg-white/95 backdrop-blur-xl border border-sky-100 shadow-2xl rounded-3xl p-5 z-[99999] flex flex-col gap-3 animate-bounce">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-2xl shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 leading-tight">New Update Available!</h4>
              <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                We've upgraded the platform with awesome new features and fixes. Reload to see them now!
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-md shadow-sky-100 transition-all cursor-pointer"
            >
              Update Now
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:scale-98 text-gray-500 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}
      {storeUpdate.needed && (
        <div className="fixed inset-0 bg-sky-950/40 backdrop-blur-md z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl border border-sky-100/50 flex flex-col items-center text-center gap-5 relative overflow-hidden animate-bounce" style={{ animationDuration: '2s' }}>
            {/* Ambient visual background glow */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Premium Upgrade Badge & Icon */}
            <div className="w-16 h-16 rounded-[24px] bg-sky-50 flex items-center justify-center text-sky-600 shadow-inner">
              <RefreshCw className="w-7 h-7 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                Update Available!
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full inline-block">
                v{storeUpdate.latestVersion} is live
              </p>
              <p className="text-xs text-gray-400 font-medium leading-relaxed px-2 mt-2">
                A new and improved version of the Suqafuran app is ready for you in the store. Enjoy smoother browsing and newly unlocked marketplace security tools!
              </p>
            </div>

            {/* Call to actions */}
            <div className="w-full space-y-2.5">
              <a
                href={storeUpdate.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs font-black py-3 rounded-2xl shadow-lg shadow-sky-100 transition-all cursor-pointer animate-pulse"
              >
                Go to App Store
              </a>
              <button
                onClick={() => setStoreUpdate(prev => ({ ...prev, needed: false }))}
                className="w-full text-center hover:bg-gray-50 active:scale-98 text-gray-400 text-xs font-black py-2.5 rounded-2xl transition-all cursor-pointer"
              >
                Update Later
              </button>
            </div>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
};

export default App;

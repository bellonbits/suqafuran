import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Onboarding, hasSeenOnboarding } from './components/Onboarding'
import { isCapacitorApp } from './lib/capacitor-utils'
import { Header } from './components/shared/Header'
import { Footer } from './components/shared/Footer'
import { AuthModal } from './components/shared/AuthModal'
import { AISupportChat } from './components/shared/AISupportChat'
import ProtectedRoute from './components/ProtectedRoute'
import { SellerLayout } from './components/SellerLayout'
import HomePage from './pages/HomePage'
import ShopsPage from './pages/ShopsPage'
import ShopDetailPage from './pages/ShopDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AccountPage from './pages/AccountPage'
import SettingsPage from './pages/SettingsPage'
import MessagesPage from './pages/MessagesPage'
import OrdersPage from './pages/OrdersPage'
import FavoritesPage from './pages/FavoritesPage'
import SavedSearchesPage from './pages/SavedSearchesPage'
import PriceAlertsPage from './pages/PriceAlertsPage'
import FollowingPage from './pages/FollowingPage'
import PostAdPage from './pages/PostAdPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import SellerShopPage from './pages/SellerShopPage'
import SellerProductsPage from './pages/SellerProductsPage'
import SellerBulkImportPage from './pages/SellerBulkImportPage'
import SellerOrdersPage from './pages/SellerOrdersPage'
import SellerMessagesPage from './pages/SellerMessagesPage'
import SellerCustomersPage from './pages/SellerCustomersPage'
import SellerFinancePage from './pages/SellerFinancePage'
import SellerAnalyticsPage from './pages/SellerAnalyticsPage'
import SellerInventoryPage from './pages/SellerInventoryPage'
import SellerMarketingPage from './pages/SellerMarketingPage'
import SellerFeaturedAdsPage from './pages/SellerFeaturedAdsPage'
import SellerReviewsPage from './pages/SellerReviewsPage'
import SellerVerificationPage from './pages/SellerVerificationPage'
import SellerSettingsPage from './pages/SellerSettingsPage'
import SellerStaffPage from './pages/SellerStaffPage'
import SellerSubscriptionPage from './pages/SellerSubscriptionPage'
import SellerReportsPage from './pages/SellerReportsPage'
import AdminDashboardMainPage from './pages/AdminDashboardMainPage'
import AdminListingsPage from './pages/AdminListingsPage'
import AdminSellersPage from './pages/AdminSellersPage'
import AdminShopsPage from './pages/AdminShopsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminDisputesPage from './pages/AdminDisputesPage'
import AdminFraudPage from './pages/AdminFraudPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminSupportPage from './pages/AdminSupportPage'
import AdminVerificationsPage from './pages/AdminVerificationsPage'
import AdminMarketingPage from './pages/AdminMarketingPage'
import AdminUnusualAccountsPage from './pages/AdminUnusualAccountsPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminAnalyticsMainPage from './pages/AdminAnalyticsMainPage'
import AdminAnalyticsUsersPage from './pages/AdminAnalyticsUsersPage'
import AdminAnalyticsSellersPage from './pages/AdminAnalyticsSellersPage'
import AdminAnalyticsDevicesPage from './pages/AdminAnalyticsDevicesPage'
import AdminAnalyticsGeographicPage from './pages/AdminAnalyticsGeographicPage'
import AdminAnalyticsAlertsPage from './pages/AdminAnalyticsAlertsPage'
import AdminBulkProductsPage from './pages/AdminBulkProductsPage'
import AdminHomepageBannersPage from './pages/AdminHomepageBannersPage'
import AdminCustomerSegmentsPage from './pages/AdminCustomerSegmentsPage'
import AdminEmailAnalyticsPage from './pages/AdminEmailAnalyticsPage'
import AdminEmailTemplatesPage from './pages/AdminEmailTemplatesPage'
import AdminFeaturedAdsPage from './pages/AdminFeaturedAdsPage'
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage'
import AdminSystemMessagesPage from './pages/AdminSystemMessagesPage'
import AdminUserLifecyclePage from './pages/AdminUserLifecyclePage'
import AdminMonitoringAlertsPage from './pages/AdminMonitoringAlertsPage'
import AdminMonitoringKafkaPage from './pages/AdminMonitoringKafkaPage'
import AdminMonitoringLivePage from './pages/AdminMonitoringLivePage'
import AdminMonitoringNotificationsPage from './pages/AdminMonitoringNotificationsPage'
import AdminMonitoringTracesPage from './pages/AdminMonitoringTracesPage'
import AdminShopsAltPage from './pages/AdminShopsAltPage'
import AdminMonitoringAlertsAltPage from './pages/AdminMonitoringAlertsAltPage'
import AdminMonitoringKafkaAltPage from './pages/AdminMonitoringKafkaAltPage'
import AdminMonitoringLiveAltPage from './pages/AdminMonitoringLiveAltPage'
import AdminMonitoringNotificationsAltPage from './pages/AdminMonitoringNotificationsAltPage'
import AdminMonitoringTracesAltPage from './pages/AdminMonitoringTracesAltPage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import AgentEarningsPage from './pages/AgentEarningsPage'
import AgentAnalyticsPage from './pages/AgentAnalyticsPage'
import AgentInquiriesPage from './pages/AgentInquiriesPage'
import AgentListingsPage from './pages/AgentListingsPage'
import AgentShopsPage from './pages/AgentShopsPage'
import HelpCenterPage from './pages/HelpCenterPage'
import SafeTradingTipsPage from './pages/SafeTradingTipsPage'
import TermsOfUsePage from './pages/TermsOfUsePage'

const AdminDashboardPagePlaceholder = () => (
  <div className="w-full">
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Loading admin dashboard...</p>
    </div>
  </div>
)

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <div style={{ height: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }} className="shrink-0 w-full md:hidden" />
      <div className="shrink-0 w-full hidden md:block h-16" />

      <div className="flex flex-1 min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <AuthModal />
      <AISupportChat />
    </div>
  )
}

// React Router doesn't reset scroll position on navigation by default (unlike
// a traditional multi-page site) -- without this, clicking through to a new
// page keeps whatever scroll offset the previous page was left at.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => isCapacitorApp() && !hasSeenOnboarding())

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Marketplace Pages */}
      <Route element={<AppLayout><HomePage /></AppLayout>} path="/" />
      <Route element={<AppLayout><ShopsPage /></AppLayout>} path="/shops" />
      <Route element={<AppLayout><ShopDetailPage /></AppLayout>} path="/shop" />
      <Route element={<AppLayout><ShopDetailPage /></AppLayout>} path="/shop/:slug" />
      <Route element={<AppLayout><SearchPage /></AppLayout>} path="/search" />
      <Route element={<AppLayout><ListingDetailPage /></AppLayout>} path="/listing/:id" />
      <Route element={<AppLayout><CheckoutPage /></AppLayout>} path="/checkout" />

      {/* Support & Legal Pages */}
      <Route element={<AppLayout><HelpCenterPage /></AppLayout>} path="/help-center" />
      <Route element={<AppLayout><SafeTradingTipsPage /></AppLayout>} path="/safe-trading-tips" />
      <Route element={<AppLayout><TermsOfUsePage /></AppLayout>} path="/terms-of-use" />

      <Route element={<AppLayout><CategoryPage /></AppLayout>} path="/:category" />

      {/* Authentication Pages */}
      <Route element={<AppLayout><LoginPage /></AppLayout>} path="/login" />
      <Route element={<AppLayout><SignupPage /></AppLayout>} path="/signup" />
      <Route element={<AppLayout><ResetPasswordPage /></AppLayout>} path="/reset-password" />

      {/* User Account Pages */}
      <Route element={<AppLayout><AccountPage /></AppLayout>} path="/account" />
      <Route element={<AppLayout><SettingsPage /></AppLayout>} path="/settings" />
      <Route element={<AppLayout><MessagesPage /></AppLayout>} path="/messages" />
      <Route element={<AppLayout><OrdersPage /></AppLayout>} path="/orders" />
      <Route element={<AppLayout><FavoritesPage /></AppLayout>} path="/favorites" />
      <Route element={<AppLayout><SavedSearchesPage /></AppLayout>} path="/saved-searches" />
      <Route element={<AppLayout><PriceAlertsPage /></AppLayout>} path="/price-alerts" />
      <Route element={<AppLayout><FollowingPage /></AppLayout>} path="/following" />

      {/* Seller Dashboard Pages */}
      <Route element={<SellerLayout><SellerDashboardPage /></SellerLayout>} path="/seller-dashboard" />
      <Route element={<SellerLayout><SellerShopPage /></SellerLayout>} path="/seller-dashboard/shop" />
      <Route element={<SellerLayout><SellerProductsPage /></SellerLayout>} path="/seller-dashboard/products" />
      <Route element={<SellerLayout><PostAdPage /></SellerLayout>} path="/seller-dashboard/products/add" />
      <Route element={<SellerLayout><SellerBulkImportPage /></SellerLayout>} path="/seller-dashboard/products/bulk-import" />
      <Route element={<SellerLayout><SellerOrdersPage /></SellerLayout>} path="/seller-dashboard/orders" />
      <Route element={<SellerLayout><SellerMessagesPage /></SellerLayout>} path="/seller-dashboard/messages" />
      <Route element={<SellerLayout><SellerCustomersPage /></SellerLayout>} path="/seller-dashboard/customers" />
      <Route element={<SellerLayout><SellerFinancePage /></SellerLayout>} path="/seller-dashboard/finance" />
      <Route element={<SellerLayout><SellerAnalyticsPage /></SellerLayout>} path="/seller-dashboard/analytics" />
      <Route element={<SellerLayout><SellerInventoryPage /></SellerLayout>} path="/seller-dashboard/inventory" />
      <Route element={<SellerLayout><SellerMarketingPage /></SellerLayout>} path="/seller-dashboard/marketing" />
      <Route element={<SellerLayout><SellerFeaturedAdsPage /></SellerLayout>} path="/seller-dashboard/featured-ads" />
      <Route element={<SellerLayout><SellerReviewsPage /></SellerLayout>} path="/seller-dashboard/reviews" />
      <Route element={<SellerLayout><SellerVerificationPage /></SellerLayout>} path="/seller-dashboard/verification" />
      <Route element={<SellerLayout><SellerSettingsPage /></SellerLayout>} path="/seller-dashboard/settings" />
      <Route element={<SellerLayout><SellerStaffPage /></SellerLayout>} path="/seller-dashboard/settings/staff" />
      <Route element={<SellerLayout><SellerSubscriptionPage /></SellerLayout>} path="/seller-dashboard/subscription" />
      <Route element={<SellerLayout><SellerReportsPage /></SellerLayout>} path="/seller-dashboard/reports" />

      {/* Admin Panel - Main Pages - Protected */}
      <Route element={<ProtectedRoute requiredRole="admin"><AdminDashboardMainPage /></ProtectedRoute>} path="/admin-dashboard" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminListingsPage /></ProtectedRoute>} path="/admin-listings" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminSellersPage /></ProtectedRoute>} path="/admin-sellers" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminShopsPage /></ProtectedRoute>} path="/admin-shops" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute>} path="/admin-users" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminCategoriesPage /></ProtectedRoute>} path="/admin-categories" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminOrdersPage /></ProtectedRoute>} path="/admin-orders" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminDisputesPage /></ProtectedRoute>} path="/admin-disputes" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminFraudPage /></ProtectedRoute>} path="/admin-fraud" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminReportsPage /></ProtectedRoute>} path="/admin-reports" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminSupportPage /></ProtectedRoute>} path="/admin-support" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminVerificationsPage /></ProtectedRoute>} path="/admin-verifications" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminMarketingPage /></ProtectedRoute>} path="/admin-marketing" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminUnusualAccountsPage /></ProtectedRoute>} path="/admin-unusual-accounts" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminAnalyticsPage /></ProtectedRoute>} path="/admin-analytics" />

      {/* Admin Dashboard Analytics */}
      <Route element={<AdminAnalyticsMainPage />} path="/admin-dashboard/analytics" />
      <Route element={<AdminAnalyticsUsersPage />} path="/admin-dashboard/analytics/users" />
      <Route element={<AdminAnalyticsSellersPage />} path="/admin-dashboard/analytics/sellers" />
      <Route element={<AdminAnalyticsDevicesPage />} path="/admin-dashboard/analytics/devices" />
      <Route element={<AdminAnalyticsGeographicPage />} path="/admin-dashboard/analytics/geographic" />
      <Route element={<AdminAnalyticsAlertsPage />} path="/admin-dashboard/analytics/alerts" />

      {/* Admin Dashboard Features */}
      <Route element={<ProtectedRoute requiredRole="admin"><AdminHomepageBannersPage /></ProtectedRoute>} path="/admin-dashboard/marketing/banners" />
      <Route element={<AdminBulkProductsPage />} path="/admin-dashboard/bulk-products" />
      <Route element={<AdminCustomerSegmentsPage />} path="/admin-dashboard/customer-segments" />
      <Route element={<AdminEmailAnalyticsPage />} path="/admin-dashboard/email-analytics" />
      <Route element={<AdminEmailTemplatesPage />} path="/admin-dashboard/email-templates" />
      <Route element={<AdminFeaturedAdsPage />} path="/admin-dashboard/featured-ads" />
      <Route element={<AdminSubscriptionsPage />} path="/admin-dashboard/subscriptions" />
      <Route element={<AdminSystemMessagesPage />} path="/admin-dashboard/system-messages" />
      <Route element={<AdminUserLifecyclePage />} path="/admin-dashboard/user-lifecycle" />

      {/* Admin Dashboard Monitoring */}
      <Route element={<AdminMonitoringAlertsPage />} path="/admin-dashboard/monitoring/alerts" />
      <Route element={<AdminMonitoringKafkaPage />} path="/admin-dashboard/monitoring/kafka" />
      <Route element={<AdminMonitoringLivePage />} path="/admin-dashboard/monitoring/live" />
      <Route element={<AdminMonitoringNotificationsPage />} path="/admin-dashboard/monitoring/notifications" />
      <Route element={<AdminMonitoringTracesPage />} path="/admin-dashboard/monitoring/traces" />

      {/* Admin Alt Routes - Protected */}
      <Route element={<ProtectedRoute requiredRole="admin"><AdminShopsAltPage /></ProtectedRoute>} path="/admin/shops" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminMonitoringAlertsAltPage /></ProtectedRoute>} path="/admin/monitoring/alerts" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminMonitoringKafkaAltPage /></ProtectedRoute>} path="/admin/monitoring/kafka" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminMonitoringLiveAltPage /></ProtectedRoute>} path="/admin/monitoring/live" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminMonitoringNotificationsAltPage /></ProtectedRoute>} path="/admin/monitoring/notifications" />
      <Route element={<ProtectedRoute requiredRole="admin"><AdminMonitoringTracesAltPage /></ProtectedRoute>} path="/admin/monitoring/traces" />

      {/* Agent Pages - Protected */}
      <Route element={<ProtectedRoute requiredRole="agent"><AgentDashboardPage /></ProtectedRoute>} path="/agent-dashboard" />
      <Route element={<ProtectedRoute requiredRole="agent"><AgentEarningsPage /></ProtectedRoute>} path="/agent-earnings" />
      <Route element={<ProtectedRoute requiredRole="agent"><AgentAnalyticsPage /></ProtectedRoute>} path="/agent-analytics" />
      <Route element={<ProtectedRoute requiredRole="agent"><AgentInquiriesPage /></ProtectedRoute>} path="/agent-inquiries" />
      <Route element={<ProtectedRoute requiredRole="agent"><AgentListingsPage /></ProtectedRoute>} path="/agent-listings" />
      <Route element={<ProtectedRoute requiredRole="agent"><AgentShopsPage /></ProtectedRoute>} path="/agent-shops" />
    </Routes>
    </>
  )
}

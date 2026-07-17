import {
  LayoutDashboard, Users, ShoppingCart, CheckCircle, Layers,
  Gift, Megaphone, MessageSquare, BarChart3, FileText,
  AlertTriangle, AlertCircle, Settings, Activity, Bell, Zap, Radio, Network
} from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin-dashboard' },
  { label: 'Monitoring', icon: Activity, href: '/admin-monitoring' },
  { label: 'Alerts', icon: Bell, href: '/admin-monitoring/alerts' },
  { label: 'Live Events', icon: Radio, href: '/admin-monitoring/live' },
  { label: 'Notifications', icon: AlertCircle, href: '/admin-monitoring/notifications' },
  { label: 'Kafka', icon: Network, href: '/admin-monitoring/kafka' },
  { label: 'Traces', icon: Zap, href: '/admin-monitoring/traces' },
  { label: 'Users', icon: Users, href: '/admin-users' },
  { label: 'Orders', icon: ShoppingCart, href: '/admin-orders' },
  { label: 'Verifications', icon: CheckCircle, href: '/admin-verifications' },
  { label: 'Categories', icon: Layers, href: '/admin-categories' },
  { label: 'Vouchers', icon: Gift, href: '/admin-vouchers' },
  { label: 'Promotions', icon: Megaphone, href: '/admin-promotions' },
  { label: 'Support', icon: MessageSquare, href: '/admin-support' },
  { label: 'Marketing', icon: BarChart3, href: '/admin-marketing' },
  { label: 'Reports', icon: FileText, href: '/admin-reports' },
  { label: 'Fraud', icon: AlertTriangle, href: '/admin-fraud' },
  { label: 'Unusual Accounts', icon: AlertCircle, href: '/admin-unusual-accounts' },
  { label: 'Settings', icon: Settings, href: '/admin-settings' },
];

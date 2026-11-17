/**
 * Google Tag Manager (GTM) & Google Analytics 4 (GA4) Analytics Service
 * Container ID: GTM-MW2MX5W9
 *
 * Implements GA4 E-commerce and custom marketplace events, Google Consent Mode v2,
 * SPA page view tracking, purchase de-duplication, and strict PII protection.
 */

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: any[]) => void;
  }
}

const PURCHASE_TRACKED_STORAGE_KEY = 'suqafuran_tracked_purchases';

/**
 * Safely push an object to the global GTM dataLayer
 */
export function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/**
 * Clears the ecommerce dataLayer object before pushing new ecommerce events,
 * as required by GA4 / GTM best practices to prevent stale e-commerce parameters.
 */
export function clearEcommerce() {
  pushDataLayer({ ecommerce: null });
}

/* ==========================================================================
   Google Consent Mode v2
   ========================================================================== */

export function updateGtmConsent(analyticsGranted: boolean, marketingGranted: boolean) {
  if (typeof window === 'undefined') return;

  const consentConfig = {
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
    ad_storage: marketingGranted ? 'granted' : 'denied',
    ad_user_data: marketingGranted ? 'granted' : 'denied',
    ad_personalization: marketingGranted ? 'granted' : 'denied',
  };

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', consentConfig);
  }

  pushDataLayer({
    event: 'consent_update',
    ...consentConfig,
  });
}

/**
 * Attaches a listener for cookie consent changes from CookieConsentBanner
 */
export function initConsentModeListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleConsentChange = (e: Event) => {
    try {
      const customEvent = e as CustomEvent;
      const record = customEvent.detail;
      if (record?.preferences) {
        updateGtmConsent(
          Boolean(record.preferences.analytics),
          Boolean(record.preferences.marketing)
        );
      }
    } catch (err) {
      console.warn('[GTM] Failed to update consent mode on event:', err);
    }
  };

  window.addEventListener('suqafuran_cookie_consent_changed', handleConsentChange);

  // Sync initial stored consent if already available
  try {
    const raw = localStorage.getItem('suqafuran_cookie_consent');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.preferences) {
        updateGtmConsent(
          Boolean(parsed.preferences.analytics),
          Boolean(parsed.preferences.marketing)
        );
      }
    }
  } catch (err) {
    // Ignore storage parse error
  }

  return () => {
    window.removeEventListener('suqafuran_cookie_consent_changed', handleConsentChange);
  };
}

/* ==========================================================================
   Purchase De-duplication Helpers
   ========================================================================== */

export function isPurchaseTracked(transactionId: string): boolean {
  if (typeof window === 'undefined' || !transactionId) return false;
  try {
    const raw = localStorage.getItem(PURCHASE_TRACKED_STORAGE_KEY);
    if (!raw) return false;
    const tracked: string[] = JSON.parse(raw);
    return tracked.includes(String(transactionId));
  } catch {
    return false;
  }
}

export function markPurchaseTracked(transactionId: string): void {
  if (typeof window === 'undefined' || !transactionId) return;
  try {
    const raw = localStorage.getItem(PURCHASE_TRACKED_STORAGE_KEY);
    const tracked: string[] = raw ? JSON.parse(raw) : [];
    if (!tracked.includes(String(transactionId))) {
      tracked.push(String(transactionId));
      // Keep only recent 100 transaction IDs to avoid storage bloating
      if (tracked.length > 100) tracked.shift();
      localStorage.setItem(PURCHASE_TRACKED_STORAGE_KEY, JSON.stringify(tracked));
    }
  } catch {
    // Ignore storage write error
  }
}

/* ==========================================================================
   Core & SPA Navigation Events
   ========================================================================== */

export function trackPageView(path?: string, title?: string) {
  if (typeof window === 'undefined') return;

  const currentPath = path || window.location.pathname + window.location.search;
  const currentTitle = title || document.title || 'Suqafuran';
  const currentLocation = window.location.href;

  const isInternal = currentPath.startsWith('/admin') || currentPath.startsWith('/agent');

  pushDataLayer({
    event: 'page_view',
    page_title: currentTitle,
    page_location: currentLocation,
    page_path: currentPath,
    traffic_type: isInternal ? 'internal' : undefined,
  });
}

/* ==========================================================================
   Buyer Activities
   ========================================================================== */

export function trackSearch(query: string, resultsCount?: number, category?: string) {
  if (!query) return;
  pushDataLayer({
    event: 'search',
    search_term: query.trim(),
    search_results_count: resultsCount ?? 0,
    search_category: category || 'all',
  });
}

export interface GtmListingItem {
  id: string | number;
  name: string;
  category?: string;
  price?: number;
  seller_id?: string | number;
  index?: number;
}

export function trackViewItemList(listId: string, listName: string, items: GtmListingItem[]) {
  clearEcommerce();
  pushDataLayer({
    event: 'view_item_list',
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map((item, idx) => ({
        item_id: String(item.id),
        item_name: item.name,
        item_category: item.category || 'General',
        price: Number(item.price || 0),
        index: item.index ?? (idx + 1),
        item_seller_id: item.seller_id ? String(item.seller_id) : undefined,
      })),
    },
  });
}

export function trackSelectItem(item: GtmListingItem, listName?: string) {
  clearEcommerce();
  pushDataLayer({
    event: 'select_item',
    ecommerce: {
      item_list_name: listName || 'Marketplace Grid',
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          item_category: item.category || 'General',
          price: Number(item.price || 0),
          index: item.index ?? 1,
          item_seller_id: item.seller_id ? String(item.seller_id) : undefined,
        },
      ],
    },
  });
}

export function trackViewItem(item: {
  id: string | number;
  name: string;
  category?: string;
  price?: number;
  seller_id?: string | number;
  currency?: string;
}) {
  clearEcommerce();
  const price = Number(item.price || 0);
  pushDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: item.currency || 'KES',
      value: price,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          item_category: item.category || 'General',
          price,
          quantity: 1,
          item_seller_id: item.seller_id ? String(item.seller_id) : undefined,
        },
      ],
    },
  });
}

export function trackSaveItem(item: {
  item_id: string | number;
  item_name: string;
  item_category?: string;
  price?: number;
  action: 'save' | 'unsave';
}) {
  pushDataLayer({
    event: 'save_item',
    item_id: String(item.item_id),
    item_name: item.item_name,
    item_category: item.item_category || 'General',
    price: Number(item.price || 0),
    action: item.action,
  });
}

export function trackStartChat(item: {
  item_id: string | number;
  item_name?: string;
  seller_id?: string | number;
}) {
  pushDataLayer({
    event: 'start_chat',
    item_id: String(item.item_id),
    item_name: item.item_name || '',
    seller_id: item.seller_id ? String(item.seller_id) : '',
  });
}

export function trackSendMessage(params: {
  sender_role: 'buyer' | 'seller';
  conversation_id: string | number;
  item_id?: string | number;
}) {
  pushDataLayer({
    event: 'send_message',
    sender_role: params.sender_role,
    conversation_id: String(params.conversation_id),
    item_id: params.item_id ? String(params.item_id) : undefined,
  });
}

export function trackContactSeller(params: {
  method: 'chat' | 'phone' | 'whatsapp' | 'offer';
  item_id: string | number;
  seller_id?: string | number;
}) {
  pushDataLayer({
    event: 'contact_seller',
    contact_method: params.method,
    item_id: String(params.item_id),
    seller_id: params.seller_id ? String(params.seller_id) : undefined,
  });
}

export function trackShare(params: {
  method: 'whatsapp' | 'x' | 'facebook' | 'native_share' | 'copy_link' | string;
  content_type: string;
  item_id: string | number;
}) {
  pushDataLayer({
    event: 'share',
    method: params.method,
    content_type: params.content_type,
    item_id: String(params.item_id),
  });
}

/* ==========================================================================
   Seller Activities
   ========================================================================== */

export function trackSignUp(params: { method: string; user_role?: string }) {
  pushDataLayer({
    event: 'sign_up',
    method: params.method,
    user_role: params.user_role || 'buyer',
  });
}

export function trackLogin(params: { method: string; user_role?: string }) {
  pushDataLayer({
    event: 'login',
    method: params.method,
    user_role: params.user_role || 'buyer',
  });
}

export function trackListingCreationStarted(params?: { category?: string }) {
  pushDataLayer({
    event: 'listing_creation_started',
    category: params?.category || 'general',
  });
}

export function trackListingImageUploaded(imageCount: number) {
  pushDataLayer({
    event: 'listing_image_uploaded',
    image_count: imageCount,
  });
}

export function trackListingPublished(item: {
  id: string | number;
  name: string;
  category?: string | number;
  price: number;
  pricing_type?: string;
}) {
  pushDataLayer({
    event: 'listing_published',
    item_id: String(item.id),
    item_name: item.name,
    item_category: item.category ? String(item.category) : 'General',
    price: Number(item.price || 0),
    pricing_type: item.pricing_type || 'fixed',
  });
}

export function trackListingEdited(itemId: string | number) {
  pushDataLayer({
    event: 'listing_edited',
    item_id: String(itemId),
  });
}

export function trackListingDeleted(itemId: string | number) {
  pushDataLayer({
    event: 'listing_deleted',
    item_id: String(itemId),
  });
}

export function trackSellerReplySent(conversationId: string | number) {
  pushDataLayer({
    event: 'seller_reply_sent',
    conversation_id: String(conversationId),
  });
}

/* ==========================================================================
   Paid Advertisements & Revenue (E-commerce Schema)
   ========================================================================== */

export function trackViewAdvertisingPlans(
  plans: Array<{ id: string | number; name: string; price?: number | null }>
) {
  clearEcommerce();
  pushDataLayer({
    event: 'view_advertising_plans',
    ecommerce: {
      currency: 'KES',
      items: plans.map((plan, idx) => ({
        item_id: String(plan.id),
        item_name: plan.name,
        item_category: 'Advertising Plan',
        price: Number(plan.price || 0),
        index: idx + 1,
      })),
    },
  });
}

export function trackSelectAdvertisingPlan(plan: {
  id: string | number;
  name: string;
  price?: number | null;
  duration?: number;
}) {
  clearEcommerce();
  pushDataLayer({
    event: 'select_advertising_plan',
    ecommerce: {
      currency: 'KES',
      items: [
        {
          item_id: String(plan.id),
          item_name: plan.name,
          item_category: 'Advertising Plan',
          price: Number(plan.price || 0),
          quantity: plan.duration || 1,
        },
      ],
    },
  });
}

export function trackBeginCheckout(params: {
  plan: { id: string | number; name: string; price: number };
  duration?: number;
  currency?: string;
  coupon?: string;
}) {
  clearEcommerce();
  const val = Number(params.plan.price || 0);
  pushDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: params.currency || 'KES',
      value: val,
      coupon: params.coupon,
      items: [
        {
          item_id: String(params.plan.id),
          item_name: params.plan.name,
          item_category: 'Advertising Plan',
          price: val,
          quantity: params.duration || 1,
        },
      ],
    },
  });
}

export interface PurchaseParams {
  transaction_id: string;
  value: number;
  currency?: string;
  payment_type?: string;
  items: Array<{
    item_id: string | number;
    item_name: string;
    item_category?: string;
    price: number;
    quantity?: number;
  }>;
}

/**
 * Fires the GA4 purchase e-commerce event with strict de-duplication.
 * Ensures revenue is never counted twice on page refresh or component re-renders.
 */
export function trackPurchase(params: PurchaseParams): boolean {
  if (!params.transaction_id) {
    console.warn('[GTM] trackPurchase called without transaction_id');
    return false;
  }

  // De-duplication check
  if (isPurchaseTracked(params.transaction_id)) {
    console.info(`[GTM] Purchase ${params.transaction_id} already tracked. Skipping duplicate.`);
    return false;
  }

  clearEcommerce();
  pushDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: String(params.transaction_id),
      value: Number(params.value || 0),
      currency: params.currency || 'KES',
      tax: 0,
      shipping: 0,
      payment_type: params.payment_type || 'mpesa',
      items: params.items.map((item) => ({
        item_id: String(item.item_id),
        item_name: item.item_name,
        item_category: item.item_category || 'Advertising',
        price: Number(item.price || 0),
        quantity: item.quantity || 1,
      })),
    },
  });

  markPurchaseTracked(params.transaction_id);
  return true;
}

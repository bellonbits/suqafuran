/**
 * Unified Analytics Wrapper (Mixpanel + Google Tag Manager / GA4)
 *
 * Directs business events to both Mixpanel (retention/funnels) and
 * Google Tag Manager (GA4 E-commerce, traffic analysis, Looker Studio).
 * Strictly complies with GA4 PII restrictions (no emails, phone numbers, or chat messages).
 */

import { pushDataLayer } from './gtm';
export * from './gtm';

type MixpanelLike = {
  identify: (id: string) => void;
  reset: () => void;
  track: (event: string, props?: Record<string, unknown>) => void;
  register: (props: Record<string, unknown>) => void;
  people: {
    set: (props: Record<string, unknown>) => void;
    track_charge: (amount: number, props?: Record<string, unknown>) => void;
  };
};

function getMixpanel(): MixpanelLike | null {
  if (typeof window === 'undefined') return null;
  const mp = (window as any).mixpanel;
  if (!mp || typeof mp.track !== 'function') return null;
  return mp;
}

export function identifyUser(user: {
  id: number | string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
}) {
  const mp = getMixpanel();
  if (mp) {
    mp.identify(String(user.id));
    mp.people.set({
      $name: user.full_name,
      $email: user.email,
      phone: user.phone,
      role: user.role,
    });
  }

  // Push pseudonymous ID and role to GTM dataLayer (strictly NO PII to GA4)
  pushDataLayer({
    event: 'user_identified',
    user_id: String(user.id),
    user_role: user.role || 'user',
  });
}

export function resetAnalytics() {
  getMixpanel()?.reset();
  pushDataLayer({
    event: 'user_logout',
    user_id: undefined,
  });
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  getMixpanel()?.track(event, props);
  pushDataLayer({
    event,
    ...props,
  });
}

/**
 * Records a real sale against the current user's profile via Mixpanel's
 * revenue API.
 */
export function trackCharge(amount: number, props?: Record<string, unknown>) {
  getMixpanel()?.people.track_charge(amount, props);
}

/**
 * First-touch acquisition channel, captured once per session
 */
export function captureAcquisitionChannel() {
  const mp = getMixpanel();
  if (!mp) return;

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');

  let channel = utmSource || 'direct';
  if (!utmSource && typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname;
      if (referrerHost && referrerHost !== window.location.hostname) {
        channel = referrerHost;
      }
    } catch {
      // Malformed referrer -- fall back to "direct" already set above.
    }
  }

  mp.register({
    acquisition_channel: channel,
    utm_source: utmSource || undefined,
    utm_medium: utmMedium || undefined,
    utm_campaign: utmCampaign || undefined,
  });

  pushDataLayer({
    event: 'acquisition_channel_set',
    acquisition_channel: channel,
    utm_source: utmSource || undefined,
    utm_medium: utmMedium || undefined,
    utm_campaign: utmCampaign || undefined,
  });
}

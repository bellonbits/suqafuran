/**
 * Thin wrapper around the global Mixpanel snippet (loaded in index.html).
 *
 * Without identify(), every visit is tracked as a fresh anonymous session
 * with no link back to the same person's previous visits or their account
 * -- which is why retention/funnel reports were showing nothing meaningful
 * (just generic autocaptured page views and clicks). This ties real
 * business events to the actual signed-in user.
 */

type MixpanelLike = {
  identify: (id: string) => void;
  reset: () => void;
  track: (event: string, props?: Record<string, unknown>) => void;
  people: { set: (props: Record<string, unknown>) => void };
};

function getMixpanel(): MixpanelLike | null {
  if (typeof window === 'undefined') return null;
  const mp = (window as any).mixpanel;
  if (!mp || typeof mp.track !== 'function') return null;
  return mp;
}

export function identifyUser(user: { id: number | string; full_name?: string; email?: string; phone?: string }) {
  const mp = getMixpanel();
  if (!mp) return;
  mp.identify(String(user.id));
  mp.people.set({
    $name: user.full_name,
    $email: user.email,
    phone: user.phone,
  });
}

export function resetAnalytics() {
  getMixpanel()?.reset();
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  getMixpanel()?.track(event, props);
}

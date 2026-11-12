# Suqafuran — Modern Web Engineering & Performance Standard (MWG 1.0)

Every frontend feature, modification, or pull request across the Suqafuran marketplace (web, Android WebView, and iOS WKWebView) must adhere to **Google Modern Web Guidance 1.0** and the following engineering rules:

---

## 1. Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: ≤ 2.5 seconds on simulated 4G mobile.
- **Interaction to Next Paint (INP)**: ≤ 200 ms.
- **Cumulative Layout Shift (CLS)**: ≤ 0.1.
- **Main-Thread Tasks**: Keep long tasks strictly below 50 ms.

---

## 2. Image Optimization & Resource Loading Priority
- **Critical Hero / First Visible Images**:
  - Must apply `fetchpriority="high"`.
  - Must never use `loading="lazy"` on LCP images.
  - Must specify explicit `width` and `height` or `aspect-ratio` to prevent layout shifts (CLS).
- **Below-the-fold & Offscreen Images**:
  - Must apply native `loading="lazy"`.
  - Do NOT combine `fetchpriority="low"` with `loading="lazy"` on standard below-the-fold images (let them load at normal priority when scrolled into view).
- **Responsive Sizing**:
  - Request optimized Cloudinary dimensions (`w_400,q_auto,f_auto` for cards; `w_1200` for hero/product detail) instead of full-size originals.
- **Non-blocking Rendering**:
  - Product titles, prices, seller info, and verified badges must render immediately without waiting for images to load.

---

## 3. Accessibility & Touch Interactivity (WCAG 2.1 AA)
- **Touch Target Sizes**: All interactive elements (buttons, icons, menu triggers, pagination) must maintain minimum 44×44 CSS px touch targets.
- **Visible Focus States**: Ensure clear, visible keyboard focus indicators (`focus-visible:ring-2 focus-visible:ring-sky-500`).
- **Screen Reader Support**: All icon-only buttons must have `aria-label` or `title`.
- **Motion Preferences**: Respect `prefers-reduced-motion: reduce` for smooth scrolling and animations.
- **IME Composition Safety**: In message inputs, chat bars, and search inputs, always guard Enter key listeners against active composition (`if (e.isComposing || e.keyCode === 229) return;`).

---

## 4. Native Dialogs, Popovers & Component Architecture
- Prefer native `<dialog>` and HTML Popover API where supported, with graceful backward-compatible fallbacks.
- Trap keyboard focus inside open modals and restore focus to trigger on dismiss.
- Prevent background body scrolling when modal drawers or dialogs are active.

---

## 5. Security & Sanitization
- User-generated HTML (e.g. product descriptions, chat messages) must be sanitized before rendering (e.g. DOMPurify).
- Never store raw JWT access tokens in insecure unencrypted public locations.
- Maintain strict Content Security Policy (CSP) and never allow inline unescaped script execution.

---

## 6. Capacitor WebView Compatibility
- Support iOS safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
- Ensure virtual keyboard opening on Android and iOS does not obscure input bars or cause sticky viewport jumps.
- Verify touch gesture scroll chaining (`overscroll-behavior: contain`).


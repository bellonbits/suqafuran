/**
 * Theme detection script that runs synchronously before React hydration
 * Prevents flash of wrong theme on page load
 */
export const getThemeScript = () => {
  return `
    (function() {
      try {
        // Get saved theme or detect system preference
        const savedTheme = localStorage.getItem('theme');
        let isDark = false;

        if (savedTheme) {
          // Use saved preference
          isDark = savedTheme === 'dark';
        } else {
          // Detect system preference
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Apply theme immediately before React renders
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // Fail silently
        console.log('Theme detection failed:', e);
      }
    })();
  `;
};

// Navegadores internos de redes sociales: Google bloquea su inicio de sesión ahí.
const IN_APP_PATTERN = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|MessengerLite|Line\/|TikTok|musical_ly|Snapchat|Twitter/i;

export const isInAppBrowser = () =>
  typeof navigator !== 'undefined' && IN_APP_PATTERN.test(navigator.userAgent);

export const isAndroid = () =>
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

// En Android, un intent abre la misma página en Chrome (o en el navegador por defecto si no está).
export const openInExternalBrowser = () => {
  const { href, host, pathname, search, hash } = window.location;
  if (isAndroid()) {
    window.location.href =
      `intent://${host}${pathname}${search}${hash}#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(href)};end`;
    return;
  }
  window.open(href, '_blank');
};

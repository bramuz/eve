// Píxel de Meta para medir la campaña: visitas, registros y suscripciones.
const PIXEL_ID = '1727109092750735';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

// Las páginas de reserva las usan los clientes de cada profesional, no los de Stetik.
const isTrackedPath = (path: string) => !path.startsWith('/reservar/');

const loadPixel = () => {
  if (window.fbq || import.meta.env.DEV) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', PIXEL_ID);
};

export const trackPageView = (path: string) => {
  if (!isTrackedPath(path)) return;
  loadPixel();
  window.fbq?.('track', 'PageView');
};

export const trackEvent = (event: string, params?: Record<string, unknown>) => {
  if (!isTrackedPath(window.location.pathname)) return;
  loadPixel();
  window.fbq?.('track', event, params);
};

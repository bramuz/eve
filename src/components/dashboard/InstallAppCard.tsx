import { useState, useSyncExternalStore } from 'react';
import { Smartphone, X } from 'lucide-react';
import { canInstall, onInstallAvailabilityChange, promptInstall } from '../../utils/installPrompt';
import { isInAppBrowser } from '../../utils/inAppBrowser';
import { trackCustomEvent } from '../../analytics/metaPixel';

const DISMISS_KEY = 'installCardDismissed';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

// Pasos según el celular: Chrome a veces ofrece el botón directo; iPhone y otros navegadores no.
const manualSteps = () => {
  if (isInAppBrowser()) return 'Primero abre Stetik en Chrome o Safari (menú ⋯ > "Abrir en el navegador"). Desde ahí podrás instalarla.';
  if (isIOS()) return 'En Safari toca Compartir (el cuadrado con la flecha ↑) y luego "Agregar a inicio".';
  return 'En Chrome toca el menú ⋮ arriba a la derecha y elige "Instalar app" o "Agregar a la pantalla principal".';
};

// Ícono en la pantalla de inicio: abren Stetik como una app, sin buscar el link.
export const InstallAppCard = () => {
  const available = useSyncExternalStore(onInstallAvailabilityChange, canInstall, () => false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [showSteps, setShowSteps] = useState(false);

  if (dismissed || isStandalone()) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Sin almacenamiento: se oculta solo en esta visita.
    }
    setDismissed(true);
  };

  const install = async () => {
    if (available) {
      const accepted = await promptInstall();
      trackCustomEvent('InstallApp', { accepted, method: 'prompt' });
      return;
    }
    setShowSteps(true);
    trackCustomEvent('InstallApp', { method: 'instructions' });
  };

  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-3 dark:border-warm-700 dark:bg-warm-800">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <Smartphone className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-semibold text-warm-900 dark:text-white">Instala Stetik en tu celular</span>
          <span className="block text-xs text-warm-600 dark:text-warm-400">Ábrela desde tu pantalla de inicio, como una app.</span>
        </span>
        <button
          type="button"
          onClick={() => void install()}
          className="rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ocultar"
          className="rounded-full p-1 text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {showSteps && (
        <p className="mt-3 rounded-xl bg-primary-50 p-3 text-left text-sm text-warm-800 dark:bg-primary-900/20 dark:text-warm-100">
          {manualSteps()}
        </p>
      )}
    </div>
  );
};

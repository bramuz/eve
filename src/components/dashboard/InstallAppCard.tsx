import { useSyncExternalStore } from 'react';
import { Smartphone } from 'lucide-react';
import { canInstall, onInstallAvailabilityChange, promptInstall } from '../../utils/installPrompt';
import { trackCustomEvent } from '../../analytics/metaPixel';

// Ícono en la pantalla de inicio: abren Stetik como una app, sin buscar el link.
export const InstallAppCard = () => {
  const available = useSyncExternalStore(onInstallAvailabilityChange, canInstall, () => false);
  if (!available) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        const accepted = await promptInstall();
        trackCustomEvent('InstallApp', { accepted });
      }}
      className="flex w-full items-center gap-3 rounded-2xl border border-warm-200 bg-white p-3 text-left hover:bg-primary-50 dark:border-warm-700 dark:bg-warm-800 dark:hover:bg-primary-900/20"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        <Smartphone className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-warm-900 dark:text-white">Instala Stetik en tu celular</span>
        <span className="block text-xs text-warm-600 dark:text-warm-400">Ábrela desde tu pantalla de inicio, como una app.</span>
      </span>
      <span className="text-sm font-semibold text-primary-600">Instalar</span>
    </button>
  );
};

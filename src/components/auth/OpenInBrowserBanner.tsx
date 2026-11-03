import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { isAndroid, isInAppBrowser, openInExternalBrowser } from '../../utils/inAppBrowser';

// Dentro de Facebook/Instagram la sesión queda en su navegador interno; mejor que usen Stetik en el suyo.
export const OpenInBrowserBanner = ({ className = '' }: { className?: string }) => {
  const [inApp] = useState(isInAppBrowser);
  if (!inApp) return null;

  return (
    <div className={`rounded-2xl bg-primary-600 p-4 text-left text-white shadow-glow ${className}`}>
      <p className="font-semibold">Para una mejor experiencia, abre Stetik en tu navegador</p>
      {isAndroid() ? (
        <>
          <p className="mt-1 text-sm text-white/90">
            Así podrás entrar con Google y tu sesión quedará guardada en tu celular.
          </p>
          <button
            type="button"
            onClick={openInExternalBrowser}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 sm:w-auto"
          >
            <ExternalLink className="h-4 w-4" /> Abrir en Chrome
          </button>
        </>
      ) : (
        <p className="mt-1 text-sm text-white/90">
          Toca <strong>⋯</strong> arriba a la derecha y elige <strong>"Abrir en el navegador"</strong>. Así
          podrás entrar con Google y tu sesión quedará guardada.
        </p>
      )}
    </div>
  );
};

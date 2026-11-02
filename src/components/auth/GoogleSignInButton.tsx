import { useState } from 'react';
import { Chrome, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { isAndroid, isInAppBrowser, openInExternalBrowser } from '../../utils/inAppBrowser';

interface GoogleSignInButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const GoogleSignInButton = ({ label, onClick, disabled }: GoogleSignInButtonProps) => {
  const [inApp] = useState(isInAppBrowser);

  if (!inApp) {
    return (
      <Button
        type="button"
        variant="secondary"
        fullWidth
        icon={<Chrome className="w-5 h-5" />}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </Button>
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado. Pégalo en Chrome o Safari.');
    } catch {
      toast.error('No se pudo copiar. Copia el link desde el menú ⋯');
    }
  };

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-gray-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-gray-300">
      <p className="font-semibold text-gray-900 dark:text-white">¿Quieres entrar con Google?</p>
      <p className="mt-1">
        Google no permite iniciar sesión dentro de Facebook o Instagram.{' '}
        {isAndroid()
          ? 'Abre Stetik en Chrome para continuar, o usa tu correo arriba.'
          : 'Toca ⋯ arriba a la derecha y elige "Abrir en el navegador", o usa tu correo arriba.'}
      </p>
      <div className="mt-3 flex gap-2">
        {isAndroid() && (
          <Button type="button" size="sm" icon={<ExternalLink className="w-4 h-4" />} onClick={openInExternalBrowser}>
            Abrir en Chrome
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" icon={<Copy className="w-4 h-4" />} onClick={() => void copyLink()}>
          Copiar link
        </Button>
      </div>
    </div>
  );
};

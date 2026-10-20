import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Loading } from './ui/Loading';
import { LegalFooter } from './layout/LegalFooter';
import { getLegalAcceptance, recordLegalAcceptance } from '../legal/acceptance';

interface LegalAcceptanceGateProps {
  children: React.ReactNode;
}

const checkAcceptance = () => getLegalAcceptance();

const getAcceptanceErrorMessage = (error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  if (code === 'functions/not-found') {
    return 'La función de Firebase que verifica la aceptación legal no está desplegada. Desde la carpeta del proyecto ejecuta: npm run deploy --prefix functions. Verifica también que Firebase CLI esté apuntando al proyecto correcto.';
  }

  if (code === 'functions/unauthenticated') {
    return 'Tu sesión expiró. Cierra sesión, vuelve a iniciar sesión e inténtalo de nuevo.';
  }

  if (code === 'functions/permission-denied') {
    return 'Firebase rechazó la verificación. Revisa que la cuenta tenga sesión activa y que las Cloud Functions estén desplegadas en el proyecto correcto.';
  }

  return 'No se pudo conectar con Firebase para verificar la aceptación. Revisa tu conexión y confirma que las Cloud Functions estén desplegadas.';
};

export const LegalAcceptanceGate = ({ children }: LegalAcceptanceGateProps) => {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    checkAcceptance()
      .then((hasAccepted) => {
        if (active) {
          setAccepted(hasAccepted);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        console.error('No se pudo comprobar la aceptación legal:', error);
        if (active) setLoadError(getAcceptanceErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const retryAcceptance = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setAccepted(await checkAcceptance());
    } catch (error) {
      console.error('No se pudo comprobar la aceptación legal:', error);
      setLoadError(getAcceptanceErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!checked) return;
    setSaving(true);
    try {
      await recordLegalAcceptance('in-app', true);
      setAccepted(true);
      toast.success('Aceptación registrada');
    } catch (error) {
      console.error('No se pudo registrar la aceptación legal:', error);
      toast.error('No se pudo guardar tu aceptación. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-warm-50 p-4 dark:bg-warm-900">
        <section className="w-full max-w-lg rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-warm-800">
          <TriangleAlert className="mx-auto h-8 w-8 text-amber-600" />
          <h1 className="mt-3 text-xl font-semibold text-warm-900 dark:text-white">
            No pudimos verificar tus documentos
          </h1>
          <p className="mt-2 text-sm text-warm-700 dark:text-warm-200">
            {loadError} No continuaremos hasta comprobar la versión aceptada.
          </p>
          <Button onClick={retryAcceptance} loading={loading} className="mt-5">
            Reintentar
          </Button>
        </section>
      </main>
    );
  }

  if (accepted) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-50 p-4 dark:bg-warm-900">
      <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-sm dark:bg-warm-800">
        <h1 className="text-2xl font-bold text-warm-900 dark:text-white">
          Actualizamos nuestros documentos
        </h1>
        <p className="mt-3 text-sm leading-6 text-warm-700 dark:text-warm-200">
          Para continuar, revisa y acepta los documentos vigentes. La Política explica el
          tratamiento de datos; los Términos incluyen las condiciones de uso y suscripción.
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm text-warm-800 dark:text-warm-100">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary-600"
          />
          <span>
            Confirmo que soy mayor de 18 años y acepto los{' '}
            <a className="underline" href="/legal/terminos" target="_blank" rel="noreferrer">
              Términos y condiciones
            </a>{' '}
            y la{' '}
            <a className="underline" href="/legal/privacidad" target="_blank" rel="noreferrer">
              Política de tratamiento de datos personales
            </a>.
          </span>
        </label>
        <Button
          onClick={() => void handleAccept()}
          disabled={!checked}
          loading={saving}
          className="mt-5 w-full"
        >
          Aceptar y continuar
        </Button>
        <LegalFooter />
      </section>
    </main>
  );
};

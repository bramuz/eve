import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { functions } from '../firebase/config';
import { usePlan } from '../context/PlanContext';
import { FREE_CLIENT_LIMIT, PREMIUM_PRICE_LABEL } from '../config/plans';
import { Button } from '../components/ui/Button';

const FREE_FEATURES = [
  `Hasta ${FREE_CLIENT_LIMIT} clientes`,
  'Agenda citas desde hoy hasta 7 días adelante'
];

const PREMIUM_FEATURES = [
  'Clientes ilimitados',
  'Agenda citas de cualquier semana',
  'Todas las funciones actuales y futuras'
];

export const Plans = () => {
  const { isPremium, premiumUntil } = usePlan();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnedFromPayment = searchParams.has('preapproval_id');
  const [waitingTimedOut, setWaitingTimedOut] = useState(false);
  const waitingForPremium = returnedFromPayment && !isPremium && !waitingTimedOut;

  useEffect(() => {
    if (!returnedFromPayment) return;
    if (isPremium) {
      toast.success('¡Pago recibido! Tu plan Premium ya está activo.');
      setSearchParams({}, { replace: true });
      return;
    }
    const timer = setTimeout(() => setWaitingTimedOut(true), 60000);
    return () => clearTimeout(timer);
  }, [returnedFromPayment, isPremium, setSearchParams]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const createSubscription = httpsCallable<{ returnUrl: string }, { url: string }>(
        functions,
        'createSubscription'
      );
      const { data } = await createSubscription({ returnUrl: `${window.location.origin}/plans` });
      window.location.assign(data.url);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo iniciar la suscripción');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/dashboard')}
          aria-label="Volver al inicio"
          className="p-2 -ml-2 rounded-full text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-warm-900 dark:text-white">Planes</h2>
      </div>

      {waitingForPremium && (
        <div className="p-4 rounded-2xl bg-gold-300/30 text-warm-800 dark:text-warm-100 text-sm flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          Estamos confirmando tu pago con Mercado Pago. Esto toma unos segundos, no cierres la página.
        </div>
      )}

      {returnedFromPayment && !isPremium && waitingTimedOut && (
        <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm">
          Tu pago aún no se refleja. Puede tardar unos minutos: si ya pagaste, tu plan se activará solo. Si en 10 minutos no cambia, contáctanos.
        </div>
      )}

      {isPremium && premiumUntil && (
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm">
          Tienes el plan Premium activo hasta el {format(premiumUntil, 'dd/MM/yyyy')}.
        </div>
      )}

      <div className="rounded-2xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 p-5">
        <h3 className="text-lg font-semibold text-warm-900 dark:text-white">Gratis</h3>
        <ul className="mt-3 space-y-2">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-warm-700 dark:text-warm-300">
              <Check className="w-4 h-4" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-primary-500 bg-white dark:bg-warm-800 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-warm-900 dark:text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary-600" /> Premium
          </h3>
          <span className="font-bold text-primary-600">{PREMIUM_PRICE_LABEL}</span>
        </div>
        <ul className="mt-3 space-y-2">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-warm-700 dark:text-warm-300">
              <Check className="w-4 h-4 text-primary-600" /> {f}
            </li>
          ))}
        </ul>
        {!isPremium && (
          <Button onClick={handleSubscribe} loading={loading} className="w-full mt-5 h-12">
            Suscribirme
          </Button>
        )}
      </div>
    </div>
  );
};

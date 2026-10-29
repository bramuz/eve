import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { functions } from '../firebase/config';
import { usePlan } from '../context/PlanContext';
import {
  FREE_CLIENT_LIMIT,
  PREMIUM_PRICE_LABEL,
  SEMIANNUAL_MONTHLY_LABEL,
  SEMIANNUAL_SAVINGS_LABEL,
  SEMIANNUAL_TOTAL_LABEL,
  type PlanId
} from '../config/plans';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LegalFooter } from '../components/layout/LegalFooter';
import { DeleteAccountSection } from '../components/DeleteAccountSection';

const FREE_FEATURES = [
  `Hasta ${FREE_CLIENT_LIMIT} usuarios`,
  'Agenda citas desde hoy hasta 7 días adelante'
];

const PREMIUM_FEATURES = [
  'Usuarios ilimitados',
  'Agenda citas de cualquier semana',
  'Reservas online con link para tus usuarios',
  'Todas las funciones actuales y futuras'
];

export const Plans = () => {
  const { isPremium, premiumUntil, subscriptionStatus } = usePlan();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnedFromPayment = searchParams.has('preapproval_id');
  const [waitingTimedOut, setWaitingTimedOut] = useState(false);
  const waitingForPremium = returnedFromPayment && !isPremium && !waitingTimedOut;
  const canCancelSubscription = ['authorized', 'pending', 'paused'].includes(subscriptionStatus ?? '');
  const canStartSubscription = !isPremium && (!subscriptionStatus || subscriptionStatus === 'cancelled');

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

  const handleSubscribe = async (plan: PlanId) => {
    setLoadingPlan(plan);
    try {
      const createSubscription = httpsCallable<{ returnUrl: string; plan: PlanId }, { url: string }>(
        functions,
        'createSubscription'
      );
      const { data } = await createSubscription({ returnUrl: `${window.location.origin}/plans`, plan });
      window.location.assign(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar la suscripción');
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const cancelSubscription = httpsCallable<void, { status: string }>(
        functions,
        'cancelSubscription'
      );
      await cancelSubscription();
      toast.success('Suscripción cancelada. No se generarán nuevos cobros.');
      setConfirmCancel(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cancelar la suscripción');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-24 sm:p-6">
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

      {canCancelSubscription && (
        <div className="rounded-xl border border-warm-200 bg-white p-4 dark:border-warm-700 dark:bg-warm-800">
          <p className="text-sm text-warm-700 dark:text-warm-300">
            Tu suscripción se renueva automáticamente por Mercado Pago (cada mes o cada 6 meses,
            según el plan elegido). Puedes detener las próximas renovaciones aquí;
            conservarás el acceso Premium hasta el final del período pagado.
          </p>
          <Button
            variant="outline"
            onClick={() => setConfirmCancel(true)}
            loading={cancelling}
            className="mt-3"
          >
            Cancelar renovación
          </Button>
        </div>
      )}

      {subscriptionStatus === 'cancelled' && (
        <div className="rounded-xl bg-warm-100 p-4 text-sm text-warm-700 dark:bg-warm-800 dark:text-warm-300">
          La renovación está cancelada. No se generarán nuevos cobros.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
      <div className="flex flex-col rounded-2xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 p-6">
        <h3 className="text-lg font-semibold text-warm-900 dark:text-white">Gratis</h3>
        <p className="mt-2 text-3xl font-bold text-warm-900 dark:text-white">$0</p>
        <p className="mt-1 text-sm text-warm-600 dark:text-warm-400">Para empezar, sin costo</p>
        <ul className="mt-5 flex-1 space-y-3">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="grid grid-cols-[1rem_1fr] items-start gap-x-2 text-sm text-left text-warm-700 dark:text-warm-300">
              <Check className="mt-0.5 w-4 h-4 flex-shrink-0" /> <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-warm-200 dark:border-warm-700 text-sm font-semibold text-warm-600 dark:text-warm-300">
          {isPremium ? 'Plan básico' : 'Tu plan actual'}
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border-2 border-primary-500 bg-white dark:bg-warm-800 p-6">
        <h3 className="text-lg font-semibold text-warm-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary-600" /> Premium mensual
        </h3>
        <p className="mt-2 text-3xl font-bold text-primary-600">{PREMIUM_PRICE_LABEL}</p>
        <p className="mt-1 text-sm text-warm-600 dark:text-warm-400">Se renueva cada mes</p>
        <ul className="mt-5 flex-1 space-y-3">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="grid grid-cols-[1rem_1fr] items-start gap-x-2 text-sm text-left text-warm-700 dark:text-warm-300">
              <Check className="mt-0.5 w-4 h-4 flex-shrink-0 text-primary-600" /> <span>{f}</span>
            </li>
          ))}
        </ul>
        {canStartSubscription && (
          <Button
            onClick={() => handleSubscribe('monthly')}
            loading={loadingPlan === 'monthly'}
            disabled={loadingPlan !== null}
            className="w-full mt-6 h-12"
          >
            Suscribirme mensual
          </Button>
        )}
        {subscriptionStatus === 'pending' && (
          <p className="mt-4 text-sm text-warm-700 dark:text-warm-300">
            Hay una suscripción pendiente. Puedes completar el pago o cancelar la renovación pendiente antes de iniciar otra.
          </p>
        )}
      </div>

      <div className="relative flex flex-col rounded-2xl border-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20 p-6">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
          Ahorras {SEMIANNUAL_SAVINGS_LABEL}
        </span>
        <h3 className="text-lg font-semibold text-warm-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary-600" /> Premium 6 meses
        </h3>
        <p className="mt-2 text-3xl font-bold text-primary-600">{SEMIANNUAL_MONTHLY_LABEL}</p>
        <p className="mt-1 text-sm text-warm-700 dark:text-warm-300">
          Pago único de <strong>{SEMIANNUAL_TOTAL_LABEL}</strong> por los 6 meses
        </p>
        <ul className="mt-5 flex-1 space-y-3">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="grid grid-cols-[1rem_1fr] items-start gap-x-2 text-sm text-left text-warm-700 dark:text-warm-300">
              <Check className="mt-0.5 w-4 h-4 flex-shrink-0 text-primary-600" /> <span>{f}</span>
            </li>
          ))}
        </ul>
        {canStartSubscription && (
          <Button
            onClick={() => handleSubscribe('semiannual')}
            loading={loadingPlan === 'semiannual'}
            disabled={loadingPlan !== null}
            className="w-full mt-6 h-12"
          >
            Suscribirme por 6 meses
          </Button>
        )}
      </div>
      </div>

      <DeleteAccountSection />

      <LegalFooter />

      <ConfirmDialog
        isOpen={confirmCancel}
        title="¿Cancelar la renovación?"
        message={`Mercado Pago dejará de generar futuros cobros. ${
          premiumUntil
            ? `Mantendrás Premium hasta el ${format(premiumUntil, 'dd/MM/yyyy')}.`
            : 'El acceso Premium terminará cuando finalice el período pagado.'
        }`}
        confirmText="Sí, cancelar renovación"
        cancelText="Volver"
        variant="warning"
        onConfirm={() => void handleCancelSubscription()}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
};

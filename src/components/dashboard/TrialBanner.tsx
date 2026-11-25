import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';

// Recuerda cuántos días de prueba quedan; los últimos 2 días se ve más fuerte.
export const TrialBanner = () => {
  const { isTrial, trialDaysLeft } = usePlan();
  if (!isTrial) return null;

  const urgent = trialDaysLeft <= 2;
  const daysText = trialDaysLeft === 1 ? 'Hoy es tu último día' : `Te quedan ${trialDaysLeft} días`;

  return (
    <Link
      to="/plans"
      className={`flex items-center gap-3 rounded-2xl p-3 text-left ${
        urgent
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'border border-primary-200 bg-primary-50 text-primary-900 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-100'
      }`}
    >
      <Crown className="h-5 w-5 flex-shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Prueba Premium gratis · {daysText}</span>
        <span className={`block text-xs ${urgent ? 'text-white/90' : 'text-primary-700 dark:text-primary-300'}`}>
          WhatsApp, link de reservas y todo sin límites. Elige un plan para no perderlo.
        </span>
      </span>
      <span className="text-sm font-semibold underline">Ver planes</span>
    </Link>
  );
};

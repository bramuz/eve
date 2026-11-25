import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Check, ChevronRight, Link2, UserPlus, X } from 'lucide-react';
import { countDocuments, where } from '../../firebase/firestore';
import { getBookingProfile } from '../../firebase/booking';
import { usePlan } from '../../context/PlanContext';
import { trackCustomEvent } from '../../analytics/metaPixel';

interface OnboardingChecklistProps {
  uid: string;
  totalClients: number;
}

const dismissKey = (uid: string) => `onboardingDismissed:${uid}`;

const isDismissed = (uid: string) => {
  try {
    return localStorage.getItem(dismissKey(uid)) === '1';
  } catch {
    return false;
  }
};

// Primeros pasos para que una cuenta nueva no se quede en un panel vacío.
export const OnboardingChecklist = ({ uid, totalClients }: OnboardingChecklistProps) => {
  const navigate = useNavigate();
  const { isPremium } = usePlan();
  const [dismissed, setDismissed] = useState(() => isDismissed(uid));
  const [progress, setProgress] = useState<{ appointments: number; bookingEnabled: boolean } | null>(null);

  useEffect(() => {
    if (dismissed) return;
    let active = true;
    Promise.all([
      countDocuments('appointments', [where('userId', '==', uid)]),
      getBookingProfile(uid).catch(() => null)
    ]).then(([{ count }, profile]) => {
      if (active) setProgress({ appointments: count, bookingEnabled: !!profile?.enabled });
    });
    return () => {
      active = false;
    };
  }, [uid, dismissed]);

  if (dismissed || !progress) return null;

  const steps = [
    {
      done: totalClients > 0,
      icon: UserPlus,
      title: 'Agrega tu primer usuario',
      text: 'Nombre y celular. Luego lo eliges en segundos al agendar.',
      to: '/clients'
    },
    {
      done: progress.appointments > 0,
      icon: CalendarPlus,
      title: 'Agenda tu primera cita',
      text: 'Y envíale el recordatorio por WhatsApp con un toque.',
      to: '/appointments'
    },
    {
      done: progress.bookingEnabled,
      icon: Link2,
      title: isPremium ? 'Comparte tu link de reservas' : 'Activa tu link de reservas 👑',
      text: 'Tus clientes eligen la hora solos, sin escribirte.',
      to: '/appointments'
    }
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(uid), '1');
    } catch {
      // Sin almacenamiento: se oculta solo en esta visita.
    }
    setDismissed(true);
  };

  return (
    <section className="rounded-2xl border border-primary-200 bg-white p-4 shadow-sm dark:border-primary-800 dark:bg-warm-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-warm-900 dark:text-white">Primeros pasos</h2>
          <p className="text-xs text-warm-600 dark:text-warm-400">
            {completed} de {steps.length} listos
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ocultar primeros pasos"
          className="rounded-full p-1.5 text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-warm-100 dark:bg-warm-700">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map(({ done, icon: Icon, title, text, to }) => (
          <li key={title}>
            <button
              type="button"
              disabled={done}
              onClick={() => {
                trackCustomEvent('OnboardingStep', { step: title });
                navigate(to);
              }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-primary-50 disabled:hover:bg-transparent dark:hover:bg-primary-900/20"
            >
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                  done
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${done ? 'text-warm-400 line-through' : 'text-warm-900 dark:text-white'}`}>
                  {title}
                </span>
                {!done && <span className="block text-xs text-warm-600 dark:text-warm-400">{text}</span>}
              </span>
              {!done && <ChevronRight className="h-4 w-4 text-warm-400" />}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};

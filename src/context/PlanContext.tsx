import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { addDays, endOfDay } from 'date-fns';
import { useAuth } from './AuthContext';
import { FREE_CLIENT_LIMIT } from '../config/plans';

interface PlanContextType {
  isPremium: boolean;
  loading: boolean;
  premiumUntil: Date | null;
  subscriptionStatus: string | null;
  /** Está usando los 7 días de prueba (Premium sin haber pagado). */
  isTrial: boolean;
  trialEndsAt: Date | null;
  /** Días que le quedan a la prueba, redondeando hacia arriba. 0 si no está en prueba. */
  trialDaysLeft: number;
  clientLimit: number;
  canAddClient: (currentCount: number) => boolean;
  canScheduleOn: (date: Date) => boolean;
}

// Se pide una vez por cuenta y sesión; el servidor decide si corresponde (una sola prueba por cuenta).
const trialRequested = new Set<string>();

const requestTrial = async (uid: string) => {
  if (trialRequested.has(uid)) return;
  trialRequested.add(uid);
  try {
    const [{ httpsCallable }, { functions }] = await Promise.all([
      import('firebase/functions'),
      import('../firebase/config')
    ]);
    await httpsCallable(functions, 'startTrial')();
  } catch (error) {
    // Si falla, se intenta de nuevo en la próxima visita.
    trialRequested.delete(uid);
    console.warn('No se pudo activar la prueba de 7 días:', error);
  }
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [premiumUntil, setPremiumUntil] = useState<Date | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setPremiumUntil(null);
      setSubscriptionStatus(null);
      setTrialEndsAt(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Firestore se descarga solo con sesión iniciada: la página pública no lo necesita.
    let active = true;
    let unsubscribe: (() => void) | null = null;
    Promise.all([import('firebase/firestore'), import('../firebase/config')])
      .then(([{ doc, onSnapshot }, { db }]) => {
        if (!active) return;
        unsubscribe = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (snap) => {
            const data = snap.data();
            const until = data?.premiumUntil as Timestamp | undefined;
            const trialEnd = data?.trialEndsAt as Timestamp | undefined;
            const status = data?.subscriptionStatus;
            setPremiumUntil(until ? until.toDate() : null);
            setSubscriptionStatus(typeof status === 'string' ? status : null);
            setTrialEndsAt(trialEnd ? trialEnd.toDate() : null);
            setLoading(false);
            // Cuentas nuevas y existentes que nunca tuvieron prueba ni suscripción.
            if (!data?.trialStartedAt && !data?.preapprovalId && !data?.subscriptionStatus) {
              void requestTrial(currentUser.uid);
            }
          },
          () => {
            setPremiumUntil(null);
            setSubscriptionStatus(null);
            setTrialEndsAt(null);
            setLoading(false);
          }
        );
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [currentUser]);

  const value = useMemo<PlanContextType>(() => {
    const now = Date.now();
    const isPremium = premiumUntil !== null && premiumUntil.getTime() > now;
    // En prueba: Premium solo por la prueba (sin suscripción que lo extienda).
    const isTrial = isPremium && !subscriptionStatus && trialEndsAt !== null && trialEndsAt.getTime() > now;
    const trialDaysLeft = isTrial && trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now) / 86400000) : 0;

    return {
      isPremium,
      loading,
      premiumUntil,
      subscriptionStatus,
      isTrial,
      trialEndsAt,
      trialDaysLeft,
      clientLimit: FREE_CLIENT_LIMIT,
      canAddClient: (currentCount) => isPremium || currentCount < FREE_CLIENT_LIMIT,
      canScheduleOn: (date) =>
        isPremium || date.getTime() <= endOfDay(addDays(new Date(), 7)).getTime()
    };
  }, [premiumUntil, subscriptionStatus, trialEndsAt, loading]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { endOfWeek } from 'date-fns';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { FREE_CLIENT_LIMIT } from '../config/plans';

interface PlanContextType {
  isPremium: boolean;
  loading: boolean;
  premiumUntil: Date | null;
  clientLimit: number;
  canAddClient: (currentCount: number) => boolean;
  canScheduleOn: (date: Date) => boolean;
}

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setPremiumUntil(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snap) => {
        const until = snap.data()?.premiumUntil as Timestamp | undefined;
        setPremiumUntil(until ? until.toDate() : null);
        setLoading(false);
      },
      () => {
        setPremiumUntil(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const value = useMemo<PlanContextType>(() => {
    const isPremium = premiumUntil !== null && premiumUntil.getTime() > Date.now();

    return {
      isPremium,
      loading,
      premiumUntil,
      clientLimit: FREE_CLIENT_LIMIT,
      canAddClient: (currentCount) => isPremium || currentCount < FREE_CLIENT_LIMIT,
      canScheduleOn: (date) =>
        isPremium || date.getTime() <= endOfWeek(new Date(), { weekStartsOn: 1 }).getTime()
    };
  }, [premiumUntil, loading]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

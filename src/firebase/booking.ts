import { collection, doc, getDoc, getDocs, query, where, writeBatch, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

export interface BookingProfile {
  userId: string;
  businessName: string;
  enabled: boolean;
  slotMinutes: number;
  services: string[];
}

export interface DayAvailability {
  userId: string;
  dateKey: string; // yyyy-MM-dd
  times: string[]; // HH:mm
}

export const timeKey = (time: string) => time.replace(':', '');

// Muestra "14:30" como "2:30 PM"; el valor guardado sigue en 24 h.
export const formatTime12 = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export const splitAmPm = (times: string[]) => ({
  am: times.filter((t) => t < '12:00'),
  pm: times.filter((t) => t >= '12:00')
});
export const availabilityId = (uid: string, dateKey: string) => `${uid}_${dateKey}`;
export const bookingId = (uid: string, dateKey: string, time: string) =>
  `${uid}_${dateKey}_${timeKey(time)}`;

export const getBookingLink = (uid: string) => `${window.location.origin}/reservar/${uid}`;

export const getBookingProfile = async (uid: string): Promise<BookingProfile | null> => {
  const snap = await getDoc(doc(db, 'bookingProfiles', uid));
  return snap.exists() ? (snap.data() as BookingProfile) : null;
};

export const saveBookingProfile = (profile: BookingProfile) =>
  setDoc(doc(db, 'bookingProfiles', profile.userId), profile);

export interface NotificationSettings {
  userId: string;
  phone: string;
  whatsappEnabled: boolean;
}

export const getNotificationSettings = async (uid: string): Promise<NotificationSettings | null> => {
  const snap = await getDoc(doc(db, 'notificationSettings', uid));
  return snap.exists() ? (snap.data() as NotificationSettings) : null;
};

export const saveNotificationSettings = (settings: NotificationSettings) =>
  setDoc(doc(db, 'notificationSettings', settings.userId), settings);

export const getAvailability = async (uid: string) => {
  const snap = await getDocs(query(collection(db, 'availability'), where('userId', '==', uid)));
  const map: Record<string, string[]> = {};
  snap.docs.forEach((d) => {
    const data = d.data() as DayAvailability;
    map[data.dateKey] = data.times;
  });
  return map;
};

// Guarda los horarios de un día; sin horarios el día queda bloqueado.
export const saveDayAvailability = async (uid: string, dateKey: string, times: string[]) => {
  const ref = doc(db, 'availability', availabilityId(uid, dateKey));
  if (times.length === 0) {
    const existing = await getDoc(ref);
    if (existing.exists()) await deleteDoc(ref);
  } else {
    await setDoc(ref, { userId: uid, dateKey, times: [...times].sort() });
  }
};

// Horarios ya reservados por usuarios, por fecha.
export const getTakenSlots = async (uid: string) => {
  const snap = await getDocs(query(collection(db, 'slotLocks'), where('userId', '==', uid)));
  const map: Record<string, string[]> = {};
  snap.docs.forEach((d) => {
    const { dateKey, time } = d.data() as { dateKey: string; time: string };
    (map[dateKey] ||= []).push(time);
  });
  return map;
};

export interface BookingInput {
  whatsappConsent: boolean;
  uid: string;
  dateKey: string;
  time: string;
  clientName: string;
  clientPhone: string;
  service: string;
  notes: string;
}

// Crea en un solo lote el bloqueo del horario y la cita en la agenda del profesional.
export const createPublicBooking = async (input: BookingInput) => {
  const id = bookingId(input.uid, input.dateKey, input.time);
  const batch = writeBatch(db);
  const now = Timestamp.now();

  batch.set(doc(db, 'slotLocks', id), {
    userId: input.uid,
    dateKey: input.dateKey,
    time: input.time
  });
  batch.set(doc(db, 'appointments', id), {
    userId: input.uid,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    service: input.service,
    date: Timestamp.fromDate(new Date(`${input.dateKey}T00:00:00`)),
    dateKey: input.dateKey,
    time: input.time,
    price: 0,
    paid: 0,
    paymentStatus: 'pendiente',
    notes: input.notes,
    source: 'online',
    whatsappConsent: input.whatsappConsent,
    createdAt: now,
    updatedAt: now
  });
  await batch.commit();
};

// Libera el horario cuando el profesional elimina una cita online.
export const releaseSlot = async (appointmentId: string) => {
  try {
    await deleteDoc(doc(db, 'slotLocks', appointmentId));
  } catch {
    // La cita puede no tener bloqueo (cita manual).
  }
};

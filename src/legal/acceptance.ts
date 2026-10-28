import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from './documents';

export type LegalAcceptanceMethod = 'email' | 'google' | 'in-app';

interface LegalAcceptanceResponse {
  accepted: boolean;
}

// La aceptación es un registro histórico que no se revoca, así que basta con
// verificarla una vez por usuario y versión de documentos. Evita llamar a la
// Cloud Function (con arranque en frío) en cada carga y en cada cambio de ruta.
const acceptanceCacheKey = (uid: string) =>
  `legalAccepted:${uid}:${LEGAL_TERMS_VERSION}:${LEGAL_PRIVACY_VERSION}`;

const acceptedInSession = new Set<string>();

export const hasCachedLegalAcceptance = (uid: string) => {
  const key = acceptanceCacheKey(uid);
  if (acceptedInSession.has(key)) return true;
  try {
    if (localStorage.getItem(key) === '1') {
      acceptedInSession.add(key);
      return true;
    }
  } catch {
    // localStorage no disponible (modo privado); se verifica en el servidor.
  }
  return false;
};

const cacheLegalAcceptance = (uid: string) => {
  const key = acceptanceCacheKey(uid);
  acceptedInSession.add(key);
  try {
    localStorage.setItem(key, '1');
  } catch {
    // Ignorar: el caché en memoria sigue funcionando durante la sesión.
  }
};

export const getLegalAcceptance = async (uid: string) => {
  if (hasCachedLegalAcceptance(uid)) return true;

  const checkAcceptance = httpsCallable<void, LegalAcceptanceResponse>(
    functions,
    'getLegalAcceptance'
  );
  const { data } = await checkAcceptance();
  if (data.accepted) cacheLegalAcceptance(uid);
  return data.accepted;
};

export const recordLegalAcceptance = async (
  uid: string,
  method: LegalAcceptanceMethod,
  confirmedAdult: boolean
) => {
  const saveAcceptance = httpsCallable<
    {
      termsVersion: string;
      privacyVersion: string;
      method: LegalAcceptanceMethod;
      confirmedAdult: boolean;
      userAgent: string;
    },
    { recorded: boolean }
  >(functions, 'recordLegalAcceptance');

  const { data } = await saveAcceptance({
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
    method,
    confirmedAdult,
    userAgent: navigator.userAgent.slice(0, 500)
  });

  if (!data.recorded) {
    throw new Error('El servidor no confirmó el registro de la aceptación legal.');
  }
  cacheLegalAcceptance(uid);
};

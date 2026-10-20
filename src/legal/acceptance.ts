import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from './documents';

export type LegalAcceptanceMethod = 'email' | 'google' | 'in-app';

interface LegalAcceptanceResponse {
  accepted: boolean;
}

export const getLegalAcceptance = async () => {
  const checkAcceptance = httpsCallable<void, LegalAcceptanceResponse>(
    functions,
    'getLegalAcceptance'
  );
  const { data } = await checkAcceptance();
  return data.accepted;
};

export const recordLegalAcceptance = async (
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

  await saveAcceptance({
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
    method,
    confirmedAdult,
    userAgent: navigator.userAgent.slice(0, 500)
  });
};

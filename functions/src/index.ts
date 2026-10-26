import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';

initializeApp();
const db = getFirestore();

const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const MP_API = 'https://api.mercadopago.com';

const PLANS = {
  monthly: { frequency: 1, amount: 29900, reason: 'Stetik Premium mensual', fallbackDays: 30 },
  semiannual: { frequency: 6, amount: 149400, reason: 'Stetik Premium 6 meses', fallbackDays: 183 }
} as const;
type PlanId = keyof typeof PLANS;
const GRACE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const LEGAL_TERMS_VERSION = '2026-10-19-v4';
const LEGAL_PRIVACY_VERSION = '2026-10-19-v3';

export const getLegalAcceptance = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }

    const latest = await db
      .collection('legalAcceptances')
      .doc(uid)
      .collection('events')
      .orderBy('acceptedAt', 'desc')
      .limit(1)
      .get();
    const acceptance = latest.docs[0]?.data();

    return {
      accepted: acceptance?.termsVersion === LEGAL_TERMS_VERSION
        && acceptance?.privacyVersion === LEGAL_PRIVACY_VERSION
    };
  }
);

export const recordLegalAcceptance = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }

    const { termsVersion, privacyVersion, method, confirmedAdult, userAgent } = request.data ?? {};
    if (
      termsVersion !== LEGAL_TERMS_VERSION
      || privacyVersion !== LEGAL_PRIVACY_VERSION
      || !['email', 'google', 'in-app'].includes(method)
      || confirmedAdult !== true
      || typeof userAgent !== 'string'
      || userAgent.length > 500
    ) {
      throw new HttpsError('invalid-argument', 'La aceptación legal está incompleta o desactualizada.');
    }

    await db.collection('legalAcceptances').doc(uid).collection('events').add({
      termsVersion,
      privacyVersion,
      method,
      confirmedAdult,
      userAgent,
      acceptedAt: Timestamp.now()
    });

    return { recorded: true };
  }
);

const mpFetch = async (path: string, token: string, init?: RequestInit) => {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
  const body = await res.json();
  if (!res.ok) {
    console.error('Mercado Pago error', path, res.status, body);
    throw new Error(`Mercado Pago ${res.status}`);
  }
  return body;
};

export const createSubscription = onCall(
  { secrets: [MP_ACCESS_TOKEN], region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    const email = request.auth?.token.email;
    if (!uid || !email) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }

    const returnUrl = String(request.data?.returnUrl ?? '');
    let parsedReturnUrl: URL;
    try {
      parsedReturnUrl = new URL(returnUrl);
    } catch {
      throw new HttpsError('invalid-argument', 'returnUrl inválida.');
    }
    const isProductionReturnUrl = parsedReturnUrl.protocol === 'https:'
      && ['stetik.app', 'www.stetik.app'].includes(parsedReturnUrl.hostname);
    const isLocalReturnUrl = parsedReturnUrl.protocol === 'http:'
      && parsedReturnUrl.hostname === 'localhost';
    if (!isProductionReturnUrl && !isLocalReturnUrl) {
      throw new HttpsError('invalid-argument', 'returnUrl inválida.');
    }

    const planId = String(request.data?.plan ?? 'monthly') as PlanId;
    if (!Object.prototype.hasOwnProperty.call(PLANS, planId)) {
      throw new HttpsError('invalid-argument', 'Plan inválido.');
    }
    const plan = PLANS[planId];

    const preapproval = await mpFetch('/preapproval', MP_ACCESS_TOKEN.value(), {
      method: 'POST',
      body: JSON.stringify({
        reason: plan.reason,
        external_reference: uid,
        payer_email: email,
        back_url: returnUrl,
        status: 'pending',
        auto_recurring: {
          frequency: plan.frequency,
          frequency_type: 'months',
          transaction_amount: plan.amount,
          currency_id: 'COP'
        }
      })
    });

    if (typeof preapproval.id !== 'string' || typeof preapproval.init_point !== 'string') {
      throw new HttpsError('internal', 'Mercado Pago no devolvió una suscripción válida.');
    }

    await db.doc(`users/${uid}`).set({
      subscriptionStatus: preapproval.status,
      preapprovalId: preapproval.id,
      subscriptionPlan: planId
    }, { merge: true });

    return { url: preapproval.init_point };
  }
);

export const cancelSubscription = onCall(
  { secrets: [MP_ACCESS_TOKEN], region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }

    const user = await db.doc(`users/${uid}`).get();
    const preapprovalId = user.data()?.preapprovalId;
    if (typeof preapprovalId !== 'string' || !preapprovalId) {
      throw new HttpsError('failed-precondition', 'No encontramos una suscripción para cancelar.');
    }

    const result = await mpFetch(`/preapproval/${encodeURIComponent(preapprovalId)}`, MP_ACCESS_TOKEN.value(), {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (result.status !== 'cancelled') {
      throw new HttpsError('failed-precondition', 'Mercado Pago no confirmó la cancelación.');
    }

    await db.doc(`users/${uid}`).set({
      subscriptionStatus: result.status,
      preapprovalId
    }, { merge: true });

    return { status: result.status };
  }
);

const syncPreapproval = async (preapprovalId: string, token: string) => {
  const preapproval = await mpFetch(`/preapproval/${preapprovalId}`, token);
  const uid = preapproval.external_reference as string | undefined;
  if (!uid) return;

  const update: Record<string, unknown> = {
    subscriptionStatus: preapproval.status,
    preapprovalId
  };

  if (preapproval.status === 'authorized') {
    const months = Number(preapproval.auto_recurring?.frequency) === 6 ? 'semiannual' : 'monthly';
    const next = preapproval.next_payment_date
      ? new Date(preapproval.next_payment_date).getTime()
      : Date.now() + PLANS[months].fallbackDays * DAY_MS;
    update.premiumUntil = Timestamp.fromMillis(next + GRACE_DAYS * DAY_MS);
  }

  // Si se cancela o pausa no se extiende premiumUntil: conserva lo ya pagado.
  await db.doc(`users/${uid}`).set(update, { merge: true });
};

export const paymentWebhook = onRequest(
  { secrets: [MP_ACCESS_TOKEN], region: 'us-central1' },
  async (req, res) => {
    try {
      const token = MP_ACCESS_TOKEN.value();
      const type = String(req.body?.type ?? req.query.type ?? req.query.topic ?? '');
      const id = String(req.body?.data?.id ?? req.query['data.id'] ?? req.query.id ?? '');

      if (id) {
        if (type === 'subscription_preapproval') {
          await syncPreapproval(id, token);
        } else if (type === 'subscription_authorized_payment') {
          const payment = await mpFetch(`/authorized_payments/${id}`, token);
          if (payment.preapproval_id) await syncPreapproval(payment.preapproval_id, token);
        }
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Webhook error', err);
      res.sendStatus(500);
    }
  }
);

export {
  onAppointmentCreated,
  sendAppointmentReminders,
  whatsappWebhook
} from './whatsapp';

const refreshClientCount = async (userId?: string) => {
  if (!userId) return;
  const snap = await db.collection('clients').where('userId', '==', userId).count().get();
  await db.doc(`users/${userId}`).set({ clientCount: snap.data().count }, { merge: true });
};

export const onClientCreated = onDocumentCreated('clients/{id}', (event) =>
  refreshClientCount(event.data?.data().userId)
);

export const onClientDeleted = onDocumentDeleted('clients/{id}', (event) =>
  refreshClientCount(event.data?.data().userId)
);

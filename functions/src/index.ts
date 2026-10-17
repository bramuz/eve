import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';

initializeApp();
const db = getFirestore();

const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const MP_API = 'https://api.mercadopago.com';

const PREMIUM_PRICE_COP = 19900;
const GRACE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

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
    if (!/^https:\/\/|^http:\/\/localhost/.test(returnUrl)) {
      throw new HttpsError('invalid-argument', 'returnUrl inválida.');
    }

    const preapproval = await mpFetch('/preapproval', MP_ACCESS_TOKEN.value(), {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Stetik Premium',
        external_reference: uid,
        payer_email: email,
        back_url: returnUrl,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PREMIUM_PRICE_COP,
          currency_id: 'COP'
        }
      })
    });

    return { url: preapproval.init_point as string };
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
    const next = preapproval.next_payment_date
      ? new Date(preapproval.next_payment_date).getTime()
      : Date.now() + 30 * DAY_MS;
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

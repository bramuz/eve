import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'node:crypto';

const WA_TOKEN = defineSecret('WHATSAPP_TOKEN');
const WA_PHONE_ID = defineSecret('WHATSAPP_PHONE_ID');
const WA_VERIFY_TOKEN = defineSecret('WHATSAPP_VERIFY_TOKEN');
const WA_APP_SECRET = defineSecret('WHATSAPP_APP_SECRET');
const SECRETS = [WA_TOKEN, WA_PHONE_ID, WA_VERIFY_TOKEN, WA_APP_SECRET];

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const TZ = 'America/Bogota';
const LANG = 'es';

// Nombres de las plantillas aprobadas en Meta (ver guía de configuración).
const TEMPLATES = {
  clientConfirmation: 'cita_confirmada_cliente',
  professionalNew: 'cita_nueva_profesional',
  reminder: 'recordatorio_cita',
  professionalReply: 'respuesta_cliente_profesional'
};

const db = () => getFirestore();

// 10 dígitos que empiezan por 3 se asumen celulares de Colombia.
export const normalizePhone = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
};

const dateKeyFromDate = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

const dateKeyOf = (apt: FirebaseFirestore.DocumentData): string | null => {
  if (typeof apt.dateKey === 'string') return apt.dateKey;
  const ts = apt.date as Timestamp | undefined;
  return ts ? dateKeyFromDate(ts.toDate()) : null;
};

const dateLabel = (dateKey: string | null) =>
  dateKey
    ? new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
        .format(new Date(`${dateKey}T12:00:00-05:00`))
    : '-';

const timeLabel = (time: unknown) => {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return '-';
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 100) || '-';

interface QuickReply {
  payload: string;
}

// Devuelve false (sin lanzar error) si WhatsApp aún no está configurado.
const sendTemplate = async (
  to: string,
  template: string,
  params: string[],
  quickReplies: QuickReply[] = []
): Promise<boolean> => {
  const token = WA_TOKEN.value();
  const phoneId = WA_PHONE_ID.value();
  if (!token || !phoneId || token === 'pendiente' || phoneId === 'pendiente') {
    console.log('WhatsApp no configurado; mensaje omitido', template);
    return false;
  }

  const components: unknown[] = [
    { type: 'body', parameters: params.map((text) => ({ type: 'text', text })) },
    ...quickReplies.map((q, index) => ({
      type: 'button',
      sub_type: 'quick_reply',
      index: String(index),
      parameters: [{ type: 'payload', payload: q.payload }]
    }))
  ];

  const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: template, language: { code: LANG }, components }
    })
  });
  if (!res.ok) {
    console.error('WhatsApp error', template, res.status, await res.text());
    return false;
  }
  return true;
};

interface ProfessionalContext {
  premium: boolean;
  businessName: string;
  phone: string | null;
  notify: boolean;
}

const loadProfessional = async (uid: string): Promise<ProfessionalContext> => {
  const [user, settings, profile] = await Promise.all([
    db().doc(`users/${uid}`).get(),
    db().doc(`notificationSettings/${uid}`).get(),
    db().doc(`bookingProfiles/${uid}`).get()
  ]);
  const until = user.data()?.premiumUntil as Timestamp | undefined;
  return {
    premium: !!until && until.toMillis() > Date.now(),
    businessName: clean(profile.data()?.businessName || 'tu profesional'),
    phone: normalizePhone(settings.data()?.phone),
    notify: settings.data()?.whatsappEnabled === true
  };
};

const notifyProfessional = (ctx: ProfessionalContext, template: string, params: string[]) =>
  ctx.notify && ctx.phone ? sendTemplate(ctx.phone, template, params) : Promise.resolve(false);

export const onAppointmentCreated = onDocumentCreated(
  { document: 'appointments/{id}', secrets: SECRETS },
  async (event) => {
    const apt = event.data?.data();
    if (!apt || typeof apt.userId !== 'string') return;

    const ctx = await loadProfessional(apt.userId);
    if (!ctx.premium) return;

    const key = dateKeyOf(apt);
    const tasks: Promise<boolean>[] = [];

    const clientPhone = normalizePhone(apt.clientPhone);
    if (apt.whatsappConsent === true && clientPhone) {
      tasks.push(
        sendTemplate(clientPhone, TEMPLATES.clientConfirmation, [
          clean(apt.clientName),
          ctx.businessName,
          dateLabel(key),
          timeLabel(apt.time),
          clean(apt.service)
        ])
      );
    }

    tasks.push(
      notifyProfessional(ctx, TEMPLATES.professionalNew, [
        clean(apt.clientName),
        clean(apt.clientPhone),
        dateLabel(key),
        timeLabel(apt.time),
        clean(apt.service)
      ])
    );

    await Promise.allSettled(tasks);
  }
);

export const sendAppointmentReminders = onSchedule(
  { schedule: '0 9 * * *', timeZone: TZ, secrets: SECRETS, region: 'us-central1' },
  async () => {
    const tomorrow = dateKeyFromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const snap = await db().collection('appointments').where('dateKey', '==', tomorrow).get();
    const contexts = new Map<string, ProfessionalContext>();

    for (const doc of snap.docs) {
      const apt = doc.data();
      const phone = normalizePhone(apt.clientPhone);
      if (
        apt.whatsappConsent !== true
        || !phone
        || apt.reminderSentAt
        || apt.confirmationStatus === 'cancelada'
      ) continue;

      if (!contexts.has(apt.userId)) contexts.set(apt.userId, await loadProfessional(apt.userId));
      const ctx = contexts.get(apt.userId)!;
      if (!ctx.premium) continue;

      const sent = await sendTemplate(
        phone,
        TEMPLATES.reminder,
        [clean(apt.clientName), ctx.businessName, dateLabel(tomorrow), timeLabel(apt.time)],
        [{ payload: `CONFIRM:${doc.id}` }, { payload: `CANCEL:${doc.id}` }]
      );
      if (sent) await doc.ref.update({ reminderSentAt: Timestamp.now(), confirmationStatus: 'pendiente' });
    }
  }
);

const handleReply = async (from: string, payload: string) => {
  const match = /^(CONFIRM|CANCEL):([A-Za-z0-9_-]+)$/.exec(payload);
  if (!match) return;
  const [, action, id] = match;

  const ref = db().doc(`appointments/${id}`);
  const snap = await ref.get();
  const apt = snap.data();
  // Solo responde quien tiene el teléfono con el que se agendó la cita.
  if (!apt || normalizePhone(apt.clientPhone) !== from) return;

  const status = action === 'CONFIRM' ? 'confirmada' : 'cancelada';
  if (apt.confirmationStatus === status) return;

  await ref.update({ confirmationStatus: status, respondedAt: Timestamp.now() });
  if (status === 'cancelada') await db().doc(`slotLocks/${id}`).delete();

  const ctx = await loadProfessional(apt.userId);
  if (!ctx.premium) return;
  await notifyProfessional(ctx, TEMPLATES.professionalReply, [
    clean(apt.clientName),
    status === 'confirmada' ? 'confirmó' : 'canceló',
    dateLabel(dateKeyOf(apt)),
    timeLabel(apt.time)
  ]);
};

const validSignature = (rawBody: Buffer | undefined, header: string | undefined, secret: string) => {
  if (!rawBody || !header || !secret) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const whatsappWebhook = onRequest({ secrets: SECRETS, region: 'us-central1' }, async (req, res) => {
  if (req.method === 'GET') {
    const verifyToken = WA_VERIFY_TOKEN.value();
    if (
      req.query['hub.mode'] === 'subscribe'
      && verifyToken
      && req.query['hub.verify_token'] === verifyToken
    ) {
      res.status(200).send(String(req.query['hub.challenge'] ?? ''));
    } else {
      res.sendStatus(403);
    }
    return;
  }

  if (!validSignature(req.rawBody, req.get('x-hub-signature-256'), WA_APP_SECRET.value())) {
    res.sendStatus(403);
    return;
  }

  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        for (const msg of change?.value?.messages ?? []) {
          const payload = msg?.button?.payload ?? msg?.interactive?.button_reply?.id;
          if (typeof msg?.from === 'string' && typeof payload === 'string') {
            await handleReply(msg.from, payload);
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('WhatsApp webhook error', err);
    res.sendStatus(500);
  }
});

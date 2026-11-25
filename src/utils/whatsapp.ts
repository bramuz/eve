// Enlaces wa.me: abren el WhatsApp del profesional con el mensaje listo. No usan la API (gratis).
const COLOMBIA_CODE = '57';

export const toWhatsAppNumber = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  // Celular colombiano sin indicativo (10 dígitos que empiezan por 3).
  if (digits.length === 10 && digits.startsWith('3')) return COLOMBIA_CODE + digits;
  return digits.length >= 8 ? digits : null;
};

export const whatsAppLink = (phone: string | null | undefined, text: string) => {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
};

const formatHour = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
};

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

const signature = (professionalName?: string | null) =>
  professionalName ? `, soy ${firstName(professionalName)}` : '';

export const appointmentReminderText = (
  apt: { clientName: string; service: string; date: { toDate: () => Date }; time: string },
  professionalName?: string | null
) => {
  const d = apt.date.toDate();
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const when = sameDay(d, today)
    ? 'hoy'
    : sameDay(d, tomorrow)
      ? 'mañana'
      : `el ${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  return `Hola ${firstName(apt.clientName)}${signature(professionalName)}. Te recuerdo tu cita de ${apt.service} ${when} a las ${formatHour(apt.time)}. ¿Me confirmas tu asistencia? 🙏`;
};

export const paymentReminderText = (clientName: string, pending: number, professionalName?: string | null) =>
  `Hola ${firstName(clientName)}${signature(professionalName)}. Te escribo para recordarte que tienes un saldo pendiente de $${pending.toLocaleString('es-CO')}. Cuando puedas me avisas. ¡Gracias! 😊`;

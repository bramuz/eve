import { MessageCircle } from 'lucide-react';
import type { Appointment } from '../../types';
import { appointmentReminderText, whatsAppLink } from '../../utils/whatsapp';

interface ReminderLinkProps {
  apt: Pick<Appointment, 'clientName' | 'clientPhone' | 'service' | 'date' | 'time' | 'confirmationStatus'>;
  professionalName?: string | null;
  withLabel?: boolean;
}

// Abre el WhatsApp del profesional con el recordatorio escrito. Sirve en el plan gratis.
export const ReminderLink = ({ apt, professionalName, withLabel = false }: ReminderLinkProps) => {
  if (apt.confirmationStatus === 'cancelada') return null;
  const link = whatsAppLink(apt.clientPhone, appointmentReminderText(apt, professionalName));
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Recordar por WhatsApp"
      aria-label="Recordar por WhatsApp"
      className={
        withLabel
          ? 'inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300'
          : 'p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors'
      }
    >
      <MessageCircle className="w-4 h-4" />
      {withLabel && 'Recordar por WhatsApp'}
    </a>
  );
};

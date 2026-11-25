import { useState, useEffect, useMemo } from 'react';
import { where } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { Link } from 'react-router-dom';
import { createDocument, getDocuments, updateDocument, Timestamp } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import type { Appointment, Client, SpecialDay } from '../../types';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { AlertTriangle, Search, Tag, UserCheck, X } from 'lucide-react';

// Para buscar sin importar tildes ni mayúsculas: "Maria" encuentra "María".
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const digitsOnly = (text: string) => text.replace(/\D/g, '');
const MAX_SUGGESTIONS = 6;

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSuccess: () => void;
  onCancel: () => void;
  selectedDate?: Date;
  specialDays?: SpecialDay[];
}

interface FormData {
  clientName: string;
  clientPhone?: string;
  whatsappConsent?: boolean;
  service: string;
  date: string;
  time: string;
}

export const AppointmentForm = ({
  appointment,
  onSuccess,
  onCancel,
  selectedDate,
  specialDays = []
}: AppointmentFormProps) => {
  const { currentUser } = useAuth();
  const { canScheduleOn, canAddClient } = usePlan();
  const [saveAsClient, setSaveAsClient] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDateWarning, setSelectedDateWarning] = useState<SpecialDay | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(appointment?.clientId ?? null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: appointment
      ? {
          clientName: appointment.clientName,
          clientPhone: appointment.clientPhone ?? '',
          whatsappConsent: appointment.whatsappConsent ?? false,
          service: appointment.service,
          date: format(appointment.date.toDate(), 'yyyy-MM-dd'),
          time: appointment.time
        }
      : {
          date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        }
  });

  const watchedDate = watch('date');
  const watchedName = watch('clientName') ?? '';

  // Usuarios guardados del profesional, para elegirlos al escribir el nombre o el celular.
  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    getDocuments('clients', [where('userId', '==', currentUser.uid)]).then(({ data }) => {
      if (active && data) setClients(data as Client[]);
    });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const suggestions = useMemo(() => {
    const term = normalize(watchedName);
    if (!term) return [];
    const termDigits = digitsOnly(watchedName);
    const words = term.split(/\s+/);
    return clients
      .filter((client) => {
        const name = normalize(client.name);
        const byName = words.every((word) => name.includes(word));
        const byPhone = termDigits.length >= 3 && digitsOnly(client.phone ?? '').includes(termDigits);
        return byName || byPhone;
      })
      // Primero los que empiezan con lo escrito.
      .sort((a, b) => Number(normalize(b.name).startsWith(term)) - Number(normalize(a.name).startsWith(term)))
      .slice(0, MAX_SUGGESTIONS);
  }, [clients, watchedName]);

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;

  const chooseClient = (client: Client) => {
    setValue('clientName', client.name, { shouldValidate: true });
    if (client.phone) setValue('clientPhone', client.phone);
    setSelectedClientId(client.id);
    setShowSuggestions(false);
  };

  const clearClient = () => {
    setSelectedClientId(null);
    setValue('clientName', '');
    setValue('clientPhone', '');
  };

  const nameField = register('clientName', { required: 'El nombre del usuario es requerido' });

  // Nombre nuevo al crear la cita: se ofrece guardarlo para no escribirlo la próxima vez.
  const typedName = watchedName.trim();
  const isNewName =
    !appointment &&
    !selectedClientId &&
    typedName.length >= 2 &&
    !clients.some((client) => normalize(client.name) === normalize(typedName));
  const canSaveClient = canAddClient(clients.length);

  const createClientFromForm = async (name: string, phone: string) => {
    if (!currentUser) return null;
    const { id, error } = await createDocument('clients', {
      name,
      ...(phone ? { phone } : {}),
      userId: currentUser.uid
    });
    if (error || !id) {
      console.warn('No se pudo guardar el usuario desde la cita:', error);
      toast.warning('La cita se guardará, pero no se pudo guardar el usuario.');
      return null;
    }
    return id;
  };
  const outsideFreeWeek = !!watchedDate && !canScheduleOn(new Date(`${watchedDate}T00:00:00`));

  useEffect(() => {
    if (watchedDate) {
      const selectedDateObj = new Date(`${watchedDate}T00:00:00`);
      const specialDay = specialDays.find(sd => isSameDay(sd.date.toDate(), selectedDateObj));
      setSelectedDateWarning(specialDay || null);
    }
  }, [watchedDate, specialDays]);

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      toast.error('No estás autenticado');
      return;
    }

    // Validar si la fecha seleccionada es un día bloqueado
    const selectedDateObj = new Date(`${data.date}T00:00:00`);
    const specialDay = specialDays.find(sd => isSameDay(sd.date.toDate(), selectedDateObj));

    if (!canScheduleOn(selectedDateObj)) {
      setError('El plan gratis solo permite agendar citas hasta 7 días desde hoy.');
      return;
    }
    
    if (specialDay?.blockAppointments) {
      toast.error(`No se pueden agendar citas en este día: ${specialDay.label}`);
      setError(`Este día está marcado como "${specialDay.label}" y no permite agendar citas.`);
      return;
    }

    setLoading(true);
    setError('');
    console.log('Iniciando guardado de cita...');

    try {
      let clientId = selectedClientId;
      if (!clientId && isNewName && saveAsClient && canSaveClient) {
        clientId = await createClientFromForm(data.clientName.trim(), (data.clientPhone ?? '').trim());
      }

      const appointmentData = {
        clientName: data.clientName,
        clientPhone: (data.clientPhone ?? '').trim(),
        whatsappConsent: !!data.whatsappConsent && !!(data.clientPhone ?? '').trim(),
        clientId,
        service: data.service,
        date: Timestamp.fromDate(new Date(`${data.date}T00:00:00`)),
        dateKey: data.date,
        time: data.time,
        userId: currentUser.uid
      };

      console.log('Datos de la cita:', appointmentData);

      if (appointment) {
        // Update existing appointment
        console.log('Actualizando cita existente:', appointment.id);
        const rescheduled =
          data.time !== appointment.time
          || data.date !== format(appointment.date.toDate(), 'yyyy-MM-dd');
        const { error } = await updateDocument(
          'appointments',
          appointment.id,
          rescheduled
            ? { ...appointmentData, confirmationStatus: 'pendiente', reminderSentAt: null }
            : appointmentData
        );

        if (error) {
          console.error('Error al actualizar:', error);
          setError(error);
          toast.error(error);
        } else {
          console.log('Cita actualizada con éxito');
          toast.success('Cita actualizada exitosamente');
          onSuccess();
        }
      } else {
        // Create new appointment
        console.log('Creando nueva cita');
        const { error } = await createDocument('appointments', appointmentData);

        if (error) {
          console.error('Error al crear:', error);
          setError(error);
          toast.error(error);
        } else {
          console.log('Cita creada con éxito');
          toast.success('Cita creada exitosamente');
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Error inesperado:', err);
      const errorMsg = err.message || 'Error inesperado. Por favor, intenta nuevamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      console.log('Proceso de guardado finalizado');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {outsideFreeWeek && (
        <Alert variant="warning">
          El plan gratis solo permite agendar hasta 7 días desde hoy.{' '}
          <Link to="/plans" className="font-semibold underline">
            Pásate a Premium
          </Link>{' '}
          para agendar semanas futuras.
        </Alert>
      )}

      {selectedDateWarning && (
        <div
          className="p-4 rounded-xl border-2 flex items-start gap-3"
          style={{
            backgroundColor: `${selectedDateWarning.color}15`,
            borderColor: selectedDateWarning.color
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: selectedDateWarning.color }}
          >
            {selectedDateWarning.blockAppointments ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <Tag className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-warm-900 dark:text-white mb-1">
              {selectedDateWarning.blockAppointments ? '¡Atención! Día Bloqueado' : 'Día Especial'}
            </p>
            <p className="text-sm text-warm-700 dark:text-warm-300">
              Este día está marcado como <strong>"{selectedDateWarning.label}"</strong>
              {selectedDateWarning.blockAppointments
                ? ' y no permite agendar citas. Por favor selecciona otra fecha.'
                : '. Ten en cuenta esta información al agendar.'}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <Input
          label="Nombre del Usuario"
          placeholder={clients.length > 0 ? 'Escribe el nombre o el celular' : 'Ej: Juan Pérez'}
          autoComplete="off"
          icon={clients.length > 0 ? <Search className="w-5 h-5" /> : undefined}
          error={errors.clientName?.message}
          {...nameField}
          onChange={(event) => {
            void nameField.onChange(event);
            setSelectedClientId(null);
            setShowSuggestions(true);
            setHighlighted(0);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={(event) => {
            void nameField.onBlur(event);
            setShowSuggestions(false);
          }}
          onKeyDown={(event) => {
            if (!showSuggestions || suggestions.length === 0) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlighted((i) => (i + 1) % suggestions.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === 'Enter') {
              event.preventDefault();
              chooseClient(suggestions[highlighted]);
            } else if (event.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          className="h-12 text-base"
        />

        {showSuggestions && !selectedClient && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-warm-200 bg-white shadow-lg dark:border-warm-700 dark:bg-warm-800"
          >
            {suggestions.map((client, index) => (
              <li key={client.id} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  // mousedown para que el campo no pierda el foco antes de elegir
                  onMouseDown={(event) => {
                    event.preventDefault();
                    chooseClient(client);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                    index === highlighted ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                  } hover:bg-primary-50 dark:hover:bg-primary-900/30`}
                >
                  <span className="font-medium text-warm-900 dark:text-white">{client.name}</span>
                  {client.phone && (
                    <span className="text-sm text-warm-500 dark:text-warm-400">{client.phone}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedClient && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
            <span className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Usuario guardado
            </span>
            <button
              type="button"
              onClick={clearClient}
              className="flex items-center gap-1 font-medium hover:underline"
            >
              <X className="h-4 w-4" /> Cambiar
            </button>
          </div>
        )}
      </div>

      <Input
        label="Teléfono (opcional)"
        type="tel"
        placeholder="Ej: 300 123 4567"
        {...register('clientPhone')}
        className="h-12 text-base"
      />

      {isNewName && (
        canSaveClient ? (
          <label className="flex items-start gap-2 text-sm text-warm-700 dark:text-warm-300">
            <input
              type="checkbox"
              className="mt-1"
              checked={saveAsClient}
              onChange={(e) => setSaveAsClient(e.target.checked)}
            />
            <span>Guardar a <strong>{typedName}</strong> en mis usuarios para elegirlo la próxima vez</span>
          </label>
        ) : (
          <p className="text-xs text-warm-500 dark:text-warm-400">
            Llegaste al límite de usuarios del plan gratis, así que este nombre no se guardará.{' '}
            <Link to="/plans" className="font-semibold underline">Ver Premium</Link>
          </p>
        )
      )}

      <label className="flex items-start gap-2 text-sm text-warm-700 dark:text-warm-300">
        <input type="checkbox" className="mt-1" {...register('whatsappConsent')} />
        <span>El usuario acepta recibir confirmación y recordatorio de su cita por WhatsApp</span>
      </label>

      <Input
        label="Procedimiento/Servicio"
        placeholder="Ej: Botox, Limpieza facial, Peeling"
        error={errors.service?.message}
        {...register('service', { required: 'El procedimiento es requerido' })}
        className="h-12 text-base"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha"
          type="date"
          error={errors.date?.message}
          {...register('date', { required: 'La fecha es requerida' })}
          className="h-12 text-base"
        />

        <Input
          label="Hora"
          type="time"
          error={errors.time?.message}
          {...register('time', { required: 'La hora es requerida' })}
          className="h-12 text-base"
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="h-12">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || outsideFreeWeek || (selectedDateWarning?.blockAppointments ?? false)}
          className="h-12"
        >
          {loading ? 'Guardando...' : appointment ? 'Actualizar' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
};

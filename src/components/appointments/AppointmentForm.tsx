import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createDocument, updateDocument, Timestamp } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import type { Appointment } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSuccess: () => void;
  onCancel: () => void;
  selectedDate?: Date;
}

interface FormData {
  clientName: string;
  service: string;
  date: string;
  time: string;
}

export const AppointmentForm = ({
  appointment,
  onSuccess,
  onCancel,
  selectedDate
}: AppointmentFormProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: appointment
      ? {
          clientName: appointment.clientName,
          service: appointment.service,
          date: format(appointment.date.toDate(), 'yyyy-MM-dd'),
          time: appointment.time
        }
      : {
          date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        }
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      toast.error('No estás autenticado');
      return;
    }

    setLoading(true);
    setError('');
    console.log('Iniciando guardado de cita...');

    try {
      const appointmentData = {
        clientName: data.clientName,
        service: data.service,
        date: Timestamp.fromDate(new Date(`${data.date}T00:00:00`)),
        time: data.time,
        userId: currentUser.uid
      };

      console.log('Datos de la cita:', appointmentData);

      if (appointment) {
        // Update existing appointment
        console.log('Actualizando cita existente:', appointment.id);
        const { error } = await updateDocument(
          'appointments',
          appointment.id,
          appointmentData
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

      <Input
        label="Nombre del Cliente"
        placeholder="Ej: Juan Pérez"
        error={errors.clientName?.message}
        {...register('clientName', { required: 'El nombre del cliente es requerido' })}
        className="h-12 text-base"
      />

      <Input
        label="Procedimiento/Servicio"
        placeholder="Ej: Corte de cabello, Manicure, Tatuaje"
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
        <Button type="submit" disabled={loading} className="h-12">
          {loading ? 'Guardando...' : appointment ? 'Actualizar' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
};

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createDocument, updateDocument } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import type { ClientService } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { getLocalDateString } from '../../utils/date';

interface ServiceFormProps {
  clientId: string;
  clientName: string;
  service?: ClientService | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  serviceName: string;
  totalPrice: number;
  date: string;
  notes?: string;
}

export const ServiceForm = ({ clientId, clientName, service, onSuccess, onCancel }: ServiceFormProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: service
      ? {
          serviceName: service.serviceName,
          totalPrice: service.totalPrice,
          date: getLocalDateString(new Date(service.date.toMillis())),
          notes: service.notes || ''
        }
      : {
          date: getLocalDateString()
        }
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const serviceDate = new Date(data.date + 'T00:00:00');

      const serviceData = {
        clientId,
        clientName,
        serviceName: data.serviceName,
        totalPrice: Number(data.totalPrice),
        payments: service ? service.payments : [],
        totalPaid: service ? service.totalPaid : 0,
        balance: service ? service.balance : Number(data.totalPrice),
        status: service ? service.status : 'pendiente' as const,
        date: Timestamp.fromDate(serviceDate),
        notes: data.notes || '',
        userId: currentUser.uid
      };

      if (service) {
        // Update existing service
        const { error } = await updateDocument('clientServices', service.id, serviceData);

        if (error) {
          setError(error);
          toast.error('Error al actualizar el servicio');
        } else {
          toast.success('Servicio actualizado exitosamente');
          onSuccess();
        }
      } else {
        // Create new service
        const { error } = await createDocument('clientServices', serviceData);

        if (error) {
          setError(error);
          toast.error('Error al crear el servicio');
        } else {
          toast.success('Servicio agregado exitosamente');
          onSuccess();
        }
      }
    } catch (err) {
      setError('Error inesperado. Por favor, intenta nuevamente.');
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cliente: <span className="text-primary-600 dark:text-primary-400">{clientName}</span>
        </p>
      </div>

      <Input
        label="Nombre del Procedimiento *"
        placeholder="Corte de cabello, Manicure, Tatuaje..."
        error={errors.serviceName?.message}
        {...register('serviceName', {
          required: 'El nombre del procedimiento es requerido',
          minLength: {
            value: 3,
            message: 'El nombre debe tener al menos 3 caracteres'
          }
        })}
      />

      <Input
        label="Precio Total *"
        type="number"
        placeholder="50000"
        error={errors.totalPrice?.message}
        {...register('totalPrice', {
          required: 'El precio es requerido',
          min: {
            value: 0,
            message: 'El precio debe ser mayor a 0'
          }
        })}
      />

      <Input
        label="Fecha del Servicio *"
        type="date"
        error={errors.date?.message}
        {...register('date', {
          required: 'La fecha es requerida'
        })}
      />

      <Textarea
        label="Notas"
        placeholder="Notas adicionales sobre el servicio..."
        {...register('notes')}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {service ? 'Actualizar' : 'Agregar'} Servicio
        </Button>
      </div>
    </form>
  );
};

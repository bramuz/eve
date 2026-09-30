import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createDocument, updateDocument } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import type { ClientPayment } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { getLocalDateString } from '../../utils/date';

interface ClientPaymentFormProps {
  clientId: string;
  clientName: string;
  payment?: ClientPayment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  date: string;
  notes?: string;
}

export const ClientPaymentForm = ({ 
  clientId, 
  clientName, 
  payment, 
  onSuccess, 
  onCancel 
}: ClientPaymentFormProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: payment
      ? {
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          date: getLocalDateString(new Date(payment.date.toMillis())),
          notes: payment.notes || ''
        }
      : {
          date: getLocalDateString(),
          paymentMethod: 'efectivo'
        }
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const paymentAmount = Number(data.amount);

      if (paymentAmount <= 0) {
        setError('El monto debe ser mayor a 0');
        setLoading(false);
        return;
      }

      const paymentDate = new Date(data.date + 'T00:00:00');

      const paymentData = {
        clientId,
        clientName,
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        date: Timestamp.fromDate(paymentDate),
        notes: data.notes || '',
        userId: currentUser.uid
      };

      if (payment) {
        // Editar abono existente
        const { error: updateError } = await updateDocument('clientPayments', payment.id, paymentData);

        if (updateError) {
          setError(updateError);
          toast.error('Error al actualizar el abono');
        } else {
          toast.success('Abono actualizado exitosamente');
          onSuccess();
        }
      } else {
        // Crear nuevo abono
        const { error: createError } = await createDocument('clientPayments', paymentData);

        if (createError) {
          setError(createError);
          toast.error('Error al registrar el abono');
        } else {
          toast.success(`Abono de $${paymentAmount.toLocaleString()} registrado exitosamente`);
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

      {/* Client Info */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 break-words">
          Cliente: <span className="text-green-600 dark:text-green-400">{clientName}</span>
        </p>
      </div>

      <Input
        label="Monto del Abono *"
        type="number"
        placeholder="0"
        error={errors.amount?.message}
        {...register('amount', {
          required: 'El monto es requerido',
          min: {
            value: 1,
            message: 'El monto debe ser mayor a 0'
          }
        })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Método de Pago *
        </label>
        <select
          className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          {...register('paymentMethod', { required: true })}
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>

      <Input
        label="Fecha del Abono *"
        type="date"
        error={errors.date?.message}
        {...register('date', {
          required: 'La fecha es requerida'
        })}
      />

      <Textarea
        label="Notas"
        placeholder="Notas adicionales sobre el abono..."
        {...register('notes')}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {payment ? 'Actualizar Abono' : 'Registrar Abono'}
        </Button>
      </div>
    </form>
  );
};

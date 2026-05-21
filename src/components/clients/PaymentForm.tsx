import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateDocument } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import type { ClientService, ClientServicePayment } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

interface PaymentFormProps {
  service: ClientService;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  date: string;
  notes?: string;
}

export const PaymentForm = ({ service, onSuccess, onCancel }: PaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'efectivo'
    }
  });

  const amount = watch('amount');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');

    try {
      const paymentAmount = Number(data.amount);

      if (paymentAmount > service.balance) {
        setError(`El monto no puede ser mayor al saldo pendiente ($${service.balance.toLocaleString()})`);
        setLoading(false);
        return;
      }

      if (paymentAmount <= 0) {
        setError('El monto debe ser mayor a 0');
        setLoading(false);
        return;
      }

      const paymentDate = new Date(data.date + 'T00:00:00');

      const newPayment: ClientServicePayment = {
        id: `payment-${Date.now()}`,
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        date: Timestamp.fromDate(paymentDate),
        notes: data.notes || ''
      };

      const updatedTotalPaid = service.totalPaid + paymentAmount;
      const updatedBalance = service.totalPrice - updatedTotalPaid;

      let newStatus: 'pendiente' | 'parcial' | 'pagado' = 'pendiente';
      if (updatedBalance === 0) {
        newStatus = 'pagado';
      } else if (updatedTotalPaid > 0) {
        newStatus = 'parcial';
      }

      const updatedService = {
        ...service,
        payments: [...service.payments, newPayment],
        totalPaid: updatedTotalPaid,
        balance: updatedBalance,
        status: newStatus
      };

      const { error: updateError } = await updateDocument('clientServices', service.id, updatedService);

      if (updateError) {
        setError(updateError);
        toast.error('Error al registrar el abono');
      } else {
        toast.success(`Abono de $${paymentAmount.toLocaleString()} registrado exitosamente`);
        onSuccess();
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

      {/* Service Info */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Servicio: <span className="text-blue-600 dark:text-blue-400">{service.serviceName}</span>
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            ${service.totalPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Pagado:</span>
          <span className="font-bold text-green-600 dark:text-green-400">
            ${service.totalPaid.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-800">
          <span className="text-gray-600 dark:text-gray-400">Saldo Pendiente:</span>
          <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
            ${service.balance.toLocaleString()}
          </span>
        </div>
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
          },
          max: {
            value: service.balance,
            message: `El monto no puede ser mayor a $${service.balance.toLocaleString()}`
          }
        })}
      />

      {/* Preview de nuevo saldo */}
      {amount && Number(amount) > 0 && Number(amount) <= service.balance && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <DollarSign className="w-4 h-4" />
            <span>
              Nuevo saldo: ${(service.balance - Number(amount)).toLocaleString()}
            </span>
          </div>
        </div>
      )}

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
        label="Fecha del Pago *"
        type="date"
        error={errors.date?.message}
        {...register('date', {
          required: 'La fecha es requerida'
        })}
      />

      <Textarea
        label="Notas"
        placeholder="Notas adicionales sobre el pago..."
        {...register('notes')}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar Abono
        </Button>
      </div>
    </form>
  );
};

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createDocument, updateDocument } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import type { Client } from '../../types';
import { toast } from 'sonner';

interface ClientFormProps {
  client?: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
}

export const ClientForm = ({ client, onSuccess, onCancel }: ClientFormProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: client
      ? {
          name: client.name
        }
      : undefined
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const clientData = {
        ...data,
        userId: currentUser.uid
      };

      if (client) {
        // Update existing client
        const { error } = await updateDocument('clients', client.id, clientData);

        if (error) {
          setError(error);
          toast.error('Error al actualizar el cliente');
        } else {
          toast.success('Cliente actualizado exitosamente');
          onSuccess();
        }
      } else {
        // Create new client
        const { error } = await createDocument('clients', clientData);

        if (error) {
          setError(error);
          toast.error('Error al crear el cliente');
        } else {
          toast.success('Cliente creado exitosamente');
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

      <Input
        label="Nombre completo *"
        placeholder="Juan Pérez"
        error={errors.name?.message}
        {...register('name', {
          required: 'El nombre es requerido',
          minLength: {
            value: 3,
            message: 'El nombre debe tener al menos 3 caracteres'
          }
        })}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {client ? 'Actualizar' : 'Crear'} Cliente
        </Button>
      </div>
    </form>
  );
};

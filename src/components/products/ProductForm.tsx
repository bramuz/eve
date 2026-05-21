import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createDocument, updateDocument } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import type { Product } from '../../types';
import { toast } from 'sonner';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  category: string;
  stock: number;
  price: number;
  description?: string;
  imageUrl?: string;
}

export const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: product
      ? {
          name: product.name,
          category: product.category,
          stock: product.stock,
          price: product.price,
          description: product.description || '',
          imageUrl: product.imageUrl || ''
        }
      : {
          stock: 0,
          price: 0
        }
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const productData = {
        ...data,
        stock: Number(data.stock),
        price: Number(data.price),
        userId: currentUser.uid
      };

      if (product) {
        // Update existing product
        const { error } = await updateDocument('products', product.id, productData);

        if (error) {
          setError(error);
          toast.error('Error al actualizar el producto');
        } else {
          toast.success('Producto actualizado exitosamente');
          onSuccess();
        }
      } else {
        // Create new product
        const { error } = await createDocument('products', productData);

        if (error) {
          setError(error);
          toast.error('Error al crear el producto');
        } else {
          toast.success('Producto creado exitosamente');
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Nombre del producto *"
        placeholder="Shampoo Premium"
        error={errors.name?.message}
        {...register('name', {
          required: 'El nombre es requerido',
          minLength: {
            value: 3,
            message: 'El nombre debe tener al menos 3 caracteres'
          }
        })}
      />

      <Input
        label="Categoría *"
        placeholder="Cosméticos, Herramientas, etc."
        error={errors.category?.message}
        {...register('category', {
          required: 'La categoría es requerida'
        })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Precio *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.price?.message}
          {...register('price', {
            required: 'El precio es requerido',
            min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
          })}
        />

        <Input
          label="Stock *"
          type="number"
          placeholder="0"
          error={errors.stock?.message}
          {...register('stock', {
            required: 'El stock es requerido',
            min: { value: 0, message: 'El stock debe ser mayor o igual a 0' }
          })}
        />
      </div>

      <Input
        label="URL de imagen"
        type="url"
        placeholder="https://ejemplo.com/imagen.jpg"
        helperText="Opcional: URL de la imagen del producto"
        error={errors.imageUrl?.message}
        {...register('imageUrl')}
      />

      <Textarea
        label="Descripción"
        placeholder="Descripción del producto..."
        {...register('description')}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  );
};

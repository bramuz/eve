import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createDocument, updateDocument, getDocuments, where } from '../../firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import type { Sale, SaleItem, Client, Product } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface SaleFormProps {
  sale?: Sale | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  clientId?: string;
  clientName?: string;
  deposit: number;
  notes?: string;
}

export const SaleForm = ({ sale, onSuccess, onCancel }: SaleFormProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>(
    sale?.items || []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: sale
      ? {
          clientId: sale.clientId || '',
          clientName: sale.clientName || '',
          deposit: sale.deposit,
          notes: sale.notes || ''
        }
      : {
          deposit: 0
        }
  });

  const deposit = watch('deposit') || 0;
  const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;
  const balance = total - deposit;

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    // Load clients
    const { data: clientsData } = await getDocuments('clients', [
      where('userId', '==', currentUser.uid)
    ]);
    setClients(clientsData as Client[]);

    // Load products
    const { data: productsData } = await getDocuments('products', [
      where('userId', '==', currentUser.uid)
    ]);
    setProducts(productsData as Product[]);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setValue('clientName', client.name);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) {
      toast.error('No hay productos disponibles');
      return;
    }

    const firstProduct = products[0];
    const newItem: SaleItem = {
      productId: firstProduct.id,
      productName: firstProduct.name,
      quantity: 1,
      price: firstProduct.price,
      total: firstProduct.price
    };

    setSaleItems([...saleItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'productId' | 'quantity',
    value: string | number
  ) => {
    const newItems = [...saleItems];

    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          price: product.price,
          total: product.price * newItems[index].quantity
        };
      }
    } else if (field === 'quantity') {
      const quantity = Number(value);
      newItems[index] = {
        ...newItems[index],
        quantity,
        total: newItems[index].price * quantity
      };
    }

    setSaleItems(newItems);
  };

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;

    if (saleItems.length === 0) {
      setError('Debes agregar al menos un producto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const saleStatus: 'paid' | 'partial' | 'pending' =
        balance === 0 ? 'paid' : deposit > 0 ? 'partial' : 'pending';

      const saleData = {
        clientId: data.clientId || undefined,
        clientName: data.clientName || undefined,
        items: saleItems,
        subtotal,
        total,
        deposit: Number(data.deposit),
        balance,
        status: saleStatus,
        notes: data.notes,
        userId: currentUser.uid
      };

      if (sale) {
        // Update existing sale
        const { error } = await updateDocument('sales', sale.id, saleData);

        if (error) {
          setError(error);
          toast.error('Error al actualizar la venta');
        } else {
          toast.success('Venta actualizada exitosamente');
          onSuccess();
        }
      } else {
        // Create new sale
        const { error } = await createDocument('sales', saleData);

        if (error) {
          setError(error);
          toast.error('Error al crear la venta');
        } else {
          toast.success('Venta creada exitosamente');
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

      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cliente (Opcional)
        </label>
        <select
          {...register('clientId')}
          onChange={(e) => handleClientChange(e.target.value)}
          className="input"
        >
          <option value="">Sin cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}{client.phone ? ` - ${client.phone}` : ''}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" {...register('clientName')} />

      {/* Sale Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Productos
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddItem}
          >
            Agregar Producto
          </Button>
        </div>

        {saleItems.length > 0 ? (
          <div className="space-y-3">
            {saleItems.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <select
                  value={item.productId}
                  onChange={(e) =>
                    handleItemChange(index, 'productId', e.target.value)
                  }
                  className="input flex-1"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, 'quantity', e.target.value)
                  }
                  className="input w-24"
                  placeholder="Cant."
                />

                <div className="flex items-center px-4 bg-white dark:bg-gray-900 rounded-lg min-w-[100px] justify-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${item.total.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info">
            Agrega al menos un producto para continuar
          </Alert>
        )}
      </div>

      {/* Totals */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-gray-900 dark:text-white">Total</span>
          <span className="font-bold text-gray-900 dark:text-white">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Deposit */}
      <Input
        label="Abono"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.deposit?.message}
        {...register('deposit', {
          min: { value: 0, message: 'El abono no puede ser negativo' },
          max: { value: total, message: 'El abono no puede ser mayor al total' }
        })}
      />

      {/* Balance Display */}
      <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Saldo pendiente
        </p>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          ${balance.toFixed(2)}
        </p>
      </div>

      {/* Notes */}
      <Textarea
        label="Notas"
        placeholder="Notas adicionales sobre la venta..."
        {...register('notes')}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {sale ? 'Actualizar' : 'Crear'} Venta
        </Button>
      </div>
    </form>
  );
};

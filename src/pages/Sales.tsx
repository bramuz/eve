import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ShoppingCart, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument, where, orderBy } from '../firebase/firestore';
import type { Sale } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SaleForm } from '../components/sales/SaleForm';
import { toast } from 'sonner';

export const Sales = () => {
  const { currentUser } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, [currentUser]);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  const loadSales = async () => {
    if (!currentUser) return;

    setLoading(true);
    const { data, error } = await getDocuments('sales', [
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    ]);

    if (error) {
      toast.error('Error al cargar las ventas');
    } else {
      setSales(data as Sale[]);
    }
    setLoading(false);
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((sale) =>
        sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sale) => sale.status === statusFilter);
    }

    setFilteredSales(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;

    const { error } = await deleteDocument('sales', id);

    if (error) {
      toast.error('Error al eliminar la venta');
    } else {
      toast.success('Venta eliminada exitosamente');
      loadSales();
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const handleSuccess = () => {
    loadSales();
    handleCloseModal();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error'> = {
      paid: 'success',
      partial: 'warning',
      pending: 'error'
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pagado',
      partial: 'Parcial',
      pending: 'Pendiente'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Cargando ventas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona todas tus ventas
          </p>
        </div>
        <Button
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Nueva Venta
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">Pagado</option>
            <option value="partial">Parcial</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </Card>

      {/* Sales List */}
      {filteredSales.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSales.map((sale, index) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sale.clientName || 'Cliente anónimo'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(sale.createdAt.toDate(), "dd 'de' MMMM, yyyy", {
                        locale: es
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(sale)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {sale.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.productName} x{item.quantity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${sale.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Abonado
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${sale.deposit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Saldo
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      ${sale.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Badge variant={getStatusBadge(sale.status)}>
                    {getStatusLabel(sale.status)}
                  </Badge>
                  {sale.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {sale.notes.substring(0, 30)}
                      {sale.notes.length > 30 ? '...' : ''}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<ShoppingCart className="w-16 h-16" />}
            title="No hay ventas"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'No se encontraron ventas con ese criterio'
                : 'Comienza registrando tu primera venta'
            }
            action={
              !searchTerm && statusFilter === 'all' && (
                <Button
                  icon={<Plus className="w-5 h-5" />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Nueva Venta
                </Button>
              )
            }
          />
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSale ? 'Editar Venta' : 'Nueva Venta'}
        size="xl"
      >
        <SaleForm
          sale={editingSale}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Calendar, CreditCard, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Loading } from '../ui/Loading';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ServiceForm } from './ServiceForm';
import { PaymentForm } from './PaymentForm';
import type { Client, ClientService } from '../../types';
import { getDocuments, where, deleteDocument } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
  onUpdate: () => void;
}

export const ClientDetails = ({ client, onClose, onUpdate }: ClientDetailsProps) => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [showConfirmDeleteClient, setShowConfirmDeleteClient] = useState(false);
  const [showConfirmDeleteService, setShowConfirmDeleteService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, [client.id]);

  const loadServices = async () => {
    if (!currentUser) return;

    setLoading(true);
    const { data, error } = await getDocuments('clientServices', [
      where('clientId', '==', client.id),
      where('userId', '==', currentUser.uid)
    ]);

    if (error) {
      toast.error('Error al cargar los servicios');
    } else {
      const sortedServices = (data as ClientService[]).sort(
        (a, b) => b.date.toMillis() - a.date.toMillis()
      );
      setServices(sortedServices);
    }
    setLoading(false);
  };

  const handleDeleteService = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setShowConfirmDeleteService(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    const { error } = await deleteDocument('clientServices', serviceToDelete);
    if (error) {
      toast.error('Error al eliminar el servicio');
    } else {
      toast.success('Servicio eliminado exitosamente');
      loadServices();
      onUpdate();
    }
    setShowConfirmDeleteService(false);
    setServiceToDelete(null);
  };

  const handleServiceSuccess = () => {
    setShowServiceModal(false);
    setSelectedService(null);
    loadServices();
    onUpdate();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedService(null);
    loadServices();
    onUpdate();
  };

  const handleDeleteClient = () => {
    setShowConfirmDeleteClient(true);
  };

  const confirmDeleteClient = async () => {
    try {
      // Eliminar todos los servicios del cliente
      for (const service of services) {
        await deleteDocument('clientServices', service.id);
      }

      // Eliminar el cliente
      const { error } = await deleteDocument('clients', client.id);

      if (error) {
        toast.error('Error al eliminar el cliente');
      } else {
        toast.success(`${client.name} eliminado correctamente`);
        onClose();
        onUpdate();
      }
    } catch (error) {
      toast.error('Error al eliminar el cliente');
      console.error('Error:', error);
    } finally {
      setShowConfirmDeleteClient(false);
    }
  };

  // Calculate totals
  const totalAmount = services.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalPaid = services.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalPending = services.reduce((sum, s) => sum + s.balance, 0);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="bg-white dark:bg-gray-900 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-2xl">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {client.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {client.phone}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              ${totalAmount.toLocaleString()}
            </p>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Pagado</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              ${totalPaid.toLocaleString()}
            </p>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Pendiente</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
              ${totalPending.toLocaleString()}
            </p>
          </Card>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => {
              setSelectedService(null);
              setShowServiceModal(true);
            }} 
            className="flex-1"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Procedimiento
          </Button>

          <Button 
            onClick={handleDeleteClient}
            variant="secondary"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {services.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl">
            <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No hay procedimientos registrados
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Agrega el primer procedimiento para este cliente
            </p>
          </Card>
        ) : (
          services.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {service.serviceName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(service.date.toDate(), 'd MMM yyyy', { locale: es })}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      service.status === 'pagado' ? 'success' :
                      service.status === 'parcial' ? 'warning' : 'error'
                    }
                  >
                    {service.status}
                  </Badge>
                </div>

                {/* Price Info */}
                <div className="space-y-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Precio Total:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${service.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pagado:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${service.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Saldo:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      ${service.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payments History */}
                {service.payments.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Historial de Abonos:
                    </p>
                    <div className="space-y-1">
                      {service.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {format(payment.date.toDate(), 'd MMM yyyy', { locale: es })}
                            </span>
                            <Badge variant="success" className="text-xs">
                              {payment.paymentMethod}
                            </Badge>
                          </div>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ${payment.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {service.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">
                    "{service.notes}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {service.balance > 0 && (
                    <Button
                      onClick={() => {
                        setSelectedService(service);
                        setShowPaymentModal(true);
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Registrar Abono
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteService(service.id)}
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setSelectedService(null);
        }}
        title={selectedService ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
      >
        <ServiceForm
          clientId={client.id}
          clientName={client.name}
          service={selectedService}
          onSuccess={handleServiceSuccess}
          onCancel={() => {
            setShowServiceModal(false);
            setSelectedService(null);
          }}
        />
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedService(null);
        }}
        title="Registrar Abono"
      >
        {selectedService && (
          <PaymentForm
            service={selectedService}
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedService(null);
            }}
          />
        )}
      </Modal>

      {/* Confirm Delete Client Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDeleteClient}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a ${client.name}?\n\nEsto eliminará:\n• El cliente\n• Todos sus procedimientos (${services.length})\n• Todo su historial de pagos\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteClient}
        onCancel={() => setShowConfirmDeleteClient(false)}
      />

      {/* Confirm Delete Service Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDeleteService}
        title="Eliminar Procedimiento"
        message="¿Estás seguro de eliminar este procedimiento?\n\nSe eliminará el servicio y todo su historial de pagos.\n\nEsta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteService}
        onCancel={() => {
          setShowConfirmDeleteService(false);
          setServiceToDelete(null);
        }}
      />
    </div>
  );
};

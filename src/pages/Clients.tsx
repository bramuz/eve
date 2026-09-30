import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, Phone, DollarSign, Calendar, Search, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument, where } from '../firebase/firestore';
import type { Client, ClientService, ClientPayment } from '../types';
import { ClientForm } from '../components/clients/ClientForm';
import { ClientDetails } from '../components/clients/ClientDetails';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Clients = () => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientServices, setClientServices] = useState<ClientService[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    
    // Cargar clientes
    const { data: clientsData, error: clientsError } = await getDocuments('clients', [
      where('userId', '==', currentUser.uid)
    ]);

    // Cargar servicios de clientes
    const { data: servicesData, error: servicesError } = await getDocuments('clientServices', [
      where('userId', '==', currentUser.uid)
    ]);

    // Cargar pagos independientes
    const { data: paymentsData } = await getDocuments('clientPayments', [
      where('userId', '==', currentUser.uid)
    ]);

    if (clientsError || servicesError) {
      toast.error('Error al cargar los datos');
    } else {
      setClients(clientsData as Client[]);
      setClientServices(servicesData as ClientService[]);
      setClientPayments((paymentsData || []) as ClientPayment[]); // Usar array vacío si no hay datos
    }
    
    setLoading(false);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setSelectedClient(null);
    loadData();
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleDetailsUpdate = () => {
    loadData();
  };

  const handleDeleteClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    setClientToDelete(client);
    setShowConfirmDelete(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete || !currentUser) return;

    try {
      // Eliminar todos los servicios del cliente
      const clientServicesToDelete = clientServices.filter(
        service => service.clientId === clientToDelete.id
      );

      for (const service of clientServicesToDelete) {
        await deleteDocument('clientServices', service.id);
      }

      // Eliminar todos los pagos del cliente
      const clientPaymentsToDelete = clientPayments.filter(
        payment => payment.clientId === clientToDelete.id
      );

      for (const payment of clientPaymentsToDelete) {
        await deleteDocument('clientPayments', payment.id);
      }

      // Eliminar todas las notas del cliente
      const { data: clientNotesToDelete } = await getDocuments('notes', [
        where('clientId', '==', clientToDelete.id),
        where('userId', '==', currentUser.uid)
      ]);

      for (const note of (clientNotesToDelete || [])) {
        await deleteDocument('notes', note.id);
      }

      // Eliminar el cliente
      const { error } = await deleteDocument('clients', clientToDelete.id);

      if (error) {
        toast.error('Error al eliminar el cliente');
      } else {
        toast.success(`${clientToDelete.name} eliminado correctamente`);
        loadData();
      }
    } catch (error) {
      toast.error('Error al eliminar el cliente');
      console.error('Error:', error);
    } finally {
      setShowConfirmDelete(false);
      setClientToDelete(null);
    }
  };

  // Calcular estadísticas por cliente
  const getClientStats = (clientId: string) => {
    const services = clientServices.filter(service => service.clientId === clientId);
    const payments = clientPayments.filter(payment => payment.clientId === clientId);
    
    const total = services.reduce((sum, service) => sum + service.totalPrice, 0);
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pending = total - paid;
    const lastService = services.length > 0 
      ? services.sort((a, b) => b.date.toMillis() - a.date.toMillis())[0]
      : null;

    return { total, paid, pending, servicesCount: services.length, lastService };
  };

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" text="Cargando clientes..." />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'} registrados
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="rounded-full h-14 w-14">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base rounded-xl"
          />
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowModal(true)} variant="outline" className="mt-4">
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar primer cliente
                </Button>
              )}
            </Card>
          ) : (
            filteredClients.map((client) => {
              const stats = getClientStats(client.id);
              
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="p-4 hover:shadow-lg transition-all cursor-pointer rounded-2xl"
                    onClick={() => handleViewDetails(client)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {client.name}
                          </h3>

                          <div className="flex items-center gap-1">
                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteClient(client, e)}
                              className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                              aria-label="Eliminar cliente"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone}</span>
                          </div>
                        )}

                        {stats.lastService && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Último servicio: {format(stats.lastService.date.toDate(), 'd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        )}

                        {/* Payment Info */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-green-600 break-all">
                              ${stats.paid.toLocaleString()}
                            </span>
                          </div>
                          
                          {stats.pending > 0 && (
                            <Badge variant="warning" className="text-xs whitespace-nowrap">
                              Debe: ${stats.pending.toLocaleString()}
                            </Badge>
                          )}
                          
                          {stats.pending === 0 && stats.total > 0 && (
                            <Badge variant="success" className="text-xs">
                              Al día
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {stats.servicesCount} {stats.servicesCount === 1 ? 'procedimiento' : 'procedimientos'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedClient(null);
        }}
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <ClientForm
          client={selectedClient}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowModal(false);
            setSelectedClient(null);
          }}
        />
      </Modal>

      {/* Client Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedClient(null);
        }}
        title="Tarjeta del Cliente"
        size="lg"
      >
        {selectedClient && (
          <ClientDetails
            client={selectedClient}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedClient(null);
            }}
            onUpdate={handleDetailsUpdate}
          />
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar Cliente"
        message={clientToDelete ? `¿Estás seguro de eliminar a ${clientToDelete.name}?\n\nEsto eliminará:\n• El cliente\n• Todos sus procedimientos\n• Todo su historial de pagos\n\nEsta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteClient}
        onCancel={() => {
          setShowConfirmDelete(false);
          setClientToDelete(null);
        }}
      />
    </div>
  );
};

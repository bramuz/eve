import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Calendar, CreditCard, Trash2, Edit2, StickyNote, Pin, FileText, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Loading } from '../ui/Loading';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { ServiceForm } from './ServiceForm';
import { ClientPaymentForm } from './ClientPaymentForm';
import { NoteForm } from '../notes/NoteForm';
import { ConsentForm } from './ConsentForm';
import { ConsentList } from './ConsentList';
import type { Client, ClientService, ClientPayment, Note, ClientConsent } from '../../types';
import { getDocuments, where, deleteDocument, createDocument, updateDocument } from '../../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
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
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientNotes, setClientNotes] = useState<Note[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClientNotesModal, setShowClientNotesModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<ClientPayment | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showConfirmDeleteClient, setShowConfirmDeleteClient] = useState(false);
  const [showConfirmDeleteService, setShowConfirmDeleteService] = useState(false);
  const [showConfirmDeletePayment, setShowConfirmDeletePayment] = useState(false);
  const [showConfirmDeleteNote, setShowConfirmDeleteNote] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [consents, setConsents] = useState<ClientConsent[]>([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showConsentListModal, setShowConsentListModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [client.id]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    
    // Cargar servicios
    const { data: servicesData, error: servicesError } = await getDocuments('clientServices', [
      where('clientId', '==', client.id),
      where('userId', '==', currentUser.uid)
    ]);

    // Cargar pagos independientes
    const { data: paymentsData, error: paymentsError } = await getDocuments('clientPayments', [
      where('clientId', '==', client.id),
      where('userId', '==', currentUser.uid)
    ]);

    // Cargar notas del cliente
    const { data: notesData, error: notesError } = await getDocuments('notes', [
      where('clientId', '==', client.id),
      where('userId', '==', currentUser.uid)
    ]);

    if (servicesError) {
      toast.error('Error al cargar los servicios');
    } else {
      const sortedServices = (servicesData as ClientService[]).sort(
        (a, b) => b.date.toMillis() - a.date.toMillis()
      );
      setServices(sortedServices);
    }

    if (paymentsError) {
      console.error('Error al cargar los pagos:', paymentsError);
      setPayments([]); // Si hay error, usar array vacío
    } else {
      const sortedPayments = ((paymentsData || []) as ClientPayment[]).sort(
        (a, b) => b.date.toMillis() - a.date.toMillis()
      );
      setPayments(sortedPayments);
    }

    if (notesError) {
      console.error('Error al cargar las notas:', notesError);
      setClientNotes([]);
    } else {
      const sortedNotes = ((notesData || []) as Note[]).sort(
        (a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()
      );
      setClientNotes(sortedNotes);
    }

    // Cargar consentimientos
    const { data: consentsData, error: consentsError } = await getDocuments('clientConsents', [
      where('clientId', '==', client.id),
      where('userId', '==', currentUser.uid)
    ]);

    if (consentsError) {
      console.error('Error al cargar los consentimientos:', consentsError);
      setConsents([]);
    } else {
      const sortedConsents = ((consentsData || []) as ClientConsent[]).sort(
          (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
      );
      setConsents(sortedConsents);
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
      loadData();
      onUpdate();
    }
    setShowConfirmDeleteService(false);
    setServiceToDelete(null);
  };

  const handleServiceSuccess = () => {
    setShowServiceModal(false);
    setSelectedService(null);
    loadData();
    onUpdate();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    loadData();
    onUpdate();
  };

  const handleEditPayment = (payment: ClientPayment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setShowConfirmDeletePayment(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    const { error } = await deleteDocument('clientPayments', paymentToDelete);

    if (error) {
      toast.error('Error al eliminar el abono');
    } else {
      toast.success('Abono eliminado exitosamente');
      loadData();
      onUpdate();
    }

    setShowConfirmDeletePayment(false);
    setPaymentToDelete(null);
  };

  const handleDeleteClient = () => {
    setShowConfirmDeleteClient(true);
  };

  const handleSaveNote = async (data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    const payload = {
      ...data,
      clientId: client.id,
      clientName: client.name,
    };

    try {
      if (selectedNote) {
        const { error } = await updateDocument('notes', selectedNote.id, {
          ...payload,
          updatedAt: Timestamp.now(),
        });

        if (error) {
          toast.error('Error al actualizar la nota');
          return;
        }

        toast.success('Nota actualizada exitosamente');
      } else {
        const { error } = await createDocument('notes', {
          ...payload,
          userId: currentUser.uid,
        });

        if (error) {
          toast.error('Error al crear la nota');
          return;
        }

        toast.success('Nota creada exitosamente');
      }

      setShowNoteModal(false);
      setSelectedNote(null);
      setShowClientNotesModal(true);
      loadData();
    } catch (error) {
      console.error('Error al guardar nota:', error);
      toast.error('Error al guardar la nota');
    }
  };

  const handleTogglePinNote = async (note: Note) => {
    const { error } = await updateDocument('notes', note.id, {
      isPinned: !note.isPinned,
      updatedAt: Timestamp.now(),
    });

    if (error) {
      toast.error('Error al fijar/desfijar la nota');
      return;
    }

    loadData();
  };

  const handleDeleteNote = (note: Note) => {
    setNoteToDelete(note);
    setShowConfirmDeleteNote(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    const { error } = await deleteDocument('notes', noteToDelete.id);

    if (error) {
      toast.error('Error al eliminar la nota');
    } else {
      toast.success('Nota eliminada');
      loadData();
    }

    setShowConfirmDeleteNote(false);
    setNoteToDelete(null);
  };

  const confirmDeleteClient = async () => {
    try {
      // Eliminar todos los servicios del cliente
      for (const service of services) {
        await deleteDocument('clientServices', service.id);
      }

      // Eliminar todos los pagos del cliente
      for (const payment of payments) {
        await deleteDocument('clientPayments', payment.id);
      }

      // Eliminar todas las notas del cliente
      for (const note of clientNotes) {
        await deleteDocument('notes', note.id);
      }

      // Eliminar todos los consentimientos del cliente
      for (const consent of consents) {
        await deleteDocument('clientConsents', consent.id);
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
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = totalAmount - totalPaid;

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
            {client.phone && (
              <p className="text-gray-600 dark:text-gray-400">
                {client.phone}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total</p>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300 break-all">
              ${totalAmount.toLocaleString()}
            </p>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Abonado</p>
            <p className="text-base font-bold text-green-700 dark:text-green-300 break-all">
              ${totalPaid.toLocaleString()}
            </p>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Pendiente</p>
            <p className="text-base font-bold text-orange-700 dark:text-orange-300 break-all">
              ${totalPending.toLocaleString()}
            </p>
          </Card>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <Button
            onClick={() => setShowClientNotesModal(true)}
            variant="outline"
            className="flex-1 min-w-fit"
          >
            <StickyNote className="w-5 h-5 mr-2" />
            Notas ({clientNotes.length})
          </Button>
          <Button
            onClick={() => setShowConsentListModal(true)}
            variant="outline"
            className="flex-1 min-w-fit"
          >
            <FileText className="w-5 h-5 mr-2" />
            Consentimientos ({consents.length})
          </Button>
          <Button
            onClick={() => setShowConsentModal(true)}
            variant="primary"
            className="flex-1 min-w-fit"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Nuevo Consentimiento
          </Button>
          <Button 
            onClick={handleDeleteClient}
            variant="secondary"
            className="flex-1 min-w-fit text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Eliminar Cliente
          </Button>
        </div>
      </div>

      {/* Services and Payments Sections */}
      <div className="space-y-6">
        {/* Procedures Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Procedimientos
            </h3>
            <Button 
              onClick={() => {
                setSelectedService(null);
                setShowServiceModal(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

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
            <div className="space-y-2">
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-3 rounded-xl hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {service.serviceName}
                        </h4>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{format(service.date.toDate(), 'd MMM yyyy', { locale: es })}</span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-bold text-gray-900 dark:text-white">
                              ${service.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {service.notes && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-700 dark:text-gray-300 italic border-l-2 border-blue-400">
                            {service.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowServiceModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Editar procedimiento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Eliminar procedimiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Payments Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Historial de Abonos
            </h3>
            <Button 
              onClick={() => {
                setSelectedPayment(null);
                setShowPaymentModal(true);
              }}
              size="sm"
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Abono
            </Button>
          </div>

          {payments.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl">
              <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No hay abonos registrados
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Los abonos aparecerán aquí
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-3 rounded-xl hover:shadow-md transition-all bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            Abono
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <span>{format(payment.date.toDate(), 'd MMM yyyy', { locale: es })}</span>
                          <Badge variant="success" className="text-xs">
                            {payment.paymentMethod}
                          </Badge>
                          <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                            ${payment.amount.toLocaleString()}
                          </span>
                        </div>

                        {payment.notes && (
                          <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 italic border-l-2 border-green-400">
                            {payment.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditPayment(payment)}
                          className="p-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 transition-colors"
                          title="Editar abono"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          title="Eliminar abono"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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
          setSelectedPayment(null);
        }}
        title={selectedPayment ? 'Editar Abono' : 'Registrar Abono'}
      >
        <ClientPaymentForm
          clientId={client.id}
          clientName={client.name}
          payment={selectedPayment}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
        />
      </Modal>

      {/* Client Notes List Modal */}
      <Modal
        isOpen={showClientNotesModal}
        onClose={() => setShowClientNotesModal(false)}
        title={`Notas de ${client.name}`}
        size="lg"
      >
        <div className="space-y-4 bg-amber-50 dark:bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedNote(null);
                setShowClientNotesModal(false);
                setShowNoteModal(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Nota
            </Button>
          </div>

          {clientNotes.length === 0 ? (
            <Card className="p-6 rounded-2xl">
              <EmptyState
                icon={<StickyNote className="w-10 h-10" />}
                title="Sin notas para este cliente"
                description="Guarda aquí todo lo importante para el seguimiento del cliente"
              />
            </Card>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {clientNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-3 rounded-xl hover:shadow-md transition-all bg-white dark:bg-white border-amber-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                          {note.content}
                        </p>

                        <div className="mt-2 flex items-center justify-end text-xs text-gray-700">
                          <span>{format(note.updatedAt.toDate(), 'd MMM yyyy', { locale: es })}</span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTogglePinNote(note)}
                          className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'bg-amber-100 text-amber-700' : 'hover:bg-white/70 text-gray-700'}`}
                          title={note.isPinned ? 'Desfijar' : 'Fijar'}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedNote(note);
                            setShowClientNotesModal(false);
                            setShowNoteModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-white/70 text-blue-700 transition-colors"
                          title="Editar nota"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setSelectedNote(null);
        }}
        title={selectedNote ? 'Editar Nota del Cliente' : 'Nueva Nota del Cliente'}
      >
        <NoteForm
          note={selectedNote}
          simpleMode
          onSubmit={handleSaveNote}
          onCancel={() => {
            setShowNoteModal(false);
            setSelectedNote(null);
            setShowClientNotesModal(true);
          }}
        />
      </Modal>

      {/* Confirm Delete Client Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDeleteClient}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a ${client.name}?\n\nEsto eliminará:\n• El cliente\n• Todos sus procedimientos (${services.length})\n• Todo su historial de abonos (${payments.length})\n• Todas sus notas (${clientNotes.length})\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteClient}
        onCancel={() => setShowConfirmDeleteClient(false)}
      />

      {/* Confirm Delete Note Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDeleteNote}
        title="Eliminar Nota"
        message={`¿Estás seguro de eliminar la nota "${noteToDelete?.title || ''}"?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteNote}
        onCancel={() => {
          setShowConfirmDeleteNote(false);
          setNoteToDelete(null);
        }}
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

      {/* Confirm Delete Payment Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDeletePayment}
        title="Eliminar Abono"
        message="¿Estás seguro de eliminar este abono?\n\nSe recalculará el saldo del procedimiento.\n\nEsta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeletePayment}
        onCancel={() => {
          setShowConfirmDeletePayment(false);
          setPaymentToDelete(null);
        }}
      />

      {/* Consent Form Modal */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        title="Nuevo Consentimiento"
        size="lg"
      >
        <ConsentForm
          clientId={client.id}
          clientName={client.name}
          onSuccess={() => {
            setShowConsentModal(false);
            loadData();
            onUpdate();
          }}
          onCancel={() => setShowConsentModal(false)}
        />
      </Modal>

      {/* Consent List Modal */}
      <Modal
        isOpen={showConsentListModal}
        onClose={() => setShowConsentListModal(false)}
        title={`Consentimientos de ${client.name}`}
        size="lg"
      >
        <ConsentList
          clientId={client.id}
          clientName={client.name}
          onClose={() => setShowConsentListModal(false)}
        />
      </Modal>
    </div>
  );
};

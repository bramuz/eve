import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Loading } from '../ui/Loading';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import type { ClientConsent } from '../../types';
import { getDocuments, where, deleteDocument } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ConsentListProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

  export const ConsentList = ({ clientId, onClose }: ConsentListProps) => {
  const { currentUser } = useAuth();
  const [consents, setConsents] = useState<ClientConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsent, setSelectedConsent] = useState<ClientConsent | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDeleteConfirm] = useState(false);
  const [consentToDelete, setConsentToDelete] = useState<ClientConsent | null>(null);

  useEffect(() => {
    loadConsents();
  }, [clientId]);

  const loadConsents = async () => {
    if (!currentUser) return;

    setLoading(true);
    const { data, error } = await getDocuments('clientConsents', [
      where('clientId', '==', clientId),
      where('userId', '==', currentUser.uid),
    ]);

    if (error) {
      toast.error('Error al cargar los consentimientos');
    } else {
      const sorted = (data as ClientConsent[]).sort(
        (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
      );
      setConsents(sorted);
    }

    setLoading(false);
  };

  const handleDelete = (consent: ClientConsent) => {
    setConsentToDelete(consent);
    setShowConfirmDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!consentToDelete) return;

    const { error } = await deleteDocument('clientConsents', consentToDelete.id);

    if (error) {
      toast.error('Error al eliminar el consentimiento');
    } else {
      toast.success('Consentimiento eliminado');
      loadConsents();
    }

    setShowConfirmDeleteConfirm(false);
    setConsentToDelete(null);
  };

  const handleDownloadPDF = (consent: ClientConsent) => {
    // Create a PDF-like document by opening in new tab or downloading
    const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Consentimiento - ${consent.procedureName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .content { white-space: pre-wrap; line-height: 1.6; margin-bottom: 30px; }
    .signature-section { margin-top: 40px; }
    .signature-box { 
      display: inline-block; 
      border: 1px solid #ccc; 
      padding: 20px; 
      margin-right: 50px;
      text-align: center;
    }
    .signature-image { 
      max-width: 200px; 
      max-height: 80px; 
      margin-bottom: 10px;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Consentimiento Informado</h1>
    <p>Procedimiento: ${consent.procedureName}</p>
    <p>Paciente: ${consent.clientName}</p>
    <p>Fecha: ${format(new Date(consent.signedAt), 'd MMMM yyyy', { locale: es })}</p>
  </div>
  
  <div class="content">${consent.consentText}</div>
  
  <div class="signature-section">
    <div class="signature-box">
      <p><strong>Firma del Paciente</strong></p>
      <img src="${consent.signatureDataURL}" alt="Firma" class="signature-image" />
    </div>
  </div>
  
  <div class="footer">
    <p>Este documento fue generado digitalmente el ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: es })}</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([doc], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consentimiento-${consent.procedureName}-${format(new Date(consent.signedAt), 'dd-MM-yyyy')}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return <Loading />;
  }

  if (consents.length === 0) {
    return (
      <div>
        <EmptyState
          icon={<Eye className="w-10 h-10" />}
          title="Sin consentimientos"
          description="No hay consentimientos registrados para este cliente"
        />
        <Button onClick={onClose} variant="outline" className="w-full mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-[65vh] overflow-y-auto">
        {consents.map((consent) => (
          <motion.div
            key={consent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-3 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {consent.procedureName}
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p>Firmado: {format(new Date(consent.signedAt), 'd MMMM yyyy, HH:mm', { locale: es })}</p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedConsent(consent);
                      setShowViewModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                    title="Ver consentimiento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(consent)}
                    className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                    title="Descargar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(consent)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Eliminar consentimiento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View Modal */}
      {selectedConsent && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedConsent(null);
          }}
          title={`Consentimiento: ${selectedConsent.procedureName}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Firmado: {format(new Date(selectedConsent.signedAt), 'd MMMM yyyy, HH:mm', { locale: es })}
              </p>
              <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-80 overflow-y-auto">
                {selectedConsent.consentText}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Firma del Paciente:
              </p>
              <img
                src={selectedConsent.signatureDataURL}
                alt="Firma"
                className="border border-gray-300 dark:border-gray-600 rounded p-2 max-h-40 bg-white"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => handleDownloadPDF(selectedConsent)}
                variant="primary"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedConsent(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar Consentimiento"
        message={`¿Estás seguro de eliminar el consentimiento de ${consentToDelete?.procedureName}?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmDeleteConfirm(false);
          setConsentToDelete(null);
        }}
      />

      <Button onClick={onClose} variant="outline" className="w-full">
        Cerrar
      </Button>
    </div>
  );
};

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { functions } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const CONFIRM_WORD = 'ELIMINAR';

export const DeleteAccountSection = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setConfirmText('');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const deleteAccount = httpsCallable<{ confirm: string }, { deleted: boolean }>(
        functions,
        'deleteAccount'
      );
      await deleteAccount({ confirm: CONFIRM_WORD });
      toast.success('Tu cuenta y tus datos fueron eliminados.');
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la cuenta');
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
      <h3 className="text-lg font-semibold text-warm-900 dark:text-white">Eliminar cuenta</h3>
      <p className="mt-2 text-sm text-warm-700 dark:text-warm-300">
        Borra tu cuenta y todos tus datos: usuarios, citas, pagos, notas, fotos y consentimientos.
        Si tienes una suscripción activa, se cancela la renovación. Esta acción no se puede deshacer.
      </p>
      <Button variant="danger" onClick={() => setOpen(true)} className="mt-4">
        <Trash2 className="w-4 h-4" /> Eliminar mi cuenta
      </Button>

      <Modal isOpen={open} onClose={close} title="¿Eliminar tu cuenta?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-warm-700 dark:text-warm-300">
            Se eliminarán de forma permanente tu cuenta y todos tus datos. Si pagaste Premium,
            perderás el tiempo que te quede. Solo conservaremos los registros que la ley nos obliga
            a guardar, como la prueba de aceptación de los documentos legales.
          </p>
          <label className="block text-sm font-medium text-warm-800 dark:text-warm-200">
            Escribe <strong>{CONFIRM_WORD}</strong> para confirmar
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              disabled={deleting}
              autoComplete="off"
              className="input mt-2"
            />
          </label>
          <div className="flex gap-3">
            <Button variant="outline" onClick={close} disabled={deleting} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD}
              loading={deleting}
              className="flex-1"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

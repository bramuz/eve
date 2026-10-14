import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { CalendarDays, ImagePlus, Images, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { toast } from 'sonner';
import type { Client } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createDocument, deleteDocument, getDocuments, where } from '../../firebase/firestore';
import { storage } from '../../firebase/config';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface ClientPhoto {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  imageUrl: string;
  storagePath: string;
  date: Timestamp;
  notes: string;
}

interface ClientPhotosProps {
  client: Client;
}

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30_000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const ClientPhotos = ({ client }: ClientPhotosProps) => {
  const { currentUser } = useAuth();
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoDate, setPhotoDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'saving'>('uploading');
  const [photoToDelete, setPhotoToDelete] = useState<ClientPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!currentUser) return;

      setLoading(true);
      const { data, error } = await getDocuments('clientPhotos', [
        where('userId', '==', currentUser.uid),
        where('clientId', '==', client.id)
      ]);

      if (error) {
        toast.error('No se pudo cargar el historial de fotos');
        setPhotos([]);
      } else {
        setPhotos((data as ClientPhoto[]).sort((first, second) =>
          second.date.toMillis() - first.date.toMillis()
        ));
      }

      setLoading(false);
    };

    void loadPhotos();
  }, [client.id, currentUser]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      toast.error('La imagen no puede superar los 10 MB');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser || !selectedFile) {
      toast.error('Selecciona una foto antes de guardar');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `client-photos/${currentUser.uid}/${client.id}/${Date.now()}-${safeFileName}`;
    const photoRef = ref(storage, storagePath);

    try {
      await new Promise<void>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(photoRef, selectedFile, {
          contentType: selectedFile.type
        });
        const timeoutId = setTimeout(() => {
          reject(new Error('photo-upload-timeout'));
          uploadTask.cancel();
        }, UPLOAD_TIMEOUT_MS);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          () => {
            clearTimeout(timeoutId);
            resolve();
          }
        );
      });

      setUploadStage('saving');
      const imageUrl = await withTimeout(
        getDownloadURL(photoRef),
        10_000,
        'photo-url-timeout'
      );
      const date = Timestamp.fromDate(new Date(`${photoDate}T12:00:00`));
      const { id, error } = await createDocument('clientPhotos', {
        userId: currentUser.uid,
        clientId: client.id,
        clientName: client.name,
        imageUrl,
        storagePath,
        date,
        notes: notes.trim()
      });

      if (error || !id) {
        void deleteObject(photoRef).catch(() => undefined);
        toast.error(error || 'No se pudo guardar la foto');
        return;
      }

      setPhotos((currentPhotos) => [
        { id, userId: currentUser.uid, clientId: client.id, clientName: client.name, imageUrl, storagePath, date, notes: notes.trim() },
        ...currentPhotos
      ].sort((first, second) => second.date.toMillis() - first.date.toMillis()));
      setSelectedFile(null);
      setNotes('');
      setPhotoDate(format(new Date(), 'yyyy-MM-dd'));
      toast.success('Foto guardada en el historial');
    } catch (error) {
      console.error('Error al guardar la foto:', error);
      void deleteObject(photoRef).catch(() => undefined);

      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
      if (error instanceof Error && error.message === 'photo-upload-timeout') {
        toast.error('La subida tardó demasiado y se canceló. Revisa tu conexión e inténtalo de nuevo.');
      } else if (error instanceof Error && error.message === 'photo-url-timeout') {
        toast.error('La foto se subió, pero Firebase tardó en preparar el enlace. Inténtalo de nuevo.');
      } else if (errorCode === 'storage/unauthorized') {
        toast.error('Firebase Storage rechazó la foto. Despliega las reglas de Storage para habilitar la carga.');
      } else {
        toast.error('No se pudo guardar la foto. Revisa la conexión y la configuración de Firebase Storage.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStage('uploading');
    }
  };

  const confirmDeletePhoto = async () => {
    if (!photoToDelete || deleting) return;

    setDeleting(true);
    try {
      await deleteObject(ref(storage, photoToDelete.storagePath));
      const { error } = await deleteDocument('clientPhotos', photoToDelete.id);
      if (error) throw new Error(error);

      setPhotos((currentPhotos) => currentPhotos.filter((photo) => photo.id !== photoToDelete.id));
      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error al eliminar la foto:', error);
      toast.error('No se pudo eliminar la foto');
    } finally {
      setDeleting(false);
      setPhotoToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Guarda fotos con fecha y notas para revisar la evolución de {client.name}.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id={`client-photo-${client.id}`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor={`client-photo-${client.id}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-warm-100 px-4 py-2.5 text-sm font-medium text-warm-800 transition-colors hover:bg-warm-200 dark:bg-warm-700 dark:text-warm-100 dark:hover:bg-warm-600"
          >
            <ImagePlus className="h-5 w-5" />
            Elegir foto
          </label>
          <span className="min-w-0 truncate text-sm text-gray-600 dark:text-gray-400">
            {selectedFile ? selectedFile.name : 'JPG, PNG o WEBP, máximo 10 MB'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha de la foto"
            type="date"
            value={photoDate}
            onChange={(event) => setPhotoDate(event.target.value)}
            required
          />
          <Textarea
            label="Nota del cambio"
            placeholder="Servicio realizado, producto utilizado o cambio observado..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        {uploading && (
          <div className="space-y-1" aria-live="polite">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full bg-primary-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500">
              {uploadStage === 'uploading' ? `Subiendo ${uploadProgress}%` : 'Guardando foto en el historial...'}
            </p>
          </div>
        )}

        <Button
          type="submit"
          icon={uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          disabled={!selectedFile || uploading}
        >
          {uploading
            ? uploadStage === 'uploading' ? `Subiendo ${uploadProgress}%` : 'Guardando historial...'
            : 'Guardar en el historial'}
        </Button>
      </form>

      <section aria-label={`Historial de fotos de ${client.name}`}>
        <div className="mb-3 flex items-center gap-2">
          <Images className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Historial ({photos.length})
          </h3>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Cargando fotos...</p>
        ) : photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
            <Images className="mx-auto mb-3 h-9 w-9 text-gray-400" />
            <p className="font-medium text-gray-900 dark:text-white">El historial de {client.name} comienza aquí</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Todavía no has agregado fotos. Guarda la primera para empezar a registrar sus cambios.
            </p>
            <label
              htmlFor={`client-photo-${client.id}`}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
            >
              <ImagePlus className="h-4 w-4" />
              Agregar la primera foto
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {photos.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <a href={photo.imageUrl} target="_blank" rel="noreferrer" className="block bg-gray-100 dark:bg-gray-800">
                  <img
                    src={photo.imageUrl}
                    alt={`Foto de ${client.name} del ${format(photo.date.toDate(), 'd MMMM yyyy', { locale: es })}`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                </a>
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary-600" />
                      {format(photo.date.toDate(), 'd MMM yyyy', { locale: es })}
                    </p>
                    {photo.notes && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-400">
                        {photo.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoToDelete(photo)}
                    aria-label="Eliminar foto"
                    title="Eliminar foto"
                    className="shrink-0 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(photoToDelete)}
        title="Eliminar foto"
        message="¿Quieres eliminar esta foto del historial? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />
      {deleting && <p className="sr-only" aria-live="polite">Eliminando foto...</p>}
    </div>
  );
};
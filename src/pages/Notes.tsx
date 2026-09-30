import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pin, Edit2, Trash2, X, StickyNote, Grid3x3, List, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { getDocuments, createDocument, updateDocument, deleteDocument, where } from '../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { Note } from '../types';
import { NoteForm } from '../components/notes/NoteForm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Notes = () => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    loadNotes();
  }, [currentUser]);

  const loadNotes = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await getDocuments('notes', [
        where('userId', '==', currentUser.uid)
      ]);

      if (error) {
        toast.error('Error al cargar las notas');
        console.error('Error al cargar notas:', error);
      } else {
        setNotes(data as Note[]);
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
      toast.error('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    const { clientId: _clientId, clientName: _clientName, ...personalData } = data;
    const payload = {
      ...personalData,
    };

    try {
      if (selectedNote) {
        // Actualizar nota existente
        const { error } = await updateDocument('notes', selectedNote.id, {
          ...payload,
          updatedAt: Timestamp.now(),
        });

        if (error) {
          toast.error('Error al actualizar la nota');
        } else {
          toast.success('Nota actualizada exitosamente');
          loadNotes();
          setShowModal(false);
          setSelectedNote(null);
        }
      } else {
        // Crear nueva nota
        const { error } = await createDocument('notes', {
          ...payload,
          userId: currentUser.uid,
        });

        if (error) {
          toast.error('Error al crear la nota');
        } else {
          toast.success('Nota creada exitosamente');
          loadNotes();
          setShowModal(false);
        }
      }
    } catch (error) {
      console.error('Error al guardar nota:', error);
      toast.error('Error al guardar la nota');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const { error } = await deleteDocument('notes', noteToDelete.id);

      if (error) {
        toast.error('Error al eliminar la nota');
      } else {
        toast.success('Nota eliminada exitosamente');
        loadNotes();
        setNoteToDelete(null);
      }
    } catch (error) {
      console.error('Error al eliminar nota:', error);
      toast.error('Error al eliminar la nota');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const { error } = await updateDocument('notes', note.id, {
        isPinned: !note.isPinned,
        updatedAt: Timestamp.now(),
      });

      if (error) {
        toast.error('Error al fijar/desfijar la nota');
      } else {
        loadNotes();
      }
    } catch (error) {
      console.error('Error al fijar nota:', error);
      toast.error('Error al fijar/desfijar la nota');
    }
  };

  // Filtrar y ordenar notas
  const personalNotes = useMemo(() => {
    // Solo notas personales: no asociadas a clientes
    return notes.filter((note) => !note.clientId);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let filtered = personalNotes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.category && note.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !filterCategory || note.category === filterCategory;

      return matchesSearch && matchesCategory;
    });

    // Ordenar: primero las fijadas, luego por fecha de actualización
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.toMillis() - a.updatedAt.toMillis();
    });

    return filtered;
  }, [personalNotes, searchTerm, filterCategory]);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set<string>();
    personalNotes.forEach((note) => {
      if (note.category) cats.add(note.category);
    });
    return Array.from(cats).sort();
  }, [personalNotes]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-warm-900 dark:text-white flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-warm-600" />
            Notas Personales
          </h1>
          <p className="text-warm-600 dark:text-warm-400 mt-1">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'}
            {filterCategory && ` en ${filterCategory}`}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Nota
        </Button>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-warm-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-warm-400 hover:text-warm-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filtro por categoría */}
        {categories.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-warm-400 w-5 h-5 pointer-events-none" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-lg border-2 border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 text-warm-900 dark:text-white focus:border-warm-500 focus:ring-2 focus:ring-warm-500/20 appearance-none"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {filterCategory && (
              <button
                onClick={() => setFilterCategory('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-warm-400 hover:text-warm-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Toggle vista */}
        <div className="flex gap-2 bg-warm-100 dark:bg-warm-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-white shadow'
                : 'text-warm-600 hover:text-warm-900 dark:hover:text-white'
            }`}
            title="Vista en cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-white shadow'
                : 'text-warm-600 hover:text-warm-900 dark:hover:text-white'
            }`}
            title="Vista en lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notas */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="w-12 h-12" />}
          title={searchTerm || filterCategory ? 'No se encontraron notas' : 'No hay notas'}
          description={
            searchTerm || filterCategory
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primera nota para empezar a organizar tus ideas'
          }
          action={
            !searchTerm && !filterCategory ? (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Crear Primera Nota
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }
        >
          <AnimatePresence>
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative p-4 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer ${
                  viewMode === 'list' ? 'flex items-start gap-4' : ''
                }`}
                style={{ backgroundColor: note.color }}
                onClick={() => {
                  setSelectedNote(note);
                  setShowModal(true);
                }}
              >
                {/* Pin indicator */}
                {note.isPinned && (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute -top-2 -right-2"
                  >
                    <div className="bg-warm-600 text-white p-2 rounded-full shadow-lg">
                      <Pin className="w-4 h-4" />
                    </div>
                  </motion.div>
                )}

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-warm-900 text-lg mb-2 pr-8 break-words">
                    {note.title}
                  </h3>
                  <p className="text-warm-800 text-sm whitespace-pre-wrap break-words line-clamp-6">
                    {note.content}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-warm-400/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {note.category && (
                        <span className="text-xs font-medium text-warm-700 bg-warm-900/10 px-2 py-1 rounded-full">
                          {note.category}
                        </span>
                      )}
                      {note.clientName && (
                        <span className="text-xs font-medium text-primary-700 bg-primary-100 px-2 py-1 rounded-full">
                          Cliente: {note.clientName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-warm-600">
                      {format(note.updatedAt.toDate(), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                </div>

                {/* Acciones (hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(note);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      note.isPinned
                        ? 'bg-warm-600 text-white'
                        : 'bg-white/80 hover:bg-white text-warm-700'
                    }`}
                    title={note.isPinned ? 'Desfijar' : 'Fijar'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNote(note);
                      setShowModal(true);
                    }}
                    className="p-2 bg-white/80 hover:bg-white rounded-lg text-warm-700 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteToDelete(note);
                    }}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedNote(null);
        }}
        title={selectedNote ? 'Editar Nota' : 'Nueva Nota'}
      >
        <NoteForm
          note={selectedNote}
          onSubmit={handleSaveNote}
          onCancel={() => {
            setShowModal(false);
            setSelectedNote(null);
          }}
        />
      </Modal>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!noteToDelete}
        onCancel={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
        title="Eliminar nota"
        message={`¿Estás seguro de que deseas eliminar la nota "${noteToDelete?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

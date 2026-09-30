import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Tag, Pin, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import type { Note } from '../../types';

interface NoteFormProps {
  note: Note | null;
  onSubmit: (data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  simpleMode?: boolean;
}

const NOTE_COLORS = [
  { name: 'Amarillo', value: '#fef3c7', label: 'Predeterminado' },
  { name: 'Rosa', value: '#fce7f3', label: 'Personal' },
  { name: 'Azul', value: '#dbeafe', label: 'Trabajo' },
  { name: 'Verde', value: '#d1fae5', label: 'Ideas' },
  { name: 'Morado', value: '#e9d5ff', label: 'Importante' },
  { name: 'Naranja', value: '#fed7aa', label: 'Urgente' },
  { name: 'Gris', value: '#e5e7eb', label: 'Archivo' },
];

const CATEGORIES = [
  'Personal',
  'Trabajo',
  'Ideas',
  'Recordatorios',
  'Tareas',
  'Proyectos',
];

export const NoteForm = ({ note, onSubmit, onCancel, simpleMode = false }: NoteFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    color: note?.color || '#fef3c7',
    isPinned: note?.isPinned || false,
    category: note?.category || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (simpleMode) {
        const cleanContent = formData.content.trim();
        const autoTitle = cleanContent.length > 60 ? `${cleanContent.slice(0, 60)}...` : cleanContent;

        await onSubmit({
          title: note?.title || autoTitle || 'Nota',
          content: cleanContent,
          color: note?.color || '#fef3c7',
          isPinned: note?.isPinned || false,
          category: note?.category || '',
          clientId: note?.clientId,
          clientName: note?.clientName,
        });
      } else {
        await onSubmit(formData);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleSubmit}
      className={`space-y-6 ${simpleMode ? 'bg-amber-50 dark:bg-amber-50 rounded-2xl p-4 border border-amber-200' : ''}`}
    >
      {/* Título */}
      {!simpleMode && (
        <div>
          <label className="block text-sm font-semibold text-warm-900 dark:text-white mb-3">
            <StickyNote className="w-4 h-4 inline mr-2" />
            Título
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título de la nota"
            required
            autoFocus
          />
        </div>
      )}

      {/* Contenido */}
      <div>
        <label className={`block text-sm font-semibold mb-3 ${simpleMode ? 'text-amber-900' : 'text-warm-900 dark:text-white'}`}>
          Contenido
        </label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Escribe aquí tu nota..."
          rows={simpleMode ? 8 : 6}
          required
          autoFocus={simpleMode}
          className={simpleMode ? 'bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-amber-300 focus:border-amber-500 placeholder:text-gray-500' : ''}
        />
      </div>

      {/* Categoría */}
      {!simpleMode && <div>
        <label className="block text-sm font-semibold text-warm-900 dark:text-white mb-3">
          <Tag className="w-4 h-4 inline mr-2" />
          Categoría
        </label>
        <Input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="Ej: Personal, Trabajo, Ideas"
          list="categories"
        />
        <datalist id="categories">
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>}

      {/* Color */}
      {!simpleMode && <div>
        <label className="block text-sm font-semibold text-warm-900 dark:text-white mb-3">
          Color de la nota
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {NOTE_COLORS.map((color) => (
            <motion.button
              key={color.value}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={`relative h-12 rounded-lg transition-all ${
                formData.color === color.value
                  ? 'ring-4 ring-warm-500 ring-offset-2 dark:ring-offset-warm-800'
                  : 'hover:ring-2 hover:ring-warm-300'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            >
              {formData.color === color.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-warm-900 rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>}

      {/* Fijar nota */}
      {!simpleMode && <div className="flex items-center gap-3 p-4 bg-warm-50 dark:bg-warm-800/50 rounded-xl">
        <input
          type="checkbox"
          id="isPinned"
          checked={formData.isPinned}
          onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
          className="w-5 h-5 text-warm-600 rounded focus:ring-2 focus:ring-warm-500"
        />
        <label htmlFor="isPinned" className="flex items-center gap-2 text-sm font-medium text-warm-900 dark:text-white cursor-pointer">
          <Pin className="w-4 h-4" />
          Fijar nota (aparecerá al inicio)
        </label>
      </div>}

      {/* Preview */}
      {!simpleMode && <div className="p-4 rounded-xl border-2 border-dashed border-warm-300 dark:border-warm-600">
        <p className="text-xs font-semibold text-warm-600 dark:text-warm-400 mb-2">Vista previa:</p>
        <div
          className="p-4 rounded-lg shadow-md"
          style={{ backgroundColor: formData.color }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-warm-900 text-lg">
              {formData.title || 'Título de la nota'}
            </h3>
            {formData.isPinned && <Pin className="w-5 h-5 text-warm-700" />}
          </div>
          <p className="text-warm-800 text-sm whitespace-pre-wrap">
            {formData.content || 'Contenido de la nota...'}
          </p>
          {formData.category && (
            <div className="mt-3 pt-3 border-t border-warm-400/30">
              <span className="text-xs font-medium text-warm-700 bg-warm-900/10 px-2 py-1 rounded-full">
                {formData.category}
              </span>
            </div>
          )}
        </div>
      </div>}

      {/* Botones */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Guardando...' : note ? 'Actualizar Nota' : 'Crear Nota'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.form>
  );
};

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Tag, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { SpecialDay } from '../../types';

interface SpecialDayFormProps {
  specialDay: SpecialDay | null;
  selectedDate: Date;
  onSubmit: (data: Omit<SpecialDay, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const PRESET_COLORS = [
  { name: 'Rojo', value: '#ef4444', label: 'Festivo/Cerrado' },
  { name: 'Naranja', value: '#f97316', label: 'Advertencia' },
  { name: 'Amarillo', value: '#eab308', label: 'Precaución' },
  { name: 'Verde', value: '#22c55e', label: 'Disponible' },
  { name: 'Azul', value: '#3b82f6', label: 'Especial' },
  { name: 'Morado', value: '#a855f7', label: 'Evento' },
  { name: 'Rosa', value: '#ec4899', label: 'Celebración' },
  { name: 'Gris', value: '#6b7280', label: 'Deshabilitado' },
];

const PRESET_LABELS = [
  'Festivo',
  'Vacaciones',
  'Cerrado',
  'Evento Especial',
  'Día Personal',
  'Capacitación',
  'Mantenimiento',
];

export const SpecialDayForm = ({ specialDay, selectedDate, onSubmit, onCancel }: SpecialDayFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: specialDay?.date.toDate() || selectedDate,
    label: specialDay?.label || '',
    color: specialDay?.color || '#ef4444',
    blockAppointments: specialDay?.blockAppointments ?? true,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        date: Timestamp.fromDate(formData.date),
        label: formData.label,
        color: formData.color,
        blockAppointments: formData.blockAppointments,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Fecha */}
      <div>
        <label className="block text-sm font-semibold text-warm-900 dark:text-white mb-3">
          <Calendar className="w-4 h-4 inline mr-2" />
          Fecha
        </label>
        <div className="p-4 bg-warm-50 dark:bg-warm-700/50 rounded-xl">
          <p className="text-lg font-bold text-warm-900 dark:text-white capitalize">
            {format(formData.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Etiqueta */}
      <div>
        <label className="block text-sm font-semibold text-warm-900 dark:text-white mb-3">
          <Tag className="w-4 h-4 inline mr-2" />
          Etiqueta
        </label>
        <Input
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="Ej: Festivo, Vacaciones, Cerrado"
          required
          className="mb-2"
        />
        
        {/* Sugerencias rápidas */}
        <div className="flex flex-wrap gap-2">
          {PRESET_LABELS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setFormData({ ...formData, label: preset })}
              className="px-3 py-1 text-xs rounded-lg bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-600 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-semibold text-warm-900 dark:text-white mb-3">
          <Palette className="w-4 h-4 inline mr-2" />
          Color del Día
        </label>
        
        {/* Selector de color actual */}
        <div className="mb-4 p-4 rounded-xl border-2 border-warm-200 dark:border-warm-700 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl shadow-md"
            style={{ backgroundColor: formData.color }}
          />
          <div className="flex-1">
            <p className="text-sm text-warm-600 dark:text-warm-400 mb-1">Color seleccionado:</p>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Colores preestablecidos */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: preset.value })}
              className={`group relative p-3 rounded-xl border-2 transition-all ${
                formData.color === preset.value
                  ? 'border-primary-500 shadow-md scale-105'
                  : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600'
              }`}
              title={preset.label}
            >
              <div
                className="w-full h-12 rounded-lg shadow-sm"
                style={{ backgroundColor: preset.value }}
              />
              <p className="text-xs text-warm-600 dark:text-warm-400 mt-2 text-center truncate">
                {preset.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bloquear citas */}
      <div className="p-4 bg-warm-50 dark:bg-warm-700/50 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.blockAppointments}
            onChange={(e) => setFormData({ ...formData, blockAppointments: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-warm-300 dark:border-warm-600 text-primary-600 focus:ring-primary-500"
          />
          <div className="flex-1">
            <p className="font-semibold text-warm-900 dark:text-white">
              Bloquear agendamiento de citas
            </p>
            <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
              Si está activado, no se podrán agendar citas en este día. Útil para festivos o días cerrados.
            </p>
          </div>
        </label>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl border-2 border-dashed border-warm-300 dark:border-warm-600">
        <p className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase mb-2">
          Vista previa
        </p>
        <div
          className="p-4 rounded-xl shadow-sm text-white font-semibold text-center"
          style={{ backgroundColor: formData.color }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Tag className="w-4 h-4" />
            <span>{formData.label || 'Sin etiqueta'}</span>
          </div>
          <p className="text-sm opacity-90">
            {format(formData.date, 'd MMMM', { locale: es })}
          </p>
          {formData.blockAppointments && (
            <p className="text-xs mt-2 bg-black/20 rounded px-2 py-1 inline-block">
              🚫 Citas bloqueadas
            </p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading || !formData.label.trim()}
        >
          {loading ? 'Guardando...' : specialDay ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </motion.form>
  );
};

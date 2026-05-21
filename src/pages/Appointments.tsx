import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Edit2, Trash2, Clock, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import '../calendar.css';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument, where } from '../firebase/firestore';
import type { Appointment } from '../types';
import { AppointmentForm } from '../components/appointments/AppointmentForm';
import { toast } from 'sonner';

export const Appointments = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Lunes
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
    }
  }, [currentUser]);

  const loadAppointments = async () => {
    if (!currentUser) return;

    setLoading(true);
    const { data, error } = await getDocuments('appointments', [
      where('userId', '==', currentUser.uid)
    ]);

    if (error) {
      toast.error('Error al cargar las citas');
    } else {
      const sortedAppointments = (data as Appointment[]).sort((a, b) => {
        return a.date.toMillis() - b.date.toMillis();
      });
      setAppointments(sortedAppointments);
    }
    setLoading(false);
  };

  // Función para convertir hora de 24h a 12h con AM/PM
  const formatTime12Hour = (time24: string): string => {
    const [hours24, minutes] = time24.split(':').map(Number);
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Obtener citas para un día específico
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = apt.date.toDate();
      const matchesDate = isSameDay(aptDate, date);
      const matchesSearch = searchTerm === '' || 
        apt.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    }).sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      const aTotal = aHours * 60 + aMinutes;
      const bTotal = bHours * 60 + bMinutes;
      return aTotal - bTotal;
    });
  };

  // Generar array de 7 días de la semana
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const handleDelete = (id: string) => {
    setAppointmentToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    const { error } = await deleteDocument('appointments', appointmentToDelete);
    if (error) {
      toast.error('Error al eliminar la cita');
    } else {
      toast.success('Cita eliminada exitosamente');
      loadAppointments();
    }
    setShowConfirmDelete(false);
    setAppointmentToDelete(null);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
    loadAppointments();
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto pb-20">
      {/* Header Compacto */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 dark:text-white">
            📅 Citas
          </h1>
        </div>
        <Button 
          onClick={() => {
            setSelectedAppointment(null);
            setSelectedDate(null);
            setShowModal(true);
          }}
          className="shadow-lg hover:shadow-xl flex-shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Nueva</span>
        </Button>
      </motion.div>

      {/* Buscador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.03 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400 dark:text-warm-500" />
          <input
            type="text"
            placeholder="Buscar por nombre del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-warm-900 dark:text-white placeholder-warm-400 dark:placeholder-warm-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
            >
              <X className="w-4 h-4 text-warm-500 dark:text-warm-400" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-warm-600 dark:text-warm-400 mt-2 ml-1">
            Buscando: <span className="font-semibold text-primary-600 dark:text-primary-400">{searchTerm}</span>
          </p>
        )}
      </motion.div>

      {/* Week Navigation Compacta */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <div className="bg-white dark:bg-warm-800 rounded-2xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={goToPreviousWeek}
              className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-warm-700 dark:text-warm-300" />
            </button>
            
            <div className="text-center flex-1">
              <h2 className="text-base sm:text-lg font-bold text-warm-900 dark:text-white capitalize">
                {format(currentWeekStart, 'MMMM yyyy', { locale: es })}
              </h2>
              <p className="text-xs text-warm-600 dark:text-warm-400">
                {format(currentWeekStart, 'd MMM', { locale: es })} - {format(addDays(currentWeekStart, 6), 'd MMM', { locale: es })}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={goToToday}
                className="hidden sm:block px-3 py-2 rounded-xl text-sm font-medium bg-warm-100 dark:bg-warm-700 text-warm-900 dark:text-white hover:bg-warm-200 dark:hover:bg-warm-600 transition-colors"
              >
                Hoy
              </button>
              <button 
                onClick={goToNextWeek}
                className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-warm-700 dark:text-warm-300" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Week Grid Optimizado para Móvil */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Vista Móvil/Tablet - Lista Vertical */}
        <div className="lg:hidden space-y-3">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          // Si hay búsqueda activa y no hay citas en este día, no mostrar el día
          if (searchTerm && dayAppointments.length === 0) {
            return null;
          }
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div 
                className={`bg-white dark:bg-warm-800 rounded-2xl shadow-sm overflow-hidden transition-all ${
                  isToday ? 'ring-2 ring-gray-400 shadow-md' : ''
                }`}
              >
                {/* Day Header Horizontal */}
                <div 
                  className={`flex items-center justify-between px-4 py-3 ${
                    isToday 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                      : 'bg-gradient-to-r from-primary-500 to-primary-600'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-white">
                      <p className="text-2xl font-bold leading-none">
                        {format(day, 'd')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white font-semibold capitalize text-sm">
                        {format(day, 'EEEE', { locale: es })}
                      </p>
                      <p className="text-white/80 text-xs">
                        {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(day);
                    }}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Appointments List */}
                <div className="p-3">
                  {dayAppointments.length === 0 ? (
                    <button
                      onClick={() => handleDayClick(day)}
                      className="w-full py-6 text-center text-warm-400 dark:text-warm-500 text-sm hover:bg-warm-50 dark:hover:bg-warm-700 rounded-xl transition-colors"
                    >
                      + Agregar cita
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={`rounded-xl p-3 hover:shadow-md transition-all group ${
                            searchTerm 
                              ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400 dark:ring-primary-600' 
                              : 'bg-warm-50 dark:bg-warm-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Time */}
                            <div className="flex-shrink-0 text-center bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg px-3 py-2 min-w-[70px]">
                              <Clock className="w-3 h-3 mx-auto mb-0.5" />
                              <p className="text-xs font-bold leading-tight">
                                {formatTime12Hour(apt.time)}
                              </p>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm truncate ${
                                searchTerm 
                                  ? 'text-primary-900 dark:text-primary-100' 
                                  : 'text-warm-900 dark:text-white'
                              }`}>
                                {apt.clientName}
                              </p>
                              <p className="text-xs text-warm-600 dark:text-warm-400 truncate mt-0.5">
                                {apt.service}
                              </p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(apt);
                                }}
                                className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(apt.id);
                                }}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>

        {/* Vista Desktop - Grid de 7 Columnas */}
        <div className="hidden lg:grid lg:grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          // Si hay búsqueda activa y no hay citas en este día, no mostrar el día
          if (searchTerm && dayAppointments.length === 0) {
            return null;
          }
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className={`bg-white dark:bg-warm-800 rounded-2xl shadow-sm overflow-hidden h-full min-h-[400px] flex flex-col transition-all hover:shadow-lg ${
                  isToday ? 'ring-2 ring-gray-400' : ''
                }`}
              >
                {/* Day Header Vertical */}
                <div 
                  className={`p-4 text-center cursor-pointer ${
                    isToday 
                      ? 'bg-gradient-to-br from-gray-500 to-gray-600' 
                      : 'bg-gradient-to-br from-primary-500 to-primary-600'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <p className="text-xs font-semibold uppercase text-white/90 mb-1">
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {format(day, 'd')}
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                  </p>
                </div>

                {/* Appointments List Vertical */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {dayAppointments.length === 0 ? (
                    <button
                      onClick={() => handleDayClick(day)}
                      className="w-full h-full min-h-[100px] text-center text-warm-400 dark:text-warm-500 text-xs hover:bg-warm-50 dark:hover:bg-warm-700 rounded-xl transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`rounded-lg p-2 hover:shadow-md transition-all group cursor-pointer ${
                          searchTerm
                            ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400 dark:ring-primary-600'
                            : 'bg-warm-50 dark:bg-warm-700/50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div className="space-y-1">
                          {/* Time */}
                          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-bold">
                              {formatTime12Hour(apt.time)}
                            </span>
                          </div>
                          
                          {/* Info */}
                          <p className={`font-semibold text-xs leading-tight ${
                            searchTerm
                              ? 'text-primary-900 dark:text-primary-100'
                              : 'text-warm-900 dark:text-white'
                          }`}>
                            {apt.clientName}
                          </p>
                          <p className="text-[10px] text-warm-600 dark:text-warm-400 truncate">
                            {apt.service}
                          </p>
                          
                          {/* Actions */}
                          <div className="flex gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(apt);
                              }}
                              className="flex-1 p-1 rounded text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 transition-colors"
                            >
                              <Edit2 className="w-3 h-3 mx-auto" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(apt.id);
                              }}
                              className="flex-1 p-1 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>
      </motion.div>

      {/* Mensaje cuando no hay resultados */}
      {searchTerm && weekDays.every(day => getAppointmentsForDay(day).length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="bg-white dark:bg-warm-800 rounded-2xl p-8 shadow-sm max-w-md mx-auto">
            <Search className="w-16 h-16 mx-auto text-warm-300 dark:text-warm-600 mb-4" />
            <h3 className="text-lg font-semibold text-warm-900 dark:text-white mb-2">
              No se encontraron citas
            </h3>
            <p className="text-warm-600 dark:text-warm-400 mb-4">
              No hay citas para <span className="font-semibold text-primary-600 dark:text-primary-400">"{searchTerm}"</span> en esta semana
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        </motion.div>
      )}

      {/* Modal for Create/Edit Appointment */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAppointment(null);
          setSelectedDate(null);
        }}
        title={selectedAppointment ? 'Editar Cita' : 'Nueva Cita'}
      >
        <AppointmentForm
          appointment={selectedAppointment}
          selectedDate={selectedDate || undefined}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowModal(false);
            setSelectedAppointment(null);
            setSelectedDate(null);
          }}
        />
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar Cita"
        message="¿Estás seguro de eliminar esta cita?\n\nEsta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setAppointmentToDelete(null);
        }}
      />
    </div>
  );
};

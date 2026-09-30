import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Edit2, Trash2, Clock, ChevronLeft, ChevronRight, Search, X, Calendar, Tag, CalendarDays, List } from 'lucide-react';
import '../calendar.css';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument, createDocument, updateDocument, where } from '../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { Appointment, SpecialDay } from '../types';
import { AppointmentForm } from '../components/appointments/AppointmentForm';
import { SpecialDayForm } from '../components/appointments/SpecialDayForm';
import { toast } from 'sonner';

export const Appointments = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSpecialDayModal, setShowSpecialDayModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSpecialDay, setSelectedSpecialDay] = useState<SpecialDay | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Lunes
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week'); // Vista semanal o mensual
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
      loadSpecialDays();
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

  const loadSpecialDays = async () => {
    if (!currentUser) return;

    const { data, error } = await getDocuments('specialDays', [
      where('userId', '==', currentUser.uid)
    ]);

    if (error) {
      console.error('Error al cargar días especiales:', error);
    } else {
      setSpecialDays(data as SpecialDay[]);
    }
  };

  const getSpecialDayForDate = (date: Date): SpecialDay | null => {
    return specialDays.find(sd => isSameDay(sd.date.toDate(), date)) || null;
  };

  const handleSaveSpecialDay = async (data: Omit<SpecialDay, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    try {
      if (selectedSpecialDay) {
        // Actualizar día especial existente
        const { error } = await updateDocument('specialDays', selectedSpecialDay.id, {
          ...data,
          updatedAt: Timestamp.now(),
        });
        
        if (error) {
          toast.error('Error al actualizar el día especial');
        } else {
          toast.success('Día especial actualizado exitosamente');
          loadSpecialDays();
          setShowSpecialDayModal(false);
          setSelectedSpecialDay(null);
          setSelectedDate(null);
        }
      } else {
        // Crear nuevo día especial
        const { error } = await createDocument('specialDays', {
          ...data,
          userId: currentUser.uid,
        });
        
        if (error) {
          toast.error('Error al crear el día especial');
        } else {
          toast.success('Día especial creado exitosamente');
          loadSpecialDays();
          setShowSpecialDayModal(false);
          setSelectedDate(null);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el día especial');
    }
  };

  const handleDeleteSpecialDay = async (specialDayId: string) => {
    const { error } = await deleteDocument('specialDays', specialDayId);
    
    if (error) {
      toast.error('Error al eliminar el día especial');
    } else {
      toast.success('Día especial eliminado exitosamente');
      loadSpecialDays();
    }
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

  // Generar array de días del mes completo
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Agregar días del mes anterior para completar la primera semana
    const firstDayOfWeek = startOfWeek(start, { weekStartsOn: 1 });
    const leadingDays = firstDayOfWeek.getTime() < start.getTime()
      ? eachDayOfInterval({ start: firstDayOfWeek, end: addDays(start, -1) })
      : [];
    
    // Agregar días del mes siguiente para completar la última semana
    const lastDayOfWeek = addDays(startOfWeek(end, { weekStartsOn: 1 }), 6);
    const trailingDays = lastDayOfWeek.getTime() > end.getTime()
      ? eachDayOfInterval({ start: addDays(end, 1), end: lastDayOfWeek })
      : [];
    
    return [...leadingDays, ...days, ...trailingDays];
  }, [currentMonth]);

  // Contar citas por día para el mes
  const appointmentCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    appointments.forEach(apt => {
      const dateKey = format(apt.date.toDate(), 'yyyy-MM-dd');
      counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
    });
    return counts;
  }, [appointments]);

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
    setCurrentMonth(new Date());
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (date: Date) => {
    const specialDay = getSpecialDayForDate(date);
    
    // Si el día está bloqueado para citas, mostrar advertencia
    if (specialDay?.blockAppointments) {
      toast.warning(`Este día está marcado como "${specialDay.label}" y no permite agendar citas`);
      return;
    }
    
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleSpecialDayClick = (date: Date, specialDay: SpecialDay | null) => {
    setSelectedDate(date);
    setSelectedSpecialDay(specialDay);
    setShowSpecialDayModal(true);
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
        <div className="flex gap-2">
          {/* Toggle Vista */}
          <button
            onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors shadow-sm flex items-center gap-2"
            title={viewMode === 'week' ? 'Ver calendario mensual' : 'Ver vista semanal'}
          >
            {viewMode === 'week' ? (
              <>
                <CalendarDays className="w-4 h-4 text-warm-700 dark:text-warm-300" />
                <span className="hidden sm:inline text-sm font-medium text-warm-700 dark:text-warm-300">Mes</span>
              </>
            ) : (
              <>
                <List className="w-4 h-4 text-warm-700 dark:text-warm-300" />
                <span className="hidden sm:inline text-sm font-medium text-warm-700 dark:text-warm-300">Semana</span>
              </>
            )}
          </button>
          
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
        </div>
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

      {/* Navigation - Adaptable para Semana/Mes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <div className="bg-white dark:bg-warm-800 rounded-2xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
              className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-warm-700 dark:text-warm-300" />
            </button>
            
            <div className="text-center flex-1">
              <h2 className="text-base sm:text-lg font-bold text-warm-900 dark:text-white capitalize">
                {viewMode === 'week' 
                  ? format(currentWeekStart, 'MMMM yyyy', { locale: es })
                  : format(currentMonth, 'MMMM yyyy', { locale: es })
                }
              </h2>
              {viewMode === 'week' && (
                <p className="text-xs text-warm-600 dark:text-warm-400">
                  {format(currentWeekStart, 'd MMM', { locale: es })} - {format(addDays(currentWeekStart, 6), 'd MMM', { locale: es })}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={goToToday}
                className="hidden sm:block px-3 py-2 rounded-xl text-sm font-medium bg-warm-100 dark:bg-warm-700 text-warm-900 dark:text-white hover:bg-warm-200 dark:hover:bg-warm-600 transition-colors"
              >
                Hoy
              </button>
              <button 
                onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
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
        {viewMode === 'month' ? (
          /* Vista de Calendario Mensual */
          <div className="bg-white dark:bg-warm-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Header con días de la semana */}
            <div className="grid grid-cols-7 gap-px bg-warm-200 dark:bg-warm-700">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div
                  key={day}
                  className="bg-warm-100 dark:bg-warm-800 py-3 text-center text-xs font-semibold text-warm-700 dark:text-warm-300 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de días del mes */}
            <div className="grid grid-cols-7 gap-px bg-warm-200 dark:bg-warm-700">
              {monthDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const appointmentCount = appointmentCountByDay.get(dateKey) || 0;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const specialDay = getSpecialDayForDate(day);
                const hasAppointments = appointmentCount > 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => {
                      if (isCurrentMonth) {
                        handleDayClick(day);
                      }
                    }}
                    className={`
                      relative min-h-[80px] sm:min-h-[100px] p-2 cursor-pointer transition-all
                      ${isCurrentMonth 
                        ? 'bg-white dark:bg-warm-900 hover:bg-warm-50 dark:hover:bg-warm-800' 
                        : 'bg-warm-50 dark:bg-warm-950 opacity-40'
                      }
                      ${isToday ? 'ring-2 ring-gray-400 ring-inset' : ''}
                    `}
                    style={specialDay && isCurrentMonth ? {
                      backgroundColor: `${specialDay.color}15`
                    } : {}}
                  >
                    {/* Número del día */}
                    <div className="flex items-start justify-between mb-1">
                      <span
                        className={`
                          text-sm font-semibold
                          ${isToday 
                            ? 'w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs' 
                            : isCurrentMonth
                              ? 'text-warm-900 dark:text-white'
                              : 'text-warm-400 dark:text-warm-600'
                          }
                        `}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Botón para marcar día especial */}
                      {isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpecialDayClick(day, specialDay);
                          }}
                          className="opacity-0 hover:opacity-100 transition-opacity p-1 rounded hover:bg-warm-100 dark:hover:bg-warm-700"
                          title="Marcar día especial"
                        >
                          <Calendar className="w-3 h-3 text-warm-500" />
                        </button>
                      )}
                    </div>

                    {/* Indicador de citas */}
                    {isCurrentMonth && (
                      <div className="space-y-1">
                        {hasAppointments ? (
                          <div
                            className="rounded px-2 py-1 text-xs font-semibold text-center"
                            style={{
                              backgroundColor: specialDay?.color || '#d4a574',
                              color: 'white'
                            }}
                          >
                            {appointmentCount} {appointmentCount === 1 ? 'cita' : 'citas'}
                          </div>
                        ) : (
                          <div className="text-center py-1">
                            <span className="text-xs text-warm-400 dark:text-warm-600">
                              Sin citas
                            </span>
                          </div>
                        )}

                        {specialDay && (
                          <div className="flex items-center gap-1 px-1">
                            <Tag className="w-2 h-2" style={{ color: specialDay.color }} />
                            <span
                              className="text-[10px] font-semibold truncate"
                              style={{ color: specialDay.color }}
                            >
                              {specialDay.label}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Vista Semanal Original */
          <>
        {/* Vista Móvil/Tablet - Lista Vertical */}
        <div className="lg:hidden space-y-3">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());
          const specialDay = getSpecialDayForDate(day);
          
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
                } ${specialDay ? 'ring-2 shadow-lg' : ''}`}
                style={specialDay ? { borderColor: specialDay.color } : {}}
              >
                {/* Day Header Horizontal */}
                <div 
                  className={`flex items-center justify-between px-4 py-3 relative`}
                  style={specialDay ? {
                    background: `linear-gradient(135deg, ${specialDay.color} 0%, ${specialDay.color}dd 100%)`
                  } : isToday 
                    ? { background: 'linear-gradient(to right, #6b7280, #4b5563)' }
                    : { background: 'linear-gradient(to right, #d4a574, #c49563)' }
                  }
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
                      {specialDay ? (
                        <p className="text-white/90 text-xs flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {specialDay.label}
                        </p>
                      ) : (
                        <p className="text-white/80 text-xs">
                          {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!specialDay?.blockAppointments && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayClick(day);
                        }}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        title="Agregar cita"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpecialDayClick(day, specialDay);
                      }}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      title={specialDay ? "Editar día especial" : "Marcar como día especial"}
                    >
                      <Calendar className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Appointments List */}
                <div className="p-3">
                  {specialDay?.blockAppointments ? (
                    <div className="py-6 text-center">
                      <p className="text-warm-600 dark:text-warm-400 text-sm">
                        🚫 Día bloqueado para citas
                      </p>
                      {dayAppointments.length > 0 && (
                        <p className="text-xs text-warm-500 dark:text-warm-500 mt-2">
                          Hay {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''} agendada{dayAppointments.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : dayAppointments.length === 0 ? (
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
          const specialDay = getSpecialDayForDate(day);
          
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
                } ${specialDay ? 'ring-2 shadow-lg' : ''}`}
                style={specialDay ? { borderColor: specialDay.color } : {}}
              >
                {/* Day Header Vertical */}
                <div 
                  className="p-4 text-center cursor-pointer relative"
                  style={specialDay ? {
                    background: `linear-gradient(135deg, ${specialDay.color} 0%, ${specialDay.color}dd 100%)`
                  } : isToday 
                    ? { background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }
                    : { background: 'linear-gradient(135deg, #d4a574 0%, #c49563 100%)' }
                  }
                  onClick={() => handleDayClick(day)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpecialDayClick(day, specialDay);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    title={specialDay ? "Editar día especial" : "Marcar como día especial"}
                  >
                    <Calendar className="w-4 h-4 text-white" />
                  </button>
                  
                  <p className="text-xs font-semibold uppercase text-white/90 mb-1">
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {format(day, 'd')}
                  </p>
                  {specialDay ? (
                    <div className="mt-2 flex items-center justify-center gap-1 text-white/90">
                      <Tag className="w-3 h-3" />
                      <p className="text-xs font-semibold">{specialDay.label}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/70 mt-1">
                      {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                    </p>
                  )}
                </div>

                {/* Appointments List Vertical */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {specialDay?.blockAppointments ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-warm-600 dark:text-warm-400 text-xs">
                          🚫 Día bloqueado
                        </p>
                        {dayAppointments.length > 0 && (
                          <p className="text-[10px] text-warm-500 dark:text-warm-500 mt-2">
                            {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : dayAppointments.length === 0 ? (
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
          {/* Fin de Vista Semanal */}
          </>
        )}
      </motion.div>

      {/* Mensaje cuando no hay resultados */}
      {viewMode === 'week' && searchTerm && weekDays.every(day => getAppointmentsForDay(day).length === 0) && (
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
          specialDays={specialDays}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowModal(false);
            setSelectedAppointment(null);
            setSelectedDate(null);
          }}
        />
      </Modal>

      {/* Modal for Special Day */}
      <Modal
        isOpen={showSpecialDayModal}
        onClose={() => {
          setShowSpecialDayModal(false);
          setSelectedSpecialDay(null);
          setSelectedDate(null);
        }}
        title={selectedSpecialDay ? 'Editar Día Especial' : 'Marcar Día Especial'}
      >
        {selectedDate && (
          <div>
            <SpecialDayForm
              specialDay={selectedSpecialDay}
              selectedDate={selectedDate}
              onSubmit={handleSaveSpecialDay}
              onCancel={() => {
                setShowSpecialDayModal(false);
                setSelectedSpecialDay(null);
                setSelectedDate(null);
              }}
            />
            
            {selectedSpecialDay && (
              <div className="mt-4 pt-4 border-t border-warm-200 dark:border-warm-700">
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este día especial?')) {
                      handleDeleteSpecialDay(selectedSpecialDay.id);
                      setShowSpecialDayModal(false);
                      setSelectedSpecialDay(null);
                      setSelectedDate(null);
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-semibold"
                >
                  Eliminar Día Especial
                </button>
              </div>
            )}
          </div>
        )}
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

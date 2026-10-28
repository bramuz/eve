import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { countDocuments, getDocuments, sumDocuments, Timestamp, where } from '../firebase/firestore';
import type { Appointment, ClientPayment, ClientService } from '../types';
import { endOfDay, endOfMonth, format, isThisMonth, isToday, startOfDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const toDateSafe = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!currentUser) return;
    if (name.length < 2) {
      toast.error('Escribe un nombre de al menos 2 letras');
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(currentUser, { displayName: name });
      setDisplayName(name);
      setEditingName(false);
      toast.success('Nombre actualizado');
    } catch {
      toast.error('No se pudo actualizar el nombre');
    } finally {
      setSavingName(false);
    }
  };
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalClients: 0,
    totalPending: 0,
    monthlyIncome: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const now = new Date();
      const byUser = where('userId', '==', currentUser.uid);
      const dateRange = (from: Date, to: Date) => [
        where('date', '>=', Timestamp.fromDate(from)),
        where('date', '<=', Timestamp.fromDate(to))
      ];

      // Solo se descargan las citas de hoy; los totales se calculan en el servidor.
      const [
        todayResult,
        { count: totalClients, error: clientError },
        { total: totalServicesAmount, error: servicesError },
        { total: totalPaid, error: paymentsError },
        monthResult
      ] = await Promise.all([
        getDocuments('appointments', [byUser, ...dateRange(startOfDay(now), endOfDay(now))]),
        countDocuments('clients', [byUser]),
        sumDocuments('clientServices', 'totalPrice', [byUser]),
        sumDocuments('clientPayments', 'amount', [byUser]),
        sumDocuments('clientPayments', 'amount', [byUser, ...dateRange(startOfMonth(now), endOfMonth(now))])
      ]);

      // Los filtros por fecha requieren los índices de firestore.indexes.json.
      // Mientras no estén desplegados, se usa la consulta completa anterior.
      let appointments = todayResult.data as Appointment[];
      if (todayResult.error) {
        console.warn('Consulta de citas de hoy sin índice, usando consulta completa:', todayResult.error);
        const { data, error } = await getDocuments('appointments', [byUser]);
        if (error) {
          console.error('Error al cargar citas:', error);
          toast.error('Error al cargar citas');
          return;
        }
        appointments = data as Appointment[];
      }

      // Las sumas en el servidor también dependen de esos índices; si fallan,
      // se descargan los documentos y se suma aquí (una sola descarga por colección).
      let allPayments: Promise<ClientPayment[]> | null = null;
      const loadAllPayments = () =>
        (allPayments ??= getDocuments('clientPayments', [byUser]).then(({ data, error }) => {
          if (error) console.error('Error al cargar abonos de usuarios:', error);
          return data as ClientPayment[];
        }));

      let monthlyIncome = monthResult.total;
      if (monthResult.error) {
        console.warn('Suma de ingresos del mes sin índice, usando consulta completa:', monthResult.error);
        monthlyIncome = (await loadAllPayments()).reduce((total, payment) => {
          const paymentDate = toDateSafe(payment.date);
          return paymentDate && isThisMonth(paymentDate) ? total + (payment.amount || 0) : total;
        }, 0);
      }

      let servicesAmount = totalServicesAmount;
      if (servicesError) {
        console.warn('Suma de servicios sin índice, usando consulta completa:', servicesError);
        const { data, error } = await getDocuments('clientServices', [byUser]);
        if (error) console.error('Error al cargar servicios:', error);
        servicesAmount = (data as ClientService[]).reduce(
          (total, service) => total + (service.totalPrice || 0),
          0
        );
      }

      let paidAmount = totalPaid;
      if (paymentsError) {
        console.warn('Suma de abonos sin índice, usando consulta completa:', paymentsError);
        paidAmount = (await loadAllPayments()).reduce(
          (total, payment) => total + (payment.amount || 0),
          0
        );
      }

      if (clientError) {
        console.error('Error al cargar usuarios:', clientError);
      }

      const todayAppts = appointments.filter((apt) => isToday(apt.date.toDate()));

      setStats({
        todayAppointments: todayAppts.length,
        totalClients,
        totalPending: Math.max(servicesAmount - paidAmount, 0),
        monthlyIncome
      });

      setTodayAppointments(todayAppts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" text="Cargando..." />
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
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveName();
                }}
                className="flex items-center justify-center gap-2 min-w-0 w-full"
              >
                <input
                  autoFocus
                  value={nameDraft}
                  maxLength={60}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Tu nombre"
                  className="min-w-0 flex-1 px-3 py-1.5 text-xl font-bold text-center rounded-xl border border-warm-300 dark:border-warm-600 bg-white dark:bg-warm-800 text-warm-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={savingName}
                  aria-label="Guardar nombre"
                  className="p-2 rounded-full bg-primary-600 text-white disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  aria-label="Cancelar"
                  className="p-2 rounded-full text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-warm-900 dark:text-white">
                  ¡Hola, {displayName || 'bienvenido'}!
                </h1>
                <button
                  onClick={() => {
                    setNameDraft(displayName);
                    setEditingName(true);
                  }}
                  aria-label="Editar nombre"
                  title="Editar nombre"
                  className="p-1.5 rounded-full text-warm-500 hover:text-primary-600 hover:bg-warm-100 dark:hover:bg-warm-700"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-center text-warm-600 dark:text-warm-400">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 border-primary-300 dark:border-primary-700 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/appointments')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-primary-700 dark:text-primary-300 font-semibold mb-1.5 uppercase tracking-wide">
                  Citas Hoy
                </p>
                <p className="text-3xl font-bold text-primary-800 dark:text-primary-200">
                  {stats.todayAppointments}
                </p>
              </div>
              <div className="p-3 bg-primary-300 dark:bg-primary-700 rounded-xl shadow-sm">
                <Calendar className="w-6 h-6 text-primary-800 dark:text-primary-200" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 bg-gradient-to-br from-warm-200 to-warm-300 dark:from-warm-800/50 dark:to-warm-700/50 border-warm-400 dark:border-warm-600 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/clients')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-warm-700 dark:text-warm-300 font-semibold mb-1.5 uppercase tracking-wide">
                  Total Usuarios
                </p>
                <p className="text-3xl font-bold text-warm-800 dark:text-warm-200">
                  {stats.totalClients}
                </p>
              </div>
              <div className="p-3 bg-warm-400 dark:bg-warm-600 rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-warm-800 dark:text-warm-200" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-300 dark:border-orange-700 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-1.5 uppercase tracking-wide">
                  Por Cobrar
                </p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  ${stats.totalPending.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-300 dark:bg-orange-700 rounded-xl shadow-sm">
                <DollarSign className="w-6 h-6 text-orange-800 dark:text-orange-200" />
              </div>
            </div>
          </Card>

          <Card
            className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 border-green-300 dark:border-green-700 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/income-dashboard')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-green-700 dark:text-green-300 font-semibold mb-1.5 uppercase tracking-wide">
                  Ingresos del Mes
                </p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  ${stats.monthlyIncome.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-300 dark:bg-green-700 rounded-xl shadow-sm">
                <TrendingUp className="w-6 h-6 text-green-800 dark:text-green-200" />
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Appointments */}
        {todayAppointments.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-warm-900 dark:text-white mb-3">
              Citas de Hoy
            </h2>
            <div className="space-y-2">
              {todayAppointments.map((apt) => (
                <Card key={apt.id} className="p-4 hover:shadow-lg transition-all hover:scale-[1.01] rounded-2xl bg-white dark:bg-warm-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-900 dark:text-white">
                        {apt.clientName}
                      </h3>
                      <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
                        {apt.service}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="primary" className="text-xs">
                          {apt.time}
                        </Badge>
                        <Badge
                          variant={
                            apt.paymentStatus === 'abonado' ? 'success' :
                            apt.paymentStatus === 'parcial' ? 'warning' : 'error'
                          }
                          className="text-xs"
                        >
                          {apt.paymentStatus === 'abonado' ? 'Abonado' :
                           apt.paymentStatus === 'parcial' ? 'Parcial' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                    {apt.price > 0 && (
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          ${apt.price.toLocaleString()}
                        </div>
                        {apt.paid > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Abonado: ${apt.paid.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todayAppointments.length === 0 && (
          <Card className="p-8 text-center rounded-2xl">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay citas para hoy
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              ¡Comienza a agregar tus citas desde el calendario!
            </p>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

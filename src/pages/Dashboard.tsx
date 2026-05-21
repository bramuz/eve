import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { getDocuments, where } from '../firebase/firestore';
import type { Appointment, ClientService } from '../types';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { currentUser } = useAuth();
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
      
      // Get all appointments
      const { data: appointments, error: apptError } = await getDocuments('appointments', [
        where('userId', '==', currentUser.uid)
      ]);

      if (apptError) {
        console.error('Error al cargar citas:', apptError);
        toast.error('Error al cargar citas');
        setLoading(false);
        return;
      }

      // Get all clients
      const { data: clients, error: clientError } = await getDocuments('clients', [
        where('userId', '==', currentUser.uid)
      ]);

      if (clientError) {
        console.error('Error al cargar clientes:', clientError);
      }

      // Get all client services
      const { data: clientServices, error: servicesError } = await getDocuments('clientServices', [
        where('userId', '==', currentUser.uid)
      ]);

      if (servicesError) {
        console.error('Error al cargar servicios:', servicesError);
      }

      if (!appointments) {
        setLoading(false);
        return;
      }

      // Filter today's appointments
      const todayAppts = (appointments as Appointment[]).filter((apt: Appointment) =>
        isToday(apt.date.toDate())
      );

      // Calculate total pending (all balances)
      let totalPending = 0;
      if (clientServices) {
        totalPending = (clientServices as ClientService[]).reduce(
          (sum, service) => sum + service.balance,
          0
        );
      }

      // Calculate monthly income (all payments from current month)
      let monthlyIncome = 0;
      if (clientServices) {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        (clientServices as ClientService[]).forEach(service => {
          service.payments.forEach(payment => {
            const paymentDate = payment.date.toDate();
            if (paymentDate >= monthStart && paymentDate <= monthEnd) {
              monthlyIncome += payment.amount;
            }
          });
        });
      }

      setStats({
        todayAppointments: todayAppts.length,
        totalClients: clients ? clients.length : 0,
        totalPending,
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
          <h1 className="text-3xl font-bold text-warm-900 dark:text-white mb-1">
            ¡Hola! 👋
          </h1>
          <p className="text-sm text-warm-600 dark:text-warm-400">
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
                  Total Clientes
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

          <Card className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 border-green-300 dark:border-green-700 hover:shadow-xl transition-all">
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
                            apt.paymentStatus === 'pagado' ? 'success' :
                            apt.paymentStatus === 'parcial' ? 'warning' : 'error'
                          }
                          className="text-xs"
                        >
                          {apt.paymentStatus}
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
                            Pagado: ${apt.paid.toLocaleString()}
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

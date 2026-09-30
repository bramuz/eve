import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { getDocuments, where } from '../firebase/firestore';
import type { Appointment } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export const Payments = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    
    const { data, error } = await getDocuments('appointments', [
      where('userId', '==', currentUser.uid)
    ]);

    if (error) {
      toast.error('Error al cargar los datos');
    } else {
      setAppointments(data as Appointment[]);
    }
    
    setLoading(false);
  };

  // Calcular estadísticas
  const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.paid || 0), 0);
  const totalPending = appointments.reduce((sum, apt) => sum + ((apt.price || 0) - (apt.paid || 0)), 0);
  const pendingAppointments = appointments.filter(apt => (apt.price || 0) > (apt.paid || 0));
  
  // Ingresos del mes actual
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthlyRevenue = appointments
    .filter(apt => {
      const date = apt.date.toDate();
      return date >= monthStart && date <= monthEnd;
    })
    .reduce((sum, apt) => sum + (apt.paid || 0), 0);

  // Filtrar citas
  const filteredAppointments = appointments
    .filter(apt => 
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" text="Cargando pagos..." />
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pagos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Control de ingresos y pagos pendientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                  Total Recibido
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
                  Por Cobrar
                </p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  ${totalPending.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-700 dark:text-orange-300" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Este Mes
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ${monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                  Pendientes
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {pendingAppointments.length}
                </p>
              </div>
              <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por cliente o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base rounded-xl"
          />
        </div>

        {/* Transactions List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Historial de Transacciones
          </h2>
          
          <div className="space-y-2">
            {filteredAppointments.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl">
                <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No se encontraron transacciones' : 'No hay transacciones registradas'}
                </p>
              </Card>
            ) : (
              filteredAppointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="p-4 hover:shadow-md transition-all rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {apt.clientName}
                          </h3>
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
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {apt.service}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(apt.date.toDate(), "d 'de' MMMM yyyy", { locale: es })}
                          </span>
                        </div>

                        {apt.paymentMethod && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Método: {apt.paymentMethod}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          ${apt.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Abonado: ${apt.paid.toLocaleString()}
                        </div>
                        {apt.price > apt.paid && (
                          <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            Debe: ${(apt.price - apt.paid).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

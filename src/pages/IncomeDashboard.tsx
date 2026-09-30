import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getDocuments, where } from '../firebase/firestore';
import type { ClientPayment } from '../types';
import { toast } from 'sonner';

interface MonthlyIncome {
  month: string;
  amount: number;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const toDateSafe = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const IncomeDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<MonthlyIncome[]>([]);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (currentUser) {
      loadIncomeData();
    }
  }, [currentUser]);

  const loadIncomeData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const { data: clientPayments, error: paymentsError } = await getDocuments('clientPayments', [
        where('userId', '==', currentUser.uid)
      ]);

      if (paymentsError) {
        console.error('Error al cargar abonos:', paymentsError);
      }

      const monthlyTotals = Array(12).fill(0) as number[];
      const independentPayments = (clientPayments as ClientPayment[] | undefined) || [];

      independentPayments.forEach((payment) => {
        const paymentDate = toDateSafe(payment.date);
        if (!paymentDate || paymentDate.getFullYear() !== currentYear) return;
        monthlyTotals[paymentDate.getMonth()] += payment.amount || 0;
      });

      const monthlyData: MonthlyIncome[] = MONTHS.map((month, index) => ({
        month,
        amount: monthlyTotals[index]
      }));

      setChartData(monthlyData);
    } catch (error) {
      console.error('Error loading income dashboard:', error);
      toast.error('Error al cargar el dashboard de ingresos');
    } finally {
      setLoading(false);
    }
  };

  const annualTotal = useMemo(
    () => chartData.reduce((sum, item) => sum + item.amount, 0),
    [chartData]
  );

  const bestMonth = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, item) => (item.amount > max.amount ? item : max), chartData[0]);
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" text="Cargando ingresos..." />
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
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <span className="text-sm font-semibold text-warm-600 dark:text-warm-400">Año {currentYear}</span>
        </div>

        <Card className="p-4 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-800/30 border-emerald-300 dark:border-emerald-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1.5 uppercase tracking-wide">
                Ingreso Anual
              </p>
              <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-100">
                ${annualTotal.toLocaleString()}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                Mejor mes: {bestMonth ? `${bestMonth.month} ($${bestMonth.amount.toLocaleString()})` : 'Sin datos'}
              </p>
            </div>
            <div className="p-3 bg-emerald-300 dark:bg-emerald-700 rounded-xl shadow-sm">
              <TrendingUp className="w-6 h-6 text-emerald-900 dark:text-emerald-100" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-warm-800">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-warm-900 dark:text-white">Ingresos por Mes</h2>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${Number(value).toLocaleString()}`, 'Ingreso']}
                  labelFormatter={(label) => `Mes: ${label}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #d1d5db'
                  }}
                />
                <Bar dataKey="amount" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

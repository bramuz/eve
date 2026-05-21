import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Client types
export interface Client {
  id: string;
  name: string;
  phone: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Client Service/Procedure types
export interface ClientServicePayment {
  id: string;
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  date: Timestamp;
  notes?: string;
}

export interface ClientService {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  totalPrice: number;
  payments: ClientServicePayment[];
  totalPaid: number;
  balance: number;
  status: 'pendiente' | 'parcial' | 'pagado';
  date: Timestamp;
  notes?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Appointment types
export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  service: string;
  date: Timestamp;
  time: string;
  // Información de pago
  price: number;
  paid: number; // Total pagado hasta ahora
  paymentStatus: 'pendiente' | 'parcial' | 'pagado';
  paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia';
  notes?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Product types
export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  imageUrl?: string;
  description?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Sale types
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  items: SaleItem[];
  subtotal: number;
  total: number;
  deposit: number;
  balance: number;
  status: 'paid' | 'pending' | 'partial';
  notes?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payment types
export interface Payment {
  id: string;
  referenceId?: string; // appointmentId or saleId
  referenceType?: 'appointment' | 'sale';
  appointmentId?: string;
  serviceName?: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  notes?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Dashboard Stats types
export interface DashboardStats {
  todayAppointments: number;
  todayIncome: number;
  pendingPayments: number;
  totalClients: number;
  upcomingAppointments: Appointment[];
  recentSales: Sale[];
  lowStockProducts: Product[];
}

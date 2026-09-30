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
  phone?: string; // Campo opcional
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Client Payment (independent from services)
export interface ClientPayment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  date: Timestamp;
  notes?: string;
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
  status: 'pendiente' | 'parcial' | 'abonado';
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
  paid: number; // Total abonado hasta ahora
  paymentStatus: 'pendiente' | 'parcial' | 'abonado';
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

// Special Day types
export interface SpecialDay {
  id: string;
  date: Timestamp;
  label: string; // Ej: "Festivo", "Vacaciones", "Cerrado"
  color: string; // Color hex para el día (Ej: "#ef4444", "#f59e0b")
  blockAppointments: boolean; // Si bloquea las citas o no
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Note types
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string; // Color para categorización visual
  isPinned: boolean; // Notas importantes fijadas al inicio
  category?: string; // Categoría opcional (Ej: "Personal", "Trabajo", "Ideas")
  clientId?: string; // Cliente asociado opcional
  clientName?: string; // Nombre del cliente asociado opcional
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Consent types
export interface ClientConsent {
  id: string;
  clientId: string;
  clientName: string;
  procedureName: string;
  professionalName: string;
  consentDate: string;
  clientCedula: string;
  consentText: string;
  signatureDataURL: string; // Base64 encoded signature image
  signedAt: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

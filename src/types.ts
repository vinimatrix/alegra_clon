/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  warehouseId: string;
  image?: string;
  taxRate: number; // e.g. 0.18 (ITBIS / IVA)
  description?: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientRnc: string; // Documento de identidad rnc/rfc/nit
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  status: 'pagada' | 'pendiente' | 'anulada';
  notes?: string;
  paymentMethod?: string;
}

export interface Account {
  code: string;
  name: string;
  type: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'egreso';
  balance: number;
  description?: string;
}

export interface JournalEntryLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
}

export interface RestaurantTable {
  id: string;
  name: string;
  status: 'libre' | 'ocupada' | 'atendiendo' | 'por_pagar';
  capacity: number;
  currentOrderId?: string;
}

export interface RestaurantOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  section?: string;          // E.g. 'Bebidas', 'Platos Fuertes', 'Entradas', etc.
  assignedStation?: string;  // E.g. 'Parrilla', 'Barra', 'Horno', 'Cocina Fría'
}

export interface RestaurantOrder {
  id: string;
  tableId: string;
  tableName: string;
  items: RestaurantOrderItem[];
  status: 'pendiente' | 'en_preparacion' | 'entregada' | 'cobrada';
  subtotal: number;
  taxes: number;
  total: number;
  waiterName?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isDefault: boolean;
}

export interface Client {
  id: string;
  name: string;
  rnc: string;
  email: string;
  phone: string;
  address?: string;
  type?: 'client' | 'supplier';
}

export interface Expense {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  supplierRnc: string;
  date: string;
  ncf: string;
  ncfType: string;
  subtotal: number;
  itbis: number;
  total: number;
  status: 'pagado' | 'pendiente';
  category: string;
}

export interface CashRegister {
  id: string;
  name: string;
  status: 'abierta' | 'cerrada';
  initialBalance: number;
  currentBalance: number;
}

export interface CashSession {
  id: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  initialBalance: number;
  expectedBalance: number;
  actualBalance?: number;
  difference?: number;
  salesCash: number;
  salesCard: number;
  salesTransfer: number;
}

export interface CajaClosureHistory {
  id: string;
  openedAt: string;
  closedAt: string;
  initialBalance: number;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  salesCash: number;
  salesCard: number;
  salesTransfer: number;
  receiptsCount: number;
}


export interface Employee {
  id: string;
  name: string;
  cedula: string;
  position: string;
  department: string;
  salary: number;
  startDate: string;
  status: 'activo' | 'inactivo';
  email?: string;
  phone?: string;
  recibeTss?: boolean;
  recibeAfp?: boolean;
  recibeSeguroMedico?: boolean;
}

export interface PayrollDeduction {
  concept: string;
  employeeRate: number;   // % that the employee pays
  employerRate: number;   // % that the employer pays
  employeeAmount: number;
  employerAmount: number;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;            // e.g. '2026-05'
  grossSalary: number;
  deductions: PayrollDeduction[];
  totalDeductions: number;
  netSalary: number;
  status: 'pendiente' | 'pagada';
}

// Dynamics Activable Modules System Custom Interfaces
export interface BusinessModuleConfig {
  id: 'citas_turnos' | 'records_medicos' | 'gestion_proyectos';
  name: string;
  description: string;
  isEnabled: boolean;
  category: 'Citas & Turnos' | 'Salud & Consultorio' | 'Proyectos & Consultoría';
  iconName: string;
}

export interface AppointmentTurn {
  id: string;
  ticketNumber: string; // e.g. T-01, C-02
  customerName: string;
  customerPhone?: string;
  serviceRequested: string; // e.g. "Corte de Cabello", "Consulta Dental"
  assignedStaffId?: string;
  assignedStaffName?: string;
  scheduledTime?: string; // If appointment, otherwise empty for Walk-In turn
  status: 'espera' | 'atendiendo' | 'completado' | 'cancelado';
  createdAt: string;
  notes?: string;
}

export interface PatientRecord {
  id: string;
  patientId: string; // client id (with client type/info)
  patientName: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  vitalSigns: {
    bloodPressure?: string;
    weightLb?: number;
    temperatureC?: number;
  };
  treatmentPlan: string;
  prescription: string; // Receta médica
  treatingDoctor: string;
  nextFollowUp?: string;
  status?: 'activo' | 'observacion' | 'alta_medica' | 'estudio_pendiente' | 'urgente';
  studies?: Array<{
    id: string;
    name: string;
    status: 'pendiente' | 'entregado';
    date: string;
    notes?: string;
  }>;
  evolutions?: Array<{
    id: string;
    date: string;
    type: 'cambio_sintoma' | 'laboratorio' | 'control_rutina' | 'nota_general';
    description: string;
    details?: string;
  }>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string;
  clientName?: string;
  startDate: string;
  dueDate: string;
  status: 'planeacion' | 'desarrollo' | 'revision' | 'entregado' | 'pausado' | 'atrasado';
  progress: number; // percentage 0-100
  incidents?: Array<{
    id: string;
    date: string;
    type: 'atraso' | 'cambio_alcance' | 'riesgo' | 'nota_general' | 'reunion_cliente';
    title: string;
    description: string;
    resolved: boolean;
  }>;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  assignee: string;
  startDate: string;
  dueDate: string;
  durationDays: number; // For Gantt timeline rendering
}


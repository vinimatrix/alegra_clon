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
}

export interface CashRegister {
  id: string;
  name: string;
  status: 'abierta' | 'cerrada';
  initialBalance: number;
  currentBalance: number;
}

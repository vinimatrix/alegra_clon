/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * api.ts - Capa de abstracción de red para Alegra+ Web
 *
 * Soporta tres modos de operación controlados por variables de entorno:
 *
 * 1. SUPABASE   → VITE_USE_SUPABASE=true   → Usa Supabase como base de datos.
 * 2. LOCAL API  → VITE_USE_SUPABASE=false y VITE_NESTJS_API_URL definido → Llama al backend NestJS.
 * 3. MOCK       → Sin variables definidas → Usa datos del localStorage/mockData.ts (modo offline).
 */
import { supabase, getSupabaseConfig } from './supabaseClient';

export function isSupabaseActive() {
  const config = getSupabaseConfig();
  return !!(config.use && config.hasValidKeys);
}

export const USE_SUPABASE = isSupabaseActive();
export const NESTJS_API_URL = import.meta.env.VITE_NESTJS_API_URL || '';

/** Retorna true si hay un backend real configurado (Supabase o NestJS) */
export function hasBackend() {
  return isSupabaseActive() || (NESTJS_API_URL !== '' && NESTJS_API_URL !== 'http://localhost:3001');
}

export const HAS_BACKEND = hasBackend();

export const api = {
  // PRODUCTS
  getProducts: async () => fetcher('products', 'GET'),
  createProduct: async (product: any) => fetcher('products', 'POST', product),
  updateProduct: async (id: string, product: any) => fetcher(`products/${id}`, 'PUT', product),
  deleteProduct: async (id: string) => fetcher(`products/${id}`, 'DELETE'),

  // INVOICES
  getInvoices: async () => fetcher('invoices', 'GET'),
  createInvoice: async (invoice: any) => fetcher('invoices', 'POST', invoice),
  updateInvoice: async (id: string, invoice: any) => fetcher(`invoices/${id}`, 'PUT', invoice),

  // CLIENTS
  getClients: async () => fetcher('clients', 'GET'),
  createClient: async (client: any) => fetcher('clients', 'POST', client),
  updateClient: async (id: string, client: any) => fetcher(`clients/${id}`, 'PUT', client),
  deleteClient: async (id: string) => fetcher(`clients/${id}`, 'DELETE'),

  // EXPENSES
  getExpenses: async () => fetcher('expenses', 'GET'),
  createExpense: async (expense: any) => fetcher('expenses', 'POST', expense),
  updateExpense: async (id: string, expense: any) => fetcher(`expenses/${id}`, 'PUT', expense),
  deleteExpense: async (id: string) => fetcher(`expenses/${id}`, 'DELETE'),

  // ACCOUNTS
  getAccounts: async () => fetcher('accounts', 'GET'),
  createAccount: async (account: any) => fetcher('accounts', 'POST', account),
  updateAccount: async (code: string, account: any) => fetcher(`accounts/${code}`, 'PUT', account),

  // JOURNAL ENTRIES
  getJournalEntries: async () => fetcher('journal_entries', 'GET'),
  createJournalEntry: async (entry: any) => fetcher('journal_entries', 'POST', entry),

  // TABLES (Mesas)
  getTables: async () => fetcher('tables', 'GET'),
  updateTable: async (id: string, table: any) => fetcher(`tables/${id}`, 'PUT', table),
  deleteTable: async (id: string) => fetcher(`tables/${id}`, 'DELETE'),

  // ORDERS (Comandas)
  getOrders: async () => fetcher('orders', 'GET'),
  createOrder: async (order: any) => fetcher('orders', 'POST', order),
  updateOrder: async (id: string, order: any) => fetcher(`orders/${id}`, 'PUT', order),

  // EMPLOYEES
  getEmployees: async () => fetcher('employees', 'GET'),
  createEmployee: async (emp: any) => fetcher('employees', 'POST', emp),
  updateEmployee: async (id: string, emp: any) => fetcher(`employees/${id}`, 'PUT', emp),
  deleteEmployee: async (id: string) => fetcher(`employees/${id}`, 'DELETE'),

  // PAYROLLS
  getPayrolls: async () => fetcher('payrolls', 'GET'),
  createPayroll: async (payroll: any) => fetcher('payrolls', 'POST', payroll),
};

// Helper recursively mapping snake_case keys to camelCase for React compatibility
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (typeof obj === 'object') {
    const n: any = {};
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      n[camelKey] = toCamelCase(obj[key]);
    }
    return n;
  }
  return obj;
}

// Helper recursively mapping camelCase keys to snake_case for Supabase Postgres compatibility
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (typeof obj === 'object') {
    const n: any = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      n[snakeKey] = toSnakeCase(obj[key]);
    }
    return n;
  }
  return obj;
}

async function fetcher(endpoint: string, method: string, body?: any): Promise<any> {
  const isPostOrPut = method === 'POST' || method === 'PUT';
  const parts = endpoint.split('/');
  const table = parts[0];
  const idPath = parts[1];

  if (isSupabaseActive()) {
    const keyCol = table === 'accounts' ? 'code' : 'id';
    let dbBody = body ? toSnakeCase(body) : undefined;
    if ((table === 'tables' || table === 'restaurant_tables') && dbBody) {
      delete dbBody.current_order_id;
    }
    if (table === 'orders' && dbBody) {
      if (dbBody.status === 'cobrada') {
        dbBody.status = 'cancelada';
      }
    }
    
    // ── SUPABASE MODE ──────────────────────────────────────────
    if (method === 'GET') {
      const { data, error } = await supabase.from(table).select('*').order(table === 'accounts' ? 'code' : 'created_at', { ascending: false });
      if (error) throw error;
      let camelData = toCamelCase(data ?? []);
      if (table === 'tables') {
        camelData = (camelData as any[]).filter((t: any) => !t.id.startsWith('pos-quick'));
      }
      if (table === 'orders') {
        camelData = (camelData as any[]).map((o: any) => o.status === 'cancelada' ? { ...o, status: 'cobrada' } : o);
      }
      return camelData;
    }
    if (method === 'POST') {
      if (table === 'orders' && dbBody && dbBody.table_id && typeof dbBody.table_id === 'string' && dbBody.table_id.startsWith('pos-quick-')) {
        try {
          const { data: existingTable } = await supabase
            .from('tables')
            .select('id')
            .eq('id', dbBody.table_id)
            .maybeSingle();

          if (!existingTable) {
            await supabase
              .from('tables')
              .insert([{
                id: dbBody.table_id,
                name: dbBody.table_name || `Mostrador ${dbBody.table_id.slice(-4)}`,
                status: 'ocupada',
                capacity: 1
              }]);
          }
        } catch (tblErr) {
          console.warn('Error ensuring quick table exists in web API:', tblErr);
        }
      }

      const { data, error } = await supabase.from(table).insert([dbBody]).select();
      if (error) throw error;
      const camelResult = toCamelCase(data?.[0]);
      if (table === 'orders' && camelResult && camelResult.status === 'cancelada') {
        (camelResult as any).status = 'cobrada';
      }
      return camelResult;
    }
    if (method === 'PUT' && idPath) {
      const { data, error } = await supabase.from(table).update(dbBody).eq(keyCol, idPath).select();
      if (error) throw error;
      const camelResult = toCamelCase(data?.[0]);
      if (table === 'orders' && camelResult && camelResult.status === 'cancelada') {
        (camelResult as any).status = 'cobrada';
      }
      return camelResult;
    }
    if (method === 'DELETE' && idPath) {
      const { error } = await supabase.from(table).delete().eq(keyCol, idPath);
      if (error) throw error;
      return { success: true };
    }
  } else if (NESTJS_API_URL) {
    // ── LOCAL NESTJS API MODE ──────────────────────────────────
    const res = await fetch(`${NESTJS_API_URL}/${endpoint}`, {
      method,
      headers: isPostOrPut ? { 'Content-Type': 'application/json' } : undefined,
      body: isPostOrPut ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API Error [${res.status}]: ${err}`);
    }
    return res.json();
  } else {
    // ── MOCK MODE (sin backend configurado) ───────────────────
    // Retorna null para que App.tsx use los datos del localStorage/mockData
    return null;
  }
}

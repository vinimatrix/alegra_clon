import { supabase, getSupabaseConfig } from './supabaseClient';

export function isSupabaseActive(): boolean {
  const config = getSupabaseConfig();
  return !!(config.use && config.hasValidKeys);
}

// Seamlessly convert camelCase to snake_case for Supabase compatibility
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

// Seamlessly convert snake_case to camelCase for state/UI compatibility
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

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  cost?: number;
  minStock?: number;
  taxRate?: number;
}

export interface CartItem extends Product {
  quantity: number;
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
  sentToKitchen?: boolean;
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

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p-01', name: 'Mofongo con Chicharrón', price: 450.00, stock: 120, sku: 'PROD-MOF-01', category: 'Platos' },
  { id: 'p-02', name: 'Pechuga de Pollo a la Plancha', price: 390.00, stock: 95, sku: 'PROD-PECH-02', category: 'Platos' },
  { id: 'p-03', name: 'Mofongo de Camarones al Ajillo', price: 650.00, stock: 45, sku: 'PROD-MOF-03', category: 'Platos' },
  { id: 'p-04', name: 'Hamburguesa Artesanal "La Criolla"', price: 480.00, stock: 80, sku: 'PROD-HAM-04', category: 'Platos' },
  { id: 'p-05', name: 'Cerveza Presidente Grande', price: 230.00, stock: 350, sku: 'PROD-PRES-05', category: 'Bebidas' },
  { id: 'p-06', name: 'Limonada Natural Imperial', price: 125.00, stock: 500, sku: 'PROD-LIM-06', category: 'Bebidas' },
  { id: 'p-07', name: 'Refresco Cola Regular', price: 80.00, stock: 420, sku: 'PROD-COLA-07', category: 'Bebidas' },
  { id: 'p-08', name: 'Audífonos Bluetooth Wireless Pro', price: 1800.00, stock: 24, sku: 'PROD-AUD-08', category: 'Accesorios' },
  { id: 'p-09', name: 'Cargador Rápido USB-C 20W', price: 750.00, stock: 8, sku: 'PROD-CARG-09', category: 'Accesorios' },
  { id: 'p-10', name: 'Termo de Acero Inoxidable 1L', price: 1200.00, stock: 45, sku: 'PROD-TERM-10', category: 'Accesorios' },
  { id: 'p-11', name: 'Café de Especialidad Molido (1lb)', price: 420.00, stock: 68, sku: 'PROD-CAFE-11', category: 'Café' }
];

export const MOCK_TABLES: RestaurantTable[] = [
  { id: 't-01', name: 'Mesa 1 (Doble)', status: 'libre', capacity: 2 },
  { id: 't-02', name: 'Mesa 2 (Familiar)', status: 'ocupada', capacity: 6 },
  { id: 't-03', name: 'Mesa 3 (Interior)', status: 'atendiendo', capacity: 4 },
  { id: 't-04', name: 'Mesa 4 (Terraza)', status: 'libre', capacity: 4 },
  { id: 't-05', name: 'Mesa 5 (Ventanales)', status: 'por_pagar', capacity: 2 },
  { id: 't-06', name: 'Mesa 6 (Terraza Alta)', status: 'libre', capacity: 2 },
  { id: 't-07', name: 'Mesa 7 (Bar)', status: 'libre', capacity: 1 },
  { id: 't-08', name: 'VIP - Salón Ejecutivo', status: 'ocupada', capacity: 10 }
];

export const MOCK_ORDERS: RestaurantOrder[] = [
  {
    id: 'ord-101',
    tableId: 't-02',
    tableName: 'Mesa 2 (Familiar)',
    items: [
      { productId: 'p-01', name: 'Mofongo con Chicharrón', quantity: 3, price: 450.00 },
      { productId: 'p-05', name: 'Cerveza Presidente Grande', quantity: 4, price: 230.00, notes: 'Bien frías, tipo ceniza' },
      { productId: 'p-06', name: 'Limonada Natural Imperial', quantity: 2, price: 125.00 }
    ],
    status: 'en_preparacion',
    subtotal: 2520.00,
    taxes: 453.60,
    total: 2973.60,
    waiterName: 'Andrés Reynoso',
    createdAt: '15:30'
  }
];

export const mobileApi = {
  getProducts: async (): Promise<Product[]> => {
    if (isSupabaseActive()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          return toCamelCase(data) as Product[];
        }
      } catch (e) {
        console.warn('Error fetching products from Supabase, returning cache/mock:', e);
      }
    }
    return MOCK_PRODUCTS;
  },

  getTables: async (): Promise<RestaurantTable[]> => {
    if (isSupabaseActive()) {
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const camelTables = toCamelCase(data) as RestaurantTable[];
          return camelTables.filter(t => !t.id.startsWith('pos-quick'));
        } else {
          // If the DB is empty (first initialize), we can preseed tables to Supabase
          try {
            await supabase.from('tables').insert(toSnakeCase(MOCK_TABLES));
          } catch (seedingErr) {
            console.warn('Could not seed tables to Supabase:', seedingErr);
          }
          return MOCK_TABLES.filter(t => !t.id.startsWith('pos-quick'));
        }
      } catch (e) {
        console.warn('Error fetching tables from Supabase, returning mock:', e);
      }
    }
    return MOCK_TABLES.filter(t => !t.id.startsWith('pos-quick'));
  },

  updateTable: async (id: string, tableUpdate: any): Promise<any> => {
    if (isSupabaseActive()) {
      try {
        const cleanUpdate: any = {};
        if (tableUpdate.name !== undefined) cleanUpdate.name = tableUpdate.name;
        if (tableUpdate.status !== undefined) cleanUpdate.status = tableUpdate.status;
        if (tableUpdate.capacity !== undefined) cleanUpdate.capacity = tableUpdate.capacity;

        const dbBody = toSnakeCase(cleanUpdate);
        const { data, error } = await supabase
          .from('tables')
          .update(dbBody)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return toCamelCase(data?.[0]);
      } catch (e) {
        console.warn(`Error updating table ${id} in Supabase:`, e);
      }
    }
    // Update local mock
    const tIndex = MOCK_TABLES.findIndex(t => t.id === id);
    if (tIndex !== -1) {
      MOCK_TABLES[tIndex] = { ...MOCK_TABLES[tIndex], ...tableUpdate };
    }
    return null;
  },

  deleteTable: async (id: string): Promise<any> => {
    if (id.startsWith('pos-quick')) {
      // Avoid deleting from database to maintain foreign key referential integrity
      return null;
    }
    if (isSupabaseActive()) {
      try {
        const { error } = await supabase
          .from('tables')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.warn(`Error deleting table ${id} in Supabase:`, e);
      }
    }
    // Delete from local mock list
    const index = MOCK_TABLES.findIndex(t => t.id === id);
    if (index !== -1) {
      MOCK_TABLES.splice(index, 1);
    }
    return null;
  },

  getOrders: async (): Promise<RestaurantOrder[]> => {
    if (isSupabaseActive()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data && data.length > 0) {
          // Clean empty orders or mapping items
          const camelOrders = toCamelCase(data) as RestaurantOrder[];
          return camelOrders.map(o => o.status === 'cancelada' ? { ...o, status: 'cobrada' } : o);
        }
      } catch (e) {
        console.warn('Error fetching orders from Supabase:', e);
      }
    }
    return MOCK_ORDERS;
  },

  createOrder: async (order: RestaurantOrder): Promise<RestaurantOrder> => {
    if (isSupabaseActive()) {
      try {
        if (order.tableId && order.tableId.startsWith('pos-quick-')) {
          try {
            const { data: existingTable } = await supabase
              .from('tables')
              .select('id')
              .eq('id', order.tableId)
              .maybeSingle();

            if (!existingTable) {
              await supabase
                .from('tables')
                .insert([{
                  id: order.tableId,
                  name: order.tableName || `Mostrador ${order.tableId.slice(-4)}`,
                  status: 'ocupada',
                  capacity: 1
                }]);
            }
          } catch (tblErr) {
            console.warn('Error ensuring quick table exists in mobile API:', tblErr);
          }
        }

        const mappedOrder = { ...order };
        if (mappedOrder.status === 'cobrada') {
          mappedOrder.status = 'cancelada';
        }

        const dbBody = toSnakeCase(mappedOrder);
        const { data, error } = await supabase
          .from('orders')
          .insert([dbBody])
          .select();
        
        if (error) throw error;
        const camelResult = toCamelCase(data?.[0]) as RestaurantOrder;
        if (camelResult && camelResult.status === 'cancelada') {
          camelResult.status = 'cobrada';
        }
        return camelResult;
      } catch (e) {
        console.warn('Error writing order to Supabase:', e);
      }
    }
    return order;
  },

  updateOrder: async (id: string, orderUpdate: any): Promise<any> => {
    if (isSupabaseActive()) {
      try {
        const mappedUpdate = { ...orderUpdate };
        if (mappedUpdate.status === 'cobrada') {
          mappedUpdate.status = 'cancelada';
        }

        const dbBody = toSnakeCase(mappedUpdate);
        const { data, error } = await supabase
          .from('orders')
          .update(dbBody)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        const camelResult = toCamelCase(data?.[0]);
        if (camelResult && camelResult.status === 'cancelada') {
          camelResult.status = 'cobrada';
        }
        return camelResult;
      } catch (e) {
        console.warn(`Error updating order ${id} in Supabase:`, e);
      }
    }
    return orderUpdate;
  },

  createJournalEntry: async (entry: JournalEntry): Promise<any> => {
    if (isSupabaseActive()) {
      try {
        const dbBody = toSnakeCase(entry);
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([dbBody])
          .select();
        
        if (error) throw error;
        return toCamelCase(data?.[0]);
      } catch (e) {
        console.warn('Error saving general journal entry in Supabase:', e);
      }
    }
    return entry;
  },

  createInvoice: async (cart: CartItem[], totalAmount: number, paymentMethod: string = 'Efectivo'): Promise<any> => {
    const today = new Date().toISOString().split('T')[0];
    const taxes = totalAmount * 0.18; // 18% standard tax rate
    const subtotal = totalAmount - taxes;

    let activeClientId: string | null = null;
    let activeClientName = 'Consumidor Final (POS Móvil)';
    let activeClientRnc = '224-00123-5';

    if (isSupabaseActive()) {
      try {
        // 1. Fetch any existing client to associate with the cash sale
        const { data: clientsData, error: clientErr } = await supabase
          .from('clients')
          .select('id, name, rnc')
          .limit(1);

        if (!clientErr && clientsData && clientsData.length > 0) {
          activeClientId = clientsData[0].id;
          activeClientName = clientsData[0].name;
          activeClientRnc = clientsData[0].rnc || 'Consumidor Final';
        } else {
          // 2. If no client exists, seed a generic one first so that foreign key parses successfully
          const genericClient = {
            id: 'c-pos-generic',
            name: 'Consumidor Final (POS Móvil)',
            rnc: '224-00123-5',
            email: 'contacto@pos.alegra.com',
            phone: 'N/A',
            address: 'Venta de Caja POS'
          };
          const { data: seeded, error: seedErr } = await supabase
            .from('clients')
            .insert([toSnakeCase(genericClient)])
            .select();

          if (!seedErr && seeded && seeded.length > 0) {
            const camelSeeded = toCamelCase(seeded[0]);
            activeClientId = camelSeeded.id;
            activeClientName = camelSeeded.name;
            activeClientRnc = camelSeeded.rnc || 'Consumidor Final';
          }
        }
      } catch (e) {
        console.warn('Error resolving client ID in Supabase, falling back to null representation:', e);
      }
    }

    // Build the exact web admin compliant invoice payload
    const invoicePayload = {
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: 'NFC-POS-' + Math.floor(100000 + Math.random() * 900000),
      clientId: activeClientId, 
      clientName: activeClientName,
      clientRnc: activeClientRnc,
      issueDate: today,
      dueDate: today,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: 0,
        taxRate: 0.18,
        total: item.quantity * item.price
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxes: parseFloat(taxes.toFixed(2)),
      discount: 0,
      total: parseFloat(totalAmount.toFixed(2)),
      status: 'pagada',
      paymentMethod: paymentMethod,
      notes: 'Facturado desde Alegra+ Punto de Venta Móvil (Expo)'
    };

    if (isSupabaseActive()) {
      const dbBody = toSnakeCase(invoicePayload);
      const { data, error } = await supabase
        .from('invoices')
        .insert([dbBody])
        .select();

      if (error) {
        throw error;
      }
      return toCamelCase(data?.[0]);
    }

    return invoicePayload;
  },

  updateProductStock: async (productId: string, newStock: number): Promise<boolean> => {
    if (isSupabaseActive()) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);
        
        if (error) throw error;
        return true;
      } catch (e) {
        console.warn(`Error updating stock for product ${productId} in Supabase:`, e);
        return false;
      }
    }
    return true;
  }
};

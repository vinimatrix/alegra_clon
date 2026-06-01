import { supabase, getSupabaseConfig } from './supabaseClient';

export function isSupabaseActive(): boolean {
  const config = getSupabaseConfig();
  return !!(config.use && config.hasValidKeys);
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface CartItem extends Product {
  quantity: number;
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

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p-01', name: 'Mofongo con Chicharrón', price: 450.00, stock: 120, sku: 'PROD-MOF-01' },
  { id: 'p-02', name: 'Pechuga de Pollo a la Plancha', price: 390.00, stock: 95, sku: 'PROD-PECH-02' },
  { id: 'p-03', name: 'Mofongo de Camarones al Ajillo', price: 650.00, stock: 45, sku: 'PROD-MOF-03' },
  { id: 'p-04', name: 'Hamburguesa Artesanal "La Criolla"', price: 480.00, stock: 80, sku: 'PROD-HAM-04' },
  { id: 'p-05', name: 'Cerveza Presidente Grande', price: 230.00, stock: 350, sku: 'PROD-PRES-05' },
  { id: 'p-06', name: 'Limonada Natural Imperial', price: 125.00, stock: 500, sku: 'PROD-LIM-06' },
  { id: 'p-07', name: 'Refresco Cola Regular', price: 80.00, stock: 420, sku: 'PROD-COLA-07' },
  { id: 'p-08', name: 'Audífonos Bluetooth Wireless Pro', price: 1800.00, stock: 24, sku: 'PROD-AUD-08' },
  { id: 'p-09', name: 'Cargador Rápido USB-C 20W', price: 750.00, stock: 8, sku: 'PROD-CARG-09' },
  { id: 'p-10', name: 'Termo de Acero Inoxidable 1L', price: 1200.00, stock: 45, sku: 'PROD-TERM-10' },
  { id: 'p-11', name: 'Café de Especialidad Molido (1lb)', price: 420.00, stock: 68, sku: 'PROD-CAFE-11' }
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

  createInvoice: async (cart: CartItem[], totalAmount: number, paymentMethod: string = 'Efectivo'): Promise<any> => {
    const today = new Date().toISOString().split('T')[0];
    const taxes = totalAmount * 0.18; // 18% standard tax rate
    const subtotal = totalAmount - taxes;

    // Build the exact web admin compliant invoice payload
    const invoicePayload = {
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: 'NFC-POS-' + Math.floor(100000 + Math.random() * 900000),
      clientId: 'cli-pos-anon',
      clientName: 'Consumidor Final (POS Móvil)',
      clientRnc: '224-00123-5',
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

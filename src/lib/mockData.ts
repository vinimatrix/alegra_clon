/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Warehouse, Client, Invoice, Account, JournalEntry, RestaurantTable, RestaurantOrder } from '../types';

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh-main', name: 'Almacén Central', location: 'Santo Domingo Centro', isDefault: true },
  { id: 'wh-pos', name: 'Almacén Punto de Venta (POS)', location: 'Plaza Central Local 12', isDefault: false },
  { id: 'wh-kitchen', name: 'Bodega de Alimentos (Cocina)', location: 'Área de Cocina', isDefault: false },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c-01', name: 'Eduardo Pérez', rnc: '101-54321-1', email: 'eduardo@gmail.com', phone: '809-555-0192', address: 'Av. Winston Churchill #12' },
  { id: 'c-02', name: 'Sofía Rodríguez', rnc: '223-01923-2', email: 'sofia.r@outlook.com', phone: '829-444-1122', address: 'Calle El Sol, Santiago' },
  { id: 'c-03', name: 'Sinergia Tecnológica SRL', rnc: '1-31-01234-5', email: 'compras@sinergia.com.do', phone: '809-222-3784', address: 'Torre Empresarial Blue, Santo Domingo' },
  { id: 'c-04', name: 'María Alejandra Delgado', rnc: '001-1249302-3', email: 'marialeg@gmail.com', phone: '849-888-0099', address: 'Bella Vista, Santo Domingo D.N.' },
  { id: 'c-gen', name: 'Cliente de Contado / Consumidor Final', rnc: '224-0012344-5', email: 'ventas@alegraclone.com', phone: 'N/A', address: 'Venta Directa POS' }
];

export const INITIAL_PRODUCTS: Product[] = [
  // Restaurante - Platos principales
  { id: 'p-01', name: 'Mofongo con Chicharrón', sku: 'REST-001', price: 450.00, cost: 180.00, stock: 120, minStock: 20, category: 'Platos', warehouseId: 'wh-kitchen', taxRate: 0.18, description: 'Mofongo dominicano tradicional con chicharrón crujiente y caldo de la casa.' },
  { id: 'p-02', name: 'Pechuga de Pollo a la Plancha', sku: 'REST-002', price: 390.00, cost: 150.00, stock: 95, minStock: 15, category: 'Platos', warehouseId: 'wh-kitchen', taxRate: 0.18, description: 'Pechuga tierna sazonada al grill con guarnición de ensalada o papas.' },
  { id: 'p-03', name: 'Mofongo de Camarones al Ajillo', sku: 'REST-003', price: 650.00, cost: 260.00, stock: 45, minStock: 10, category: 'Platos', warehouseId: 'wh-kitchen', taxRate: 0.18, description: 'Sabor caribeño premium cubierto de camarones frescos al ajillo.' },
  { id: 'p-04', name: 'Hamburguesa Artesanal "La Criolla"', sku: 'REST-004', price: 480.00, cost: 200.00, stock: 80, minStock: 15, category: 'Platos', warehouseId: 'wh-kitchen', taxRate: 0.18, description: 'Carne Angus 8oz, queso cheddar, cebolla caramelizada, chicharrón y salsa criolla hecha en casa.' },
  
  // Restaurante - Bebidas
  { id: 'p-05', name: 'Cerveza Presidente Grande', sku: 'REST-005', price: 230.00, cost: 110.00, stock: 350, minStock: 50, category: 'Bebidas', warehouseId: 'wh-kitchen', taxRate: 0.18, description: 'Cerveza pilsener tradicional dominicana, servida vestida de novia.' },
  { id: 'p-06', name: 'Limonada Natural Imperial', sku: 'REST-006', price: 125.00, cost: 35.00, stock: 500, minStock: 30, category: 'Bebidas', warehouseId: 'wh-kitchen', taxRate: 0.18, description: 'Refrescante jugo de limón natural endulzado al gusto.' },
  { id: 'p-07', name: 'Refresco Cola Regular', sku: 'REST-007', price: 80.00, cost: 30.00, stock: 420, minStock: 100, category: 'Bebidas', warehouseId: 'wh-pos', taxRate: 0.18, description: 'Lata de refresco premium frío.' },
  
  // Productos Retail
  { id: 'p-08', name: 'Audífonos Bluetooth Wireless Pro', sku: 'RET-001', price: 1800.00, cost: 850.00, stock: 24, minStock: 5, category: 'Tecnología', warehouseId: 'wh-pos', taxRate: 0.18, description: 'Audífonos inalámbricos hi-fi con cancelación activa de ruido.' },
  { id: 'p-09', name: 'Cargador Rápido USB-C 20W', sku: 'RET-002', price: 750.00, cost: 280.00, stock: 8, minStock: 10, category: 'Tecnología', warehouseId: 'wh-pos', taxRate: 0.18, description: 'Cargador de pared de carga ultrarrápida compatible con múltiples marcas.' },
  { id: 'p-10', name: 'Termo de Acero Inoxidable 1L', sku: 'RET-003', price: 1200.00, cost: 450.00, stock: 45, minStock: 8, category: 'Hogar', warehouseId: 'wh-main', taxRate: 0.18, description: 'Mantiene bebidas calientes por 12 horas o frías por 24 horas.' },
  { id: 'p-11', name: 'Café de Especialidad Molido (1lb)', sku: 'RET-004', price: 420.00, cost: 230.00, stock: 68, minStock: 12, category: 'Alimentos', warehouseId: 'wh-main', taxRate: 0.18, description: 'Café de altura artesanal dominicano, tueste medio.' }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'f-6011',
    invoiceNumber: 'FC-1001',
    clientId: 'c-03',
    clientName: 'Sinergia Tecnológica SRL',
    clientRnc: '1-31-01234-5',
    issueDate: '2026-05-20',
    dueDate: '2026-06-20',
    items: [
      { productId: 'p-08', name: 'Audífonos Bluetooth Wireless Pro', quantity: 10, unitPrice: 1800.00, discount: 0, taxRate: 0.18, total: 18000.00 },
      { productId: 'p-09', name: 'Cargador Rápido USB-C 20W', quantity: 20, unitPrice: 750.00, discount: 50.00, taxRate: 0.18, total: 14000.00 }
    ],
    subtotal: 32000.00,
    taxes: 5760.00,
    discount: 1000.00,
    total: 36760.00,
    status: 'pagada',
    paymentMethod: 'Transferencia Bancaria'
  },
  {
    id: 'f-6012',
    invoiceNumber: 'FC-1002',
    clientId: 'c-01',
    clientName: 'Eduardo Pérez',
    clientRnc: '101-54321-1',
    issueDate: '2026-05-24',
    dueDate: '2026-06-24',
    items: [
      { productId: 'p-01', name: 'Mofongo con Chicharrón', quantity: 2, unitPrice: 450.00, discount: 0, taxRate: 0.18, total: 900.00 },
      { productId: 'p-05', name: 'Cerveza Presidente Grande', quantity: 3, unitPrice: 230.00, discount: 0, taxRate: 0.18, total: 690.00 }
    ],
    subtotal: 1590.00,
    taxes: 286.20,
    discount: 0,
    total: 1876.20,
    status: 'pendiente',
    paymentMethod: 'Pendiente'
  },
  {
    id: 'f-6013',
    invoiceNumber: 'FC-1003',
    clientId: 'c-04',
    clientName: 'María Alejandra Delgado',
    clientRnc: '001-1249302-3',
    issueDate: '2026-05-25',
    dueDate: '2026-06-25',
    items: [
      { productId: 'p-10', name: 'Termo de Acero Inoxidable 1L', quantity: 1, unitPrice: 1200.00, discount: 0, taxRate: 0.18, total: 1200.00 },
      { productId: 'p-11', name: 'Café de Especialidad Molido (1lb)', quantity: 2, unitPrice: 420.00, discount: 20.00, taxRate: 0.18, total: 800.00 }
    ],
    subtotal: 2000.00,
    taxes: 360.00,
    discount: 40.00,
    total: 2320.00,
    status: 'pagada',
    paymentMethod: 'Tarjeta de Crédito'
  },
  {
    id: 'f-6014',
    invoiceNumber: 'FC-1004',
    clientId: 'c-02',
    clientName: 'Sofía Rodríguez',
    clientRnc: '223-01923-2',
    issueDate: '2026-04-10',
    dueDate: '2026-05-10',
    items: [
      { productId: 'p-08', name: 'Audífonos Bluetooth Wireless Pro', quantity: 1, unitPrice: 1800.00, discount: 0, taxRate: 0.18, total: 1800.00 }
    ],
    subtotal: 1800.00,
    taxes: 324.00,
    discount: 0,
    total: 2124.00,
    status: 'pendiente',
    paymentMethod: 'Pendiente'
  }
];

// Nivel de Contabilidad - Catálogo de Cuentas (Nomenclatura típica)
export const INITIAL_ACCOUNTS: Account[] = [
  // ACTIVOS (1000)
  { code: '1101', name: 'Efectivo en Caja General', type: 'activo', balance: 15450.00, description: 'Dinero físico en oficina central.' },
  { code: '1102', name: 'Caja Chica POS', type: 'activo', balance: 5000.00, description: 'Fondo fijo para devoluciones y gastos menores de tienda.' },
  { code: '1103', name: 'Banco Popular Dominicano', type: 'activo', balance: 845300.20, description: 'Cuenta corriente principal 746XXXXX.' },
  { code: '1105', name: 'Cuentas por Cobrar Clientes', type: 'activo', balance: 4000.20, description: 'Compromisos de clientes por facturas de crédito.' },
  { code: '1110', name: 'Inventario de Mercancías', type: 'activo', balance: 145000.00, description: 'Costo total de productos almacenados.' },
  { code: '1201', name: 'Mobiliario y Equipo de Oficina', type: 'activo', balance: 120000.00, description: 'Escritorios, estanterías, vitrinas.' },
  { code: '1205', name: 'Equipos de Computación y POS', type: 'activo', balance: 85000.00, description: 'Laptops, impresoras térmicas, tablets.' },

  // PASIVOS (2000)
  { code: '2101', name: 'Cuentas por Pagar Proveedores', type: 'pasivo', balance: 45000.00, description: 'Obligaciones comerciales.' },
  { code: '2105', name: 'ITBIS por Pagar (Ventas)', type: 'pasivo', balance: 6406.20, description: 'Impuesto recolectado sobre ventas.' },
  { code: '2110', name: 'Acreedores Varios', type: 'pasivo', balance: 12000.00, description: 'Otras deudas a corto plazo.' },

  // PATRIMONIO (3000)
  { code: '3101', name: 'Capital Social Autorizado', type: 'patrimonio', balance: 1000000.00, description: 'Aportes iniciales de accionistas.' },
  { code: '3201', name: 'Utilidades Retenidas', type: 'patrimonio', balance: 132000.00, description: 'Resultados de ejercicios anteriores.' },

  // INGRESOS (4000)
  { code: '4101', name: 'Ingresos por Ventas de Mercancía', type: 'ingreso', balance: 35590.00, description: 'Venta ordinaria de articulos retail.' },
  { code: '4102', name: 'Ingresos por Venta Restaurante', type: 'ingreso', balance: 18340.00, description: 'Venta ordinaria de platillos y refrescos.' },

  // EGRESOS / COSTOS / GASTOS (5000)
  { code: '5101', name: 'Costo de Ventas (Mercancías)', type: 'egreso', balance: 16500.00, description: 'Costo de adquisición de productos vendidos.' },
  { code: '5201', name: 'Gastos de Sueldos y Salarios', type: 'egreso', balance: 24000.00, description: 'Nómina mensual de personal.' },
  { code: '5205', name: 'Gasto de Alquiler de Local', type: 'egreso', balance: 15000.00, description: 'Arriendo mensual del local comercial.' },
  { code: '5210', name: 'Gasto de Servicios Públicos', type: 'egreso', balance: 4800.00, description: 'Electricidad, internet, agua.' }
];

// Asientos Contables Históricos
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'as-001',
    date: '2026-05-01',
    description: 'Apertura de mes con pago de alquiler de local comercial',
    reference: 'CK-5001',
    lines: [
      { accountCode: '5205', debit: 15000.00, credit: 0 },
      { accountCode: '1103', debit: 0, credit: 15000.00 }
    ]
  },
  {
    id: 'as-002',
    date: '2026-05-15',
    description: 'Pago por servicios públicos del mes anterior',
    reference: 'PUB-05-26',
    lines: [
      { accountCode: '5210', debit: 4800.00, credit: 0 },
      { accountCode: '1103', debit: 0, credit: 4800.00 }
    ]
  },
  {
    id: 'as-003',
    date: '2026-05-20',
    description: 'Venta factura FC-1001 e ITBIS adscrito (Sinergia)',
    reference: 'FC-1001',
    lines: [
      { accountCode: '1103', debit: 36760.00, credit: 0 },
      { accountCode: '4101', debit: 0, credit: 32000.00 },
      { accountCode: '2105', debit: 0, credit: 5760.00 },
      { accountCode: '5101', debit: 14100.00, credit: 0 },
      { accountCode: '1110', debit: 0, credit: 14100.00 }
    ]
  },
  {
    id: 'as-004',
    date: '2026-05-24',
    description: 'Registro de venta al crédito FC-1002 - Eduardo Pérez',
    reference: 'FC-1002',
    lines: [
      { accountCode: '1105', debit: 1876.20, credit: 0 },
      { accountCode: '4102', debit: 0, credit: 1590.00 },
      { accountCode: '2105', debit: 0, credit: 286.20 }
    ]
  }
];

// Restaurante - Mesas pre-configuradas con diferentes estados
export const INITIAL_TABLES: RestaurantTable[] = [
  { id: 't-01', name: 'Mesa 1 (Doble)', status: 'libre', capacity: 2 },
  { id: 't-02', name: 'Mesa 2 (Familiar)', status: 'ocupada', capacity: 6 },
  { id: 't-03', name: 'Mesa 3 (Interior)', status: 'atendiendo', capacity: 4 },
  { id: 't-04', name: 'Mesa 4 (Terraza)', status: 'libre', capacity: 4 },
  { id: 't-05', name: 'Mesa 5 (Ventanales)', status: 'por_pagar', capacity: 2 },
  { id: 't-06', name: 'Mesa 6 (Terraza Alta)', status: 'libre', capacity: 2 },
  { id: 't-07', name: 'Mesa 7 (Bar)', status: 'libre', capacity: 1 },
  { id: 't-08', name: 'VIP - Salón Ejecutivo', status: 'ocupada', capacity: 10 }
];

// Comandas abiertas activas en el restaurante
export const INITIAL_ORDERS: RestaurantOrder[] = [
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
    waiterName: 'Juan Carlos',
    createdAt: '15:30'
  },
  {
    id: 'ord-102',
    tableId: 't-03',
    tableName: 'Mesa 3 (Interior)',
    items: [
      { productId: 'p-02', name: 'Pechuga de Pollo a la Plancha', quantity: 2, price: 390.00, notes: 'Con papas fritas' },
      { productId: 'p-07', name: 'Refresco Cola Regular', quantity: 2, price: 80.00 }
    ],
    status: 'entregada',
    subtotal: 940.00,
    taxes: 169.20,
    total: 1109.20,
    waiterName: 'Milagros García',
    createdAt: '15:45'
  },
  {
    id: 'ord-103',
    tableId: 't-05',
    tableName: 'Mesa 5 (Ventanales)',
    items: [
      { productId: 'p-04', name: 'Hamburguesa Artesanal "La Criolla"', quantity: 2, price: 480.00 },
      { productId: 'p-05', name: 'Cerveza Presidente Grande', quantity: 2, price: 230.00 }
    ],
    status: 'entregada',
    subtotal: 1420.00,
    taxes: 255.60,
    total: 1675.60,
    waiterName: 'Juan Carlos',
    createdAt: '14:20'
  },
  {
    id: 'ord-104',
    tableId: 't-08',
    tableName: 'VIP - Salón Ejecutivo',
    items: [
      { productId: 'p-03', name: 'Mofongo de Camarones al Ajillo', quantity: 4, price: 650.00 },
      { productId: 'p-05', name: 'Cerveza Presidente Grande', quantity: 6, price: 230.00 },
      { productId: 'p-06', name: 'Limonada Natural Imperial', quantity: 2, price: 125.00 }
    ],
    status: 'pendiente',
    subtotal: 4230.00,
    taxes: 761.40,
    total: 4991.40,
    waiterName: 'Evelyn Batista',
    createdAt: '16:05'
  }
];

export function getLocalStorageState<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage`, error);
    return defaultValue;
  }
}

export function saveLocalStorageState<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key ${key} to localStorage`, error);
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Table, 
  User, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  CreditCard, 
  DollarSign, 
  UtensilsCrossed, 
  Coffee, 
  X,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  Lock,
  Unlock,
  History,
  Scale,
  Edit,
  ChefHat
} from 'lucide-react';
import KitchenKDS from './KitchenKDS';
import { Product, Client, RestaurantTable, RestaurantOrder, Invoice, CashSession, CajaClosureHistory } from '../types';

interface POSRestaurantsProps {
  products: Product[];
  clients: Client[];
  tables: RestaurantTable[];
  orders: RestaurantOrder[];
  invoices: Invoice[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onUpdateTables: (updatedTables: RestaurantTable[]) => void;
  onUpdateOrders: (updatedOrders: RestaurantOrder[]) => void;
  
  // Cash Register State Channels
  cajaSession: CashSession;
  cajaHistory: CajaClosureHistory[];
  onOpenCaja: (initialBalance: number) => void;
  onCloseCaja: (actualBalance: number) => void;

  categories: string[];
  onUpdateCategories: (updatedCategories: string[]) => void;
  taxes: any[];
  onUpdateTaxes: (updatedTaxes: any[]) => void;
}

export default function POSRestaurants({ 
  products, 
  clients, 
  tables, 
  orders, 
  invoices,
  onAddInvoice,
  onUpdateTables,
  onUpdateOrders,
  cajaSession,
  cajaHistory,
  onOpenCaja,
  onCloseCaja,
  categories: propCategories,
  onUpdateCategories,
  taxes,
  onUpdateTaxes
}: POSRestaurantsProps) {
  // Toggle between 'retail' (standard POS) and 'restaurante' (Mesa/Comandas layout)
  const [posMode, setPosMode] = useState<'retail' | 'restaurante'>('retail');

  // CASH REGISTER (CAJA) MUTATIVE VARIABLES
  const [openingBalanceInput, setOpeningBalanceInput] = useState<number>(1000);
  const [showClosingModal, setShowClosingModal] = useState<boolean>(false);
  const [actualBalanceInput, setActualBalanceInput] = useState<number>(1000);
  
  // TABLE MANAGEMENT STATES
  const [showManageTablesModal, setShowManageTablesModal] = useState(false);
  const [showTableFormModal, setShowTableFormModal] = useState(false);
  const [tableFormMode, setTableFormMode] = useState<'add' | 'edit'>('add');
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<RestaurantTable | null>(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableCapacityInput, setTableCapacityInput] = useState(4);
  
  
  // RETAIL POS STATE
  const [retailCategory, setRetailCategory] = useState<string>('Todos');
  const [retailSearch, setRetailSearch] = useState<string>('');
  const [retailCart, setRetailCart] = useState<{ product: Product; qty: number }[]>([]);
  const [retailClient, setRetailClient] = useState<string>('c-gen'); // Default to Consumidor Final
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState<string>('Efectivo');
  const [checkoutReceived, setCheckoutReceived] = useState<number>(1000);
  const [lastReceipt, setLastReceipt] = useState<Invoice | null>(null);

  // RESTAURANT WORKFLOW STATE
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(tables[1]); // Mesa 2 by default
  const [showOrderEditor, setShowOrderEditor] = useState(false);

  // RESTSubTab toggle: 'mapa' (Tables map), 'historial' (Closed orders list) and 'cocina' (KDS flow controller)
  const [restSubTab, setRestSubTab] = useState<'mapa' | 'historial' | 'cocina'>('mapa');

  // Order history filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0] // default to today's date
  );
  const [historyWaiterFilter, setHistoryWaiterFilter] = useState<string>('Todos');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<RestaurantOrder | null>(null);

  // Helper to extract the date (YYYY-MM-DD) from a RestaurantOrder's createdAt
  const getOrderDate = (createdAt: string) => {
    if (createdAt && createdAt.includes(' ')) {
      return createdAt.split(' ')[0];
    }
    // Fallback: If format has no space (e.g. mock '15:30' or '16:05'), treat as today
    return new Date().toISOString().split('T')[0];
  };

  // RESTAURANT SEARCH AND SPECIAL ACTION STATES
  const [restCategory, setRestCategory] = useState<string>('Todos');
  const [restSearch, setRestSearch] = useState<string>('');
  
  // Custom item detail selection states
  const [showDetailAddModal, setShowDetailAddModal] = useState<boolean>(false);
  const [selectedProdForDetail, setSelectedProdForDetail] = useState<Product | null>(null);
  const [detailQtyInput, setDetailQtyInput] = useState<number>(1);
  const [detailNotesInput, setDetailNotesInput] = useState<string>('');

  // Item note update state
  const [showItemNotesModal, setShowItemNotesModal] = useState<boolean>(false);
  const [editingOrderItemIndex, setEditingOrderItemIndex] = useState<{ orderId: string; productId: string; name: string; notes: string } | null>(null);

  const restaurantFilteredProducts = products.filter(p => {
    const matchesCat = restCategory === 'Todos' || p.category === restCategory;
    const matchesSearch = p.name.toLowerCase().includes(restSearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(restSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Retail filter definitions
  const categories = ['Todos', ...propCategories];
  const filteredProducts = products.filter(p => {
    const matchesCat = retailCategory === 'Todos' || p.category === retailCategory;
    const matchesSearch = p.name.toLowerCase().includes(retailSearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(retailSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // CART WORKFLOW
  const handleAddToCart = (prod: Product) => {
    const existing = retailCart.find(item => item.product.id === prod.id);
    if (existing) {
      setRetailCart(retailCart.map(item => 
        item.product.id === prod.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setRetailCart([...retailCart, { product: prod, qty: 1 }]);
    }
  };

  const handleUpdateCartQty = (prodId: string, adjust: number) => {
    setRetailCart(retailCart.map(item => {
      if (item.product.id === prodId) {
        const newQty = item.qty + adjust;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any);
  };

  const calculateCartTotals = () => {
    const subtotal = retailCart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const taxes = subtotal * 0.18; // ITBIS Dominicana
    const total = subtotal + taxes;
    return { subtotal, taxes, total };
  };

  const handleProcessRetailSale = () => {
    if (retailCart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleFinalizeRetailCheckout = () => {
    const { subtotal, taxes, total } = calculateCartTotals();
    const currClient = clients.find(c => c.id === retailClient) || clients[clients.length - 1];

    const newInvoiceNumber = `FC-POS-${2000 + Date.now().toString().slice(-4)}`;
    const newInvoice: Invoice = {
      id: `f-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      clientId: currClient.id,
      clientName: currClient.name,
      clientRnc: currClient.rnc,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: retailCart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.qty,
        unitPrice: item.product.price,
        discount: 0,
        taxRate: item.product.taxRate,
        total: item.product.price * item.qty * 1.18
      })),
      subtotal,
      taxes,
      discount: 0,
      total,
      status: 'pagada',
      paymentMethod: checkoutPayment,
      notes: 'Facturado vía POS Al paso'
    };

    onAddInvoice(newInvoice);
    setLastReceipt(newInvoice);
    setRetailCart([]);
    setShowCheckoutModal(false);
  };

  // RESTAURANT COMANDE SETUP
  const getActiveOrderForTable = (tableId: string) => {
    return orders.find(o => o.tableId === tableId && o.status !== 'cobrada');
  };

  const handleSetTableStatus = (tableId: string, status: RestaurantTable['status']) => {
    const updated = tables.map(t => t.id === tableId ? { ...t, status } : t);
    onUpdateTables(updated);
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable({ ...selectedTable, status });
    }
  };

  // Table management logic: Add, Edit, Delete
  const handleAddNewTable = () => {
    if (!tableNameInput.trim()) {
      alert('Por favor, ingresa un nombre para la mesa.');
      return;
    }
    const newTable: RestaurantTable = {
      id: `t-${Date.now()}`,
      name: tableNameInput.trim(),
      status: 'libre',
      capacity: Number(tableCapacityInput) || 4
    };
    onUpdateTables([...tables, newTable]);
    setShowTableFormModal(false);
    setTableNameInput('');
    setTableCapacityInput(4);
  };

  const handleEditTableSubmit = () => {
    if (!selectedTableForEdit || !tableNameInput.trim()) {
      alert('Por favor, ingresa un nombre para la mesa.');
      return;
    }
    const updated = tables.map(t => t.id === selectedTableForEdit.id ? {
      ...t,
      name: tableNameInput.trim(),
      capacity: Number(tableCapacityInput) || 4
    } : t);
    onUpdateTables(updated);
    
    // Also update selected table if active
    if (selectedTable && selectedTable.id === selectedTableForEdit.id) {
      setSelectedTable({
        ...selectedTable,
        name: tableNameInput.trim(),
        capacity: Number(tableCapacityInput) || 4,
        status: selectedTable.status
      });
    }

    setShowTableFormModal(false);
    setSelectedTableForEdit(null);
    setTableNameInput('');
    setTableCapacityInput(4);
  };

  const handleDeleteTable = (tableId: string) => {
    const tableToDelete = tables.find(t => t.id === tableId);
    if (!tableToDelete) return;

    // Direct Data Integrity: block if not libre, or if has open orders in system
    const activeOrder = getActiveOrderForTable(tableId);
    if (tableToDelete.status !== 'libre' || activeOrder) {
      alert(`No se puede eliminar la mesa "${tableToDelete.name}" porque tiene una comanda activa o su estado actual no es 'libre'. Transiciona la mesa a libre o cóbrala antes de eliminar.`);
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la mesa "${tableToDelete.name}"?`)) {
      const updated = tables.filter(t => t.id !== tableId);
      onUpdateTables(updated);
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(updated[0] || null);
      }
    }
  };

  // Assign or Add Food to Table Order
  const handleAddDishToTable = (prod: Product, customQty: number = 1, customNotes?: string) => {
    if (!selectedTable) return;
    
    // Check if table has an active order
    const activeOrder = getActiveOrderForTable(selectedTable.id);
    
    if (activeOrder) {
      // Add dish to existing order with matching notes
      const existingItemIndex = activeOrder.items.findIndex(i => i.productId === prod.id && i.notes === customNotes);
      let updatedItems = [];
      if (existingItemIndex > -1) {
        updatedItems = activeOrder.items.map((i, idx) => 
          idx === existingItemIndex ? { ...i, quantity: i.quantity + customQty } : i
        );
      } else {
        updatedItems = [...activeOrder.items, {
          productId: prod.id,
          name: prod.name,
          quantity: customQty,
          price: prod.price,
          notes: customNotes
        }];
      }

      const subtotal = updatedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const taxes = subtotal * 0.18;
      const total = subtotal + taxes;

      const updatedOrders = orders.map(o => 
        o.id === activeOrder.id ? { ...o, items: updatedItems, subtotal, taxes, total } : o
      );
      onUpdateOrders(updatedOrders);
    } else {
      // Create new order for this table
      const subtotal = prod.price * customQty;
      const taxes = subtotal * 0.18;
      const total = subtotal + taxes;

      const newOrder: RestaurantOrder = {
        id: `ord-${Date.now()}`,
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        items: [{
          productId: prod.id,
          name: prod.name,
          quantity: customQty,
          price: prod.price,
          notes: customNotes
        }],
        status: 'pendiente',
        subtotal,
        taxes,
        total,
        waiterName: 'Juan Carlos',
        createdAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      };

      onUpdateOrders([...orders, newOrder]);
      handleSetTableStatus(selectedTable.id, 'ocupada');
    }
  };

  const handleUpdateDishQty = (orderId: string, prodId: string, adjust: number, itemIdx?: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map((i, idx) => {
      if (i.productId === prodId && (itemIdx === undefined || idx === itemIdx)) {
        const newQty = i.quantity + adjust;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean) as any;

    const subtotal = updatedItems.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;

    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, items: updatedItems, subtotal, taxes, total } : o
    );
    onUpdateOrders(updatedOrders);
  };

  const handleModifyItemNotesInOrder = (orderId: string, prodId: string, itemIdx: number, newNotes: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map((item, idx) => {
      if (item.productId === prodId && idx === itemIdx) {
        return { ...item, notes: newNotes };
      }
      return item;
    });

    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, items: updatedItems } : o
    );
    onUpdateOrders(updatedOrders);
  };

  const handleAdvanceOrderStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let nextStatus: RestaurantOrder['status'] = 'pendiente';
    if (order.status === 'pendiente') {
      nextStatus = 'en_preparacion';
      if (selectedTable) handleSetTableStatus(selectedTable.id, 'atendiendo');
    } else if (order.status === 'en_preparacion') {
      nextStatus = 'entregada';
    } else if (order.status === 'entregada') {
      nextStatus = 'entregada'; // Stay pending checkout
    }

    onUpdateOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
  };

  // Checkout and emit invoice from Table comanda
  const handlePayTableOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currClient = clients[clients.length - 1]; // Client de contado

    // Create invoice and push
    const newInvoiceNumber = `FC-REST-${Date.now().toString().slice(-4)}`;
    const newInvoice: Invoice = {
      id: `f-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      clientId: currClient.id,
      clientName: `Mesa - ${order.tableName}`,
      clientRnc: currClient.rnc,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: 0,
        taxRate: 0.18,
        total: item.price * item.quantity * 1.18
      })),
      subtotal: order.subtotal,
      taxes: order.taxes,
      discount: 0,
      total: order.total,
      status: 'pagada',
      paymentMethod: 'Efectivo en Caja',
      notes: `Restaurante - Comanda ${order.id} cobrada.`
    };

    onAddInvoice(newInvoice);
    setLastReceipt(newInvoice);

    // Close order and set table to free!
    onUpdateOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cobrada' } : o));
    handleSetTableStatus(order.tableId, 'libre');
  };

  const activeTableOrder = selectedTable ? getActiveOrderForTable(selectedTable.id) : null;

  const closedOrders = orders.filter(o => o.status === 'cobrada');

  // Filter closed orders by search and date and waiter
  const filteredClosedOrders = closedOrders.filter(order => {
    // Date filter: compare order date with selected historyDateFilter
    const orderDate = getOrderDate(order.createdAt);
    const matchesDate = !historyDateFilter || orderDate === historyDateFilter;

    // Search filter: waiterName or tableName or items names
    const matchesSearch = !historySearch || 
      order.tableName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (order.waiterName && order.waiterName.toLowerCase().includes(historySearch.toLowerCase())) ||
      order.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      order.items.some(i => i.name.toLowerCase().includes(historySearch.toLowerCase()));

    // Waiter filter
    const matchesWaiter = historyWaiterFilter === 'Todos' || order.waiterName === historyWaiterFilter;

    return matchesDate && matchesSearch && matchesWaiter;
  });

  const waitersList = Array.from(new Set(closedOrders.map(o => o.waiterName).filter(Boolean))) as string[];

  // Statistics based on filtered history list
  const totalSalesVolume = filteredClosedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTaxesVolume = filteredClosedOrders.reduce((sum, o) => sum + o.taxes, 0);
  const totalSalesSubtotal = filteredClosedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const averageTicketValue = filteredClosedOrders.length > 0 ? totalSalesVolume / filteredClosedOrders.length : 0;

  // Waiter leaderboard
  const waiterStats = waitersList.map(waiter => {
    const waiterOrders = closedOrders.filter(o => o.waiterName === waiter);
    const totalSales = waiterOrders.reduce((sum, o) => sum + o.total, 0);
    const count = waiterOrders.length;
    return { waiter, totalSales, count };
  }).sort((a, b) => b.totalSales - a.totalSales);

  // Top items in closed orders represent popularity
  const itemPopularity: { [name: string]: { qty: number, total: number } } = {};
  closedOrders.forEach(o => {
    o.items.forEach(item => {
      if (!itemPopularity[item.name]) {
        itemPopularity[item.name] = { qty: 0, total: 0 };
      }
      itemPopularity[item.name].qty += item.quantity;
      itemPopularity[item.name].total += (item.quantity * item.price);
    });
  });
  const topDishes = Object.entries(itemPopularity).map(([name, stats]) => ({
    name,
    qty: stats.qty,
    total: stats.total
  })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Shift sales analyzer
  const shiftInvoices = invoices.filter(inv => {
    if (!cajaSession.isOpen) return false;
    return new Date(inv.issueDate) >= new Date(cajaSession.openedAt) && inv.status === 'pagada';
  });

  const shiftSalesCash = shiftInvoices
    .filter(inv => inv.paymentMethod?.toLowerCase().includes('efectiv') || !inv.paymentMethod)
    .reduce((sum, inv) => sum + inv.total, 0);

  const shiftSalesCard = shiftInvoices
    .filter(inv => inv.paymentMethod?.toLowerCase().includes('tarjeta'))
    .reduce((sum, inv) => sum + inv.total, 0);

  const shiftSalesTransfer = shiftInvoices
    .filter(inv => inv.paymentMethod?.toLowerCase().includes('transfe') || inv.paymentMethod?.toLowerCase().includes('banco') || inv.paymentMethod?.toLowerCase().includes('deposito'))
    .reduce((sum, inv) => sum + inv.total, 0);

  const shiftTotalSales = shiftInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const shiftExpectedAmount = cajaSession.initialBalance + shiftSalesCash;

  if (!cajaSession.isOpen) {
    return (
      <div className="space-y-6 animate-fade-in" id="caja-cerrada-view">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-8 max-w-xl mx-auto text-center space-y-6 mt-8">
          <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 mb-2">
            <Lock size={36} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 font-display">Turno de Caja Cerrado</h1>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Para comenzar a emitir facturas en el Punto de Venta (POS) o registrar pedidos de restaurante, debes abrir la caja ingresando el balance inicial en efectivo disponible en gaveta.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 text-left space-y-3.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Monto Inicial de Apertura (Efectivo)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">RD$</span>
              <input
                type="number"
                value={openingBalanceInput}
                onChange={(e) => setOpeningBalanceInput(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 outline-none focus:border-alegra-primary text-sm font-bold text-gray-800"
                placeholder="0.00"
              />
            </div>
            <button
              onClick={() => onOpenCaja(openingBalanceInput)}
              className="w-full bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans"
              id="btn-abrir-caja"
            >
              <Unlock size={14} /> Abrir Turno de Caja
            </button>
          </div>
        </div>

        {/* HISTORIAL DE CIERRES */}
        <div className="bg-white rounded-xl border border-gray-205 shadow-xs overflow-hidden max-w-4xl mx-auto">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <History className="text-alegra-primary animate-pulse" size={18} />
            <h2 className="text-base font-bold text-gray-800 font-display">Historial de Turnos y Arqueos de Caja</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            {cajaHistory.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">
                No hay turnos anteriores registrados en la bitácora local.
              </div>
            ) : (
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="bg-gray-55/70 text-[10px] text-gray-700 uppercase tracking-wider border-b border-gray-150">
                  <tr>
                    <th className="px-5 py-3">Apertura</th>
                    <th className="px-5 py-3">Cierre</th>
                    <th className="px-5 py-3 text-right">Monto Inicial</th>
                    <th className="px-5 py-3 text-right">Esperado</th>
                    <th className="px-5 py-3 text-right">Arqueo Real</th>
                    <th className="px-5 py-3 text-right">Diferencia</th>
                    <th className="px-5 py-3">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {cajaHistory.map((h, i) => (
                    <tr key={h.id || i} className="hover:bg-gray-55/40">
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                        {new Date(h.openedAt).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                        {new Date(h.closedAt).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-950">
                        RD$ {h.initialBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-950">
                        RD$ {h.expectedBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-950">
                        RD$ {h.actualBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold ${
                        h.difference < 0 ? 'text-red-650' : h.difference > 0 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        RD$ {h.difference.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.difference === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {h.difference === 0 ? 'Cuadrado' : h.difference < 0 ? 'Faltante' : 'Sobrante'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="pos-restaurants-screen">

      {/* Dynamic Cash Register Status Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-905 flex items-center gap-1.5 uppercase tracking-wider font-display">
              <Unlock size={14} className="text-green-600" /> Caja Abierta y Activa
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              Iniciado el {new Date(cajaSession.openedAt).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-gray-400 font-medium font-sans block text-[10px] uppercase">Fondo Inicial</span>
            <span className="font-bold text-gray-950 text-sm">RD$ {cajaSession.initialBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-gray-400 font-medium font-sans block text-[10px] uppercase font-bold text-emerald-700">Ventas Efectivo</span>
            <span className="font-bold text-emerald-600 text-sm">+ RD$ {shiftSalesCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-gray-400 font-medium font-sans block text-[10px] uppercase">Esperado en Caja</span>
            <span className="font-bold text-gray-950 text-sm">RD$ {shiftExpectedAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </div>
          {shiftSalesCard > 0 && (
            <div>
              <span className="text-gray-400 font-medium font-sans block text-[10px] uppercase">Ventas Tarjeta</span>
              <span className="font-bold text-blue-600 text-sm">RD$ {shiftSalesCard.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setActualBalanceInput(shiftExpectedAmount); // Default to expected amount to make balancing easy!
            setShowClosingModal(true);
          }}
          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-sans"
          id="btn-trigger-cerrar-caja"
        >
          <Lock size={14} /> Cerrar Caja / Arqueo
        </button>
      </div>
      
      {/* Interactive module header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display flex items-center gap-2 animate-fade-in">
            <UtensilsCrossed size={22} className="text-alegra-primary" />
            Ventas de Salón y Punto de Venta (POS)
          </h1>
          <p className="text-sm text-gray-500">
            Modulo dual ultra-rápido: cambia entre POS minorista tradicional y gestión interactiva de mesas de restaurante.
          </p>
        </div>
        
        {/* Toggle Mode Button Bar */}
        <div className="bg-gray-100/80 p-1 rounded-xl border border-gray-200 flex items-center self-start gap-1">
          <button 
            onClick={() => setPosMode('retail')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              posMode === 'retail' 
                ? 'bg-white text-alegra-primary shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="toggle-pos-retail"
          >
            <ShoppingBag size={14} />
            Páso Rápido (Retail)
          </button>
          <button 
            onClick={() => setPosMode('restaurante')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              posMode === 'restaurante' 
                ? 'bg-white text-alegra-primary shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="toggle-pos-rest"
          >
            <Table size={14} />
            Modo Restaurante (Mesas)
          </button>
        </div>
      </div>

      {posMode === 'retail' ? (
        
        /*******************************************************
         * RETAIL / CASHIER SPEED CHECKOUT POS
         *******************************************************/
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="retail-pos-layout">
          {/* Left section: Product Selection Catalog */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search and Category navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-xs" id="retail-search-filters">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Por nombre de plato o SKU..."
                  value={retailSearch}
                  onChange={(e) => setRetailSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg text-xs pl-9 pr-4 py-2 outline-none focus:border-alegra-primary focus:bg-white text-gray-800"
                />
              </div>

              {/* Horizonal Categories scroll */}
              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto font-display">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setRetailCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      retailCategory === cat 
                        ? 'bg-alegra-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Card Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1" id="retail-product-grid">
              {filteredProducts.map(p => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <div 
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    className={`bg-white rounded-xl p-3 border border-gray-100 shadow-xxs hover:border-alegra-primary hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 select-none ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-wider">{p.category}</span>
                      <h3 className="text-xs font-bold text-gray-900 mt-1 line-clamp-2 leading-snug">{p.name}</h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {p.sku}</p>
                    </div>
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-50">
                      <span className="text-xs font-bold text-alegra-primary">${p.price.toFixed(0)}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${p.stock <= p.minStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {p.stock} p.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right section: Ticket / Cart calculation */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col min-h-[450px] justify-between" id="retail-pos-ticket">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold text-alegra-secondary uppercase tracking-wider font-display">Comprobante de Venta</h3>
                <span className="text-[10px] bg-slate-100 text-alegra-secondary px-2 py-0.5 font-bold rounded-full">
                  {retailCart.reduce((acc, c) => acc + c.qty, 0)} Items
                </span>
              </div>

              {/* Client assignment in checkout */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-gray-100 text-xs text-gray-600">
                <User size={14} className="text-gray-400" />
                <div className="flex-1">
                  <select
                    value={retailClient}
                    onChange={(e) => setRetailClient(e.target.value)}
                    className="w-full bg-transparent outline-none font-semibold text-gray-800"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cart Items list */}
              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2.5 pr-1 divide-y divide-gray-50">
                {retailCart.length === 0 ? (
                  <div className="text-center py-12 text-gray-300 flex flex-col items-center justify-center gap-2">
                    <ShoppingBag size={28} />
                    <p className="text-xs">El carrito está vacío.<br />Selecciona productos de la izquierda.</p>
                  </div>
                ) : (
                  retailCart.map((item, idx) => (
                    <div key={item.product.id} className={`flex items-center justify-between gap-2 pt-2.5 ${idx === 0 ? 'pt-0' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-800 truncate">{item.product.name}</h4>
                        <p className="text-[10px] text-gray-405 font-mono">${item.product.price} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleUpdateCartQty(item.product.id, -1)}
                          className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-xs font-bold font-mono px-1.5 w-6 text-center">{item.qty}</span>
                        <button 
                          onClick={() => handleUpdateCartQty(item.product.id, 1)}
                          className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations and final buttons */}
            <div className="border-t border-gray-100 pt-4 space-y-3 mt-4">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">${calculateCartTotals().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ITBIS / IVA (18%):</span>
                  <span className="font-semibold text-gray-900">${calculateCartTotals().taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-alegra-primary pt-2 border-t border-dashed border-gray-100 mt-2">
                  <span>Total a Cobrar:</span>
                  <span>${calculateCartTotals().total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRetailCart([])}
                  disabled={retailCart.length === 0}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleProcessRetailSale}
                  disabled={retailCart.length === 0}
                  className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold py-2 rounded-lg text-xs flex justify-center items-center gap-1 shadow-sm disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  id="pos-retail-pay-trigger"
                >
                  <CreditCard size={12} />
                  PAGAR RECIBO
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /*******************************************************
         * RESTAURANT TABLE MAPPING AND COMMANDAS
         *******************************************************/
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="restaurant-layout">
          {/* Left section: Interactive visual tables block */}
          <div className="lg:col-span-8 space-y-4">
            {/* Sub-tab selection: Map of Tables vs Order History */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRestSubTab('mapa')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      restSubTab === 'mapa'
                        ? 'bg-white text-alegra-primary shadow-2xs font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Salón y Mesas Activas
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestSubTab('cocina')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      restSubTab === 'cocina'
                        ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <ChefHat size={12} className={restSubTab === 'cocina' ? 'text-emerald-650' : 'text-gray-550'} />
                    Flujo de Cocina 🍳
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestSubTab('historial')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      restSubTab === 'historial'
                        ? 'bg-white text-alegra-primary shadow-2xs font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    id="btn-rest-history-tab"
                  >
                    <History size={12} className={restSubTab === 'historial' ? 'text-alegra-primary' : 'text-gray-550'} />
                    Historial y Desempeño
                  </button>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {restSubTab === 'mapa' ? (
                    <button
                      onClick={() => setShowManageTablesModal(true)}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      <Table size={12} className="text-alegra-primary" />
                      Gestionar Mesas
                    </button>
                  ) : restSubTab === 'cocina' ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md font-bold uppercase tracking-wider animate-pulse whitespace-nowrap">
                      Canal KDS Activo
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">Turno Oficial / Santo Domingo</span>
                  )}
                </div>
              </div>

              {restSubTab === 'mapa' && (
                <div className="pt-4 space-y-4">
                  <div className="flex justify-between items-center text-[9px] font-semibold uppercase tracking-wider text-gray-505">
                    <div className="flex gap-2.5 text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Libre</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Ocupada</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Atendida</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Por pagar</span>
                    </div>
                  </div>

                  {/* Table grid render */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5" id="dining-room-tables-grid">
                    {tables.map(table => {
                      const tableOrder = getActiveOrderForTable(table.id);
                      const isSelected = selectedTable?.id === table.id;

                      // Define background styles depending on states
                      let bgClass = "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950";
                      if (table.status === 'ocupada') bgClass = "border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900";
                      if (table.status === 'atendiendo') bgClass = "border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900 animate-pulse";
                      if (table.status === 'por_pagar') bgClass = "border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-900";

                      if (isSelected) bgClass += " ring-2 ring-alegra-primary ring-offset-1";

                      return (
                        <div
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className={`border-2 rounded-xl p-3.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-300 shadow-xxs h-32 select-none ${bgClass}`}
                        >
                          <Table size={24} className="opacity-80" />
                          <div>
                            <h4 className="text-xs font-bold leading-none">{table.name}</h4>
                            <p className="text-[9px] opacity-75 mt-0.5">Cap: {table.capacity} pers.</p>
                          </div>
                          
                          <div className="w-full mt-2 pt-1 border-t border-slate-900/10 text-[10px] font-bold">
                            {tableOrder ? (
                              <span className="font-mono">${tableOrder.total.toFixed(0)}</span>
                            ) : (
                              <span className="opacity-60">LIBRE</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {restSubTab === 'cocina' && (
                <div className="pt-4">
                  <KitchenKDS 
                    orders={orders}
                    tables={tables}
                    products={products}
                    onUpdateOrders={onUpdateOrders}
                    onUpdateTables={onUpdateTables}
                  />
                </div>
              )}

              {restSubTab === 'historial' && (
                /* ORDER HISTORY DASHBOARD VIEW */
                <div className="pt-4 space-y-4">
                  {/* Daily performance metrics banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-gray-150">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Total Recaudado</span>
                      <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 mt-1 block">
                        RD$ {totalSalesVolume.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[8px] text-gray-400 block mt-0.5">Neto: RD$ {totalSalesSubtotal.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Impuestos Cobrados</span>
                      <span className="text-xs sm:text-sm font-black font-mono text-gray-800 mt-1 block">
                        RD$ {totalTaxesVolume.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[8px] text-gray-400 block mt-0.5">ITBIS 18% / Ley 10%</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Ticket Promedio</span>
                      <span className="text-xs sm:text-sm font-black font-mono text-indigo-600 mt-1 block">
                        RD$ {averageTicketValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[8px] text-gray-400 block mt-0.5">Por comanda cobrada</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Comandas Cobradas</span>
                      <span className="text-xs sm:text-sm font-black font-mono text-gray-900 mt-1 block">
                        {filteredClosedOrders.length} Pedido(s)
                      </span>
                      <span className="text-[8px] text-gray-400 block mt-0.5">Filtrados en consulta</span>
                    </div>
                  </div>

                  {/* Table & Filters controls */}
                  <div className="bg-slate-50/40 p-3 rounded-xl border border-gray-150 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar por Fecha</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={historyDateFilter}
                            onChange={(e) => setHistoryDateFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-alegra-primary text-[11px] font-bold text-gray-700 h-7"
                          />
                          {historyDateFilter && (
                            <button
                              type="button"
                              onClick={() => setHistoryDateFilter('')}
                              className="text-[10px] font-bold text-red-650 hover:underline cursor-pointer"
                              title="Ver todas las fechas"
                            >
                              Ver Todo
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Camarero</span>
                        <select
                          value={historyWaiterFilter}
                          onChange={(e) => setHistoryWaiterFilter(e.target.value)}
                          className="bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-alegra-primary text-[11px] font-bold text-gray-700 cursor-pointer h-7"
                        >
                          <option value="Todos">Todos</option>
                          {waitersList.map(waiter => (
                            <option key={waiter} value={waiter}>{waiter}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative w-full sm:w-52">
                      <Search size={11} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar ID, mesa o plato..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg text-[11px] pl-7 pr-3 py-1.5 outline-none focus:border-alegra-primary text-gray-800 font-medium"
                      />
                    </div>
                  </div>

                  {/* List element of closed orders */}
                  <motion.div
                    key={`${historyDateFilter}-${historyWaiterFilter}-${historySearch}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-xxs"
                  >
                    <div className="overflow-x-auto">
                      {filteredClosedOrders.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-xs space-y-1">
                          <History size={26} className="mx-auto text-gray-300" />
                          <p className="font-bold">No se encontraron comandas cobradas.</p>
                          <p className="text-[10px] text-gray-400">Intenta remover los filtros de camarero o cambiar la fecha de consulta.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-gray-150 text-[9px] text-gray-400 uppercase font-bold tracking-wider">
                              <th className="p-2.5">Mesa / ID</th>
                              <th className="p-2.5">Camarero</th>
                              <th className="p-2.5">Hora/Fecha</th>
                              <th className="p-2.5">Ítems Servidos</th>
                              <th className="p-2.5 text-right">Total Cobrado</th>
                              <th className="p-2.5 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                            {filteredClosedOrders.map((order) => {
                              const summaryItems = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
                              const displayTime = order.createdAt.includes(' ') ? order.createdAt.split(' ')[1] : order.createdAt;
                              const displayDate = order.createdAt.includes(' ') ? order.createdAt.split(' ')[0] : 'Hoy';

                              return (
                                <tr key={order.id} className="hover:bg-slate-50/50">
                                  <td className="p-2.5">
                                    <span className="block font-bold text-gray-950 leading-tight">{order.tableName}</span>
                                    <span className="text-[9px] font-mono text-gray-400">#{order.id.replace('ord-', '')}</span>
                                  </td>
                                  <td className="p-2.5">{order.waiterName || 'Personal'}</td>
                                  <td className="p-2.5">
                                    <span className="block font-bold text-gray-800">{displayTime}</span>
                                    <span className="text-[8px] text-gray-400 font-mono block">{displayDate}</span>
                                  </td>
                                  <td className="p-2.5 text-gray-500 max-w-[130px] sm:max-w-[200px] truncate" title={summaryItems}>
                                    {summaryItems}
                                  </td>
                                  <td className="p-2.5 text-right font-black text-emerald-700 font-mono">
                                    ${order.total.toFixed(2)}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedHistoryOrder(order)}
                                      className="bg-indigo-50 hover:bg-slate-100 border border-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
                                    >
                                      Ver
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* If selected table is active and we are in mapa sub-tab, show the advanced searchable category food selector */}
            {restSubTab === 'mapa' && selectedTable && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                      <UtensilsCrossed size={14} className="text-alegra-primary" />
                      Añadir Alimentos e Ítems a {selectedTable.name}
                    </h3>
                    <p className="text-[10px] text-gray-400">Busca platos de cocina, bebidas del bar o cualquier bien de inventario</p>
                  </div>

                  {/* Search box inside comanda selection */}
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={12} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o SKU..."
                      value={restSearch}
                      onChange={(e) => setRestSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg text-xs pl-8 pr-3 py-1.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-800"
                    />
                  </div>
                </div>

                {/* Categories filter pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 font-display">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setRestCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        restCategory === cat 
                          ? 'bg-alegra-primary text-white font-semibold' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Advanced products catalog layout */}
                {restaurantFilteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No se encontraron productos en la categoría "{restCategory}" que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {restaurantFilteredProducts.map(p => {
                      const isOutOfStock = p.stock <= 0;
                      return (
                        <div
                          key={p.id}
                          className={`bg-slate-50 border border-gray-150 rounded-xl p-3 flex flex-col justify-between transition-all font-sans relative ${
                            isOutOfStock ? 'opacity-55' : 'hover:border-alegra-primary hover:shadow-2xs'
                          }`}
                        >
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">{p.category}</span>
                            <h4 className="text-xs font-bold text-gray-950 mt-1 line-clamp-2 leading-tight" title={p.name}>
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[8px] text-gray-400 font-mono">SKU: {p.sku}</span>
                              <span className={`text-[8px] px-1 font-bold rounded ${p.stock <= p.minStock ? 'bg-red-50 text-red-650' : 'bg-emerald-50 text-emerald-700'}`}>
                                {p.stock} p.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                            <span className="text-xs font-bold text-blue-600 font-mono">${p.price.toFixed(0)}</span>
                            
                            <div className="flex gap-1">
                              {/* Option A: Quick Add +1 */}
                              <button
                                type="button"
                                onClick={() => !isOutOfStock && handleAddDishToTable(p, 1)}
                                disabled={isOutOfStock}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                                title="Agregar rápido (+1)"
                              >
                                +1
                              </button>

                              {/* Option B: Add with detail (Notes and arbitrary quantities) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isOutOfStock) return;
                                  setSelectedProdForDetail(p);
                                  setDetailQtyInput(1);
                                  setDetailNotesInput('');
                                  setShowDetailAddModal(true);
                                }}
                                disabled={isOutOfStock}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] px-1.5 py-1 rounded cursor-pointer disabled:opacity-50"
                                title="Agregar con notas/cantidades"
                              >
                                Detalle
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right section: Selected Table Comanda & Preparation dashboard */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between min-h-[450px]" id="restaurant-sidebar-ticket">
            {restSubTab === 'historial' ? (
              /* WAITER / DAILY SHIFT PERFORMANCE INSIGHTS */
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                    <Scale size={16} className="text-alegra-primary" />
                    <div>
                      <h3 className="text-xs font-bold text-alegra-secondary uppercase tracking-wider font-display">Rendimiento del Turno</h3>
                      <p className="text-[10px] text-gray-400">Resumen y carga de meseros del día</p>
                    </div>
                  </div>

                  {/* Leaderboard Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Desempeño de Camareros</h4>
                    {waiterStats.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No hay comandas cobradas registradas para calcular estadísticas.</p>
                    ) : (
                      <div className="space-y-3.5">
                        {waiterStats.map(({ waiter, totalSales, count }) => {
                          const restaurantTotalSalesCombined = closedOrders.reduce((sum, o) => sum + o.total, 0);
                          const percentage = restaurantTotalSalesCombined > 0 ? (totalSales / restaurantTotalSalesCombined) * 100 : 0;
                          return (
                            <div key={waiter} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                                <span>{waiter} ({count} {count === 1 ? 'pedido' : 'pedidos'})</span>
                                <span className="font-mono font-bold text-gray-900">RD$ {totalSales.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-alegra-primary h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-end text-[9px] text-gray-400 font-mono">
                                {percentage.toFixed(1)}% del share total
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top-Selling Dishes Section */}
                  <div className="space-y-3 mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Coffee size={12} className="text-amber-500" /> Platos más Populares
                    </h4>
                    {topDishes.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No se han vendido platos en comandas cobradas.</p>
                    ) : (
                      <div className="space-y-2">
                        {topDishes.map((dish, idx) => (
                          <div key={dish.name} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-50 last:border-0 text-gray-700 hover:bg-slate-50/50 px-1 rounded block">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-[9px] bg-slate-100 text-gray-500 w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">{idx + 1}</span>
                              <span className="truncate">{dish.name}</span>
                            </div>
                            <span className="font-bold text-gray-900 whitespace-nowrap font-mono">{dish.qty} u.</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-center mt-6 border border-gray-200">
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Este panel compila el desempeño y rendimiento acumulado de las comandas registradas con estado <span className="font-bold text-indigo-700">cobrado</span>.
                  </p>
                </div>
              </div>
            ) : selectedTable ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Table header selection */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-alegra-secondary uppercase tracking-wider font-display">{selectedTable.name}</h3>
                      <p className="text-[10px] text-gray-400">Camarero asignado: Juan C.</p>
                    </div>
                    
                    {/* Status switcher */}
                    <div className="text-right">
                      <select
                        value={selectedTable.status}
                        onChange={(e) => handleSetTableStatus(selectedTable.id, e.target.value as any)}
                        className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-gray-200 outline-none rounded p-1 text-gray-700 cursor-pointer"
                      >
                        <option value="libre">Libre</option>
                        <option value="ocupada">Ocupada</option>
                        <option value="atendiendo">Atendiendo</option>
                        <option value="por_pagar">Por Pagar</option>
                      </select>
                    </div>
                  </div>

                  {/* Active orders */}
                  {activeTableOrder ? (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-indigo-500 animate-spin" />
                          Orden: {activeTableOrder.createdAt.includes(' ') ? activeTableOrder.createdAt.split(' ')[1] : activeTableOrder.createdAt}
                        </span>
                        <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          activeTableOrder.status === 'pendiente' 
                            ? 'bg-amber-100 text-amber-800' 
                            : activeTableOrder.status === 'en_preparacion' 
                            ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white animate-pulse' 
                            : activeTableOrder.status === 'entregada'
                            ? 'bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-250 animate-bounce'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {activeTableOrder.status === 'pendiente' 
                            ? 'Pendiente (Cocina 🍳)' 
                            : activeTableOrder.status === 'en_preparacion' 
                            ? 'Cociendo 🔥' 
                            : activeTableOrder.status === 'entregada'
                            ? 'Listo 🔔'
                            : activeTableOrder.status}
                        </span>
                      </div>

                      {/* Items loop */}
                      <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-gray-50">
                        {activeTableOrder.items.map((item, itemIdx) => (
                          <div key={`${item.productId}-${itemIdx}`} className="flex items-center justify-between gap-2 pt-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <h4 className="font-bold text-gray-850 truncate">{item.name}</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrderItemIndex({
                                      orderId: activeTableOrder.id,
                                      productId: item.productId,
                                      name: item.name,
                                      notes: item.notes || ''
                                    });
                                    setShowItemNotesModal(true);
                                  }}
                                  className="text-gray-400 hover:text-alegra-primary p-0.5 cursor-pointer"
                                  title="Editar nota de cocina"
                                >
                                  <Edit size={10} />
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-400 font-mono">${item.price}</p>
                              {item.notes ? (
                                <p className="text-[9px] text-red-500 italic mt-0.5 bg-red-50/50 px-1.5 py-0.5 rounded border border-red-100 w-fit">
                                  Nota: {item.notes}
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrderItemIndex({
                                      orderId: activeTableOrder.id,
                                      productId: item.productId,
                                      name: item.name,
                                      notes: ''
                                    });
                                    setShowItemNotesModal(true);
                                  }}
                                  className="text-[9px] text-dashed text-gray-400 hover:text-indigo-600 block mt-1 cursor-pointer"
                                >
                                  + Agregar nota preparación
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleUpdateDishQty(activeTableOrder.id, item.productId, -1, itemIdx)}
                                className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-xs font-bold font-mono px-1 w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateDishQty(activeTableOrder.id, item.productId, 1, itemIdx)}
                                className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Calculations total */}
                      <div className="border-t border-dashed border-gray-150 pt-2 space-y-1.5 text-xs text-gray-600 mt-4">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-gray-900">${activeTableOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ITBIS 18% / Ley 10%:</span>
                          <span className="font-semibold text-gray-900">${activeTableOrder.taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-extrabold text-alegra-primary pt-1 border-t border-gray-100 mt-1">
                          <span>Monto Total:</span>
                          <span>${activeTableOrder.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-300 space-y-2">
                       <UtensilsCrossed size={32} className="mx-auto" />
                       <p className="text-xs">No hay comandas activas en esta mesa.<br />Haz clic sobre la comida a la izquierda para iniciar.</p>
                    </div>
                  )}
                </div>

                {/* Fixed controls bar for orders */}
                {activeTableOrder && (
                  <div className="space-y-2 pt-4 border-t border-gray-100 mt-6 text-xs">
                    <button
                      onClick={() => handleAdvanceOrderStatus(activeTableOrder.id)}
                      disabled={activeTableOrder.status === 'entregada'}
                      className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight size={14} />
                      {activeTableOrder.status === 'pendiente' ? 'Enviar a Preparación (Cocina)' : 'Marcar como Plato Entregado'}
                    </button>
                    <button
                      onClick={() => handlePayTableOrder(activeTableOrder.id)}
                      className="w-full bg-emerald-600 font-bold text-white py-2.5 rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      id="pos-restaurant-pay-trigger"
                    >
                      <Printer size={14} />
                      EMITIR FACTURA Y COBRAR
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-12 text-center">Selecciona una mesa del plano general.</p>
            )}
          </div>
        </div>
      )}

      {/*******************************************************
       * RECEIPT PRINTER THERMAL MODAL PREVIEW
       *******************************************************/
      lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="thermal-receipt-modal">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4">
            <div className="border-b-2 border-dashed border-gray-300 pb-3 text-center text-xs text-gray-600">
              <h3 className="font-extrabold text-sm uppercase text-gray-900 tracking-wider font-display">*** RECIBO DE PAGO ***</h3>
              <p className="font-bold text-blue-600 mt-1">ALEGRA CLONE TICKET-POS</p>
              <p className="font-mono mt-0.5">RNC: 101-54321-1</p>
              <p className="font-mono text-[10px]">Cajero: #0012 | Santo Domingo</p>
            </div>

            <div className="text-[11px] font-mono text-gray-700 space-y-1">
              <p><span>TICKET:</span> <span className="font-bold">{lastReceipt.invoiceNumber}</span></p>
              <p><span>FECHA:</span> <span>{lastReceipt.issueDate}</span></p>
              <p><span>CLIENTE:</span> <span className="font-semibold">{lastReceipt.clientName}</span></p>
              <p><span>RNC CLIENTE:</span> <span>{lastReceipt.clientRnc}</span></p>
            </div>

            <table className="w-full text-[10px] font-mono border-t border-b border-dashed border-gray-300 py-2 my-2 text-gray-850">
              <thead>
                <tr className="border-b border-dashed border-gray-200">
                  <th className="text-left font-bold p-1">Item</th>
                  <th className="text-center font-bold p-1">Cant</th>
                  <th className="text-right font-bold p-1">Monto</th>
                </tr>
              </thead>
              <tbody>
                {lastReceipt.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-1 truncate max-w-[120px]">{it.name}</td>
                    <td className="text-center p-1">{it.quantity}</td>
                    <td className="text-right p-1">${(it.quantity * it.unitPrice).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs font-mono text-gray-800 space-y-1 text-right">
              <p><span>SUBTOTAL:</span> <span>${lastReceipt.subtotal.toFixed(2)}</span></p>
              <p><span>ITBIS (18%):</span> <span>${lastReceipt.taxes.toFixed(2)}</span></p>
              <p className="text-sm font-bold border-t border-dashed border-gray-250 pt-1"><span>TOTAL S.D.:</span> <span>${lastReceipt.total.toFixed(2)}</span></p>
            </div>

            <div className="text-center text-[10px] text-gray-400 border-t border-dashed border-gray-200 pt-3">
              <p>¡Gracias por su visita / consumo!</p>
              <p className="font-mono mt-1">Impresora Fiscal N° SF-4930A</p>
            </div>

            <div className="flex gap-2 pt-2 justify-center">
              <button
                onClick={() => setLastReceipt(null)}
                className="bg-alegra-secondary hover:bg-slate-850 text-white text-xs font-semibold py-1.5 px-4 rounded w-full cursor-pointer"
                id="btn-close-receipt"
              >
                Listo (Nueva Venta)
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * RETAIL CHECKOUT SPEED PAYMENT MODAL
       *******************************************************/
      showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="pos-checkout-modal">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display">Registrar Pago e Importar Factura</h3>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total tag inside checkout */}
            <div className="bg-blue-50/60 p-4 border border-blue-100 rounded-xl text-center">
              <p className="text-blue-600 font-bold uppercase text-[9px] tracking-wider">Total a cobrar</p>
              <p className="text-3xl font-extrabold text-alegra-primary tracking-tight mt-0.5">
                ${calculateCartTotals().total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Payment options */}
            <div className="space-y-3">
              <label className="block text-gray-600 font-semibold">Seleccione Canal de Recibo de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Efectivo', icon: DollarSign },
                  { name: 'Tarjeta', icon: CreditCard },
                  { name: 'Transferencia', icon: FileText }
                ].map(pay => (
                  <button
                    key={pay.name}
                    type="button"
                    onClick={() => setCheckoutPayment(pay.name)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3.5 border-2 rounded-xl text-center cursor-pointer transition-all ${
                      checkoutPayment === pay.name 
                        ? 'border-blue-600 bg-blue-50/40 text-blue-700 font-bold shadow-xs' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <pay.icon size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{pay.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If cash, calculate change */}
            {checkoutPayment === 'Efectivo' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-gray-100 rounded-lg">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Monto Recibido</label>
                  <input
                    type="number"
                    min={calculateCartTotals().total}
                    value={checkoutReceived}
                    onChange={(e) => setCheckoutReceived(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 font-bold font-mono rounded px-2 py-1 outline-none text-right font-semibold text-gray-800"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase">Su Cambio</p>
                  <p className="text-sm font-bold font-mono text-emerald-600 text-right mt-1.5 pt-0.5">
                    ${Math.max(0, checkoutReceived - calculateCartTotals().total).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom actions */}
            <div className="flex gap-2 border-t border-gray-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-lg w-1/3 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleFinalizeRetailCheckout}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2.5 rounded-lg flex-1 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                id="pos-retail-pay-confirm"
              >
                <Check size={14} /> Registrar y Emitir Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * CASH CLOSURE / ARQUEO MODAL
       *******************************************************/
      showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="pos-cash-closure-modal">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                <Lock size={15} className="text-red-500 animate-bounce" /> Arqueo y Cierre de Turno de Caja
              </h3>
              <button 
                onClick={() => setShowClosingModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400 hover:text-gray-900"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <p className="text-gray-500 leading-relaxed font-sans">
                Revisa los montos registrados en el sistema de manera automática durante este turno y especifica abajo el efectivo real que tienes físicamente en la caja registradora.
              </p>

              <div className="divide-y divide-gray-100 border border-gray-150 rounded-xl bg-slate-50/50 p-4 space-y-2">
                <div className="flex justify-between text-gray-600 pb-2">
                  <span className="font-medium font-sans">Fondo de Caja del Turno</span>
                  <span className="font-mono font-bold">RD$ {cajaSession.initialBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-655 py-2">
                  <span className="font-medium text-emerald-700 font-bold font-sans">Ventas de Turno (Efectivo)</span>
                  <span className="font-mono font-bold text-emerald-700">+ RD$ {shiftSalesCash.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 py-2">
                  <span className="font-medium font-sans">Ventas de Turno (Tarjeta)</span>
                  <span className="font-mono">RD$ {shiftSalesCard.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 py-2">
                  <span className="font-medium font-sans">Ventas de Turno (Transferencia)</span>
                  <span className="font-mono">RD$ {shiftSalesTransfer.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-800 font-bold border-t border-dashed border-gray-200 pt-2.5 text-sm">
                  <span className="font-sans">Monto Total Esperado de Efectivo:</span>
                  <span className="font-mono text-gray-950">RD$ {shiftExpectedAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-sans">
                Efectivo Real Contado en Caja (Gaveta)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium font-mono">RD$</span>
                <input
                  type="number"
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-12 pr-4 outline-none focus:border-red-500 font-bold text-gray-800 text-sm font-mono"
                  placeholder="0.00"
                />
              </div>

              {/* LIVE DISCREPANCY DETECTOR */}
              <div className={`p-3.5 rounded-lg border-2 flex items-center justify-between font-mono text-xs font-bold leading-none ${
                (actualBalanceInput - shiftExpectedAmount) < 0 
                  ? 'bg-red-50 border-red-100 text-red-700' 
                  : (actualBalanceInput - shiftExpectedAmount) > 0 
                    ? 'bg-blue-50 border-blue-100 text-blue-700' 
                    : 'bg-green-50 border-green-105 text-green-700'
              }`}>
                <span className="font-sans font-bold">Diferencia / Arqueo:</span>
                <span>
                  {(actualBalanceInput - shiftExpectedAmount) === 0 
                    ? '✓ Turno Cuadrado' 
                    : `RD$ ${(actualBalanceInput - shiftExpectedAmount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
                  }
                </span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-4 mt-2 font-sans">
              <button
                type="button"
                onClick={() => setShowClosingModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-lg w-1/3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseCaja(actualBalanceInput);
                  setShowClosingModal(false);
                  alert('¡Turno de caja cerrado con éxito! El arqueo fiscal ha sido guardado e impreso.');
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg flex-1 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                id="btn-confirm-cerrar-caja"
              >
                <Check size={14} /> Registrar e Imprimir Cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * GESTIONAR MESAS MODAL
       *******************************************************/
      showManageTablesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="pos-manage-tables-modal">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-slate-705">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                <Table size={15} className="text-alegra-primary" /> Gestión de Mesas del Salón
              </h3>
              <button 
                onClick={() => setShowManageTablesModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-3.5 rounded-xl border border-gray-100 gap-3">
              <div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Agrega mesas al mapa, edita capacidades o elimina las que estén libres y sin comanda activa.
                </p>
              </div>
              <button
                onClick={() => {
                  setTableFormMode('add');
                  setSelectedTableForEdit(null);
                  setTableNameInput('');
                  setTableCapacityInput(4);
                  setShowTableFormModal(true);
                }}
                className="inline-flex items-center gap-1 bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Nueva Mesa
              </button>
            </div>

            {/* List of existing tables */}
            <div className="overflow-x-auto border border-gray-150 rounded-xl max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold uppercase text-[9px] tracking-wider text-gray-500">
                    <th className="p-3">Nombre / Identificación</th>
                    <th className="p-3 text-center">Capacidad</th>
                    <th className="p-3 text-center">Estado Actual</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {tables.map(t => {
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-gray-900">{t.name}</td>
                        <td className="p-3 text-center text-gray-600 font-mono font-bold">{t.capacity} personas</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            t.status === 'libre' ? 'bg-emerald-50 text-emerald-700' :
                            t.status === 'ocupada' ? 'bg-blue-50 text-blue-700' :
                            t.status === 'atendiendo' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setTableFormMode('edit');
                              setSelectedTableForEdit(t);
                              setTableNameInput(t.name);
                              setTableCapacityInput(t.capacity);
                              setShowTableFormModal(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteTable(t.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowManageTablesModal(false)}
                className="bg-slate-105 hover:bg-slate-200 border border-gray-200 text-gray-600 font-bold px-4 py-2 rounded-lg cursor-pointer animate-fade-in"
              >
                Cerrar Administrador
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * AGREGAR / EDITAR MESA FORM MODAL
       *******************************************************/
      showTableFormModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="pos-table-form-modal">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                {tableFormMode === 'add' ? 'Añadir Nueva Mesa' : 'Modificar Mesa'}
              </h3>
              <button 
                onClick={() => setShowTableFormModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre / Identificador de la mesa *</label>
                <input
                  type="text"
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  placeholder="Ej. Mesa 9 (Terraza)"
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Capacidad Máxima (personas) *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableCapacityInput}
                  onChange={(e) => setTableCapacityInput(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowTableFormModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg w-1/3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={tableFormMode === 'add' ? handleAddNewTable : handleEditTableSubmit}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2 rounded-lg flex-1 cursor-pointer text-center"
              >
                {tableFormMode === 'add' ? 'Crear Mesa' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * ADD WITH DETAIL MODAL (Notes and Custom Quantity)
       *******************************************************/
      showDetailAddModal && selectedProdForDetail && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-750">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                <UtensilsCrossed size={14} className="text-alegra-primary" /> Agregar {selectedProdForDetail.name}
              </h3>
              <button 
                onClick={() => {
                  setShowDetailAddModal(false);
                  setSelectedProdForDetail(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-650 mb-1">Cantidad *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailQtyInput(prev => Math.max(1, prev - 1))}
                    className="p-2 bg-slate-150 rounded-lg hover:bg-slate-205 transition-colors cursor-pointer text-gray-750 font-bold text-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedProdForDetail.stock}
                    value={detailQtyInput}
                    onChange={(e) => setDetailQtyInput(Math.max(1, Number(e.target.value)))}
                    className="flex-1 bg-slate-50 border border-gray-200 rounded-lg p-2 text-center text-sm font-bold text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setDetailQtyInput(prev => Math.min(selectedProdForDetail.stock, prev + 1))}
                    className="p-2 bg-slate-150 rounded-lg hover:bg-slate-205 transition-colors cursor-pointer text-gray-750 font-bold text-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Disponibles en inventario: {selectedProdForDetail.stock} unidades</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-650 mb-1">Notas especiales de preparación (Cocina)</label>
                <textarea
                  value={detailNotesInput}
                  onChange={(e) => setDetailNotesInput(e.target.value)}
                  placeholder="Ej. Sin cebolla, término medio, agua sin hielo, etc..."
                  rows={2}
                  className="w-full bg-slate-50 border border-gray-250 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-805"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowDetailAddModal(false);
                  setSelectedProdForDetail(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg w-1/3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAddDishToTable(selectedProdForDetail, detailQtyInput, detailNotesInput.trim() || undefined);
                  setShowDetailAddModal(false);
                  setSelectedProdForDetail(null);
                }}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2.5 rounded-lg flex-1 cursor-pointer text-center"
              >
                Agregar a Comanda
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * DETALLE DE COMANDA HISTORICA COBRADA MODAL
       *******************************************************/
      selectedHistoryOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans" id="pos-history-order-detail-modal">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-750">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Comanda Cobrada</span>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase font-display mt-1">
                  Mesa: {selectedHistoryOrder.tableName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedHistoryOrder(null)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400 Transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-gray-150">
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">ID Comanda / Ticket</span>
                <span className="font-mono font-bold text-gray-800">#{selectedHistoryOrder.id.replace('ord-', '')}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Camarero Atendió</span>
                <span className="font-bold text-gray-800">{selectedHistoryOrder.waiterName || 'Personal'}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Fecha del Servicio</span>
                <span className="font-bold text-gray-800">
                  {selectedHistoryOrder.createdAt.includes(' ') ? selectedHistoryOrder.createdAt.split(' ')[0] : 'Hoy'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Hora de Cierre</span>
                <span className="font-bold text-gray-800">
                  {selectedHistoryOrder.createdAt.includes(' ') ? selectedHistoryOrder.createdAt.split(' ')[1] : selectedHistoryOrder.createdAt}
                </span>
              </div>
            </div>

            {/* Product list */}
            <div className="space-y-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Consumo Detallado</span>
              
              <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100 border border-gray-100 rounded-lg p-2.5 bg-slate-50/50">
                {selectedHistoryOrder.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-[11px] pt-1.5 first:pt-0">
                    <div className="pr-2">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      {item.notes && (
                        <p className="text-[9px] text-red-500 italic mt-0.5 bg-red-50/30 px-1 rounded">
                          * Nota: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right font-mono text-[10px] whitespace-nowrap">
                      <span className="text-gray-400">{item.quantity} x </span>
                      <span className="font-bold text-gray-800">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summaries */}
            <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5 text-xs text-gray-650">
              <div className="flex justify-between">
                <span>Subtotal Neto:</span>
                <span className="font-mono font-semibold text-gray-900">${selectedHistoryOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos Aplicados (ITBIS 18% + Ley 10%):</span>
                <span className="font-mono font-semibold text-gray-900">${selectedHistoryOrder.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-emerald-700 pt-2 border-t border-gray-150">
                <span>Monto Facturado:</span>
                <span className="font-mono">RD$ {selectedHistoryOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-105 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setSelectedHistoryOrder(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg flex-1 cursor-pointer transition-colors text-center"
              >
                Cerrar Detalle
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedHistoryOrder(null);
                  alert('Comanda procesada para reimpresión fiscal en ticketera.');
                }}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex-1 cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Printer size={13} /> Reimprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * KITCHEN PREPARATION NOTES EDITOR MODAL
       *******************************************************/
      showItemNotesModal && editingOrderItemIndex && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                <Edit size={14} className="text-alegra-primary" /> Modificar Notas: {editingOrderItemIndex.name}
              </h3>
              <button 
                onClick={() => {
                  setShowItemNotesModal(false);
                  setEditingOrderItemIndex(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-650 mb-1">Requisitos de Cocina / Comentario</label>
              <textarea
                value={editingOrderItemIndex.notes}
                onChange={(e) => setEditingOrderItemIndex({ ...editingOrderItemIndex, notes: e.target.value })}
                placeholder="Ej. Término bien cocido, sin salsa, etc..."
                rows={3}
                className="w-full bg-slate-50 border border-gray-250 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-805"
              />
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowItemNotesModal(false);
                  setEditingOrderItemIndex(null);
                }}
                className="bg-slate-105 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg w-1/3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  // Find and update notes
                  const order = orders.find(o => o.id === editingOrderItemIndex.orderId);
                  if (order) {
                    const itemIdx = order.items.findIndex(i => i.productId === editingOrderItemIndex.productId);
                    if (itemIdx > -1) {
                      handleModifyItemNotesInOrder(editingOrderItemIndex.orderId, editingOrderItemIndex.productId, itemIdx, editingOrderItemIndex.notes);
                    }
                  }
                  setShowItemNotesModal(false);
                  setEditingOrderItemIndex(null);
                }}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2.5 rounded-lg flex-1 cursor-pointer text-center"
              >
                Guardar Notas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

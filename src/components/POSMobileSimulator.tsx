/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  Check, 
  Wifi, 
  Battery, 
  Signal, 
  Copy, 
  Code, 
  CheckCircle, 
  Package, 
  Info,
  QrCode,
  Printer,
  ArrowLeft,
  Utensils,
  Clock,
  ArrowLeftRight,
  User,
  DollarSign,
  Menu,
  X,
  LogOut,
  Bell,
  RotateCcw,
  Sparkles,
  ChefHat,
  Receipt,
  HeartHandshake
} from 'lucide-react';
import { Product, RestaurantTable, RestaurantOrder, RestaurantOrderItem, JournalEntry } from '../types';

interface POSMobileSimulatorProps {
  products: Product[];
  tables: RestaurantTable[];
  orders: RestaurantOrder[];
  onUpdateOrders: (updatedOrders: RestaurantOrder[]) => void;
  onUpdateTables: (updatedTables: RestaurantTable[]) => void;
  onAddJournalEntry: (entry: JournalEntry) => void;
}

const WAITERS = [
  { id: 'w-1', name: 'Andrés Reynoso', status: 'Activo', pin: '1111' },
  { id: 'w-2', name: 'Clarissa Mateo', status: 'Activo', pin: '2222' },
  { id: 'w-3', name: 'Dahiana Santana', status: 'Activo', pin: '3333' }
];

export default function POSMobileSimulator({ 
  products, 
  tables, 
  orders, 
  onUpdateOrders, 
  onUpdateTables, 
  onAddJournalEntry 
}: POSMobileSimulatorProps) {
  // Simulator Login States
  const [currentWaiter, setCurrentWaiter] = useState<typeof WAITERS[0] | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // App General Navigation
  // 'login' | 'tables' | 'menu' | 'cart' | 'checkout' | 'success'
  const [activeScreen, setActiveScreen] = useState<'login' | 'tables' | 'menu' | 'cart' | 'checkout' | 'success'>('login');
  
  // Tab within primary tables screen ('tables' or 'quick')
  const [waiterHomeTab, setWaiterHomeTab] = useState<'tables' | 'quick'>('tables');

  // Waiter notification live states
  interface WaiterNotification {
    id: string;
    timestamp: string;
    message: string;
    type: 'kit_ready' | 'call_waiter' | 'ask_bill';
    read: boolean;
    tableId?: string;
    tableName?: string;
  }
  const [waiterNotifications, setWaiterNotifications] = useState<WaiterNotification[]>([]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Table Selected
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  
  // Shopping Cart within active waiter order
  const [mobileCart, setMobileCart] = useState<{ product: Product; qty: number; notes: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Checkout inputs
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [lastProcessedOrderId, setLastProcessedOrderId] = useState<string>('');

  // Customer Portal Live Tracking States (Simulated client phone on the right)
  const [trackingOrder, setTrackingOrder] = useState<RestaurantOrder | null>(null);
  const [waiterCallLogged, setWaiterCallLogged] = useState<string[]>([]);
  const [customNotifications, setCustomNotifications] = useState<string[]>(['Sincronización bidireccional lista para comandas.']);

  // Copy react native template helper
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-login/preselect waiter for ease of testing
  useEffect(() => {
    if (!currentWaiter && WAITERS.length > 0) {
      setCurrentWaiter(WAITERS[0]);
      setActiveScreen('tables');
    }
  }, []);

  // Sync client portal if the orders database updates from outside
  useEffect(() => {
    if (trackingOrder) {
      const freshOrder = orders.find(o => o.id === trackingOrder.id);
      if (freshOrder) {
        setTrackingOrder(freshOrder);
      }
    }
  }, [orders]);

  // Active tracker for Kitchen readiness notifications (KDS integration)
  const [notifiedReadyOrderIds, setNotifiedReadyOrderIds] = useState<string[]>([]);
  
  useEffect(() => {
    // Find any delivered order that has not been already notified as kitchen ready (kit_ready)
    const recentlyReadyOrders = orders.filter(o => o.status === 'entregada' && !notifiedReadyOrderIds.includes(o.id));
    
    if (recentlyReadyOrders.length > 0) {
      const newNotifs: WaiterNotification[] = recentlyReadyOrders.map(order => ({
        id: `kit-${order.id}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: `Cocina: ¡Comanda de la ${order.tableName} lista para servir! 🍳🛎️`,
        type: 'kit_ready',
        read: false,
        tableId: order.tableId,
        tableName: order.tableName
      }));

      setWaiterNotifications(prev => [...newNotifs, ...prev]);
      setNotifiedReadyOrderIds(prev => [...prev, ...recentlyReadyOrders.map(o => o.id)]);
      
      // Flash Toast banner in Mobile device
      AlertSimulator(`🛎️ ¡Plato Listo!: Comanda de ${recentlyReadyOrders[0].tableName} completada por cocina.`);
    }
  }, [orders, notifiedReadyOrderIds]);

  // Handle table selector click
  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
    
    // Check if table already has an active pending/preparing/delivered order in system
    const activeOrderForTable = orders.find(o => o.tableId === table.id && o.status !== 'cobrada');
    
    if (activeOrderForTable) {
      // Reconstitute the shopping cart from the active saved order items
      const reconstructedCart = activeOrderForTable.items.map(item => {
        const matchingProduct = products.find(p => p.name === item.name) || {
          id: item.productId,
          name: item.name,
          price: item.price,
          category: 'Platos',
          sku: 'REST',
          cost: 0,
          stock: 99,
          minStock: 1,
          warehouseId: '1',
          taxRate: 0.18
        } as Product;
        return {
          product: matchingProduct,
          qty: item.quantity,
          notes: item.notes || ''
        };
      });
      setMobileCart(reconstructedCart);
    } else {
      // Clear the cart for new service
      setMobileCart([]);
    }
    setActiveScreen('menu');
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const existingIndex = mobileCart.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...mobileCart];
      updated[existingIndex].qty += 1;
      setMobileCart(updated);
    } else {
      setMobileCart([...mobileCart, { product, qty: 1, notes: '' }]);
    }
    addNotification(`Añadido: ${product.name}`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    const updated = mobileCart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.qty + delta;
        return { ...item, qty: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    setMobileCart(updated);
  };

  const removeFromCart = (productId: string) => {
    setMobileCart(mobileCart.filter(item => item.product.id !== productId));
  };

  const updateNotes = (productId: string, notes: string) => {
    setMobileCart(mobileCart.map(item => 
      item.product.id === productId ? { ...item, notes } : item
    ));
  };

  // Helper calculation
  const subtotal = mobileCart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const tax = subtotal * 0.18; // 18% ITBIS
  const total = subtotal + tax;

  const addNotification = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCustomNotifications(prev => [`[${time}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // Enviar a Cocina (Sends or Updates Table order in real-time)
  const handleSendToKitchen = () => {
    if (!selectedTable || mobileCart.length === 0) return;

    // Check if there is an existing open order in system
    const existingOrder = orders.find(o => o.tableId === selectedTable.id && o.status !== 'cobrada');
    
    // Map mobileCart state to RestaurantOrderItem structure
    const orderItems: RestaurantOrderItem[] = mobileCart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.qty,
      price: item.product.price,
      notes: item.notes || undefined
    }));

    let updatedOrdersList = [...orders];
    let workingOrder: RestaurantOrder;

    if (existingOrder) {
      // Update existing order
      workingOrder = {
        ...existingOrder,
        items: orderItems,
        subtotal,
        taxes: tax,
        total,
        waiterName: currentWaiter?.name || 'Personal Móvil'
      };
      updatedOrdersList = orders.map(o => o.id === existingOrder.id ? workingOrder : o);
      addNotification(`Comanda #${workingOrder.id.replace('ord-', '')} sincronizada y reforzada en Cocina.`);
    } else {
      // Create fresh new comanda
      const newOrderId = `ord-${Date.now().toString().slice(-6)}`;
      workingOrder = {
        id: newOrderId,
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        items: orderItems,
        status: 'pendiente',
        subtotal,
        taxes: tax,
        total,
        waiterName: currentWaiter?.name || 'Personal Móvil',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updatedOrdersList = [workingOrder, ...orders];
      addNotification(`Nueva Comanda #${newOrderId.replace('ord-', '')} transmitida por camarero.`);
    }

    // Mark current table status as active
    const updatedTablesList = tables.map(t => 
      t.id === selectedTable.id 
        ? { ...t, status: 'ocupada' as const, currentOrderId: workingOrder.id } 
        : t
    );

    onUpdateOrders(updatedOrdersList);
    onUpdateTables(updatedTablesList);
    setTrackingOrder(workingOrder); // Sync live customer tracker viewport
    
    AlertSimulator(`📡 Real-Time Sync: Comanda enviada a Cocina principal y Panel Admin.`);
    setActiveScreen('tables');
  };

  // Trigger simulated popup or info
  const AlertSimulator = (text: string) => {
    const alertBanner = document.getElementById('simulator-toast');
    if (alertBanner) {
      alertBanner.innerText = text;
      alertBanner.classList.remove('opacity-0', 'pointer-events-none');
      alertBanner.classList.add('opacity-100');
      setTimeout(() => {
        alertBanner.classList.remove('opacity-100');
        alertBanner.classList.add('opacity-0', 'pointer-events-none');
      }, 3500);
    }
  };

  // Prepare and open Cash Checkout
  const handleProceedToCheckout = () => {
    setCashReceived(Math.ceil(total / 100) * 100); // Pre-fill with rounded cash
    setActiveScreen('checkout');
  };

  // Complete Order Checkout & Generate Accounting entry
  const handleProcessCheckout = () => {
    if (!selectedTable) return;

    const activeOrderForTable = orders.find(o => o.tableId === selectedTable.id && o.status !== 'cobrada');
    if (!activeOrderForTable) return;

    // 1. Mark order status as cobrada
    const updatedOrder: RestaurantOrder = {
      ...activeOrderForTable,
      status: 'cobrada'
    };
    const updatedOrdersList = orders.map(o => o.id === activeOrderForTable.id ? updatedOrder : o);

    // 2. Free up the table
    const updatedTablesList = tables.map(t => 
      t.id === selectedTable.id 
        ? { ...t, status: 'libre' as const, currentOrderId: undefined } 
        : t
    );

    // 3. Post Automatic Accounting Entry to match Alegra ERP standards
    // Debit active cash or banks, credit Restaurant Sales matching accounts
    const accountCodeToDebit = paymentMethod === 'efectivo' ? '1101' : '1103'; // General cash (1101) or Banco Popular (1103)
    const journalLines = [
      {
        accountCode: accountCodeToDebit,
        debit: Number(total),
        credit: 0
      },
      {
        accountCode: '4102', // Restaurant revenue POS channel
        debit: 0,
        credit: Number(subtotal)
      },
      {
        accountCode: '2105', // ITBIS por Pagar (18%)
        debit: 0,
        credit: Number(tax)
      }
    ];

    const doubleEntry: JournalEntry = {
      id: `as-pos-mob-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Facturación POS Móvil - Mesa ${selectedTable.name} (Tkt: #${activeOrderForTable.id.replace('ord-', '')})`,
      reference: 'POS-MOB',
      lines: journalLines
    };

    onUpdateOrders(updatedOrdersList);
    onUpdateTables(updatedTablesList);
    onAddJournalEntry(doubleEntry);

    // Clear and state route to success
    setLastProcessedOrderId(activeOrderForTable.id);
    setTrackingOrder(updatedOrder); // Update tracking portal to closed/paid
    
    addNotification(`Pago cobrado y asiento contable de RD$ ${total.toFixed(2)} registrado en Diario.`);
    setActiveScreen('success');
  };

  // Customer Assisted actions
  const handleCustomerCallStaff = (assistanceType: string) => {
    if (!trackingOrder) return;
    const alertLine = `${trackingOrder.tableName} solicita: ${assistanceType}`;
    setWaiterCallLogged(prev => [alertLine, ...prev]);
    AlertSimulator(`🔔 Alerta Camarero: ${alertLine}`);
    addNotification(`Alerta recibida: ${alertLine}`);

    // Create custom notification entry inside the waiter mobile notification bar
    const isBillRequest = assistanceType === 'Pedir la Cuenta';
    const notifType = isBillRequest ? 'ask_bill' : 'call_waiter';
    const msg = isBillRequest 
      ? `💵 Cuenta solicitada: ${trackingOrder.tableName} pide la pre-factura o cuenta total.` 
      : `🙋‍♂️ Camarero solicitado: ${trackingOrder.tableName} necesita asistencia en el salón.`;

    const newNotif: WaiterNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: msg,
      type: notifType,
      read: false,
      tableId: trackingOrder.tableId,
      tableName: trackingOrder.tableName
    };
    setWaiterNotifications(prev => [newNotif, ...prev]);
  };

  // Trigger Kitchen Status advance (Allows testing state propagation live!)
  const handleSimulateKitchenStep = (nextStatus: 'pendiente' | 'en_preparacion' | 'entregada') => {
    if (!trackingOrder) return;

    const targetOrder = orders.find(o => o.id === trackingOrder.id);
    if (!targetOrder) return;

    const modifiedOrder: RestaurantOrder = {
      ...targetOrder,
      status: nextStatus
    };

    const updatedOrdersList = orders.map(o => o.id === targetOrder.id ? modifiedOrder : o);
    onUpdateOrders(updatedOrdersList);
    setTrackingOrder(modifiedOrder);
    
    // Auto sync table status
    let newTableStatus: 'ocupada' | 'atendiendo' | 'por_pagar' = 'ocupada';
    if (nextStatus === 'en_preparacion') newTableStatus = 'atendiendo';
    if (nextStatus === 'entregada') newTableStatus = 'atendiendo';

    const updatedTablesList = tables.map(t => 
      t.id === targetOrder.tableId 
        ? { ...t, status: newTableStatus } 
        : t
    );
    onUpdateTables(updatedTablesList);

    addNotification(`Cocina avanzó pedido #${targetOrder.id.replace('ord-', '')} a [${nextStatus.toUpperCase()}].`);
    AlertSimulator(`👩‍🍳 Estado cambiado a: ${nextStatus.toUpperCase()}`);

    if (nextStatus === 'entregada') {
      const newNotif: WaiterNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: `🍳 ¡Comida Lista! La comanda #${targetOrder.id.replace('ord-', '')} (${targetOrder.tableName}) ha sido terminada en Cocina.`,
        type: 'kit_ready',
        read: false,
        tableId: targetOrder.tableId,
        tableName: targetOrder.tableName
      };
      setWaiterNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Reset cart and go back
  const handleExitService = () => {
    setMobileCart([]);
    setSelectedTable(null);
    setActiveScreen('tables');
  };

  const handleWaiterLogout = () => {
    setCurrentWaiter(null);
    setPinInput('');
    setLoginError('');
    setActiveScreen('login');
  };

  // Filter products list
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  // Helper links
  const customerLink = trackingOrder ? `${window.location.origin}/pedido/${trackingOrder.id}` : '#';
  const qrCodeUrl = trackingOrder 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(customerLink)}`
    : '';

  const handleCopyToClipboard = () => {
    const reactNativeCodeString = `// React Native Expo NativeWind Client Code
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function AlegraPOSMobileClient() {
  const [syncedOrders, setSyncedOrders] = useState([]);

  useEffect(() => {
    // Sincronización en tiempo real usando REST/Supabase Realtime
    console.log("Conectado en tiempo real al ERP Alegra República Dominicana");
  }, []);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#0f172a' }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Alegra POS Móvil Camarero</Text>
    </View>
  );
}`;
    navigator.clipboard.writeText(reactNativeCodeString);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6 select-none" id="pos-mobile-central-dashboard">
      
      {/* Real-time floating Notification Toast banner */}
      <div 
        id="simulator-toast" 
        className="fixed top-24 left-1/2 -translate-x-1/2 px-4 py-3 bg-slate-900 border border-slate-755 text-emerald-400 font-bold text-xs rounded-xl shadow-2xl z-50 flex items-center gap-2 transform transition-all duration-300 opacity-0 pointer-events-none"
      >
        📡 Sincronizado en tiempo real...
      </div>

      {/* Breadcrumb / Top Info */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between pb-4 border-b border-gray-150 gap-4">
        <div>
          <span className="text-[10px] bg-indigo-50 text-indigo-750 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Módulo Multi-Dispositivo
          </span>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase font-display mt-2 flex items-center gap-2">
            <Smartphone className="text-indigo-600 animate-pulse" />
            Alegra POS Restaurante Móvil
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Plataforma híbrida para camareros con sincronización de cocina en tiempo real ERP y Portal QR Autogestionado para el cliente.
          </p>
        </div>

        {/* Real-time system monitoring badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            SERVIDORES APPS ONLINE
          </div>
          <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1.5">
            <Clock size={12} className="text-amber-500" />
            UTC: 2026-05-30
          </div>
        </div>
      </div>

      {/* Main Layout containing both virtual cellphones side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CELLPHONE 1: THE WAITER/CAMARERO POS APP */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full text-center mb-2.5">
            <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-md">
              📱 Terminal del Camarero
            </span>
          </div>

          {/* Physical Device Frame */}
          <div className="relative w-full max-w-[342px] h-[610px] bg-slate-900 rounded-[40px] shadow-2xl p-2.5 border-4 border-slate-750 flex flex-col overflow-hidden">
            
            {/* Cellphone header notch, battery and clock */}
            <div className="h-5 bg-slate-900 flex justify-between items-center px-6 z-40 text-white text-[9px] select-none text-slate-400 font-mono">
              <span>15:15</span>
              <div className="w-16 h-3.5 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 z-50"></div>
              <div className="flex items-center gap-1 opacity-70">
                <Signal size={9} />
                <Wifi size={9} />
                <Battery size={10} />
              </div>
            </div>

            {/* Inner viewport container */}
            <div className="flex-1 bg-slate-950 rounded-[30px] overflow-hidden flex flex-col relative text-white text-xs">
              
              {/* Internal Waiter app top Navbar */}
              {currentWaiter && (
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-650 p-3 pt-4 pb-2.5 flex justify-between items-center shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 bg-white/20 rounded-full flex items-center justify-center font-bold text-[10px] font-display uppercase">
                      {currentWaiter.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-white block uppercase max-w-[120px] truncate">{currentWaiter.name}</span>
                      <span className="text-[8px] text-indigo-200 block -mt-0.5 font-bold">Camarero Autorizado</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Real-time notification Bell Button */}
                    <button 
                      onClick={() => setShowNotificationsDrawer(true)}
                      className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 relative cursor-pointer"
                      title="Alertas & Notificaciones"
                    >
                      <Bell size={13} />
                      {waiterNotifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-950 animate-bounce">
                          {waiterNotifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>

                    {mobileCart.length > 0 && activeScreen === 'menu' && (
                      <button 
                        onClick={() => setActiveScreen('cart')}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 relative"
                      >
                        <ShoppingCart size={13} />
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-950">
                          {mobileCart.reduce((sum, i) => sum + i.qty, 0)}
                        </span>
                      </button>
                    )}
                    <button 
                      onClick={handleWaiterLogout}
                      className="p-1.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 font-bold text-[8px]"
                      title="Cerrar Sesión Móvil"
                    >
                      <LogOut size={11} />
                    </button>
                  </div>
                </div>
              )}

              {/* SIMULATOR VIEWS CONTROLLER */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <AnimatePresence mode="wait">
                  
                  {/* 1. LOGIN SCREEN */}
                  {activeScreen === 'login' && (
                    <motion.div 
                      key="login"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 p-5 flex flex-col justify-between"
                    >
                      <div className="text-center pt-8 space-y-3">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
                          <Smartphone size={28} className="text-white animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-white font-display">Alegra POS Móvil</h4>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Terminal de República Dominicana</p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                        <div>
                          <label className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">Seleccionar Empleado</label>
                          <div className="space-y-1.5">
                            {WAITERS.map(w => (
                              <button
                                key={w.id}
                                onClick={() => {
                                  setCurrentWaiter(w);
                                  setActiveScreen('tables');
                                  addNotification(`Sesión iniciada por camarero: ${w.name}`);
                                }}
                                className="w-full bg-slate-950 hover:bg-indigo-950 text-left px-3 py-2.5 rounded-xl border border-slate-800 hover:border-indigo-700 flex justify-between items-center transition-all cursor-pointer text-[11px]"
                              >
                                <span className="font-bold">{w.name}</span>
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold">ENTRAR PIN 1111</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-[8px] text-gray-600">
                        Compatible con Impresión Fiscal & Sincronización LocalStorage
                      </div>
                    </motion.div>
                  )}

                  {/* 2. TABLE SELECTOR SCREEN */}
                  {activeScreen === 'tables' && (
                    <motion.div 
                      key="tables"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto text-xs"
                    >
                      <div className="space-y-3">
                        {/* Selector Tabs: Salón vs POS Rápido */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl">
                          <button
                            onClick={() => setWaiterHomeTab('tables')}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer ${
                              waiterHomeTab === 'tables' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            🏛 Salón (Mesas)
                          </button>
                          <button
                            onClick={() => setWaiterHomeTab('quick')}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer ${
                              waiterHomeTab === 'quick' 
                                ? 'bg-indigo-650 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            ⚡ POS Rápido
                          </button>
                        </div>

                        {waiterHomeTab === 'tables' ? (
                          <>
                            <div className="flex justify-between items-center pl-1">
                              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Control de Mesas ({tables.length})</span>
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Cocina Activa</span>
                            </div>

                            {/* Interactive Table Grid inside Phone Viewport */}
                            <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                              {tables.map(table => {
                                // Find if this table has an active order
                                const tableActiveOrder = orders.find(o => o.tableId === table.id && o.status !== 'cobrada');
                                
                                // Style bases
                                let statusColor = "border-slate-800 bg-slate-900";
                                let badgeLabel = "LIBRE";
                                let badgeStyle = "bg-slate-800 text-slate-400";
                                
                                if (tableActiveOrder) {
                                  if (tableActiveOrder.status === 'pendiente') {
                                    statusColor = "border-indigo-600 bg-indigo-950/20";
                                    badgeLabel = "RECIBIDO";
                                    badgeStyle = "bg-indigo-500/20 text-indigo-400";
                                  } else if (tableActiveOrder.status === 'en_preparacion') {
                                    statusColor = "border-amber-600 bg-amber-950/20";
                                    badgeLabel = "COCIENDO";
                                    badgeStyle = "bg-amber-500/20 text-amber-400";
                                  } else if (tableActiveOrder.status === 'entregada') {
                                    statusColor = "border-emerald-600 bg-emerald-950/20";
                                    badgeLabel = "SERVIDO";
                                    badgeStyle = "bg-emerald-500/20 text-emerald-400 font-extrabold";
                                  }
                                }

                                return (
                                  <button
                                    key={table.id}
                                    onClick={() => handleSelectTable(table)}
                                    className={`text-left p-3 rounded-2xl border ${statusColor} hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex flex-col justify-between h-20 shadow-sm`}
                                  >
                                    <div>
                                      <span className="font-extrabold text-[12px] text-white block uppercase tracking-tight">{table.name}</span>
                                      <span className="text-[8px] text-gray-400 font-semibold block mt-0.5">Cap: {table.capacity} personas</span>
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                      <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded ${badgeStyle} uppercase`}>
                                        {badgeLabel}
                                      </span>
                                      {tableActiveOrder && (
                                        <span className="font-mono text-[9px] font-extrabold text-indigo-400">
                                          ${tableActiveOrder.total.toFixed(0)}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center pl-1">
                              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Orden Directa / Para llevar</span>
                              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">Alegra Factura</span>
                            </div>

                            {/* New Counter Sale Button */}
                            <button
                              onClick={() => {
                                const uniqueId = `pos-quick-${Date.now().toString().slice(-4)}`;
                                const quickTableObj: RestaurantTable = {
                                  id: uniqueId,
                                  name: `Mostrador #${Date.now().toString().slice(-3)}`,
                                  status: 'ocupada' as const,
                                  capacity: 1
                                };
                                setSelectedTable(quickTableObj);
                                setMobileCart([]);
                                setActiveScreen('menu');
                                addNotification(`Nueva Venta Rápida Iniciada: ${quickTableObj.name}`);
                              }}
                              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl uppercase flex items-center justify-center gap-1.5 text-[10px] transition-all cursor-pointer shadow-md mb-2 animate-fade-in"
                            >
                              <Plus size={12} /> Nueva Orden Rápida
                            </button>

                            {/* Active non-table orders list */}
                            <div className="space-y-1.5 flex flex-col max-h-[300px] overflow-y-auto pr-1">
                              <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Boletas de Mostrador Activas</span>
                              {orders.filter(o => o.tableId.startsWith('pos-quick-') && o.status !== 'cobrada').length === 0 ? (
                                <div className="text-center py-10 bg-slate-900/40 border border-slate-900 border-dashed rounded-xl text-gray-500 text-[10px] animate-fade-in">
                                  No hay órdenes de mostrador pendientes.
                                </div>
                              ) : (
                                orders.filter(o => o.tableId.startsWith('pos-quick-') && o.status !== 'cobrada').map(order => (
                                  <div 
                                    key={order.id}
                                    className="p-2.5 bg-slate-900 hover:bg-slate-850/85 border border-slate-850 rounded-xl flex items-center justify-between gap-1.5 animate-fade-in"
                                  >
                                    <div className="truncate pr-1">
                                      <span className="text-[11px] text-white font-black block truncate">{order.tableName}</span>
                                      <span className="text-[8px] text-gray-400 block -mt-0.5">{order.items.reduce((s, i) => s + i.quantity, 0)} items • RD$ {order.total.toFixed(0)}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                                        order.status === 'pendiente' ? 'bg-indigo-500/10 text-indigo-400' :
                                        order.status === 'en_preparacion' ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-emerald-500/10 text-emerald-400 font-bold'
                                      }`}>
                                        {order.status === 'pendiente' ? 'PEND' :
                                         order.status === 'en_preparacion' ? 'PREP' : 'LISTO'}
                                      </span>
                                      
                                      <button
                                        onClick={() => {
                                          setSelectedTable({
                                            id: order.tableId,
                                            name: order.tableName,
                                            status: 'ocupada',
                                            capacity: 1
                                          });
                                          // Reconstruct items from active order
                                          const reconstructedCart = order.items.map(item => {
                                            const matchingProduct = products.find(p => p.name === item.name) || {
                                              id: item.productId,
                                              name: item.name,
                                              price: item.price,
                                              category: 'Platos',
                                              sku: 'REST',
                                              cost: 0,
                                              stock: 99,
                                              minStock: 1,
                                              warehouseId: '1',
                                              taxRate: 0.18
                                            } as Product;
                                            return {
                                              product: matchingProduct,
                                              qty: item.quantity,
                                              notes: item.notes || ''
                                            };
                                          });
                                          setMobileCart(reconstructedCart);
                                          setActiveScreen('menu');
                                        }}
                                        className="bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold text-[8px] px-2 py-1 uppercase cursor-pointer"
                                      >
                                        Abrir
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="bg-slate-900 border border-slate-850 p-2 text-[10px] rounded-xl flex items-center gap-2 mt-4 text-gray-400 border-dashed">
                        <Utensils size={13} className="text-indigo-400 shrink-0" />
                        <span>
                          {waiterHomeTab === 'tables' 
                            ? "Seleccione cualquier mesa para abrir comanda o cobrar factura." 
                            : "Gestione las comandas rápidas para comensales en mostrador."}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* 3. MENU / CATALOG SCREEN */}
                  {activeScreen === 'menu' && (
                    <motion.div 
                      key="menu"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Sub-menu nav header */}
                      <div className="p-3 bg-slate-900 border-b border-slate-850 flex items-center justify-between gap-2 shrink-0">
                        <button 
                          onClick={handleExitService}
                          className="flex items-center gap-1 text-[10px] text-indigo-300 font-extrabold cursor-pointer"
                        >
                          <ArrowLeft size={12} /> VOLVER
                        </button>
                        <span className="text-[10px] font-black text-white uppercase font-display bg-indigo-500/10 px-2 py-0.5 rounded leading-none">
                          {selectedTable?.name}
                        </span>
                      </div>

                      {/* Sticky Search bar on phone */}
                      <div className="p-2.5 bg-slate-950 border-b border-slate-900 space-y-1.5 shrink-0">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar bebida o plato..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 w-full text-[10px] outline-none text-white focus:border-indigo-600 font-sans"
                          />
                          <Search size={11} className="absolute left-3 top-2.5 text-gray-500" />
                        </div>

                        {/* Category selection bar */}
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`text-[9px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap cursor-pointer transition-all ${
                                selectedCategory === cat 
                                  ? 'bg-indigo-650 text-white' 
                                  : 'bg-slate-900 text-gray-400 hover:text-white'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive dynamic item catalog List */}
                      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-10 text-gray-500 text-[10px]">
                            No hay productos en esta selección.
                          </div>
                        ) : (
                          filteredProducts.map(p => {
                            const countInCart = mobileCart.find(item => item.product.id === p.id)?.qty || 0;
                            return (
                              <div 
                                key={p.id}
                                className="bg-slate-900/40 hover:bg-slate-900 p-2 rounded-xl border border-slate-850 flex justify-between items-center gap-1"
                              >
                                <div className="truncate flex-1 pr-1">
                                  <span className="font-extrabold text-[10.5px] text-white block truncate leading-tight">{p.name}</span>
                                  <span className="text-[9px] font-mono text-indigo-400 font-bold block mt-0.5">RD$ {p.price.toFixed(0)}</span>
                                </div>
                                
                                {countInCart > 0 ? (
                                  <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/55 rounded-lg px-1.5 py-0.5 shrink-0">
                                    <button 
                                      onClick={() => updateCartQty(p.id, -1)}
                                      className="p-1 text-indigo-400 hover:text-white cursor-pointer"
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span className="font-black text-white text-[10px] font-mono">{countInCart}</span>
                                    <button 
                                      onClick={() => updateCartQty(p.id, 1)}
                                      className="p-1 text-indigo-400 hover:text-white cursor-pointer"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(p)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-6.5 px-2.5 flex items-center justify-center font-bold text-[9px] cursor-pointer transition-all"
                                  >
                                    + AÑADIR
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Cart floating checkout drawer */}
                      {mobileCart.length > 0 && (
                        <div className="bg-slate-900/95 border-t border-indigo-700/40 p-3 flex items-center justify-between shrink-0">
                          <div>
                            <span className="text-[8px] text-gray-400 block font-bold uppercase tracking-widest">Total comanda</span>
                            <span className="font-mono text-xs font-black text-indigo-400">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => setActiveScreen('cart')}
                              className="bg-slate-800 hover:bg-slate-750 text-white text-[9px] font-black px-2.5 py-2 rounded-lg cursor-pointer transition-all uppercase"
                            >
                              Ver {mobileCart.reduce((sum, i) => sum + i.qty, 0)} items
                            </button>
                            <button 
                              onClick={handleSendToKitchen}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-3.5 py-2 rounded-lg cursor-pointer transition-all uppercase flex items-center gap-1.5"
                            >
                              <ChefHat size={11} /> Mandar Cocina
                            </button>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}

                  {/* 4. CART RECONSTRUCTION & NOTES SCREEN */}
                  {activeScreen === 'cart' && (
                    <motion.div 
                      key="cart"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 p-3 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="flex-1 flex flex-col overflow-hidden">
                        
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2 shrink-0">
                          <button 
                            onClick={() => setActiveScreen('menu')}
                            className="flex items-center gap-1 text-[9px] text-indigo-300 font-extrabold cursor-pointer"
                          >
                            <ArrowLeft size={11} /> menú
                          </button>
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Modificadores comanda</span>
                        </div>

                        {/* List items with specific notes input */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                          {mobileCart.map(item => (
                            <div key={item.product.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-2 text-[11px]">
                              
                              <div className="flex justify-between items-start">
                                <div className="truncate max-w-[170px]">
                                  <span className="font-extrabold text-white block text-[10.5px] truncate">{item.product.name}</span>
                                  <span className="text-[9px] text-gray-400 font-mono">RD$ {item.product.price} c/u</span>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-[8px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                  Quitar
                                </button>
                              </div>

                              {/* Quantity selection inside cart list */}
                              <div className="flex justify-between items-center pt-1.5 border-t border-slate-850/60">
                                <div className="text-[9px] text-gray-400">Cantidad:</div>
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-1.5">
                                  <button onClick={() => updateCartQty(item.product.id, -1)} className="text-gray-400 text-[10.5px] font-bold"><Minus size={9} /></button>
                                  <span className="font-mono text-white text-[10px] font-bold">{item.qty}</span>
                                  <button onClick={() => updateCartQty(item.product.id, 1)} className="text-gray-400 text-[10.5px] font-bold"><Plus size={9} /></button>
                                </div>
                              </div>

                              {/* Chef/Instruction note */}
                              <div>
                                <input
                                  type="text"
                                  placeholder="Ej. Término medio, sin aderezo..."
                                  value={item.notes}
                                  onChange={(e) => updateNotes(item.product.id, e.target.value)}
                                  className="bg-slate-950 border border-slate-850 rounded px-2 py-1 w-full text-[9px] text-gray-300 outline-none focus:border-indigo-650"
                                />
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Calculations total for cashier/kitchen transfer */}
                      <div className="pt-2 border-t border-dashed border-slate-850 shrink-0 space-y-2">
                        
                        <div className="text-[9px] text-gray-450 space-y-1 font-mono">
                          <div className="flex justify-between">
                            <span>Subtotal Neto:</span>
                            <span>RD$ {subtotal.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ITBIS (18.00%):</span>
                            <span>RD$ {tax.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-black text-indigo-400 pt-1 border-t border-slate-900 mt-1">
                            <span>TOTAL RESTAURANTE:</span>
                            <span>RD$ {total.toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <button
                            onClick={handleSendToKitchen}
                            className="bg-emerald-650 hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-center cursor-pointer uppercase shadow-md flex items-center justify-center gap-1"
                          >
                            <ChefHat size={11} /> Mandar Cocina
                          </button>
                          
                          <button
                            onClick={handleProceedToCheckout}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-xl text-center cursor-pointer uppercase shadow-md flex items-center justify-center gap-1"
                          >
                            <DollarSign size={11} /> Cobrar POS
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* 5. CHECKOUT/PAGO MOBILE SCREEN */}
                  {activeScreen === 'checkout' && (
                    <motion.div 
                      key="checkout"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 p-3 flex flex-col justify-between overflow-y-auto"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <button 
                            onClick={() => setActiveScreen('cart')}
                            className="flex items-center gap-1 text-[9px] text-indigo-300 font-extrabold cursor-pointer"
                          >
                            <ArrowLeft size={11} /> editar comanda
                          </button>
                          <span className="text-[10px] text-gray-450 font-black uppercase tracking-wider">Pasarela Alegra</span>
                        </div>

                        {/* Financial summary ticket */}
                        <div className="bg-slate-900 p-2.5 rounded-xl space-y-1.5 border border-slate-850 font-mono text-[10px]">
                          <div className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1 rounded uppercase tracking-wider font-extrabold w-max">Ticket #{selectedTable?.id || '0'}</div>
                          <div className="flex justify-between text-white">
                            <span>Subtotal:</span>
                            <span>RD$ {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>ITBIS Estatal (18%):</span>
                            <span>RD$ {tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-400 font-black text-xs pt-1.5 border-t border-slate-800">
                            <span>COBRAR EN RD$:</span>
                            <span>RD$ {total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Payment channel selector style of alegria */}
                        <div className="space-y-2">
                          <label className="text-[8.5px] text-gray-400 block font-bold uppercase tracking-wider pl-1">Canal de Ingreso / Pago</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('efectivo')}
                              className={`text-[9px] py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                                paymentMethod === 'efectivo' 
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                                  : 'bg-slate-900 border-slate-850 text-gray-400 hover:text-white'
                              }`}
                            >
                              💵 Efectivo
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('tarjeta')}
                              className={`text-[9px] py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                                paymentMethod === 'tarjeta'
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                                  : 'bg-slate-900 border-slate-850 text-gray-400 hover:text-white'
                              }`}
                            >
                              💳 Tarjeta
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod('transferencia')}
                              className={`text-[9px] py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                                paymentMethod === 'transferencia'
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                                  : 'bg-slate-900 border-slate-850 text-gray-400 hover:text-white'
                              }`}
                            >
                              🏦 Pop/BHD
                            </button>
                          </div>
                        </div>

                        {paymentMethod === 'efectivo' && (
                          <div className="space-y-1.5 bg-slate-900 p-2.5 rounded-xl border border-slate-850">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">Recibido (RD$)</span>
                              {cashReceived > total && (
                                <span className="text-[8px] text-emerald-400 font-bold">Devuelta: RD$ {(cashReceived - total).toFixed(0)}</span>
                              )}
                            </div>
                            <input
                              type="number"
                              value={cashReceived || ''}
                              onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] font-black w-full text-right text-emerald-400 outline-none focus:border-indigo-650"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleProcessCheckout}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-center cursor-pointer transition-all uppercase shadow-md flex items-center justify-center gap-1.5 text-[11px]"
                        >
                          <CheckCircle size={13} /> COMPLETAR TRANSACCIÓN COBRADA
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* 6. SUCCESS BILLING SCREEN */}
                  {activeScreen === 'success' && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 p-5 flex flex-col justify-between items-center text-center bg-slate-950"
                    >
                      <div className="my-auto space-y-4">
                        <div className="w-13 h-13 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
                          <Check size={28} />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-black tracking-widest block w-max mx-auto">Servicio Cobrado</span>
                          <h4 className="text-sm font-black text-white uppercase font-display pt-1">Factura Fiscal Generada</h4>
                          <p className="text-[9px] text-gray-500 leading-normal">Los balances contables y asiento de partida doble han sido reportados al módulo DGII / Alegra ERP.</p>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1 font-mono text-[10px] text-gray-300">
                          <div className="flex justify-between w-48 mx-auto">
                            <span>Monto Total:</span>
                            <span className="font-bold text-white">RD$ {total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between w-48 mx-auto">
                            <span>Impuesto ITBIS:</span>
                            <span className="text-indigo-400 text-[9px]">RD$ {tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between w-48 mx-auto pt-1 border-t border-slate-800 text-[9px] text-gray-450 mt-1">
                            <span>Asiento Asignado:</span>
                            <span>#as-pos-mob</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleExitService}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] w-full py-2.5 rounded-xl transition-all shadow-md cursor-pointer uppercase shrink-0"
                      >
                        regresar a mesas gratis
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>

                {/* Sliding notifications drawer */}
                {showNotificationsDrawer && (
                  <div className="absolute inset-x-0 bottom-0 top-12 bg-slate-950/98 z-50 flex flex-col p-4 animate-fade-in border-t border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                      <span className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                        <Bell size={14} className="text-amber-550" /> Centro de Alertas ({waiterNotifications.length})
                      </span>
                      <button 
                        onClick={() => {
                          setShowNotificationsDrawer(false);
                          // Mark all as read
                          setWaiterNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        className="p-1.5 bg-slate-900 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {waiterNotifications.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 text-[10px] space-y-2">
                          <p>No hay alertas activas en salón o cocina.</p>
                          <p className="text-[9px] text-gray-600">Use el celular del comensal a la derecha para simular eventos de auxilio (llamar mesero, pre-factura).</p>
                        </div>
                      ) : (
                        waiterNotifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all text-xs ${
                              notif.read ? 'bg-slate-900/40 border-slate-850 text-gray-400' : 'bg-indigo-950/30 border-indigo-850 text-white'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                notif.type === 'kit_ready' ? 'bg-emerald-500/10 text-emerald-400' :
                                notif.type === 'call_waiter' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {notif.type === 'kit_ready' ? '🍳 Cocina' :
                                 notif.type === 'call_waiter' ? '🙋‍♂️ Alerta' : '💵 Cuenta'}
                              </span>
                              <span className="text-[8px] font-mono text-gray-500">{notif.timestamp}</span>
                            </div>
                            
                            <p className="text-[10px] font-bold leading-normal">{notif.message}</p>
                            
                            {!notif.read && (
                              <button
                                onClick={() => {
                                  setWaiterNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                }}
                                className="text-[8px] text-indigo-400 hover:text-indigo-300 font-extrabold w-max mt-1 cursor-pointer"
                              >
                                ✓ Marcar como leído
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {waiterNotifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setWaiterNotifications([]);
                          setShowNotificationsDrawer(false);
                        }}
                        className="mt-3 bg-red-950/20 text-red-405 border border-red-900/40 hover:bg-red-900/30 font-black text-[9px] py-2 rounded-xl text-center uppercase cursor-pointer"
                      >
                        Limpiar todo el historial
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Simulated physical home bar screen bottom */}
              <div className="h-4 flex items-center justify-center shrink-0">
                <div className="w-20 h-1 bg-white/20 rounded-full"></div>
              </div>

            </div>
          </div>
        </div>

        {/* CELLPHONE 2: THE CUSTOMER LIVE QR PORTAL VIEW */}
        <div className="lg:col-span-4 flex flex-col items-center" id="customer-live-tracking-panel">
          <div className="w-full text-center mb-2.5">
            <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md">
              🛸 Celular del Cliente (Portal QR)
            </span>
          </div>

          {/* Customer simulated Frame */}
          <div className="relative w-full max-w-[320px] h-[580px] bg-slate-850 rounded-[35px] shadow-2xl p-2 border-4 border-slate-700 flex flex-col overflow-hidden">
            
            {/* Clock & Status */}
            <div className="h-4 bg-slate-850 flex justify-between items-center px-6 text-white text-[8px] font-mono select-none text-slate-500 shrink-0">
              <span>15:16</span>
              <div className="w-14 h-3 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 z-50"></div>
              <div className="flex items-center gap-1 opacity-70">
                <Signal size={8} />
                <Wifi size={8} />
                <Battery size={9} />
              </div>
            </div>

            {/* Inner Viewport */}
            <div className="flex-1 bg-white rounded-[26px] overflow-hidden flex flex-col relative text-gray-800 text-xs">
              
              {/* Branded Diner App Top header */}
              <div className="bg-slate-900 text-white p-3 pt-3.5 pb-2.5 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-5.5 h-5.5 bg-indigo-600 rounded flex items-center justify-center text-[10px] font-bold font-display">A+</div>
                  <div>
                    <h3 className="text-[10px] font-extrabold font-display uppercase tracking-widest leading-none">Alegra Comensal</h3>
                    <span className="text-[7.5px] text-indigo-400 block mt-0.5 uppercase tracking-wider font-extrabold">Seguimiento Libre</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[7px] text-gray-400 font-bold tracking-tight">VIVO</span>
                </div>
              </div>

              {/* Dynamic tracking status switch */}
              {trackingOrder ? (
                <div className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    
                    {/* Header info */}
                    <div className="text-center bg-slate-50 p-2 border border-gray-150 rounded-xl">
                      <span className="text-[8px] text-gray-400 uppercase font-black block tracking-wider">
                        {trackingOrder.tableId.startsWith('pos-quick') ? 'Cliente Mostrador / Llevar' : 'Orden para la mesa'}
                      </span>
                      <span className="text-sm font-black text-slate-950 uppercase font-display block mt-0.5">{trackingOrder.tableName}</span>
                    </div>

                    {/* Progress tracking indicator stages (FANCY DINER TRACKER!) */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-gray-100">
                      <span className="text-[8.5px] text-gray-400 uppercase font-bold block tracking-wider mb-2 text-center">Estado de Preparación</span>
                      
                      <div className="relative flex flex-col gap-3">
                        {/* vertical connector line */}
                        <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-gray-200"></div>

                        {/* Stage 1: Recibido */}
                        <div className="flex items-center gap-3.5 relative z-10">
                          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border font-bold ${
                            ['pendiente', 'en_preparacion', 'entregada', 'cobrada'].includes(trackingOrder.status)
                              ? 'bg-indigo-650 text-white border-indigo-600'
                              : 'bg-white text-gray-450 border-gray-200'
                          }`}>
                            <Clock size={11} className={trackingOrder.status === 'pendiente' ? 'animate-spin' : ''} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[10.5px] text-gray-900 block">1. Recibida</span>
                            <span className="text-[8px] text-gray-400 block">Cocina ha recibido el ticket de comanda.</span>
                          </div>
                        </div>

                        {/* Stage 2: Cociendo */}
                        <div className="flex items-center gap-3.5 relative z-10">
                          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border font-bold ${
                            ['en_preparacion', 'entregada', 'cobrada'].includes(trackingOrder.status)
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}>
                            <ChefHat size={11} className={trackingOrder.status === 'en_preparacion' ? 'animate-bounce' : ''} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[10.5px] text-gray-900 block">2. En Preparación</span>
                            <span className="text-[8px] text-gray-400 block">Chef elaborando los platos seleccionados.</span>
                          </div>
                        </div>

                        {/* Stage 3: Servida */}
                        <div className="flex items-center gap-3.5 relative z-10">
                          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border font-bold ${
                            ['entregada', 'cobrada'].includes(trackingOrder.status)
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}>
                            <Check size={12} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[10.5px] text-gray-900 block">3. Servida en Mesa</span>
                            <span className="text-[8px] text-gray-400 block">¡Listo para disfrutar en el salón!</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ordered Items details */}
                    <div className="space-y-1 bg-white border border-gray-150 rounded-xl p-2.5 font-sans">
                      <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Tu Consumo</span>
                      <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-55">
                        {trackingOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] pt-1 first:pt-0">
                            <div>
                              <span className="font-bold text-gray-800">{item.name}</span>
                              {item.notes && <p className="text-[7.5px] text-red-500 italic mt-0.5">* Nota: {item.notes}</p>}
                            </div>
                            <span className="font-mono text-gray-500 font-extrabold">{item.quantity} x RD$ {item.price}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between font-mono font-black text-gray-900 mt-2 text-[11px]">
                        <span>Total Facturado:</span>
                        <span className="text-indigo-650">RD$ {trackingOrder.total.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Diner help requests */}
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                      <button
                        onClick={() => handleCustomerCallStaff('Llamar Camarero')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-2.5 rounded-xl text-[9px] tracking-wide text-center uppercase cursor-pointer"
                      >
                        🙋‍♂️ Llamar Camarero
                      </button>
                      <button
                        onClick={() => handleCustomerCallStaff('Pedir la Cuenta')}
                        className="bg-indigo-55 hover:bg-indigo-100 text-indigo-700 font-black py-2.5 rounded-xl text-[9px] tracking-wide text-center uppercase cursor-pointer"
                      >
                        💵 Pedir Cuenta
                      </button>
                    </div>

                  </div>

                  <div className="text-center font-bold text-[7.5px] text-gray-300 uppercase mt-4">
                    Sincronización en tiempo real por Alegra
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-5 flex flex-col justify-between items-center text-center my-auto">
                  <div className="my-auto space-y-3.5 p-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <QrCode size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black uppercase text-gray-900 font-display">Esperando Escaneo</h4>
                      <p className="text-[9.5px] text-gray-500 leading-normal mt-1">Crea o selecciona una comanda de camarero en la tableta móvil para habilitar el portal tracking por QR.</p>
                    </div>
                  </div>
                  
                  <div className="text-[8px] text-gray-300 font-mono">
                    Alegra Dominicana 2026
                  </div>
                </div>
              )}

              {/* Home line */}
              <div className="py-2 flex items-center justify-center shrink-0 border-t border-gray-50">
                <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
              </div>

            </div>
          </div>
        </div>

        {/* TESTING DESK & CODE COMPILER PREVIEW (RIGHT COLUMN EXPANSION) */}
        <div className="lg:col-span-3 space-y-4 font-sans text-xs">
          
          {/* Kitchen simulator operations */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-750 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 font-display border-b border-slate-800 pb-2.5">
              <ChefHat size={15} /> Supervisión de Cocina
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Utilice estos controles para avanzar el proceso de cocina del cliente y vea cómo se sincroniza instantáneamente el comensal.
            </p>

            {trackingOrder && trackingOrder.status !== 'cobrada' ? (
              <div className="space-y-1.5 pt-1.5">
                <div className="text-[9px] font-extrabold text-slate-405 uppercase tracking-wider block">Establecer Estado Comanda:</div>
                <button
                  onClick={() => handleSimulateKitchenStep('pendiente')}
                  className={`w-full text-left p-2.5 rounded-xl border font-bold flex justify-between items-center transition-all cursor-pointer text-[10px] ${
                    trackingOrder.status === 'pendiente' 
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400' 
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🍳 1. Recibido</span>
                  {trackingOrder.status === 'pendiente' && <Check size={11} />}
                </button>
                
                <button
                  onClick={() => handleSimulateKitchenStep('en_preparacion')}
                  className={`w-full text-left p-2.5 rounded-xl border font-bold flex justify-between items-center transition-all cursor-pointer text-[10px] ${
                    trackingOrder.status === 'en_preparacion' 
                      ? 'bg-amber-950/40 border-amber-500 text-amber-400' 
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔥 2. Cociendo</span>
                  {trackingOrder.status === 'en_preparacion' && <Check size={11} />}
                </button>

                <button
                  onClick={() => handleSimulateKitchenStep('entregada')}
                  className={`w-full text-left p-2.5 rounded-xl border font-bold flex justify-between items-center transition-all cursor-pointer text-[10px] ${
                    trackingOrder.status === 'entregada' 
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🍽 3. Servido en Mesa</span>
                  {trackingOrder.status === 'entregada' && <Check size={11} />}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center text-slate-500 text-[10px]">
                {trackingOrder && trackingOrder.status === 'cobrada' ? 'Esta comanda ya está cobrada y facturada.' : 'Escoja una mesa en el POS móvil de camarero.'}
              </div>
            )}
          </div>

          {/* QR Code and live scanning details */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xxs space-y-3 text-gray-700">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-1">
              <QrCode size={14} className="text-indigo-650" /> Generador QR de Mesa
            </h3>
            
            {trackingOrder && trackingOrder.status !== 'cobrada' ? (
              <div className="space-y-2.5 text-center flex flex-col items-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code seguimiento"
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 border border-gray-100 rounded-lg p-1 animate-fade-in shadow-xs"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-900 block">Ticket: #{trackingOrder.id.replace('ord-', '')}</span>
                  <p className="text-[9px] text-gray-400 leading-normal">
                    Este QR simula el código impreso en la boleta del comensal. Al escanearlo, cargará la sección derecha para autogestión de su mesa.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 text-center text-gray-400 text-[10px] rounded-lg">
                El código QR de mesa se activa durante servicios activos abierta.
              </div>
            )}
          </div>

          {/* Logger log of waiter interaction */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 border border-slate-850 text-[10.5px] space-y-2 font-mono leading-relaxed">
            <span className="text-[8.5px] text-gray-500 uppercase tracking-wider block font-bold">Bitácora de Sucesos Realtime</span>
            
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {waiterCallLogged.length === 0 && customNotifications.length === 1 ? (
                <div className="text-gray-600 italic">Esperando eventos...</div>
              ) : (
                <>
                  {waiterCallLogged.map((log, idx) => (
                    <div key={idx} className="text-amber-400 animate-pulse">
                      🔔 [ALERTA] {log}
                    </div>
                  ))}
                  {customNotifications.map((note, idx) => (
                    <div key={idx} className="text-slate-400">
                      {note}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Download copiable React Native client documentation wrapper */}
          <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-2xl p-4.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] tracking-wide text-indigo-200 uppercase">React Native (iOS/Android)</span>
              <button 
                onClick={handleCopyToClipboard}
                className="bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded text-[8.5px] font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <Copy size={11} /> {copiedCode ? 'Copiado!' : 'Copiar base'}
              </button>
            </div>
            <p className="text-[9.5px] leading-relaxed text-indigo-150">
              Esta pantalla interactiva web emula el mismo motor TypeScript que nuestro repositorio base en la carpeta `/pos-mobile/`. Listo para compilar con Expo.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

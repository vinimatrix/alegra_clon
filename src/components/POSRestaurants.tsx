/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Product, Client, RestaurantTable, RestaurantOrder, Invoice } from '../types';

interface POSRestaurantsProps {
  products: Product[];
  clients: Client[];
  tables: RestaurantTable[];
  orders: RestaurantOrder[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onUpdateTables: (updatedTables: RestaurantTable[]) => void;
  onUpdateOrders: (updatedOrders: RestaurantOrder[]) => void;
}

export default function POSRestaurants({ 
  products, 
  clients, 
  tables, 
  orders, 
  onAddInvoice,
  onUpdateTables,
  onUpdateOrders 
}: POSRestaurantsProps) {
  // Toggle between 'retail' (standard POS) and 'restaurante' (Mesa/Comandas layout)
  const [posMode, setPosMode] = useState<'retail' | 'restaurante'>('retail');
  
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

  // Retail filter definitions
  const categories = ['Todos', 'Platos', 'Bebidas', 'Tecnología', 'Hogar'];
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

  // Assign or Add Food to Table Order
  const handleAddDishToTable = (prod: Product) => {
    if (!selectedTable) return;
    
    // Check if table has an active order
    const activeOrder = getActiveOrderForTable(selectedTable.id);
    
    if (activeOrder) {
      // Add dish to existing order
      const existingItem = activeOrder.items.find(i => i.productId === prod.id);
      let updatedItems = [];
      if (existingItem) {
        updatedItems = activeOrder.items.map(i => 
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedItems = [...activeOrder.items, {
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          price: prod.price
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
      const subtotal = prod.price;
      const taxes = subtotal * 0.18;
      const total = subtotal + taxes;

      const newOrder: RestaurantOrder = {
        id: `ord-${Date.now()}`,
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        items: [{
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          price: prod.price
        }],
        status: 'pendiente',
        subtotal,
        taxes,
        total,
        waiterName: 'Juan Carlos',
        createdAt: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false })
      };

      onUpdateOrders([...orders, newOrder]);
      handleSetTableStatus(selectedTable.id, 'ocupada');
    }
  };

  const handleUpdateDishQty = (orderId: string, prodId: string, adjust: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(i => {
      if (i.productId === prodId) {
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

  return (
    <div className="space-y-6" id="pos-restaurants-screen">
      
      {/* Interactive module header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display flex items-center gap-2">
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
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                <div>
                  <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display">Mapa de Mesas - Salón Principal</h3>
                  <p className="text-[11px] text-gray-400">Selecciona una mesa para gestionar la comanda o facturar</p>
                </div>
                {/* Status legends */}
                <div className="flex gap-2.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
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
                  let bgClass = "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900";
                  if (table.status === 'ocupada') bgClass = "border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900";
                  if (table.status === 'atendiendo') bgClass = "border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900";
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

            {/* If selected table is active, show the Quick Dish adder directly */}
            {selectedTable && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                  <h3 className="text-xs font-bold text-alegra-secondary uppercase tracking-wider font-display">Añadir Alimentos a {selectedTable.name}</h3>
                  <span className="text-[10px] text-gray-400">Selecciona para añadir directamente a comanda</span>
                </div>
                {/* All products grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto max-h-64 pr-1">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddDishToTable(p)}
                      className="bg-slate-50 hover:bg-blue-50/40 hover:text-alegra-primary border border-gray-200 hover:border-blue-200 p-2 text-[11px] font-semibold text-gray-700 rounded-lg text-left transition-all truncate animate-fade-in flex flex-col justify-between h-14 cursor-pointer"
                    >
                      <span className="truncate w-full block">{p.name}</span>
                      <span className="text-blue-600 font-mono mt-1 font-bold">${p.price.toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right section: Selected Table Comanda & Preparation dashboard */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between min-h-[450px]" id="restaurant-sidebar-ticket">
            {selectedTable ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Table header selection */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-alegra-secondary uppercase tracking-wider font-display">{selectedTable.name}</h3>
                      <p className="text-[10px] text-gray-400">Gestionado por: Camarero Juan C.</p>
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
                          Orden: {activeTableOrder.createdAt}
                        </span>
                        <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          activeTableOrder.status === 'pendiente' 
                            ? 'bg-amber-100 text-amber-800' 
                            : activeTableOrder.status === 'en_preparacion' 
                            ? 'bg-pink-100 text-pink-800 animate-pulse' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {activeTableOrder.status}
                        </span>
                      </div>

                      {/* Items loop */}
                      <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-gray-50">
                        {activeTableOrder.items.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between gap-2 pt-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-850 truncate">{item.name}</h4>
                              <p className="text-[10px] text-gray-400 font-mono">${item.price}</p>
                              {item.notes && <p className="text-[9px] text-red-500 italic mt-0.5">Nota: {item.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleUpdateDishQty(activeTableOrder.id, item.productId, -1)}
                                className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-xs font-bold font-mono px-1 w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateDishQty(activeTableOrder.id, item.productId, 1)}
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
                        <div className="flex justify-between text-base font-extrabold text-alegra-primary pt-1">
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
    </div>
  );
}

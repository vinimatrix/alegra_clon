/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  Package, 
  ShoppingBag, 
  Smartphone, 
  BookOpen, 
  Database, 
  Menu, 
  X,
  User,
  BellRing
} from 'lucide-react';

import { 
  Product, 
  Invoice, 
  Account, 
  JournalEntry, 
  RestaurantTable, 
  RestaurantOrder, 
  Warehouse, 
  Client 
} from './types';

import { 
  INITIAL_PRODUCTS, 
  INITIAL_INVOICES, 
  INITIAL_ACCOUNTS, 
  INITIAL_JOURNAL_ENTRIES, 
  INITIAL_TABLES, 
  INITIAL_ORDERS, 
  INITIAL_WAREHOUSES, 
  INITIAL_CLIENTS,
  getLocalStorageState,
  saveLocalStorageState
} from './lib/mockData';

// Import subcomponents
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import POSRestaurants from './components/POSRestaurants';
import POSMobileSimulator from './components/POSMobileSimulator';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';
import BackendPrep from './components/BackendPrep';

export default function App() {
  const [activeTab, setActiveTab2] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core ERP States synchronized with state/localStorage
  const [products, setProducts] = useState<Product[]>(() => 
    getLocalStorageState('alegra_products', INITIAL_PRODUCTS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => 
    getLocalStorageState('alegra_invoices', INITIAL_INVOICES)
  );
  const [accounts, setAccounts] = useState<Account[]>(() => 
    getLocalStorageState('alegra_accounts', INITIAL_ACCOUNTS)
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => 
    getLocalStorageState('alegra_journal_entries', INITIAL_JOURNAL_ENTRIES)
  );
  const [tables, setTables] = useState<RestaurantTable[]>(() => 
    getLocalStorageState('alegra_tables', INITIAL_TABLES)
  );
  const [orders, setOrders] = useState<RestaurantOrder[]>(() => 
    getLocalStorageState('alegra_orders', INITIAL_ORDERS)
  );

  const warehouses: Warehouse[] = INITIAL_WAREHOUSES;
  const clients: Client[] = INITIAL_CLIENTS;

  // Sync state to localStorage on modification
  useEffect(() => {
    saveLocalStorageState('alegra_products', products);
  }, [products]);

  useEffect(() => {
    saveLocalStorageState('alegra_invoices', invoices);
  }, [invoices]);

  useEffect(() => {
    saveLocalStorageState('alegra_accounts', accounts);
  }, [accounts]);

  useEffect(() => {
    saveLocalStorageState('alegra_journal_entries', journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    saveLocalStorageState('alegra_tables', tables);
  }, [tables]);

  useEffect(() => {
    saveLocalStorageState('alegra_orders', orders);
  }, [orders]);

  // CORE ERP ACTION WORKFLOWS
  
  // 1. Emisión / Cobro de una Factura (Retail or POS restaurant)
  const handleAddInvoice = (newInvoice: Invoice) => {
    // A) Append to Invoices
    setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);

    // B) Automatic Inventory stock reduction
    const updatedProducts = products.map(prod => {
      const invoiceItem = newInvoice.items.find(it => it.productId === prod.id);
      if (invoiceItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - invoiceItem.quantity)
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // C) Automatic Accounting Dual Entry (Libro Diario Contable)
    // 1. Debit corresponding Assets account (1103 BPD if paid, or 1105 Receivables if credit/pendiente)
    const isPaid = newInvoice.status === 'pagada';
    const debitAccountCode = isPaid ? '1103' : '1105'; // Popular vs Accounts Receivable

    // 2. Debit Cost of Goods Sold (5101) and Credit Inventories (1110)
    // Calculate total cost draft
    let totalCostOfInvoice = 0;
    newInvoice.items.forEach(it => {
      const p = products.find(prod => prod.id === it.productId);
      if (p) totalCostOfInvoice += (p.cost * it.quantity);
    });

    const journalLines = [
      // Debit cash/receivable
      { accountCode: debitAccountCode, debit: newInvoice.total, credit: 0 },
      // Credit Income (4101 for Retail, 4102 for Restaurant depending on notes/category)
      { 
        accountCode: newInvoice.notes?.includes('Restaurante') ? '4102' : '4101', 
        debit: 0, 
        credit: newInvoice.subtotal 
      },
      // Credit Taxes (ITBIS 18% - 2105)
      { accountCode: '2105', debit: 0, credit: newInvoice.taxes },
      
      // If paid, record Cost of sales!
      { accountCode: '5101', debit: totalCostOfInvoice, credit: 0 },
      { accountCode: '1110', debit: 0, credit: totalCostOfInvoice }
    ];

    const automaticAsiento: JournalEntry = {
      id: `as-auto-${Date.now()}`,
      date: newInvoice.issueDate,
      description: `Reg. automático emitido por factura de ventas N° ${newInvoice.invoiceNumber}`,
      reference: newInvoice.invoiceNumber,
      lines: journalLines
    };

    setJournalEntries(prevEntries => [automaticAsiento, ...prevEntries]);

    // D) Modify Ledger Account Balances (Actualizar Catálogo de Cuentas)
    const updatedAccounts = accounts.map(acc => {
      let balanceAdjust = 0;
      journalLines.forEach(line => {
        if (line.accountCode === acc.code) {
          if (acc.type === 'activo' || acc.type === 'egreso') {
            balanceAdjust += (line.debit - line.credit);
          } else {
            // Pasivo, Patrimonio, Ingreso
            balanceAdjust += (line.credit - line.debit);
          }
        }
      });
      return {
        ...acc,
        balance: acc.balance + balanceAdjust
      };
    });
    setAccounts(updatedAccounts);
  };

  // 2. Cancelar / Anular una factura
  const handleCancelInvoice = (id: string) => {
    // Set status to anulada
    const updatedInvoices = invoices.map(inv => 
      inv.id === id ? { ...inv, status: 'anulada' as const } : inv
    );
    setInvoices(updatedInvoices);

    // Revert inventory stocks
    const targetedInvoice = invoices.find(inv => inv.id === id);
    if (targetedInvoice && targetedInvoice.status === 'pagada') {
      const revertedProducts = products.map(prod => {
        const item = targetedInvoice.items.find(i => i.productId === prod.id);
        if (item) {
          return { ...prod, stock: prod.stock + item.quantity };
        }
        return prod;
      });
      setProducts(revertedProducts);
    }
  };

  // 3. Registrar ajuste manual de inventario físico
  const handleAdjustStock = (productId: string, adjustmentQty: number, reason: string) => {
    const targetProd = products.find(p => p.id === productId);
    if (!targetProd) return;

    // A) Update physical stock count
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: Math.max(0, p.stock + adjustmentQty) } : p
    );
    setProducts(updatedProducts);

    // B) Append inventory adjustment journal entries
    // e.g. If reduction (loss/merma): Debit Cost of Sales 5101, Credit assets inventory 1110
    // If addition (found stock): Debit assets inventory 1110, Credit miscellaneous incomes 4101
    const amountVal = Math.abs(adjustmentQty) * targetProd.cost;
    const isAddition = adjustmentQty > 0;

    const lines = isAddition ? [
      { accountCode: '1110', debit: amountVal, credit: 0 },
      { accountCode: '4101', debit: 0, credit: amountVal }
    ] : [
      { accountCode: '5101', debit: amountVal, credit: 0 },
      { accountCode: '1110', debit: 0, credit: amountVal }
    ];

    const manualAsiento: JournalEntry = {
      id: `as-adj-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Ajuste contable de mercancía. SKU: ${targetProd.sku}. Motivo: ${reason}`,
      reference: 'AJ-STK',
      lines
    };

    setJournalEntries(prevEntries => [manualAsiento, ...prevEntries]);

    // C) Update Accounts
    const updatedAccounts = accounts.map(acc => {
      let balanceAdjust = 0;
      lines.forEach(line => {
        if (line.accountCode === acc.code) {
          if (acc.type === 'activo' || acc.type === 'egreso') {
            balanceAdjust += (line.debit - line.credit);
          } else {
            balanceAdjust += (line.credit - line.debit);
          }
        }
      });
      return {
        ...acc,
        balance: acc.balance + balanceAdjust
      };
    });
    setAccounts(updatedAccounts);
  };

  // 4. Agregar productos manualmente al catálogo
  const handleAddProduct = (newProduct: Product) => {
    setProducts(prevProducts => [...prevProducts, newProduct]);
  };

  // 5. Agregar Journal Entry Manual
  const handleAddJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prevEntries => [entry, ...prevEntries]);

    // Update account balances based on lines
    const updatedAccounts = accounts.map(acc => {
      let balanceAdjust = 0;
      entry.lines.forEach(line => {
        if (line.accountCode === acc.code) {
          if (acc.type === 'activo' || acc.type === 'egreso') {
            balanceAdjust += (line.debit - line.credit);
          } else {
            balanceAdjust += (line.credit - line.debit);
          }
        }
      });
      return {
        ...acc,
        balance: acc.balance + balanceAdjust
      };
    });
    setAccounts(updatedAccounts);
  };

  // Navigation handlers passed down to Dashboard
  const navigateToTab = (tab: string) => {
    setActiveTab2(tab);
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Inicio / KPI', icon: TrendingUp },
    { id: 'facturacion', label: 'Facturación Ventas', icon: FileText },
    { id: 'pos-restaurante', label: 'POS & Restaurante', icon: ShoppingBag },
    { id: 'pos-mobile', label: 'Vista POS Mobile (Simulator)', icon: Smartphone },
    { id: 'inventario', label: 'Inventario / Almacén', icon: Package },
    { id: 'contabilidad', label: 'Contabilidad ERP', icon: BookOpen },
    { id: 'backend', label: 'Preparación Backend', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col md:flex-row font-sans selection:bg-blue-100" id="app-wrapper">
      
      {/* 1. TOP NAVBAR FOR RESPONSIVE VISTAS MOBILE */}
      <nav className="md:hidden bg-alegra-secondary text-white p-4 flex items-center justify-between border-b border-white/10 select-none z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-5 h-5 bg-blue-600 rounded-sm"></div>
          </div>
          <span className="text-white font-bold text-lg tracking-tight font-display">Alegra+</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 hover:bg-slate-800 rounded transition-all cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Drawer list */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[53px] z-40 bg-alegra-secondary md:hidden flex flex-col p-4 space-y-2 text-white animate-fade-in">
          {menuItems.map(item => {
            const IconComp = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm font-semibold transition-all text-left ${
                  isSelected 
                    ? 'bg-blue-600 text-white font-extrabold shadow-lg shadow-blue-500/20' 
                    : 'text-blue-100/85 hover:bg-slate-800'
                }`}
              >
                <IconComp size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP PROFESSIONAL SIDEBAR ACCORDING TO ALEGRA STYLE */}
      <aside className="hidden md:flex flex-col w-64 bg-alegra-secondary text-white justify-between shrink-0 select-none z-30 min-h-screen border-r border-[#003360]">
        <div className="flex flex-col">
          {/* Sidebar Brand layout */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <div className="w-5 h-5 bg-blue-600 rounded-sm"></div>
              </div>
              <span className="text-white font-bold text-xl tracking-tight font-display">Alegra+</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <div className="p-4 space-y-1" id="sidebar-links-list">
            {menuItems.map(item => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab2(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all w-full text-left cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-500/20 text-white font-bold border border-blue-400/10' 
                      : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
                  }`}
                  id={`sidebar-link-${item.id}`}
                >
                  <IconComp size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User profile lower card snippet */}
        <div className="p-4">
          <div className="bg-blue-800/20 border border-blue-750/20 rounded-xl p-3 flex items-center gap-2.5">
            <div className="p-2 bg-blue-900/60 rounded-lg text-blue-300">
              <User size={15} />
            </div>
            <div className="truncate text-xs">
              <p className="font-bold text-blue-50 truncate">Vini Martínez</p>
              <p className="text-[10px] text-blue-200/50 font-mono">vinimatrix@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. MAIN COHESIVE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <div className="animate-fade-in" id="main-screens-render">
          {activeTab === 'dashboard' && (
            <Dashboard 
              products={products} 
              invoices={invoices} 
              journalEntries={journalEntries} 
              navigateToTab={navigateToTab} 
            />
          )}

          {activeTab === 'facturacion' && (
            <Invoicing 
              invoices={invoices} 
              products={products} 
              clients={clients} 
              onAddInvoice={handleAddInvoice} 
              onCancelInvoice={handleCancelInvoice} 
            />
          )}

          {activeTab === 'pos-restaurante' && (
            <POSRestaurants 
              products={products} 
              clients={clients} 
              tables={tables} 
              orders={orders} 
              onAddInvoice={handleAddInvoice}
              onUpdateTables={setTables}
              onUpdateOrders={setOrders}
            />
          )}

          {activeTab === 'pos-mobile' && (
            <POSMobileSimulator products={products} />
          )}

          {activeTab === 'inventario' && (
            <Inventory 
              products={products} 
              warehouses={warehouses} 
              onAdjustStock={handleAdjustStock} 
              onAddProduct={handleAddProduct} 
            />
          )}

          {activeTab === 'contabilidad' && (
            <Accounting 
              accounts={accounts} 
              journalEntries={journalEntries} 
              onAddJournalEntry={handleAddJournalEntry} 
            />
          )}

          {activeTab === 'backend' && (
            <BackendPrep />
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2, TrendingUp, FileText, Package, ShoppingBag, Smartphone,
  BookOpen, Database, Menu, X, User, BellRing, Settings as SettingsIcon,
  Users, Receipt, FileBarChart
} from 'lucide-react';

import {
  Product, Invoice, Account, JournalEntry, Client, Expense,
  Employee, PayrollEntry, Warehouse // <--- Importación añadida
} from './types';

import {
  INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES,
  INITIAL_TABLES, INITIAL_ORDERS, INITIAL_WAREHOUSES, INITIAL_CLIENTS,
  INITIAL_EXPENSES, INITIAL_EMPLOYEES, INITIAL_PAYROLLS,
  getLocalStorageState, saveLocalStorageState
} from './lib/mockData';

import { api, USE_SUPABASE } from './services/api';

// Import subcomponents
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import POSRestaurants from './components/POSRestaurants';
import POSMobileSimulator from './components/POSMobileSimulator';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';
import BackendPrep from './components/BackendPrep';
import Settings from './components/Settings';
import Contacts from './components/Contacts';
import Expenses from './components/Expenses';
import ReportsDGII from './components/ReportsDGII';
import Payroll from './components/Payroll';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // Corregido nombre de estado
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(USE_SUPABASE);

  // Core ERP States
  const [products, setProducts] = useState<Product[]>(() => getLocalStorageState('alegra_products', INITIAL_PRODUCTS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => getLocalStorageState('alegra_invoices', INITIAL_INVOICES));
  const [accounts, setAccounts] = useState<Account[]>(() => getLocalStorageState('alegra_accounts', INITIAL_ACCOUNTS));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => getLocalStorageState('alegra_journal_entries', INITIAL_JOURNAL_ENTRIES));
  const [tables, setTables] = useState<any[]>(() => getLocalStorageState('alegra_tables', INITIAL_TABLES));
  const [orders, setOrders] = useState<any[]>(() => getLocalStorageState('alegra_orders', INITIAL_ORDERS));
  const [expenses, setExpenses] = useState<Expense[]>(() => getLocalStorageState('alegra_expenses', INITIAL_EXPENSES));
  const [employees, setEmployees] = useState<Employee[]>(() => getLocalStorageState('alegra_employees', INITIAL_EMPLOYEES));
  const [payrolls, setPayrolls] = useState<PayrollEntry[]>(() => getLocalStorageState('alegra_payrolls', INITIAL_PAYROLLS));
  const [clients, setClients] = useState<Client[]>(() => getLocalStorageState('alegra_clients', INITIAL_CLIENTS));

  const warehouses: Warehouse[] = INITIAL_WAREHOUSES;

  // ... (Tus efectos de carga y lógica de negocios se mantienen igual) ...

  const menuItems = [
    { id: 'dashboard', label: 'Inicio / KPI', icon: TrendingUp },
    { id: 'facturacion', label: 'Facturación Ventas', icon: FileText },
    { id: 'pos-restaurante', label: 'POS & Restaurante', icon: ShoppingBag },
    { id: 'pos-mobile', label: 'Vista POS Mobile (Simulator)', icon: Smartphone },
    { id: 'contactos', label: 'Contactos', icon: Users },
    { id: 'gastos', label: 'Gastos y Compras', icon: Receipt },
    { id: 'inventario', label: 'Inventario / Almacén', icon: Package },
    { id: 'nomina', label: 'RRHH y Nómina', icon: Users },
    { id: 'contabilidad', label: 'Contabilidad ERP', icon: BookOpen },
    { id: 'reportes-dgii', label: 'Reportes DGII', icon: FileBarChart },
    { id: 'backend', label: 'Preparación Backend', icon: Database },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon },
  ];

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col md:flex-row font-sans selection:bg-blue-100" id="app-wrapper">
      {/* ... (Tu Navbar y Sidebar se mantienen igual) ... */}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-alegra-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-fade-in" id="main-screens-render">
            {activeTab === 'dashboard' && (
              <Dashboard products={products} invoices={invoices} journalEntries={journalEntries} navigateToTab={navigateToTab} />
            )}
            {activeTab === 'facturacion' && (
              <Invoicing invoices={invoices} products={products} clients={clients} onAddInvoice={handleAddInvoice} onCancelInvoice={handleCancelInvoice} />
            )}
            {/* ... resto de tus condiciones ... */}
          </div>
        )}
      </main>
    </div>
  );
}
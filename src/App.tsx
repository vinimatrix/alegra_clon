/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2, TrendingUp, FileText, Package, ShoppingBag, Smartphone,
  BookOpen, Database, Menu, X, User, BellRing, Settings as SettingsIcon,
  Users, Receipt, FileBarChart, Coffee, ChefHat,
  Stethoscope, Calendar, Layers, Grid, LogOut
} from 'lucide-react';

import {
  Product, Invoice, Account, JournalEntry, Client, Expense,
  Employee, PayrollEntry, Warehouse, CashSession, CajaClosureHistory,
  BusinessModuleConfig, AppointmentTurn, PatientRecord, Project, ProjectTask
} from './types';

import {
  INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES,
  INITIAL_TABLES, INITIAL_ORDERS, INITIAL_WAREHOUSES, INITIAL_CLIENTS,
  INITIAL_EXPENSES, INITIAL_EMPLOYEES, INITIAL_PAYROLLS,
  INITIAL_MODULES_CONFIG, INITIAL_APPOINTMENTS, INITIAL_PATIENT_RECORDS, INITIAL_PROJECTS, INITIAL_PROJECT_TASKS,
  getLocalStorageState, saveLocalStorageState
} from './lib/mockData';

import { api, isSupabaseActive, toCamelCase } from './services/api';
import { supabase } from './services/supabaseClient';

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
import KitchenKDS from './components/KitchenKDS';
import KitchenManager from './components/KitchenManager';

import ActiveModules from './components/ActiveModules';
import AppointmentsModule from './components/AppointmentsModule';
import PatientRecordsModule from './components/PatientRecordsModule';
import ProjectsModule from './components/ProjectsModule';
import SupabaseAuthGate from './components/SupabaseAuthGate';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Supabase Authentication states
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [offlineBypass, setOfflineBypass] = useState(() => {
    return localStorage.getItem('alegra_offline_bypass') === 'true';
  });

  // Listen for Supabase session and state changes
  useEffect(() => {
    if (!isSupabaseActive()) {
      setUser(null);
      setCheckingAuth(false);
      return;
    }

    setCheckingAuth(true);
    // Get current session on mount safely
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    }).catch(err => {
      console.warn('Error fetching initial auth session:', err);
      setCheckingAuth(false);
    });

    // Subscribe to auth events (SIGN_IN, SIGN_OUT, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔑 [Supabase Auth Event] Evento:', _event, 'Email:', session?.user?.email);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    if (isSupabaseActive()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error signing out:', e);
      }
    }
    setUser(null);
    setOfflineBypass(false);
    localStorage.removeItem('alegra_offline_bypass');
  };

  // Core ERP States with localStorage sync
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
  const [categories, setCategories] = useState<string[]>(() => getLocalStorageState('alegra_categories', ['Platos', 'Bebidas', 'Tecnología', 'Hogar']));
  const [taxes, setTaxes] = useState<any[]>(() => getLocalStorageState('alegra_taxes', [
    { id: 'tax-1', name: 'ITBIS 18%', rate: 18, isDefault: true },
    { id: 'tax-2', name: 'ITBIS Simplificado 12%', rate: 12 },
    { id: 'tax-3', name: 'Impuesto Selectivo 10%', rate: 10 },
    { id: 'tax-4', name: 'Exento 0%', rate: 0 }
  ]));

  // Activable Industry-Specific Business Modules States
  const [modulesConfig, setModulesConfig] = useState<BusinessModuleConfig[]>(() => getLocalStorageState('alegra_modules_config', INITIAL_MODULES_CONFIG));
  const [appointments, setAppointments] = useState<AppointmentTurn[]>(() => getLocalStorageState('alegra_appointments', INITIAL_APPOINTMENTS));
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(() => getLocalStorageState('alegra_patient_records', INITIAL_PATIENT_RECORDS));
  const [projects, setProjects] = useState<Project[]>(() => getLocalStorageState('alegra_projects', INITIAL_PROJECTS));
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(() => getLocalStorageState('alegra_project_tasks', INITIAL_PROJECT_TASKS));

  // Cash Register (Caja) states
  const [cajaSession, setCajaSession] = useState<CashSession>(() => {
    const local = localStorage.getItem('alegra_caja_session');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return {
      id: '',
      isOpen: false,
      openedAt: '',
      initialBalance: 0,
      expectedBalance: 0,
      salesCash: 0,
      salesCard: 0,
      salesTransfer: 0
    };
  });

  const [cajaHistory, setCajaHistory] = useState<CajaClosureHistory[]>(() => {
    const local = localStorage.getItem('alegra_caja_history');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return [];
  });

  const warehouses: Warehouse[] = INITIAL_WAREHOUSES;

  // Supabase Live Data Syncing Trigger
  useEffect(() => {
    async function initData() {
      if (isSupabaseActive()) {
        setIsLoading(true);
        try {
          const [
            dbProducts, dbInvoices, dbAccounts, dbJournalEntries,
            dbTables, dbOrders, dbExpenses, dbEmployees, dbPayrolls, dbClients
          ] = await Promise.all([
            api.getProducts().catch(e => { console.warn('Error loading products', e); return null; }),
            api.getInvoices().catch(e => { console.warn('Error loading invoices', e); return null; }),
            api.getAccounts().catch(e => { console.warn('Error loading accounts', e); return null; }),
            api.getJournalEntries().catch(e => { console.warn('Error loading journal entries', e); return null; }),
            api.getTables().catch(e => { console.warn('Error loading tables', e); return null; }),
            api.getOrders().catch(e => { console.warn('Error loading orders', e); return null; }),
            api.getExpenses().catch(e => { console.warn('Error loading expenses', e); return null; }),
            api.getEmployees().catch(e => { console.warn('Error loading employees', e); return null; }),
            api.getPayrolls().catch(e => { console.warn('Error loading payrolls', e); return null; }),
            api.getClients().catch(e => { console.warn('Error loading clients', e); return null; }),
          ]);

          if (dbProducts !== null) setProducts(dbProducts);
          if (dbInvoices !== null) setInvoices(dbInvoices);
          if (dbAccounts !== null) setAccounts(dbAccounts);
          if (dbJournalEntries !== null) setJournalEntries(dbJournalEntries);
          if (dbTables !== null && dbTables.length > 0) setTables(dbTables);
          if (dbOrders !== null) setOrders(dbOrders);
          if (dbExpenses !== null) setExpenses(dbExpenses);
          if (dbEmployees !== null) setEmployees(dbEmployees);
          if (dbPayrolls !== null) setPayrolls(dbPayrolls);
          if (dbClients !== null) setClients(dbClients);
        } catch (error) {
          console.error('Error synchronizing with Supabase:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    initData();
  }, []);

  // Supabase Real-time postgres changes listener
  useEffect(() => {
    if (!isSupabaseActive()) return;

    // Generate unique channel names per hook installation to avoid callbacks-after-subscribe errors on fast re-renders
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const ordersChannelName = `kds_orders_channel_${randomSuffix}`;
    const tablesChannelName = `kds_tables_channel_${randomSuffix}`;

    console.log(`🔌 [Realtime Supabase] Inicializando canales únicos: ${ordersChannelName}, ${tablesChannelName}`);

    const ordersChannel = supabase
      .channel(ordersChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          console.log('⚡ [Realtime Supabase] Evento de Orden:', payload);
          
          if (payload.eventType === 'INSERT') {
            const rawOrder = toCamelCase(payload.new);
            const newOrder = rawOrder.status === 'cancelada' ? { ...rawOrder, status: 'cobrada' } : rawOrder;
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === newOrder.id);
              if (exists) return prev;
              
              // Despachar notificación nativa de Navegador para alerta de cocina
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(`👨‍🍳 Nueva Comanda: Mesa ${newOrder.tableName || 'Mostrador'}`, {
                    body: `Pedido #${newOrder.id.substring(0, 6)} • Modo: ${newOrder.orderMode || 'Salón'}`,
                    icon: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
                    requireInteraction: true,
                  });
                } catch (e) {
                  console.warn('Fallo al despachar notificación de comando en tiempo real:', e);
                }
              }
              return [newOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const rawOrder = toCamelCase(payload.new);
            const updatedOrder = rawOrder.status === 'cancelada' ? { ...rawOrder, status: 'cobrada' } : rawOrder;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .subscribe();

    const tablesChannel = supabase
      .channel(tablesChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload: any) => {
          console.log('⚡ [Realtime Supabase] Evento de Mesa:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const tableItem = toCamelCase(payload.new);
            if (tableItem.id.startsWith('pos-quick')) {
              return;
            }
            setTables((prev) => {
              const exists = prev.some((t) => t.id === tableItem.id);
              if (exists) {
                return prev.map((t) => (t.id === tableItem.id ? tableItem : t));
              }
              return [...prev, tableItem];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTables((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`🔌 [Realtime Supabase] Desuscribiendo canales: ${ordersChannelName}, ${tablesChannelName}`);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tablesChannel);
    };
  }, []);

  // Effects to save state changes automatically
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

  useEffect(() => {
    saveLocalStorageState('alegra_expenses', expenses);
  }, [expenses]);

  useEffect(() => {
    saveLocalStorageState('alegra_employees', employees);
  }, [employees]);

  useEffect(() => {
    saveLocalStorageState('alegra_payrolls', payrolls);
  }, [payrolls]);

  useEffect(() => {
    saveLocalStorageState('alegra_clients', clients);
  }, [clients]);

  useEffect(() => {
    saveLocalStorageState('alegra_categories', categories);
  }, [categories]);

  useEffect(() => {
    saveLocalStorageState('alegra_modules_config', modulesConfig);
  }, [modulesConfig]);

  useEffect(() => {
    saveLocalStorageState('alegra_appointments', appointments);
  }, [appointments]);

  useEffect(() => {
    saveLocalStorageState('alegra_patient_records', patientRecords);
  }, [patientRecords]);

  useEffect(() => {
    saveLocalStorageState('alegra_projects', projects);
  }, [projects]);

  useEffect(() => {
    saveLocalStorageState('alegra_project_tasks', projectTasks);
  }, [projectTasks]);

  // Action Handlers for Custom Activable Business Modules
  const handleAddAppointment = (apt: AppointmentTurn) => {
    setAppointments(prev => [apt, ...prev]);
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentTurn['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddPatientRecord = (rec: PatientRecord) => {
    setPatientRecords(prev => [rec, ...prev]);
  };

  const handleUpdatePatientRecord = (id: string, updated: PatientRecord) => {
    setPatientRecords(prev => prev.map(r => r.id === id ? updated : r));
  };

  const handleDeletePatientRecord = (id: string) => {
    setPatientRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleAddProject = (proj: Project) => {
    setProjects(prev => [proj, ...prev]);
  };

  const handleUpdateProject = (id: string, updated: Project) => {
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleUpdateProjectProgress = (id: string, progress: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, progress } : p));
  };

  const handleAddProjectTask = (t: ProjectTask) => {
    setProjectTasks(prev => [t, ...prev]);
  };

  const handleUpdateTaskStatus = (id: string, status: ProjectTask['status']) => {
    setProjectTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleToggleModule = (id: BusinessModuleConfig['id']) => {
    setModulesConfig(prev => prev.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m));
  };

  const handleApplyPreset = (preset: 'salon' | 'clinic' | 'agency' | 'full' | 'reset') => {
    setModulesConfig(prev => prev.map(m => {
      let isEnabled = false;
      if (preset === 'full') isEnabled = true;
      else if (preset === 'salon' && m.id === 'citas_turnos') isEnabled = true;
      else if (preset === 'clinic' && (m.id === 'citas_turnos' || m.id === 'records_medicos')) isEnabled = true;
      else if (preset === 'agency' && m.id === 'gestion_proyectos') isEnabled = true;
      return { ...m, isEnabled };
    }));
  };

  useEffect(() => {
    saveLocalStorageState('alegra_taxes', taxes);
  }, [taxes]);

  useEffect(() => {
    localStorage.setItem('alegra_caja_session', JSON.stringify(cajaSession));
  }, [cajaSession]);

  useEffect(() => {
    localStorage.setItem('alegra_caja_history', JSON.stringify(cajaHistory));
  }, [cajaHistory]);

  // Seeder to populate clean custom Supabase DB on demand
  const handleSeedSupabase = async () => {
    if (!window.confirm('¿Quieres rellenar tu base de datos de Supabase con datos semilla de muestra para probar Alegra de inmediato?')) {
      return;
    }
    setIsLoading(true);
    try {
      // Seed clients
      for (const client of INITIAL_CLIENTS) {
        await api.createClient(client);
      }
      // Seed products
      for (const prod of INITIAL_PRODUCTS) {
        await api.createProduct(prod);
      }
      // Seed invoices
      for (const inv of INITIAL_INVOICES) {
        await api.createInvoice(inv);
      }
      // Seed expenses
      for (const exp of INITIAL_EXPENSES) {
        await api.createExpense(exp);
      }
      // Seed employees
      for (const emp of INITIAL_EMPLOYEES) {
        await api.createEmployee(emp);
      }
      // Seed accounts
      for (const acc of INITIAL_ACCOUNTS) {
        await api.createAccount(acc);
      }
      alert('¡Base de datos sembrada con éxito! La página se recargará ahora.');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Error sembrando datos: ' + (e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCaja = (initialBalance: number) => {
    setCajaSession({
      id: `session-${Date.now()}`,
      isOpen: true,
      openedAt: new Date().toISOString(),
      initialBalance,
      expectedBalance: initialBalance,
      salesCash: 0,
      salesCard: 0,
      salesTransfer: 0
    });
  };

  const handleCloseCaja = (actualBalance: number) => {
    if (!cajaSession.isOpen) return;
    
    // Calculate final dynamic sales in this shift
    const invoicesSinceOpen = invoices.filter(inv => {
      return new Date(inv.issueDate) >= new Date(cajaSession.openedAt) && inv.status === 'pagada';
    });

    const salesCash = invoicesSinceOpen
      .filter(inv => inv.paymentMethod?.toLowerCase().includes('efectiv') || !inv.paymentMethod)
      .reduce((sum, inv) => sum + inv.total, 0);

    const salesCard = invoicesSinceOpen
      .filter(inv => inv.paymentMethod?.toLowerCase().includes('tarjeta'))
      .reduce((sum, inv) => sum + inv.total, 0);

    const salesTransfer = invoicesSinceOpen
      .filter(inv => inv.paymentMethod?.toLowerCase().includes('transfe') || inv.paymentMethod?.toLowerCase().includes('banco') || inv.paymentMethod?.toLowerCase().includes('deposito'))
      .reduce((sum, inv) => sum + inv.total, 0);

    const expectedBalance = cajaSession.initialBalance + salesCash;
    const difference = actualBalance - expectedBalance;

    const finishedSession: CajaClosureHistory = {
      id: cajaSession.id,
      openedAt: cajaSession.openedAt,
      closedAt: new Date().toISOString(),
      initialBalance: cajaSession.initialBalance,
      expectedBalance,
      actualBalance,
      difference,
      salesCash,
      salesCard,
      salesTransfer,
      receiptsCount: invoicesSinceOpen.length
    };

    setCajaHistory(prev => [finishedSession, ...prev]);

    // Reset current active session
    setCajaSession({
      id: '',
      isOpen: false,
      openedAt: '',
      initialBalance: 0,
      expectedBalance: 0,
      salesCash: 0,
      salesCard: 0,
      salesTransfer: 0
    });
  };


  // Load active theme during initial component mount
  useEffect(() => {
    const activeTheme = localStorage.getItem('alegra_theme') || 'default';
    if (activeTheme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
  }, []);

  // Handlers for state updates
  const handleAddInvoice = async (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    if (isSupabaseActive()) {
      try {
        await api.createInvoice(newInvoice);
      } catch (e) {
        console.error('Error saving invoice to Supabase:', e);
      }
    }
  };

  const handleCancelInvoice = async (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'anulada' as const } : inv));
    if (isSupabaseActive()) {
      try {
        await api.updateInvoice(id, { status: 'anulada' });
      } catch (e) {
        console.error('Error updating invoice status to Supabase:', e);
      }
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    if (isSupabaseActive()) {
      try {
        await api.createProduct(newProduct);
      } catch (e) {
        console.error('Error saving product to Supabase:', e);
      }
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (isSupabaseActive()) {
      try {
        await api.updateProduct(updatedProduct.id, updatedProduct);
      } catch (e) {
        console.error('Error updating product in Supabase:', e);
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (isSupabaseActive()) {
      try {
        await api.deleteProduct(productId);
      } catch (e) {
        console.error('Error deleting product from Supabase:', e);
      }
    }
  };

  const handleAdjustStock = async (productId: string, adjustmentQty: number, reason: string) => {
    setProducts(prev => {
      const updated = prev.map(prod => prod.id === productId ? { ...prod, stock: Math.max(0, prod.stock + adjustmentQty) } : prod);
      const targetProd = updated.find(p => p.id === productId);
      if (targetProd && isSupabaseActive()) {
        api.updateProduct(productId, { stock: targetProd.stock }).catch(e => console.error(e));
      }
      return updated;
    });
  };

  const handleAddContact = async (contact: Client) => {
    if (!contact.id) {
      contact.id = `c-${Date.now()}`;
    }
    setClients(prev => [...prev, contact]);
    if (isSupabaseActive()) {
      try {
        await api.createClient(contact);
      } catch (e) {
        console.error('Error saving client to Supabase:', e);
      }
    }
  };

  const handleUpdateContact = async (contact: Client) => {
    setClients(prev => prev.map(c => c.id === contact.id ? contact : c));
    if (isSupabaseActive()) {
      try {
        await api.updateClient(contact.id, contact);
      } catch (e) {
        console.error('Error updating client in Supabase:', e);
      }
    }
  };

  const handleDeleteContact = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (isSupabaseActive()) {
      try {
        await api.deleteClient(id);
      } catch (e) {
        console.error('Error deleting client in Supabase:', e);
      }
    }
  };

  const handleAddExpense = async (expense: Expense) => {
    if (!expense.id) {
      expense.id = `exp-${Date.now()}`;
    }
    setExpenses(prev => [expense, ...prev]);
    if (isSupabaseActive()) {
      try {
        await api.createExpense(expense);
      } catch (e) {
        console.error('Error saving expense to Supabase:', e);
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    if (isSupabaseActive()) {
      try {
        await api.deleteExpense(id);
      } catch (e) {
        console.error('Error deleting expense in Supabase:', e);
      }
    }
  };

  const handleAddEmployee = async (e: Employee) => {
    if (!e.id) {
      e.id = `emp-${Date.now()}`;
    }
    setEmployees(prev => [...prev, e]);
    if (isSupabaseActive()) {
      try {
        await api.createEmployee(e);
      } catch (err) {
        console.error('Error saving employee to Supabase:', err);
      }
    }
  };

  const handleUpdateEmployee = async (id: string, e: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? e : emp));
    if (isSupabaseActive()) {
      try {
        await api.updateEmployee(id, e);
      } catch (err) {
        console.error('Error updating employee in Supabase:', err);
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    if (isSupabaseActive()) {
      try {
        await api.deleteEmployee(id);
      } catch (err) {
        console.error('Error deleting employee in Supabase:', err);
      }
    }
  };

  const handleGeneratePayroll = async (period: string) => {
    const activeEmployees = employees.filter(emp => emp.status === 'activo');
    
    const newEntries: PayrollEntry[] = activeEmployees.map(emp => {
      const receivesTss = emp.recibeTss !== false;
      const receivesAfp = receivesTss && emp.recibeAfp !== false;
      const receivesSfs = receivesTss && emp.recibeSeguroMedico !== false;

      const sfsEmployee = receivesSfs ? emp.salary * 0.0304 : 0;
      const sfsEmployer = receivesSfs ? emp.salary * 0.0709 : 0;
      const afpEmployee = receivesAfp ? emp.salary * 0.0287 : 0;
      const afpEmployer = receivesAfp ? emp.salary * 0.0710 : 0;
      
      const deductions = [];
      if (receivesSfs) {
        deductions.push({
          concept: 'SFS',
          employeeRate: 3.04,
          employerRate: 7.09,
          employeeAmount: sfsEmployee,
          employerAmount: sfsEmployer
        });
      }
      if (receivesAfp) {
        deductions.push({
          concept: 'AFP',
          employeeRate: 2.87,
          employerRate: 7.10,
          employeeAmount: afpEmployee,
          employerAmount: afpEmployer
        });
      }

      const totalDeductions = sfsEmployee + afpEmployee;
      const netSalary = emp.salary - totalDeductions;

      return {
        id: `pay-${emp.id}-${period}`,
        employeeId: emp.id,
        employeeName: emp.name,
        period,
        grossSalary: emp.salary,
        deductions,
        totalDeductions,
        netSalary,
        status: 'pagada' as const
      };
    });

    setPayrolls(prev => [
      ...prev.filter(p => p.period !== period),
      ...newEntries
    ]);

    if (isSupabaseActive()) {
      for (const pay of newEntries) {
        api.createPayroll(pay).catch(e => console.error('Error creating payroll:', e));
      }
    }
  };

  const handleAddJournalEntry = async (entry: JournalEntry) => {
    setJournalEntries(prev => [entry, ...prev]);

    // Dynamically update the account balances during double entries
    setAccounts(prevAccounts => {
      return prevAccounts.map(acc => {
        let balanceChange = 0;
        const linesForAcc = entry.lines.filter(l => l.accountCode === acc.code);
        for (const line of linesForAcc) {
          const debitVal = line.debit;
          const creditVal = line.credit;
          
          if (acc.type === 'activo' || acc.type === 'egreso') {
            balanceChange += (debitVal - creditVal);
          } else {
            balanceChange += (creditVal - debitVal);
          }
        }
        return { ...acc, balance: acc.balance + balanceChange };
      });
    });

    if (isSupabaseActive()) {
      try {
        await api.createJournalEntry(entry);
      } catch (e) {
        console.error('Error saving journal entry:', e);
      }
    }
  };

  const handleUpdateTables = (updatedTables: any[]) => {
    if (isSupabaseActive()) {
      for (const t of updatedTables) {
        api.updateTable(t.id, t).catch(e => console.warn('Error updating table:', e));
      }
    }
    setTables(updatedTables);
  };

  const handleUpdateOrders = (updatedOrders: any[]) => {
    setOrders(updatedOrders);
    if (isSupabaseActive()) {
      for (const o of updatedOrders) {
        api.updateOrder(o.id, o).catch(async (e) => {
          try {
            await api.createOrder(o);
          } catch(err) {
            console.warn('Error creating comanda in Supabase fallback:', err);
          }
        });
      }
    }
  };


  const menuItems = [
    { id: 'dashboard', label: 'Inicio / KPI', icon: TrendingUp },
    { id: 'active-modules', label: 'Módulos de Negocio', icon: Grid },
    ...(modulesConfig.find(m => m.id === 'citas_turnos')?.isEnabled
      ? [{ id: 'citas-turnos', label: 'Citas & Turnos', icon: Calendar }]
      : []),
    ...(modulesConfig.find(m => m.id === 'records_medicos')?.isEnabled
      ? [{ id: 'records-medicos', label: 'Pacientes & Records', icon: Stethoscope }]
      : []),
    ...(modulesConfig.find(m => m.id === 'gestion_proyectos')?.isEnabled
      ? [{ id: 'gestion-proyectos', label: 'Proyectos & Gantt', icon: Layers }]
      : []),
    { id: 'facturacion', label: 'Facturación Ventas', icon: FileText },
    { id: 'pos-restaurante', label: 'POS & Restaurante', icon: ShoppingBag },
    { id: 'pos-mobile', label: 'Vista POS Mobile (Simulator)', icon: Smartphone },
    { id: 'cocina-kds', label: 'Pantalla de Cocina (KDS)', icon: Coffee },
    { id: 'kitchen-manager', label: 'Gestión Cocina (Admin)', icon: ChefHat },
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

  const currentTabLabel = menuItems.find(item => item.id === activeTab)?.label || 'Alegra';

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans" id="auth-loading-spinner">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase animate-pulse">Cargando Seguridad Supabase...</p>
      </div>
    );
  }

  if (isSupabaseActive() && !user && !offlineBypass) {
    return (
      <SupabaseAuthGate
        isBackendActive={true}
        onLoginSuccess={(u) => setUser(u)}
        onBypassOffline={() => {
          setOfflineBypass(true);
          localStorage.setItem('alegra_offline_bypass', 'true');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-alegra-bg flex flex-col md:flex-row font-sans selection:bg-blue-100 text-gray-800" id="app-wrapper">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-alegra-secondary text-white shrink-0 shadow-lg" id="sidebar">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="bg-alegra-primary p-2 rounded-lg text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Alegra Clon</h1>
            <p className="text-[10px] text-white/60 tracking-wider uppercase font-mono">ERP dominicano</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => navigateToTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-alegra-primary text-white shadow'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs text-white/50 space-y-2 font-mono">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isSupabaseActive() ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
            <span>Base de datos activa: {isSupabaseActive() ? 'Supabase' : 'Local'}</span>
          </div>
          <div className="flex items-center justify-between gap-1 group">
            <span className="truncate max-w-[120px] text-white/80" title={user?.email || 'demo@alegra.com'}>
              {user?.email || 'demo@alegra.com'}
            </span>
            {isSupabaseActive() && (
              <button 
                onClick={handleLogout}
                className="text-white/40 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut size={12} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-alegra-secondary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-alegra-primary" />
          <span className="font-display font-bold text-base">Alegra Clon</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80 font-medium">
            {currentTabLabel}
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 px-2 rounded hover:bg-white/15"
            aria-label="Menú principal"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-alegra-secondary border-b border-white/15 animate-fade-in fixed top-[50px] left-0 w-full z-40 max-h-[calc(100vh-50px)] overflow-y-auto shadow-xl">
          <nav className="p-4 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-alegra-primary text-white'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-4 border-t border-white/10 text-xs text-white/50 space-y-2 font-mono px-4 pb-4">
              <p className="text-white/85">User: {user?.email || 'demo@alegra.com'}</p>
              <p>Modo: {isSupabaseActive() ? 'Nube Supabase' : 'Local / LocalStorage'}</p>
              {isSupabaseActive() && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 w-full py-1.5 bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-200 rounded font-sans font-bold text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <LogOut size={12} />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* DESKTOP HEADER */}
        <header className="hidden md:flex bg-white h-16 border-b border-gray-200 items-center justify-between px-8 shrink-0">
          <h2 className="font-display font-semibold text-xl text-gray-800">{currentTabLabel}</h2>
          <div className="flex items-center gap-4">
            <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 relative" aria-label="Notificaciones">
              <BellRing className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-alegra-primary/10 flex items-center justify-center text-alegra-primary font-bold uppercase">
                {(user?.email?.[0] || 'V')}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700 max-w-[150px] truncate" title={user?.email || 'demo@alegra.com'}>
                  {user?.email || 'demo@alegra.com'}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {isSupabaseActive() ? 'Supabase Admin' : 'Administrador Local'}
                </p>
              </div>
              {isSupabaseActive() && (
                <button
                  onClick={handleLogout}
                  className="p-1 px-1.5 ml-1 bg-red-50 hover:bg-red-100/85 text-red-600 rounded-lg transition-all border border-red-200/50 cursor-pointer flex items-center gap-1"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE SCREENS */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-alegra-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="animate-fade-in" id="main-screens-render">
              {isSupabaseActive() && products.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="text-sm text-amber-800">
                    <span className="font-bold">⚡ Conectado a tu nube de Supabase:</span> Tu catálogo en la nube está vacío. Si lo deseas, puedes sembrar datos demo de muestra al instante para probar todas las funciones.
                  </div>
                  <button
                    onClick={handleSeedSupabase}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    Sembrar datos semilla
                  </button>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <Dashboard products={products} invoices={invoices} journalEntries={journalEntries} navigateToTab={navigateToTab} />
              )}
              {activeTab === 'active-modules' && (
                <ActiveModules 
                  modulesConfig={modulesConfig} 
                  onToggleModule={handleToggleModule} 
                  onApplyPreset={handleApplyPreset} 
                />
              )}
              {activeTab === 'citas-turnos' && (
                <AppointmentsModule 
                  appointments={appointments} 
                  onAddAppointment={handleAddAppointment} 
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus} 
                  onDeleteAppointment={handleDeleteAppointment} 
                  clients={clients} 
                />
              )}
              {activeTab === 'records-medicos' && (
                <PatientRecordsModule 
                  records={patientRecords} 
                  onAddRecord={handleAddPatientRecord} 
                  onUpdateRecord={handleUpdatePatientRecord}
                  onDeleteRecord={handleDeletePatientRecord} 
                  clients={clients} 
                />
              )}
              {activeTab === 'gestion-proyectos' && (
                <ProjectsModule 
                  projects={projects} 
                  tasks={projectTasks} 
                  onAddProject={handleAddProject} 
                  onUpdateProject={handleUpdateProject}
                  onUpdateProjectProgress={handleUpdateProjectProgress} 
                  onAddProjectTask={handleAddProjectTask} 
                  onUpdateTaskStatus={handleUpdateTaskStatus} 
                  clients={clients} 
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
                  invoices={invoices}
                  onAddInvoice={handleAddInvoice}
                  onUpdateTables={handleUpdateTables}
                  onUpdateOrders={handleUpdateOrders}
                  cajaSession={cajaSession}
                  cajaHistory={cajaHistory}
                  onOpenCaja={handleOpenCaja}
                  onCloseCaja={handleCloseCaja}
                  categories={categories}
                  onUpdateCategories={setCategories}
                  taxes={taxes}
                  onUpdateTaxes={setTaxes}
                />
              )}
              {activeTab === 'pos-mobile' && (
                <POSMobileSimulator 
                  products={products} 
                  tables={tables}
                  orders={orders}
                  onUpdateOrders={handleUpdateOrders}
                  onUpdateTables={handleUpdateTables}
                  onAddJournalEntry={handleAddJournalEntry}
                  onAddInvoice={handleAddInvoice}
                />
              )}
              {activeTab === 'cocina-kds' && (
                <KitchenKDS 
                  orders={orders}
                  tables={tables}
                  products={products}
                  onUpdateOrders={handleUpdateOrders}
                  onUpdateTables={handleUpdateTables}
                />
              )}
              {activeTab === 'kitchen-manager' && (
                <KitchenManager 
                  orders={orders}
                  tables={tables}
                  products={products}
                  onUpdateOrders={handleUpdateOrders}
                  onUpdateTables={handleUpdateTables}
                />
              )}
              {activeTab === 'contactos' && (
                <Contacts 
                  clients={clients} 
                  onAddContact={handleAddContact} 
                  onUpdateContact={handleUpdateContact} 
                  onDeleteContact={handleDeleteContact} 
                />
              )}
              {activeTab === 'gastos' && (
                <Expenses 
                  expenses={expenses} 
                  clients={clients} 
                  onAddExpense={handleAddExpense} 
                  onDeleteExpense={handleDeleteExpense} 
                />
              )}
              {activeTab === 'inventario' && (
                <Inventory 
                  products={products} 
                  warehouses={warehouses} 
                  onAdjustStock={handleAdjustStock} 
                  onAddProduct={handleAddProduct} 
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  invoices={invoices}
                  orders={orders}
                  categories={categories}
                  onUpdateCategories={setCategories}
                  taxes={taxes}
                  onUpdateTaxes={setTaxes}
                />
              )}
              {activeTab === 'nomina' && (
                <Payroll 
                  employees={employees} 
                  payrolls={payrolls} 
                  onAddEmployee={handleAddEmployee} 
                  onUpdateEmployee={handleUpdateEmployee} 
                  onDeleteEmployee={handleDeleteEmployee} 
                  onGeneratePayroll={handleGeneratePayroll} 
                />
              )}
              {activeTab === 'contabilidad' && (
                <Accounting 
                  accounts={accounts} 
                  journalEntries={journalEntries} 
                  onAddJournalEntry={handleAddJournalEntry} 
                  onUpdateAccounts={setAccounts}
                />
              )}
              {activeTab === 'reportes-dgii' && (
                <ReportsDGII invoices={invoices} expenses={expenses} />
              )}
              {activeTab === 'backend' && (
                <BackendPrep />
              )}
              {activeTab === 'settings' && (
                <Settings />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  FileText, 
  Table, 
  ShoppingBag, 
  Bell, 
  ArrowRight
} from 'lucide-react';
import { Product, Invoice, JournalEntry } from '../types';

interface DashboardProps {
  products: Product[];
  invoices: Invoice[];
  journalEntries: JournalEntry[];
  navigateToTab: (tab: string) => void;
}

export default function Dashboard({ products, invoices, journalEntries, navigateToTab }: DashboardProps) {
  const [chartPeriod, setChartPeriod] = useState<'semanal' | 'mensual'>('semanal');

  // Calculate metrics based on real state!
  const totalIncome = invoices
    .filter(inv => inv.status === 'pagada')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingIncome = invoices
    .filter(inv => inv.status === 'pendiente')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Gastos are derived from contabilidad journal entries debits on codes starting with 5 (Egresos/Gastos)
  const totalExpenses = journalEntries.reduce((sum, entry) => {
    const expenseLines = entry.lines.filter(l => l.accountCode.startsWith('5'));
    const expenseDebit = expenseLines.reduce((acc, l) => acc + l.debit, 0);
    return sum + expenseDebit;
  }, 0);

  // Valor total del almacén/inventario
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Interactive mock representation for chart:
  const weeklyData = [
    { name: 'Lun', ventas: 12000, gastos: 4500 },
    { name: 'Mar', ventas: 14500, gastos: 5200 },
    { name: 'Mié', ventas: totalIncome * 0.2, gastos: totalExpenses * 0.15 },
    { name: 'Jue', ventas: 18000, gastos: 6100 },
    { name: 'Vie', ventas: totalIncome * 0.3, gastos: totalExpenses * 0.35 },
    { name: 'Sáb', ventas: totalIncome * 0.4, gastos: totalExpenses * 0.25 },
    { name: 'Dom', ventas: 15400, gastos: 3900 }
  ];

  const monthlyData = [
    { name: 'Ene', ventas: 120000, gastos: 45000 },
    { name: 'Feb', ventas: 145000, gastos: 62000 },
    { name: 'Mar', ventas: 198000, gastos: 71000 },
    { name: 'Abr', ventas: 175000, gastos: 83030 },
    { name: 'May', ventas: totalIncome + 50000, gastos: totalExpenses + 25000 }
  ];

  const currentChartData = chartPeriod === 'semanal' ? weeklyData : monthlyData;

  // Find max value to scale heights properly
  const maxVal = Math.max(...currentChartData.map(d => Math.max(d.ventas, d.gastos))) || 10000;

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display" id="dash-title">
            Panel de Control
          </h1>
          <p className="text-sm text-gray-500">
            Resumen en tiempo real del estado de tu negocio, ventas POS, mesas y balances contables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 rounded-full py-1 font-medium border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Conexión Local Estable
          </span>
          <span className="text-xs text-gray-400 font-mono">2026-05-26 UTC</span>
        </div>
      </div>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Ventas Pagadas */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between" id="kpi-sales">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas Cobradas (Mes)</p>
              <h3 className="text-2xl font-bold font-display text-gray-900 mt-1">
                ${totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>+14.5% vs mes anterior</span>
            <span className="text-gray-400 font-normal">Facturación</span>
          </div>
        </div>

        {/* Cuentas por Cobrar / Pendientes */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between" id="kpi-pending">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cuentas por Cobrar</p>
              <h3 className="text-2xl font-bold font-display text-gray-900 mt-1">
                ${pendingIncome.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-amber-600 font-medium">
            <span>{invoices.filter(i => i.status === 'pendiente').length} Facturas pendientes</span>
            <span className="text-gray-400 font-normal">Crédito</span>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between" id="kpi-expenses">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Egresos / Gastos (Mes)</p>
              <h3 className="text-2xl font-bold font-display text-gray-900 mt-1">
                ${totalExpenses.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-rose-500 font-medium">
            <span>Alquiler, Nómina y Contabilidad</span>
            <span className="text-gray-400 font-normal">Gastos de Operación</span>
          </div>
        </div>

        {/* Valor de Inventario */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between" id="kpi-inventory">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor total Almacén</p>
              <h3 className="text-2xl font-bold font-display text-gray-900 mt-1">
                ${totalInventoryValue.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-indigo-500 font-medium1">
            <span>{products.reduce((acc, p) => acc + p.stock, 0)} unidades físicas</span>
            <span className="text-gray-400 font-normal">{products.length} Productos</span>
          </div>
        </div>
      </div>

      {/* Main Graph & Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Custom Sales vs Expenses Graph */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between" id="sales-expenses-chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-alegra-secondary font-display">Estadística Financiera</h2>
              <p className="text-xs text-gray-400">Comparativa directa de Ingresos Recudados vs Gastos Asentados</p>
            </div>
            <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => setChartPeriod('semanal')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartPeriod === 'semanal' ? 'bg-white text-alegra-primary shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                id="btn-period-week"
              >
                Semanal
              </button>
              <button 
                onClick={() => setChartPeriod('mensual')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartPeriod === 'mensual' ? 'bg-white text-alegra-primary shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                id="btn-period-month"
              >
                Mensual
              </button>
            </div>
          </div>

          {/* Interactive Custom SVG Column Chart styled with Tailwind */}
          <div className="h-68 w-full relative sm:px-4 flex items-end justify-between border-b border-gray-100 pb-2">
            
            {/* Y axis gridlines and helper prices */}
            <div className="absolute left-0 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-dashed border-gray-100 w-full text-[10px] text-gray-300 pt-1 flex justify-between">
                <span>${(maxVal).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t border-dashed border-gray-100 w-full text-[10px] text-gray-300 pt-1 flex justify-between">
                <span>${(maxVal * 0.66).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t border-dashed border-gray-100 w-full text-[10px] text-gray-300 pt-1 flex justify-between">
                <span>${(maxVal * 0.33).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t border-dashed border-gray-100 w-full"></div>
            </div>

            {/* Custom Interactive Bars representing the weeks/months */}
            <div className="w-full flex justify-around items-end h-[85%] z-10" id="svg-bar-chart">
              {currentChartData.map((data, idx) => {
                const salesHeight = (data.ventas / maxVal) * 100;
                const expensesHeight = (data.gastos / maxVal) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group relative w-12 sm:w-16">
                    {/* Hover tooltip */}
                    <div className="absolute -top-16 bg-alegra-secondary text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-md min-w-[110px]">
                      <p className="font-bold border-b border-gray-700 pb-0.5 mb-1 text-center">{data.name}</p>
                      <p className="flex justify-between text-blue-400"><span>Ventas:</span> <span>${data.ventas.toLocaleString()}</span></p>
                      <p className="flex justify-between text-rose-400"><span>Gastos:</span> <span>${data.gastos.toLocaleString()}</span></p>
                    </div>

                    <div className="flex gap-1 items-end justify-center w-full h-40">
                      {/* Sales Bar */}
                      <div 
                        style={{ height: `${Math.max(salesHeight, 3)}%` }} 
                        className="w-4 bg-blue-600 hover:bg-blue-700 rounded-t-sm transition-all duration-300 relative cursor-pointer"
                      ></div>
                      {/* Expenses Bar */}
                      <div 
                        style={{ height: `${Math.max(expensesHeight, 3)}%` }} 
                        className="w-4 bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all duration-300 relative cursor-pointer"
                      ></div>
                    </div>
                    {/* X axis Label */}
                    <span className="text-[10px] text-gray-400 font-mono font-medium">{data.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500 border-t border-gray-50 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-600 rounded-xs"></span>
              <span>Ingresos por Ventas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded-xs"></span>
              <span>Egresos / Gastos</span>
            </div>
          </div>
        </div>

        {/* Right column: Right Sidebar Alerts & Operations */}
        <div className="space-y-6">
          
          {/* AlertaStock Mínimo widget */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs" id="widget-inventory-alerts">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-2">
                <Bell size={16} className="text-blue-600" />
                Alertas de Almacén
              </h3>
              <button 
                onClick={() => navigateToTab('inventario')}
                className="text-xs text-alegra-primary font-medium flex items-center gap-1 hover:underline"
                id="btn-alert-go-inv"
              >
                Ver todo <ArrowRight size={12} />
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No hay alertas de stock mínimo. ¡Todo en orden!</p>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {lowStockProducts.slice(0, 4).map(p => (
                  <div key={p.id} className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">SKU: {p.sku} | Almacén: {p.warehouseId === 'wh-kitchen' ? 'Cocina' : 'POS'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">
                        {p.stock} / {p.minStock} dips.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-br from-[#003B6F] to-slate-900 p-5 rounded-xl text-white shadow-xl shadow-blue-900/10 border border-blue-900/20">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider mb-2 text-blue-400">Acceso Rápido POS</h3>
            <p className="text-xs text-blue-100/80 leading-relaxed mb-4">
              Accede directamente al módulo clave de ventas físicas con interfaz para pantallas táctiles y comensales en mesas.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => navigateToTab('pos-restaurante')} 
                className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-xs font-medium text-white border border-white/10 transition-all flex items-center justify-center gap-1 w-full text-center cursor-pointer"
                id="dash-shortcut-retail"
              >
                <ShoppingBag size={14} className="text-blue-300" />
                POS Retail
              </button>
              <button 
                onClick={() => navigateToTab('pos-restaurante')} 
                className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-xs font-medium text-white border border-white/10 transition-all flex items-center justify-center gap-1 w-full text-center cursor-pointer"
                id="dash-shortcut-rest"
              >
                <Table size={14} className="text-blue-300" />
                POS Mesas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs" id="dashboard-recent-activity">
        <h3 className="text-base font-semibold text-alegra-secondary mb-4 font-display">Recientes Operaciones del Sistema</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-500">
            <thead className="text-[10px] uppercase text-gray-400 bg-gray-50/50 font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Concepto / Actividad</th>
                <th className="py-3 px-4">Referencia</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Canal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.slice(0, 3).map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/40">
                  <td className="py-3 px-4 font-mono text-gray-500">{f.issueDate}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">Emisión de Factura</span> a favor de <span className="text-gray-700 font-medium">{f.clientName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">{f.invoiceNumber}</td>
                  <td className="py-3 px-4 text-right text-gray-900 font-semibold">${f.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">Facturación</span>
                  </td>
                </tr>
              ))}
              <tr className="hover:bg-gray-50/40">
                <td className="py-3 px-4 font-mono text-gray-500">2026-05-26</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-gray-900">Asignación mesa restaurante</span> para 4 comensales
                </td>
                <td className="py-3 px-4 font-mono">Mesa 3 (Interior)</td>
                <td className="py-3 px-4 text-right text-gray-400 font-medium">-</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">Restaurante</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

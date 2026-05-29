/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Receipt, Search, Plus, ArrowDownRight, FileSpreadsheet, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Expense, Client } from '../types';
import Modal from './ui/Modal';

interface ExpensesProps {
  expenses: Expense[];
  clients: Client[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORIES = [
  'Compras de Mercancía',
  'Servicios Básicos',
  'Alquiler',
  'Servicios Profesionales',
  'Combustible',
  'Suministros de Oficina',
  'Mantenimiento',
  'Marketing y Publicidad',
  'Otros Gastos'
];

const NCF_TYPES = [
  'Crédito Fiscal (B01)',
  'Consumidor Final (B02)',
  'Nota de Débito (B03)',
  'Nota de Crédito (B04)',
  'Registro Único de Ingresos (B14)',
  'Gubernamental (B15)'
];

export default function Expenses({ expenses, clients, onAddExpense, onDeleteExpense }: ExpensesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const suppliers = clients.filter(c => c.type === 'supplier');

  const [form, setForm] = useState({
    supplierId: '',
    supplierName: '',
    supplierRnc: '',
    date: new Date().toISOString().split('T')[0],
    ncf: '',
    ncfType: NCF_TYPES[0],
    subtotal: 0,
    itbis: 0,
    category: CATEGORIES[0]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredExpenses = expenses.filter(e =>
    e.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.ncf.includes(searchTerm) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPI calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
  const totalItbis = expenses.reduce((sum, e) => sum + e.itbis, 0);
  const totalPending = expenses.filter(e => e.status === 'pendiente').reduce((sum, e) => sum + e.total, 0);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setForm(f => ({ ...f, supplierId, supplierName: supplier.name, supplierRnc: supplier.rnc }));
    } else {
      setForm(f => ({ ...f, supplierId: '', supplierName: '', supplierRnc: '' }));
    }
  };

  const handleSubtotalChange = (subtotal: number) => {
    const itbis = Math.round(subtotal * 0.18 * 100) / 100;
    setForm(f => ({ ...f, subtotal, itbis }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.supplierName.trim()) newErrors.supplier = 'Selecciona o escribe un proveedor';
    if (!form.ncf.trim()) newErrors.ncf = 'El NCF es obligatorio';
    if (form.subtotal <= 0) newErrors.subtotal = 'El monto debe ser mayor a 0';
    if (!form.date) newErrors.date = 'La fecha es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const total = form.subtotal + form.itbis;
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      number: `G-${String(expenses.length + 1).padStart(4, '0')}`,
      supplierId: form.supplierId || `sup-new-${Date.now()}`,
      supplierName: form.supplierName,
      supplierRnc: form.supplierRnc,
      date: form.date,
      ncf: form.ncf,
      ncfType: form.ncfType,
      subtotal: form.subtotal,
      itbis: form.itbis,
      total,
      status: 'pendiente',
      category: form.category
    };

    onAddExpense(newExpense);
    setIsModalOpen(false);
    setForm({
      supplierId: '', supplierName: '', supplierRnc: '',
      date: new Date().toISOString().split('T')[0],
      ncf: '', ncfType: NCF_TYPES[0],
      subtotal: 0, itbis: 0, category: CATEGORIES[0]
    });
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field] ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--app-primary)] focus:border-transparent'
    }`;

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in" id="expenses-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 font-display flex items-center gap-2">
            <Receipt size={24} className="text-[var(--app-primary)]" />
            Gastos y Compras
          </h1>
          <p className="text-sm text-gray-500">
            Registra facturas de proveedores. Crucial para formato 606 y deducción de ITBIS.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer">
            <FileSpreadsheet size={16} />
            Exportar 606
          </button>
          <button
            onClick={() => { setErrors({}); setIsModalOpen(true); }}
            className="bg-[var(--app-primary)] hover:opacity-90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Total Gastos (Mes)</p>
            <h3 className="text-xl font-bold font-mono">{fmt(totalExpenses)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">ITBIS Deducible (Mes)</p>
            <h3 className="text-xl font-bold font-mono">{fmt(totalItbis)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Pendiente de Pago</p>
            <h3 className="text-xl font-bold font-mono">{fmt(totalPending)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por Proveedor, NCF o Categoría..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-400 font-mono hidden md:block">{filteredExpenses.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">N°</th>
                <th className="px-6 py-3 font-semibold">Proveedor</th>
                <th className="px-6 py-3 font-semibold">NCF</th>
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold text-right">Total</th>
                <th className="px-6 py-3 font-semibold text-center">Estado</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map(expense => (
                <React.Fragment key={expense.id}>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold">{expense.number}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{expense.supplierName}</span>
                        <span className="text-xs text-gray-500">RNC: {expense.supplierRnc}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{expense.ncf}</td>
                    <td className="px-6 py-4 text-gray-600">{expense.date}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold">{fmt(expense.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        expense.status === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                          className="text-[var(--app-primary)] hover:text-[var(--app-primary-dark)] font-medium text-xs flex items-center gap-1 cursor-pointer"
                        >
                          {expandedId === expense.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Detalles
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Eliminar este gasto?')) onDeleteExpense(expense.id); }}
                          className="text-red-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Details Row */}
                  {expandedId === expense.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-blue-50/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="font-bold text-gray-500 mb-1">Tipo NCF</p>
                            <p className="text-gray-800">{expense.ncfType}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 mb-1">Categoría</p>
                            <p className="text-gray-800">{expense.category}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 mb-1">Subtotal</p>
                            <p className="text-gray-800 font-mono">{fmt(expense.subtotal)}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 mb-1">ITBIS (18%)</p>
                            <p className="text-emerald-700 font-mono font-bold">{fmt(expense.itbis)}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt size={32} className="text-gray-300" />
                      <p>No se encontraron gastos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Expense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Gasto / Compra"
        subtitle="Registra una factura de proveedor para tu formato 606"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Proveedor *</label>
            {suppliers.length > 0 ? (
              <select
                className={inputClass('supplier')}
                value={form.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
              >
                <option value="">-- Seleccionar proveedor registrado --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (RNC: {s.rnc})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className={inputClass('supplier')}
                value={form.supplierName}
                onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            )}
            {errors.supplier && <p className="text-xs text-red-500 mt-1">{errors.supplier}</p>}
          </div>

          {/* Supplier RNC (manual if no selection) */}
          {!form.supplierId && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">RNC Proveedor</label>
              <input
                type="text"
                className={inputClass('rnc')}
                value={form.supplierRnc}
                onChange={e => setForm(f => ({ ...f, supplierRnc: e.target.value }))}
                placeholder="101-12345-6"
              />
            </div>
          )}

          {/* NCF + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">NCF *</label>
              <input
                type="text"
                className={inputClass('ncf')}
                value={form.ncf}
                onChange={e => setForm(f => ({ ...f, ncf: e.target.value }))}
                placeholder="B0100000001"
              />
              {errors.ncf && <p className="text-xs text-red-500 mt-1">{errors.ncf}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Tipo NCF</label>
              <select
                className={inputClass('')}
                value={form.ncfType}
                onChange={e => setForm(f => ({ ...f, ncfType: e.target.value }))}
              >
                {NCF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Fecha *</label>
              <input
                type="date"
                className={inputClass('date')}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Categoría</label>
              <select
                className={inputClass('')}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Subtotal (RD$) *</label>
              <input
                type="number"
                step="0.01"
                className={inputClass('subtotal')}
                value={form.subtotal || ''}
                onChange={e => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              {errors.subtotal && <p className="text-xs text-red-500 mt-1">{errors.subtotal}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">ITBIS (18%)</label>
              <input
                type="number"
                step="0.01"
                className={`${inputClass('')} bg-gray-50`}
                value={form.itbis || ''}
                onChange={e => setForm(f => ({ ...f, itbis: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Total</label>
              <div className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 font-bold font-mono text-[var(--app-primary)]">
                {fmt(form.subtotal + form.itbis)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-[var(--app-primary)] text-white font-bold text-sm hover:opacity-90 shadow-sm transition-all cursor-pointer"
            >
              Registrar Gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

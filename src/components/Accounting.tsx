/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Layers, 
  DollarSign, 
  Plus, 
  Check, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  X,
  Edit,
  Trash2,
  ArrowLeftRight
} from 'lucide-react';
import { Account, JournalEntry, JournalEntryLine } from '../types';

interface AccountingProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  onAddJournalEntry: (entry: JournalEntry) => void;
  onUpdateAccounts: (accounts: Account[]) => void;
}

export default function Accounting({ accounts, journalEntries, onAddJournalEntry, onUpdateAccounts }: AccountingProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'asientos' | 'pyl'>('catalogo');
  const [showCreateAsiento, setShowCreateAsiento] = useState(false);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([
    { accountCode: '1101', debit: 0, credit: 0 },
    { accountCode: '4101', debit: 0, credit: 0 }
  ]);

  // NEW ACCOUNT MANAGEMENT AND TRANSFER STATES
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Add Account form inputs
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'egreso'>('activo');
  const [newAccBalance, setNewAccBalance] = useState<number>(0);
  const [newAccDescription, setNewAccDescription] = useState('');

  // Edit Account form inputs
  const [editingAccCode, setEditingAccCode] = useState('');
  const [editingAccName, setEditingAccName] = useState('');
  const [editingAccType, setEditingAccType] = useState<'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'egreso'>('activo');
  const [editingAccBalance, setEditingAccBalance] = useState<number>(0);
  const [editingAccDescription, setEditingAccDescription] = useState('');

  // Transfer form inputs
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDesc, setTransferDesc] = useState('');

  // Add Account submit handler
  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode || !newAccName) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }
    // Check duplication
    if (accounts.some(a => a.code === newAccCode)) {
      alert("Error: Ya existe una cuenta registrada con ese código contable.");
      return;
    }
    const newAccount: Account = {
      code: newAccCode,
      name: newAccName,
      type: newAccType,
      balance: Number(newAccBalance) || 0,
      description: newAccDescription || undefined
    };
    onUpdateAccounts([...accounts, newAccount].sort((a,b) => a.code.localeCompare(b.code)));
    
    // Reset inputs
    setNewAccCode('');
    setNewAccName('');
    setNewAccType('activo');
    setNewAccBalance(0);
    setNewAccDescription('');
    setShowAddAccountModal(false);
  };

  // Open Edit account modal
  const handleOpenEditAccountModal = (acc: Account) => {
    setEditingAccCode(acc.code);
    setEditingAccName(acc.name);
    setEditingAccType(acc.type);
    setEditingAccBalance(acc.balance);
    setEditingAccDescription(acc.description || '');
    setShowEditAccountModal(true);
  };

  // Edit Account submit handler
  const handleEditAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccName) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }
    const updated = accounts.map(a => {
      if (a.code === editingAccCode) {
        return {
          ...a,
          name: editingAccName,
          type: editingAccType,
          balance: Number(editingAccBalance) || 0,
          description: editingAccDescription || undefined
        };
      }
      return a;
    });
    onUpdateAccounts(updated);
    setShowEditAccountModal(false);
  };

  // Delete account handler
  const handleDeleteAccount = (code: string) => {
    const acc = accounts.find(a => a.code === code);
    if (!acc) return;

    if (acc.balance !== 0) {
      const confirmDelete = window.confirm(`Atención: La cuenta "${acc.name}" tiene un saldo de RD$ ${acc.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}. ¿Desea eliminarla de todos modos?`);
      if (!confirmDelete) return;
    } else {
      const confirmDelete = window.confirm(`¿Está seguro de que desea eliminar la cuenta contable "${acc.name}" [${acc.code}]?`);
      if (!confirmDelete) return;
    }

    onUpdateAccounts(accounts.filter(a => a.code !== code));
  };

  // Transfer submit handler (generates dual line journal entry)
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSource || !transferDest) {
      alert("Debe seleccionar las cuentas de origen y destino.");
      return;
    }
    if (transferSource === transferDest) {
      alert("La cuenta de origen y de destino no pueden ser la misma.");
      return;
    }
    if (transferAmount <= 0) {
      alert("El monto del movimiento debe ser mayor a cero.");
      return;
    }

    const sourceAcc = accounts.find(a => a.code === transferSource);
    const destAcc = accounts.find(a => a.code === transferDest);
    if (!sourceAcc || !destAcc) {
      alert("Cuenta no válida.");
      return;
    }

    // Double entry rules apply
    const journalLines: JournalEntryLine[] = [
      {
        accountCode: transferDest,
        debit: Number(transferAmount),
        credit: 0
      },
      {
        accountCode: transferSource,
        debit: 0,
        credit: Number(transferAmount)
      }
    ];

    const transferEntry: JournalEntry = {
      id: `as-tr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: transferDesc || `Transferencia interna de fondos: ${sourceAcc.name} ➔ ${destAcc.name}`,
      reference: 'MOV-INT',
      lines: journalLines
    };

    onAddJournalEntry(transferEntry);

    // Reset inputs
    setTransferSource('');
    setTransferDest('');
    setTransferAmount(0);
    setTransferDesc('');
    setShowTransferModal(false);
  };

  // Derived calculations for Profit and Loss (P&L - Estado de Pérdidas y Ganancias)
  const totalIncomeSales = accounts.find(a => a.code === '4101')?.balance || 0;
  const totalIncomeRestaurant = accounts.find(a => a.code === '4102')?.balance || 0;
  const totalRevenues = totalIncomeSales + totalIncomeRestaurant;

  const costOfGoodsSold = accounts.find(a => a.code === '5101')?.balance || 0;
  const grossProfit = totalRevenues - costOfGoodsSold;

  const salaryExpenses = accounts.find(a => a.code === '5201')?.balance || 0;
  const rentExpenses = accounts.find(a => a.code === '5205')?.balance || 0;
  const publicServices = accounts.find(a => a.code === '5210')?.balance || 0;
  const totalExpenses = salaryExpenses + rentExpenses + publicServices;

  const netIncome = grossProfit - totalExpenses;

  // Adding lines to manual journal entry form
  const handleAddLineToEntry = () => {
    setEntryLines([...entryLines, { accountCode: '1103', debit: 0, credit: 0 }]);
  };

  const handleRemoveLineFromEntry = (idx: number) => {
    setEntryLines(entryLines.filter((_, i) => i !== idx));
  };

  const handleLineValueChange = (idx: number, field: 'debit' | 'credit', val: number) => {
    const updated = entryLines.map((line, i) => {
      if (i === idx) {
        // En partida doble, si hay débito, el crédito usualmente es 0 y viceversa
        return {
          ...line,
          [field]: val,
          [field === 'debit' ? 'credit' : 'debit']: val > 0 ? 0 : line[field === 'debit' ? 'credit' : 'debit']
        };
      }
      return line;
    });
    setEntryLines(updated);
  };

  const handleLineAccountChange = (idx: number, code: string) => {
    setEntryLines(entryLines.map((line, i) => i === idx ? { ...line, accountCode: code } : line));
  };

  const debitSum = entryLines.reduce((acc, l) => acc + l.debit, 0);
  const creditSum = entryLines.reduce((acc, l) => acc + l.credit, 0);
  const balanceDifference = debitSum - creditSum;

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(balanceDifference) > 0.01) {
      alert(`Asiento Descuadrado. El total de débitos ($${debitSum.toFixed(2)}) debe coincidir exactamente con el total de créditos ($${creditSum.toFixed(2)}). Partida Doble requerida.`);
      return;
    }

    if (!entryDesc) {
      alert("Por favor introduce una breve explicación o descripción del asiento.");
      return;
    }

    const createdEntry: JournalEntry = {
      id: `as-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: entryDesc,
      reference: entryRef || 'M-REG',
      lines: entryLines.filter(l => l.debit > 0 || l.credit > 0)
    };

    onAddJournalEntry(createdEntry);

    // Reset Form
    setEntryDesc('');
    setEntryRef('');
    setEntryLines([
      { accountCode: '1103', debit: 0, credit: 0 },
      { accountCode: '4101', debit: 0, credit: 0 }
    ]);
    setShowCreateAsiento(false);
  };

  return (
    <div className="space-y-6" id="accounting-screen">
      
      {/* Upper header navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display flex items-center gap-2">
            <BookOpen size={22} className="text-alegra-primary" />
            Módulo de Contabilidad Inteligente
          </h1>
          <p className="text-sm text-gray-500">
            Libro diario contable, asientos de partida doble obligatorios, catálogo de cuentas y reportes automáticos P&L.
          </p>
        </div>

        {/* Mini Tab switcher */}
        <div className="bg-gray-150/50 p-1 rounded-xl flex items-center gap-1 text-xs self-start border border-gray-200 font-semibold font-display">
          <button
            onClick={() => setActiveSubTab('catalogo')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'catalogo' ? 'bg-white text-alegra-primary shadow-xs' : 'text-gray-500'
            }`}
          >
            Catálogo de Cuentas
          </button>
          <button
            onClick={() => setActiveSubTab('asientos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'asientos' ? 'bg-white text-alegra-primary shadow-xs' : 'text-gray-500'
            }`}
          >
            Diario General
          </button>
          <button
            onClick={() => setActiveSubTab('pyl')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'pyl' ? 'bg-white text-alegra-primary shadow-xs' : 'text-gray-500'
            }`}
          >
            Pérdidas y Ganancias (P&L)
          </button>
        </div>
      </div>

      {activeSubTab === 'catalogo' && (
        /*******************************************************
         * CHART OF ACCOUNTS VIEW
         *******************************************************/
        <div className="space-y-4" id="accounting-cob-tab">
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-gray-700 flex items-start gap-2.5 text-xs leading-relaxed">
            <Layers size={16} className="text-alegra-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Estructura Homologada</span>: El catálogo de cuentas organiza los saldos operacionales en Activos (incluyendo bancos y cajas), Pasivos, Patrimonios, Ingresos y Egresos. Cada movimiento en las facturas del POS o cobros de comensales genera movimientos automáticos en estas partidas.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xxs gap-3">
            <div className="text-xs text-gray-500">
              Administre las cuentas del catálogo u organice transferencias y movimientos directos entre ellas.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                id="btn-accounting-transfer"
              >
                <ArrowLeftRight size={14} className="text-amber-500 animate-pulse" /> Transferencia / Movimiento
              </button>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                id="btn-accounting-add-account"
              >
                <Plus size={14} /> Nueva Cuenta Contable
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[9px] font-bold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Código Cuenta</th>
                    <th className="py-3 px-4">Denominación / Cuenta</th>
                    <th className="py-3 px-4 text-center">Clasificación</th>
                    <th className="py-3 px-4 text-right">Saldo Actual</th>
                    <th className="py-3 px-4">Breve descripción</th>
                    <th className="py-3 px-4 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-800 font-sans">
                  {accounts.map(acc => (
                    <tr key={acc.code} className="hover:bg-gray-55/40 transition-all">
                      <td className="py-3 px-4 font-mono font-bold text-alegra-secondary">{acc.code}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{acc.name}</td>
                      <td className="py-3 px-4 text-center select-none">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                          acc.type === 'activo' ? 'bg-emerald-50 text-emerald-700' :
                          acc.type === 'pasivo' ? 'bg-rose-50 text-rose-700' :
                          acc.type === 'patrimonio' ? 'bg-amber-50 text-amber-700' :
                          acc.type === 'ingreso' ? 'bg-blue-50 text-blue-700' :
                          'bg-indigo-50 text-indigo-700'
                        }`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-950 font-mono">
                        RD$ {acc.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-gray-400 italic max-w-xs truncate">{acc.description || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditAccountModal(acc)}
                            className="p-1.5 bg-indigo-55 hover:bg-slate-100 border border-slate-200 text-indigo-650 rounded cursor-pointer transition-colors"
                            title="Editar Cuenta"
                          >
                            <Edit size={12} />
                          </button>
                          {/* Protect critical general accounts from basic delete if needed, but let users delete them */}
                          <button
                            onClick={() => handleDeleteAccount(acc.code)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-650 rounded cursor-pointer transition-all"
                            title="Eliminar Cuenta"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'asientos' && (
        /*******************************************************
         * GENERAL JOURNAL ENTRIES LIST
         *******************************************************/
        <div className="space-y-4" id="accounting-entries-tab">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xxs">
            <div className="text-xs text-gray-500">
              Correlativo integrado de diario para todos los nodos del ERP. Decida emitir un asiento dual manual.
            </div>
            <button
              onClick={() => setShowCreateAsiento(true)}
              className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              id="btn-add-journal-entry"
            >
              <Plus size={14} /> Registrar Asiento Diario
            </button>
          </div>

          <div className="space-y-5">
            {journalEntries.map(entry => {
              const totalDebits = entry.lines.reduce((sum, l) => sum + l.debit, 0);
              return (
                <div key={entry.id} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
                  {/* Item header */}
                  <div className="bg-slate-50 p-3.5 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-150 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                        <Calendar size={14} />
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-900">{entry.description}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">Asiento: {entry.id} | Ref: {entry.reference}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-gray-500">{entry.date}</span>
                  </div>

                  {/* Lines mapping table */}
                  <table className="w-full text-left text-[11px] text-gray-600 bg-white">
                    <thead className="bg-slate-100/60 uppercase text-[9px] text-gray-400 font-extrabold">
                      <tr>
                        <th className="p-2.5 pl-4">Código Cuenta</th>
                        <th className="p-2.5">Detalle Denominación</th>
                        <th className="p-2.5 text-right w-36">Débito (Debe)</th>
                        <th className="p-2.5 text-right pr-4 w-36">Crédito (Haber)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {entry.lines.map((line, lIdx) => {
                        const accountName = accounts.find(a => a.code === line.accountCode)?.name || 'Cuenta Desconocida';
                        return (
                          <tr key={lIdx}>
                            <td className="p-2.5 pl-4 font-mono font-bold text-alegra-secondary">{line.accountCode}</td>
                            <td className="p-2.5 font-medium text-gray-800">{accountName}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                              {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2.5 text-right pr-4 font-mono font-bold text-rose-600">
                              {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Double entry sum balancing */}
                      <tr className="bg-gray-50/50 font-bold border-t border-gray-150">
                        <td colSpan={2} className="p-2.5 pl-4 text-right text-gray-400 text-[10px] uppercase">Balance Partida Doble:</td>
                        <td className="p-2.5 text-right font-mono text-xs text-emerald-700 border-t border-gray-200">${totalDebits.toFixed(2)}</td>
                        <td className="p-2.5 text-right pr-4 font-mono text-xs text-rose-700 border-t border-gray-200">${totalDebits.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'pyl' && (
        /*******************************************************
         * PROFIT & LOSS STATEMENT (P&L / ESTADO DE RESULTADOS)
         *******************************************************/
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm max-w-2xl mx-auto space-y-6" id="accounting-pyl-tab">
          
          {/* Statement metadata header */}
          <div className="text-center pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold font-display text-alegra-secondary">Estado de Pérdidas y Ganancias (P&L)</h2>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mt-1">Alegra Solutions Clone SRL</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Periodo: Mes en curso (Acumulado Real al 2026-05-26)</p>
          </div>

          <div className="space-y-4 text-xs font-medium text-gray-700">
            
            {/* INCOMR */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-400 uppercase text-[9px] tracking-wider border-b border-gray-100 pb-1">1. Ingresos Operacionales</h4>
              <div className="flex justify-between pl-3 font-semibold text-gray-800">
                <span>Ventas Generales Factura (Retail)</span>
                <span className="font-mono">${totalIncomeSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pl-3 font-semibold text-gray-800">
                <span>Consumos Restaurante (POS Mesas)</span>
                <span className="font-mono">${totalIncomeRestaurant.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-950 bg-slate-50 p-2 rounded">
                <span>Total de Ingresos Brutos:</span>
                <span className="font-mono">${totalRevenues.toFixed(2)}</span>
              </div>
            </div>

            {/* COSTS OF GOODS SOLD */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-400 uppercase text-[9px] tracking-wider border-b border-gray-100 pb-1">2. Costo de Ventas</h4>
              <div className="flex justify-between pl-3 font-semibold text-gray-800">
                <span>Costo de Adquisición de Inventario</span>
                <span className="font-mono text-red-650">(${costOfGoodsSold.toFixed(2)})</span>
              </div>
              <div className="flex justify-between font-bold text-gray-950 bg-slate-50 p-2 rounded">
                <span>Utilidad Bruta Operativa (Gross Margin):</span>
                <span className="font-mono text-emerald-700">${grossProfit.toFixed(2)}</span>
              </div>
            </div>

            {/* EXPENSES */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-400 uppercase text-[9px] tracking-wider border-b border-gray-100 pb-1">3. Gastos de Operación y Administración</h4>
              <div className="flex justify-between pl-3 font-semibold text-gray-800">
                <span>Sueldos y Remuneración Salarial</span>
                <span className="font-mono">(${salaryExpenses.toFixed(2)})</span>
              </div>
              <div className="flex justify-between pl-3 font-semibold text-gray-800">
                <span>Alquiler Local Comercial</span>
                <span className="font-mono">(${rentExpenses.toFixed(2)})</span>
              </div>
              <div className="flex justify-between pl-3 font-semibold text-gray-800">
                <span>Servicios de Red y Electricidad Pública</span>
                <span className="font-mono">(${publicServices.toFixed(2)})</span>
              </div>
              <div className="flex justify-between font-bold text-gray-950 bg-slate-50 p-2 rounded">
                <span>Total Gasto Operativo:</span>
                <span className="font-mono text-red-650">(${totalExpenses.toFixed(2)})</span>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* NET OUTCOME */}
            <div className="p-3 bg-gradient-to-r from-alegra-secondary to-slate-900 text-white rounded-xl flex justify-between items-center shadow-xs">
              <div>
                <h4 className="font-bold font-display uppercase tracking-wider text-xs text-blue-400">Utilidad Neta del Ejercicio</h4>
                <p className="text-[10px] text-gray-300">Resultado neto disponible</p>
              </div>
              <span className="text-lg font-mono font-extrabold text-emerald-400">
                ${netIncome.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DIARIO ENTRY MODAL OVERLAY */}
      {showCreateAsiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-widest font-display">Registrar Partida Doble Manual</h3>
              <button onClick={() => setShowCreateAsiento(false)} className="text-gray-450 hover:text-gray-650 font-bold p-1 cursor-pointer">X</button>
            </div>

            <form onSubmit={handleJournalSubmit} className="space-y-4 text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Concepto o Descripción de Asiento *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Registro de cobro anticipado de servicios"
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Código Referencia (CK, CH, TR...)</label>
                  <input
                    type="text"
                    placeholder="e.g. TR-952"
                    value={entryRef}
                    onChange={(e) => setEntryRef(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Items loop details manual selection */}
              <div className="space-y-2 border border-blue-100 bg-blue-50/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-widest text-[9px] text-gray-500">Líneas de Cuentas Contables</span>
                  <button
                    type="button"
                    onClick={handleAddLineToEntry}
                    className="text-[10px] text-alegra-primary font-bold hover:underline cursor-pointer"
                  >
                    + Agregar Línea
                  </button>
                </div>

                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center bg-white p-2 border border-gray-200 rounded">
                      <div className="md:col-span-2">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineAccountChange(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-gray-300 rounded p-1 text-[11px]"
                        >
                          {accounts.map(acc => (
                            <option key={acc.code} value={acc.code}>[{acc.code}] {acc.name} - ({acc.type})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Débito (Debe)"
                          value={line.debit || ''}
                          onChange={(e) => handleLineValueChange(idx, 'debit', Number(e.target.value))}
                          className="w-full bg-slate-50 border border-gray-300 rounded p-1 text-right text-[11px]"
                        />
                      </div>
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          placeholder="Crédito (Haber)"
                          value={line.credit || ''}
                          onChange={(e) => handleLineValueChange(idx, 'credit', Number(e.target.value))}
                          className="w-full bg-slate-50 border border-gray-300 rounded p-1 text-right text-[11px] flex-1"
                        />
                        {entryLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineFromEntry(idx)}
                            className="text-red-500 p-1 cursor-pointer"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals balances indicators */}
                <div className="flex justify-between pt-2.5 border-t border-slate-205 text-[11px] font-bold">
                  <span className="text-gray-500">Suma total débitos: <span className="text-emerald-700">${debitSum.toFixed(2)}</span></span>
                  <span className="text-gray-500">Suma total créditos: <span className="text-rose-700">${creditSum.toFixed(2)}</span></span>
                </div>
                {balanceDifference !== 0 && (
                  <p className="text-[10px] text-red-500 font-semibold text-center mt-1">
                    Diferencia de descuadre: ${Math.abs(balanceDifference).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowCreateAsiento(false)}
                  className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-semibold py-2 px-4 rounded w-1/4 cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold py-2 px-5 rounded cursor-pointer"
                >
                  <Check size={14} /> Contabilizar Asiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*******************************************************
       * MODAL PARA AGREGAR NUEVA CUENTA CONTABLE
       *******************************************************/
      showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-xs font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest font-display">
                Agregar Cuenta Contable
              </h3>
              <button 
                onClick={() => setShowAddAccountModal(false)}
                className="text-gray-400 hover:text-gray-650 p-1 cursor-pointer transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-4 text-gray-750">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                    Código Cuenta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1104"
                    value={newAccCode}
                    onChange={(e) => setNewAccCode(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 font-mono text-[11px] outline-none font-bold text-gray-800 focus:border-indigo-500"
                  />
                  <span className="text-[8px] text-gray-400 block mt-0.5">Ej: 11XX Activo, 21XX Pasivo...</span>
                </div>
                
                <div>
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                    Clasificación *
                  </label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 rounded px-2 py-1.5 text-[11px] font-bold text-gray-800 outline-none"
                  >
                    <option value="activo">Activo (Bancos, Cajas, etc)</option>
                    <option value="pasivo">Pasivo (Deudas, Ajustes)</option>
                    <option value="patrimonio">Patrimonio (Capital, Reservas)</option>
                    <option value="ingreso">Ingreso (Ventas, Servicios)</option>
                    <option value="egreso">Egreso (Costos, Gastos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Denominación / Nombre de Cuenta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Banco BHD León Cuenta Ahorros"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-[11px] font-bold text-gray-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Saldo de Apertura (RD$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAccBalance || ''}
                  onChange={(e) => setNewAccBalance(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 font-mono text-[11px] font-bold text-gray-800 outline-none text-right focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Breve descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe el propósito de la cuenta..."
                  value={newAccDescription}
                  onChange={(e) => setNewAccDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-[11px] text-gray-700 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg flex-1 cursor-pointer transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex-1 cursor-pointer transition-all"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*******************************************************
       * MODAL PARA EDITAR CUENTA CONTABLE
       *******************************************************/
      showEditAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-xs font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest font-display">
                Editar Cuenta Contable
              </h3>
              <button 
                onClick={() => setShowEditAccountModal(false)}
                className="text-gray-450 hover:text-gray-650 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditAccountSubmit} className="space-y-4 text-gray-750">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                    Código Cuenta (No Editable)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingAccCode}
                    className="w-full bg-gray-100 border border-gray-150 rounded px-2.5 py-1.5 font-mono text-[11px] font-bold text-gray-400 outline-none cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                    Clasificación *
                  </label>
                  <select
                    value={editingAccType}
                    onChange={(e) => setEditingAccType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 rounded px-2 py-1.5 text-[11px] font-bold text-gray-800 outline-none"
                  >
                    <option value="activo">Activo (Bancos, Cajas, etc)</option>
                    <option value="pasivo">Pasivo (Deudas, Ajustes)</option>
                    <option value="patrimonio">Patrimonio (Capital, Reservas)</option>
                    <option value="ingreso">Ingreso (Ventas, Servicios)</option>
                    <option value="egreso">Egreso (Costos, Gastos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Denominación / Nombre de Cuenta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Nombre de cuenta"
                  value={editingAccName}
                  onChange={(e) => setEditingAccName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-[11px] font-bold text-gray-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Saldo Manual (RD$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editingAccBalance || ''}
                  onChange={(e) => setEditingAccBalance(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 font-mono text-[11px] font-bold text-gray-800 outline-none text-right focus:border-indigo-500"
                />
                <span className="text-[8px] text-amber-600 block mt-0.5 font-bold animate-pulse">
                  ⚠ Modificar el balance puede descuadrar los reportes históricos.
                </span>
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Breve descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe el propósito de la cuenta..."
                  value={editingAccDescription}
                  onChange={(e) => setEditingAccDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-[11px] text-gray-700 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditAccountModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg flex-1 cursor-pointer transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex-1 cursor-pointer transition-all"
                >
                  Actualizar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*******************************************************
       * MODAL PARA HACER MOVIMIENTOS / TRANSFERENCIAS
       *******************************************************/
      showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-xs font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-widest font-display flex items-center gap-1.5">
                <ArrowLeftRight size={16} className="text-amber-500" /> Hacer Movimiento Interno
              </h3>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-650 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[10px] text-gray-500 leading-relaxed bg-amber-50/50 p-2.5 rounded border border-amber-100">
              Esta función automatiza el registro de partida doble para movimientos internos (ej. retirar efectivo de un banco para reposición de Caja Chica). Generará un débito a la cuenta destino y un crédito a la de origen en el Diario.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-gray-7b0">
              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Cuenta de Origen (Egreso / Haber Crédito) *
                </label>
                <select
                  required
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2 py-1.5 text-[11px] font-bold text-gray-800 outline-none"
                >
                  <option value="">-- Seleccionar cuenta origen --</option>
                  {accounts.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      [{acc.code}] {acc.name} - Bal: RD$ {acc.balance.toLocaleString('es-DO')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Cuenta de Destino (Ingreso / Debe Débito) *
                </label>
                <select
                  required
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2 py-1.5 text-[11px] font-bold text-gray-800 outline-none"
                >
                  <option value="">-- Seleccionar cuenta destino --</option>
                  {accounts.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      [{acc.code}] {acc.name} - Bal: RD$ {acc.balance.toLocaleString('es-DO')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Monto a Transferir (RD$) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={transferAmount || ''}
                  onChange={(e) => setTransferAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 font-mono text-[11px] font-bold text-gray-800 outline-none text-right focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                  Descripción / Concepto del Movimiento
                </label>
                <input
                  type="text"
                  placeholder="Ej. Reposición de fondo fijo de Caja Chica"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-[11px] text-gray-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg flex-1 cursor-pointer transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg flex-1 cursor-pointer transition-all"
                >
                  Ejecutar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  X
} from 'lucide-react';
import { Account, JournalEntry, JournalEntryLine } from '../types';

interface AccountingProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  onAddJournalEntry: (entry: JournalEntry) => void;
}

export default function Accounting({ accounts, journalEntries, onAddJournalEntry }: AccountingProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'asientos' | 'pyl'>('catalogo');
  const [showCreateAsiento, setShowCreateAsiento] = useState(false);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([
    { accountCode: '1101', debit: 0, credit: 0 },
    { accountCode: '4101', debit: 0, credit: 0 }
  ]);

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
              <span className="font-bold">Estructura Homologada</span>: El catálogo de cuentas organiza los saldos operacionales en Activos, Pasivos, Patrimonios, Ingresos y Egresos. Cada movimiento en las facturas del POS o cobros de comensales genera movimientos automáticos en estas partidas.
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
                        ${acc.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-gray-400 italic max-w-xs truncate">{acc.description || 'N/A'}</td>
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
    </div>
  );
}

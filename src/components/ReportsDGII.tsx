/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FileBarChart, Download, Calendar, Eye, X, FileText } from 'lucide-react';
import { Invoice, Expense } from '../types';
import Modal from './ui/Modal';

interface ReportsDGIIProps {
  invoices: Invoice[];
  expenses: Expense[];
}

export default function ReportsDGII({ invoices, expenses }: ReportsDGIIProps) {
  const [period, setPeriod] = useState('2026-05');
  const [draftModal, setDraftModal] = useState<'606' | '607' | 'it1' | 'ir17' | null>(null);

  // Filter by period
  const periodExpenses = useMemo(() =>
    expenses.filter(e => e.date.startsWith(period)),
    [expenses, period]
  );

  const periodInvoices = useMemo(() =>
    invoices.filter(inv => inv.issueDate.startsWith(period) && inv.status !== 'anulada'),
    [invoices, period]
  );

  // 606 Data (Compras)
  const total606Subtotal = periodExpenses.reduce((s, e) => s + e.subtotal, 0);
  const total606Itbis = periodExpenses.reduce((s, e) => s + e.itbis, 0);
  const total606Total = periodExpenses.reduce((s, e) => s + e.total, 0);

  // 607 Data (Ventas)
  const total607Subtotal = periodInvoices.reduce((s, i) => s + i.subtotal, 0);
  const total607Taxes = periodInvoices.reduce((s, i) => s + i.taxes, 0);
  const total607Total = periodInvoices.reduce((s, i) => s + i.total, 0);

  // IT-1 Calculation
  const itbisVentas = total607Taxes;
  const itbisCompras = total606Itbis;
  const itbisPorPagar = Math.max(0, itbisVentas - itbisCompras);
  const itbisSaldoFavor = Math.max(0, itbisCompras - itbisVentas);

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Export TXT in DGII format
  const export606TXT = () => {
    const header = `RNC|TIPO_ID|TIPO_BIENES_SERVICIOS_COMPRADOS|NCF|NCF_O_DOCUMENTO_MODIFICADO|FECHA_COMPROBANTE|FECHA_PAGO|MONTO_FACTURADO|ITBIS_FACTURADO`;
    const lines = periodExpenses.map(e =>
      `${e.supplierRnc}|1|02|${e.ncf}||${e.date.replace(/-/g, '')}|${e.date.replace(/-/g, '')}|${e.subtotal.toFixed(2)}|${e.itbis.toFixed(2)}`
    );
    const content = [header, ...lines].join('\n');
    downloadFile(content, `606_${period.replace('-', '')}.txt`);
  };

  const export607TXT = () => {
    const header = `RNC_CEDULA|TIPO_ID|NCF|NCF_O_DOCUMENTO_MODIFICADO|TIPO_INGRESO|FECHA_COMPROBANTE|FECHA_RETENCION|MONTO_FACTURADO|ITBIS_FACTURADO`;
    const lines = periodInvoices.map(inv =>
      `${inv.clientRnc}|1|${inv.invoiceNumber}||01|${inv.issueDate.replace(/-/g, '')}||${inv.subtotal.toFixed(2)}|${inv.taxes.toFixed(2)}`
    );
    const content = [header, ...lines].join('\n');
    downloadFile(content, `607_${period.replace('-', '')}.txt`);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportCards = [
    {
      id: '606' as const,
      title: 'Formato 606',
      subtitle: 'Compras de Bienes y Servicios',
      badge: 'Mensual',
      badgeColor: 'bg-blue-100 text-[var(--app-primary-dark)]',
      desc: 'Incluye todos los gastos y compras registrados en el periodo para sustentar costos y deducciones de ITBIS.',
      count: periodExpenses.length,
      total: total606Total,
      onExport: export606TXT,
    },
    {
      id: '607' as const,
      title: 'Formato 607',
      subtitle: 'Ventas de Bienes y Servicios',
      badge: 'Mensual',
      badgeColor: 'bg-blue-100 text-[var(--app-primary-dark)]',
      desc: 'Reporte de todas las facturas emitidas con NCF en el periodo seleccionado para la DGII.',
      count: periodInvoices.length,
      total: total607Total,
      onExport: export607TXT,
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="reports-dgii-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 font-display flex items-center gap-2">
            <FileBarChart size={24} className="text-[var(--app-primary)]" />
            Reportes DGII
          </h1>
          <p className="text-sm text-gray-500">
            Genera los formatos de envío (606, 607) y las declaraciones juradas (IT-1, IR-17).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm border-none focus:ring-0 p-0 text-gray-700 font-bold bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 606 and 607 Cards */}
        {reportCards.map(card => (
          <div key={card.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{card.title}</h3>
                <p className="text-xs text-gray-500">{card.subtitle}</p>
              </div>
              <span className={`${card.badgeColor} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider`}>
                {card.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{card.desc}</p>
            
            {/* Stats */}
            <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Registros</p>
                <p className="text-lg font-bold font-mono text-gray-800">{card.count}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                <p className="text-lg font-bold font-mono text-[var(--app-primary)]">{fmt(card.total)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDraftModal(card.id)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2.5 rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={14} /> Ver Borrador
              </button>
              <button
                onClick={card.onExport}
                className="flex-1 bg-[var(--app-primary)] hover:opacity-90 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download size={14} /> Exportar TXT
              </button>
            </div>
          </div>
        ))}

        {/* IT-1 Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-gray-800">IT-1</h3>
              <p className="text-xs text-gray-500">Declaración Jurada y Pago de ITBIS</p>
            </div>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              Impuesto
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Cálculo automático del ITBIS retenido y adelantado basado en los formatos 606 y 607.
          </p>

          {/* IT-1 Summary */}
          <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">ITBIS Facturado (Ventas - 607)</span>
              <span className="font-mono font-bold text-red-600">{fmt(itbisVentas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ITBIS Adelantado (Compras - 606)</span>
              <span className="font-mono font-bold text-emerald-600">-{fmt(itbisCompras)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span className="text-gray-700">{itbisPorPagar > 0 ? 'ITBIS a Pagar' : 'Saldo a Favor'}</span>
              <span className={`font-mono text-base ${itbisPorPagar > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmt(itbisPorPagar > 0 ? itbisPorPagar : itbisSaldoFavor)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setDraftModal('it1')}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2.5 rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileBarChart size={14} /> Generar Borrador IT-1
          </button>
        </div>

        {/* IR-17 Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-gray-800">IR-17</h3>
              <p className="text-xs text-gray-500">Retenciones y Retribuciones</p>
            </div>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              Impuesto
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Declaración mensual de otras retenciones y retribuciones en la fuente (honorarios, alquileres).
          </p>

          {/* IR-17 Summary */}
          <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg text-xs">
            {(() => {
              const serviceProfessional = periodExpenses.filter(e => e.category === 'Servicios Profesionales');
              const rent = periodExpenses.filter(e => e.category === 'Alquiler');
              const retHonorarios = serviceProfessional.reduce((s, e) => s + e.subtotal * 0.10, 0);
              const retAlquileres = rent.reduce((s, e) => s + e.subtotal * 0.10, 0);
              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ret. Honorarios (10%)</span>
                    <span className="font-mono font-bold">{fmt(retHonorarios)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ret. Alquileres (10%)</span>
                    <span className="font-mono font-bold">{fmt(retAlquileres)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                    <span className="text-gray-700">Total Retenciones</span>
                    <span className="font-mono text-base text-[var(--app-primary)]">{fmt(retHonorarios + retAlquileres)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          <button
            onClick={() => setDraftModal('ir17')}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2.5 rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileBarChart size={14} /> Generar Borrador IR-17
          </button>
        </div>
      </div>

      {/* Draft Modals */}
      <Modal
        isOpen={draftModal === '606'}
        onClose={() => setDraftModal(null)}
        title="Borrador Formato 606"
        subtitle={`Compras del periodo ${period} — ${periodExpenses.length} registros`}
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-semibold">RNC</th>
                <th className="px-4 py-2 font-semibold">Proveedor</th>
                <th className="px-4 py-2 font-semibold">NCF</th>
                <th className="px-4 py-2 font-semibold">Tipo NCF</th>
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold text-right">Subtotal</th>
                <th className="px-4 py-2 font-semibold text-right">ITBIS</th>
                <th className="px-4 py-2 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {periodExpenses.map(e => (
                <tr key={e.id} className="hover:bg-blue-50/30">
                  <td className="px-4 py-2.5 font-mono">{e.supplierRnc}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-800">{e.supplierName}</td>
                  <td className="px-4 py-2.5 font-mono">{e.ncf}</td>
                  <td className="px-4 py-2.5">{e.ncfType}</td>
                  <td className="px-4 py-2.5">{e.date}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(e.subtotal)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{fmt(e.itbis)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{fmt(e.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
              <tr>
                <td colSpan={5} className="px-4 py-2.5 text-right">TOTALES:</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmt(total606Subtotal)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{fmt(total606Itbis)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmt(total606Total)}</td>
              </tr>
            </tfoot>
          </table>
          {periodExpenses.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No hay compras registradas en este periodo</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={draftModal === '607'}
        onClose={() => setDraftModal(null)}
        title="Borrador Formato 607"
        subtitle={`Ventas del periodo ${period} — ${periodInvoices.length} registros`}
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-semibold">RNC/Cédula</th>
                <th className="px-4 py-2 font-semibold">Cliente</th>
                <th className="px-4 py-2 font-semibold">NCF</th>
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold text-center">Estado</th>
                <th className="px-4 py-2 font-semibold text-right">Subtotal</th>
                <th className="px-4 py-2 font-semibold text-right">ITBIS</th>
                <th className="px-4 py-2 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {periodInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-blue-50/30">
                  <td className="px-4 py-2.5 font-mono">{inv.clientRnc}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-800">{inv.clientName}</td>
                  <td className="px-4 py-2.5 font-mono">{inv.invoiceNumber}</td>
                  <td className="px-4 py-2.5">{inv.issueDate}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(inv.subtotal)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{fmt(inv.taxes)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{fmt(inv.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
              <tr>
                <td colSpan={5} className="px-4 py-2.5 text-right">TOTALES:</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmt(total607Subtotal)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{fmt(total607Taxes)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmt(total607Total)}</td>
              </tr>
            </tfoot>
          </table>
          {periodInvoices.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No hay ventas registradas en este periodo</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={draftModal === 'it1'}
        onClose={() => setDraftModal(null)}
        title="Borrador IT-1 — Declaración Jurada de ITBIS"
        subtitle={`Periodo: ${period}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-[var(--app-primary)]" />
              Resumen de ITBIS — Periodo {period}
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">1. ITBIS Cobrado en Ventas (607)</span>
                <span className="font-mono font-bold text-red-600">{fmt(itbisVentas)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">2. ITBIS Pagado en Compras (606)</span>
                <span className="font-mono font-bold text-emerald-600">{fmt(itbisCompras)}</span>
              </div>
              <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-800">3. ITBIS Neto (1 - 2)</span>
                <span className={`font-mono font-bold text-lg ${itbisPorPagar > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {itbisPorPagar > 0 ? fmt(itbisPorPagar) : `-${fmt(itbisSaldoFavor)}`}
                </span>
              </div>
            </div>
          </div>

          {itbisPorPagar > 0 ? (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-700">
              <p className="font-bold">⚠️ Debes pagar <span className="font-mono">{fmt(itbisPorPagar)}</span> de ITBIS este periodo.</p>
              <p className="text-xs mt-1">Plazo: Día 20 del mes siguiente al periodo declarado.</p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-sm text-emerald-700">
              <p className="font-bold">✅ Tienes un saldo a favor de <span className="font-mono">{fmt(itbisSaldoFavor)}</span>.</p>
              <p className="text-xs mt-1">Este saldo se puede aplicar a periodos futuros.</p>
            </div>
          )}

          <div className="text-xs text-gray-400 text-center pt-2">
            Generado automáticamente. Datos basados en facturas y gastos registrados en el sistema.
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={draftModal === 'ir17'}
        onClose={() => setDraftModal(null)}
        title="Borrador IR-17 — Retenciones y Retribuciones"
        subtitle={`Periodo: ${period}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-orange-600" />
              Detalle de Retenciones
            </h4>
            {(() => {
              const serviceProfessional = periodExpenses.filter(e => e.category === 'Servicios Profesionales');
              const rent = periodExpenses.filter(e => e.category === 'Alquiler');
              const retHonorarios = serviceProfessional.reduce((s, e) => s + e.subtotal * 0.10, 0);
              const retAlquileres = rent.reduce((s, e) => s + e.subtotal * 0.10, 0);
              const totalRet = retHonorarios + retAlquileres;

              return (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-600">Ret. Honorarios Profesionales (10%)</span>
                      <p className="text-[10px] text-gray-400">{serviceProfessional.length} facturas</p>
                    </div>
                    <span className="font-mono font-bold">{fmt(retHonorarios)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-600">Ret. Alquileres y Arrendamientos (10%)</span>
                      <p className="text-[10px] text-gray-400">{rent.length} facturas</p>
                    </div>
                    <span className="font-mono font-bold">{fmt(retAlquileres)}</span>
                  </div>
                  <div className="border-t border-orange-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total a Declarar y Pagar</span>
                    <span className="font-mono font-bold text-lg text-orange-700">{fmt(totalRet)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="text-xs text-gray-400 text-center pt-2">
            Las retenciones se calculan sobre el subtotal antes de ITBIS de las categorías aplicables.
          </div>
        </div>
      </Modal>
    </div>
  );
}

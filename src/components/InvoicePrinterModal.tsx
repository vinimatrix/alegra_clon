/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Settings as SettingsIcon, 
  FileText, 
  Smartphone, 
  Check, 
  HelpCircle, 
  MapPin, 
  Phone, 
  FileCheck,
  Globe,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoicePrinterModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

interface BusinessProfile {
  name: string;
  rnc: string;
  address: string;
  phone: string;
  logoType: 'icon' | 'text' | 'image';
  logoColor: string;
  logoPrintText: string;
  defaultFormat: 'carta' | 'thermal_80' | 'thermal_58';
  ncfPrefix: string;
}

export default function InvoicePrinterModal({
  invoice,
  isOpen,
  onClose
}: InvoicePrinterModalProps) {
  
  // 1. Business state loaded from localStorage or fallback defaults
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const stored = localStorage.getItem('alegra_business_profile');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* fallback */ }
    }
    return {
      name: 'Alegra Gourmet & Retail SRL',
      rnc: '1-31-48201-4',
      address: 'Calle Winston Churchill, Esq. Gustavo Mejía, Santo Domingo, RD',
      phone: '809-541-2621',
      logoType: 'icon',
      logoColor: '#4f46e5', // indigo-600
      logoPrintText: '🍳 ALEGRA GOURMET 🍳',
      defaultFormat: 'thermal_80',
      ncfPrefix: 'B0100000325' // Standard fiscal invoice prefix in RD
    };
  });

  // Selected format for preview & print
  const [format, setFormat] = useState<'carta' | 'thermal_80' | 'thermal_58'>('thermal_80');
  
  // Toggle for configuration pop-under/drawer
  const [showConfig, setShowConfig] = useState(false);

  // Sync format with company settings default format on mount or invoice change
  useEffect(() => {
    if (profile.defaultFormat) {
      setFormat(profile.defaultFormat);
    }
  }, [invoice, profile.defaultFormat]);

  if (!isOpen || !invoice) return null;

  // Save profile to local storage and sync
  const saveProfile = (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    localStorage.setItem('alegra_business_profile', JSON.stringify(newProfile));
    // Trigger global update notice for other modules
    window.dispatchEvent(new Event('alegra_profile_updated'));
  };

  const handlePrint = () => {
    // We execute standard window.print()
    // The print stylesheet will handle hiding all components except #invoice-print-area
    window.print();
  };

  // NCF Generator helper with invoice id
  const getNCF = () => {
    const idSeed = invoice.id.replace(/[^0-9]/g, '');
    const suffix = idSeed ? idSeed.slice(-8) : '00124930';
    return `${profile.ncfPrefix}${suffix}`.slice(0, 19);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto" id="invoice-printer-overlay">
      
      {/* 
        CRITICAL PRINT STYLESHEET EXCLUSIVE FOR THIS MODAL
        Hides all web interface elements and formats the body strictly for printing!
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all application elements */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY the selected print area */
          #invoice-print-area, #invoice-print-area * {
            visibility: visible !important;
          }
          #invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Custom size definitions based on format */
          ${format === 'thermal_80' ? `
            @page {
              size: 80mm auto;
              margin: 0;
            }
            #invoice-print-area {
              width: 76mm !important;
              max-width: 76mm !important;
              font-size: 11px !important;
              padding: 2mm !important;
            }
          ` : format === 'thermal_58' ? `
            @page {
              size: 58mm auto;
              margin: 0;
            }
            #invoice-print-area {
              width: 54mm !important;
              max-width: 54mm !important;
              font-size: 9px !important;
              padding: 1mm !important;
            }
          ` : `
            @page {
              size: letter;
              margin: 15mm;
            }
            #invoice-print-area {
              width: 100% !important;
              max-width: 100% !important;
              font-size: 12px !important;
            }
          `}
        }
      ` }} />

      <div className="bg-slate-50 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col md:flex-row overflow-hidden my-auto max-h-[90vh]">
        
        {/* LEFT COLUMN: Controls & Configurations */}
        <div className="w-full md:w-[360px] bg-white border-b md:border-b-0 md:border-r border-gray-200 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="text-left">
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Módulo de Impresión
                </span>
                <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wide mt-1">
                  Control de Impresoras
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                id="btn-close-printer-modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Seleccionar Formato de Factura:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setFormat('carta')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    format === 'carta' 
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-1 ring-indigo-600/30' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} className="text-indigo-600" />
                  <div className="text-left font-medium">
                    <div className="text-xs font-bold font-display">Normal (Formato Carta)</div>
                    <div className="text-[10px] text-gray-500">Impresoras de oficina / Guardar PDF</div>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('thermal_80')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    format === 'thermal_80' 
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-1 ring-indigo-600/30' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone size={18} className="text-emerald-600" />
                  <div className="text-left font-medium">
                    <div className="text-xs font-bold font-display">Térmica Comercial (80mm)</div>
                    <div className="text-[10px] text-gray-500">Mesa receptor estándar cocinas y caja</div>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('thermal_58')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    format === 'thermal_58' 
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-1 ring-indigo-600/30' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone size={18} className="text-amber-500 scale-90" />
                  <div className="text-left font-medium">
                    <div className="text-xs font-bold font-display">Térmica Compacta (58mm)</div>
                    <div className="text-[10px] text-gray-500">Slim / Impresoras portátiles bluetooth</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Collapsible config trigger */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-gray-200 hover:bg-slate-100 text-[11px] font-bold text-gray-700 transition-all cursor-pointer uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <SettingsIcon size={13} className="text-gray-550 animate-spin-slow" />
                {showConfig ? 'Ocultar Datos Negocio' : '⚙️ Configurar Datos Factura'}
              </span>
              <span className="text-[10px] text-indigo-600 font-bold">Configurar</span>
            </button>

            {/* CONFIGURATION FORM */}
            {showConfig && (
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Nombre de la Empresa:</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => saveProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">RNC / Cédula comercial:</label>
                  <input
                    type="text"
                    value={profile.rnc}
                    onChange={e => saveProfile({ ...profile, rnc: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Prefijo Fiscal NCF:</label>
                  <input
                    type="text"
                    value={profile.ncfPrefix}
                    onChange={e => saveProfile({ ...profile, ncfPrefix: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Dirección comercial:</label>
                  <textarea
                    value={profile.address}
                    rows={2}
                    onChange={e => saveProfile({ ...profile, address: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Teléfono contacto:</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => saveProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Logo Imprimible (Texto/Emoji):</label>
                  <input
                    type="text"
                    value={profile.logoPrintText}
                    onChange={e => saveProfile({ ...profile, logoPrintText: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Logo Color Panel:</label>
                  <input
                    type="color"
                    value={profile.logoColor}
                    onChange={e => saveProfile({ ...profile, logoColor: e.target.value })}
                    className="w-full h-8 bg-white border border-gray-200 rounded p-0.5 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold block uppercase">Formato Predefinido:</label>
                  <select
                    value={profile.defaultFormat}
                    onChange={e => saveProfile({ ...profile, defaultFormat: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="carta">Oficina / Carta Normal</option>
                    <option value="thermal_80">Térmico estándar (80mm)</option>
                    <option value="thermal_58">Térmico compacto (58mm)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2 mt-4 md:mt-0">
            <button
              onClick={handlePrint}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase cursor-pointer"
              id="btn-trigger-print-operation"
            >
              <Printer size={15} /> Mandar a Imprimidor Real
            </button>
            <p className="text-[9px] text-gray-400 italic text-center leading-normal">
              Previsualizado emulado. Presione el botón de arriba para lanzar el driver del navegador. Soporta descarga de archivo PDF e impresoras físicas locales.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Live High-Fidelity Rendering Preview */}
        <div className="flex-1 bg-slate-100 p-5 flex items-center justify-center overflow-y-auto min-h-[350px]">
          
          {/* Simulated Paper sheet preview wrapper */}
          <div 
            className={`transition-all duration-300 shadow-md border bg-white ${
              format === 'thermal_80' 
                ? 'w-[280px] p-4 font-mono text-[11px] text-slate-905 border-slate-300' 
                : format === 'thermal_58'
                ? 'w-[210px] p-3 font-mono text-[9px] text-slate-905 border-slate-300'
                : 'w-[100%] max-w-[580px] p-8 font-sans text-xs text-gray-800 border-gray-300 rounded-lg'
            }`}
          >
            
            <div id="invoice-print-area" className="space-y-4 text-left">
              
              {/* RENDERING FORMAT: CARTA/LETTER SHEET */}
              {format === 'carta' && (
                <div className="space-y-6">
                  {/* Header row */}
                  <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black"
                          style={{ backgroundColor: profile.logoColor }}
                        >
                          🍳
                        </div>
                        <h1 className="text-base font-black font-display text-slate-900 tracking-tight">
                          {profile.name}
                        </h1>
                      </div>
                      <p className="text-[10px] text-gray-500">{profile.address}</p>
                      <p className="text-[10px] text-gray-500">Teléfono: {profile.phone}</p>
                      <p className="text-[10.5px] font-mono text-gray-750 font-bold">RNC: {profile.rnc}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded font-black tracking-wider uppercase text-[9px]">
                        Factura Fiscal Pagada
                      </span>
                      <h2 className="text-sm font-black text-slate-800 mt-2">
                        {invoice.invoiceNumber}
                      </h2>
                      <p className="text-[9.5px] font-mono text-gray-500">NCF: <span className="font-bold text-gray-800">{getNCF()}</span></p>
                    </div>
                  </div>

                  {/* Customer Information detail bar */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 grid grid-cols-2 gap-4 text-[10.5px]">
                    <div className="space-y-0.5">
                      <span className="text-[8.5px] text-gray-400 font-extrabold uppercase tracking-wider block">Facturado a comensal:</span>
                      <p className="font-bold text-slate-800 text-[11px]">{invoice.clientName}</p>
                      <p className="font-mono text-gray-500">RNC/Identidad: {invoice.clientRnc || 'N/A'}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[8.5px] text-gray-400 font-extrabold uppercase tracking-wider block">Datos de Transacción:</span>
                      <p className="font-medium text-gray-650">Emisión: <span className="font-bold text-slate-800">{invoice.issueDate}</span></p>
                      <p className="font-medium text-gray-650">Pago: <span className="font-bold text-indigo-700">{invoice.paymentMethod || 'Efectivo'}</span></p>
                    </div>
                  </div>

                  {/* Table detail list */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-gray-100 text-gray-500 border-b border-gray-200 font-bold">
                          <th className="p-2.5">Detalle o Plato</th>
                          <th className="p-2.5 text-center">Cantidad</th>
                          <th className="p-2.5 text-right">Monto Unitario</th>
                          <th className="p-2.5 text-right">Importe Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {invoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/55">
                            <td className="p-2.5 text-slate-800 font-semibold">{item.name}</td>
                            <td className="p-2.5 text-center font-bold text-slate-705">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-mono text-slate-900 font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pricing recap block */}
                  <div className="flex flex-col items-end space-y-1 text-[11px] border-t border-gray-100 pt-3 text-gray-500">
                    <div className="w-64 flex justify-between">
                      <span>Subtotal gravado:</span>
                      <span className="font-bold text-slate-800 font-mono">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="w-64 flex justify-between text-red-650">
                        <span>Descuento aplicado:</span>
                        <span className="font-bold font-mono">-${invoice.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="w-64 flex justify-between">
                      <span>ITBIS / IVA (18% Cobertura):</span>
                      <span className="font-bold text-slate-800 font-mono">${invoice.taxes.toFixed(2)}</span>
                    </div>
                    <div className="w-64 flex justify-between border-t border-gray-250 pt-1.5 text-xs font-black text-slate-900">
                      <span>Monto Total Cobrado:</span>
                      <span className="font-black text-indigo-700 font-mono text-sm">${invoice.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Institutional layout footer notes */}
                  <div className="border-t border-dashed border-gray-200 pt-4 text-center space-y-1 text-[9.5px] text-gray-400">
                    <p className="font-semibold text-slate-500">*** Gracias por preferir {profile.name} ***</p>
                    <p>Licencia oficial Alegra Cloud - Contabilidad de Doble Entrada Automatizada.</p>
                    <p className="font-mono text-[8px]">Token Ref: {invoice.id} | Certificación DGII N° RD-21394-01</p>
                  </div>
                </div>
              )}


              {/* RENDERING FORMAT: THERMAL 80MM */}
              {format === 'thermal_80' && (
                <div className="space-y-4 font-mono leading-tight">
                  <div className="text-center space-y-1">
                    <div className="font-black text-xs uppercase tracking-tight block">
                      {profile.logoPrintText}
                    </div>
                    <div className="font-bold text-[11px] uppercase tracking-wider block">
                      {profile.name}
                    </div>
                    <p className="text-[9.5px] text-gray-600 uppercase block">{profile.address}</p>
                    <p className="text-[9.5px] text-gray-600 block">TELÉFONO: {profile.phone}</p>
                    <p className="font-bold border-y border-dashed border-gray-300 py-1 my-1 block text-[10.5px]">
                      RNC: {profile.rnc}
                    </p>
                  </div>

                  <div className="space-y-0.5 text-[10px] text-gray-800">
                    <div>FACTURA: <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span></div>
                    <div>FECHA: <span className="font-medium">{invoice.issueDate} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                    <div>NCF: <span className="font-bold">{getNCF()}</span></div>
                    <div>CLIENTE: <span className="font-semibold uppercase">{invoice.clientName}</span></div>
                    {invoice.clientRnc && <div>RNC CLIENTE: <span>{invoice.clientRnc}</span></div>}
                    <div>CAJERO: <span>#01 REST-ADMIN</span></div>
                    <div>PAGO: <span className="font-semibold uppercase">{invoice.paymentMethod || 'EFECTIVO'}</span></div>
                  </div>

                  {/* Horizontal line */}
                  <div className="border-b border-dashed border-gray-400 my-1"></div>

                  {/* Receipt Items breakdown */}
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-dashed border-gray-300 text-left font-bold text-slate-800">
                        <th className="pb-1">Detalle</th>
                        <th className="pb-1 text-center">Cant</th>
                        <th className="pb-1 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="align-top">
                          <td className="py-1">
                            {item.name}
                            <span className="block text-[8.5px] text-gray-500">${item.unitPrice.toFixed(0)} c/u</span>
                          </td>
                          <td className="py-1 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-1 text-right font-bold text-slate-900">${(item.quantity * item.unitPrice).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Dashed divider */}
                  <div className="border-b border-dashed border-gray-400 my-1"></div>

                  {/* Pricing block */}
                  <div className="space-y-1 text-right text-[10px]">
                    <div className="flex justify-between">
                      <span>SUBTOTAL GRAVADO:</span>
                      <span className="font-bold">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-red-650">
                        <span>DESCUENTO:</span>
                        <span className="font-bold">-${invoice.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>ITBIS (18.00%):</span>
                      <span className="font-bold">${invoice.taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black border-t border-dashed border-slate-400 pt-1 text-slate-950">
                      <span>NETO A PAGAR RD$:</span>
                      <span>${invoice.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Final footer */}
                  <div className="text-center space-y-1 text-[9px] pt-2 border-t border-dashed border-gray-300 text-gray-500">
                    <p className="font-bold text-slate-800">*** GRACIAS POR PREFERIRNOS ***</p>
                    <p>Facturación de Consumo Autorizada.</p>
                    <p>Alegra ERP • Santo Domingo, RD.</p>
                    <p className="font-mono text-[7px] text-gray-400 mt-2 block">
                      ID: {invoice.id.slice(0, 15)}
                    </p>
                  </div>
                </div>
              )}


              {/* RENDERING FORMAT: THERMAL 58MM */}
              {format === 'thermal_58' && (
                <div className="space-y-3.5 font-mono leading-tight tracking-tight">
                  <div className="text-center space-y-1">
                    <div className="font-black text-[10.5px] uppercase block">
                      {profile.logoPrintText}
                    </div>
                    <div className="font-bold text-[9.5px] uppercase block">
                      {profile.name.length > 24 ? profile.name.slice(0, 24) : profile.name}
                    </div>
                    <p className="text-[8px] text-gray-500 block truncate leading-none">{profile.address}</p>
                    <p className="text-[8.5px] text-gray-500 block">TEL: {profile.phone}</p>
                    <p className="font-bold border-y border-dashed border-gray-300 py-0.5 my-0.5 text-[8.5px] block">
                      RNC: {profile.rnc}
                    </p>
                  </div>

                  <div className="space-y-0.5 text-[8px] text-gray-600 leading-normal">
                    <div>TKT: <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span></div>
                    <div>NCF: <span className="font-bold">{getNCF().slice(0,19)}</span></div>
                    <div>CLI: <span className="font-bold uppercase">{invoice.clientName.slice(0, 18)}</span></div>
                    <div>PAGO: <span className="font-bold uppercase">{invoice.paymentMethod?.slice(0, 10) || 'EFECTIVO'}</span></div>
                  </div>

                  {/* Horizontal line */}
                  <div className="border-b border-dashed border-gray-400 my-0.5"></div>

                  {/* Slim breakdown table */}
                  <table className="w-full text-[8.5px]">
                    <thead>
                      <tr className="border-b border-dashed border-gray-300 text-left font-bold">
                        <th className="pb-0.5">Plato</th>
                        <th className="pb-0.5 text-center">Cant</th>
                        <th className="pb-0.5 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="align-middle">
                          <td className="py-0.5 truncate max-w-[90px] font-medium">
                            {item.name}
                          </td>
                          <td className="py-0.5 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-0.5 text-right font-bold text-slate-900">${(item.quantity * item.unitPrice).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Divider */}
                  <div className="border-b border-dashed border-gray-450 my-0.5"></div>

                  {/* Compact summation block */}
                  <div className="space-y-0.5 text-right text-[8.5px]">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span className="font-bold">${invoice.subtotal.toFixed(0)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-red-650">
                        <span>DSCTO:</span>
                        <span className="font-bold">-${invoice.discount.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>ITBIS 18%:</span>
                      <span className="font-bold">${invoice.taxes.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[9.5px] font-black border-t border-dashed border-slate-405 pt-0.5 text-slate-950">
                      <span>TOTAL RD$:</span>
                      <span>${invoice.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Simple compact footer */}
                  <div className="text-center space-y-0.5 text-[8px] pt-1.5 border-t border-dashed border-gray-300 text-gray-500 leading-none">
                    <p className="font-bold text-slate-850">*** GRACIAS ***</p>
                    <p>Factura Simplex POS.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

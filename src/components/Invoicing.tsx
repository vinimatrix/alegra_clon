/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  FileCheck, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  X,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Invoice, Product, Client, InvoiceItem } from '../types';
import InvoicePrinterModal from './InvoicePrinterModal';

interface InvoicingProps {
  invoices: Invoice[];
  products: Product[];
  clients: Client[];
  onAddInvoice: (newInvoice: Invoice) => void;
  onCancelInvoice: (id: string) => void;
}

export default function Invoicing({ invoices, products, clients, onAddInvoice, onCancelInvoice }: InvoicingProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState<Invoice | null>(null);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pagada' | 'pendiente' | 'anulada'>('todos');

  // New Invoice form state
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    paymentMethod: 'Transferencia Bancaria'
  });

  const [selectedItems, setSelectedItems] = useState<Omit<InvoiceItem, 'total'>[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: 1,
    discount: 0
  });

  // Derived calculations for current invoice draft
  const subtotalDraft = selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountDraft = selectedItems.reduce((sum, item) => sum + item.discount, 0);
  const taxesDraft = selectedItems.reduce((sum, item) => sum + ((item.quantity * item.unitPrice - item.discount) * item.taxRate), 0);
  const totalDraft = subtotalDraft - discountDraft + taxesDraft;

  // Filtered invoice list
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.clientRnc.includes(searchQuery);
    
    if (statusFilter === 'todos') return matchesSearch;
    return matchesSearch && inv.status === statusFilter;
  });

  const handleAddItem = () => {
    if (!currentItem.productId) return;
    const prod = products.find(p => p.id === currentItem.productId);
    if (!prod) return;

    // Check if product is already added in draft
    const index = selectedItems.findIndex(i => i.productId === currentItem.productId);
    if (index >= 0) {
      const updated = [...selectedItems];
      updated[index].quantity += Number(currentItem.quantity);
      updated[index].discount += Number(currentItem.discount);
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        productId: prod.id,
        name: prod.name,
        quantity: Number(currentItem.quantity),
        unitPrice: prod.price,
        discount: Number(currentItem.discount),
        taxRate: prod.taxRate
      }]);
    }

    // Reset current item selector
    setCurrentItem({ productId: '', quantity: 1, discount: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || selectedItems.length === 0) {
      alert("Por favor selecciona un cliente y agrega al menos un producto.");
      return;
    }

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;

    const newInvoiceNumber = `FC-${1000 + invoices.length + 1}`;
    
    // Complete items object including total
    const completeItems: InvoiceItem[] = selectedItems.map(item => ({
      ...item,
      total: (item.quantity * item.unitPrice) - item.discount + (((item.quantity * item.unitPrice) - item.discount) * item.taxRate)
    }));

    const newInvoice: Invoice = {
      id: `f-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      clientId: client.id,
      clientName: client.name,
      clientRnc: client.rnc,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      items: completeItems,
      subtotal: subtotalDraft,
      taxes: taxesDraft,
      discount: discountDraft,
      total: totalDraft,
      status: formData.paymentMethod === 'Pendiente' ? 'pendiente' : 'pagada',
      notes: formData.notes,
      paymentMethod: formData.paymentMethod
    };

    onAddInvoice(newInvoice);
    
    // Reset state & close
    setSelectedItems([]);
    setFormData({
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      paymentMethod: 'Transferencia Bancaria'
    });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6" id="invoicing-screen">
      {/* Upper header action section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display">
            Facturas de Venta
          </h1>
          <p className="text-sm text-gray-500">
            Crea, asienta e implementa facturas autorizadas de acuerdo con normativas locales e ITBIS/IVA.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-alegra-primary hover:bg-alegra-primary-dark text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
            id="btn-open-invoice-creator"
          >
            <Plus size={16} />
            Nueva Factura de Ventas
          </button>
        </div>
      </div>

      {/* Filter and search parameters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-xs" id="invoice-filters-container">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente, RNC, N° factura..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50/50 hover:bg-gray-50 focus:bg-white text-xs border border-gray-200 focus:border-alegra-primary pl-9 pr-4 py-2 rounded-lg outline-none transition-all text-gray-800"
            id="invoice-search-input"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 font-display">
          <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">Filtrar por:</span>
          {['todos', 'pagada', 'pendiente', 'anulada'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-alegra-secondary text-white' 
                  : 'bg-gray-100/60 hover:bg-gray-100 text-gray-600'
              }`}
              id={`status-filter-${status}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing invoices */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden" id="invoices-table-card">
        <div className="overflow-x-auto0">
          <table className="w-full text-xs text-left text-gray-500" id="invoices-list-table">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Código / Número</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Identificación RNC</th>
                <th className="py-3 px-4 text-center">Fecha Emisión</th>
                <th className="py-3 px-4 text-center">Fecha Vencimiento</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No se encontraron facturas con los parámetros aplicados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/30 transition-all text-gray-800">
                    <td className="py-4 px-4 font-mono font-bold text-alegra-secondary">{inv.invoiceNumber}</td>
                    <td className="py-4 px-4 font-semibold text-gray-900">{inv.clientName}</td>
                    <td className="py-4 px-4 font-mono text-gray-500">{inv.clientRnc}</td>
                    <td className="py-4 px-4 text-center">{inv.issueDate}</td>
                    <td className="py-4 px-4 text-center">{inv.dueDate}</td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900">${inv.total.toFixed(2)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'pagada' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : inv.status === 'pendiente' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {inv.status === 'pagada' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {inv.status === 'pendiente' ? 'Pendiente cobro' : inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setShowPreviewModal(inv)}
                          className="p-1 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded flex items-center gap-1 hover:text-alegra-secondary cursor-pointer"
                          title="Visualizar Recibo"
                          id={`btn-view-invoice-${inv.id}`}
                        >
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>
                        {inv.status !== 'anulada' && (
                          <button
                            onClick={() => onCancelInvoice(inv.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded border border-gray-100 hover:border-red-200 cursor-pointer"
                            title="Anular Factura"
                            id={`btn-cancel-invoice-${inv.id}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODERN MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" id="create-invoice-modal">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden my-4 border border-gray-100">
            {/* Modal header */}
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <PlusCircle size={20} className="text-alegra-primary" />
                <h2 className="text-base font-bold text-alegra-secondary font-display">Crear Nueva Factura Sincronizada</h2>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-200 text-gray-500 rounded-full transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal content Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Clients section & dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Cliente Receptor</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  >
                    <option value="">-- Elija un Cliente del Directorio --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.rnc !== 'N/A' ? `(${c.rnc})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Método de Cobro Pago</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  >
                    <option value="Transferencia Bancaria">Pago Directo - Transferencia Bancaria (Venta Cobrada)</option>
                    <option value="Tarjeta de Crédito">Pago Directo - Tarjeta de Crédito (Venta Cobrada)</option>
                    <option value="Efectivo">Pago Directo - Efectivo (Venta Cobrada)</option>
                    <option value="Pendiente">Crédito - Cuenta por Cobrar (Asiento Automático Pendiente)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Notas / Observaciones del Recibo</label>
                  <input
                    type="text"
                    placeholder="Condiciones de venta, términos adicionales..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Interactive Item selection */}
              <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Añadir Items / Artículos a Detalle</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-gray-600 font-semibold mb-1">Producto</label>
                    <select
                      value={currentItem.productId}
                      onChange={(e) => setCurrentItem({ ...currentItem, productId: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    >
                      <option value="">-- Buscar artículo en Almacén --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) | stock: {p.stock} p. - ${p.price}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full bg-alegra-secondary hover:bg-slate-850 text-white font-semibold py-2 rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus size={14} /> Añadir Línea
                    </button>
                  </div>
                </div>

                {/* Grid of added items in Draft */}
                {selectedItems.length > 0 && (
                  <div className="mt-4 overflow-x-auto border border-gray-100 rounded bg-white">
                    <table className="w-full text-left bg-white text-[11px] text-gray-600">
                      <thead className="bg-slate-100 text-gray-500 uppercase text-[9px] font-bold">
                        <tr>
                          <th className="p-2.5">Artículo / Concepto</th>
                          <th className="p-2.5 text-center">Cantidad</th>
                          <th className="p-2.5 text-right">Precio Unitario</th>
                          <th className="p-2.5 text-center">IGV / TAX (18%)</th>
                          <th className="p-2.5 text-right">Monto total</th>
                          <th className="p-2.5 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2.5 font-medium text-gray-900">{item.name}</td>
                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-2.5 text-center">18%</td>
                            <td className="p-2.5 text-right font-bold">${((item.quantity * item.unitPrice) * 1.18).toFixed(2)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subtotal indicators */}
              <div className="flex flex-col items-end pr-4 text-xs font-semibold space-y-2 text-gray-700">
                <div className="w-72 flex justify-between border-b border-gray-100 pb-1">
                  <span>Subtotal:</span>
                  <span className="text-gray-900">${subtotalDraft.toFixed(2)}</span>
                </div>
                <div className="w-72 flex justify-between border-b border-gray-100 pb-1">
                  <span>Impuestos (ITBIS 18%):</span>
                  <span className="text-gray-900">${taxesDraft.toFixed(2)}</span>
                </div>
                <div className="w-72 flex justify-between bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg text-blue-700 text-sm font-bold">
                  <span>Monto Total:</span>
                  <span>${totalDraft.toFixed(2)}</span>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-alegra-primary hover:bg-alegra-primary-dark text-white px-5 py-2 rounded font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FileCheck size={16} /> Emitir y Contabilizar Asiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED RECEIPT / INVOICE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" id="preview-invoice-modal">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col p-6 space-y-6 border border-gray-150">
            {/* Invoice Design Standard Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-150">
              <div>
                <span className="text-xs uppercase bg-blue-600 text-white font-black px-3 py-1 rounded shadow-sm">Alegra+</span>
                <p className="text-gray-400 font-mono text-[9px] mt-1.5 leading-tight">SOLUCIONES DIGITALES CLONE<br />RNC: 123-45678-9<br />Av. Metropolitana #90</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-alegra-secondary font-display uppercase tracking-wider">Factura de Crédito</h2>
                <h3 className="text-sm font-bold font-mono text-blue-600">{showPreviewModal.invoiceNumber}</h3>
                <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  showPreviewModal.status === 'pagada' ? 'bg-emerald-100 text-emerald-800' : showPreviewModal.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {showPreviewModal.status}
                </span>
              </div>
            </div>

            {/* Client specifics & metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-1">Adquiriente / Cliente</p>
                <h4 className="font-bold text-gray-800 text-sm">{showPreviewModal.clientName}</h4>
                <p className="font-mono mt-0.5">Identificación RNC: {showPreviewModal.clientRnc}</p>
                <p className="font-sans">Método de Cobro: {showPreviewModal.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-1">Fechas Clave</p>
                <p><span className="font-bold">Emisión:</span> {showPreviewModal.issueDate}</p>
                <p><span className="font-bold">Vencimiento:</span> {showPreviewModal.dueDate}</p>
              </div>
            </div>

            {/* List of details */}
            <div className="border border-gray-150 rounded overflow-hidden">
              <table className="w-full text-[11px] text-left text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[9px] font-extrabold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Detalle Artículo</th>
                    <th className="p-3 text-center">Cantidad</th>
                    <th className="p-3 text-right">Precio Unit.</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {showPreviewModal.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3 font-medium text-gray-900">{item.name}</td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Balance summation */}
            <div className="flex flex-col items-end space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-4">
              <div className="w-56 flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900">${showPreviewModal.subtotal.toFixed(2)}</span>
              </div>
              {showPreviewModal.discount > 0 && (
                <div className="w-56 flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-${showPreviewModal.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="w-56 flex justify-between">
                <span>Impuesto ITBIS / IVA (18%):</span>
                <span className="font-medium text-gray-900">${showPreviewModal.taxes.toFixed(2)}</span>
              </div>
              <div className="w-56 flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-alegra-primary">
                <span>Total General:</span>
                <span>${showPreviewModal.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Print or Close */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] text-gray-400 italic">Generado electrónicamente por Alegra Clone ERP</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPrinterOpen(true)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 px-4 rounded text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Download size={14} /> Configurar e Imprimir
                </button>
                <button
                  onClick={() => setShowPreviewModal(null)}
                  className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-600 py-1.5 px-3 rounded text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InvoicePrinterModal
        invoice={showPreviewModal}
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />
    </div>
  );
}

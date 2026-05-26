/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  MapPin, 
  PlusCircle, 
  AlertCircle, 
  TrendingUp, 
  Check, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Product, Warehouse } from '../types';

interface InventoryProps {
  products: Product[];
  warehouses: Warehouse[];
  onAdjustStock: (productId: string, adjustmentQty: number, reason: string) => void;
  onAddProduct: (newProduct: Product) => void;
}

export default function Inventory({ products, warehouses, onAdjustStock, onAddProduct }: InventoryProps) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState('Recibo de Mercancía / Compra');

  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: '10',
    minStock: '5',
    category: 'Platos',
    warehouseId: 'wh-main',
    description: ''
  });

  // Derived inventory metrics
  const totalValuation = products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
  const totalItemsCount = products.reduce((acc, p) => acc + p.stock, 0);
  const alertCount = products.filter(p => p.stock <= p.minStock).length;

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const finalQty = adjustType === 'add' ? adjustQty : -adjustQty;
    onAdjustStock(selectedProductId, finalQty, adjustReason);

    // Reset Form
    setAdjustQty(1);
    setSelectedProductId('');
    setShowAdjustModal(false);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.price || !newProduct.cost) {
      alert("Por favor llena todos los campos marcados como obligatorios.");
      return;
    }

    const priceNum = Number(newProduct.price);
    const costNum = Number(newProduct.cost);
    const stockNum = Number(newProduct.stock);
    const minStockNum = Number(newProduct.minStock);

    const createdProduct: Product = {
      id: `p-${Date.now()}`,
      name: newProduct.name,
      sku: newProduct.sku,
      price: priceNum,
      cost: costNum,
      stock: stockNum,
      minStock: minStockNum,
      category: newProduct.category,
      warehouseId: newProduct.warehouseId,
      taxRate: 0.18,
      description: newProduct.description
    };

    onAddProduct(createdProduct);
    
    // Reset state & close
    setNewProduct({
      name: '',
      sku: '',
      price: '',
      cost: '',
      stock: '10',
      minStock: '5',
      category: 'Platos',
      warehouseId: 'wh-main',
      description: ''
    });
    setShowProductModal(false);
  };

  return (
    <div className="space-y-6" id="inventory-screen">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display">
            Inventario & Almacenes
          </h1>
          <p className="text-sm text-gray-500">
            Controla existencias físicas de mercancía, gestiona bodegas en tiempo real y realiza ajustes de stock inmediatos.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="inline-flex items-center gap-1.5 bg-alegra-secondary hover:bg-slate-850 text-white font-medium text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            Ajustar Inventario
          </button>
          <button
            onClick={() => setShowProductModal(true)}
            className="inline-flex items-center gap-1.5 bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
            id="btn-add-product"
          >
            <PlusCircle size={14} />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Warehouse / Inventory general metrics visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="inv-metrics-grid">
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Package size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Unidades Totales</p>
            <h3 className="text-xl font-bold text-gray-900 font-display mt-0.5">{totalItemsCount} pzs</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Valoración Almacén (Costo)</p>
            <h3 className="text-xl font-bold text-gray-900 font-display mt-0.5">${totalValuation.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-rose-600 rounded-lg shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Artículos Bajo Mínimo</p>
            <h3 className="text-xl font-bold text-rose-600 font-display mt-0.5">{alertCount} alertas</h3>
          </div>
        </div>
      </div>

      {/* Warehouses list visualization */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-3" id="warehouses-list-container">
        <h2 className="text-xs font-bold text-alegra-secondary uppercase tracking-widest pl-1">Bodegas y Sucursales registradas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {warehouses.map(w => (
            <div key={w.id} className="bg-white p-3.5 rounded-xl border border-gray-150 flex flex-col justify-between shadow-xs">
              <div>
                <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                  w.isDefault ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 font-medium'
                }`}>
                  {w.isDefault ? 'Bodega Principal' : 'Bodega Especial'}
                </span>
                <h3 className="text-xs font-bold font-display text-gray-900">{w.name}</h3>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin size={10} /> {w.location}
                </p>
              </div>
              <span className="text-[10px] text-blue-600 font-bold mt-3 block">
                {products.filter(p => p.warehouseId === w.id).reduce((sum, p) => sum + p.stock, 0)} Items físicos
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Products Stock List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden" id="products-list-card">
        <div className="p-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-alegra-secondary font-display">Existencias Totales de Artículos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-500">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
              <tr>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Nombre de Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Bodega</th>
                <th className="py-3 px-4 text-right">Costo unit.</th>
                <th className="py-3 px-4 text-right">Precio venta</th>
                <th className="py-3 px-4 text-center">Stock físico</th>
                <th className="py-3 px-4 text-center">Estado Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              {products.map(p => {
                const isUnderMin = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-mono font-semibold text-alegra-secondary">{p.sku}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-gray-600 font-medium">
                      {p.warehouseId === 'wh-kitchen' ? 'Cocina' : p.warehouseId === 'wh-pos' ? 'POS' : 'Almacén Central'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-gray-500">${p.cost.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">${p.price.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono">
                      <span className={isUnderMin ? 'text-red-500 font-extrabold' : 'text-gray-900'}>
                        {p.stock} p.
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isUnderMin 
                          ? 'bg-red-50 text-red-700 font-semibold' 
                          : 'bg-green-50 text-green-700 font-semibold'
                      }`}>
                        {isUnderMin ? 'Reponer Stock!' : 'Nivel Seguro'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST INVENTORY DIALOG MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-widest font-display">Ajustar Existencia Física</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-450 hover:text-gray-600 font-bold p-1 cursor-pointer">X</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-gray-700 font-sans">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Seleccionar Producto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none"
                  required
                >
                  <option value="">-- Elige un artículo --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) | Stock actual: {p.stock}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Tipo de Movimiento</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none"
                  >
                    <option value="add">Entrada (+) Adición</option>
                    <option value="remove">Salida (-) Reducción</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Cantidad Física</label>
                  <input
                    type="number"
                    min={1}
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Motivo / Explicación del Ajuste</label>
                <input
                  type="text"
                  placeholder="e.g. Diferencia de inventario anual, pérdida por merma..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded w-1/3 cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold py-2 rounded flex-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check size={14} /> Registrar Ajuste ERP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PRODUCT MODAL OVERLAY */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-widest font-display">Ingresar Nuevo Producto / Servicio</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-450 hover:text-gray-600 font-bold p-1 cursor-pointer">X</button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hamburger con Tocino"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">SKU Autogenerado / Código *</label>
                  <input
                    type="text"
                    placeholder="e.g. REST-9020"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Costo Unitario de Adquisición ($) *</label>
                  <input
                    type="number"
                    min={0.1}
                    placeholder="120"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Precio Público de Venta ($) *</label>
                  <input
                    type="number"
                    min={0.1}
                    placeholder="350"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Almacén de Entrada</label>
                  <select
                    value={newProduct.warehouseId}
                    onChange={(e) => setNewProduct({ ...newProduct, warehouseId: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  >
                    <option value="Platos">Platos (Cocina)</option>
                    <option value="Bebidas">Bebidas (Bar)</option>
                    <option value="Tecnología">Tecnología (POS)</option>
                    <option value="Hogar">Hogar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Breve descripción</label>
                  <input
                    type="text"
                    value={newProduct.description}
                    placeholder="Sabor tradicional de la casa..."
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded w-1/3 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold py-2 rounded flex-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check size={14} /> Registrar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

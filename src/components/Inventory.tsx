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
  Info,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { Product, Warehouse, Invoice, RestaurantOrder } from '../types';

interface InventoryProps {
  products: Product[];
  warehouses: Warehouse[];
  onAdjustStock: (productId: string, adjustmentQty: number, reason: string) => void;
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  invoices?: Invoice[];
  orders?: RestaurantOrder[];
  categories: string[];
  onUpdateCategories: (updatedCategories: string[]) => void;
  taxes: any[];
  onUpdateTaxes: (updatedTaxes: any[]) => void;
}

export default function Inventory({ 
  products, 
  warehouses, 
  onAdjustStock, 
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  invoices = [],
  orders = [],
  categories,
  onUpdateCategories,
  taxes,
  onUpdateTaxes
}: InventoryProps) {
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
    description: '',
    taxRate: '18' // percentage representation (e.g. 18 for 18%)
  });

  // Edit / Delete operational states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: 0,
    minStock: '',
    category: 'Platos',
    warehouseId: 'wh-main',
    description: '',
    taxRate: '18'
  });

  // CATEGORY AND TAX MANAGEMENT STATE
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showCategoryFormModal, setShowCategoryFormModal] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState<'add' | 'edit'>('add');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');

  const [showManageTaxesModal, setShowManageTaxesModal] = useState(false);
  const [showTaxFormModal, setShowTaxFormModal] = useState(false);
  const [taxFormMode, setTaxFormMode] = useState<'add' | 'edit'>('add');
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [taxNameInput, setTaxNameInput] = useState('');
  const [taxRateInput, setTaxRateInput] = useState('18');

  const [showDeleteBlockModal, setShowDeleteBlockModal] = useState(false);
  const [blockingReferences, setBlockingReferences] = useState<{ invoices: Invoice[], orders: RestaurantOrder[] }>({
    invoices: [],
    orders: []
  });

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState('');

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
    const taxValue = Number(newProduct.taxRate) / 100;

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
      taxRate: isNaN(taxValue) ? 0.18 : taxValue,
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
      category: categories[0] || 'Platos',
      warehouseId: 'wh-main',
      description: '',
      taxRate: '18'
    });
    setShowProductModal(false);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const rawTax = product.taxRate !== undefined && product.taxRate !== null ? product.taxRate : 0.18;
    setEditProductForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      cost: String(product.cost),
      stock: product.stock,
      minStock: String(product.minStock),
      category: product.category,
      warehouseId: product.warehouseId,
      description: product.description || '',
      taxRate: parseFloat((rawTax * 100).toFixed(4)).toString()
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editProductForm.name || !editProductForm.sku || !editProductForm.price || !editProductForm.cost) {
      alert("Por favor llena todos los campos marcados como obligatorios.");
      return;
    }

    const taxValue = Number(editProductForm.taxRate) / 100;

    const updatedProduct: Product = {
      ...editingProduct,
      name: editProductForm.name,
      sku: editProductForm.sku,
      price: Number(editProductForm.price),
      cost: Number(editProductForm.cost),
      minStock: Number(editProductForm.minStock),
      category: editProductForm.category,
      warehouseId: editProductForm.warehouseId,
      description: editProductForm.description,
      taxRate: isNaN(taxValue) ? 0.18 : taxValue
    };

    onUpdateProduct(updatedProduct);
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // CATEGORY MANAGEMENT HELPERS
  const handleAddCategory = () => {
    if (!categoryNameInput.trim()) {
      alert('Por favor introduce un nombre para la categoría.');
      return;
    }
    const catName = categoryNameInput.trim();
    if (categories.some(c => c.toLowerCase() === catName.toLowerCase())) {
      alert('Esta categoría ya existe.');
      return;
    }
    onUpdateCategories([...categories, catName]);
    setShowCategoryFormModal(false);
    setCategoryNameInput('');
  };

  const handleEditCategory = () => {
    if (editingCategoryIndex === null || !categoryNameInput.trim()) {
      alert('Por favor introduce un nombre válido.');
      return;
    }
    const oldName = categories[editingCategoryIndex];
    const newName = categoryNameInput.trim();
    
    if (categories.some((c, i) => i !== editingCategoryIndex && c.toLowerCase() === newName.toLowerCase())) {
      alert('Esta categoría ya existe.');
      return;
    }

    // Rename dynamic category in all products automatically!
    const renamedProducts = products.map(p => p.category === oldName ? { ...p, category: newName } : p);
    for (const p of renamedProducts) {
      if (p.category === newName) {
        onUpdateProduct(p);
      }
    }

    const updated = [...categories];
    updated[editingCategoryIndex] = newName;
    onUpdateCategories(updated);
    
    setShowCategoryFormModal(false);
    setEditingCategoryIndex(null);
    setCategoryNameInput('');
  };

  const handleDeleteCategory = (catName: string) => {
    const productsInCat = products.filter(p => p.category === catName);
    if (productsInCat.length > 0) {
      alert(`No se puede eliminar la categoría "${catName}" porque hay ${productsInCat.length} productos registrados bajo esta categoría. Reasigna o elimina los productos antes de borrar la categoría.`);
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la categoría "${catName}"?`)) {
      const updated = categories.filter(c => c !== catName);
      onUpdateCategories(updated);
    }
  };

  // TAX MANAGEMENT HELPERS
  const handleAddTax = () => {
    if (!taxNameInput.trim() || !taxRateInput.trim()) {
      alert('Por favor introduce un nombre e impuesto válidos.');
      return;
    }
    const newTax = {
      id: `tax-${Date.now()}`,
      name: taxNameInput.trim(),
      rate: Number(taxRateInput) || 0
    };
    onUpdateTaxes([...taxes, newTax]);
    setShowTaxFormModal(false);
    setTaxNameInput('');
    setTaxRateInput('18');
  };

  const handleEditTax = () => {
    if (editingTaxId === null || !taxNameInput.trim() || !taxRateInput.trim()) {
      alert('Por favor introduce un nombre e impuesto válidos.');
      return;
    }
    const newRate = Number(taxRateInput) || 0;
    const oldTax = taxes.find(t => t.id === editingTaxId);
    
    const updated = taxes.map(t => t.id === editingTaxId ? {
      ...t,
      name: taxNameInput.trim(),
      rate: newRate
    } : t);
    
    onUpdateTaxes(updated);

    // Also update products with the old taxRate to new rate
    if (oldTax && oldTax.rate !== newRate) {
      const oldRateDecimal = oldTax.rate / 100;
      const newRateDecimal = newRate / 100;
      products.forEach(p => {
        if (Math.abs(p.taxRate - oldRateDecimal) < 0.001) {
          onUpdateProduct({ ...p, taxRate: newRateDecimal });
        }
      });
    }

    setShowTaxFormModal(false);
    setEditingTaxId(null);
    setTaxNameInput('');
    setTaxRateInput('18');
  };

  const handleDeleteTaxNum = (taxId: string) => {
    const taxToDelete = taxes.find(t => t.id === taxId);
    if (!taxToDelete) return;
    
    const rateDecimal = Number(taxToDelete.rate) / 100;
    const productsWithTax = products.filter(p => Math.abs(p.taxRate - rateDecimal) < 0.001);
    
    if (productsWithTax.length > 0) {
      alert(`No se puede eliminar el impuesto "${taxToDelete.name}" porque hay ${productsWithTax.length} productos utilizándolo actualmente. Modifica la tasa tributaria de esos productos antes de eliminar este impuesto.`);
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el impuesto "${taxToDelete.name}"?`)) {
      const updated = taxes.filter(t => t.id !== taxId);
      onUpdateTaxes(updated);
    }
  };

  const handleDeleteClick = (product: Product) => {
    const refInvoices = invoices.filter(inv => inv.items?.some(item => item.productId === product.id));
    const refOrders = orders.filter(ord => ord.items?.some(item => item.productId === product.id));

    if (refInvoices.length > 0 || refOrders.length > 0) {
      setBlockingReferences({ invoices: refInvoices, orders: refOrders });
      setEditingProduct(product);
      setShowDeleteBlockModal(true);
    } else {
      setDeletingProductId(product.id);
      setEditingProduct(product);
      setShowDeleteConfirmModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingProductId) {
      onDeleteProduct(deletingProductId);
    }
    setShowDeleteConfirmModal(false);
    setDeletingProductId('');
    setEditingProduct(null);
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowManageCategoriesModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
          >
            <Layers size={14} className="text-alegra-primary" />
            Categorías
          </button>
          <button
            onClick={() => setShowManageTaxesModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
          >
            <Info size={14} className="text-alegra-primary" />
            Impuestos
          </button>
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
                <th className="py-3 px-4 text-center">Acciones</th>
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
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                    min="0"
                    step="0.01"
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
                    min="0"
                    step="0.01"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Impuesto Aplicable</label>
                  <select
                    value={newProduct.taxRate}
                    onChange={(e) => setNewProduct({ ...newProduct, taxRate: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary font-mono font-semibold"
                  >
                    {taxes.map(t => (
                      <option key={t.id} value={t.rate}>{t.name} ({t.rate}%)</option>
                    ))}
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

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-widest font-display">Editar Detalles de Producto</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-450 hover:text-gray-600 font-bold p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    value={editProductForm.name}
                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">SKU Code / Código *</label>
                  <input
                    type="text"
                    value={editProductForm.sku}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Costo de Adquisición ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editProductForm.cost}
                    onChange={(e) => setEditProductForm({ ...editProductForm, cost: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Existencia (Stock)</label>
                  <input
                    type="number"
                    value={editProductForm.stock}
                    className="w-full bg-gray-105 border border-gray-300 rounded px-2.5 py-2 outline-none font-bold text-gray-500 cursor-not-allowed"
                    disabled
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Para mermas / entradas, usa Ajustar Inventario.</span>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    value={editProductForm.minStock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, minStock: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Ubicación / Bodega</label>
                  <select
                    value={editProductForm.warehouseId}
                    onChange={(e) => setEditProductForm({ ...editProductForm, warehouseId: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Categoría</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Impuesto Aplicable</label>
                  <select
                    value={editProductForm.taxRate}
                    onChange={(e) => setEditProductForm({ ...editProductForm, taxRate: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary font-mono font-semibold"
                  >
                    {taxes.map(t => (
                      <option key={t.id} value={t.rate}>{t.name} ({t.rate}%)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Descripción</label>
                  <input
                    type="text"
                    value={editProductForm.description}
                    onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded px-2.5 py-2 outline-none focus:border-alegra-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded w-1/3 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold py-2 rounded flex-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check size={14} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BLOCK MODAL */}
      {showDeleteBlockModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider font-display flex items-center gap-1.5">
                <AlertCircle size={16} /> Operación No Permitida
              </h3>
              <button onClick={() => setShowDeleteBlockModal(false)} className="text-gray-450 hover:text-gray-600 font-bold p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-900">
                No se puede eliminar "{editingProduct.name}" del catálogo.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Este artículo está vinculado a transacciones registradas en el sistema. Para proteger la integridad fiscal y evitar asimetrías de datos históricos, la eliminación física de este producto está bloqueada:
              </p>

              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl space-y-2">
                {blockingReferences.invoices.length > 0 && (
                  <div className="text-rose-800">
                    <span className="font-bold text-xs">Facturas de venta asociadas:</span> {blockingReferences.invoices.length} factura(s)
                    <div className="text-[10px] text-rose-650 font-mono mt-1 max-h-16 overflow-y-auto">
                      {blockingReferences.invoices.map(inv => inv.invoiceNumber).join(', ')}
                    </div>
                  </div>
                )}
                {blockingReferences.orders.length > 0 && (
                  <div className="text-rose-800 pt-1.5 border-t border-rose-100/40">
                    <span className="font-bold text-xs">Comandas de restaurante:</span> {blockingReferences.orders.length} comanda(s) vinculada(s)
                    <div className="text-[10px] text-rose-650 font-mono mt-1 max-h-16 overflow-y-auto">
                      {blockingReferences.orders.map((ord, idx) => `Mesa ${ord.tableName || ord.tableId} (${ord.status})`).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-gray-400 italic">
                Sugerencia ERP: Si es un platillo o artículo descontinuado, te sugerimos editar su nombre agregando "(Inactivo)" y bajar su precio a $0.00 para que tus registros de facturación anteriores permanezcan intactos.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteBlockModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-lg cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirmModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest font-display">Confirmar Eliminación</h3>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="text-gray-450 hover:text-gray-600 font-bold p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-gray-500 leading-relaxed font-sans">
                ¿Estás completamente seguro de que deseas eliminar permanentemente el producto <span className="font-bold text-gray-900">"{editingProduct.name}"</span> (SKU: {editingProduct.sku}) del catálogo ERP de Alegra+?
              </p>
              <p className="text-amber-700 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-sans">
                ⚠️ Advertencia: Esta acción es irreversible y removerá el registro de la base de datos de forma definitiva.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded w-1/3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-656 hover:bg-red-700 text-white font-bold py-2.5 rounded flex-1 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Sí, Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * MANAGE CATEGORIES MODAL (List view)
       *******************************************************/
      showManageCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-750">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                <Layers size={14} className="text-alegra-primary" /> Administración de Categorías
              </h3>
              <button 
                onClick={() => setShowManageCategoriesModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-gray-100">
              <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                Estas categorías organizan el menú de barra, cocina y el catálogo POS de servicios.
              </p>
              <button
                onClick={() => {
                  setCategoryFormMode('add');
                  setCategoryNameInput('');
                  setEditingCategoryIndex(null);
                  setShowCategoryFormModal(true);
                }}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <PlusCircle size={12} /> Nueva
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-150 rounded-xl divide-y divide-gray-100 font-sans">
              {categories.map((cat, index) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div key={index} className="flex justify-between items-center p-3 hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-gray-900">{cat}</span>
                      <span className="text-[10px] text-gray-400 block">{count} productos asociados</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCategoryFormMode('edit');
                          setCategoryNameInput(cat);
                          setEditingCategoryIndex(index);
                          setShowCategoryFormModal(true);
                        }}
                        className="text-alegra-primary hover:text-alegra-primary-dark font-bold hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-red-656 hover:text-red-700 font-bold hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * CATEGORY FORM MODAL (Add / Edit)
       *******************************************************/
      showCategoryFormModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display">
                {categoryFormMode === 'add' ? 'Añadir Categoría' : 'Editar Categoría'}
              </h3>
              <button 
                onClick={() => setShowCategoryFormModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 font-sans">Nombre comercial de la categoría *</label>
              <input
                type="text"
                placeholder="Ej. Postres calientes"
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-800 font-sans"
              />
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCategoryFormModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg w-1/3 cursor-pointer"
              >
                Regresar
              </button>
              <button
                type="button"
                onClick={categoryFormMode === 'add' ? handleAddCategory : handleEditCategory}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2 rounded-lg flex-1 cursor-pointer text-center"
              >
                {categoryFormMode === 'add' ? 'Crear' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * MANAGE TAXES MODAL (List view)
       *******************************************************/
      showManageTaxesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display flex items-center gap-1.5">
                <Info size={14} className="text-alegra-primary" /> Configuración de Impuestos (ITBIS)
              </h3>
              <button 
                onClick={() => setShowManageTaxesModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-gray-100">
              <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                Tributos fiscales aplicables en facturación y comandas del sistema Alegra+.
              </p>
              <button
                onClick={() => {
                  setTaxFormMode('add');
                  setTaxNameInput('');
                  setTaxRateInput('18');
                  setEditingTaxId(null);
                  setShowTaxFormModal(true);
                }}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <PlusCircle size={12} /> Nuevo Impuesto
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-150 rounded-xl divide-y divide-gray-100 font-sans">
              {taxes.map((t) => {
                const rateDecimal = Number(t.rate) / 100;
                const count = products.filter(p => Math.abs(p.taxRate - rateDecimal) < 0.001).length;
                return (
                  <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold ml-1.5">{t.rate}%</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{count} productos asociados</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTaxFormMode('edit');
                          setTaxNameInput(t.name);
                          setTaxRateInput(String(t.rate));
                          setEditingTaxId(t.id);
                          setShowTaxFormModal(true);
                        }}
                        className="text-alegra-primary hover:text-alegra-primary-dark font-bold hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTaxNum(t.id)}
                        className="text-red-656 hover:text-red-700 font-bold hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowManageTaxesModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/*******************************************************
       * TAX FORM MODAL (Add / Edit)
       *******************************************************/
      showTaxFormModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 border border-gray-150 flex flex-col space-y-4 text-xs text-gray-700">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-wider font-display">
                {taxFormMode === 'add' ? 'Añadir Nuevo Impuesto' : 'Modificar Impuesto'}
              </h3>
              <button 
                onClick={() => setShowTaxFormModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre Comercial (Identificador) *</label>
                <input
                  type="text"
                  placeholder="Ej. ITBIS Normal"
                  value={taxNameInput}
                  onChange={(e) => setTaxNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Porcentaje de Tasa (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="18"
                  value={taxRateInput}
                  onChange={(e) => setTaxRateInput(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-alegra-primary focus:bg-white text-gray-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowTaxFormModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg w-1/3 cursor-pointer"
              >
                Regresar
              </button>
              <button
                type="button"
                onClick={taxFormMode === 'add' ? handleAddTax : handleEditTax}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2 rounded-lg flex-1 cursor-pointer text-center"
              >
                {taxFormMode === 'add' ? 'Crear Impuesto' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

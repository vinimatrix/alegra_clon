/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  Layers, 
  SlidersHorizontal, 
  Flame, 
  UtensilsCrossed, 
  CheckCircle2, 
  Clock, 
  Users, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRightLeft, 
  Pizza, 
  GlassWater, 
  Beef, 
  Salad, 
  Info,
  Layers3,
  CalendarCheck2
} from 'lucide-react';
import { RestaurantOrder, RestaurantTable, RestaurantOrderItem, Product } from '../types';

interface KitchenManagerProps {
  orders: RestaurantOrder[];
  tables: RestaurantTable[];
  products: Product[];
  onUpdateOrders: (updatedOrders: RestaurantOrder[]) => void;
  onUpdateTables: (updatedTables: RestaurantTable[]) => void;
}

export default function KitchenManager({
  orders,
  tables,
  products,
  onUpdateOrders,
  onUpdateTables
}: KitchenManagerProps) {
  
  // Local state for filters
  const [selectedSection, setSelectedSection] = useState<string>('Todos'); // 'Todos' | 'Platos Fuertes' | 'Bebidas' | 'Otros'
  const [selectedStation, setSelectedStation] = useState<string>('Todos'); // 'Todos' | 'Sin Asignar' | 'Parrilla' | 'Barra' | 'Horno' | 'Cocina Fría' | 'Cocina Caliente'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'activas' | 'pendientes' | 'preparando' | 'listas'>('activas');

  // List of standard stations with metadata for decoration & colors
  const stations = [
    { id: 'Parrilla', name: 'Estación de Parrilla 🥩', color: 'border-rose-200 bg-rose-50/40 text-rose-800 accent-rose-500 hover:bg-rose-50' },
    { id: 'Barra', name: 'Estación de Barra & Bebidas 🍹', color: 'border-blue-200 bg-blue-50/40 text-blue-800 accent-blue-500 hover:bg-blue-50' },
    { id: 'Horno', name: 'Estación de Horno & Pizza 🍕', color: 'border-amber-200 bg-amber-50/40 text-amber-800 accent-amber-500 hover:bg-amber-50' },
    { id: 'Cocina Fría', name: 'Cocina Fría & Ensaladas 🥗', color: 'border-emerald-200 bg-emerald-50/40 text-emerald-800 accent-emerald-500 hover:bg-emerald-50' },
    { id: 'Cocina Caliente', name: 'Cocina de Ollas & Guisados 🍳', color: 'border-purple-200 bg-purple-50/40 text-purple-700 accent-purple-500 hover:bg-purple-50 font-semibold' },
  ];

  // Helper to determine product kitchen section
  const determineItemSection = (item: RestaurantOrderItem): string => {
    if (item.section) return item.section;
    const prod = products.find(p => p.id === item.productId || p.name === item.name);
    if (prod) {
      if (prod.category === 'Bebidas') return 'Bebidas';
      if (prod.category === 'Platos') return 'Platos Fuertes';
    }
    // Fallbacks
    if (item.name.toLowerCase().includes('cerveza') || item.name.toLowerCase().includes('limonada') || item.name.toLowerCase().includes('refresco')) {
      return 'Bebidas';
    }
    return 'Platos Fuertes';
  };

  // Helper: Elapsed minutes calculations with dynamic indicators
  const getElapsedMinutes = (createdAt: string): number => {
    try {
      if (!createdAt) return 0;
      let orderTime: Date;
      if (createdAt.includes('-')) {
        const parts = createdAt.split(' ');
        if (parts.length === 2) {
          orderTime = new Date(`${parts[0]}T${parts[1]}:00`);
        } else {
          orderTime = new Date(createdAt);
        }
      } else {
        const now = new Date();
        const [h, m] = createdAt.split(':').map(Number);
        orderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      }
      return Math.max(0, Math.floor((Date.now() - orderTime.getTime()) / 60000));
    } catch (e) {
      return 0;
    }
  };

  // Handle single item station re-alignment
  const handleAssignItemStation = (orderId: string, itemIndex: number, station: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id !== orderId) return order;

      const updatedItems = order.items.map((item, idx) => {
        if (idx === itemIndex) {
          const section = determineItemSection(item);
          return {
            ...item,
            section,
            assignedStation: station
          };
        }
        return item;
      });

      return {
        ...order,
        items: updatedItems
      };
    });

    onUpdateOrders(updatedOrders);
  };

  // Handle entire order quick station auto-balancing
  const handleAssignEntireOrder = (orderId: string, station: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id !== orderId) return order;

      const updatedItems = order.items.map(item => ({
        ...item,
        section: determineItemSection(item),
        assignedStation: station
      }));

      return {
        ...order,
        items: updatedItems
      };
    });

    onUpdateOrders(updatedOrders);
  };

  // Mutate parent order statuses (direct workflow synchronization)
  const handleModifyStatus = (orderId: string, newStatus: RestaurantOrder['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (newStatus === 'en_preparacion') {
      // Set table to atendiendo
      const updatedTables = tables.map(t => 
        t.id === order.tableId ? { ...t, status: 'atendiendo' as const } : t
      );
      onUpdateTables(updatedTables);
    } else if (newStatus === 'entregada') {
      // Table status can remain 'atendiendo' or update
    }

    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    onUpdateOrders(updatedOrders);
  };

  // Get active items count in each station to draw the workload chart
  const getStationWorkload = (stationId: string): { total: number; pending: number; cooking: number } => {
    let total = 0;
    let pending = 0;
    let cooking = 0;

    orders.forEach(order => {
      if (order.status === 'cobrada' || order.status === 'entregada') return;

      order.items.forEach(item => {
        const assigned = item.assignedStation;
        if (assigned === stationId) {
          total += item.quantity;
          if (order.status === 'pendiente') pending += item.quantity;
          if (order.status === 'en_preparacion') cooking += item.quantity;
        }
      });
    });

    return { total, pending, cooking };
  };

  // Get unassigned items count
  const getUnassignedCount = (): number => {
    let count = 0;
    orders.forEach(order => {
      if (order.status === 'cobrada' || order.status === 'entregada') return;
      order.items.forEach(item => {
        if (!item.assignedStation) {
          count += item.quantity;
        }
      });
    });
    return count;
  };

  // Build list of filtered orders
  const filteredOrders = orders.filter(order => {
    // Hide totally paid and closed orders
    if (order.status === 'cobrada') return false;

    // Filters based on main state tabs
    if (statusFilter === 'pendientes' && order.status !== 'pendiente') return false;
    if (statusFilter === 'preparando' && order.status !== 'en_preparacion') return false;
    if (statusFilter === 'listas' && order.status !== 'entregada') return false;
    if (statusFilter === 'activas' && order.status === 'entregada') return false; // active = pending + cooking

    // Filter by text query
    const matchesSearch = 
      order.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Advanced: Filter items by selected kitchen section
    if (selectedSection !== 'Todos') {
      const hasSectionItem = order.items.some(item => {
        const section = determineItemSection(item);
        return section === selectedSection;
      });
      if (!hasSectionItem) return false;
    }

    // Advanced: Filter by preparation station
    if (selectedStation !== 'Todos') {
      if (selectedStation === 'Sin Asignar') {
        const hasUnassigned = order.items.some(item => !item.assignedStation);
        if (!hasUnassigned) return false;
      } else {
        const hasStationItem = order.items.some(item => item.assignedStation === selectedStation);
        if (!hasStationItem) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6" id="kitchen-manager-root">
      
      {/* Top Welcome Title block */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8 select-none">
          <ChefHat size={180} />
        </div>
        
        <div className="max-w-2xl text-left relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20 uppercase tracking-widest leading-none">
            <SlidersHorizontal size={12} /> Panel de Control Administrativo
          </div>
          <h1 className="text-2xl font-black tracking-tight font-display">
            Asignador y Gestor de Estaciones de Cocina
          </h1>
          <p className="text-slate-300 text-xs leading-relaxed font-medium">
            Supervise la carga de trabajo de los cocineros en tiempo real. Clasifique pedidos por sección gastronómica (Bebidas vs Platos Fuertes) y delegue platos a estaciones específicas para un despacho coordinado.
          </p>
        </div>
      </div>

      {/* Culinary Station Load Balancer Progress metrics block */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-3xs space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-indigo-600 w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 font-display uppercase tracking-wide">
            Carga de Cocina por Estación de Trabajo
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stations.map(station => {
            const load = getStationWorkload(station.id);
            // Calculate a synthetic percentage based on load capacity (e.g. limit of 6 items is 100%)
            const percent = Math.min(100, Math.round((load.total / 8) * 100));
            
            let barColor = "bg-emerald-500";
            if (percent > 75) barColor = "bg-rose-500 animate-pulse";
            else if (percent > 45) barColor = "bg-amber-500";

            return (
              <div 
                key={station.id} 
                className="border border-slate-100 rounded-xl p-3.5 space-y-3 bg-slate-50/50 hover:bg-slate-55 transition-all text-left"
              >
                <div className="font-semibold text-xs text-gray-700 leading-tight block truncate">
                  {station.name.split(' ')[2] || station.id}
                  <span className="text-[10px] text-gray-400 block font-normal mt-0.5">{station.id}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-mono text-slate-800">{load.total}</span>
                  <span className="text-[9px] text-gray-450 uppercase font-bold tracking-wider">platos</span>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${barColor}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-500 font-bold">
                    <span>Carga: {percent}%</span>
                    <span>{load.cooking} en preparación</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warn if there are unassigned items */}
        {getUnassignedCount() > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-amber-900 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <p className="font-bold">
                ¡Se detectaron {getUnassignedCount()} platillos pendientes sin asignar en cocina!
              </p>
            </div>
            <span className="text-[10px] bg-amber-500 text-white font-mono font-bold px-2 py-0.5 rounded-full uppercase">
              Asignación urgente
            </span>
          </div>
        )}
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-3xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {/* Main State Tab selector */}
          <div className="bg-slate-105 p-1 rounded-lg border border-gray-200 flex items-center gap-0.5">
            <button
              onClick={() => setStatusFilter('activas')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                statusFilter === 'activas' ? 'bg-slate-900 text-white shadow-xs' : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              🍳 Producción Activa ({orders.filter(o => o.status === 'pendiente' || o.status === 'en_preparacion').length})
            </button>
            <button
              onClick={() => setStatusFilter('pendientes')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                statusFilter === 'pendientes' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              📥 Pendiente Iniciar
            </button>
            <button
              onClick={() => setStatusFilter('preparando')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                statusFilter === 'preparando' ? 'bg-amber-500 text-slate-950' : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              🔥 En Estaciones
            </button>
            <button
              onClick={() => setStatusFilter('listas')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                statusFilter === 'listas' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-slate-950'
              }`}
            >
              🛎️ Completadas
            </button>
          </div>

          {/* Quick Item Searching bar */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comanda, mesa, plato u notas..."
              className="w-full bg-slate-50/50 border border-gray-200 rounded-lg pl-8.5 pr-3 py-1.5 outline-none focus:border-indigo-500 text-xs font-semibold"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Secondary culinary filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Section of cooking filter */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Filtrar por Sección de Cocina RD:
            </label>
            <div className="flex flex-wrap gap-1">
              {['Todos', 'Platos Fuertes', 'Bebidas'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    selectedSection === sec 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {sec === 'Todos' ? 'Sección: Ver Todas' : sec}
                </button>
              ))}
            </div>
          </div>

          {/* Station assignment filter */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Filtrar por Estación Asignada:
            </label>
            <div className="flex flex-wrap gap-1">
              {['Todos', 'Sin Asignar', 'Parrilla', 'Barra', 'Horno', 'Cocina Fría', 'Cocina Caliente'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStation(st)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedStation === st 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-3xs' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {st === 'Todos' ? 'Estación: Ver Todas' : st === 'Sin Asignar' ? '⚠️ Sin Asignar' : st}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Render grid cards */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl p-6 max-w-lg mx-auto space-y-3">
          <div className="inline-flex p-3 rounded-full bg-slate-50 text-gray-300">
            <Layers3 size={32} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No se encontraron comandas</h3>
            <p className="text-xs text-gray-400 mt-1">
              Revise las combinaciones de filtros de sección de cocina / estación de trabajo seleccionadas arriba.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredOrders.map(order => {
              const minutes = getElapsedMinutes(order.createdAt);
              
              // Colors depending on status
              let cardBorder = "border-gray-200";
              let cardHeader = "bg-slate-50";
              if (order.status === 'en_preparacion') {
                cardBorder = "border-amber-300 shadow-md";
                cardHeader = "bg-amber-50/70";
              } else if (order.status === 'entregada') {
                cardBorder = "border-emerald-250 opacity-80 shadow-3xs";
                cardHeader = "bg-emerald-50/40";
              }

              if (minutes >= 12 && order.status !== 'entregada') {
                cardBorder = "border-rose-400 shadow-rose-100 shadow-lg animate-pulse";
                cardHeader = "bg-rose-50 text-rose-950";
              }

              return (
                <motion.div
                  key={order.id}
                  layoutId={`manager-ticket-${order.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className={`border bg-white rounded-2xl shadow-xxs overflow-hidden flex flex-col justify-between text-left transition-all ${cardBorder}`}
                >
                  {/* Card Header metadata */}
                  <div className={`p-4 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-2 ${cardHeader}`}>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 font-display">
                          {order.tableId.startsWith('pos-quick') ? '🛍️ ' : '🏛️ '} {order.tableName}
                        </span>
                        <span className="text-[10px] bg-indigo-600/10 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">
                          Comanda {order.id.slice(-5)}
                        </span>
                        {minutes >= 12 && order.status !== 'entregada' && (
                          <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse uppercase">
                            <AlertTriangle size={10} /> Retrasado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-medium">
                        Camarero: <span className="text-slate-700 font-bold">{order.waiterName || 'Mostrador'}</span> • {order.createdAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <span className="text-xs font-mono font-bold text-gray-500 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        <Clock size={12} className="text-gray-400" /> {minutes} mins transcurridos
                      </span>
                    </div>
                  </div>

                  {/* Body: list items and their delegated stations */}
                  <div className="p-4 flex-1 space-y-4">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                      Desglose de Platillos:
                    </span>

                    <div className="space-y-3">
                      {order.items.map((item, itemIdx) => {
                        const itemSec = determineItemSection(item);
                        const assignedSt = item.assignedStation;
                        
                        return (
                          <div 
                            key={`${item.productId}-${itemIdx}`}
                            className="bg-slate-50/50 p-3 rounded-xl border border-gray-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800">
                                  {item.quantity}x
                                </span>
                                <span className="text-xs font-extrabold text-slate-900 underline decoration-indigo-200">
                                  {item.name}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                                  itemSec === 'Bebidas' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {itemSec}
                                </span>
                              </div>
                              
                              {item.notes && (
                                <p className="text-[10px] font-bold text-red-650 bg-amber-50 rounded pl-2 pr-1 py-0.5 mt-1 block">
                                  📝 Nota: {item.notes}
                                </p>
                              )}
                            </div>

                            {/* Station delegate dropdown/selector */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                              <label className="text-[9px] text-gray-400 font-bold uppercase shrink-0 mr-1 hidden sm:inline">
                                Estación:
                              </label>
                              <select
                                value={assignedSt || ''}
                                onChange={e => handleAssignItemStation(order.id, itemIdx, e.target.value)}
                                className={`text-[11px] font-bold rounded-lg border px-2.5 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer transition-all ${
                                  assignedSt 
                                    ? 'bg-indigo-55 text-indigo-800 border-indigo-200 font-extrabold' 
                                    : 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse font-extrabold'
                                }`}
                              >
                                <option value="" className="bg-white text-slate-600 font-bold">⚠️ Sin Asignar</option>
                                <option value="Parrilla" className="bg-white text-rose-700 font-semibold">🥩 Parrilla / Plancha</option>
                                <option value="Barra" className="bg-white text-blue-700 font-semibold">🍹 Barra & Bebidas</option>
                                <option value="Horno" className="bg-white text-amber-700 font-semibold">🍕 Horno & Pizza</option>
                                <option value="Cocina Fría" className="bg-white text-emerald-700 font-semibold">🥗 Ensaladas / Cocina Fría</option>
                                <option value="Cocina Caliente" className="bg-white text-purple-700 font-semibold">🍳 Cocina Ollas / Guisados</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational manual quick ticket assignor block */}
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    
                    {/* Quickly assign all items in this ticket to one station to save clicks */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Asignación Rápida Ticket:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAssignEntireOrder(order.id, 'Parrilla')}
                          className="px-1.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 cursor-pointer"
                          title="Asignar todo a Parrilla"
                        >
                          🥩 Parrilla
                        </button>
                        <button
                          onClick={() => handleAssignEntireOrder(order.id, 'Barra')}
                          className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 cursor-pointer"
                          title="Asignar todo a Barra"
                        >
                          🍹 Barra
                        </button>
                        <button
                          onClick={() => handleAssignEntireOrder(order.id, 'Horno')}
                          className="px-1.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 cursor-pointer"
                          title="Asignar todo a Horno"
                        >
                          🍕 Horno
                        </button>
                      </div>
                    </div>

                    {/* Order central state advance triggers */}
                    <div className="flex items-center gap-1.5 self-end">
                      {order.status === 'pendiente' && (
                        <button
                          onClick={() => handleModifyStatus(order.id, 'en_preparacion')}
                          className="bg-amber-500 hover:bg-amber-600 font-black text-slate-950 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Flame size={12} fill="currentColor" /> Iniciar Cocción
                        </button>
                      )}

                      {order.status === 'en_preparacion' && (
                        <button
                          onClick={() => handleModifyStatus(order.id, 'entregada')}
                          className="bg-emerald-600 hover:bg-emerald-700 font-black text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1' transition-all cursor-pointer"
                        >
                          <CheckCircle2 size={12} /> Despachar Plato
                        </button>
                      )}

                      {order.status === 'entregada' && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-250 font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg">
                          🛎️ Listo en Mesa
                        </span>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Auxiliary informative support block */}
      <div className="bg-indigo-900 border border-indigo-950/20 text-white rounded-2xl p-5 flex items-start gap-4 text-xs text-left shadow-lg">
        <Info size={25} className="text-indigo-300 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-indigo-100 block">Balance y Coordinación Operativa:</span>
          <p className="text-gray-300 leading-relaxed block">
            Este panel del administrador vincula automáticamente el menú del punto de venta con la cocina. Al delegar un mofongo a <span className="font-semibold text-white">"Parrilla"</span>, o un trago de ron a <span className="font-semibold text-white">"Barra"</span>, las respectivas sub-pantallas de cada estación se actualizan instantáneamente en tiempo real. Utilice el timbre de alerta visual en el KDS secundario para agilizar el servicio en salón.
          </p>
        </div>
      </div>

    </div>
  );
}

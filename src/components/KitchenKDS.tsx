/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Check, 
  Play, 
  Volume2, 
  VolumeX, 
  ChefHat, 
  Sparkles, 
  Bell, 
  AlertTriangle, 
  Filter, 
  Maximize2, 
  Minimize2,
  CheckCircle2,
  UtensilsCrossed,
  Search,
  Timer
} from 'lucide-react';
import { RestaurantTable, RestaurantOrder, RestaurantOrderItem, Product } from '../types';

interface KitchenKDSProps {
  orders: RestaurantOrder[];
  tables: RestaurantTable[];
  products: Product[];
  onUpdateOrders: (updatedOrders: RestaurantOrder[]) => void;
  onUpdateTables: (updatedTables: RestaurantTable[]) => void;
}

export default function KitchenKDS({ 
  orders, 
  tables, 
  products, 
  onUpdateOrders, 
  onUpdateTables 
}: KitchenKDSProps) {
  // Sound and TTS preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  
  // Tab view filters
  const [statusFilter, setStatusFilter] = useState<'pending_prep' | 'all'>('pending_prep');
  const [sectionFilter, setSectionFilter] = useState<string>('Todos'); // 'Todos' | 'Platos' | 'Bebidas' etc
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const kdsContainerRef = useRef<HTMLDivElement>(null);

  // Keep track of read order IDs to play sound/TTS only on newly arrived orders
  const [knownOrderIds, setKnownOrderIds] = useState<string[]>(() => {
    // Initialize with current pending/prep order IDs so we don't alert old ones on mount
    return orders.map(o => o.id);
  });

  // Track checked/completed items list locally by 'orderId-productId-index' matching
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  // Trigger audio alarm and text-to-speech for newly arrived orders
  useEffect(() => {
    const activeNewOrders = orders.filter(o => o.status === 'pendiente' && !knownOrderIds.includes(o.id));
    
    if (activeNewOrders.length > 0) {
      // Play system alert beep
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
          gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.25);
        } catch (e) {
          console.warn('AudioContext beep blocked by browser interactions:', e);
        }
      }

      // Play elegant TTS announcement
      if (ttsEnabled && 'speechSynthesis' in window) {
        activeNewOrders.forEach(order => {
          const tableText = order.tableId.startsWith('pos-quick') 
            ? 'para llevar' 
            : `para la ${order.tableName}`;
          const itemsDesc = order.items.map(i => `${i.quantity} ${i.name}`).join(', ');
          const speechText = `¡Nuevo pedido recibido! ${tableText}. Detalle: ${itemsDesc}`;
          
          try {
            window.speechSynthesis.cancel(); // cancel current speech
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = 'es-ES';
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.warn('SpeechSynthesis blocked by user activation constraint:', e);
          }
        });
      }

      // Record this order as known
      setKnownOrderIds(prev => [...prev, ...activeNewOrders.map(o => o.id)]);
    }
  }, [orders, knownOrderIds, soundEnabled, ttsEnabled]);

  // Handle Fullscreen toggle
  const toggleFullScreen = () => {
    if (!kdsContainerRef.current) return;
    if (!document.fullscreenElement) {
      kdsContainerRef.current.requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch(err => console.error(err));
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Helper: Elapsed minutes calculations with dynamic indicators
  const getElapsedMinutes = (createdAt: string): number => {
    try {
      // Order created format: "YYYY-MM-DD HH:MM"
      if (!createdAt) return 0;
      let orderTime: Date;
      if (createdAt.includes('-')) {
        // Parse "YYYY-MM-DD HH:MM"
        const parts = createdAt.split(' ');
        if (parts.length === 2) {
          const dateStr = parts[0]; // YYYY-MM-DD
          const timeStr = parts[1]; // HH:MM
          orderTime = new Date(`${dateStr}T${timeStr}:00`);
        } else {
          orderTime = new Date(createdAt);
        }
      } else {
        // Fallback or hour-only
        const now = new Date();
        const [h, m] = createdAt.split(':').map(Number);
        orderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      }

      const diffMs = Date.now() - orderTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return Math.max(0, diffMins);
    } catch (e) {
      return 0;
    }
  };

  // Status-based formatting
  const getTimerBadgeStyle = (minutes: number) => {
    if (minutes >= 12) {
      return "bg-rose-500 text-white animate-pulse font-black";
    }
    if (minutes >= 7) {
      return "bg-amber-500 text-slate-950 font-bold";
    }
    return "bg-slate-800 text-gray-300 font-medium";
  };

  // Mutate order state to next step
  const handleNextStep = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let nextStatus: RestaurantOrder['status'] = 'pendiente';
    if (order.status === 'pendiente') {
      nextStatus = 'en_preparacion';
      // Automatically advance table status to 'atendiendo' (pulsing yellow)
      const tableObj = tables.find(t => t.id === order.tableId);
      if (tableObj && tableObj.status === 'ocupada') {
        const updatedTables = tables.map(t => 
          t.id === order.tableId ? { ...t, status: 'atendiendo' as const } : t
        );
        onUpdateTables(updatedTables);
      }
    } else if (order.status === 'en_preparacion') {
      nextStatus = 'entregada'; // "Listo para Despachar / Entregada"
    }

    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o);
    onUpdateOrders(updatedOrders);
  };

  // Toggle item checked checklists
  const toggleItemChecked = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Dispatch / complete all items on a ticket
  const handleDispatchAllItems = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check all items on this order
    const updatedChecked = { ...checkedItems };
    order.items.forEach((_, idx) => {
      updatedChecked[`${orderId}-${idx}`] = true;
    });
    setCheckedItems(updatedChecked);

    // Advance order to delivered
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'entregada' as const };
      }
      return o;
    });
    onUpdateOrders(updatedOrders);
  };

  // Extract categories available for section categorizing
  const availableCategories = ['Todos', 'Platos', 'Bebidas'];

  // Filter and compute renderable tickets
  const filteredOrders = orders.filter(order => {
    // Hide already 'cobrada' orders from Kitchen board
    if (order.status === 'cobrada') return false;
    
    // Status tab filter: hide delivered in "pending_prep"
    if (statusFilter === 'pending_prep' && order.status === 'entregada') return false;

    // Search query match
    const matchesSearch = 
      order.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Section filter: verify if any item matches category or if section filter matches
    if (sectionFilter !== 'Todos') {
      // Find matches in products catalog
      const orderHasSectionItem = order.items.some(item => {
        const prod = products.find(p => p.name === item.name || p.id === item.productId);
        if (!prod) return sectionFilter === 'Platos'; // Fallback
        return prod.category === sectionFilter;
      });
      return orderHasSectionItem;
    }

    return true;
  });

  // Calculate high-impact real-time analytics
  const countPending = orders.filter(o => o.status === 'pendiente').length;
  const countPrep = orders.filter(o => o.status === 'en_preparacion').length;
  const countReady = orders.filter(o => o.status === 'entregada').length;
  const countDelayed = orders.filter(o => {
    if (o.status === 'cobrada' || o.status === 'entregada') return false;
    return getElapsedMinutes(o.createdAt) >= 12;
  }).length;

  return (
    <div 
      ref={kdsContainerRef}
      className={`space-y-6 ${isFullScreen ? 'bg-slate-950 text-white p-6 min-h-screen overflow-y-auto' : ''}`}
      id="kitchen-kds-wrapper"
    >
      {/* KDS Header & Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between pb-4 border-b border-gray-150 gap-4">
        <div className="flex items-center gap-3 self-start">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-600/10">
            <ChefHat size={24} className="animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 font-display flex items-center gap-2 tracking-tight">
              Pantalla Interactiva de Cocina (KDS)
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse">
                Canal Real-time Activo
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Gestión visual de tiempos de preparación y despacho de comandas de salón y mostrador.
            </p>
          </div>
        </div>

        {/* Audio Alerts & Voice Synthesis Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-gray-100 text-gray-400 border-gray-250 line-through'
            }`}
            title="Activar pitido para nuevos comandas"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>Timbre de Entrada</span>
          </button>

          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              ttsEnabled 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-gray-100 text-gray-400 border-gray-250 line-through'
            }`}
            title="Sintetizar locución de platos entrantes"
          >
            <Sparkles size={13} className={ttsEnabled ? 'text-purple-650' : 'text-gray-400'} />
            <span>Voz de Entrada (TTS)</span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-800 ml-1 shadow-sm transition-all"
          >
            {isFullScreen ? (
              <>
                <Minimize2 size={13} />
                <span>Salir Pantalla Completa</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} />
                <span>Modo Pantalla Completa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time KPI & Alarm Center Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 flex items-center justify-between shadow-xxs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Nuevas por Iniciar</span>
            <span className="text-xl font-black text-slate-800 font-mono block leading-none">{countPending}</span>
          </div>
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 flex items-center justify-between shadow-xxs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Cociendo en Fuego</span>
            <span className="text-xl font-black text-amber-500 font-mono block leading-none">{countPrep}</span>
          </div>
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 flex items-center justify-between shadow-xxs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Listas para Despacho</span>
            <span className="text-xl font-black text-emerald-600 font-mono block leading-none">{countReady}</span>
          </div>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-xxs ${
          countDelayed > 0 
            ? 'bg-rose-50/50 border-rose-200 text-rose-900 animate-pulse' 
            : 'bg-white border-gray-200 text-slate-800'
        }`}>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Retrasadas (+12 min)</span>
            <span className={`text-xl font-black font-mono block leading-none ${countDelayed > 0 ? 'text-rose-650' : 'text-slate-800'}`}>{countDelayed}</span>
          </div>
          {countDelayed > 0 ? (
            <AlertTriangle size={18} className="text-rose-600 animate-bounce" />
          ) : (
            <Clock size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-gray-250 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3.5 shadow-3xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Segment Filter: Pendiente + Preparando VS Todo */}
          <div className="bg-slate-105 p-1 rounded-lg border border-gray-200 flex items-center gap-0.5">
            <button
              onClick={() => setStatusFilter('pending_prep')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all cursor-pointer ${
                statusFilter === 'pending_prep'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              🍳 Activas ({countPending + countPrep})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              📋 Ver Todo ({countPending + countPrep + countReady})
            </button>
          </div>

          {/* Section Filter: Platos vs Bebidas */}
          <div className="bg-slate-105 p-1 rounded-lg border border-gray-200 flex items-center gap-0.5">
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSectionFilter(cat)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  sectionFilter === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-slate-800'
                }`}
              >
                {cat === 'Todos' ? 'Sección: Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Live Text Query filter */}
        <div className="relative w-full md:w-60">
          <Search size={13} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            className="w-full bg-white border border-gray-200 rounded-lg pl-8.5 pr-3 py-2 outline-none focus:border-indigo-500 text-xs font-semibold text-gray-800"
            placeholder="Buscar comanda, mesa o ingrediente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-slate-800 font-bold text-xs"
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Culinary Production Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl p-8 max-w-xl mx-auto space-y-4">
          <div className="inline-flex p-4 rounded-full bg-slate-50 text-gray-300">
            <ChefHat size={40} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 font-display">No hay comandas activas</h2>
            <p className="text-xs text-gray-400 mt-1">
              Las comandas abiertas por los camareros en la tablet o en el mostrador aparecerán aquí instantáneamente con sonido.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="kitchen-production-grid-board">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map(order => {
              const minutesElapsed = getElapsedMinutes(order.createdAt);
              
              // Colors based on cooking status
              let titleColor = "text-amber-800";
              let borderStyle = "border-blue-200 bg-white";
              let headerTint = "bg-blue-50/50";
              
              if (order.status === 'en_preparacion') {
                borderStyle = "border-amber-400 shadow-amber-300/10 shadow-lg bg-orange-50/10";
                headerTint = "bg-amber-300/15";
                titleColor = "text-amber-900";
              } else if (order.status === 'entregada') {
                borderStyle = "border-emerald-300 bg-white";
                headerTint = "bg-emerald-50/60";
                titleColor = "text-emerald-900";
              }

              // Color critical delay if >=12 mins
              if (minutesElapsed >= 12 && order.status !== 'entregada') {
                borderStyle = "border-rose-450 shadow-rose-300/20 shadow-md bg-stone-50/20 animate-pulse";
                headerTint = "bg-rose-50 text-rose-900";
              }

              return (
                <motion.div
                  key={order.id}
                  layoutId={`ticket-${order.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`border rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm h-[320px] transition-all ${borderStyle}`}
                  id={`kds-card-${order.id}`}
                >
                  {/* Ticket Header */}
                  <div className={`p-3 border-b border-gray-150 flex items-center justify-between pb-2.5 ${headerTint}`}>
                    <div className="text-left leading-tight truncate">
                      <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight block truncate">
                        {order.tableId.startsWith('pos-quick') ? '🛍️ ' : '🏛️ '} {order.tableName}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono font-bold block mt-0.5">
                        {order.id.slice(-5)} • Camarero: {order.waiterName || 'Mostrador'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${getTimerBadgeStyle(minutesElapsed)}`}>
                        <Clock size={11} /> {minutesElapsed}m
                      </span>
                    </div>
                  </div>

                  {/* Food checklist items list */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-white/70">
                    {order.items.map((item, itemIdx) => {
                      const isItemChecked = !!checkedItems[`${order.id}-${itemIdx}`];
                      return (
                        <div 
                          key={`${item.productId}-${itemIdx}`} 
                          onClick={() => toggleItemChecked(order.id, itemIdx)}
                          className={`p-2 rounded-xl flex items-start gap-2.5 cursor-pointer border select-none transition-all ${
                            isItemChecked 
                              ? 'bg-slate-50/50 border-gray-150 opacity-60' 
                              : 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-200'
                          }`}
                        >
                          {/* Checked Checkbox indicator */}
                          <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                            isItemChecked 
                              ? 'bg-slate-400 border-slate-400 text-white' 
                              : 'bg-white border-indigo-300 text-indigo-600'
                          }`}>
                            {isItemChecked && <Check size={11} strokeWidth={4} />}
                          </div>

                          <div className="text-left leading-snug">
                            <span className={`text-[12px] font-extrabold ${isItemChecked ? 'text-gray-400 line-through' : 'text-slate-900'}`}>
                              {item.quantity}x <span className="underline decoration-1 decoration-indigo-300">{item.name}</span>
                            </span>
                            {item.notes && (
                              <span className="block text-[10px] text-red-500 font-bold bg-amber-50 rounded pl-1.5 py-0.5 mt-0.5 border-l-2 border-red-500">
                                📝 {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* KDS Interactive Control Footer */}
                  <div className="p-3 bg-slate-55 border-t border-gray-150 flex gap-2">
                    {order.status === 'pendiente' && (
                      <button
                        onClick={() => handleNextStep(order.id)}
                        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        id={`kds-start-${order.id}`}
                      >
                        <Play size={12} fill="currentColor" /> Iniciar Cocción
                      </button>
                    )}

                    {order.status === 'en_preparacion' && (
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => handleNextStep(order.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          id={`kds-dispatch-${order.id}`}
                        >
                          <CheckCircle2 size={12} /> Despachar Plato
                        </button>
                      </div>
                    )}

                    {order.status === 'entregada' && (
                      <div className="w-full bg-emerald-50 text-emerald-700 py-1.5 rounded-xl text-[9px] uppercase font-black tracking-widest border border-emerald-250 flex items-center justify-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" /> Listo para Servir
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Operational Help Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3.5 text-xs text-left shadow-md">
        <UtensilsCrossed size={20} className="text-indigo-400 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-extrabold block text-slate-200">Guía del Despacho de Cocina:</span>
          <span className="text-gray-400 block">
            Haga clic en <span className="font-bold text-white">"Iniciar Cocción"</span> para cambiar el color del ticket a naranja/amarillo y notificar al camarero en tiempo real que el plato está en fuego. Marque los platillos individualmente tocándolos, y presione <span className="font-bold text-white">"Despachar Plato"</span> para enviarlo listo a la mesa.
          </span>
        </div>
      </div>
    </div>
  );
}

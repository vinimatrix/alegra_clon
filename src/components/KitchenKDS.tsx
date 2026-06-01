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
  BellOff,
  AlertTriangle, 
  Filter, 
  Maximize2, 
  Minimize2,
  CheckCircle2,
  UtensilsCrossed,
  Search,
  Timer,
  Settings,
  Sliders,
  Copy,
  Lock,
  RefreshCw,
  Database
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
  // Sound and TTS preferences initialized with localStorage persistence
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('kds_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [soundType, setSoundType] = useState<string>(() => {
    return localStorage.getItem('kds_sound_type') || 'standard';
  });
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    const saved = localStorage.getItem('kds_sound_volume');
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('kds_tts_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kds_push_enabled') === 'true';
  });
  const [muteVisualDelays, setMuteVisualDelays] = useState<boolean>(() => {
    return localStorage.getItem('kds_mute_visual_delays') === 'true';
  });
  const [delayMinutesThreshold, setDelayMinutesThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('kds_delay_threshold');
    return saved !== null ? parseInt(saved, 10) : 12;
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Web Push and Service Worker registration references
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [fcmToken, setFcmToken] = useState<string>(() => {
    return localStorage.getItem('kds_fcm_token') || `fcm-token-${Math.random().toString(36).substring(2, 12)}-dev`;
  });
  const [fcmApiKey, setFcmApiKey] = useState<string>(() => localStorage.getItem('kds_fcm_api_key') || 'AIzaSyA4x_KDS_FCM_MOCK_KEY_7849');
  const [fcmSenderId, setFcmSenderId] = useState<string>(() => localStorage.getItem('kds_fcm_sender_id') || '452148753265');
  const [fcmAppId, setFcmAppId] = useState<string>(() => localStorage.getItem('kds_fcm_app_id') || '1:452148753265:web:6e32d5f818b2');
  const [fcmProjectId, setFcmProjectId] = useState<string>(() => localStorage.getItem('kds_fcm_project_id') || 'alegra-kds-notificaciones');
  
  const [testNotificationTitle, setTestNotificationTitle] = useState('🍳 Alerta de Comanda - KDS');
  const [testNotificationBody, setTestNotificationBody] = useState('Pedido #1045 - 2x Mofongo con Carne frita, 1x Jugo de Chinola');
  const [testDelaySeconds, setTestDelaySeconds] = useState(5);
  const [isSimulatingPush, setIsSimulatingPush] = useState(false);
  const [showFcmAdvanced, setShowFcmAdvanced] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Register the service worker under /sw.js
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('KDS Service Worker registrado con éxito:', reg);
          setSwRegistration(reg);
          if (reg.pushManager) {
            reg.pushManager.getSubscription()
              .then(sub => {
                if (sub) {
                  const parsedToken = btoa(JSON.stringify(sub)).substring(0, 48);
                  setFcmToken(`fcm-webpush-${parsedToken}`);
                }
              });
          }
        })
        .catch(err => {
          console.error('Error al registrar Service Worker en KDS:', err);
        });
    }
  }, []);

  // Sync preferences to localStorage on change
  useEffect(() => {
    localStorage.setItem('kds_fcm_token', fcmToken);
  }, [fcmToken]);

  useEffect(() => {
    localStorage.setItem('kds_fcm_api_key', fcmApiKey);
  }, [fcmApiKey]);

  useEffect(() => {
    localStorage.setItem('kds_fcm_sender_id', fcmSenderId);
  }, [fcmSenderId]);

  useEffect(() => {
    localStorage.setItem('kds_fcm_app_id', fcmAppId);
  }, [fcmAppId]);

  useEffect(() => {
    localStorage.setItem('kds_fcm_project_id', fcmProjectId);
  }, [fcmProjectId]);

  const handleCopyFcmToken = () => {
    try {
      navigator.clipboard.writeText(fcmToken);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (e) {
      console.warn('Failed to copy token:', e);
    }
  };

  const handleTriggerTestPush = () => {
    if (!('Notification' in window)) {
      alert('Este navegador no soporta notificaciones de sistema.');
      return;
    }

    if (Notification.permission !== 'granted') {
      alert('Primero debe otorgar permisos de notificación haciendo clic en "Habilitar Push en Navegador".');
      return;
    }

    setIsSimulatingPush(true);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Background Service Worker testing
      setTimeout(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SIMULATE_PUSH',
            payload: {
              title: testNotificationTitle,
              body: testNotificationBody,
              tag: `fcm-simulate-${Date.now()}`
            }
          });
        }
        setIsSimulatingPush(false);
      }, testDelaySeconds * 1000);
    } else {
      // In-page fallback simulation
      setTimeout(() => {
        try {
          new Notification(testNotificationTitle, {
            body: testNotificationBody,
            icon: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
            requireInteraction: true
          });
        } catch (err) {
          console.warn('Local Notification fallback failed:', err);
        }
        setIsSimulatingPush(false);
      }, testDelaySeconds * 1000);
    }
  };
  
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

  // Sync preferences to localStorage on change
  useEffect(() => {
    localStorage.setItem('kds_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('kds_sound_type', soundType);
  }, [soundType]);

  useEffect(() => {
    localStorage.setItem('kds_sound_volume', String(soundVolume));
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem('kds_tts_enabled', String(ttsEnabled));
  }, [ttsEnabled]);

  useEffect(() => {
    localStorage.setItem('kds_push_enabled', String(pushEnabled));
  }, [pushEnabled]);

  useEffect(() => {
    localStorage.setItem('kds_mute_visual_delays', String(muteVisualDelays));
  }, [muteVisualDelays]);

  useEffect(() => {
    localStorage.setItem('kds_delay_threshold', String(delayMinutesThreshold));
  }, [delayMinutesThreshold]);

  // Pure Web Audio API synthesis engine with 4 custom kitchen tones
  const playSynthesisSound = (type: string, volume: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioCtx.createGain();
      // Master scale back to prevent clipping/loudness spikes
      gainNode.gain.setValueAtTime(volume * 0.12, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);

      if (type === 'standard') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.connect(gainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'bell') {
        // Kitchen order bell "ding!"
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(volume * 0.22, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        
        osc.connect(gainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } else if (type === 'chime') {
        // Chime chord dual sound
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5

        gainNode.gain.setValueAtTime(volume * 0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.9);
        osc2.stop(audioCtx.currentTime + 0.9);
      } else if (type === 'scifi') {
        // High density visual upward frequency sweep
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(950, audioCtx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(volume * 0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

        osc.connect(gainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('AudioContext synth sound failed:', e);
    }
  };

  // Live request and toggle browser desktop push notifications
  const handleTogglePushNotifications = () => {
    if (!('Notification' in window)) {
      alert('Las notificaciones push no son soportadas por este explorador.');
      return;
    }
    
    if (Notification.permission === 'granted') {
      const nextVal = !pushEnabled;
      setPushEnabled(nextVal);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setPushEnabled(true);
          try {
            new Notification('🍳 KDS Alertas Activas', {
              body: 'Recibirá notificaciones push en tiempo real para las comandas.',
            });
          } catch (e) {
            console.warn('Feedback notification failed', e);
          }
        } else {
          setPushEnabled(false);
        }
      });
    } else {
      alert('Permiso de notificaciones denegado. Actívelas en la barra de direcciones de su navegador.');
    }
  };

  // Trigger audio alarm, text-to-speech, and desktop push notifications for newly arrived orders
  useEffect(() => {
    const activeNewOrders = orders.filter(o => o.status === 'pendiente' && !knownOrderIds.includes(o.id));
    
    if (activeNewOrders.length > 0) {
      // Play customizable synthesized sound
      if (soundEnabled) {
        playSynthesisSound(soundType, soundVolume);
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

      // Push real HTML5 Desktop Notification
      if (pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
        activeNewOrders.forEach(order => {
          const mode = order.tableId.startsWith('pos-quick') ? 'Llevar' : 'Mesa';
          const itemsDesc = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
          try {
            new Notification(`🍳 Orden Recibida: ${order.tableName} (${mode})`, {
              body: `Productos: ${itemsDesc}`,
              tag: `order-${order.id}`,
              requireInteraction: false
            });
          } catch (e) {
            console.warn('Browser push notification blocked or error:', e);
          }
        });
      }

      // Record this order as known
      setKnownOrderIds(prev => [...prev, ...activeNewOrders.map(o => o.id)]);
    }
  }, [orders, knownOrderIds, soundEnabled, soundType, soundVolume, ttsEnabled, pushEnabled]);

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
    if (minutes >= delayMinutesThreshold) {
      return muteVisualDelays 
        ? "bg-slate-800 text-gray-300 font-bold" 
        : "bg-rose-500 text-white animate-pulse font-black";
    }
    if (minutes >= Math.floor(delayMinutesThreshold * 0.6)) {
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
    return getElapsedMinutes(o.createdAt) >= delayMinutesThreshold;
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
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showSettings 
                ? 'bg-indigo-650 bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-gray-250'
            }`}
            title="Configuración de sonido, voz y alertas de atraso"
          >
            <Settings size={13} className={showSettings ? 'animate-spin' : ''} />
            <span>Ajustes de Alertas ({pushEnabled ? 'Push + 🔉' : '🔉'})</span>
          </button>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-850 shadow-sm transition-all"
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

      {/* KDS Settings Panel */}
      {showSettings && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-slate-50 border border-gray-250 rounded-2xl p-4 md:p-5 shadow-xs text-xs text-slate-800 space-y-4 text-left"
          id="kds-settings-configuration-panel"
        >
          <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders size={16} className="text-indigo-600" />
              Panel de Configuración de Alertas del Cocinero
            </h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
              Preferencias Locales
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: Audio Beep Configuration */}
            <div className="space-y-3.5 bg-white p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Volume2 size={15} className="text-indigo-600" />
                <span className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">Timbres y Tonos</span>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                  />
                  <span className="font-bold text-gray-750">Activar Timbre de Entrada</span>
                </label>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase">Seleccionar Tono</span>
                  <select
                    value={soundType}
                    disabled={!soundEnabled}
                    onChange={(e) => setSoundType(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 font-bold p-2 rounded-lg text-xs outline-none disabled:opacity-50 text-slate-850"
                  >
                    <option value="standard">Pitido Clásico (Beep)</option>
                    <option value="bell">Campana de Cocina (Ding!)</option>
                    <option value="chime">Chime Armonioso (Chord)</option>
                    <option value="scifi">Ascenso Sónico (Sweep)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400 font-extrabold uppercase">Volumen</span>
                    <span className="font-mono font-bold text-indigo-600">{Math.round(soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    disabled={!soundEnabled}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => playSynthesisSound(soundType, soundVolume)}
                  disabled={!soundEnabled}
                  className="w-full py-1.5 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[10px] hover:bg-indigo-100 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                >
                  <Play size={10} fill="currentColor" /> Probar Tono
                </button>
              </div>
            </div>

            {/* Col 2: Voice Synthesis & Push Notifications */}
            <div className="space-y-3.5 bg-white p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Bell size={15} className="text-indigo-600" />
                <span className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">Voz y Notificaciones Push</span>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    onChange={(e) => setTtsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                  />
                  <span className="font-bold text-gray-750">Lectura por Voz (TTS - Español)</span>
                </label>
                <p className="text-[10px] text-gray-400 leading-normal pl-6">
                  Sintetiza la lectura de comandas nuevas por altavoz con el desglose de productos.
                </p>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-750">Notificaciones de Escritorio (Push)</span>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded uppercase font-mono font-bold ${
                      pushEnabled
                        ? 'bg-emerald-105 bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-450'
                    }`}>
                      {pushEnabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleTogglePushNotifications}
                    className={`w-full py-2 px-3 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer border transition-all uppercase tracking-wider ${
                      pushEnabled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-250'
                    }`}
                  >
                    {pushEnabled ? <BellOff size={11} /> : <Bell size={11} />}
                    {pushEnabled ? 'Desactivar Push' : 'Habilitar Push en Navegador'}
                  </button>
                  <p className="text-[9.5px] text-gray-450 leading-relaxed">
                    Reciba alertas emergentes en su escritorio en tiempo real cuando se levante comanda nueva.
                  </p>
                </div>
              </div>
            </div>

            {/* Col 3: Visual alerts and Late tickets muting */}
            <div className="space-y-3.5 bg-white p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <span className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">Alertas de Retraso de Comandas</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-[10px] text-slate-800 uppercase">Minutos para Considerar Atraso</label>
                    <span className="font-mono bg-amber-50 px-1.5 rounded text-amber-850 font-bold">{delayMinutesThreshold}m</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={delayMinutesThreshold}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v > 0) setDelayMinutesThreshold(v);
                    }}
                    className="w-full bg-slate-50 border border-gray-200 font-bold p-2 rounded-lg text-xs outline-none text-slate-800"
                    placeholder="Minutos de tolerancia..."
                  />
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer pb-1.5 select-none">
                    <input
                      type="checkbox"
                      checked={muteVisualDelays}
                      onChange={(e) => setMuteVisualDelays(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-1 mt-0.5 cursor-pointer"
                    />
                    <div className="leading-snug">
                      <span className="font-black text-slate-800 block text-[11px]">🔇 Silenciar Alertas Visuales</span>
                      <span className="text-[10px] text-gray-550 font-medium block mt-0.5">
                        Apaga el parpadeo pulsante intermitente carmesí y bordes de tickets atrasados para una vista más limpia.
                      </span>
                    </div>
                  </label>
                  
                  {muteVisualDelays ? (
                    <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-[9.5px] font-bold text-amber-900">
                      🔇 El parpadeo visual en carmesí para comandas retrasadas está apagado. Los tickets mantendrán sus colores de estado limpios.
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-lg text-[9.5px] leading-relaxed text-gray-500 font-medium">
                      ⚠ Los pedidos que excedan los {delayMinutesThreshold} minutos destellarán en fondo carmesí con alertas de urgencia visual.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seccion de Firebase Cloud Messaging y Web Push Notificaciones */}
          <div className="mt-5 pt-5 border-t border-gray-200/85 text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    🔥 Integración Firebase Cloud Messaging (FCM) & Web Push
                  </h4>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-550">
                  Permite sincronizar y alertar sobre pedidos nuevos usando el protocolo de notificaciones de sistema. Copie el token del dispositivo para registrarlo en su panel de administración o pruebe el envío en segundo plano.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFcmAdvanced(!showFcmAdvanced)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[10.5px] font-bold text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1.5 self-start lg:self-center transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider"
              >
                <Settings size={12} className={showFcmAdvanced ? 'rotate-45' : ''} />
                {showFcmAdvanced ? 'Ocultar Credenciales' : 'Editar Credenciales FCM'}
              </button>
            </div>

            {/* Credenciales de Firebase Cloud Messaging */}
            <AnimatePresence>
              {showFcmAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200"
                >
                  <div className="col-span-1 md:col-span-4 pb-1 border-b border-gray-100 flex items-center gap-2">
                    <Database size={13} className="text-amber-500" />
                    <span className="font-extrabold text-[10.5px] text-slate-800 uppercase tracking-wider">Credenciales de Proyecto Firebase</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-bold text-gray-400 uppercase">PROJECT ID</label>
                    <input
                      type="text"
                      value={fcmProjectId}
                      onChange={(e) => setFcmProjectId(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 font-mono p-1.5 rounded text-[10.5px] outline-none text-slate-800 focus:border-indigo-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-bold text-gray-400 uppercase font-sans">API KEY</label>
                    <input
                      type="password"
                      value={fcmApiKey}
                      onChange={(e) => setFcmApiKey(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 font-mono p-1.5 rounded text-[10.5px] outline-none text-slate-800 focus:border-indigo-305 focus:border-indigo-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-bold text-gray-400 uppercase font-sans font-sans">MESSAGING SENDER ID</label>
                    <input
                      type="text"
                      value={fcmSenderId}
                      onChange={(e) => setFcmSenderId(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 font-mono p-1.5 rounded text-[10.5px] outline-none text-slate-800 focus:border-indigo-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-bold text-gray-400 uppercase">APP ID</label>
                    <input
                      type="text"
                      value={fcmAppId}
                      onChange={(e) => setFcmAppId(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 font-mono p-1.5 rounded text-[10.5px] outline-none text-slate-800 focus:border-indigo-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Token de Registro único */}
              <div className="lg:col-span-2 space-y-2 bg-slate-100/50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Lock size={11} className="text-indigo-600" /> Device Registration Token (FCM / Web Push / Device ID)
                    </span>
                    <span className="text-[9px] text-gray-450 font-bold font-mono">Sincronizado</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 pb-1">
                    Registre este token en su API / Backend del restaurante para enviar alertas push a este dispositivo al ingresar pedidos.
                  </p>
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fcmToken}
                    className="flex-1 bg-white border border-gray-200 font-mono p-2 rounded-lg text-[10.5px] text-slate-700 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyFcmToken}
                    className={`px-3.5 py-2 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border transition-all whitespace-nowrap ${
                      copyFeedback 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                        : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    {copyFeedback ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copyFeedback ? 'Copiado!' : 'Copiar Token'}</span>
                  </button>
                </div>
              </div>

              {/* Simulador de Envío Cloud en segundo plano */}
              <div className="space-y-2.5 bg-stone-50 p-4 rounded-xl border border-gray-200 text-[11px]">
                <div className="flex items-center gap-1.5 border-b border-gray-250 pb-1.5 justify-between">
                  <span className="font-extrabold text-[10.5px] text-amber-900 uppercase tracking-wider">🎛 Banco de Pruebas KDS</span>
                  <span className="bg-amber-100 text-amber-950 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase font-mono">Simulación</span>
                </div>

                <div className="space-y-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-gray-400 font-bold uppercase">Título de Notificación</span>
                    <input
                      type="text"
                      value={testNotificationTitle}
                      onChange={(e) => setTestNotificationTitle(e.target.value)}
                      className="w-full bg-white border border-gray-200 font-bold p-1 rounded text-[10.5px] outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-gray-400 font-bold uppercase">Detalle del Pedido</span>
                    <input
                      type="text"
                      value={testNotificationBody}
                      onChange={(e) => setTestNotificationBody(e.target.value)}
                      className="w-full bg-white border border-gray-250 p-1 rounded text-[10.5px] outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] text-gray-400 font-bold uppercase font-sans">Espera:</span>
                      <select
                        value={testDelaySeconds}
                        onChange={(e) => setTestDelaySeconds(parseInt(e.target.value, 10))}
                        className="bg-white border border-gray-200 font-extrabold rounded p-1 text-[10px] outline-none"
                      >
                        <option value={3}>3 segundos</option>
                        <option value={5}>5 segundos</option>
                        <option value={10}>10 segundos</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={isSimulatingPush}
                      onClick={handleTriggerTestPush}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSimulatingPush ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin" /> Programado
                        </span>
                      ) : (
                        'Probar en 2do Plano'
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-amber-900 leading-tight mt-1 bg-amber-50/50 border border-amber-100 p-1.5 rounded-lg font-medium">
                    💡 Presione el botón y minimice/ponga en segundo plano de inmediato esta pestaña para ver que el service worker despache alertas reales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Retrasadas (+{delayMinutesThreshold} min)</span>
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

              // Color critical delay if >= delayMinutesThreshold mins (and visual alert is not muted)
              if (minutesElapsed >= delayMinutesThreshold && !muteVisualDelays && order.status !== 'entregada') {
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

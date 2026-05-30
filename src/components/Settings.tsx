/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Palette, CheckCircle2, MonitorSmartphone, Settings as SettingsIcon, Database, Wifi, WifiOff, Save, Key, Globe } from 'lucide-react';
import { reinitializeSupabase, getSupabaseConfig } from '../services/supabaseClient';
import { isSupabaseActive } from '../services/api';

const THEMES = [
  { id: 'default', name: 'Alegra Classic', type: 'Azul Original', bg: 'bg-blue-600', text: 'text-blue-900', desc: 'Tema por defecto de la aplicación' },
  { id: 'food', name: 'Food & Restaurant', type: 'Negro y Amarillo', bg: 'bg-yellow-500', text: 'text-gray-900', desc: 'Ideal para pizzerías, food trucks y restaurantes' },
  { id: 'pharmacy', name: 'Health & Pharmacy', type: 'Cyan y Azul Profundo', bg: 'bg-sky-500', text: 'text-sky-900', desc: 'Clínicas, farmacias y consultorios médicos' },
  { id: 'premium-emerald', name: 'Tech & Services', type: 'Esmeralda', bg: 'bg-emerald-500', text: 'text-emerald-900', desc: 'Empresas de tecnología, consultoría o servicios' },
  { id: 'premium-violet', name: 'Premium Studio', type: 'Violeta Vibrante', bg: 'bg-violet-500', text: 'text-violet-900', desc: 'Agencias creativas, estudios de diseño' },
  { id: 'beauty', name: 'Beauty & Salon', type: 'Coral y Rosa', bg: 'bg-rose-500', text: 'text-rose-900', desc: 'Salones de belleza, spas, boutiques' },
  { id: 'minimalist', name: 'Minimalist B&W', type: 'Blanco y Negro', bg: 'bg-neutral-800', text: 'text-neutral-900', desc: 'Tiendas de ropa, joyerías, marcas elegantes' }
];

type BackendMode = 'supabase' | 'local' | 'mock';

export default function Settings() {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('alegra_theme') || 'default';
  });

  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => {
    return localStorage.getItem('alegra_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  });
  
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => {
    return localStorage.getItem('alegra_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });
  
  const [useSupabaseCheckbox, setUseSupabaseCheckbox] = useState(() => {
    const active = localStorage.getItem('alegra_supabase_use');
    if (active !== null) return active === 'true';
    return import.meta.env.VITE_USE_SUPABASE === 'true';
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const resolvedMode: BackendMode = useSupabaseCheckbox ? 'supabase' : 'mock';

  useEffect(() => {
    if (activeTheme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
    localStorage.setItem('alegra_theme', activeTheme);
  }, [activeTheme]);

  const handleSaveConnection = () => {
    localStorage.setItem('alegra_supabase_url', supabaseUrlInput.trim());
    localStorage.setItem('alegra_supabase_key', supabaseKeyInput.trim());
    localStorage.setItem('alegra_supabase_use', useSupabaseCheckbox ? 'true' : 'false');
    
    // Refresh client in real-time
    reinitializeSupabase();
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      // Force reload to let application fetch freshly from new backend or mock
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display flex items-center gap-2">
            <SettingsIcon size={22} className="text-alegra-primary" />
            Configuración del Sistema
          </h1>
          <p className="text-sm text-gray-500">
            Personaliza la apariencia y el comportamiento de tu ERP
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Palette className="text-alegra-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Apariencia y Temas</h2>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-6">
            Selecciona la paleta de colores que mejor se adapte al rubro de tu negocio. El cambio se aplicará instantáneamente a toda la plataforma web y se sincronizará con la aplicación móvil (POS).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((theme) => {
              const isSelected = activeTheme === theme.id;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col text-left group cursor-pointer ${
                    isSelected 
                      ? 'border-alegra-primary bg-blue-50/50 shadow-md ring-1 ring-alegra-primary/20' 
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full ${theme.bg} shadow-sm border border-black/10`}></div>
                      <span className={`text-xs font-bold ${theme.text}`}>{theme.type}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} className="text-alegra-primary animate-scale-in" />
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-1">{theme.name}</h3>
                  <p className="text-xs text-gray-500 leading-snug">{theme.desc}</p>
                  
                  <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${isSelected ? 'opacity-100 ring-4 ring-alegra-primary/10' : 'opacity-0'}`}></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Backend Connection Status Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="backend-connection">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Database className="text-alegra-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Conexión de Base de Datos Supabase</h2>
        </div>
        <div className="p-5 space-y-6">
          <p className="text-sm text-gray-650">
            Puedes conectar tu propia base de datos de <strong>Supabase</strong> ingresando las credenciales a continuación. Al activar Supabase, toda la data se cargará directamente del servidor en la nube en tiempo real, en lugar de usar datos ficticios de muestra (mock data).
          </p>

          <div className="space-y-4 max-w-2xl bg-slate-50 p-5 rounded-xl border border-gray-150">
            <h3 className="font-bold text-xs text-alegra-secondary uppercase tracking-wider mb-2">Formulario de Credenciales</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Globe size={14} className="text-gray-400" />
                Supabase URL de Proyecto (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-white border border-gray-200 rounded-lg text-xs px-3.5 py-2.5 outline-none focus:border-alegra-primary text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Key size={14} className="text-gray-400" />
                Supabase Anon/Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-white border border-gray-200 rounded-lg text-xs px-3.5 py-2.5 outline-none focus:border-alegra-primary text-gray-800"
              />
            </div>

            <div className="flex items-center gap-3 pt-2.5">
              <input
                id="use-supabase-checkbox"
                type="checkbox"
                checked={useSupabaseCheckbox}
                onChange={(e) => setUseSupabaseCheckbox(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-alegra-primary focus:ring-alegra-primary"
              />
              <label htmlFor="use-supabase-checkbox" className="text-xs font-bold text-alegra-secondary select-none cursor-pointer">
                Activar Conexión de Supabase (Si está desactivado, usará datos mock/ficticios)
              </label>
            </div>

            <div className="pt-3 border-t border-gray-150 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSaveConnection}
                className="bg-alegra-primary hover:bg-alegra-primary-dark text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                id="btn-save-supabase"
              >
                <Save size={14} /> Guardar credenciales y reiniciar
              </button>

              {saveSuccess && (
                <span className="text-xs text-green-600 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 size={14} /> ¡Sincronizado! Recargando...
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border-2 p-4 transition-all ${
              resolvedMode === 'supabase'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Supabase Cloud</span>
                {resolvedMode === 'supabase' ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} />}
              </div>
              <p className="text-[10px] break-all">
                {supabaseUrlInput ? supabaseUrlInput : 'No configurado'}
              </p>
              <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                resolvedMode === 'supabase' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200'
              }`}>
                {resolvedMode === 'supabase' ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>

            <div className={`rounded-xl border-2 p-4 transition-all ${
              resolvedMode === 'mock'
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Datos de Muestra (Local Mock)</span>
                {resolvedMode === 'mock' ? <CheckCircle2 size={16} className="text-amber-500" /> : <WifiOff size={16} />}
              </div>
              <p className="text-[10px]">Sincronizado localmente mediante el LocalStorage del navegador.</p>
              <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                resolvedMode === 'mock' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200'
              }`}>
                {resolvedMode === 'mock' ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-alegra-secondary to-alegra-primary rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
            <MonitorSmartphone size={20} />
            Sincronización Multi-dispositivo
          </h3>
          <p className="text-blue-100 text-sm max-w-xl">
            El tema seleccionado se guardará en tu configuración y se aplicará automáticamente a la aplicación móvil POS y a todos los dispositivos conectados a tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

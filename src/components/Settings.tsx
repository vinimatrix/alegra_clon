/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Palette, CheckCircle2, MonitorSmartphone, Settings as SettingsIcon, Database, Wifi, WifiOff } from 'lucide-react';

const THEMES = [
  { id: 'default', name: 'Alegra Classic', type: 'Azul Original', bg: 'bg-blue-600', text: 'text-blue-900', desc: 'Tema por defecto de la aplicación' },
  { id: 'food', name: 'Food & Restaurant', type: 'Negro y Amarillo', bg: 'bg-yellow-500', text: 'text-gray-900', desc: 'Ideal para pizzerías, food trucks y restaurantes' },
  { id: 'pharmacy', name: 'Health & Pharmacy', type: 'Cyan y Azul Profundo', bg: 'bg-sky-500', text: 'text-sky-900', desc: 'Clínicas, farmacias y consultorios médicos' },
  { id: 'premium-emerald', name: 'Tech & Services', type: 'Esmeralda', bg: 'bg-emerald-500', text: 'text-emerald-900', desc: 'Empresas de tecnología, consultoría o servicios' },
  { id: 'premium-violet', name: 'Premium Studio', type: 'Violeta Vibrante', bg: 'bg-violet-500', text: 'text-violet-900', desc: 'Agencias creativas, estudios de diseño' },
  { id: 'beauty', name: 'Beauty & Salon', type: 'Coral y Rosa', bg: 'bg-rose-500', text: 'text-rose-900', desc: 'Salones de belleza, spas, boutiques' },
  { id: 'minimalist', name: 'Minimalist B&W', type: 'Blanco y Negro', bg: 'bg-neutral-800', text: 'text-neutral-900', desc: 'Tiendas de ropa, joyerías, marcas elegantes' }
];

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const NESTJS_URL = import.meta.env.VITE_NESTJS_API_URL || 'http://localhost:3001';

type BackendMode = 'supabase' | 'local' | 'mock';

export default function Settings() {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('alegra_theme') || 'default';
  });

  const backendMode: BackendMode = USE_SUPABASE
    ? 'supabase'
    : NESTJS_URL !== 'http://localhost:3001' || true
    ? 'local'
    : 'mock';

  const resolvedMode: BackendMode = USE_SUPABASE ? 'supabase' : 'mock';

  useEffect(() => {
    if (activeTheme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
    localStorage.setItem('alegra_theme', activeTheme);
  }, [activeTheme]);

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Database className="text-alegra-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Conexión de Backend</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Controla si la aplicación usa <strong>Supabase</strong>, el <strong>API Local (NestJS)</strong>, o los <strong>datos de muestra</strong> (mock). Configura el archivo <code className="bg-gray-100 px-1 rounded text-xs">.env</code> para activar cada modo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Supabase Mode */}
            <div className={`rounded-xl border-2 p-4 transition-all ${
              resolvedMode === 'supabase'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Supabase Cloud</span>
                {resolvedMode === 'supabase'
                  ? <Wifi size={16} className="text-emerald-500" />
                  : <WifiOff size={16} className="text-gray-400" />}
              </div>
              <code className="text-[10px] text-gray-500 break-all block">
                {SUPABASE_URL ? SUPABASE_URL.slice(0, 40) + '...' : 'VITE_SUPABASE_URL no configurado'}
              </code>
              <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                resolvedMode === 'supabase' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {resolvedMode === 'supabase' ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Local NestJS */}
            <div className={`rounded-xl border-2 p-4 transition-all ${
              resolvedMode === 'local'
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Backend Local (NestJS)</span>
                {resolvedMode === 'local'
                  ? <Wifi size={16} className="text-blue-500" />
                  : <WifiOff size={16} className="text-gray-400" />}
              </div>
              <code className="text-[10px] text-gray-500 break-all block">{NESTJS_URL}</code>
              <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                resolvedMode === 'local' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {resolvedMode === 'local' ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Mock Data */}
            <div className={`rounded-xl border-2 p-4 transition-all ${
              resolvedMode === 'mock'
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Datos de Muestra (Mock)</span>
                {resolvedMode === 'mock'
                  ? <CheckCircle2 size={16} className="text-amber-500" />
                  : <WifiOff size={16} className="text-gray-400" />}
              </div>
              <code className="text-[10px] text-gray-500 block">localStorage / mockData.ts</code>
              <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                resolvedMode === 'mock' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {resolvedMode === 'mock' ? '✓ Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="mt-4 bg-gray-900 rounded-lg p-4">
            <p className="text-xs font-mono text-gray-400 mb-1"># Archivo .env (en la raíz del proyecto)</p>
            <p className="text-xs font-mono text-emerald-400">VITE_USE_SUPABASE=<span className="text-yellow-300">{USE_SUPABASE ? 'true' : 'false'}</span></p>
            <p className="text-xs font-mono text-emerald-400">VITE_SUPABASE_URL=<span className="text-yellow-300">{SUPABASE_URL || '"tu_url_de_supabase"'}</span></p>
            <p className="text-xs font-mono text-emerald-400">VITE_SUPABASE_ANON_KEY=<span className="text-yellow-300">"tu_anon_key"</span></p>
            <p className="text-xs font-mono text-emerald-400">VITE_NESTJS_API_URL=<span className="text-yellow-300">{NESTJS_URL}</span></p>
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

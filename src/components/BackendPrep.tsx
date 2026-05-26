/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Settings, 
  Terminal, 
  Copy, 
  Check, 
  PlusCircle, 
  Server, 
  Braces 
} from 'lucide-react';
import { SUPABASE_SQL_TEMP, NESTJS_CONTROLLER_TEMP, SUPABASE_JS_CLIENT } from '../lib/backendTemplates';

export default function BackendPrep() {
  const [activeTab, setActiveTab] = useState<'supabase-sql' | 'supabase-js' | 'nestjs'>('supabase-sql');
  const [copiedText, setCopiedText] = useState(false);

  const activeContent = 
    activeTab === 'supabase-sql' ? SUPABASE_SQL_TEMP :
    activeTab === 'supabase-js' ? SUPABASE_JS_CLIENT :
    NESTJS_CONTROLLER_TEMP;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6" id="backend-prep-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-tracker font-display flex items-center gap-2 text-alegra-secondary">
            <Database size={22} className="text-alegra-primary" />
            Preparación de Backend & Integraciones
          </h1>
          <p className="text-sm text-gray-500">
            Exporta el esquema postgres completo para Supabase Database o descarga el boilerplate listo para NestJS controllers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Selection of components and structures */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xxs">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Seleccionar Tecnología</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('supabase-sql')}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'supabase-sql' 
                    ? 'border-blue-600 bg-blue-50/40 text-blue-850 font-semibold shadow-xs' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Database size={16} />
                <div>
                  <h4 className="text-xs font-extrabold leading-none">Supabase Postgres Schema (SQL)</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Definición de tablas, RLS e inventario triggers</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('supabase-js')}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'supabase-js' 
                    ? 'border-blue-600 bg-blue-50/40 text-blue-850 font-semibold shadow-xs' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Braces size={16} />
                <div>
                  <h4 className="text-xs font-extrabold leading-none">Supabase JS Client Configuration</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Conexión de cliente de frontend React</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('nestjs')}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'nestjs' 
                    ? 'border-blue-600 bg-blue-50/40 text-blue-850 font-semibold shadow-xs' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Server size={16} />
                <div>
                  <h4 className="text-xs font-extrabold leading-none">NestJS Boilerplate Structure</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Esqueleto de servicios y REST controllers</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-gray-150 p-4 rounded-xl text-xs space-y-3 font-sans text-gray-700">
            <h4 className="font-bold text-alegra-secondary flex items-center gap-1.5 font-display text-sm">
              <Settings size={15} className="text-alegra-primary" />
              Arquitectura de Sincronización
            </h4>
            <p className="leading-relaxed">
              Toda la lógica de emisión de recibos en este ERP está acoplada a un estándar de partida doble. Al conectar Supabase, puedes activar disparadores automáticos para que cuando disminuya inventario, se asiente el gasto e ITBIS correspondiente.
            </p>
            <div className="border-t border-gray-200 pt-3 flex gap-2 font-mono text-[10px] text-gray-500">
              <span>Host Node: 3000</span>
              <span>•</span>
              <span>PostgreSQL v15</span>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Code View frame */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <div>
              <h3 className="text-sm font-bold text-alegra-secondary uppercase tracking-widest font-display">Código Fuente Copiable</h3>
              <p className="text-[11px] text-gray-400">Inspecciona y copia este bloque listo para ejecutar en consola o archivos locales</p>
            </div>
            
            <button
              onClick={handleCopyCode}
              className="bg-slate-100/80 hover:bg-slate-100 text-gray-650 p-2 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy size={13} className={copiedText ? 'text-emerald-500 animate-bounce' : ''} />
              {copiedText ? '¡Copiado!' : 'Copiar Código'}
            </button>
          </div>

          {/* Preformatted code snippet scrollable container */}
          <div className="bg-slate-900/95 font-mono text-[9.5px] p-4 text-gray-300 rounded-xl leading-relaxed max-h-[480px] overflow-y-auto border border-gray-800 scrollbar-thin">
            <pre className="whitespace-pre">{activeContent}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

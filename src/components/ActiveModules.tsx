/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  Sparkles, 
  Calendar, 
  Stethoscope, 
  Layers, 
  Check, 
  CheckCircle, 
  Grid, 
  Tv, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { BusinessModuleConfig } from '../types';

interface ActiveModulesProps {
  modulesConfig: BusinessModuleConfig[];
  onToggleModule: (id: BusinessModuleConfig['id']) => void;
  onApplyPreset: (preset: 'salon' | 'clinic' | 'agency' | 'full' | 'reset') => void;
}

export default function ActiveModules({
  modulesConfig,
  onToggleModule,
  onApplyPreset
}: ActiveModulesProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handleApplyPreset = (preset: 'salon' | 'clinic' | 'agency' | 'full' | 'reset') => {
    setSelectedPreset(preset);
    onApplyPreset(preset);
    alert(`¡Configuración de negocio adaptada con éxito!`);
  };

  return (
    <div className="space-y-6 text-left" id="active-modules-manager">
      
      {/* 1. PRESETS BOX */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-850 text-white rounded-2xl p-6 shadow-md border border-slate-950 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-400 animate-pulse shrink-0" size={20} />
          <h3 className="text-base font-bold font-display uppercase tracking-wide">
            Configuración Rápida de Módulos por Tipo de Negocio
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-normal max-w-2xl">
          Seleccione la actividad de su empresa para configurar de manera instantánea los módulos que mejor asisten a su flujo diario. Se habilitarán las pestañas correspondientes en su menú lateral de navegación.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Salon Aesthetic preset card */}
          <button
            type="button"
            onClick={() => handleApplyPreset('salon')}
            className={`p-4 rounded-xl text-left border cursor-pointer transition-all space-y-1.5 ${
              selectedPreset === 'salon'
                ? 'bg-indigo-650 border-indigo-500 ring-2 ring-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded uppercase font-display">
                Salones & Spas
              </span>
              {selectedPreset === 'salon' && <CheckCircle size={14} className="text-indigo-400" />}
            </div>
            <h4 className="text-xs font-bold font-display">Estética, Salón o Taller</h4>
            <p className="text-[10px] text-slate-300">Activa turnos & colas de llegada presenciales.</p>
          </button>

          {/* Clinics preset card */}
          <button
            type="button"
            onClick={() => handleApplyPreset('clinic')}
            className={`p-4 rounded-xl text-left border cursor-pointer transition-all space-y-1.5 ${
              selectedPreset === 'clinic'
                ? 'bg-indigo-650 border-indigo-500 ring-2 ring-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-red-500/20 text-red-300 font-extrabold px-1.5 py-0.5 rounded uppercase font-display">
                Clínicas & Salud
              </span>
              {selectedPreset === 'clinic' && <CheckCircle size={14} className="text-indigo-400" />}
            </div>
            <h4 className="text-xs font-bold font-display">Consultorio & Odontología</h4>
            <p className="text-[10px] text-slate-300">Activa citas de turnos + fichas e historia clínica.</p>
          </button>

          {/* Agencies tech preset card */}
          <button
            type="button"
            onClick={() => handleApplyPreset('agency')}
            className={`p-4 rounded-xl text-left border cursor-pointer transition-all space-y-1.5 ${
              selectedPreset === 'agency'
                ? 'bg-indigo-650 border-indigo-500 ring-2 ring-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded uppercase font-display">
                Tecnología & Agencias
              </span>
              {selectedPreset === 'agency' && <CheckCircle size={14} className="text-indigo-400" />}
            </div>
            <h4 className="text-xs font-bold font-display">Agencia & Consultorías</h4>
            <p className="text-[10px] text-slate-300">Activa gestión de proyectos + Scrum Gantt.</p>
          </button>

          {/* Full Suite preset card */}
          <button
            type="button"
            onClick={() => handleApplyPreset('full')}
            className={`p-4 rounded-xl text-left border cursor-pointer transition-all space-y-1.5 ${
              selectedPreset === 'full'
                ? 'bg-indigo-650 border-indigo-500 ring-2 ring-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase font-display">
                Suite Completa
              </span>
              {selectedPreset === 'full' && <CheckCircle size={14} className="text-indigo-400" />}
            </div>
            <h4 className="text-xs font-bold font-display">Alegra Enterprise Pro</h4>
            <p className="text-[10px] text-slate-300">Enciende todas las características avanzadas registrables.</p>
          </button>

        </div>
      </div>

      {/* 2. CUSTOM MODULE SWITCHER TILES */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">
            Administración Individual de Módulos Adicionales
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Use estos alternadores para habilitar/desactivar de manera manual.</p>
        </div>

        <div className="divide-y divide-gray-150 border-t border-b border-gray-200">
          {modulesConfig.map((mod) => {
            const isEnabled = mod.isEnabled;
            return (
              <div key={mod.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 max-w-xl">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    mod.id === 'citas_turnos' ? 'bg-amber-50 text-amber-600' :
                    mod.id === 'records_medicos' ? 'bg-red-50 text-red-650' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {mod.id === 'citas_turnos' && <Calendar size={22} />}
                    {mod.id === 'records_medicos' && <Stethoscope size={22} />}
                    {mod.id === 'gestion_proyectos' && <Layers size={22} />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight">{mod.name}</h4>
                      <span className="text-[8px] bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                        {mod.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-550 leading-relaxed">{mod.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleModule(mod.id)}
                  className={`p-1 focus:outline-none transition-colors cursor-pointer shrink-0 ${
                    isEnabled ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-400'
                  }`}
                  id={`toggle-module-${mod.id}`}
                >
                  {isEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

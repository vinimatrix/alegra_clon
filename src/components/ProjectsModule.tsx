/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  User, 
  KanbanSquare, 
  BarChart4, 
  ListTodo, 
  ChevronRight, 
  FileSpreadsheet, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  X 
} from 'lucide-react';
import { Project, ProjectTask, Client } from '../types';

interface ProjectsModuleProps {
  projects: Project[];
  tasks: ProjectTask[];
  onAddProject: (proj: Project) => void;
  onUpdateProject: (id: string, updated: Project) => void;
  onUpdateProjectProgress: (id: string, progress: number) => void;
  onAddProjectTask: (task: ProjectTask) => void;
  onUpdateTaskStatus: (id: string, status: ProjectTask['status']) => void;
  clients: Client[];
}

export default function ProjectsModule({
  projects,
  tasks,
  onAddProject,
  onUpdateProject,
  onUpdateProjectProgress,
  onAddProjectTask,
  onUpdateTaskStatus,
  clients
}: ProjectsModuleProps) {
  
  // Tab within the projects module
  const [subTab, setSubTab] = useState<'summary' | 'kanban' | 'gantt'>('summary');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New Project Form states
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projClientId, setProjClientId] = useState('');
  const [projClientName, setProjClientName] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projDue, setProjDue] = useState('');

  // Interactive Project Lifecycle & Incidents states
  const [selectedProjId, setSelectedProjId] = useState<string | null>(null);
  const [newIncidentType, setNewIncidentType] = useState<'atraso' | 'cambio_alcance' | 'riesgo' | 'nota_general' | 'reunion_cliente'>('atraso');
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');

  const handleUpdateProjStatus = (projectId: string, nextStatus: Project['status']) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updated = { ...proj, status: nextStatus };
    onUpdateProject(projectId, updated);
  };

  const handleAddIncident = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!newIncidentTitle || !newIncidentDesc) {
      alert('Por favor complete el título y descripción de la nueva situación o atraso.');
      return;
    }
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const newIncident = {
      id: `inc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: newIncidentType,
      title: newIncidentTitle,
      description: newIncidentDesc,
      resolved: false
    };

    // If type is delay / atraso, automatically flag status as 'atrasado' to manage lifecycle
    let nextStatus = proj.status;
    if (newIncidentType === 'atraso') {
      nextStatus = 'atrasado';
    }

    const updated = {
      ...proj,
      status: nextStatus,
      incidents: [...(proj.incidents || []), newIncident]
    };

    onUpdateProject(projectId, updated);

    // Reset incident form
    setNewIncidentTitle('');
    setNewIncidentDesc('');
    setNewIncidentType('atraso');
  };

  const handleToggleIncidentResolved = (projectId: string, incidentId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const updatedIncidents = (proj.incidents || []).map(inc => {
      if (inc.id === incidentId) {
        return { ...inc, resolved: !inc.resolved };
      }
      return inc;
    });

    const updated = {
      ...proj,
      incidents: updatedIncidents
    };

    onUpdateProject(projectId, updated);
  };
  
  // New Task Form states
  const [taskProjectId, setTaskProjectId] = useState(projects[0]?.id || '');
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const handleClientSelect = (clientId: string) => {
    setProjClientId(clientId);
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setProjClientName(found.name);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projStart || !projDue) {
      alert('Por favor complete el nombre del proyecto y las fechas correspondientes.');
      return;
    }

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: projName,
      description: projDesc,
      clientId: projClientId || undefined,
      clientName: projClientId ? projClientName : 'Consumidor Final / Interno',
      startDate: projStart,
      dueDate: projDue,
      status: 'planeacion',
      progress: 0
    };

    onAddProject(newProj);
    
    // Auto sync task modal default option
    if (!taskProjectId) {
      setTaskProjectId(newProj.id);
    }

    // Reset project form
    setProjName('');
    setProjDesc('');
    setProjClientId('');
    setProjClientName('');
    setProjStart('');
    setProjDue('');
    setShowAddProjectModal(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !taskProjectId || !taskStart || !taskDue) {
      alert('Por favor complete el nombre, proyecto asignado y fechas correspondientes.');
      return;
    }

    // Calculate duration in days
    const sDate = new Date(taskStart);
    const dDate = new Date(taskDue);
    const diffTime = Math.abs(dDate.getTime() - sDate.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      projectId: taskProjectId,
      name: taskName,
      description: taskDesc,
      status: 'todo',
      assignee: taskAssignee || 'Sin asignar',
      startDate: taskStart,
      dueDate: taskDue,
      durationDays
    };

    onAddProjectTask(newTask);

    // Reset task form
    setTaskName('');
    setTaskDesc('');
    setTaskAssignee('');
    setTaskStart('');
    setTaskDue('');
    setShowAddTaskModal(false);
  };

  // KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'doing').length;

  return (
    <div className="space-y-6 text-left" id="projects-board-and-timeline">
      
      {/* Dynamic Tabs header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-2.5 flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('summary')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'summary' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'bg-white hover:bg-gray-150 text-gray-650 font-semibold'
            }`}
          >
            <BarChart4 size={14} /> Resumen General
          </button>
          
          <button
            onClick={() => setSubTab('kanban')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'kanban' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'bg-white hover:bg-gray-150 text-gray-650 font-semibold'
            }`}
          >
            <KanbanSquare size={14} /> Tablero Kanban
          </button>

          <button
            onClick={() => setSubTab('gantt')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'gantt' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'bg-white hover:bg-gray-150 text-gray-650 font-semibold'
            }`}
          >
            <FileSpreadsheet size={14} /> Cronograma Gantt
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10.5px] py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
          >
            <Plus size={13} /> Nuevo Proyecto
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-750 text-white font-black text-[10.5px] py-2 px-4 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md uppercase tracking-wider"
          >
            <Plus size={13} /> Agregar Tarea
          </button>
        </div>
      </div>

      {/*******************************************************
       * TAB VIEW 1: SUMMARY / GENERAL OVERVIEW
       *******************************************************/
      subTab === 'summary' && (
        <div className="space-y-6" id="projects-tab-summary">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-150 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Proyectos Activos</span>
                <span className="text-xl font-bold font-mono text-slate-800">{projects.length}</span>
                <p className="text-[9.5px] text-gray-500">Bajo control de hitos</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-150 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Tareas En Desarrollo</span>
                <span className="text-xl font-bold font-mono text-slate-800">{inProgressTasks} / {totalTasks}</span>
                <p className="text-[9.5px] text-gray-500">Ejecutándose en Spring</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-150 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">Tareas Terminadas (Done)</span>
                <span className="text-xl font-bold font-mono text-slate-800">
                  {totalTasks > 0 ? `${Math.round((completedTasks/totalTasks) * 100)}%` : '0%'}
                </span>
                <p className="text-[9.5px] text-gray-500">Entrega de valor certificada</p>
              </div>
            </div>
          </div>

          {/* Projects progress list representation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold font-display uppercase tracking-wide text-slate-800 pb-3 border-b border-gray-100">
              Progreso e Hitos de Proyectos
            </h3>

            {projects.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-xs">
                Introduzca su primer proyecto con el botón de la esquina superior derecha.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => {
                  const correlatedTasks = tasks.filter(t => t.projectId === proj.id);
                  const totalProjTasks = correlatedTasks.length;
                  const doneProjTasks = correlatedTasks.filter(t => t.status === 'done').length;
                  
                  // Progress metric recalculation
                  const realProgress = totalProjTasks > 0 ? Math.round((doneProjTasks / totalProjTasks) * 100) : proj.progress;
                  
                  return (
                    <div key={proj.id} className="border border-gray-150 rounded-xl p-4 space-y-3.5 hover:border-gray-200 transition-all bg-slate-50/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            P-Id: {proj.id.replace('proj-', '')}
                          </span>
                          <h4 className="text-xs font-black text-slate-800 font-display uppercase tracking-tight block mt-1">
                            {proj.name}
                          </h4>
                        </div>
                        <span className="text-[10px] text-indigo-700 font-extrabold font-mono">{realProgress}%</span>
                      </div>

                      <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">
                        {proj.description || 'Sin descripción corporativa especificada.'}
                      </p>

                      <div className="space-y-1.5">
                        <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${realProgress || 10}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                          <span>Entregas: {doneProjTasks} / {totalProjTasks} Tareas</span>
                          <span>Inicio: {proj.startDate} • Entrega: {proj.dueDate}</span>
                        </div>
                      </div>

                      {/* Manual range adjustment block to allow flexible play */}
                      <div className="pt-2 border-t border-dashed border-gray-150 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-semibold">Modificar Hito Manualmente:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={realProgress}
                          onChange={(e) => onUpdateProjectProgress(proj.id, Number(e.target.value))}
                          className="w-28 opacity-80"
                        />
                      </div>

                      {/* CLINICAL/OPERATIONAL STATUS INDICATOR & TOGGLER */}
                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-extrabold uppercase">Estado:</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                            proj.status === 'atrasado' ? 'bg-red-100 text-red-800 animate-pulse border border-red-200' :
                            proj.status === 'pausado' ? 'bg-gray-100 text-gray-500' :
                            proj.status === 'desarrollo' ? 'bg-blue-100 text-blue-850' :
                            proj.status === 'revision' ? 'bg-amber-100 text-amber-805' :
                            proj.status === 'entregado' ? 'bg-emerald-100 text-emerald-805 font-bold' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {proj.status === 'planeacion' ? 'Planificación' :
                             proj.status === 'desarrollo' ? 'Desarrollo' :
                             proj.status === 'revision' ? 'Revisión QA' :
                             proj.status === 'pausado' ? 'Pausado' :
                             proj.status === 'atrasado' ? 'Atrasado / Incidente' :
                             proj.status === 'entregado' ? 'Entregado ✔' :
                             proj.status}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProjId(selectedProjId === proj.id ? null : proj.id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-705 border border-indigo-150 font-black px-2.5 py-1 rounded text-[9.5px] cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Activity size={12} />
                          Gestionar Situaciones & Ciclo
                          {(proj.incidents || []).filter(i => !i.resolved).length > 0 && (
                            <span className="bg-red-500 text-white font-black px-1 rounded-full text-[8px] animate-bounce">
                              {(proj.incidents || []).filter(i => !i.resolved).length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* COLLAPSIBLE OPERATIONS PANEL */}
                      {selectedProjId === proj.id && (
                        <div className="mt-3 bg-white border border-gray-150 rounded-xl p-3.5 space-y-4 animate-fade-in text-[11px] text-slate-800">
                          
                          {/* STATUS FLOW SELECTOR */}
                          <div className="space-y-1.5">
                            <span className="text-[9.5px] text-gray-400 font-extrabold uppercase tracking-wide block">Fase / Ciclo de Vida del Proyecto:</span>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { key: 'planeacion', val: 'Plan' },
                                { key: 'desarrollo', val: 'Desarrollo' },
                                { key: 'revision', val: 'Revisión' },
                                { key: 'pausado', val: 'Pausa' },
                                { key: 'atrasado', val: 'Atrasado' },
                                { key: 'entregado', val: 'Entregado' }
                              ].map(fase => (
                                <button
                                  key={fase.key}
                                  type="button"
                                  onClick={() => handleUpdateProjStatus(proj.id, fase.key as any)}
                                  className={`px-2 py-1 rounded text-[9.5px] font-bold border cursor-pointer transition-all ${
                                    proj.status === fase.key
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                      : 'bg-slate-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {fase.val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* LIST OF LOGGED INCIDENTS / DELAYS / SITUATIONS */}
                          <div className="space-y-2 border-t border-gray-100 pt-3">
                            <span className="text-[9.5px] text-indigo-950 font-extrabold uppercase tracking-wide block">Bitácora de Situaciones & Atrasos:</span>
                            
                            {(!proj.incidents || proj.incidents.length === 0) ? (
                              <p className="text-[9.5px] text-gray-400 italic py-2">No se han registrado situaciones, retrasos o renegociaciones de alcance.</p>
                            ) : (
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {proj.incidents.map(inc => (
                                  <div key={inc.id} className="p-2.5 border border-gray-150 rounded-lg bg-slate-50/50 space-y-1.5">
                                    <div className="flex justify-between items-start text-[9.5px]">
                                      <div>
                                        <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded font-mono mr-1.5 ${
                                          inc.type === 'atraso' ? 'bg-red-105 bg-red-100 text-red-800' :
                                          inc.type === 'cambio_alcance' ? 'bg-amber-100 text-amber-800' :
                                          inc.type === 'riesgo' ? 'bg-orange-100 text-orange-900' :
                                          inc.type === 'reunion_cliente' ? 'bg-indigo-100 text-indigo-805' :
                                          'bg-slate-205 bg-slate-100 text-slate-700'
                                        }`}>
                                          {inc.type === 'atraso' ? 'Atraso / Demora' :
                                           inc.type === 'cambio_alcance' ? 'Cambio Alcance' :
                                           inc.type === 'riesgo' ? 'Riesgo Crítico' :
                                           inc.type === 'reunion_cliente' ? 'Reunión Cliente' :
                                           'Minuta / Nota'}
                                        </span>
                                        <span className="text-gray-400 font-bold font-mono">{inc.date}</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleIncidentResolved(proj.id, inc.id)}
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                                          inc.resolved
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse'
                                        }`}
                                      >
                                        {inc.resolved ? '✓ Resuelto' : '⚠ Pendiente'}
                                      </button>
                                    </div>

                                    <div className="text-xs">
                                      <h6 className="font-extrabold text-slate-900 leading-tight block">{inc.title}</h6>
                                      <p className="text-[10.5px] text-gray-500 leading-normal font-semibold font-sans mt-0.5">{inc.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* INTERACTIVE FORM TO WRITE A NEW SITUATION */}
                          <form onSubmit={(e) => handleAddIncident(e, proj.id)} className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                            <span className="text-[9.5px] text-gray-450 font-extrabold uppercase tracking-wide block">Log de Nueva Situación u Obstáculo:</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  required
                                  value={newIncidentTitle}
                                  onChange={e => setNewIncidentTitle(e.target.value)}
                                  placeholder="Ej. Incumplimiento de entrega por proveedor / Cambio Rx"
                                  className="w-full bg-slate-50 border border-gray-150 font-bold p-1.5 rounded-lg outline-none text-[10.5px] text-slate-800"
                                />
                              </div>
                              <div>
                                <select
                                  value={newIncidentType}
                                  onChange={e => setNewIncidentType(e.target.value as any)}
                                  className="w-full bg-slate-50 border border-gray-150 font-black p-1.5 rounded-lg text-[10px] outline-none text-slate-700"
                                >
                                  <option value="atraso">Atraso / Demora</option>
                                  <option value="cambio_alcance">Cambio Alcance</option>
                                  <option value="riesgo">Riesgo / Alerta</option>
                                  <option value="reunion_cliente">Reunión Cliente</option>
                                  <option value="nota_general">Nota o suceso</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                              <div className="sm:col-span-3">
                                <input
                                  type="text"
                                  required
                                  value={newIncidentDesc}
                                  onChange={e => setNewIncidentDesc(e.target.value)}
                                  placeholder="Escriba detalle, causas o medidas de mitigación tomadas..."
                                  className="w-full bg-slate-50 border border-gray-150 font-medium p-1.5 rounded-lg outline-none text-[10px] text-slate-700"
                                />
                              </div>
                              <button
                                type="submit"
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2 rounded-lg text-[9.5px] uppercase tracking-wider cursor-pointer"
                              >
                                Añadir Log
                              </button>
                            </div>
                          </form>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/*******************************************************
       * TAB VIEW 2: INTERACTIVE KANBAN SCRUM BOARD
       *******************************************************/
      subTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="projects-tab-kanban">
          
          {/* TO DO COLUMN */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-200 shrink-0">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <ListTodo size={12} className="text-gray-400" /> Backlog / Por Hacer
              </span>
              <span className="bg-slate-205 text-slate-700 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md">
                {tasks.filter(t => t.status === 'todo').length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pb-4 scrollbar-thin">
              {tasks.filter(t => t.status === 'todo').map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-lg border border-gray-150 shadow-2xs space-y-2 text-[11px] group relative">
                  <h5 className="font-bold text-slate-800 leading-tight">{task.name}</h5>
                  <p className="text-gray-450 line-clamp-2 leading-relaxed">{task.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] pt-2 border-t border-gray-100 text-gray-500">
                    <span className="font-semibold flex items-center gap-0.5"><User size={10} /> {task.assignee}</span>
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'doing')}
                      className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Dev →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DOING COLUMN */}
          <div className="bg-indigo-50/20 border border-indigo-150 rounded-xl p-3.5 flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-indigo-150 shrink-0">
              <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} className="text-indigo-600 animate-spin-slow" /> En Desarrollo
              </span>
              <span className="bg-indigo-100 text-indigo-805 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md">
                {tasks.filter(t => t.status === 'doing').length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pb-4 scrollbar-thin">
              {tasks.filter(t => t.status === 'doing').map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-lg border border-indigo-100 shadow-2xs space-y-2 text-[11px]">
                  <h5 className="font-bold text-indigo-900 leading-tight">{task.name}</h5>
                  <p className="text-gray-450 line-clamp-2 leading-relaxed">{task.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] pt-2 border-t border-gray-100 text-gray-600">
                    <span className="font-bold flex items-center gap-0.5"><User size={10} /> {task.assignee}</span>
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'review')}
                      className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Rev. QA →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REVIEW COLUMN */}
          <div className="bg-amber-50/20 border border-amber-150 rounded-xl p-3.5 flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-amber-150 shrink-0">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1">
                <AlertCircle size={12} className="text-amber-500 animate-pulse" /> Control Calidad
              </span>
              <span className="bg-amber-100 text-amber-805 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md">
                {tasks.filter(t => t.status === 'review').length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pb-4 scrollbar-thin">
              {tasks.filter(t => t.status === 'review').map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-lg border border-amber-100 shadow-2xs space-y-2 text-[11px]">
                  <h5 className="font-bold text-amber-900 leading-tight">{task.name}</h5>
                  <p className="text-gray-450 line-clamp-2 leading-relaxed">{task.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] pt-2 border-t border-gray-100 text-gray-650">
                    <span className="font-bold flex items-center gap-0.5"><User size={10} /> {task.assignee}</span>
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'done')}
                      className="bg-emerald-55 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Listo ✔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div className="bg-emerald-55/10 bg-emerald-50/10 border border-emerald-150 rounded-xl p-3.5 flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-emerald-150 shrink-0">
              <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" /> Entrega Completada
              </span>
              <span className="bg-emerald-100 text-emerald-805 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md">
                {tasks.filter(t => t.status === 'done').length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pb-4 scrollbar-thin">
              {tasks.filter(t => t.status === 'done').map(task => (
                <div key={task.id} className="bg-white p-3.5 rounded-lg border border-emerald-105 shadow-2xs space-y-2 text-[11px] opacity-75">
                  <h5 className="font-bold text-emerald-850 line-through leading-tight">{task.name}</h5>
                  <p className="text-gray-400 line-clamp-2 leading-relaxed">{task.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] pt-2 border-t border-gray-100 text-gray-400">
                    <span className="font-medium flex items-center gap-0.5"><User size={10} /> {task.assignee}</span>
                    <span className="text-emerald-700 font-extrabold font-mono text-[8.5px] bg-emerald-50 px-1 border border-emerald-150 rounded uppercase">
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/*******************************************************
       * TAB VIEW 3: GANTT TIMELINE CHART
       *******************************************************/
      subTab === 'gantt' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5" id="projects-tab-gantt">
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight font-display">Cronograma de Ejecución Gantt</h4>
            <p className="text-xs text-gray-500">Visualice la duración aproximada y la superposición de tareas en el tiempo real.</p>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Sin cronograma disponible.</div>
            ) : (
              <div className="divide-y divide-gray-150 text-xs">
                
                {/* Gantt Header representation */}
                <div className="grid grid-cols-12 bg-slate-100 h-10 border-b border-gray-200 items-center font-bold text-gray-400 text-[10px] uppercase tracking-wider text-center shrink-0">
                  <div className="col-span-4 pl-4 text-left border-r border-gray-200">Tarea o Hito</div>
                  <div className="col-span-2 border-r border-gray-200">Duración (Días)</div>
                  <div className="col-span-6">Visualización de Calendario de Trabajo (Eje Temporal)</div>
                </div>

                {/* Gantt Bars mapping */}
                {tasks.map((task) => {
                  // Fake scaling percentage for aesthetic rendering
                  const rawFactor = Math.min((task.durationDays / 20) * 100, 100) || 12;
                  const offsetMargin = (task.id.charCodeAt(task.id.length - 1) % 4) * 10; // offset pseudo-random for visualization
                  
                  return (
                    <div key={task.id} className="grid grid-cols-12 items-center min-h-[50px] hover:bg-slate-50/50">
                      
                      {/* Left descriptive col */}
                      <div className="col-span-4 pl-4 border-r border-gray-250 py-2.5">
                        <p className="font-bold text-slate-800 line-clamp-1">{task.name}</p>
                        <p className="text-[9.5px] text-gray-400 font-medium">Asignado: <span className="font-bold text-indigo-700">{task.assignee}</span></p>
                      </div>

                      {/* Middle days col */}
                      <div className="col-span-2 text-center border-r border-gray-250 py-2.5 font-bold font-mono text-slate-700">
                        {task.durationDays} días
                      </div>

                      {/* Right SVG visual bar container */}
                      <div className="col-span-6 px-4 py-2.5">
                        <div className="w-full bg-slate-100 h-6 rounded-lg relative overflow-hidden border border-gray-150">
                          <div 
                            className={`h-full absolute rounded-md flex items-center px-2 text-[8px] font-black shadow-xs font-mono select-none text-white ${
                              task.status === 'done' ? 'bg-emerald-600' :
                              task.status === 'doing' ? 'bg-indigo-600 animate-pulse-slow' :
                              task.status === 'review' ? 'bg-amber-500' : 'bg-gray-400'
                            }`}
                            style={{ 
                              left: `${offsetMargin}%`, 
                              width: `${Math.max(rawFactor, 18)}%` 
                            }}
                          >
                            <span className="truncate">{task.startDate} / {task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left border border-gray-150">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase font-display tracking-wider">Aperturar Nuevo Proyecto</h3>
                <p className="text-[10px] text-gray-400 mt-1">Sincronice sus plazos y clientes corporativos.</p>
              </div>
              <button onClick={() => setShowAddProjectModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Nombre Comercial del Proyecto:</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  placeholder="Ej. Campaña Marketing Digital 2026 / App Web"
                  className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg outline-none text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Seleccionar Cliente Corp:</label>
                <select
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Tomar de Contactos Alegra --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="intern">★ Interno (Sin Cliente Externo) ★</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Fecha de Lanzamiento:</label>
                  <input
                    type="date"
                    required
                    value={projStart}
                    onChange={e => setProjStart(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg font-mono outline-none"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Fecha de Entrega Final:</label>
                  <input
                    type="date"
                    required
                    value={projDue}
                    onChange={e => setProjDue(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-250 py-2 px-3 rounded-lg font-mono outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Descripción del Sprint o Entregas:</label>
                <textarea
                  value={projDesc}
                  onChange={e => setProjDesc(e.target.value)}
                  rows={3}
                  placeholder="Escriba los objetivos principales de este hito..."
                  className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg outline-none font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-black py-2.5 rounded-xl cursor-pointer text-xs uppercase"
                >
                  Crear Proyecto
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="bg-white hover:bg-gray-100 text-gray-500 border border-gray-205 py-2.5 px-4 rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left border border-gray-150">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase font-display tracking-wider">Asignar Tarea Sprint</h3>
                <p className="text-[10px] text-gray-400 mt-1">Formateará Gantt y el tablero Scrum.</p>
              </div>
              <button onClick={() => setShowAddTaskModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Vincular a Proyecto Registrado:</label>
                <select
                  required
                  value={taskProjectId}
                  onChange={e => setTaskProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg outline-none font-bold"
                >
                  <option value="" disabled>-- Ninguno (Registrar Proyecto Primero) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Nombre de Tarea o Requisito:</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  placeholder="Ej. Validar comprobante fiscal"
                  className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg outline-none text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Fecha de Inicio:</label>
                  <input
                    type="date"
                    required
                    value={taskStart}
                    onChange={e => setTaskStart(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg font-mono outline-none"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Fecha de Fin:</label>
                  <input
                    type="date"
                    required
                    value={taskDue}
                    onChange={e => setTaskDue(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg font-mono outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Programador / Diseñador Asignado:</label>
                <input
                  type="text"
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  placeholder="Ej. Carlos Mateo / Laura Gómez"
                  className="w-full bg-slate-50 border border-gray-205 py-2 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Descripción del Ticket:</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={2.5}
                  placeholder="Especificaciones técnicas necesarias..."
                  className="w-full bg-slate-50 border border-gray-250 py-2 px-3 rounded-lg outline-none font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2 text-xs">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-black py-2.5 rounded-xl cursor-pointer uppercase"
                >
                  Asignar Tarea
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="bg-white hover:bg-gray-100 text-gray-500 border border-gray-205 py-2.5 px-4 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

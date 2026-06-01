/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  Search, 
  Phone, 
  FileText, 
  Check, 
  AlertCircle, 
  UserCheck,
  X 
} from 'lucide-react';
import { AppointmentTurn, Client } from '../types';

interface AppointmentsModuleProps {
  appointments: AppointmentTurn[];
  onAddAppointment: (apt: AppointmentTurn) => void;
  onUpdateAppointmentStatus: (id: string, status: AppointmentTurn['status']) => void;
  onDeleteAppointment: (id: string) => void;
  clients: Client[];
}

export default function AppointmentsModule({
  appointments,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  clients
}: AppointmentsModuleProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceRequested, setServiceRequested] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Queue counts
  const totalInQueue = appointments.filter(a => a.status === 'espera').length;
  const beingAttended = appointments.filter(a => a.status === 'atendiendo').length;
  const completedToday = appointments.filter(a => a.status === 'completado').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !serviceRequested) {
      alert('Por favor ingrese el nombre y el servicio requerido.');
      return;
    }

    const typePrefix = isScheduled ? 'C' : 'T';
    const totalCount = appointments.length + 1;
    const ticketNumber = `${typePrefix}-${totalCount.toString().padStart(2, '0')}`;

    const newApt: AppointmentTurn = {
      id: `apt-${Date.now()}`,
      ticketNumber,
      customerName,
      customerPhone: customerPhone || undefined,
      serviceRequested,
      assignedStaffName: assignedStaff || undefined,
      scheduledTime: isScheduled ? scheduledTime : undefined,
      status: 'espera',
      notes: notes || undefined,
      createdAt: new Date().toISOString()
    };

    onAddAppointment(newApt);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setServiceRequested('');
    setScheduledTime('');
    setAssignedStaff('');
    setIsScheduled(false);
    setNotes('');
    setShowAddModal(false);
  };

  const handleClientSelect = (clientId: string) => {
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone || '');
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.serviceRequested.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left" id="appointments-module-wrapper">
      
      {/* Dynamic Queue KPI counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">En Cola de Espera</span>
            <span className="text-2xl font-black text-slate-800" id="counter-waiting">{totalInQueue}</span>
            <span className="text-[10px] text-gray-500 block">Clientes esperando</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Siendo Atendidos</span>
            <span className="text-2xl font-black text-slate-800" id="counter-serving">{beingAttended}</span>
            <span className="text-[10px] text-gray-505 block">En cubículo / estación</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Completados Hoy</span>
            <span className="text-2xl font-black text-slate-800" id="counter-completed">{completedToday}</span>
            <span className="text-[10px] text-gray-500 block">Atenciones finalizadas</span>
          </div>
        </div>
      </div>

      {/* Control panel and table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden pb-4">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800 font-display">Pantalla Interactiva de Citas y Turnos</h3>
            <p className="text-xs text-gray-500">Gestione la llegada de comensales, pacientes o clientes presenciales.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md uppercase tracking-wider"
            id="btn-open-turn-modal"
          >
            <UserPlus size={15} /> Asignar Nuevo Turno / Cita
          </button>
        </div>

        {/* Search header bar */}
        <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por ticket, nombre de cliente o especialidad del servicio..."
            className="w-full text-xs font-medium text-gray-700 bg-transparent outline-none"
          />
        </div>

        {/* Table representation */}
        {filteredAppointments.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Calendar size={36} className="text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-bold">No se encontraron turnos activos en el filtro actual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-5">N° Ticket</th>
                  <th className="p-3.5">Cliente / Paciente</th>
                  <th className="p-3.5">Servicio Requerido</th>
                  <th className="p-3.5">Personal Asignado</th>
                  <th className="p-3.5">Tipo / Hora Sugerida</th>
                  <th className="p-3.5">Estado actual</th>
                  <th className="p-3.5 pr-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 font-medium">
                {filteredAppointments.map((apt) => {
                  const delayTimeStatus = apt.status === 'espera' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                         apt.status === 'atendiendo' ? 'text-indigo-600 bg-indigo-50 border-indigo-200' :
                                         apt.status === 'completado' ? 'text-green-600 bg-green-50 border-green-200' :
                                         'text-gray-500 bg-gray-50 border-gray-200';
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50" id={`appointment-row-${apt.id}`}>
                      <td className="p-3.5 pl-5">
                        <span className="font-black font-mono text-sm px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 border border-slate-200">
                          {apt.ticketNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800">{apt.customerName}</p>
                        {apt.customerPhone && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                            <Phone size={9} /> {apt.customerPhone}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">
                        {apt.serviceRequested}
                        {apt.notes && (
                          <p className="text-[10px] text-gray-450 font-medium italic block line-clamp-1 mt-0.5">
                            ★ Observación: {apt.notes}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-500 font-medium">
                        {apt.assignedStaffName || <span className="text-gray-300 italic">No asignado</span>}
                      </td>
                      <td className="p-3.5">
                        {apt.scheduledTime ? (
                          <div className="space-y-0.5">
                            <span className="bg-indigo-50 text-indigo-700 font-bold text-[9px] px-1.5 py-0.5 rounded border border-indigo-100">
                              Cita Agendada
                            </span>
                            <p className="text-[10px] font-bold text-gray-600 font-mono mt-1">{apt.scheduledTime}</p>
                          </div>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                            Walk-In (En Cola)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-extrabold uppercase shrink-0 ${delayTimeStatus}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex gap-1 justify-end">
                          {apt.status === 'espera' && (
                            <button
                              onClick={() => onUpdateAppointmentStatus(apt.id, 'atendiendo')}
                              className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold p-1 rounded transition-colors cursor-pointer"
                              title="Llamar y Atender"
                            >
                              <CheckCircle size={13} />
                            </button>
                          )}
                          {apt.status === 'atendiendo' && (
                            <button
                              onClick={() => {
                                onUpdateAppointmentStatus(apt.id, 'completado');
                                alert(`Atención completada con éxito para el Ticket ${apt.ticketNumber}`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded transition-colors cursor-pointer"
                              title="Terminar cita"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="bg-white hover:bg-red-50 text-red-500 border border-gray-200 hover:border-red-200 p-1 rounded transition-colors cursor-pointer"
                            title="Descartar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE NEW APPOINTMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left border border-gray-150">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase font-display tracking-wider">Asignar Turno / Cita de Servicio</h3>
                <p className="text-[10px] text-gray-400 mt-1">Sincronice el cliente presencial o asigne una cita planificada.</p>
              </div>
              <button onClick={resetForm} className="text-gray-400 hover:text-white cursor-pointer select-none">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              
              {/* Client fast list */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Seleccionar Contacto (ERP):</label>
                <select
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-xs font-semibold rounded-lg p-2 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Tomar de Contactos Alegra --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone || 'Sin tel'})</option>
                  ))}
                  <option value="custom">★ Escribir cliente no registrado ★</option>
                </select>
              </div>

              {/* Patient/Client Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Nombre del Cliente / Paciente:</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-50 border border-gray-205 text-xs font-semibold rounded-lg p-2 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Teléfono de Contacto:</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="809-555-5555"
                    className="w-full bg-slate-50 border border-gray-205 text-xs font-semibold font-mono rounded-lg p-2 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Personal Profesional:</label>
                  <input
                    type="text"
                    value={assignedStaff}
                    onChange={e => setAssignedStaff(e.target.value)}
                    placeholder="Ej. Dra. Peralta / Carlos"
                    className="w-full bg-slate-50 border border-gray-205 text-xs font-semibold rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              {/* Service requested selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Servicio a Realizar:</label>
                <input
                  type="text"
                  required
                  value={serviceRequested}
                  onChange={e => setServiceRequested(e.target.value)}
                  placeholder="Ej. Ortodoncia, Corte de cabello, Lavado, Soporte Laptop"
                  className="w-full bg-slate-50 border border-gray-205 text-xs font-bold rounded-lg p-2 outline-none"
                />
              </div>

              {/* Toggle Appointment vs Walkin */}
              <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between border border-gray-150">
                <div className="text-[10.5px]">
                  <p className="font-extrabold text-slate-700">¿Es una Cita Programada?</p>
                  <p className="text-[9px] text-gray-400">Si desactiva, ingresará a cola de espera presencial de hoy.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 outline-none cursor-pointer"
                />
              </div>

              {/* If scheduled, request date-time */}
              {isScheduled && (
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Hora Programada:</label>
                  <input
                    type="time"
                    required={isScheduled}
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-205 text-xs font-bold font-mono rounded-lg p-2 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Observaciones Iniciales (Síntomas/Preferencias):</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles útiles para el profesional..."
                  className="w-full bg-slate-50 border border-gray-205 text-xs font-medium rounded-lg p-2 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-black py-2.5 rounded-xl cursor-pointer shadow-sm text-xs uppercase"
                >
                  Registrar Turno
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white hover:bg-gray-100 text-gray-550 border border-gray-250 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer"
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

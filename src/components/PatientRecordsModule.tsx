/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Stethoscope, 
  PlusCircle, 
  Search, 
  Heart, 
  Scale, 
  Thermometer, 
  FileText, 
  Calendar, 
  Printer, 
  UserPlus, 
  Clipboard, 
  User, 
  Trash2,
  X,
  Plus,
  Check,
  TrendingUp,
  History,
  ListChecks,
  AlertTriangle,
  FileCode,
  CheckCircle,
  MessageSquare,
  Clock
} from 'lucide-react';
import { PatientRecord, Client } from '../types';

interface PatientRecordsModuleProps {
  records: PatientRecord[];
  onAddRecord: (record: PatientRecord) => void;
  onUpdateRecord: (id: string, record: PatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  clients: Client[];
}

export default function PatientRecordsModule({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  clients
}: PatientRecordsModuleProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [weightLb, setWeightLb] = useState<number>(150);
  const [temperatureC, setTemperatureC] = useState<number>(36.5);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescription, setPrescription] = useState('');
  const [treatingDoctor, setTreatingDoctor] = useState('Dr. Ramos Almonte');
  const [nextFollowUp, setNextFollowUp] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecordSheet, setActiveRecordSheet] = useState<PatientRecord | null>(records[0] || null);

  // Lifecycle & Clinical Sub-tabs support states
  const [detailTab, setDetailTab] = useState<'consultation' | 'lifecycle'>('consultation');
  const [newStudyName, setNewStudyName] = useState('');
  const [newEvolutionDesc, setNewEvolutionDesc] = useState('');
  const [newEvolutionType, setNewEvolutionType] = useState<'cambio_sintoma' | 'laboratorio' | 'control_rutina' | 'nota_general'>('control_rutina');
  const [studyResultInput, setStudyResultInput] = useState<Record<string, string>>({});
  const [activeStudyEditId, setActiveStudyEditId] = useState<string | null>(null);

  const handleUpdateStatus = (newStatus: PatientRecord['status']) => {
    if (!activeRecordSheet) return;
    const updated = { ...activeRecordSheet, status: newStatus };
    onUpdateRecord(activeRecordSheet.id, updated);
    setActiveRecordSheet(updated);
  };

  const handleAddStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecordSheet || !newStudyName.trim()) return;
    
    const studyId = `std-${Date.now()}`;
    const newStudy = {
      id: studyId,
      name: newStudyName,
      status: 'pendiente' as const,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedStudies = [...(activeRecordSheet.studies || []), newStudy];
    const updated = { ...activeRecordSheet, studies: updatedStudies };
    
    onUpdateRecord(activeRecordSheet.id, updated);
    setActiveRecordSheet(updated);
    setNewStudyName('');
  };

  const handleDeliverStudy = (studyId: string, notes: string) => {
    if (!activeRecordSheet) return;
    
    const updatedStudies = (activeRecordSheet.studies || []).map(st => 
      st.id === studyId ? { ...st, status: 'entregado' as const, notes } : st
    );
    
    const deliveredStudy = (activeRecordSheet.studies || []).find(st => st.id === studyId);
    const studyName = deliveredStudy ? deliveredStudy.name : 'Estudio';
    
    const newEvolution = {
      id: `evo-auto-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'laboratorio' as const,
      description: `Paciente entregó resultados del estudio indicado: ${studyName}.`,
      details: notes
    };
    
    const updatedEvolutions = [...(activeRecordSheet.evolutions || []), newEvolution];
    const updated = { 
      ...activeRecordSheet, 
      studies: updatedStudies, 
      evolutions: updatedEvolutions,
      status: 'estudio_pendiente' as any // update status safely
    };
    
    onUpdateRecord(activeRecordSheet.id, updated);
    setActiveRecordSheet(updated);
    setActiveStudyEditId(null);
    
    setStudyResultInput(prev => {
      const copy = { ...prev };
      delete copy[studyId];
      return copy;
    });
  };

  const handleAddEvolutionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecordSheet || !newEvolutionDesc.trim()) return;
    
    const newEvo = {
      id: `evo-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: newEvolutionType,
      description: newEvolutionDesc,
    };
    
    const updatedEvolutions = [...(activeRecordSheet.evolutions || []), newEvo];
    
    let nextStatus = activeRecordSheet.status;
    if (newEvolutionType === 'cambio_sintoma') {
      nextStatus = 'observacion';
    }
    
    const updated = { 
      ...activeRecordSheet, 
      evolutions: updatedEvolutions,
      status: nextStatus
    };
    
    onUpdateRecord(activeRecordSheet.id, updated);
    setActiveRecordSheet(updated);
    setNewEvolutionDesc('');
    setNewEvolutionType('control_rutina');
  };

  const handlePatientSelect = (clientId: string) => {
    setSelectedPatientId(clientId);
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setSelectedPatientName(selected.name);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientName || !diagnosis || !symptoms) {
      alert('Por favor complete el paciente, síntomas y diagnóstico principal.');
      return;
    }

    const newRecord: PatientRecord = {
      id: `rec-${Date.now()}`,
      patientId: selectedPatientId || 'c-gen',
      patientName: selectedPatientName,
      date: new Date().toISOString().split('T')[0],
      symptoms,
      diagnosis,
      vitalSigns: {
        bloodPressure: bloodPressure || undefined,
        weightLb: weightLb ? Number(weightLb) : undefined,
        temperatureC: temperatureC ? Number(temperatureC) : undefined
      },
      treatmentPlan,
      prescription,
      treatingDoctor,
      nextFollowUp: nextFollowUp || undefined
    };

    onAddRecord(newRecord);
    setActiveRecordSheet(newRecord);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPatientId('');
    setSelectedPatientName('');
    setSymptoms('');
    setDiagnosis('');
    setBloodPressure('120/80');
    setWeightLb(150);
    setTemperatureC(36.5);
    setTreatmentPlan('');
    setPrescription('');
    setNextFollowUp('');
    setShowAddModal(false);
  };

  const filteredRecords = records.filter(rec => 
    rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.treatingDoctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintPrescription = (rec: PatientRecord) => {
    const rxWindow = window.open('', '_blank');
    if (!rxWindow) {
      alert('Por favor permita las ventanas emergentes en su navegador.');
      return;
    }
    
    rxWindow.document.write(`
      <html>
        <head>
          <title>Receta Médica - ${rec.patientName}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .header p { margin: 4px 0 0 0; font-size: 11px; color: #666; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 15px; margin-bottom: 30px; }
            .recipe-symbol { font-size: 36px; font-weight: bold; margin-bottom: 15px; }
            .content { font-size: 15px; min-height: 250px; white-space: pre-line; margin-bottom: 40px; }
            .footer { border-top: 1px solid #ddd; padding-top: 15px; font-size: 11px; text-align: center; color: #777; margin-top: auto; }
            .signature { margin-top: 60px; text-align: right; font-size: 12px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rx SINOPSIS CLÍNICA</h1>
            <p>CONDOMINIO MÉDICO DEL CARIBE, SANTO DOMINGO, RD • TEL: 809-541-2621</p>
          </div>
          <div class="details">
            <div>
              <strong>PACIENTE:</strong> ${rec.patientName}<br>
              <strong>FECHA:</strong> ${rec.date}<br>
              <strong>PRESIÓN:</strong> ${rec.vitalSigns.bloodPressure || 'Normal'}<br>
              <strong>PESO:</strong> ${rec.vitalSigns.weightLb || 'N/A'} Lb
            </div>
            <div style="text-align: right;">
              <strong>MÉDICO:</strong> ${rec.treatingDoctor}<br>
              <strong>DIAGNÓSTICO:</strong> ${rec.diagnosis}<br>
              <strong>EXPEDIENTE:</strong> ${rec.id}
            </div>
          </div>
          <div class="recipe-symbol">Rp.</div>
          <div class="content">${rec.prescription || 'Indicaciones generales presentadas de forma oral.'}</div>
          
          <div class="signature">
            <p>____________________________________</p>
            <p>Firma del Profesional Asistente</p>
            <p>${rec.treatingDoctor}</p>
          </div>

          <div class="footer">
            <p>Documento legal de prescripción emitido por el sistema ERP homologado de Alegra.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    rxWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left" id="patient-records-module">
      
      {/* 1. SIDEBAR PATIENTS LIST LIMIT */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[650px]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-gray-400 font-display tracking-wider">Historial Clínico</h4>
            <span className="text-[10px] text-gray-500">Expedientes registrados</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 bg-indigo-50 border border-indigo-205 hover:bg-indigo-100 rounded-lg text-indigo-700 cursor-pointer transition-all"
            id="btn-open-patient-modal"
            title="Crear Record Clínico"
          >
            <UserPlus size={16} />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border-b border-gray-100 flex items-center gap-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por paciente o diagnóstico..."
            className="w-full text-xs bg-transparent outline-none font-medium text-gray-700"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-thin">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Stethoscope size={24} className="text-gray-300 mx-auto" />
              <p className="text-[11px] text-gray-400 font-bold">No hay fichas médicas.</p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isActive = activeRecordSheet?.id === rec.id;
              return (
                <button
                  key={rec.id}
                  onClick={() => setActiveRecordSheet(rec)}
                  className={`w-full p-4 text-left transition-all flex items-start gap-3 border-l-4 cursor-pointer ${
                    isActive 
                      ? 'border-indigo-600 bg-indigo-50/30' 
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold font-display shrink-0 text-xs">
                    {rec.patientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{rec.patientName}</p>
                    <p className="text-[10px] text-indigo-700 font-bold truncate mt-0.5">{rec.diagnosis}</p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-405 font-medium">
                      <span>{rec.date}</span>
                      <span>•</span>
                      <span>{rec.treatingDoctor}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. RECORDFILE SHEET VIEW PANEL (2/3 of space) */}
      <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm h-[650px] flex flex-col overflow-hidden">
        {activeRecordSheet ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden" id="active-record-sheet">
            {/* Header detail */}
            <div className="p-5 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <Stethoscope size={22} className="animate-heartbeat" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide">
                    Expediente Clínico Médico
                  </h3>
                  <p className="text-[10px] text-gray-550 font-medium">
                    Identificador de Ficha: <span className="font-mono font-bold text-slate-700">{activeRecordSheet.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handlePrintPrescription(activeRecordSheet)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  id="btn-print-rx"
                >
                  <Printer size={13} /> Imprimir Receta Rx
                </button>
                <button
                  onClick={() => {
                    onDeleteRecord(activeRecordSheet.id);
                    setActiveRecordSheet(records.find(r => r.id !== activeRecordSheet.id) || null);
                  }}
                  className="bg-white text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 font-semibold p-1.5 rounded-lg text-xs cursor-pointer"
                  title="Eliminar Expediente"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Patient and vital stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50 p-4 border border-gray-150 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Ficha de Identidad Paciente:</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800">{activeRecordSheet.patientName}</p>
                    <p className="text-[10.5px] font-medium text-gray-500">Fecha de Registro: <span className="font-bold text-slate-700">{activeRecordSheet.date}</span></p>
                    <p className="text-[10.5px] font-medium text-gray-550">Atendido por: <span className="font-bold text-indigo-700">{activeRecordSheet.treatingDoctor}</span></p>
                  </div>
                </div>

                {/* Vitals metrics (High-density tags resembling clinical gear display) */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-950 grid grid-cols-3 gap-2">
                  <div className="text-center space-y-1">
                    <Heart size={14} className="text-red-500 mx-auto animate-heartbeat" />
                    <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Presion Art.</span>
                    <p className="text-xs font-black font-mono tracking-tight text-white">{activeRecordSheet.vitalSigns.bloodPressure || '120/80'}</p>
                  </div>

                  <div className="text-center space-y-1 border-x border-slate-800">
                    <Scale size={14} className="text-amber-500 mx-auto" />
                    <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Peso Corp.</span>
                    <p className="text-xs font-black font-mono text-white">{activeRecordSheet.vitalSigns.weightLb || '150'} Lb</p>
                  </div>

                  <div className="text-center space-y-1">
                    <Thermometer size={14} className="text-emerald-500 mx-auto" />
                    <span className="text-[8px] text-slate-400 font-extrabold block uppercase">Temp Oral</span>
                    <p className="text-xs font-black font-mono text-white">{activeRecordSheet.vitalSigns.temperatureC || '36.5'} °C</p>
                  </div>
                </div>
              </div>

              {/* High-density Clinical Navigation Tabs */}
              <div className="flex border-b border-gray-150 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailTab('consultation')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    detailTab === 'consultation'
                      ? 'border-indigo-600 text-indigo-700 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Ficha de Consulta & Rx
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('lifecycle')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    detailTab === 'lifecycle'
                      ? 'border-indigo-600 text-indigo-700 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <History size={13} />
                  Ciclo de Vida & Estudios Médicos
                  {(activeRecordSheet.studies || []).filter(s => s.status === 'pendiente').length > 0 && (
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[9px] font-black animate-pulse">
                      {(activeRecordSheet.studies || []).filter(s => s.status === 'pendiente').length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB CONTENT: CONSULTATION DETAILS */}
              {detailTab === 'consultation' && (
                <div className="space-y-4">
                  <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                    <div className="bg-gray-50 px-4 py-2 font-black text-[10px] text-gray-500 border-b border-gray-150 uppercase tracking-wide">
                      Sintomatología Recibida / Motivo de Consulta
                    </div>
                    <div className="p-4 text-slate-750 font-medium leading-relaxed bg-white">
                      {activeRecordSheet.symptoms}
                    </div>
                  </div>

                  <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                    <div className="bg-indigo-50/50 px-4 py-2 font-black text-[10px] text-indigo-900 border-b border-gray-150 uppercase tracking-wide">
                      Diagnóstico Clínico Principal (Dx)
                    </div>
                    <div className="p-4 text-indigo-950 font-bold leading-relaxed bg-white/70">
                      {activeRecordSheet.diagnosis}
                    </div>
                  </div>

                  <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                    <div className="bg-gray-50 px-4 py-2 font-black text-[10px] text-gray-500 border-b border-gray-150 uppercase tracking-wide">
                      Plan / Procedimientos de Tratamiento
                    </div>
                    <div className="p-4 text-slate-750 font-medium leading-relaxed bg-white">
                      {activeRecordSheet.treatmentPlan || 'Seguimiento general programado.'}
                    </div>
                  </div>

                  {/* Prescription Box rendering */}
                  <div className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-900 tracking-wider uppercase">
                      <span>Receta Médica Farmacéutica (Rx)</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px]">Sujeto a Cobertura ARS exento ITBIS</span>
                    </div>
                    <p className="font-mono text-slate-800 leading-relaxed font-bold bg-white p-3.5 rounded-lg border border-emerald-100 whitespace-pre-line text-xs">
                      {activeRecordSheet.prescription || 'Indicaciones generales no farmacológicas dadas de forma verbal.'}
                    </p>
                  </div>

                  {activeRecordSheet.nextFollowUp && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-xs flex items-center justify-between text-amber-900 font-bold font-bold">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> Fecha Recomendada de Próxima Consulta:
                      </span>
                      <span className="font-mono uppercase">{activeRecordSheet.nextFollowUp}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: LIFECYCLE, STUDIES & EVOLUTIONS */}
              {detailTab === 'lifecycle' && (
                <div className="space-y-6">
                  
                  {/* 1. STATE / STATUS SELECTOR */}
                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-650 font-black uppercase tracking-wider block font-sans">Estado de Salud y Ciclo Clínico del Paciente:</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                        activeRecordSheet.status === 'urgente' ? 'bg-red-100 text-red-800 animate-pulse border border-red-200' :
                        activeRecordSheet.status === 'observacion' ? 'bg-amber-100 text-amber-800' :
                        activeRecordSheet.status === 'estudio_pendiente' ? 'bg-indigo-100 text-indigo-805' :
                        activeRecordSheet.status === 'alta_medica' ? 'bg-emerald-100 text-emerald-805' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {activeRecordSheet.status || 'activo'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[9.5px]">
                      {[
                        { key: 'activo', label: 'Activo / Control rutinario', bg: 'hover:bg-slate-100' },
                        { key: 'observacion', label: 'Bajo Observación', bg: 'hover:bg-amber-50' },
                        { key: 'estudio_pendiente', label: 'Estudio Pendiente', bg: 'hover:bg-indigo-50' },
                        { key: 'urgente', label: '¡Urgente / Alerta!', bg: 'hover:bg-red-50' },
                        { key: 'alta_medica', label: 'Alta Clínica ✔', bg: 'hover:bg-emerald-50' }
                      ].map(st => {
                        const isSelected = (activeRecordSheet.status || 'activo') === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => handleUpdateStatus(st.key as any)}
                            className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                : `bg-white text-gray-650 border-gray-200 ${st.bg}`
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. CLINICAL INDICATION STUDIES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Indicated studies list & register form */}
                    <div className="border border-gray-150 rounded-xl p-4 bg-white space-y-4 text-xs font-semibold">
                      <div className="border-b border-gray-100 pb-2">
                        <span className="text-[10px] text-indigo-900 font-extrabold uppercase tracking-wider block font-sans">Estudios / Laboratorios Indicados</span>
                        <p className="text-[9px] text-gray-400 mt-0.5">Gestione resultados pendientes entregados por el paciente.</p>
                      </div>

                      {/* Add new indicated study */}
                      <form onSubmit={handleAddStudy} className="flex gap-2 text-xs">
                        <input
                          type="text"
                          value={newStudyName}
                          onChange={e => setNewStudyName(e.target.value)}
                          placeholder="Ej. Hemograma Completo, Rayos X..."
                          className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 font-semibold text-slate-800 outline-none placeholder-gray-400"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-755 hover:bg-slate-800 text-white font-black px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-0.5 cursor-pointer uppercase text-[10px]"
                        >
                          <Plus size={14} /> Indicar
                        </button>
                      </form>

                      {/* Indicated studies rendering list */}
                      <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin pr-1 text-xs">
                        {(!activeRecordSheet.studies || activeRecordSheet.studies.length === 0) ? (
                          <p className="text-[10px] text-gray-400 italic text-center py-6 font-medium">No se han indicado laboratorios aún para este paciente.</p>
                        ) : (
                          activeRecordSheet.studies.map(study => (
                            <div key={study.id} className="p-3 border border-gray-150 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-extrabold text-slate-800 leading-tight">{study.name}</p>
                                  <span className="text-[9px] text-gray-400">{study.date}</span>
                                </div>
                                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  study.status === 'entregado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200'
                                }`}>
                                  {study.status === 'entregado' ? 'Entregado' : 'Pendiente'}
                                </span>
                              </div>

                              {study.status === 'pendiente' && (
                                <div className="pt-1.5 border-t border-dashed border-gray-205 font-medium">
                                  {activeStudyEditId === study.id ? (
                                    <div className="space-y-1.5 text-left">
                                      <textarea
                                        value={studyResultInput[study.id] || ''}
                                        onChange={e => setStudyResultInput({ ...studyResultInput, [study.id]: e.target.value })}
                                        placeholder="Escriba los resultados, observaciones clínicas o conclusiones..."
                                        rows={2}
                                        className="w-full bg-slate-50 text-slate-800 border border-gray-200 text-[10.5px] rounded p-1.5 outline-none font-bold"
                                      />
                                      <div className="flex gap-1 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => handleDeliverStudy(study.id, studyResultInput[study.id] || '')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2 py-1 rounded text-[10px] cursor-pointer"
                                        >
                                          Confirmar Entrega
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setActiveStudyEditId(null)}
                                          className="bg-white border border-gray-200 text-gray-500 font-semibold px-2 py-1 rounded text-[10px] cursor-pointer"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setActiveStudyEditId(study.id)}
                                      className="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-extrabold px-2 py-1 rounded text-[9.5px] cursor-pointer block text-center w-full"
                                    >
                                      ✓ Registrar Recepción de Estudio
                                    </button>
                                  )}
                                </div>
                              )}

                              {study.notes && (
                                <div className="bg-slate-50 p-2 rounded-lg text-[10px] border border-gray-150 text-slate-700">
                                  <span className="font-extrabold block text-slate-700 uppercase tracking-wide text-[8px] mb-0.5">Notas de Resultados:</span>
                                  <p className="line-clamp-3 leading-relaxed font-bold">{study.notes}</p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Evolutions (Evolución diaria, notas generales, cambio de síntomas) */}
                    <div className="border border-gray-150 rounded-xl p-4 bg-white space-y-4 font-semibold text-xs text-left">
                      <div className="border-b border-gray-100 pb-2">
                        <span className="text-[10px] text-indigo-900 font-extrabold uppercase tracking-wider block">Bitácora de Evolución Clínica</span>
                        <p className="text-[9px] text-gray-400 mt-0.5">Notas de seguimiento e historial de cambios.</p>
                      </div>

                      {/* Add evolution note form */}
                      <form onSubmit={handleAddEvolutionNote} className="space-y-2 text-xs">
                        <div className="flex gap-2">
                          <select
                            value={newEvolutionType}
                            onChange={e => setNewEvolutionType(e.target.value as any)}
                            className="bg-slate-50 border border-gray-200 rounded-lg p-1 text-[10px] font-bold outline-none flex-1"
                          >
                            <option value="control_rutina">Visita / Control </option>
                            <option value="cambio_sintoma">Cambio Síntomas</option>
                            <option value="laboratorio">Comentario Lab</option>
                            <option value="nota_general">Nota de Avance</option>
                          </select>

                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1 rounded-lg text-[10.5px] flex items-center gap-0.5 cursor-pointer shrink-0"
                          >
                            <Plus size={12} /> Registrar Seguimiento
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          required
                          value={newEvolutionDesc}
                          onChange={e => setNewEvolutionDesc(e.target.value)}
                          placeholder="Describa el cambio de salud, mejoría o nota general..."
                          className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none placeholder-gray-400 font-medium"
                        />
                      </form>

                      {/* Timeline of developments */}
                      <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin pr-1 text-[10.5px]">
                        {(!activeRecordSheet.evolutions || activeRecordSheet.evolutions.length === 0) ? (
                          <div className="text-center py-6 text-gray-400 italic">
                            No se han registrado hitos evolutivos para esta ficha clínica.
                          </div>
                        ) : (
                          <div className="border-l-2 border-indigo-100 pl-3.5 space-y-3 relative text-left">
                            {activeRecordSheet.evolutions.map((evo, i) => (
                              <div key={evo.id || i} className="relative space-y-1">
                                {/* Bullet indicator on the line */}
                                <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  evo.type === 'cambio_sintoma' ? 'bg-red-500' :
                                  evo.type === 'laboratorio' ? 'bg-emerald-500' :
                                  'bg-indigo-500'
                                }`} />
                                <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold">
                                  <span>{evo.date}</span>
                                  <span className={`uppercase text-[8px] font-black ${
                                    evo.type === 'cambio_sintoma' ? 'text-red-600' :
                                    evo.type === 'laboratorio' ? 'text-emerald-700' :
                                    'text-indigo-650'
                                  }`}>
                                    {evo.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-800 text-[11px] leading-tight">
                                  {evo.description}
                                </p>
                                {evo.details && (
                                  <p className="text-[9.5px] text-gray-400 italic bg-slate-50 p-1.5 rounded border border-gray-150 leading-normal">
                                    {evo.details}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Clipboard size={44} className="text-gray-300 animate-pulse" />
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold">Sin ficha activa seleccionada.</p>
              <p className="text-[10px] text-gray-400 mt-1">Cree una consulta utilizando el botón plus de arriba.</p>
            </div>
          </div>
        )}
      </div>

      {/* FULL RECORD MODAL FOR CONSULTATION REGISTRATION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden text-left border border-gray-150 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase font-display tracking-wider">Aperturar Consulta y Ficha Médica</h3>
                <p className="text-[10px] text-gray-400 mt-1">Sincronice el record de salud del paciente en tiempo real.</p>
              </div>
              <button onClick={resetForm} className="text-gray-400 hover:text-white cursor-pointer select-none">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Select patient client */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Seleccionar Paciente (ERP):</label>
                <select
                  required
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-xs font-bold rounded-lg p-2.5 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Seleccionar de Contactos Alegra --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (RNC/Céd: {c.rnc || 'N/A'})</option>
                  ))}
                  <option value="custom">★ Registrar Paciente No Permanente ★</option>
                </select>
              </div>

              {/* Patient Name write in case of transient */}
              {!selectedPatientId && (
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Nombre del Paciente Transitorio:</label>
                  <input
                    type="text"
                    required
                    value={selectedPatientName}
                    onChange={e => setSelectedPatientName(e.target.value)}
                    placeholder="Escriba nombre y apellidos..."
                    className="w-full bg-slate-50 border border-gray-205 text-xs font-semibold rounded-lg p-2 outline-none"
                  />
                </div>
              )}

              {/* Vital signs setup */}
              <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl text-slate-100 space-y-3">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider font-display">Captura de Signos Vitales Básicos:</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 text-center">
                    <label className="text-[8px] text-slate-400 font-extrabold block">B.P. PRESION (mmHg):</label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={e => setBloodPressure(e.target.value)}
                      placeholder="120/80"
                      className="w-full bg-slate-800 border border-slate-700 text-center rounded p-1 text-xs font-bold font-mono text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 text-center font-mono">
                    <label className="text-[8px] text-slate-400 font-extrabold block">PESO (Lb):</label>
                    <input
                      type="number"
                      value={weightLb}
                      onChange={e => setWeightLb(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 text-center rounded p-1 text-xs font-bold text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 text-center font-mono">
                    <label className="text-[8px] text-slate-400 font-extrabold block">TEMP (°C):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatureC}
                      onChange={e => setTemperatureC(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 text-center rounded p-1 text-xs font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Symptoms input */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Sintomas Presentados / Razón de Visita:</label>
                <textarea
                  required
                  rows={2}
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="Ej. Paciente manifiesta inflamación, enrojecimiento y dolor agudo en encías..."
                  className="w-full bg-slate-50 border border-gray-205 text-xs font-medium rounded-lg p-2 outfit-none"
                />
              </div>

              {/* Diagnosis input */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase font-display block">DIAGNÓSTICO MÉDICO PRINCIPAL (Dx):</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="Ej. Gingivitis Crónica localizada asociada a higiene / Caries profunda."
                  className="w-full bg-indigo-50/40 border border-indigo-200 text-indigo-905 font-bold text-xs p-2.5 rounded-lg outline-none"
                />
              </div>

              {/* Treatment */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase">Plan de Tratamiento:</label>
                <textarea
                  rows={2}
                  value={treatmentPlan}
                  onChange={e => setTreatmentPlan(e.target.value)}
                  placeholder="Procedimiento a efectuar o planes quirúrgicos..."
                  className="w-full bg-slate-50 border border-gray-205 text-xs font-medium rounded-lg p-2 outline-none"
                />
              </div>

              {/* Prescription indicator */}
              <div className="space-y-1 bg-emerald-50/20 border border-emerald-100 p-3 rounded-xl">
                <label className="text-[10px] text-emerald-900 font-black uppercase tracking-wider block mb-1">Prescripción de Fármacos / Indicaciones (Rx):</label>
                <textarea
                  rows={3}
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  placeholder="Rp.&#10;Amoxicilina 500mg cápsulas - Tomar 1 cada 8 horas por 7 días.&#10;Paracetamol 1g tabletas - Tomar 1 cada 6 horas en caso de fiebre."
                  className="w-full bg-white border border-emerald-150 text-xs font-mono font-bold rounded-lg p-2.5 outline-none leading-relaxed text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Especialista / Médico Tratante:</label>
                  <input
                    type="text"
                    required
                    value={treatingDoctor}
                    onChange={e => setTreatingDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-205 text-xs font-bold rounded-lg p-2 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Próximo Chequeo (Follow-up):</label>
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={e => setNextFollowUp(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-205 font-mono text-xs font-bold rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-black py-2.5 rounded-xl cursor-pointer text-xs uppercase"
                >
                  Confirmar Consulta y Guardar
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white hover:bg-gray-100 text-gray-500 border border-gray-205 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer"
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

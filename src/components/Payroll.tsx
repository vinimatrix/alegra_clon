/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, UserPlus, FileSpreadsheet, Calculator, Edit, Trash2 } from 'lucide-react';
import { Employee, PayrollEntry } from '../types';
import Modal from './ui/Modal';

interface PayrollProps {
  employees: Employee[];
  payrolls: PayrollEntry[];
  onAddEmployee: (e: Employee) => void;
  onUpdateEmployee: (id: string, e: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onGeneratePayroll: (period: string) => void;
}

export default function Payroll({ employees, payrolls, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onGeneratePayroll }: PayrollProps) {
  const [activeTab, setActiveTab] = useState<'empleados' | 'nomina'>('empleados');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
    name: '',
    cedula: '',
    position: '',
    department: '',
    salary: 0,
    startDate: new Date().toISOString().split('T')[0],
    status: 'activo',
    email: '',
    phone: ''
  });

  const [payrollPeriod, setPayrollPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const handleEditEmployee = (emp: Employee) => {
    setEmployeeForm(emp);
    setEditingEmployeeId(emp.id);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = () => {
    if (editingEmployeeId) {
      onUpdateEmployee(editingEmployeeId, employeeForm as Employee);
    } else {
      const newEmp: Employee = {
        ...(employeeForm as Employee),
        id: `emp-${Date.now()}`
      };
      onAddEmployee(newEmp);
    }
    setIsEmployeeModalOpen(false);
    setEmployeeForm({ name: '', cedula: '', position: '', department: '', salary: 0, startDate: new Date().toISOString().split('T')[0], status: 'activo', email: '', phone: '' });
    setEditingEmployeeId(null);
  };

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const currentPeriodPayrolls = payrolls.filter(p => p.period === payrollPeriod);
  const totalGross = currentPeriodPayrolls.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNet = currentPeriodPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDeductions = currentPeriodPayrolls.reduce((sum, p) => sum + p.totalDeductions, 0);

  return (
    <div className="space-y-6 animate-fade-in" id="payroll-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 font-display flex items-center gap-2">
            <Users size={24} className="text-[var(--app-primary)]" />
            Recursos Humanos y Nómina
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona tus empleados, sueldos, y calcula la nómina con deducciones TSS (RD).
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('empleados')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'empleados' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Empleados
          </button>
          <button 
            onClick={() => setActiveTab('nomina')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'nomina' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Nómina
          </button>
        </div>
      </div>

      {activeTab === 'empleados' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEmployeeForm({ name: '', cedula: '', position: '', department: '', salary: 0, startDate: new Date().toISOString().split('T')[0], status: 'activo', email: '', phone: '' });
                setEditingEmployeeId(null);
                setIsEmployeeModalOpen(true);
              }}
              className="bg-[var(--app-primary)] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
            >
              <UserPlus size={16} /> Nuevo Empleado
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Empleado</th>
                    <th className="px-6 py-4 font-semibold">Cédula</th>
                    <th className="px-6 py-4 font-semibold">Posición/Dep.</th>
                    <th className="px-6 py-4 font-semibold">Sueldo Base</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{emp.name}</div>
                        <div className="text-xs text-gray-400">{emp.email || 'Sin correo'}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{emp.cedula}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700">{emp.position}</div>
                        <div className="text-xs text-gray-500">{emp.department}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--app-primary)]">{fmt(emp.salary)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          emp.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditEmployee(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => onDeleteEmployee(emp.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <Users size={32} className="mx-auto mb-3 opacity-20" />
                        <p>No hay empleados registrados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nomina' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-700">Periodo de Nómina:</label>
              <input
                type="month"
                value={payrollPeriod}
                onChange={e => setPayrollPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => {
                onGeneratePayroll(payrollPeriod);
              }}
              className="bg-[var(--app-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Calculator size={16} /> Generar / Recalcular Nómina
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Sueldos Brutos</h3>
              <p className="text-2xl font-bold font-mono text-gray-800">{fmt(totalGross)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Retenciones (TSS)</h3>
              <p className="text-2xl font-bold font-mono text-red-500">-{fmt(totalDeductions)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[var(--app-primary)]">
              <h3 className="text-xs font-bold text-[var(--app-primary)] uppercase tracking-wider mb-1">Total Nómina Neta</h3>
              <p className="text-2xl font-bold font-mono text-emerald-600">{fmt(totalNet)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Empleado</th>
                    <th className="px-6 py-4 font-semibold text-right">Sueldo Bruto</th>
                    <th className="px-6 py-4 font-semibold text-right">SFS (3.04%)</th>
                    <th className="px-6 py-4 font-semibold text-right">AFP (2.87%)</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Ret.</th>
                    <th className="px-6 py-4 font-semibold text-right">Sueldo Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentPeriodPayrolls.map(pay => {
                    const sfs = pay.deductions.find(d => d.concept === 'SFS (Seguro Familiar de Salud)')?.employeeAmount || 0;
                    const afp = pay.deductions.find(d => d.concept === 'AFP (Fondo de Pensiones)')?.employeeAmount || 0;
                    return (
                      <tr key={pay.id} className="hover:bg-blue-50/30">
                        <td className="px-6 py-4 font-semibold text-gray-800">{pay.employeeName}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-600">{fmt(pay.grossSalary)}</td>
                        <td className="px-6 py-4 text-right font-mono text-red-500/80">-{fmt(sfs)}</td>
                        <td className="px-6 py-4 text-right font-mono text-red-500/80">-{fmt(afp)}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-red-600">-{fmt(pay.totalDeductions)}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmt(pay.netSalary)}</td>
                      </tr>
                    );
                  })}
                  {currentPeriodPayrolls.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <FileSpreadsheet size={32} className="mx-auto mb-3 opacity-20" />
                        <p>No hay nómina generada para el periodo {payrollPeriod}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title={editingEmployeeId ? 'Editar Empleado' : 'Nuevo Empleado'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={employeeForm.name}
                onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Cédula</label>
              <input
                type="text"
                value={employeeForm.cedula}
                onChange={e => setEmployeeForm({...employeeForm, cedula: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="000-0000000-0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Sueldo Base (DOP)</label>
              <input
                type="number"
                value={employeeForm.salary || ''}
                onChange={e => setEmployeeForm({...employeeForm, salary: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Posición</label>
              <input
                type="text"
                value={employeeForm.position}
                onChange={e => setEmployeeForm({...employeeForm, position: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Departamento</label>
              <input
                type="text"
                value={employeeForm.department}
                onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
            <button
              onClick={() => setIsEmployeeModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2 font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEmployee}
              className="px-4 py-2 bg-[var(--app-primary)] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Guardar Empleado
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

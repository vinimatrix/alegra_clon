/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Search, Plus, Building, UserCircle, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import { Client } from '../types';
import Modal from './ui/Modal';

interface ContactsProps {
  clients: Client[];
  onAddContact: (contact: Client) => void;
  onUpdateContact: (contact: Client) => void;
  onDeleteContact: (id: string) => void;
}

const EMPTY_CONTACT: Omit<Client, 'id'> = {
  name: '', rnc: '', email: '', phone: '', address: '', type: 'client'
};

export default function Contacts({ clients, onAddContact, onUpdateContact, onDeleteContact }: ContactsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'client' | 'supplier'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id'>>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredContacts = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.rnc.includes(searchTerm);
    if (activeTab === 'all') return matchesSearch;
    const isSupplier = c.type === 'supplier';
    return matchesSearch && ((activeTab === 'supplier' && isSupplier) || (activeTab === 'client' && !isSupplier));
  });

  const openNewContact = () => {
    setEditingContact(null);
    setForm(EMPTY_CONTACT);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditContact = (contact: Client) => {
    setEditingContact(contact);
    setForm({ name: contact.name, rnc: contact.rnc, email: contact.email, phone: contact.phone, address: contact.address, type: contact.type });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!form.rnc.trim()) newErrors.rnc = 'El RNC/Cédula es obligatorio';
    if (form.rnc.trim() && !/^[\d\-]{5,15}$/.test(form.rnc.trim())) newErrors.rnc = 'Formato inválido (ej: 101-12345-6)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingContact) {
      onUpdateContact({ ...editingContact, ...form });
    } else {
      const newContact: Client = {
        id: `c-${Date.now()}`,
        ...form
      };
      onAddContact(newContact);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este contacto?')) {
      onDeleteContact(id);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field] ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--app-primary)] focus:border-transparent'
    }`;

  return (
    <div className="space-y-6 animate-fade-in" id="contacts-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-150 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 font-display flex items-center gap-2">
            <Users size={24} className="text-[var(--app-primary)]" />
            Contactos
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona tus clientes y proveedores para facturación e ITBIS.
          </p>
        </div>
        <button
          onClick={openNewContact}
          className="bg-[var(--app-primary)] hover:opacity-90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Nuevo Contacto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-[var(--app-primary)] rounded-lg"><Users size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Total Contactos</p>
            <h3 className="text-xl font-bold font-mono">{clients.length}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg"><UserCircle size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Clientes</p>
            <h3 className="text-xl font-bold font-mono">{clients.filter(c => c.type !== 'supplier').length}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg"><Building size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Proveedores</p>
            <h3 className="text-xl font-bold font-mono">{clients.filter(c => c.type === 'supplier').length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            {(['all', 'client', 'supplier'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'all' ? 'Todos' : tab === 'client' ? 'Clientes' : 'Proveedores'}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por Nombre o RNC..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Nombre</th>
                <th className="px-6 py-3 font-semibold">Identificación (RNC)</th>
                <th className="px-6 py-3 font-semibold">Contacto</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[var(--app-primary)]">
                          {contact.type === 'supplier' ? <Building size={16} /> : <UserCircle size={16} />}
                        </div>
                        <span className="font-semibold text-gray-800">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{contact.rnc}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Mail size={12}/> {contact.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12}/> {contact.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        contact.type === 'supplier' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {contact.type === 'supplier' ? 'Proveedor' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditContact(contact)}
                          className="text-[var(--app-primary)] hover:text-[var(--app-primary-dark)] font-medium text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-400 hover:text-red-600 font-medium text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-gray-300" />
                      <p>No se encontraron contactos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Contact */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        subtitle={editingContact ? `Editando: ${editingContact.name}` : 'Registra un nuevo cliente o proveedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tipo de Contacto</label>
            <div className="flex gap-2">
              {(['client', 'supplier'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    form.type === type
                      ? 'bg-[var(--app-primary)] text-white border-[var(--app-primary)] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {type === 'client' ? '👤 Cliente' : '🏢 Proveedor'}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Nombre / Razón Social *</label>
            <input
              type="text"
              className={inputClass('name')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: María Delgado ó Empresa SRL"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* RNC */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">RNC / Cédula *</label>
            <input
              type="text"
              className={inputClass('rnc')}
              value={form.rnc}
              onChange={e => setForm(f => ({ ...f, rnc: e.target.value }))}
              placeholder="Ej: 101-12345-6"
            />
            {errors.rnc && <p className="text-xs text-red-500 mt-1">{errors.rnc}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                className={inputClass('email')}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Teléfono</label>
              <input
                type="text"
                className={inputClass('phone')}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="809-555-1234"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Dirección</label>
            <input
              type="text"
              className={inputClass('address')}
              value={form.address || ''}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Calle, sector, ciudad"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-[var(--app-primary)] text-white font-bold text-sm hover:opacity-90 shadow-sm transition-all cursor-pointer"
            >
              {editingContact ? 'Guardar Cambios' : 'Crear Contacto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

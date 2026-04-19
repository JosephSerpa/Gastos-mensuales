import React, { useState } from 'react';
import { Users, UserPlus, Pencil, Trash2, Check, X } from 'lucide-react';

const PeopleManager = ({ people, onAdd, onRemove, onSave, getPersonColor }) => {
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonWeight, setNewPersonWeight] = useState(1);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonWeight, setEditPersonWeight] = useState(1);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    onAdd({ id: Date.now().toString(), name: newPersonName, weight: parseFloat(newPersonWeight) || 1 });
    setNewPersonName('');
    setNewPersonWeight(1);
  };

  const handleEditClick = (person) => {
    setEditingPersonId(person.id);
    setEditPersonName(person.name);
    setEditPersonWeight(person.weight);
  };

  const handleSaveSubmit = (id) => {
    if (!editPersonName.trim()) return;
    onSave({ id, name: editPersonName, weight: parseFloat(editPersonWeight) || 1 });
    setEditingPersonId(null);
  };

  return (
    <div className="glass-card">
      <h2 className="card-title"><Users size={24} color="#3b82f6" /> Personas</h2>
      <form onSubmit={handleAddSubmit} className="input-row">
        <div className="input-group"><label>Nombre</label><input type="text" placeholder="Ej. Juan" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} /></div>
        <div className="input-group" style={{ maxWidth: '80px' }}><label>Peso (x)</label><input type="number" min="0.1" step="0.1" value={newPersonWeight} onChange={(e) => setNewPersonWeight(e.target.value)} /></div>
        <button type="submit" className="btn icon-only" title="Agregar"><UserPlus size={20} /></button>
      </form>
      <div className="item-list">
        {people.map(person => (
          <div key={person.id} className="list-item" style={{ borderLeft: `4px solid ${getPersonColor(person.id)}` }}>
            {editingPersonId === person.id ? (
              <div className="edit-form" style={{ width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input style={{ flex: '1', minWidth: '100px', padding: '0.5rem' }} type="text" value={editPersonName} onChange={(e) => setEditPersonName(e.target.value)} />
                <input style={{ width: '70px', padding: '0.5rem' }} type="number" min="0.1" step="0.1" value={editPersonWeight} onChange={(e) => setEditPersonWeight(e.target.value)} />
                <button onClick={() => handleSaveSubmit(person.id)} className="btn icon-only" style={{ background: 'var(--secondary-accent)' }}><Check size={18} /></button>
                <button onClick={() => setEditingPersonId(null)} className="btn danger icon-only"><X size={18} /></button>
              </div>
            ) : (
              <>
                <div className="item-info">
                  <span className="item-name">{person.name}</span>
                  <span className="item-meta">Ponderación: <span className="badge">x{person.weight}</span></span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEditClick(person)} className="btn icon-only" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)' }}><Pencil size={18} /></button>
                  <button onClick={() => onRemove(person.id)} className="btn danger icon-only"><Trash2 size={18} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleManager;

import React, { useState } from 'react';
import { Plus, Receipt, Pencil, Trash2, Users, Check, X } from 'lucide-react';

const ExpenseList = ({ expenses, people, onAdd, onRemove, onSave, getPersonColor, getPersonName, exchangeRate }) => {
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCurrency, setNewExpenseCurrency] = useState('PEN');
  const [newExpensePaidBy, setNewExpensePaidBy] = useState(people[0]?.id || '');

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCurrency, setEditExpenseCurrency] = useState('PEN');
  const [editExpensePaidBy, setEditExpensePaidBy] = useState('');
  const [editExpenseCustomWeights, setEditExpenseCustomWeights] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newExpenseName.trim() || !newExpenseAmount || !newExpensePaidBy) return;
    onAdd({
      id: Date.now().toString(),
      name: newExpenseName,
      amount: parseFloat(newExpenseAmount),
      isDolar: newExpenseCurrency === 'USD',
      paidById: newExpensePaidBy
    });
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  const handleEditClick = (exp) => {
    setEditingExpenseId(exp.id);
    setEditExpenseName(exp.name);
    setEditExpenseAmount(exp.amount.toString());
    setEditExpenseCurrency(exp.isDolar ? 'USD' : 'PEN');
    setEditExpensePaidBy(exp.paidById);
    setEditExpenseCustomWeights(exp.customWeights ? { ...exp.customWeights } : {});
    setShowAdvancedOptions(false);
  };

  const handleSaveSubmit = (id) => {
    onSave({
      id,
      name: editExpenseName,
      amount: parseFloat(editExpenseAmount),
      isDolar: editExpenseCurrency === 'USD',
      paidById: editExpensePaidBy,
      customWeights: editExpenseCustomWeights
    });
    setEditingExpenseId(null);
  };

  return (
    <div className="glass-card">
      <h2 className="card-title"><Receipt size={24} color="#fcd34d" /> Lista de Gastos</h2>
      <form onSubmit={handleAddSubmit} className="input-row" style={{ flexWrap: 'wrap' }}>
        <div className="input-group" style={{ minWidth: '150px' }}><label>Descripción</label><input type="text" value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} /></div>
        <div className="input-group" style={{ minWidth: '100px', flex: '0.5' }}><label>Monto</label><input type="number" min="0" step="0.01" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} /></div>
        <div className="input-group" style={{ maxWidth: '90px' }}><label>Moneda</label><select value={newExpenseCurrency} onChange={(e) => setNewExpenseCurrency(e.target.value)}><option value="PEN">S/</option><option value="USD">$</option></select></div>
        <div className="input-group" style={{ minWidth: '120px' }}><label>Pagado por</label>
          <select value={newExpensePaidBy} onChange={(e) => setNewExpensePaidBy(e.target.value)}>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button type="submit" className="btn icon-only" style={{ marginBottom: '0.2rem' }}><Plus size={20} /></button>
      </form>

      <div className="item-list">
        {expenses.length === 0 && <div className="empty-state">No hay gastos.</div>}
        {expenses.map(exp => (
          <div key={exp.id} className="list-item" style={{ borderLeft: `4px solid ${getPersonColor(exp.paidById)}` }}>
            {editingExpenseId === exp.id ? (
              <div className="edit-form" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <input style={{ flex: '1', minWidth: '120px', padding: '0.5rem' }} type="text" value={editExpenseName} onChange={(e) => setEditExpenseName(e.target.value)} />
                <input style={{ width: '80px', padding: '0.5rem' }} type="number" min="0" step="0.01" value={editExpenseAmount} onChange={(e) => setEditExpenseAmount(e.target.value)} />
                <select style={{ width: '70px', padding: '0.5rem' }} value={editExpenseCurrency} onChange={(e) => setEditExpenseCurrency(e.target.value)}><option value="PEN">S/</option><option value="USD">$</option></select>
                <select style={{ width: '100px', padding: '0.5rem' }} value={editExpensePaidBy} onChange={(e) => setEditExpensePaidBy(e.target.value)}>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <button onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} className="btn icon-only" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} title="Pesos personalizados"><Users size={18} /></button>
                <button onClick={() => handleSaveSubmit(exp.id)} className="btn icon-only" style={{ background: 'var(--secondary-accent)' }}><Check size={18} /></button>
                <button onClick={() => setEditingExpenseId(null)} className="btn danger icon-only"><X size={18} /></button>
                
                {showAdvancedOptions && (
                  <div style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Multiplicadores para este gasto:</span>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {people.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{p.name}:</span>
                          <input 
                            type="number" min="0" step="0.05" style={{ width: '60px', padding: '0.2rem' }}
                            value={editExpenseCustomWeights[p.id] !== undefined ? editExpenseCustomWeights[p.id] : p.weight}
                            onChange={(e) => setEditExpenseCustomWeights({...editExpenseCustomWeights, [p.id]: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="item-info">
                  <span className="item-name">{exp.name}</span>
                  <span className="item-meta">Pagado por: <span style={{ color: getPersonColor(exp.paidById), fontWeight: '600', marginLeft: '4px' }}>{getPersonName(exp.paidById)}</span>{exp.isDolar && <span className="badge badge-green" style={{marginLeft: '0.5rem'}}>USD</span>}{exp.customWeights && Object.keys(exp.customWeights).length > 0 && <span className="badge" style={{marginLeft: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd'}} title="Pesos personalizados activos">*</span>}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="item-amount-col" style={{ marginRight: '0.5rem' }}>
                    <span className="item-amount">{exp.isDolar ? '$' : 'S/'} {exp.amount.toFixed(2)}</span>
                    {exp.isDolar && <span className="item-meta" style={{ fontSize: '0.75rem' }}>(S/ {(exp.amount * exchangeRate).toFixed(2)})</span>}
                  </div>
                  <button onClick={() => handleEditClick(exp)} className="btn icon-only" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}><Pencil size={18} /></button>
                  <button onClick={() => onRemove(exp.id)} className="btn danger icon-only"><Trash2 size={18} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseList;

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Users, Receipt, PieChart, Activity, UserPlus, Pencil, Check, X, History, ArrowRight, Printer } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

const PERSON_COLORS = [
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
];

function App() {
  const [exchangeRate, setExchangeRate] = useState(3.40);
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [view, setView] = useState('main'); // 'main' or 'history'

  // Load initial data
  useEffect(() => {
    fetchData();
    fetchHistory();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/data`);
      const data = await res.json();
      setExchangeRate(data.exchangeRate);
      setPeople(data.people);
      setExpenses(data.expenses);
    } catch (e) { console.error("Error fetching data", e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (e) { console.error("Error fetching history", e); }
  };

  // CRUD Settings
  const handleExchangeRateChange = async (val) => {
    setExchangeRate(val);
    await fetch(`${API_URL}/settings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchangeRate: val })
    });
  };

  // Form states - People
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonWeight, setNewPersonWeight] = useState(1);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonWeight, setEditPersonWeight] = useState(1);

  // Form states - Expenses
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCurrency, setNewExpenseCurrency] = useState('PEN');
  const [newExpensePaidBy, setNewExpensePaidBy] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCurrency, setEditExpenseCurrency] = useState('PEN');
  const [editExpensePaidBy, setEditExpensePaidBy] = useState('');
  const [editExpenseCustomWeights, setEditExpenseCustomWeights] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Keep paidBy sync
  useEffect(() => {
    if (people.length > 0 && !people.find(p => p.id === newExpensePaidBy)) {
      setNewExpensePaidBy(people[0].id);
    }
  }, [people, newExpensePaidBy]);

  // People Handlers
  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    const newPerson = { id: Date.now().toString(), name: newPersonName, weight: parseFloat(newPersonWeight) || 1 };
    setPeople([...people, newPerson]);
    setNewPersonName('');
    setNewPersonWeight(1);
    await fetch(`${API_URL}/people`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPerson) });
  };

  const handleRemovePerson = async (id) => {
    setPeople(people.filter(p => p.id !== id));
    await fetch(`${API_URL}/people/${id}`, { method: 'DELETE' });
  };

  const handleEditPersonClick = (person) => {
    setEditingPersonId(person.id);
    setEditPersonName(person.name);
    setEditPersonWeight(person.weight);
  };

  const handleSavePersonEdit = async (id) => {
    if (!editPersonName.trim()) return;
    const updated = { id, name: editPersonName, weight: parseFloat(editPersonWeight) || 1 };
    setPeople(people.map(p => p.id === id ? updated : p));
    setEditingPersonId(null);
    await fetch(`${API_URL}/people`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  };

  // Expenses Handlers
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpenseName.trim() || !newExpenseAmount || !newExpensePaidBy) return;
    const newExpense = { id: Date.now().toString(), name: newExpenseName, amount: parseFloat(newExpenseAmount), isDolar: newExpenseCurrency === 'USD', paidById: newExpensePaidBy };
    setExpenses([...expenses, newExpense]);
    setNewExpenseName('');
    setNewExpenseAmount('');
    await fetch(`${API_URL}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newExpense) });
  };

  const handleRemoveExpense = async (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
    await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
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

  const handleSaveEdit = async (id) => {
    if (!editExpenseName.trim() || !editExpenseAmount || !editExpensePaidBy) return;
    const updated = { 
      id, name: editExpenseName, amount: parseFloat(editExpenseAmount), 
      isDolar: editExpenseCurrency === 'USD', paidById: editExpensePaidBy,
      customWeights: editExpenseCustomWeights
    };
    setExpenses(expenses.map(exp => exp.id === id ? updated : exp));
    setEditingExpenseId(null);
    await fetch(`${API_URL}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  };

  // Settle
  const handleSettle = async () => {
    if (!window.confirm("¿Estás seguro de querer saldar el mes? Esto guardará el registro en el historial y limpiará los gastos actuales.")) return;
    const details = { expenses, balances, transfers };
    await fetch(`${API_URL}/settle`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalSoles, totalDolars, details })
    });
    setExpenses([]);
    fetchHistory();
  };

  // Print
  const handlePrint = (h) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const d = JSON.parse(h.details);
    let html = `<html><head><title>Reporte ${new Date(h.date).toLocaleDateString()}</title><style>body{font-family:sans-serif;padding:2rem;} table{width:100%;border-collapse:collapse;margin-top:1rem;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;}</style></head><body>`;
    html += `<h1>Reporte de Gastos - ${new Date(h.date).toLocaleString()}</h1>`;
    html += `<p><strong>Total Soles:</strong> S/ ${h.totalSoles.toFixed(2)}</p>`;
    html += `<h2>Gastos Detallados</h2><table><tr><th>Descripción</th><th>Monto</th><th>Pagado por</th></tr>`;
    d.expenses.forEach(e => {
      const pName = d.balances.find(b => b.id === e.paidById)?.name || 'N/A';
      html += `<tr><td>${e.name}</td><td>${e.isDolar ? '$' : 'S/'} ${e.amount.toFixed(2)}</td><td>${pName}</td></tr>`;
    });
    html += `</table><h2>Transferencias (Quién debe a quién)</h2><ul>`;
    d.transfers.forEach(t => {
      html += `<li><strong>${t.from}</strong> debe pagar a <strong>${t.to}</strong>: S/ ${t.amount.toFixed(2)}</li>`;
    });
    html += `</ul></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Calculations
  const { totalSoles, totalDolars, balances, transfers } = useMemo(() => {
    let totalS = 0;
    let totalD = 0;

    const personTargetShares = {};
    people.forEach(p => personTargetShares[p.id] = 0);

    expenses.forEach(exp => {
      const expSoles = exp.isDolar ? exp.amount * exchangeRate : exp.amount;
      if (exp.isDolar) {
        totalD += exp.amount;
        totalS += expSoles;
      } else {
        totalS += expSoles;
        totalD += exp.amount / exchangeRate;
      }

      const expWeights = exp.customWeights || {};
      let totalWeightForExp = 0;
      people.forEach(p => {
        totalWeightForExp += (expWeights[p.id] !== undefined ? expWeights[p.id] : p.weight);
      });

      if (totalWeightForExp > 0) {
        const costPerWeightThisExp = expSoles / totalWeightForExp;
        people.forEach(p => {
          const w = (expWeights[p.id] !== undefined ? expWeights[p.id] : p.weight);
          personTargetShares[p.id] += costPerWeightThisExp * w;
        });
      }
    });

    const bals = people.map(person => {
      const targetShareSoles = personTargetShares[person.id];
      const paidSoles = expenses.filter(e => e.paidById === person.id).reduce((acc, exp) => acc + (exp.isDolar ? exp.amount * exchangeRate : exp.amount), 0);
      const netBalance = targetShareSoles - paidSoles;
      return { ...person, targetShareSoles, paidSoles, netBalance };
    });

    // Calc transfers
    const debtors = bals.filter(b => b.netBalance > 0.01).map(b => ({ ...b }));
    const creditors = bals.filter(b => b.netBalance < -0.01).map(b => ({ ...b }));
    const trans = [];

    let d = 0, c = 0;
    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const amount = Math.min(debtor.netBalance, Math.abs(creditor.netBalance));
      if (amount > 0.01) trans.push({ from: debtor.name, to: creditor.name, amount });
      debtor.netBalance -= amount;
      creditor.netBalance += amount;
      if (Math.abs(debtor.netBalance) < 0.01) d++;
      if (Math.abs(creditor.netBalance) < 0.01) c++;
    }

    return { totalSoles: totalS, totalDolars: totalD, balances: bals, transfers: trans };
  }, [expenses, people, exchangeRate]);

  const getPersonName = (id) => people.find(p => p.id === id)?.name || 'Desconocido';

  const getPersonColor = (id) => {
    const index = people.findIndex(p => p.id === id);
    if (index === -1) return 'rgba(255,255,255,0.1)';
    return PERSON_COLORS[index % PERSON_COLORS.length];
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="header">
          <h1>SplitBill</h1>
          <p>Calculadora de gastos compartidos</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={() => setView('main')} className="btn" style={{ background: view === 'main' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)' }}>Principal</button>
            <button onClick={() => setView('history')} className="btn" style={{ background: view === 'history' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)' }}>
              <History size={18} /> Historial
            </button>
          </div>
        </div>

        {view === 'main' && (
          <>
            <div className="glass-card">
              <h2 className="card-title"><Activity size={24} color="var(--secondary-accent)" /> Configuración</h2>
              <div className="input-group">
                <label>Tipo de Cambio (USD a PEN)</label>
                <input type="number" step="0.01" value={exchangeRate} onChange={(e) => handleExchangeRateChange(parseFloat(e.target.value) || 0)} min="0.1" />
              </div>
            </div>

            <div className="glass-card">
              <h2 className="card-title"><Users size={24} color="#3b82f6" /> Personas</h2>
              <form onSubmit={handleAddPerson} className="input-row">
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
                        <button onClick={() => handleSavePersonEdit(person.id)} className="btn icon-only" style={{ background: 'var(--secondary-accent)' }}><Check size={18} /></button>
                        <button onClick={() => setEditingPersonId(null)} className="btn danger icon-only"><X size={18} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="item-info">
                          <span className="item-name">{person.name}</span>
                          <span className="item-meta">Ponderación: <span className="badge">x{person.weight}</span></span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditPersonClick(person)} className="btn icon-only" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)' }}><Pencil size={18} /></button>
                          <button onClick={() => handleRemovePerson(person.id)} className="btn danger icon-only"><Trash2 size={18} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="main-content">
        {view === 'history' ? (
          <div className="glass-card">
            <h2 className="card-title"><History size={24} color="#f472b6" /> Historial de Meses Saldados</h2>
            {history.length === 0 && <div className="empty-state">No hay historial registrado.</div>}
            <div className="item-list">
              {history.map(h => (
                <div key={h.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Mes: {new Date(h.date).toLocaleString()}</h3>
                      <p style={{ color: 'var(--text-muted)' }}>Gastos Totales: S/ {h.totalSoles.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handlePrint(h)} className="btn" style={{ background: 'var(--secondary-accent)' }}><Printer size={18} /> Imprimir Detalles</button>
                      <button onClick={async () => { await fetch(`${API_URL}/history/${h.id}`, { method: 'DELETE' }); fetchHistory(); }} className="btn danger icon-only"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="glass-card result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}><PieChart size={24} color="#f472b6" /> Resumen y Transferencias</h2>
                <button onClick={handleSettle} className="btn" style={{ background: 'var(--secondary-accent)' }}>
                  <Check size={18} /> Saldar Mes
                </button>
              </div>
              
              <div className="stat-row"><span style={{ color: 'var(--text-muted)' }}>Gastos Totales (PEN)</span><span>S/ {totalSoles.toFixed(2)}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--text-muted)' }}>Gastos Totales (USD)</span><span>$ {totalDolars.toFixed(2)}</span></div>

              {transfers.length > 0 && (
                <div className="transfers-section" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>¿Quién le paga a quién?</h3>
                  <div className="transfers-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {transfers.map((t, i) => (
                      <div key={i} className="transfer-item">
                        <span className="transfer-name from">{t.from}</span>
                        <div className="transfer-line-container">
                          <div className="transfer-amount">S/ {t.amount.toFixed(2)}</div>
                          <div className="dotted-line"></div>
                          <ArrowRight size={16} className="arrow-icon" />
                        </div>
                        <span className="transfer-name to">{t.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="balances-list" style={{ marginTop: '2rem' }}>
                {balances.map(b => (
                  <div key={b.id} className="person-result">
                    <div className="person-result-header">
                      <span className="person-name">{b.name} <span className="badge">x{b.weight}</span></span>
                    </div>
                    <div className="person-details">
                      <div className="detail-row"><span>Corresponde:</span><span>S/ {b.targetShareSoles.toFixed(2)}</span></div>
                      <div className="detail-row"><span>Pagó:</span><span>S/ {b.paidSoles.toFixed(2)}</span></div>
                      <div className="balance-row">
                        <span>{b.netBalance > 0.01 ? 'Debe aportar:' : b.netBalance < -0.01 ? 'Debe recibir:' : 'Está al día'}</span>
                        <span className={`balance ${b.netBalance > 0.01 ? 'owes' : b.netBalance < -0.01 ? 'receives' : ''}`}>
                          {b.netBalance > 0.01 ? '+ ' : b.netBalance < -0.01 ? '- ' : ''}S/ {Math.abs(b.netBalance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card">
              <h2 className="card-title"><Receipt size={24} color="#fcd34d" /> Lista de Gastos</h2>
              <form onSubmit={handleAddExpense} className="input-row" style={{ flexWrap: 'wrap' }}>
                <div className="input-group" style={{ minWidth: '150px' }}><label>Descripción</label><input type="text" value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} /></div>
                <div className="input-group" style={{ minWidth: '100px', flex: '0.5' }}><label>Monto</label><input type="number" min="0" step="0.01" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} /></div>
                <div className="input-group" style={{ maxWidth: '90px' }}><label>Moneda</label><select value={newExpenseCurrency} onChange={(e) => setNewExpenseCurrency(e.target.value)}><option value="PEN">S/</option><option value="USD">$</option></select></div>
                <div className="input-group" style={{ minWidth: '120px' }}><label>Pagado por</label><select value={newExpensePaidBy} onChange={(e) => setNewExpensePaidBy(e.target.value)}>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
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
                        <button onClick={() => handleSaveEdit(exp.id)} className="btn icon-only" style={{ background: 'var(--secondary-accent)' }}><Check size={18} /></button>
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
                          <button onClick={() => handleRemoveExpense(exp.id)} className="btn danger icon-only"><Trash2 size={18} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

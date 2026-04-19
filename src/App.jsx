import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Activity } from 'lucide-react';
import './App.css';

// Components
import Summary from './components/Summary';
import ExpenseList from './components/ExpenseList';
import PeopleManager from './components/PeopleManager';
import History from './components/History';

// Constants
import { API_URL, PERSON_COLORS } from './constants';

function App() {
  const [exchangeRate, setExchangeRate] = useState(3.40);
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('main'); // 'main' or 'history'

  // Load initial data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchData(), fetchHistory()]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/data`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setExchangeRate(data.exchangeRate);
      setPeople(data.people);
      setExpenses(data.expenses);
    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Error fetching history", e);
    }
  };

  // Handlers
  const handleExchangeRateChange = async (val) => {
    setExchangeRate(val);
    await fetch(`${API_URL}/settings`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchangeRate: val })
    });
  };

  const handleAddPerson = async (newPerson) => {
    setPeople(prev => [...prev, newPerson]);
    await fetch(`${API_URL}/people`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(newPerson) 
    });
  };

  const handleRemovePerson = async (id) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    await fetch(`${API_URL}/people/${id}`, { method: 'DELETE' });
  };

  const handleSavePerson = async (updated) => {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
    await fetch(`${API_URL}/people`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(updated) 
    });
  };

  const handleAddExpense = async (newExpense) => {
    setExpenses(prev => [...prev, newExpense]);
    await fetch(`${API_URL}/expenses`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(newExpense) 
    });
  };

  const handleRemoveExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
  };

  const handleSaveExpense = async (updated) => {
    setExpenses(prev => prev.map(exp => exp.id === updated.id ? updated : exp));
    await fetch(`${API_URL}/expenses`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(updated) 
    });
  };

  const handleSettle = async (calcData) => {
    if (!window.confirm("¿Estás seguro de querer saldar el mes? Esto guardará el registro en el historial y limpiará los gastos actuales.")) return;
    const { totalSoles, totalDolars, balances, transfers } = calcData;
    const details = { expenses, balances, transfers };
    
    await fetch(`${API_URL}/settle`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalSoles, totalDolars, details })
    });
    
    setExpenses([]);
    fetchHistory();
  };

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

  const getPersonName = (id) => people.find(p => p.id === id)?.name || 'Desconocido';
  
  const getPersonColor = (id) => {
    const index = people.findIndex(p => p.id === id);
    if (index === -1) return 'rgba(255,255,255,0.1)';
    return PERSON_COLORS[index % PERSON_COLORS.length];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Sincronizando con el servidor...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="header">
          <h1>SplitBill</h1>
          <p>Calculadora de gastos compartidos</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={() => setView('main')} className="btn" style={{ background: view === 'main' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)' }}>Principal</button>
            <button onClick={() => setView('history')} className="btn" style={{ background: view === 'history' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)' }}>
              <HistoryIcon size={18} /> Historial
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

            <PeopleManager 
              people={people} 
              onAdd={handleAddPerson} 
              onRemove={handleRemovePerson} 
              onSave={handleSavePerson} 
              getPersonColor={getPersonColor} 
            />
          </>
        )}
      </div>

      <div className="main-content">
        {view === 'history' ? (
          <History 
            history={history} 
            onPrint={handlePrint} 
            onRemove={async (id) => { await fetch(`${API_URL}/history/${id}`, { method: 'DELETE' }); fetchHistory(); }} 
          />
        ) : (
          <>
            <Summary 
              expenses={expenses} 
              people={people} 
              exchangeRate={exchangeRate} 
              onSettle={handleSettle} 
            />

            <ExpenseList 
              expenses={expenses} 
              people={people} 
              onAdd={handleAddExpense} 
              onRemove={handleRemoveExpense} 
              onSave={handleSaveExpense} 
              getPersonColor={getPersonColor} 
              getPersonName={getPersonName} 
              exchangeRate={exchangeRate} 
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;

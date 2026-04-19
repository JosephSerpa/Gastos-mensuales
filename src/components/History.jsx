import React from 'react';
import { History as HistoryIcon, Printer, Trash2 } from 'lucide-react';

const History = ({ history, onPrint, onRemove }) => {
  return (
    <div className="glass-card">
      <h2 className="card-title"><HistoryIcon size={24} color="#f472b6" /> Historial de Meses Saldados</h2>
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
                <button onClick={() => onPrint(h)} className="btn" style={{ background: 'var(--secondary-accent)' }}><Printer size={18} /> Imprimir Detalles</button>
                <button onClick={() => onRemove(h.id)} className="btn danger icon-only"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;

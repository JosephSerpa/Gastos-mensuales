import React, { useMemo } from 'react';
import { PieChart, Check, ArrowRight } from 'lucide-react';

const Summary = ({ expenses, people, exchangeRate, onSettle }) => {
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

  return (
    <div className="glass-card result-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="card-title" style={{ marginBottom: 0 }}><PieChart size={24} color="#f472b6" /> Resumen y Transferencias</h2>
        <button onClick={() => onSettle({ totalSoles, totalDolars, balances, transfers })} className="btn" style={{ background: 'var(--secondary-accent)' }}>
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
  );
};

export default Summary;

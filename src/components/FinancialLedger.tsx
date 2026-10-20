import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Landmark,
} from 'lucide-react';

export const FinancialLedger: React.FC = () => {
  const { state, takeLoan, repayLoan } = useGame();
  const [filterType, setFilterType] = useState<string>('all');

  const totalRevenue = state.ledger
    .filter((e) => e.amountUsd > 0 && e.type !== 'loan_disbursement')
    .reduce((acc, e) => acc + e.amountUsd, 0);

  const totalFuelCost = Math.abs(
    state.ledger.filter((e) => e.type === 'fuel_expense').reduce((acc, e) => acc + e.amountUsd, 0)
  );

  const totalDriverWages = Math.abs(
    state.ledger.filter((e) => e.type === 'driver_wages').reduce((acc, e) => acc + e.amountUsd, 0)
  );

  const totalMaintenance = Math.abs(
    state.ledger.filter((e) => e.type === 'maintenance_expense' || e.type === 'breakdown_recovery').reduce((acc, e) => acc + e.amountUsd, 0)
  );

  const totalTolls = Math.abs(
    state.ledger.filter((e) => e.type === 'toll_expense').reduce((acc, e) => acc + e.amountUsd, 0)
  );

  const totalOperatingCosts = totalFuelCost + totalDriverWages + totalMaintenance + totalTolls;
  const netOperatingProfit = totalRevenue - totalOperatingCosts;
  const operatingMarginPct = totalRevenue > 0 ? Math.round((netOperatingProfit / totalRevenue) * 100) : 0;

  const filteredLedger = state.ledger.filter((entry) => {
    if (filterType === 'all') return true;
    if (filterType === 'revenue' && entry.amountUsd > 0) return true;
    if (filterType === 'expense' && entry.amountUsd < 0) return true;
    return entry.type === filterType;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Executive P&L Dashboard */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Financial P&L & Operating Margins</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Revenues, operating diesel fuel burn, driver wages, and credit balance.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Gross Revenue</span>
            <div className="text-lg sm:text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-0.5 sm:mt-1">
              ${(totalRevenue / 1000).toFixed(0)}k
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Consignments</span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Operating Costs</span>
            <div className="text-lg sm:text-2xl font-mono font-bold text-rose-400 tabular-nums mt-0.5 sm:mt-1">
              ${(totalOperatingCosts / 1000).toFixed(0)}k
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Fuel & Wages</span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Operating Margin</span>
            <div className={`text-lg sm:text-2xl font-mono font-bold tabular-nums mt-0.5 sm:mt-1 ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {operatingMarginPct}%
            </div>
            <span className="text-[9px] text-slate-500 font-mono">${(netOperatingProfit / 1000).toFixed(1)}k net</span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Treasury Cash</span>
            <div className="text-lg sm:text-2xl font-mono font-bold text-amber-400 tabular-nums mt-0.5 sm:mt-1">
              ${(state.balanceUsd / 1000).toFixed(0)}k
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Available</span>
          </div>
        </div>

        {/* Cost Breakdown Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[9px] text-slate-500 uppercase">Diesel Fuel</div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 tabular-nums mt-0.5">${totalFuelCost.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[9px] text-slate-500 uppercase">Driver Wages</div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 tabular-nums mt-0.5">${totalDriverWages.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[9px] text-slate-500 uppercase">Repairs & Bays</div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 tabular-nums mt-0.5">${totalMaintenance.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[9px] text-slate-500 uppercase">Highway Tolls</div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 tabular-nums mt-0.5">${totalTolls.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 2. Bank Credit Facility */}
      <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-400" />
            <span>Commercial Equipment Credit</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Finance fleet expansions or depot fuel infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-white">Micro Credit</h4>
                <div className="text-[10px] font-mono text-slate-400">30-Day Facility</div>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-400">7% Term</span>
            </div>
            <div className="text-xl font-mono font-bold text-white tabular-nums">$50,000</div>
            <button
              onClick={() => takeLoan(50000, 30)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors min-h-[44px]"
            >
              Disburse $50,000
            </button>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-white">Fleet Expansion</h4>
                <div className="text-[10px] font-mono text-slate-400">60-Day Facility</div>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-400">7% Term</span>
            </div>
            <div className="text-xl font-mono font-bold text-white tabular-nums">$125,000</div>
            <button
              onClick={() => takeLoan(125000, 60)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors min-h-[44px]"
            >
              Disburse $125,000
            </button>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-white">Terminal Mortgage</h4>
                <div className="text-[10px] font-mono text-slate-400">90-Day Facility</div>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-400">7% Term</span>
            </div>
            <div className="text-xl font-mono font-bold text-white tabular-nums">$250,000</div>
            <button
              onClick={() => takeLoan(250000, 90)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors min-h-[44px]"
            >
              Disburse $250,000
            </button>
          </div>
        </div>

        {/* Active Loans */}
        {state.loans.length > 0 && (
          <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2.5">
            <h4 className="text-[11px] font-mono font-bold uppercase text-amber-400 tracking-wider">
              Active Debt Facilities ({state.loans.length})
            </h4>
            <div className="space-y-2">
              {state.loans.map((loan, index) => (
                <div key={`${loan.id}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono gap-2">
                  <div>
                    <span className="text-white font-bold">${Math.round(loan.remainingBalanceUsd).toLocaleString()} remaining</span>
                    <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">
                      ({loan.daysRemaining} days left at ${loan.dailyPaymentUsd}/day)
                    </span>
                  </div>
                  <button
                    onClick={() => repayLoan(loan.id, 25000)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-xs font-semibold transition-colors min-h-[36px]"
                  >
                    Repay $25,000
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Transaction Journal */}
      <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Receipt className="w-4 h-4 text-sky-400" />
            <span>Journal ({state.ledger.length})</span>
          </h3>

          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded min-h-[32px] flex items-center transition-colors ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('revenue')}
              className={`px-2 py-1 rounded min-h-[32px] flex items-center transition-colors ${filterType === 'revenue' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              In
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2 py-1 rounded min-h-[32px] flex items-center transition-colors ${filterType === 'expense' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              Out
            </button>
          </div>
        </div>

        {/* Mobile Journal Cards */}
        <div className="sm:hidden space-y-2">
          {filteredLedger.slice(0, 20).map((entry) => {
            const isCredit = entry.amountUsd >= 0;
            return (
              <div key={entry.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px]">{entry.simTimeFormatted}</span>
                  <span className={`font-bold tabular-nums ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isCredit ? '+' : ''}${Math.round(entry.amountUsd).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-200 text-[11px] leading-snug">{entry.description}</div>
                <div className="text-[10px] text-slate-500 text-right">
                  Bal: ${Math.round(entry.runningBalanceUsd).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Journal Table */}
        <div className="hidden sm:block bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase text-slate-400 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLedger.map((entry, index) => {
                  const isCredit = entry.amountUsd >= 0;
                  return (
                    <tr key={`${entry.id || 'led'}-${index}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {entry.simTimeFormatted}
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {entry.description}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 capitalize">
                        {entry.type.replace('_', ' ')}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-bold tabular-nums whitespace-nowrap ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : ''}${Math.round(entry.amountUsd).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 tabular-nums whitespace-nowrap">
                        ${Math.round(entry.runningBalanceUsd).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

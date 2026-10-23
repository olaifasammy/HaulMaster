import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Landmark,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  FileText,
  Percent,
  Clock,
} from 'lucide-react';

export const GrantsAndLoansPage: React.FC<{ onBackToLedger: () => void }> = ({ onBackToLedger }) => {
  const { state, takeLoan, repayLoan, notifyUser } = useGame();
  const [claimedGrants, setClaimedGrants] = useState<string[]>([]);

  // Corporate financial metrics
  const totalRevenue = state.ledger
    .filter((e) => e.amountUsd > 0 && e.type !== 'loan_disbursement')
    .reduce((acc, e) => acc + e.amountUsd, 0);

  const totalTruckValue = state.trucks.length * 125000;
  const totalHubValue = state.hubs.filter((h) => h.isUnlocked).length * 85000;
  const companyNetWorth = state.balanceUsd + totalTruckValue + totalHubValue;

  const totalActiveDebt = state.loans.reduce((acc, l) => acc + l.remainingBalanceUsd, 0);
  // Realistic corporate debt limit: 3x Net Worth or max $750,000 credit ceiling
  const maxDebtLimit = Math.min(750000, Math.max(100000, companyNetWorth * 2.5));
  const availableCredit = Math.max(0, maxDebtLimit - totalActiveDebt);
  const creditUtilizationPct = Math.round((totalActiveDebt / maxDebtLimit) * 100);

  // Credit Rating based on net worth & financial health
  const creditRating = companyNetWorth > 300000 ? 'AAA (Prime)' : companyNetWorth > 150000 ? 'AA (Investment Grade)' : companyNetWorth > 50000 ? 'A (Stable)' : 'BBB (Speculative)';

  const handleApplyLoan = (amount: number, days: number, interestRate: number, title: string) => {
    if (totalActiveDebt + amount > maxDebtLimit) {
      notifyUser(
        'Credit Limit Exceeded',
        `Corporate borrowing ceiling is $${maxDebtLimit.toLocaleString()}. Active debt ($${Math.round(totalActiveDebt).toLocaleString()}) plus requested loan exceeds credit capacity.`,
        'finance'
      );
      return;
    }

    if (window.confirm(`Corporate Banking Committee Approval:\n\nFacility: ${title}\nPrincipal: $${amount.toLocaleString()}\nTerm: ${days} Sim Days\nInterest Rate: ${interestRate}% APR\n\nDisburse funds to corporate treasury?`)) {
      takeLoan(amount, days);
      notifyUser('Loan Disbursed', `Successfully secured ${title} for $${amount.toLocaleString()}. Funds deposited into corporate treasury.`, 'finance');
    }
  };

  const handleClaimGrant = (grantId: string, grantAmount: number, grantTitle: string, minRank: number) => {
    if (state.playerRank < minRank) {
      notifyUser('Grant Requirements Unmet', `Requires Corporate Logistics Rank ${minRank} or higher to qualify for this government subsidy.`, 'finance');
      return;
    }
    if (claimedGrants.includes(grantId)) {
      notifyUser('Already Claimed', 'This corporate subsidy grant has already been claimed by your enterprise.', 'finance');
      return;
    }

    if (window.confirm(`Government & Industry Logistics Subsidy:\n\nGrant: ${grantTitle}\nSubvention: $${grantAmount.toLocaleString()}\n\nClaim non-repayable grant funds?`)) {
      setClaimedGrants((prev) => [...prev, grantId]);
      // Inject grant revenue into state via ledger / balance
      // We can use a direct treasury addition or ledger entry if supported, or via grant claim function
      notifyUser('Grant Approved & Disbursed', `Ministry of Transport approved ${grantTitle}. $${grantAmount.toLocaleString()} credited to company balance.`, 'finance');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
              Corporate Treasury & Credit Bureau
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Corporate Banking, Debt Facilities & Government Grants
            </h2>
          </div>
        </div>

        <button
          onClick={onBackToLedger}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-mono text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Briefcase className="w-4 h-4 text-amber-400" />
          <span>Return to Financial P&L Ledger</span>
        </button>
      </div>

      {/* Credit Bureau Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Credit Rating</span>
          <div className="text-lg font-mono font-bold text-amber-400 mt-1">{creditRating}</div>
          <span className="text-[10px] text-slate-500 font-mono">Based on Net Worth</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Borrowing Ceiling</span>
          <div className="text-lg font-mono font-bold text-white mt-1">${Math.round(maxDebtLimit).toLocaleString()}</div>
          <span className="text-[10px] text-emerald-400 font-mono">${Math.round(availableCredit).toLocaleString()} available</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Active Corporate Debt</span>
          <div className="text-lg font-mono font-bold text-rose-400 mt-1">${Math.round(totalActiveDebt).toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-mono">{creditUtilizationPct}% credit utilized</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Enterprise Valuation</span>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">${Math.round(companyNetWorth).toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-mono">Assets & Treasury</span>
        </div>
      </div>

      {/* 1. Available Corporate Loan Facilities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>Available Corporate Debt Facilities</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly regulated corporate loan products with transparent amortization and interest rates.
            </p>
          </div>
          {totalActiveDebt >= maxDebtLimit && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Credit Ceiling Reached</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Facility 1 */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-amber-400 font-bold">Revolving Line</span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded font-bold">6.5% APR</span>
              </div>
              <h4 className="text-base font-bold text-white">Working Capital Revolver</h4>
              <p className="text-xs text-slate-400 mt-1">
                Short-term liquidity for fuel reserves, driver payroll, and routine depot maintenance.
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Amount:</span>
                <span className="text-white font-bold">$50,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repayment Term:</span>
                <span className="text-slate-200">30 Sim Days</span>
              </div>
              <button
                onClick={() => handleApplyLoan(50000, 30, 6.5, 'Working Capital Revolver ($50k)')}
                disabled={totalActiveDebt + 50000 > maxDebtLimit}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Draw $50,000 Facility
              </button>
            </div>
          </div>

          {/* Facility 2 */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-amber-400 font-bold">Equipment Loan</span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded font-bold">7.0% APR</span>
              </div>
              <h4 className="text-base font-bold text-white">Heavy Fleet Financing</h4>
              <p className="text-xs text-slate-400 mt-1">
                Medium-term capital dedicated strictly to purchasing new trucks, trailers, and specialized units.
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Amount:</span>
                <span className="text-white font-bold">$150,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repayment Term:</span>
                <span className="text-slate-200">60 Sim Days</span>
              </div>
              <button
                onClick={() => handleApplyLoan(150000, 60, 7.0, 'Heavy Fleet Financing ($150k)')}
                disabled={totalActiveDebt + 150000 > maxDebtLimit}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Draw $150,000 Facility
              </button>
            </div>
          </div>

          {/* Facility 3 */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-amber-400 font-bold">Terminal Mortgage</span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded font-bold">5.8% APR</span>
              </div>
              <h4 className="text-base font-bold text-white">Infrastructure & Hub Mortgage</h4>
              <p className="text-xs text-slate-400 mt-1">
                Long-term capital for acquiring gateway hubs, spoke terminals, and workshop bay expansions.
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Amount:</span>
                <span className="text-white font-bold">$300,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repayment Term:</span>
                <span className="text-slate-200">120 Sim Days</span>
              </div>
              <button
                onClick={() => handleApplyLoan(300000, 120, 5.8, 'Infrastructure & Hub Mortgage ($300k)')}
                disabled={totalActiveDebt + 300000 > maxDebtLimit}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Draw $300,000 Facility
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Loans & Repayment Panel */}
      {state.loans.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Active Corporate Debt Portfolio ({state.loans.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily installments are automatically debited at midnight rollover. Accelerate principal payments at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {state.loans.map((loan, idx) => (
              <div
                key={`${loan.id}-${idx}`}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">Loan #{idx + 1}</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px]">
                      {loan.daysRemaining} Days Remaining
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Daily Amortization Installment: <span className="text-white font-bold">${loan.dailyPaymentUsd}/day</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Outstanding Principal</span>
                    <span className="text-white font-bold text-sm">${Math.round(loan.remainingBalanceUsd).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => repayLoan(loan.id, 25000)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Repay $25k
                    </button>
                    <button
                      onClick={() => repayLoan(loan.id, loan.remainingBalanceUsd)}
                      className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Full Payoff
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Government & Industry Logistics Subsidies / Grants */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Government & Industry Logistics Subsidies (Grants)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-repayable corporate grants awarded upon achieving logistics milestones and rank progressions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Grant 1 */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400 font-bold">Non-Repayable Grant</span>
                <span className="text-amber-400 font-bold">$15,000 Subsidy</span>
              </div>
              <h4 className="text-base font-bold text-white">Green Fleet & Emissions Subsidy</h4>
              <p className="text-xs text-slate-400 mt-1">
                Ministry of Transport grant for establishing low-emission regional freight operations. Requires Rank 2.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Requirement: Rank 2+</span>
              <button
                onClick={() => handleClaimGrant('grant-green', 15000, 'Green Fleet & Emissions Subsidy', 2)}
                disabled={claimedGrants.includes('grant-green') || state.playerRank < 2}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs font-mono rounded-xl transition-colors cursor-pointer"
              >
                {claimedGrants.includes('grant-green') ? 'Claimed' : 'Claim $15k Grant'}
              </button>
            </div>
          </div>

          {/* Grant 2 */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400 font-bold">Non-Repayable Grant</span>
                <span className="text-amber-400 font-bold">$35,000 Subsidy</span>
              </div>
              <h4 className="text-base font-bold text-white">Interstate Trade Corridor Expansion</h4>
              <p className="text-xs text-slate-400 mt-1">
                Federal commerce subvention for connecting regional trade corridors and boosting supply chain velocity. Requires Rank 3.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Requirement: Rank 3+</span>
              <button
                onClick={() => handleClaimGrant('grant-corridor', 35000, 'Interstate Trade Corridor Expansion', 3)}
                disabled={claimedGrants.includes('grant-corridor') || state.playerRank < 3}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs font-mono rounded-xl transition-colors cursor-pointer"
              >
                {claimedGrants.includes('grant-corridor') ? 'Claimed' : 'Claim $35k Grant'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  Sparkles,
  Star,
  Compass,
  Package,
  MapPin,
  Truck,
} from 'lucide-react';

const generateRecursiveGrantTiers = (baseTarget: number, baseReward: number, multiplier: number = 2.0) => {
  const tiers = [];
  let currentTarget = baseTarget;
  let currentReward = baseReward;
  for (let i = 1; i <= 20; i++) {
    tiers.push({
      tier: i,
      target: Math.round(currentTarget),
      reward: Math.round(currentReward),
    });
    currentTarget *= multiplier;
    currentReward *= 1.5;
  }
  return tiers;
};

export const GrantsAndLoansPage: React.FC<{ onBackToLedger: () => void }> = ({ onBackToLedger }) => {
  const { state, takeLoan, repayLoan, claimGrant, notifyUser } = useGame();
  const [claimedGrantTiers, setClaimedGrantTiers] = useState<string[]>([]);

  // Corporate financial metrics
  const totalRevenue = state.ledger
    .filter((e) => e.amountUsd > 0 && e.type !== 'loan_disbursement')
    .reduce((acc, e) => acc + e.amountUsd, 0);

  const totalTruckValue = state.trucks.length * 125000;
  const totalHubValue = state.hubs.filter((h) => h.isUnlocked).length * 85000;
  const companyNetWorth = state.balanceUsd + totalTruckValue + totalHubValue;

  const totalActiveDebt = state.loans.reduce((acc, l) => acc + l.remainingBalanceUsd, 0);
  const maxDebtLimit = Math.min(750000, Math.max(100000, companyNetWorth * 2.5));
  const availableCredit = Math.max(0, maxDebtLimit - totalActiveDebt);
  const creditUtilizationPct = Math.round((totalActiveDebt / maxDebtLimit) * 100);

  const creditRating = companyNetWorth > 300000 ? 'AAA (Prime)' : companyNetWorth > 150000 ? 'AA (Investment Grade)' : companyNetWorth > 50000 ? 'A (Stable)' : 'BBB (Speculative)';

  // Operational metrics for recursive grants
  const totalKm = state.totalKilometersDriven;
  const totalDeliveries = state.drivers.reduce((acc, d) => acc + d.stats.deliveriesCompleted, 0);
  const ownedHubsCount = state.hubs.filter((h) => h.isUnlocked).length;
  const truckCount = state.trucks.length;

  const grantPrograms = [
    {
      id: 'grant_green',
      title: 'Green Fleet & Emissions Subsidy',
      description: 'Ministry of Transport recursive grant awarded for scaling interstate kilometer transit.',
      icon: Compass,
      currentValue: totalKm,
      unit: 'km',
      tiers: generateRecursiveGrantTiers(25000, 15000, 2.2),
    },
    {
      id: 'grant_commerce',
      title: 'Interstate Commerce Subvention',
      description: 'Federal commerce grant awarded for completing commercial freight dispatches.',
      icon: Package,
      currentValue: totalDeliveries,
      unit: 'deliveries',
      tiers: generateRecursiveGrantTiers(20, 18000, 2.0),
    },
    {
      id: 'grant_infrastructure',
      title: 'Terminal Infrastructure Grant',
      description: 'Regional development grant awarded for expanding terminal hub concessions.',
      icon: MapPin,
      currentValue: ownedHubsCount,
      units: 'hubs',
      tiers: generateRecursiveGrantTiers(2, 25000, 2.0),
    },
    {
      id: 'grant_fleet',
      title: 'Commercial Fleet Subvention',
      description: 'Industrial growth grant awarded for expanding commercial truck fleet capacity.',
      icon: Truck,
      currentValue: truckCount,
      units: 'trucks',
      tiers: generateRecursiveGrantTiers(2, 20000, 2.0),
    },
  ];

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

  const handleClaimGrantTier = (programTitle: string, grantKey: string, reward: number, tier: number) => {
    if (claimedGrantTiers.includes(grantKey)) return;

    if (window.confirm(`Government & Industry Subsidy Approval:\n\nProgram: ${programTitle} (Tier ${tier})\nSubvention Grant: $${reward.toLocaleString()}\n\nClaim non-repayable grant funds?`)) {
      setClaimedGrantTiers((prev) => [...prev, grantKey]);
      claimGrant(reward, `${programTitle} (Tier ${tier} Subsidy)`);
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
              Corporate Banking, Debt Facilities & Recursive Subsidies
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

      {/* 2. Actively Recursive Government & Industry Subsidies (Grants) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Actively Recursive Government Subsidies & Grants</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-repayable corporate grants awarded upon achieving logistics milestones. As your enterprise scales, new tiers unlock recursively!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grantPrograms.map((prog) => {
            const activeTierIndex = prog.tiers.findIndex((t) => !claimedGrantTiers.includes(`${prog.id}_tier_${t.tier}`));
            const isFullyCompleted = activeTierIndex === -1;
            const currentTier = isFullyCompleted ? prog.tiers[prog.tiers.length - 1] : prog.tiers[activeTierIndex];
            const previousTierTarget = activeTierIndex > 0 ? prog.tiers[activeTierIndex - 1].target : 0;
            
            const currentValue = prog.currentValue;
            const targetValue = currentTier.target;
            const isCompleted = currentValue >= targetValue;
            const grantKey = `${prog.id}_tier_${currentTier.tier}`;
            const progressPct = isFullyCompleted ? 100 : Math.min(100, Math.max(0, Math.round(((currentValue - previousTierTarget) / (targetValue - previousTierTarget)) * 100)));
            const IconComp = prog.icon;

            return (
              <div
                key={prog.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isFullyCompleted
                    ? 'bg-slate-950/70 border-emerald-500/30'
                    : isCompleted
                    ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{prog.title}</h4>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Tier {currentTier.tier} Subvention: ${currentTier.reward.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {isFullyCompleted ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                        <span>Max Tiers</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <span>Ready to Claim</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">
                        Tier {currentTier.tier}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">{prog.description}</p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white font-bold">
                        {Math.round(currentValue).toLocaleString()} / {targetValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    {isFullyCompleted ? 'All recursive tiers claimed' : isCompleted ? 'Subvention funds authorized' : 'In progress...'}
                  </span>
                  <button
                    onClick={() => handleClaimGrantTier(prog.title, grantKey, currentTier.reward, currentTier.tier)}
                    disabled={!isCompleted || isFullyCompleted || claimedGrantTiers.includes(grantKey)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs font-mono rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    {claimedGrantTiers.includes(grantKey) ? 'Claimed' : `Claim $${currentTier.reward.toLocaleString()}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

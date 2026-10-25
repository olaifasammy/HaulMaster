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
  Lock,
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
  const claimedGrantTiers = state.claimedGrantIds || [];

  // Corporate financial metrics
  const totalRevenue = state.ledger
    .filter((e) => e.amountUsd > 0 && e.type !== 'loan_disbursement')
    .reduce((acc, e) => acc + e.amountUsd, 0);

  const totalTruckValue = state.trucks.length * 125000;
  const totalHubValue = state.hubs.filter((h) => h.isUnlocked).length * 85000;
  const companyNetWorth = state.balanceUsd + totalTruckValue + totalHubValue;
  const truckCount = state.trucks.length;
  const ownedHubsCount = state.hubs.filter((h) => h.isUnlocked).length;
  const playerRank = state.playerRank || 1;

  const totalActiveDebt = state.loans.reduce((acc, l) => acc + l.remainingBalanceUsd, 0);
  const hasActiveLoans = state.loans.length > 0;
  const maxDebtLimit = Math.max(1000000, companyNetWorth * 4.5);
  const availableCredit = Math.max(0, maxDebtLimit - totalActiveDebt);
  const creditUtilizationPct = Math.round((totalActiveDebt / maxDebtLimit) * 100);

  const creditRating = companyNetWorth > 3000000 ? 'AAA (Prime)' : companyNetWorth > 1500000 ? 'AA (Investment Grade)' : companyNetWorth > 500000 ? 'A (Stable)' : 'BBB (Speculative)';

  // Operational metrics for recursive grants
  const totalKm = state.totalKilometersDriven;
  const totalDeliveries = state.drivers.reduce((acc, d) => acc + d.stats.deliveriesCompleted, 0);

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

  // Underwriting conditions & requirements
  const loanFacilities = [
    {
      id: 'loan-150k',
      title: 'Working Capital Revolver ($150k)',
      amount: 150000,
      days: 30,
      apr: 6.2,
      minRank: 1,
      minTrucks: 0,
      minHubs: 1,
      minNetWorth: 25000,
      subtitle: 'Working Capital Revolver',
      desc: 'Short-term liquidity for fuel reserves, driver payroll, and AI subscriber billing.',
    },
    {
      id: 'loan-500k',
      title: 'Heavy Fleet Financing Note ($500k)',
      amount: 500000,
      days: 60,
      apr: 6.8,
      minRank: 3,
      minTrucks: 3,
      minHubs: 1,
      minNetWorth: 200000,
      subtitle: 'Equipment Syndicate',
      desc: 'Medium-term capital dedicated to scaling heavy semi-tractor fleets and specialized trailers.',
    },
    {
      id: 'loan-1.5m',
      title: 'Global Logistics Expansion Note ($1.5M)',
      amount: 1500000,
      days: 90,
      apr: 7.2,
      minRank: 5,
      minTrucks: 10,
      minHubs: 2,
      minNetWorth: 1000000,
      subtitle: 'Enterprise Syndicate',
      desc: 'High-volume capital for acquiring regional hubs, port concessions, and scaling operations.',
    },
    {
      id: 'loan-5m',
      title: 'AI Fleet & Infrastructure Note ($5.0M)',
      amount: 5000000,
      days: 120,
      apr: 7.8,
      minRank: 8,
      minTrucks: 22,
      minHubs: 4,
      minNetWorth: 3500000,
      subtitle: 'Sovereign Syndicate',
      desc: 'Massive institutional debt facility for multi-year AI suites, terminal ports, and mega-fleets.',
    },
  ];

  const handleApplyLoan = (facility: typeof loanFacilities[0]) => {
    if (hasActiveLoans) {
      notifyUser('Active Debt Restriction', 'Corporate banking committee strictly prohibits issuing new credit facilities while existing commercial loans remain unpaid. Settle active debt first.', 'finance');
      return;
    }
    if (totalActiveDebt + facility.amount > maxDebtLimit) {
      notifyUser(
        'Credit Limit Exceeded',
        `Corporate borrowing ceiling is $${maxDebtLimit.toLocaleString()}. Active debt ($${Math.round(totalActiveDebt).toLocaleString()}) plus requested loan exceeds credit capacity.`,
        'finance'
      );
      return;
    }

    if (window.confirm(`Corporate Banking Committee Approval:\n\nFacility: ${facility.title}\nPrincipal: $${facility.amount.toLocaleString()}\nTerm: ${facility.days} Sim Days\nInterest Rate: ${facility.apr}% APR\n\nDisburse funds to corporate treasury?`)) {
      takeLoan(facility.amount, facility.days);
      notifyUser('Loan Disbursed', `Successfully secured ${facility.title} for $${facility.amount.toLocaleString()}. Funds deposited into corporate treasury.`, 'finance');
    }
  };

  const handleClaimGrantTier = (programTitle: string, grantKey: string, reward: number, tier: number) => {
    if (claimedGrantTiers.includes(grantKey)) return;

    if (window.confirm(`Government & Industry Subsidy Approval:\n\nProgram: ${programTitle} (Tier ${tier})\nSubvention Grant: $${reward.toLocaleString()}\n\nClaim non-repayable grant funds?`)) {
      claimGrant(reward, `${programTitle} (Tier ${tier} Subsidy)`, grantKey);
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
              <span>Available Corporate Debt Facilities (Strict Underwriting Criteria)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Higher-tier institutional loans require rigorous underwriting prerequisites. Active unpaid debt strictly blocks new borrowings.
            </p>
          </div>
          {hasActiveLoans && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Active Unpaid Debt (New Loans Locked)</span>
            </div>
          )}
        </div>

        {hasActiveLoans && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-xs font-mono text-rose-300 flex items-center gap-3 shadow-xl">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Active Debt Restriction in Effect</strong>
              Corporate banking committee policy strictly prohibits issuing new credit facilities while existing commercial loans remain unpaid. Settle your active debt portfolio below to unlock new loan facilities.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loanFacilities.map((facility) => {
            const meetsRank = playerRank >= facility.minRank;
            const meetsTrucks = truckCount >= facility.minTrucks;
            const meetsHubs = ownedHubsCount >= facility.minHubs;
            const meetsNetWorth = companyNetWorth >= facility.minNetWorth;
            const meetsCredit = totalActiveDebt + facility.amount <= maxDebtLimit;
            const isEligible = !hasActiveLoans && meetsRank && meetsTrucks && meetsHubs && meetsNetWorth && meetsCredit;

            return (
              <div key={facility.id} className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-amber-400 font-bold">{facility.subtitle}</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded font-bold">{facility.apr}% APR</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{facility.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{facility.desc}</p>

                  {/* Underwriting prerequisites list */}
                  <div className="mt-3 space-y-1 text-[11px] font-mono border-t border-slate-800/80 pt-3 text-slate-400">
                    <div className="flex justify-between">
                      <span>Min Rank:</span>
                      <strong className={meetsRank ? 'text-emerald-400' : 'text-rose-400'}>Rank {facility.minRank}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Fleet:</span>
                      <strong className={meetsTrucks ? 'text-emerald-400' : 'text-rose-400'}>{facility.minTrucks} Trucks</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Terminals:</span>
                      <strong className={meetsHubs ? 'text-emerald-400' : 'text-rose-400'}>{facility.minHubs} Hubs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Net Worth:</span>
                      <strong className={meetsNetWorth ? 'text-emerald-400' : 'text-rose-400'}>${facility.minNetWorth.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Term Length:</span>
                    <span className="text-slate-200">{facility.days} Sim Days</span>
                  </div>
                  <button
                    onClick={() => handleApplyLoan(facility)}
                    disabled={!isEligible}
                    className={`w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                      isEligible
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {!isEligible ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isEligible ? `Draw $${(facility.amount / 1000).toFixed(0)}k Facility` : hasActiveLoans ? 'Active Debt Lock' : 'Underwriting Locked'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Loans & Repayment Panel */}
      {state.loans.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Active Corporate Debt Portfolio ({state.loans.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total Remaining Balance: <strong className="text-rose-400">${Math.round(totalActiveDebt).toLocaleString()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {state.loans.map((loan, idx) => (
              <div
                key={`${loan.id}-${idx}`}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold">Loan ID: {loan.id.slice(0, 12)}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                      {loan.daysRemaining} Days Remaining
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Daily Amortization Installment: <span className="text-white font-bold">${loan.dailyPaymentUsd}/day</span> ({(loan.annualInterestRate * 100).toFixed(1)}% APR)
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Remaining Principal</div>
                    <div className="text-white font-bold text-sm">${Math.round(loan.remainingBalanceUsd).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => repayLoan(loan.id, 50000)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Repay $50k
                    </button>
                    <button
                      onClick={() => repayLoan(loan.id, loan.remainingBalanceUsd)}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Settle Full Loan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Recursive Government & Industry Grants */}
      <div className="space-y-6 pt-6 border-t border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Recursive Government & Industry Subvention Grants</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-repayable government subventions that scale recursively as your logistics enterprise expands operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grantPrograms.map((program) => {
            const Icon = program.icon;
            return (
              <div key={program.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Progress: <strong className="text-emerald-400">{Math.round(program.currentValue).toLocaleString()} {program.unit || program.units}</strong>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">{program.title}</h4>
                  <p className="text-xs text-slate-400 mb-4">{program.description}</p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-none">
                    {program.tiers.map((t) => {
                      const grantKey = `${program.id}_tier_${t.tier}`;
                      const isClaimed = claimedGrantTiers.includes(grantKey);
                      const isUnlocked = program.currentValue >= t.target;

                      return (
                        <div
                          key={t.tier}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                            isClaimed
                              ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-400'
                              : isUnlocked
                              ? 'bg-slate-950/80 border-amber-500/40 text-white'
                              : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white">Tier {t.tier}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Target: {t.target.toLocaleString()} {program.unit || program.units}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-bold">+${t.reward.toLocaleString()}</span>
                            <button
                              disabled={!isUnlocked || isClaimed}
                              onClick={() => handleClaimGrantTier(program.title, grantKey, t.reward, t.tier)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                                isClaimed
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : isUnlocked
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              {isClaimed ? 'Claimed' : isUnlocked ? 'Claim Grant' : 'Locked'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

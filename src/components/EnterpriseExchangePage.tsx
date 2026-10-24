import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Briefcase,
  TrendingUp,
  Globe,
  ShieldCheck,
  Building2,
  DollarSign,
  Coins,
  Award,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Landmark,
  FileText,
  BadgePercent,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface EnterpriseExchangePageProps {
  onOpenLedger: () => void;
}

export const EnterpriseExchangePage: React.FC<EnterpriseExchangePageProps> = ({ onOpenLedger }) => {
  const { state, setState, notifyUser } = useGame();
  const [activeTab, setActiveTab] = useState<'b2b' | 'bonds' | 'ma' | 'tariffs'>('b2b');

  // Local state for active corporate deals & bonds
  const [issuedBonds, setIssuedBonds] = useState<Array<{ id: string; name: string; principalUsd: number; interestRate: number; termDays: number; daysElapsed: number }>>([]);
  const [acquiredEquities, setAcquiredEquities] = useState<Array<{ id: string; name: string; costUsd: number; dailyDividendUsd: number; equityPct: number }>>([]);
  const [activePacts, setActivePacts] = useState<Array<{ id: string; name: string; costUsd: number; bonusPct: number }>>([]);

  const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;

  // B2B International Supply Deals
  const b2bDeals = [
    {
      id: 'b2b-auto',
      title: 'Trans-Continental Automotive Supply Accord',
      partner: 'Apex Motor Corp (Germany & USA)',
      volume: '15,000 tons / month',
      payoutUsd: 145000,
      signingBonusUsd: 25000,
      minRank: 3,
      durationDays: 30,
    },
    {
      id: 'b2b-tech',
      title: 'Semiconductor & Microchip Global Logistics',
      partner: 'Silicon Valley & Taipei Tech Grid',
      volume: '8,500 tons / month',
      payoutUsd: 210000,
      signingBonusUsd: 45000,
      minRank: 5,
      durationDays: 45,
    },
    {
      id: 'b2b-energy',
      title: 'Strategic Petroleum Reserve & Cryogenic Bulk',
      partner: 'Nordic Energy & Gulf Refining',
      volume: '35,000 tons / month',
      payoutUsd: 380000,
      signingBonusUsd: 75000,
      minRank: 7,
      durationDays: 60,
    },
    {
      id: 'b2b-retail',
      title: 'Global E-Commerce Fulfillment Backbone',
      partner: 'OmniShelf Megastores International',
      volume: '50,000 tons / month',
      payoutUsd: 550000,
      signingBonusUsd: 120000,
      minRank: 9,
      durationDays: 90,
    },
  ];

  // Corporate Bonds
  const bondOfferings = [
    { id: 'bond-250k', name: 'Series A Senior Freight Bond', principalUsd: 250000, interestRate: 0.052, termDays: 30 },
    { id: 'bond-1m', name: 'Global Infrastructure Expansion Bond', principalUsd: 1000000, interestRate: 0.065, termDays: 60 },
    { id: 'bond-5m', name: 'Intercontinental Logistics Syndicate Note', principalUsd: 5000000, interestRate: 0.078, termDays: 90 },
  ];

  // M&A Subsidiary Targets
  const subsidiaryTargets = [
    { id: 'sub-iberia', name: 'Iberia Express Freight S.A. (Madrid)', costUsd: 450000, dailyDividendUsd: 14500, equityPct: 51, minRank: 4 },
    { id: 'sub-midwest', name: 'Midwest Heavy Haul & Rail-Bridge Inc.', costUsd: 1250000, dailyDividendUsd: 41000, equityPct: 100, minRank: 6 },
    { id: 'sub-singapore', name: 'Pacific Rim Maritime & Port Logistics', costUsd: 3500000, dailyDividendUsd: 125000, equityPct: 100, minRank: 8 },
  ];

  // International Customs Pacts
  const customsPacts = [
    { id: 'pact-nafta', name: 'USMCA North American Express Corridor Pact', costUsd: 150000, bonusPct: 0.15, desc: 'Eliminates border wait times across US, Canada, and Mexico.' },
    { id: 'pact-eu', name: 'Schengen Single-Market Freight Green Lane', costUsd: 350000, bonusPct: 0.25, desc: 'Priority customs clearance across all European Union member states.' },
    { id: 'pact-global', name: 'WTO Global Customs Fast-Pass Sovereign Accord', costUsd: 1200000, bonusPct: 0.40, desc: 'Absolute priority sovereign transit rights across all global trade corridors.' },
  ];

  const handleSignB2B = (deal: typeof b2bDeals[0]) => {
    if (state.playerRank < deal.minRank) {
      notifyUser('Rank Restriction', `This international B2B accord requires Carrier Rank ${deal.minRank} (${deal.partner}).`, 'finance');
      return;
    }
    if (!window.confirm(`Authorize International B2B Contract with ${deal.partner}?\n\nSigning Bonus: +$${deal.signingBonusUsd.toLocaleString()}\nMonthly Payout: $${deal.payoutUsd.toLocaleString()}\nDuration: ${deal.durationDays} Days`)) {
      return;
    }

    setState((prev) => ({
      ...prev,
      balanceUsd: prev.balanceUsd + deal.signingBonusUsd,
      playerXp: prev.playerXp + 2500,
    }));
    notifyUser('💼 International Accord Signed', `Successfully contracted with ${deal.partner}. Upstream signing bonus of +$${deal.signingBonusUsd.toLocaleString()} credited.`, 'delivery');
  };

  const handleIssueBond = (bond: typeof bondOfferings[0]) => {
    if (!window.confirm(`Issue ${bond.name} for $${bond.principalUsd.toLocaleString()}?\n\nCapital raised will be credited immediately to corporate treasury.\nInterest rate: ${(bond.interestRate * 100).toFixed(1)}% over ${bond.termDays} days.`)) {
      return;
    }

    setIssuedBonds((prev) => [...prev, { ...bond, daysElapsed: 0 }]);
    setState((prev) => ({
      ...prev,
      balanceUsd: prev.balanceUsd + bond.principalUsd,
    }));
    notifyUser('🏛️ Freight Bond Issued', `Raised $${bond.principalUsd.toLocaleString()} via institutional capital markets.`, 'finance');
  };

  const handleAcquireSubsidiary = (sub: typeof subsidiaryTargets[0]) => {
    if (state.playerRank < sub.minRank) {
      notifyUser('Rank Restriction', `M&A acquisition requires Carrier Rank ${sub.minRank}.`, 'finance');
      return;
    }
    if (state.balanceUsd < sub.costUsd) {
      notifyUser('Insufficient Capital', `Acquisition cost is $${sub.costUsd.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return;
    }
    if (!window.confirm(`Proceed with corporate acquisition of ${sub.name}?\n\nAcquisition Cost: $${sub.costUsd.toLocaleString()}\nProjected Daily Dividend: +$${sub.dailyDividendUsd.toLocaleString()} / day`)) {
      return;
    }

    setAcquiredEquities((prev) => [...prev, sub]);
    setState((prev) => ({
      ...prev,
      balanceUsd: prev.balanceUsd - sub.costUsd,
      playerXp: prev.playerXp + 5000,
    }));
    notifyUser('🏢 Subsidiary Acquired', `Successfully completed M&A acquisition of ${sub.name}. Daily equity dividends secured.`, 'delivery');
  };

  const handlePurchasePact = (pact: typeof customsPacts[0]) => {
    if (activePacts.some((p) => p.id === pact.id)) {
      notifyUser('Already Active', 'This international trade pact is already ratified.', 'finance');
      return;
    }
    if (state.balanceUsd < pact.costUsd) {
      notifyUser('Insufficient Capital', `Pact ratification cost is $${pact.costUsd.toLocaleString()}.`, 'finance');
      return;
    }
    if (!window.confirm(`Ratify ${pact.name}?\n\nCost: $${pact.costUsd.toLocaleString()}\nBenefit: +${(pact.bonusPct * 100).toFixed(0)}% freight corridor payout multiplier.`)) {
      return;
    }

    setActivePacts((prev) => [...prev, pact]);
    setState((prev) => ({
      ...prev,
      balanceUsd: prev.balanceUsd - pact.costUsd,
    }));
    notifyUser('🌐 Trade Pact Ratified', `Successfully ratified ${pact.name}.`, 'delivery');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
              <Landmark className="w-4 h-4" /> Global Corporate Banking & Capital Markets
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Exchange & International Trade
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Conduct high-level international trade accords, issue institutional corporate bonds, execute M&A subsidiary acquisitions, and ratify sovereign customs fast-pass pacts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLedger}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" /> View P&L Ledger
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('b2b')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'b2b'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Briefcase className="w-4 h-4" /> B2B Supply Accords ({b2bDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('bonds')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'bonds'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <FileText className="w-4 h-4" /> Debt Capital & Bonds ({issuedBonds.length})
          </button>
          <button
            onClick={() => setActiveTab('ma')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ma'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Building2 className="w-4 h-4" /> M&A Subsidies ({acquiredEquities.length})
          </button>
          <button
            onClick={() => setActiveTab('tariffs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'tariffs'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Globe className="w-4 h-4" /> Customs Pacts ({activePacts.length})
          </button>
        </div>
      </div>

      {/* Tab 1: B2B International Accords */}
      {activeTab === 'b2b' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {b2bDeals.map((deal) => {
            const isUnlocked = state.playerRank >= deal.minRank;
            return (
              <div key={deal.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      {deal.partner}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Duration: {deal.durationDays} Days</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{deal.title}</h3>
                  <div className="text-xs text-slate-400 mb-4">Required Volume: <strong className="text-slate-200">{deal.volume}</strong></div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500">Signing Bonus</div>
                      <div className="text-sm font-extrabold text-emerald-400 mt-0.5">+${deal.signingBonusUsd.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500">Monthly Payout</div>
                      <div className="text-sm font-extrabold text-cyan-400 mt-0.5">${deal.payoutUsd.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-amber-400">
                    {isUnlocked ? `Rank ${deal.minRank} Unlocked` : `Requires Rank ${deal.minRank}`}
                  </span>
                  <button
                    disabled={!isUnlocked}
                    onClick={() => handleSignB2B(deal)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isUnlocked
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} Sign B2B Accord
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Debt Capital & Bonds */}
      {activeTab === 'bonds' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2">Corporate Freight Bond Issuance</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tap institutional bond markets to raise upfront capital for enterprise fleet expansion and hub concessions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bondOfferings.map((bond) => (
                <div key={bond.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{bond.name}</h4>
                    <div className="text-2xl font-black text-cyan-400 my-2">${bond.principalUsd.toLocaleString()}</div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Coupon Interest:</span> <strong className="text-emerald-400">{(bond.interestRate * 100).toFixed(1)}%</strong></div>
                      <div className="flex justify-between"><span>Term Length:</span> <strong className="text-slate-200">{bond.termDays} Days</strong></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleIssueBond(bond)}
                    className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Issue Bond Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: M&A Subsidies */}
      {activeTab === 'ma' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subsidiaryTargets.map((sub) => {
            const isUnlocked = state.playerRank >= sub.minRank;
            return (
              <div key={sub.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {sub.equityPct}% Equity Stake
                    </span>
                    <span className="text-xs font-mono text-amber-400">Rank {sub.minRank}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-3">{sub.name}</h3>

                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Acquisition Cost:</span>
                      <strong className="text-white">${sub.costUsd.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Daily Dividend:</span>
                      <strong className="text-emerald-400">+${sub.dailyDividendUsd.toLocaleString()} / day</strong>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!isUnlocked || state.balanceUsd < sub.costUsd}
                  onClick={() => handleAcquireSubsidiary(sub)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isUnlocked && state.balanceUsd >= sub.costUsd
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {!isUnlocked ? `Requires Rank ${sub.minRank}` : state.balanceUsd < sub.costUsd ? 'Insufficient Capital' : 'Execute M&A Acquisition'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Customs Pacts */}
      {activeTab === 'tariffs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customsPacts.map((pact) => {
            const isRatified = activePacts.some((p) => p.id === pact.id);
            return (
              <div key={pact.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      +{(pact.bonusPct * 100).toFixed(0)}% Revenue Payout
                    </span>
                    {isRatified && <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ratified</span>}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{pact.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{pact.desc}</p>
                  <div className="text-sm font-extrabold text-cyan-400 mb-4">Cost: ${pact.costUsd.toLocaleString()}</div>
                </div>

                <button
                  disabled={isRatified || state.balanceUsd < pact.costUsd}
                  onClick={() => handlePurchasePact(pact)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isRatified && state.balanceUsd >= pact.costUsd
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {isRatified ? 'Pact Active' : state.balanceUsd < pact.costUsd ? 'Insufficient Capital' : 'Ratify Trade Pact'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

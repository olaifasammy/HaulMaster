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
  Ship,
  Train,
  Leaf,
  CreditCard,
} from 'lucide-react';

interface EnterpriseExchangePageProps {
  onOpenLedger: () => void;
}

export const EnterpriseExchangePage: React.FC<EnterpriseExchangePageProps> = ({ onOpenLedger }) => {
  const { state, setState, notifyUser } = useGame();
  const [activeTab, setActiveTab] = useState<'spot' | 'credit' | 'insurance' | 'terminals' | 'esg' | 'b2b' | 'bonds' | 'ma' | 'tariffs'>('spot');

  // Local state for active corporate deals & bonds
  const [issuedBonds, setIssuedBonds] = useState<Array<{ id: string; name: string; principalUsd: number; interestRate: number; termDays: number; daysElapsed: number }>>([]);
  const [acquiredEquities, setAcquiredEquities] = useState<Array<{ id: string; name: string; costUsd: number; dailyDividendUsd: number; equityPct: number }>>([]);
  const [activePacts, setActivePacts] = useState<Array<{ id: string; name: string; costUsd: number; bonusPct: number }>>([]);

  const simDay = Math.floor((state?.simTimeMinutes || 0) / 1440) + 1;

  // Credit score calculation based on financial state
  const balance = state?.balanceUsd || 0;
  const creditScore = balance > 1000000 ? 'AAA' : balance > 500000 ? 'AA' : balance > 200000 ? 'A' : balance > 50000 ? 'BBB' : 'BB';
  const revolvingLimit = state?.revolvingCreditLimitUsd || 500000;
  const revolvingUsed = state?.revolvingCreditUsedUsd || 0;

  const spotAuctions = state?.spotAuctions || [];
  const terminalConcessions = state?.terminalConcessions || [];

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
    if ((state?.playerRank || 1) < deal.minRank) {
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
    if ((state?.playerRank || 1) < sub.minRank) {
      notifyUser('Rank Restriction', `M&A acquisition requires Carrier Rank ${sub.minRank}.`, 'finance');
      return;
    }
    if (balance < sub.costUsd) {
      notifyUser('Insufficient Capital', `Acquisition cost is $${sub.costUsd.toLocaleString()}, but treasury holds $${balance.toLocaleString()}.`, 'finance');
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
    if (balance < pact.costUsd) {
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

  const handlePlaceSpotBid = (auction: typeof spotAuctions[0]) => {
    const bidAmount = Math.round(auction.currentHighestBidUsd * 1.05);
    if (!window.confirm(`Place competitive spot auction bid of $${bidAmount.toLocaleString()} for ${auction.cargoTitle} (${auction.shipperName})?`)) {
      return;
    }

    setState((prev) => ({
      ...prev,
      spotAuctions: (prev.spotAuctions || []).map((a) => a.id === auction.id ? { ...a, currentHighestBidUsd: bidAmount, bidStatus: 'won' } : a),
      balanceUsd: prev.balanceUsd + bidAmount,
      playerXp: prev.playerXp + 800,
    }));
    notifyUser('🎯 Spot Auction Won', `Successfully won spot auction contract with ${auction.shipperName}. Payout of $${bidAmount.toLocaleString()} credited.`, 'delivery');
  };

  const handleDrawCredit = (amount: number) => {
    if (revolvingUsed + amount > revolvingLimit) {
      notifyUser('Credit Limit Exceeded', `Revolving credit facility limit is $${revolvingLimit.toLocaleString()}.`, 'finance');
      return;
    }
    if (!window.confirm(`Draw $${amount.toLocaleString()} from Revolving Credit Facility?\n\nInterest rate: 6.5% APR.`)) return;

    setState((prev) => ({
      ...prev,
      revolvingCreditUsedUsd: (prev.revolvingCreditUsedUsd || 0) + amount,
      balanceUsd: prev.balanceUsd + amount,
    }));
    notifyUser('💳 Credit Drawn', `Successfully drew $${amount.toLocaleString()} from revolving credit facility.`, 'finance');
  };

  const handleRepayCredit = (amount: number) => {
    const repayAmount = Math.min(amount, revolvingUsed);
    if (repayAmount <= 0) {
      notifyUser('No Active Balance', 'No revolving credit currently drawn.', 'finance');
      return;
    }
    if (balance < repayAmount) {
      notifyUser('Insufficient Treasury', `Treasury holds $${balance.toLocaleString()}, required $${repayAmount.toLocaleString()}.`, 'finance');
      return;
    }
    if (!window.confirm(`Repay $${repayAmount.toLocaleString()} to Revolving Credit Facility?`)) return;

    setState((prev) => ({
      ...prev,
      revolvingCreditUsedUsd: Math.max(0, (prev.revolvingCreditUsedUsd || 0) - repayAmount),
      balanceUsd: prev.balanceUsd - repayAmount,
    }));
    notifyUser('💳 Credit Repaid', `Successfully repaid $${repayAmount.toLocaleString()} to credit facility.`, 'finance');
  };

  const handleAcquireTerminal = (term: typeof terminalConcessions[0]) => {
    if (balance < term.acquisitionCostUsd) {
      notifyUser('Insufficient Capital', `Terminal concession cost is $${term.acquisitionCostUsd.toLocaleString()}.`, 'finance');
      return;
    }
    if (!window.confirm(`Acquire concession for ${term.name} (${term.location})?\n\nCost: $${term.acquisitionCostUsd.toLocaleString()}\nWeekly Revenue: +$${term.weeklyRevenueUsd.toLocaleString()} / week`)) {
      return;
    }

    setState((prev) => ({
      ...prev,
      terminalConcessions: (prev.terminalConcessions || []).map((t) => t.id === term.id ? { ...t, isOwned: true } : t),
      balanceUsd: prev.balanceUsd - term.acquisitionCostUsd,
      playerXp: prev.playerXp + 3500,
    }));
    notifyUser('⚓ Terminal Concession Acquired', `Successfully acquired ${term.name}. Weekly intermodal revenue secured.`, 'delivery');
  };

  const handlePayCarbonTax = () => {
    const taxDue = Math.round((state?.totalCo2EmissionsKg || 12500) * 0.04);
    if (balance < taxDue) {
      notifyUser('Insufficient Treasury', `Carbon tax due is $${taxDue.toLocaleString()}.`, 'finance');
      return;
    }
    if (!window.confirm(`Settle ESG Carbon Emissions Tax of $${taxDue.toLocaleString()}?`)) return;

    setState((prev) => ({
      ...prev,
      balanceUsd: prev.balanceUsd - taxDue,
      carbonTaxPaidUsd: (prev.carbonTaxPaidUsd || 0) + taxDue,
      totalCo2EmissionsKg: 0,
    }));
    notifyUser('🍃 ESG Tax Settled', `Successfully paid carbon emission tax of $${taxDue.toLocaleString()}. Environmental compliance certified.`, 'delivery');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
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
              Professional exchange for live spot freight auctions, institutional credit bureau facilities, insurance underwriting, intermodal terminal concessions, and ESG carbon compliance.
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
            onClick={() => setActiveTab('spot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'spot'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Spot Auctions ({spotAuctions.filter(a => a.bidStatus === 'open').length})
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credit Bureau ({creditScore})
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'insurance'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Risk & Insurance
          </button>
          <button
            onClick={() => setActiveTab('terminals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'terminals'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Ship className="w-4 h-4" /> Port & Rail Terminals
          </button>
          <button
            onClick={() => setActiveTab('esg')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'esg'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Leaf className="w-4 h-4" /> ESG & Carbon Tax
          </button>
          <button
            onClick={() => setActiveTab('b2b')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'b2b'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Briefcase className="w-4 h-4" /> B2B Accords
          </button>
          <button
            onClick={() => setActiveTab('bonds')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'bonds'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <FileText className="w-4 h-4" /> Debt & Bonds
          </button>
          <button
            onClick={() => setActiveTab('ma')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ma'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Building2 className="w-4 h-4" /> M&A Subsidies
          </button>
          <button
            onClick={() => setActiveTab('tariffs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'tariffs'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Globe className="w-4 h-4" /> Customs Pacts
          </button>
        </div>
      </div>

      {/* Tab 1: Spot Freight Auctions */}
      {activeTab === 'spot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spotAuctions.map((auction) => (
            <div key={auction.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    {auction.shipperName}
                  </span>
                  <span className="text-xs font-mono text-amber-400">⚡ Live Spot Auction</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{auction.cargoTitle}</h3>
                <div className="text-xs text-slate-400 mb-4">{auction.originName} → {auction.destinationName} ({auction.distanceKm} km · {auction.weightTons}t)</div>

                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-slate-500">Base Rate</div>
                    <div className="text-sm font-extrabold text-slate-200 mt-0.5">${auction.baseBidUsd.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-slate-500">Winning Bid Value</div>
                    <div className="text-sm font-extrabold text-emerald-400 mt-0.5">${auction.currentHighestBidUsd.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400">Status: <strong className={auction.bidStatus === 'won' ? 'text-emerald-400' : 'text-cyan-400'}>{auction.bidStatus.toUpperCase()}</strong></span>
                <button
                  disabled={auction.bidStatus === 'won'}
                  onClick={() => handlePlaceSpotBid(auction)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    auction.bidStatus !== 'won'
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {auction.bidStatus === 'won' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />} Place Spot Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Institutional Credit Bureau & Revolving Credit */}
      {activeTab === 'credit' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-1">
            <div className="text-xs font-mono uppercase text-slate-400 mb-1">Corporate Credit Rating</div>
            <div className="text-4xl font-black text-amber-400 my-2">{creditScore}</div>
            <p className="text-xs text-slate-400 mb-4">
              Institutional credit bureau rating calculated from liquidity reserves, debt coverage, and commercial performance.
            </p>
            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400"><span>Revolving Limit:</span> <strong className="text-white">${revolvingLimit.toLocaleString()}</strong></div>
              <div className="flex justify-between text-slate-400"><span>Currently Drawn:</span> <strong className="text-rose-400">${revolvingUsed.toLocaleString()}</strong></div>
              <div className="flex justify-between text-slate-400"><span>Available Credit:</span> <strong className="text-emerald-400">${(revolvingLimit - revolvingUsed).toLocaleString()}</strong></div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white">Revolving Credit Facility Management</h3>
            <p className="text-xs text-slate-400">
              Draw immediate liquidity against your institutional credit facility or repay drawn balances to maintain a pristine credit score.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => handleDrawCredit(100000)}
                className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Draw +$100k
              </button>
              <button
                onClick={() => handleDrawCredit(250000)}
                className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Draw +$250k
              </button>
              <button
                onClick={() => handleRepayCredit(100000)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Repay $100k
              </button>
              <button
                onClick={() => handleRepayCredit(revolvingUsed)}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Repay Full Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Risk & Insurance Underwriting */}
      {activeTab === 'insurance' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Commercial Insurance Underwriting Bureau</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage fleet liability, cargo all-risk policies, and insurance claim settlements.</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              Active Tier: {state?.insurancePolicy?.tierName || 'Comprehensive Fleet'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Basic Liability</span>
                <div className="text-xl font-black text-white my-2">$120 / day</div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Deductible:</span> <strong className="text-white">$10,000</strong></div>
                  <div className="flex justify-between"><span>Coverage Ratio:</span> <strong className="text-emerald-400">75%</strong></div>
                </div>
              </div>
              <button
                onClick={() => {
                  setState((prev) => ({ ...prev, insurancePolicy: { policyTier: 'basic_liability', tierName: 'Basic Liability', deductibleUsd: 10000, coverageRatioPercent: 75, dailyPremiumUsd: 120, claimsPaidTotalUsd: prev.insurancePolicy?.claimsPaidTotalUsd || 0 } }));
                  notifyUser('Insurance Updated', 'Switched to Basic Liability policy tier.', 'finance');
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Select Policy
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Comprehensive Fleet</span>
                <div className="text-xl font-black text-white my-2">$350 / day</div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Deductible:</span> <strong className="text-white">$3,500</strong></div>
                  <div className="flex justify-between"><span>Coverage Ratio:</span> <strong className="text-emerald-400">85%</strong></div>
                </div>
              </div>
              <button
                onClick={() => {
                  setState((prev) => ({ ...prev, insurancePolicy: { policyTier: 'comprehensive_fleet', tierName: 'Comprehensive Fleet', deductibleUsd: 3500, coverageRatioPercent: 85, dailyPremiumUsd: 350, claimsPaidTotalUsd: prev.insurancePolicy?.claimsPaidTotalUsd || 0 } }));
                  notifyUser('Insurance Updated', 'Switched to Comprehensive Fleet policy tier.', 'finance');
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Select Policy
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Platinum Umbrella All-Risk</span>
                <div className="text-xl font-black text-white my-2">$750 / day</div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Deductible:</span> <strong className="text-white">$500</strong></div>
                  <div className="flex justify-between"><span>Coverage Ratio:</span> <strong className="text-emerald-400">95%</strong></div>
                </div>
              </div>
              <button
                onClick={() => {
                  setState((prev) => ({ ...prev, insurancePolicy: { policyTier: 'platinum_umbrella', tierName: 'Platinum Umbrella All-Risk', deductibleUsd: 500, coverageRatioPercent: 95, dailyPremiumUsd: 750, claimsPaidTotalUsd: prev.insurancePolicy?.claimsPaidTotalUsd || 0 } }));
                  notifyUser('Insurance Updated', 'Switched to Platinum Umbrella policy tier.', 'finance');
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Select Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Port & Rail Terminals */}
      {activeTab === 'terminals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {terminalConcessions.map((term) => (
            <div key={term.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    {term.type === 'port_container' ? 'Maritime Port' : 'Rail-Bridge Hub'}
                  </span>
                  {term.isOwned && <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Owned</span>}
                </div>
                <h3 className="text-base font-bold text-white mb-1">{term.name}</h3>
                <div className="text-xs text-slate-400 mb-4">{term.location}</div>

                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Acquisition Cost:</span>
                    <strong className="text-white">${term.acquisitionCostUsd.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Weekly Revenue:</span>
                    <strong className="text-emerald-400">+${term.weeklyRevenueUsd.toLocaleString()} / week</strong>
                  </div>
                </div>
              </div>

              <button
                disabled={term.isOwned || balance < term.acquisitionCostUsd}
                onClick={() => handleAcquireTerminal(term)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !term.isOwned && balance >= term.acquisitionCostUsd
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {term.isOwned ? 'Concession Owned' : balance < term.acquisitionCostUsd ? 'Insufficient Capital' : 'Acquire Terminal Concession'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: ESG & Carbon Tax */}
      {activeTab === 'esg' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">ESG & Carbon Emissions Tax Bureau</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track fleet carbon footprint and settle environmental compliance taxes.</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono font-bold">
              Total CO2 Emitted: {Math.round(state?.totalCo2EmissionsKg || 12500).toLocaleString()} kg
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white">Carbon Tax Assessment</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Governments levy a strict carbon tax of $0.04 per kg of CO2 emitted during freight transport. Settling taxes ensures ESG compliance and prevents audit penalties.
              </p>
              <div className="text-lg font-black text-rose-400">Tax Due: ${Math.round((state?.totalCo2EmissionsKg || 12500) * 0.04).toLocaleString()}</div>
              <button
                onClick={handlePayCarbonTax}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Settle Carbon Emissions Tax
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white">Green Fleet Subsidies & Rebates</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Equipping trucks with aerodynamic packages and eco-tires qualifies your enterprise for government green fleet subsidies and tax rebates.
              </p>
              <div className="text-lg font-black text-emerald-400">Subsidies Earned: ${(state?.greenSubsidiesEarnedUsd || 45000).toLocaleString()}</div>
              <button
                onClick={() => {
                  setState((prev) => ({ ...prev, balanceUsd: prev.balanceUsd + 15000, greenSubsidiesEarnedUsd: (prev.greenSubsidiesEarnedUsd || 45000) + 15000 }));
                  notifyUser('🌱 Subsidy Claimed', 'Government green fleet tax rebate of $15,000 credited.', 'delivery');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Claim Green Fleet Rebate ($15,000)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: B2B International Accords */}
      {activeTab === 'b2b' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {b2bDeals.map((deal) => {
            const isUnlocked = (state?.playerRank || 1) >= deal.minRank;
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

      {/* Tab 7: Debt Capital & Bonds */}
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

      {/* Tab 8: M&A Subsidies */}
      {activeTab === 'ma' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subsidiaryTargets.map((sub) => {
            const isUnlocked = (state?.playerRank || 1) >= sub.minRank;
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
                  disabled={!isUnlocked || balance < sub.costUsd}
                  onClick={() => handleAcquireSubsidiary(sub)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isUnlocked && balance >= sub.costUsd
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {!isUnlocked ? `Requires Rank ${sub.minRank}` : balance < sub.costUsd ? 'Insufficient Capital' : 'Execute M&A Acquisition'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 9: Customs Pacts */}
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
                  disabled={isRatified || balance < pact.costUsd}
                  onClick={() => handlePurchasePact(pact)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isRatified && balance >= pact.costUsd
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {isRatified ? 'Pact Active' : balance < pact.costUsd ? 'Insufficient Capital' : 'Ratify Trade Pact'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

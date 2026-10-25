import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Coins,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  FileText,
  CheckCircle,
  ArrowRight,
  Info,
  Scale,
  Clock,
  Sparkles,
  Zap,
  Radio,
  Truck,
  HelpCircle,
} from 'lucide-react';
import { MacroWorldEvent, FleetIncidentRecord } from '../types/game';

interface IncidentsAndEventsPageProps {
  initialTab?: 'events' | 'incidents' | 'insurance' | 'gold';
  onOpenWorkshop?: (truckId: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const IncidentsAndEventsPage: React.FC<IncidentsAndEventsPageProps> = ({
  initialTab = 'events',
  onOpenWorkshop,
  onSelectTab,
}) => {
  const { state, buyGold, sellGold, upgradeInsurancePolicy, fileInsuranceClaim } = useGame();
  const [activeTab, setActiveTab] = useState<'events' | 'incidents' | 'insurance' | 'gold'>(initialTab);
  const [goldAmount, setGoldAmount] = useState<number>(5);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const simTime = state.simTimeMinutes || 0;
  const simDay = Math.floor(simTime / 1440) + 1;
  const spotPrice = state.goldMarket?.spotPriceUsd || 2540;
  const brokerFee = state.goldMarket?.brokerFeePercent || 1.5;
  const buyUnitCost = Math.round(spotPrice * (1 + brokerFee / 100));
  const sellUnitProceeds = Math.round(spotPrice * (1 - brokerFee / 100));

  const totalBuyCost = buyUnitCost * goldAmount;
  const totalSellProceeds = sellUnitProceeds * goldAmount;

  const handleBuy = () => {
    setActionError(null);
    setActionSuccess(null);
    if (goldAmount <= 0) return;
    if (state.balanceUsd < totalBuyCost) {
      setActionError(`Insufficient funds: Need $${totalBuyCost.toLocaleString()} USD in treasury. Available: $${state.balanceUsd.toLocaleString()}`);
      return;
    }
    const success = buyGold(goldAmount);
    if (success) {
      setActionSuccess(`Successfully purchased ${goldAmount} Gold Bullion units for $${totalBuyCost.toLocaleString()} USD.`);
    } else {
      setActionError('Gold acquisition failed.');
    }
  };

  const handleSell = () => {
    setActionError(null);
    setActionSuccess(null);
    if (goldAmount <= 0) return;
    if (state.gold < goldAmount) {
      setActionError(`Insufficient Gold reserves: You hold ${state.gold} Gold. Cannot sell ${goldAmount}.`);
      return;
    }
    const success = sellGold(goldAmount);
    if (success) {
      setActionSuccess(`Successfully liquidated ${goldAmount} Gold Bullion units for $${totalSellProceeds.toLocaleString()} USD into company treasury.`);
    } else {
      setActionError('Gold liquidation failed.');
    }
  };

  const activeEvents = state.activeEvents || [];
  const incidents = state.incidentHistory || [];

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === 'all') return true;
    return inc.severity === filterSeverity;
  });

  const insurance = state.insurancePolicy || {
    policyTier: 'comprehensive_fleet',
    tierName: 'Comprehensive Commercial Fleet Policy',
    deductibleUsd: 2500,
    coverageRatioPercent: 85,
    dailyPremiumUsd: 120,
    claimsPaidTotalUsd: 0,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Global Events & Commercial Risk Bureau</h2>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Day {simDay} Live Wire
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Macroeconomic shocks, real-world highway incidents, fleet accidents, and gold treasury valuation
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/60 rounded-xl px-4 gap-2 overflow-x-auto no-scrollbar shadow-md">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'events'
              ? 'text-amber-400 border-amber-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>World Events ({activeEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'incidents'
              ? 'text-amber-400 border-amber-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Incidents & Accidents ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gold')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'gold'
              ? 'text-amber-400 border-amber-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Gold Valuation & Exchange</span>
        </button>

        <button
          onClick={() => setActiveTab('insurance')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'insurance'
              ? 'text-amber-400 border-amber-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Fleet Insurance & Claims</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Action Success / Error Notifications */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs font-bold text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: WORLD EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Active Global Market Events & Shocks</span>
                  <span className="text-xs font-mono text-cyan-400 font-normal">
                    ({activeEvents.length} active)
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Real-world supply chain crises, weather anomalies, and regulatory blitzes that directly alter operating costs and payouts.
                </p>
              </div>
            </div>

            {activeEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No active global disruptions at this moment. Normal operating conditions across all corridors.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEvents.map((event) => {
                  const remainingMin = Math.max(0, event.expiresSimMinutes - simTime);
                  const remHours = Math.ceil(remainingMin / 60);
                  return (
                    <div
                      key={event.id}
                      className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden ${
                        event.severity === 'critical'
                          ? 'border-rose-500/50 shadow-rose-950/20'
                          : event.severity === 'high'
                          ? 'border-amber-500/50 shadow-amber-950/20'
                          : 'border-cyan-500/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {event.category === 'economic' ? '📈' : event.category === 'regulatory' ? '⚖️' : '❄️'}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-white">{event.title}</h5>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                {event.category} • {event.region || 'Global'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                              event.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : event.severity === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {event.severity}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>
                      </div>

                      {/* Modifiers Pill Strip */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                          {event.fuelPriceMultiplier && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              Diesel Spot: {event.fuelPriceMultiplier > 1 ? '+' : ''}
                              {Math.round((event.fuelPriceMultiplier - 1) * 100)}%
                            </span>
                          )}
                          {event.freightPayoutMultiplier && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              Freight Payouts: +{Math.round((event.freightPayoutMultiplier - 1) * 100)}%
                            </span>
                          )}
                          {event.accidentRiskMultiplier && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Hazard Risk: {event.accidentRiskMultiplier}x
                            </span>
                          )}
                          {event.inspectionFrequencyMultiplier && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              DOT Inspections: {event.inspectionFrequencyMultiplier}x
                            </span>
                          )}
                          {event.tollMultiplier && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              Highway Tolls: -{Math.round((1 - event.tollMultiplier) * 100)}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> Duration:
                          </span>
                          <span className="text-slate-200 font-bold">{remHours} hours remaining</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INCIDENTS & ACCIDENTS REGISTRY */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Commercial Fleet Incident & Accident Bureau</span>
                  <span className="text-xs font-mono text-slate-400">({incidents.length} recorded)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Official incident logs, roadside inspection citations, tire blowouts, jackknifes, and insurance claims.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Filter:</span>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Events ({incidents.length})</option>
                  <option value="minor_incident">Minor Incidents</option>
                  <option value="moderate_delay">Moderate Delays</option>
                  <option value="major_breakdown">Major Breakdowns</option>
                  <option value="severe_accident">Severe Accidents</option>
                </select>
              </div>
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No incident records matching current filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                            inc.severity === 'severe_accident'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : inc.severity === 'major_breakdown'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : inc.severity === 'moderate_delay'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {inc.severity.replace('_', ' ')}
                        </span>
                        <h5 className="text-xs font-bold text-white truncate">{inc.title}</h5>
                        <span className="text-[10px] font-mono text-slate-500">{inc.simTimeFormatted}</span>
                      </div>

                      <div className="text-xs text-slate-300 leading-snug">
                        <strong>Cause:</strong> {inc.rootCause}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400">
                        <span>
                          Truck: <strong className="text-slate-200">{inc.truckPlate}</strong> ({inc.truckModelName})
                        </span>
                        <span>
                          Driver: <strong className="text-slate-200">{inc.driverName}</strong>
                        </span>
                        <span>
                          Corridor: <strong className="text-slate-200">{inc.corridorName}</strong>
                        </span>
                        <span>Weather: {inc.weatherCondition}</span>
                      </div>
                    </div>

                    {/* Financial Claim & Cost Breakdown */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Gross Cost</div>
                        <div className="font-bold text-rose-400">${inc.directCostUsd.toLocaleString()}</div>
                      </div>

                      {inc.insuranceClaimUsd > 0 && (
                        <div className="md:mt-1">
                          <div className="text-[10px] text-emerald-500 uppercase">Insurance Payout</div>
                          <div className="font-bold text-emerald-400">+${inc.insuranceClaimUsd.toLocaleString()}</div>
                        </div>
                      )}

                      <div className="md:mt-1">
                        <div className="text-[10px] text-slate-400 uppercase">Net Expense</div>
                        <div className="font-bold text-amber-300">${inc.netExpenseUsd.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GOLD VALUATION & EXCHANGE */}
        {activeTab === 'gold' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Real Valuation: Gold Bullion vs. United States Dollar</span>
              </h4>
              <p className="text-xs text-slate-400">
                Gold in the logistics industry acts as a sovereign capital reserve, inflation hedge, and hard collateral for high-tier terminal acquisitions.
              </p>
            </div>

            {/* Live Gold Spot Price Ticker Card */}
            <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400 tracking-wider">
                    COMEX / LBMA Benchmark Spot Gold
                  </span>
                  <span className="flex items-center text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +{state.goldMarket?.dayChangePercent || 1.1}% Today
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
                  ${spotPrice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">USD / Troy Ounce</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap gap-4">
                  <span>Day High: ${state.goldMarket?.dayHighUsd || 2560}</span>
                  <span>•</span>
                  <span>Day Low: ${state.goldMarket?.dayLowUsd || 2505}</span>
                  <span>•</span>
                  <span>Broker Spread: {brokerFee}%</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs space-y-1 shrink-0">
                <div className="text-slate-400 text-[10px] uppercase">Corporate Gold Holding</div>
                <div className="text-amber-400 font-bold text-base">{state.gold} Troy Ounces</div>
                <div className="text-emerald-400 text-xs">≈ ${(state.gold * spotPrice).toLocaleString()} USD Value</div>
              </div>
            </div>

            {/* Valuation Purchasing Power Standard */}
            <div className="space-y-2">
              <h5 className="text-xs font-mono font-bold uppercase text-slate-300">
                Valuation Purchasing Power Equivalents (1 Gold = ${spotPrice.toLocaleString()} USD)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-amber-400 font-bold text-sm">18 Gold (≈ $45,000)</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Equivalent to a 7-Day Express AI Dispatcher License or complete heavy tandem axle overhaul.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-amber-400 font-bold text-sm">66 Gold (≈ $165,000)</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Equivalent to a 1-Month Corporate AI License or purchase of a new heavy commercial tractor.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-amber-400 font-bold text-sm">200 Gold (≈ $500,000)</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Equivalent to acquiring a major regional gateway hub concession or sovereign freight corridor.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Currency Swap Desk */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Treasury Bullion Exchange Desk</span>
                </h5>
                <span className="text-[11px] font-mono text-slate-400">
                  Instant settlement directly into working cash
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select amount */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-mono">Select or Enter Bullion Quantity (Troy Ounces):</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[1, 5, 10, 25, 50].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setGoldAmount(qty)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                          goldAmount === qty
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      value={goldAmount}
                      onChange={(e) => setGoldAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Pricing preview */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500">Buy Cost ({goldAmount} oz)</div>
                    <div className="text-rose-400 font-bold">${totalBuyCost.toLocaleString()} USD</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Sell Proceeds ({goldAmount} oz)</div>
                    <div className="text-emerald-400 font-bold">${totalSellProceeds.toLocaleString()} USD</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleBuy}
                  disabled={state.balanceUsd < totalBuyCost}
                  className="py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-4 h-4" />
                  <span>Buy {goldAmount} Gold (${totalBuyCost.toLocaleString()})</span>
                </button>

                <button
                  onClick={handleSell}
                  disabled={state.gold < goldAmount}
                  className="py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Liquidate {goldAmount} Gold (+${totalSellProceeds.toLocaleString()})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FLEET INSURANCE & CLAIMS */}
        {activeTab === 'insurance' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Commercial Motor Carrier Fleet Insurance</span>
              </h4>
              <p className="text-xs text-slate-400">
                Protects your corporate balance sheet from catastrophic jackknifes, pileups, roll-overs, and roadside cargo damage.
              </p>
            </div>

            {/* Current Active Policy */}
            <div className="p-5 bg-slate-950 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                  Current Active Policy
                </span>
                <h5 className="text-base font-bold text-white">{insurance.tierName}</h5>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 mt-1">
                  <span>
                    Coverage: <strong className="text-emerald-400">{insurance.coverageRatioPercent}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Deductible: <strong className="text-white">${insurance.deductibleUsd.toLocaleString()}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Daily Premium: <strong className="text-amber-400">${insurance.dailyPremiumUsd}/day</strong>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs shrink-0 text-right">
                <div className="text-slate-500 text-[10px] uppercase">Claims Paid Lifetime</div>
                <div className="text-emerald-400 font-bold text-base">
                  ${insurance.claimsPaidTotalUsd.toLocaleString()} USD
                </div>
              </div>
            </div>

            {/* Policy Tiers */}
            <div className="space-y-3">
              <h5 className="text-xs font-mono font-bold uppercase text-slate-300">
                Commercial Fleet Underwriting Tiers
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tier 1: Basic */}
                <div
                  className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between space-y-3 ${
                    insurance.policyTier === 'basic_liability' ? 'border-amber-500' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">Basic Liability</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">70% coverage • $5,000 deductible</div>
                    <div className="text-sm font-mono font-bold text-amber-400 mt-2">$50 / day</div>
                  </div>
                  <button
                    onClick={() => upgradeInsurancePolicy('basic_liability')}
                    disabled={insurance.policyTier === 'basic_liability'}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
                  >
                    {insurance.policyTier === 'basic_liability' ? 'Active Policy' : 'Select Basic ($50/d)'}
                  </button>
                </div>

                {/* Tier 2: Comprehensive */}
                <div
                  className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between space-y-3 ${
                    insurance.policyTier === 'comprehensive_fleet' ? 'border-emerald-500' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">Comprehensive Fleet</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">85% coverage • $2,500 deductible</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$120 / day</div>
                  </div>
                  <button
                    onClick={() => upgradeInsurancePolicy('comprehensive_fleet')}
                    disabled={insurance.policyTier === 'comprehensive_fleet'}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    {insurance.policyTier === 'comprehensive_fleet' ? 'Active Policy' : 'Select Comprehensive'}
                  </button>
                </div>

                {/* Tier 3: Platinum Umbrella */}
                <div
                  className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between space-y-3 ${
                    insurance.policyTier === 'platinum_umbrella' ? 'border-cyan-500' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">Platinum Umbrella</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">95% coverage • $1,000 deductible</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 mt-2">$280 / day</div>
                  </div>
                  <button
                    onClick={() => upgradeInsurancePolicy('platinum_umbrella')}
                    disabled={insurance.policyTier === 'platinum_umbrella'}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    {insurance.policyTier === 'platinum_umbrella' ? 'Active Policy' : 'Select Platinum ($280/d)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

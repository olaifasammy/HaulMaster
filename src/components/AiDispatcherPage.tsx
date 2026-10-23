import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Brain, RefreshCw, Zap, ShieldCheck, AlertCircle, CheckCircle, Loader2, Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface AiDispatcherPageProps {
  onOpenDispatch: (contractId?: string) => void;
}

export const AiDispatcherPage: React.FC<AiDispatcherPageProps> = ({ onOpenDispatch }) => {
  const { state, activateAiSuite, executeAiAutoDispatch } = useGame();
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(!state?.aiDispatcherActive);

  // Unified Form State
  const [selectedPlan, setSelectedPlan] = useState<'7d' | '1m' | 'auto' | 'year'>('1m');
  const [includeMaintenance, setIncludeMaintenance] = useState<boolean>(true);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);

  const isSubActive = !!(state?.aiDispatcherActive && (state?.simTimeMinutes || 0) < (state?.aiSubscriptionExpiresSimMinutes || 0));
  const remainingMinutes = Math.max(0, (state?.aiSubscriptionExpiresSimMinutes || 0) - (state?.simTimeMinutes || 0));
  const remainingDays = Math.ceil(remainingMinutes / 1440);

  const isMaintActive = !!(state?.aiFleetMaintenanceActive && (state?.simTimeMinutes || 0) < (state?.aiFleetMaintenanceExpiresSimMinutes || 0));
  const maintRemainingMinutes = Math.max(0, (state?.aiFleetMaintenanceExpiresSimMinutes || 0) - (state?.simTimeMinutes || 0));
  const maintRemainingDays = Math.ceil(maintRemainingMinutes / 1440);

  // Pricing Matrix
  const plans = {
    '7d': { days: 14, usd: 45000, gold: 40, label: '14-Day Express' },
    '1m': { days: 60, usd: 165000, gold: 120, label: '2-Month Corporate' },
    'auto': { days: 180, usd: 500000, gold: 350, label: '180-Day Enterprise' },
    'year': { days: 365, usd: 950000, gold: 650, label: '365-Day Annual Enterprise' },
  };
  const maintPlans = {
    '7d': { usd: 35000, gold: 35 },
    '1m': { usd: 120000, gold: 100 },
    'auto': { usd: 350000, gold: 280 },
    'year': { usd: 650000, gold: 500 },
  };

  const currentPlan = plans[selectedPlan];
  const currentMaint = includeMaintenance ? maintPlans[selectedPlan] : { usd: 0, gold: 0 };
  const totalUsd = currentPlan.usd + currentMaint.usd;
  const totalGold = currentPlan.gold + currentMaint.gold;

  const handleCheckout = (useGold: boolean) => {
    const costStr = useGold ? `${totalGold} Gold coins` : `$${totalUsd.toLocaleString()} USD`;
    const confirmed = window.confirm(`Confirm AI Suite subscription to ${currentPlan.label}${includeMaintenance ? ' + Autonomous Fleet Maintenance' : ''} for ${costStr}?`);
    if (!confirmed) return;

    const key = useGold ? 'gold' : 'usd';
    setCheckoutKey(key);
    setSuccessMsg(null);

    const success = activateAiSuite({
      planTier: selectedPlan,
      includeMaintenance,
      useGold,
      autoRenew,
    });

    setTimeout(() => {
      setCheckoutKey(null);
      if (success) {
        setSuccessMsg(`Successfully subscribed to AI Suite & Add-on!`);
        setIsExpanded(false); // Compact card immediately after successful payment
      }
    }, 400);
  };

  const handleAutoDispatch = () => {
    setLoading(true);
    setDispatchResult(null);
    setTimeout(() => {
      const res = executeAiAutoDispatch();
      setDispatchResult(res.message);
      setLoading(false);
    }, 400);
  };

  const contracts = state?.availableContracts || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Brain className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span>Neural AI Dispatcher & Enterprise Automation</span>
              <span className={`px-2.5 py-0.5 text-xs font-mono rounded-full border ${
                isSubActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {isSubActive ? `ACTIVE (${remainingDays}d remaining)` : 'LICENSE REQUIRED'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous route optimization, real-time fleet telemetry, and bulk automated job dispatch
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-bold">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Compacted vs Expanded Subscription & Checkout Card */}
      {isSubActive && !isExpanded ? (
        <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>AI Suite & Enterprise Automation Active</span>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {remainingDays} days remaining
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                <span>Auto-Renew: <strong className={state?.aiAutoRenew ? 'text-emerald-400' : 'text-slate-400'}>{state?.aiAutoRenew ? 'ON' : 'OFF'}</strong></span>
                <span>•</span>
                <span>Fleet Maintenance: <strong className={isMaintActive ? 'text-emerald-400' : 'text-slate-400'}>{isMaintActive ? `ACTIVE (${maintRemainingDays}d)` : 'INACTIVE'}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Manage Plan & Add-ons</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Suite & Add-on Subscription Hub</h3>
                <p className="text-xs text-slate-400">Select your corporate plan duration, checkmark optional add-ons, and bundle billing.</p>
              </div>
            </div>
            {isSubActive && (
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5"
              >
                <span>Collapse Summary</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Pick Plan Duration */}
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                1. Select AI Plan Duration
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(plans) as Array<keyof typeof plans>).map((tierKey) => {
                  const p = plans[tierKey];
                  const isSelected = selectedPlan === tierKey;
                  return (
                    <button
                      key={tierKey}
                      onClick={() => setSelectedPlan(tierKey)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[11px] font-mono text-cyan-400">
                        ${p.usd.toLocaleString()} <span className="text-slate-400">or</span> {p.gold} Gold
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 & 3: Add-ons & Auto-Renew */}
            <div className="space-y-4">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                2. Enterprise Add-ons & Billing Options
              </label>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                {/* Fleet Maintenance Add-on Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMaintenance}
                    onChange={(e) => setIncludeMaintenance(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Autonomous Fleet Maintenance Add-on</span>
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Automatically monitors fleet health and executes preventive servicing & overhauls (+${maintPlans[selectedPlan].usd.toLocaleString()} or {maintPlans[selectedPlan].gold} Gold).
                    </p>
                  </div>
                </label>

                {/* Auto-Renew Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white">Enable Auto-Renewal</span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Automatically bill company treasury upon expiration to prevent automation downtime.
                    </p>
                  </div>
                </label>
              </div>

              {/* Bundled Summary & Checkout Buttons */}
              <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Bundled Price:</span>
                  <span className="text-emerald-400 font-bold">${totalUsd.toLocaleString()} USD <span className="text-slate-400">or</span> {totalGold} Gold</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={checkoutKey !== null}
                    onClick={() => handleCheckout(false)}
                    className="py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {checkoutKey === 'usd' && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Pay USD (${totalUsd.toLocaleString()})</span>
                  </button>
                  <button
                    disabled={checkoutKey !== null}
                    onClick={() => handleCheckout(true)}
                    className="py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {checkoutKey === 'gold' && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Pay Gold ({totalGold} Gold)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Bulk Job Dispatcher Section */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Autonomous Bulk Job Dispatcher
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
            {contracts.length} available consignment(s)
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Instantly command the AI Neural Core to match idle trucks, ready drivers, and unlocked corridor routes to all available freight jobs simultaneously.
        </p>
        <button
          disabled={!isSubActive || loading || contracts.length === 0}
          onClick={handleAutoDispatch}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Executing AI Autonomous Dispatch...' : '⚡ Execute AI Auto-Dispatch All Eligible Jobs'}</span>
        </button>

        {dispatchResult && (
          <div className={`p-4 rounded-xl border text-xs font-mono font-bold flex items-center gap-3 animate-in fade-in ${
            dispatchResult.includes('Successfully') 
              ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300' 
              : 'bg-amber-500/25 border-amber-500/50 text-amber-300'
          }`}>
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{dispatchResult}</span>
          </div>
        )}
      </div>

      {/* AI Operation Feeds */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>AI Operation Feeds & Telemetry Logs</span>
          <span className="text-[10px] text-cyan-400 font-mono">Real-time neural stream</span>
        </h3>
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {(() => {
            const aiNotifications = (state?.notifications || []).filter(n => n.type === 'ai');
            if (aiNotifications.length === 0) {
              return (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No AI action logs recorded yet. Run autonomous auto-dispatch or subscribe to AI dispatcher tiers to generate neural feed events.
                </div>
              );
            }
            return aiNotifications.map((notif) => (
              <div key={notif.id} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 text-xs hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[240px]">{notif.title}</span>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{notif.simTimeFormatted}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {notif.message}
                </p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

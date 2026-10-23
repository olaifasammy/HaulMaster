import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Brain, RefreshCw, Zap, ShieldCheck, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AiDispatcherPageProps {
  onOpenDispatch: (contractId?: string) => void;
}

export const AiDispatcherPage: React.FC<AiDispatcherPageProps> = ({ onOpenDispatch }) => {
  const { state, activateAiDispatcher, executeAiAutoDispatch } = useGame();
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSubActive = !!(state?.aiDispatcherActive && (state?.simTimeMinutes || 0) < (state?.aiSubscriptionExpiresSimMinutes || 0));
  const remainingMinutes = Math.max(0, (state?.aiSubscriptionExpiresSimMinutes || 0) - (state?.simTimeMinutes || 0));
  const remainingDays = Math.ceil(remainingMinutes / 1440);

  const handlePurchase = (tier: '7d' | '1m' | 'auto', useGold: boolean, label: string, costStr: string) => {
    const confirmed = window.confirm(`Confirm acquisition of ${label} for ${costStr}?`);
    if (!confirmed) return;

    const key = `${tier}-${useGold ? 'gold' : 'usd'}`;
    setPurchasingKey(key);
    setSuccessMsg(null);

    const success = activateAiDispatcher(tier, useGold);
    setTimeout(() => {
      setPurchasingKey(null);
      if (success) {
        setSuccessMsg(`Successfully activated ${label}!`);
      }
    }, 350);
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
  const hubs = state?.hubs || [];

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

      {/* Subscription Status Banner */}
      {isSubActive ? (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>AI Dispatcher Operational License Active</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-emerald-300 font-mono mt-0.5">
                Subscription active for another {remainingDays} simulation day(s). You can extend or renew your enterprise pass below.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>AI Dispatcher Subscription Required (Select Tier Below)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Autonomous bulk job dispatching requires an active corporate software license. Choose from 7-Day Express, 1-Month Corporate, or Monthly Auto-Renewal Enterprise tiers.
          </p>
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

      {/* Corporate Subscription Tiers & Pricing */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 px-1">
          Corporate Subscription Tiers & Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: 14 Days */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl">
            <div>
              <div className="text-sm font-bold text-white">14-Day Express</div>
              <div className="text-xs text-slate-400 mt-0.5">Bi-weekly license</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-3">$45,000 USD</div>
              <div className="text-xs font-mono text-amber-400">or 40 Gold</div>
            </div>
            <div className="space-y-2">
              <button
                disabled={purchasingKey !== null}
                onClick={() => handlePurchase('7d', false, '14-Day Express License', '$45,000')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
              >
                {purchasingKey === '7d-usd' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{purchasingKey === '7d-usd' ? 'Processing...' : 'Buy ($45k USD)'}</span>
              </button>
              <button
                disabled={purchasingKey !== null}
                onClick={() => handlePurchase('7d', true, '14-Day Express License (Gold)', '40 Gold')}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-amber-500/30 flex items-center justify-center gap-2"
              >
                {purchasingKey === '7d-gold' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{purchasingKey === '7d-gold' ? 'Processing...' : 'Buy (40 Gold)'}</span>
              </button>
            </div>
          </div>

          {/* Tier 2: 2 Months (60 Days) */}
          <div className="p-5 bg-slate-900 border border-amber-500/40 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-bl">
              Popular
            </div>
            <div>
              <div className="text-sm font-bold text-white">2-Month Corporate</div>
              <div className="text-xs text-slate-400 mt-0.5">60 simulation days</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-3">$165,000 USD</div>
              <div className="text-xs font-mono text-amber-400">or 120 Gold</div>
            </div>
            <div className="space-y-2">
              <button
                disabled={purchasingKey !== null}
                onClick={() => handlePurchase('1m', false, '2-Month Corporate License', '$165,000')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {purchasingKey === '1m-usd' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{purchasingKey === '1m-usd' ? 'Processing...' : 'Buy ($165k USD)'}</span>
              </button>
              <button
                disabled={purchasingKey !== null}
                onClick={() => handlePurchase('1m', true, '2-Month Corporate License (Gold)', '120 Gold')}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-amber-500/30 flex items-center justify-center gap-2"
              >
                {purchasingKey === '1m-gold' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{purchasingKey === '1m-gold' ? 'Processing...' : 'Buy (120 Gold)'}</span>
              </button>
            </div>
          </div>

          {/* Tier 3: Enterprise Long-Term (180 Days) */}
          <div className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-bl">
              Enterprise
            </div>
            <div>
              <div className="text-sm font-bold text-white">Enterprise Long-Term</div>
              <div className="text-xs text-slate-400 mt-0.5">180-day extended pass</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-3">$500,000 USD</div>
              <div className="text-xs font-mono text-amber-400">or 350 Gold</div>
            </div>
            <div className="space-y-2">
              <button
                disabled={purchasingKey !== null}
                onClick={() => handlePurchase('auto', false, 'Enterprise Long-Term Tier', '$500,000')}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {purchasingKey === 'auto-usd' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{purchasingKey === 'auto-usd' ? 'Processing...' : 'Buy ($500k USD)'}</span>
              </button>
              <button
                disabled={purchasingKey !== null}
                onClick={() => handlePurchase('auto', true, 'Enterprise Long-Term Tier (Gold)', '350 Gold')}
                className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-cyan-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-cyan-500/30 flex items-center justify-center gap-2"
              >
                {purchasingKey === 'auto-gold' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{purchasingKey === 'auto-gold' ? 'Processing...' : 'Buy (350 Gold)'}</span>
              </button>
            </div>
          </div>
        </div>
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

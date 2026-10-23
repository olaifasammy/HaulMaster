import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Brain, X, Send, RefreshCw, Zap, ShieldCheck, Coins, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface AiDispatcherModalProps {
  onClose: () => void;
  onOpenDispatch: (contractId?: string) => void;
}

export const AiDispatcherModal: React.FC<AiDispatcherModalProps> = ({ onClose, onOpenDispatch }) => {
  const { state, activateAiDispatcher, executeAiAutoDispatch } = useGame();
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  const isSubActive = state.aiDispatcherActive && state.simTimeMinutes < state.aiSubscriptionExpiresSimMinutes;
  const remainingMinutes = Math.max(0, state.aiSubscriptionExpiresSimMinutes - state.simTimeMinutes);
  const remainingDays = Math.ceil(remainingMinutes / 1440);

  const handleAutoDispatch = () => {
    setLoading(true);
    setDispatchResult(null);
    setTimeout(() => {
      const res = executeAiAutoDispatch();
      setDispatchResult(res.message);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Neural AI Dispatcher & Enterprise Automation</span>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                  isSubActive 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {isSubActive ? `ACTIVE (${remainingDays}d remaining)` : 'LICENSE REQUIRED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Autonomous route optimization, real-time fleet telemetry, and bulk automated job dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Subscription Banner */}
          {isSubActive ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>AI Dispatcher is Active</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                    No duplicate charges will occur. Subscription active for another {remainingDays} simulation day(s). You can choose to extend your license below.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>AI Dispatcher Subscription Required (Select Tier Below)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Autonomous bulk job dispatching requires an active corporate software license. Choose from 7-Day Express, 1-Month Corporate, or Monthly Auto-Renewal Enterprise tiers.
              </p>
            </div>
          )}

          {/* Pricing Tiers Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Corporate Subscription Tiers & Pricing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tier 1: 7 Days */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3 hover:border-cyan-500/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">7-Day Express</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Weekly trial license</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$45,000 USD</div>
                  <div className="text-[10px] font-mono text-amber-400">or 40 Gold</div>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => activateAiDispatcher('7d', false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
                  >
                    Buy ($45k)
                  </button>
                  <button
                    onClick={() => activateAiDispatcher('7d', true)}
                    className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer border border-amber-500/30"
                  >
                    Buy (40 Gold)
                  </button>
                </div>
              </div>

              {/* Tier 2: 1 Month */}
              <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                  Popular
                </div>
                <div>
                  <div className="text-xs font-bold text-white">1-Month Corporate</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">30 simulation days</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$165,000 USD</div>
                  <div className="text-[10px] font-mono text-amber-400">or 120 Gold</div>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => activateAiDispatcher('1m', false)}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    Buy ($165k)
                  </button>
                  <button
                    onClick={() => activateAiDispatcher('1m', true)}
                    className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer border border-amber-500/30"
                  >
                    Buy (120 Gold)
                  </button>
                </div>
              </div>

              {/* Tier 3: Monthly Auto-Renewal Enterprise */}
              <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                  Auto-Renew
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Enterprise Auto-Renewal</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">90-day extended pass</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$500,000 USD</div>
                  <div className="text-[10px] font-mono text-amber-400">or 350 Gold</div>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => activateAiDispatcher('auto', false)}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    Buy ($500k)
                  </button>
                  <button
                    onClick={() => activateAiDispatcher('auto', true)}
                    className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer border border-cyan-500/30"
                  >
                    Buy (350 Gold)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Auto-Dispatch Section */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Autonomous Bulk Job Dispatcher
                </h4>
              </div>
              <span className="text-[11px] font-mono text-cyan-300">
                {state.availableContracts.length} available consignment(s)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly command the AI Neural Core to match idle trucks, ready drivers, and unlocked corridor routes to all available freight jobs simultaneously.
            </p>
            <button
              disabled={!isSubActive || loading || state.availableContracts.length === 0}
              onClick={handleAutoDispatch}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Executing AI Autonomous Dispatch...' : '⚡ Execute AI Auto-Dispatch All Eligible Jobs'}</span>
            </button>

            {dispatchResult && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300">
                {dispatchResult}
              </div>
            )}
          </div>

          {/* Available Jobs Quick List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Live Freight Exchange
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.availableContracts.map((contract) => {
                const origin = state.hubs.find(h => h.id === contract.originHubId)?.name || contract.originHubId;
                const dest = state.hubs.find(h => h.id === contract.destinationHubId)?.name || contract.destinationHubId;
                return (
                  <div
                    key={contract.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between hover:border-cyan-500/40 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{contract.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {origin.split(' ')[0]} → {dest.split(' ')[0]} · {contract.weightTons}t · <span className="text-emerald-400 font-bold">${contract.payoutUsd.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDispatch(contract.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer border border-slate-700"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Manual Dispatch</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-[10px] font-mono text-slate-500">
            HaulMaster Neural Logistics & Autonomous Fleet Dispatcher
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

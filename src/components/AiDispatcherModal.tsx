import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Brain, X, RefreshCw, Zap, ShieldCheck, AlertCircle, CheckCircle, Loader2, Lock, DollarSign, Coins } from 'lucide-react';

interface AiDispatcherModalProps {
  onClose: () => void;
  onOpenDispatch: (contractId?: string) => void;
}

export const AiDispatcherModal: React.FC<AiDispatcherModalProps> = ({ onClose, onOpenDispatch }) => {
  const { state, activateAiDispatcher, executeAiAutoDispatch } = useGame();
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allowExtension, setAllowExtension] = useState<boolean>(false);

  const simTime = state?.simTimeMinutes || 0;
  const isSubActive = !!(state?.aiDispatcherActive && simTime < (state?.aiSubscriptionExpiresSimMinutes || 0));

  const formatDetailedRemaining = (expiresMin: number, currentMin: number) => {
    const diff = Math.max(0, expiresMin - currentMin);
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 1440);
    const hours = Math.floor((diff % 1440) / 60);
    const mins = diff % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m remaining`;
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  };

  const formatExpiryDate = (expiresMin: number) => {
    if (!expiresMin) return 'N/A';
    const day = Math.floor(expiresMin / 1440) + 1;
    const hours = Math.floor((expiresMin % 1440) / 60);
    const mins = expiresMin % 60;
    return `Day ${day} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const tiers = {
    '7d': { days: 7, usd: 45000, gold: 40, label: '7-Day Express' },
    '1m': { days: 30, usd: 165000, gold: 120, label: '1-Month Corporate' },
    'auto': { days: 30, usd: 145000, gold: 100, label: 'Monthly Auto-Renewal' },
  };

  const playerBal = state?.balanceUsd || 0;
  const playerGold = state?.gold || 0;

  const handlePurchase = (tier: '7d' | '1m' | 'auto', useGold: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cfg = tiers[tier];

    // Multi-deduction protection check
    if (isSubActive && !allowExtension) {
      setErrorMsg(
        `Subscription is currently active until ${formatExpiryDate(state?.aiSubscriptionExpiresSimMinutes || 0)} (${formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}). To prevent accidental double deductions, buttons are locked. Enable "Extend Existing Subscription" below if you wish to add days.`
      );
      return;
    }

    // Balance check
    if (useGold) {
      if (playerGold < cfg.gold) {
        setErrorMsg(`Insufficient Gold: Requires ${cfg.gold} Gold coins, but company holds ${playerGold}.`);
        return;
      }
    } else {
      if (playerBal < cfg.usd) {
        setErrorMsg(`Insufficient Treasury: Requires $${cfg.usd.toLocaleString()} USD, but company has $${playerBal.toLocaleString()} USD.`);
        return;
      }
    }

    const key = `${tier}-${useGold ? 'gold' : 'usd'}`;
    setPurchasingKey(key);

    try {
      const success = activateAiDispatcher(tier, useGold, allowExtension);
      setTimeout(() => {
        setPurchasingKey(null);
        if (success) {
          setSuccessMsg(`Successfully subscribed to ${cfg.label}! Autonomous dispatch is active.`);
          setAllowExtension(false);
        } else {
          setErrorMsg('Failed to activate subscription. Check your balance or active license.');
        }
      }, 350);
    } catch (err) {
      setPurchasingKey(null);
      setErrorMsg(`Activation error: ${err instanceof Error ? err.message : String(err)}`);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                <span>Neural AI Dispatcher</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                    isSubActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {isSubActive
                    ? `ACTIVE: ${formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}`
                    : 'LICENSE REQUIRED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Route optimization, continuous autonomous dispatching, and live freight allocation
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-400 hover:text-white text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-between gap-3 text-rose-300 text-xs font-bold animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="text-[11px] leading-relaxed font-normal">{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-white text-xs cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Subscription Banner */}
          {isSubActive ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>AI Dispatcher License Active</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                      Remaining: {formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400">
                  Expires on: <span className="text-slate-200 font-bold">{formatExpiryDate(state?.aiSubscriptionExpiresSimMinutes || 0)}</span>
                </div>
              </div>

              {/* Multi-Deduction Protection Lock Notice */}
              <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 font-mono">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Double-billing protection active. Payment buttons locked.</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowExtension}
                    onChange={(e) => setAllowExtension(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-cyan-400">
                    Extend Existing Subscription
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>AI Dispatcher License Required</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Autonomous fleet dispatch requires an active enterprise license. Select 7-Day Express, 1-Month Corporate, or Monthly Auto-Renewal below.
              </p>
            </div>
          )}

          {/* Company Treasury & Gold Reserves */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Company Treasury:
              </span>
              <span className="text-slate-100 font-bold">${playerBal.toLocaleString()} USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Gold Reserves:
              </span>
              <span className="text-amber-300 font-bold">{playerGold} Gold</span>
            </div>
          </div>

          {/* Pricing Tiers Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Subscription Tiers & Licensing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tier 1: 7 Days */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-white">7-Day Express</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">7 simulation days</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$45,000 USD</div>
                  <div className="text-[10px] font-mono text-amber-400">or 40 Gold</div>
                </div>
                <div className="space-y-1.5">
                  <button
                    disabled={purchasingKey !== null || (isSubActive && !allowExtension) || playerBal < 45000}
                    onClick={() => handlePurchase('7d', false)}
                    className={`w-full py-2 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : playerBal < 45000
                        ? 'bg-slate-800 text-rose-300/80 border border-rose-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {purchasingKey === '7d-usd' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSubActive && !allowExtension && <Lock className="w-3 h-3" />}
                    <span>
                      {isSubActive && !allowExtension
                        ? 'Active (Locked)'
                        : playerBal < 45000
                        ? 'Need $45k'
                        : 'Buy ($45k USD)'}
                    </span>
                  </button>
                  <button
                    disabled={purchasingKey !== null || (isSubActive && !allowExtension) || playerGold < 40}
                    onClick={() => handlePurchase('7d', true)}
                    className={`w-full py-1.5 font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                        : playerGold < 40
                        ? 'bg-amber-500/10 text-rose-300/80 border-rose-500/20'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {purchasingKey === '7d-gold' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{playerGold < 40 && (!isSubActive || allowExtension) ? 'Need 40 Gold' : 'Buy (40 Gold)'}</span>
                  </button>
                </div>
              </div>

              {/* Tier 2: 1 Month (30 Days) */}
              <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                  Recommended
                </div>
                <div>
                  <div className="text-xs font-bold text-white">1-Month Corporate</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">30 simulation days</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$165,000 USD</div>
                  <div className="text-[10px] font-mono text-amber-400">or 120 Gold</div>
                </div>
                <div className="space-y-1.5">
                  <button
                    disabled={purchasingKey !== null || (isSubActive && !allowExtension) || playerBal < 165000}
                    onClick={() => handlePurchase('1m', false)}
                    className={`w-full py-2 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : playerBal < 165000
                        ? 'bg-slate-800 text-rose-300/80 border border-rose-500/20'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    {purchasingKey === '1m-usd' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSubActive && !allowExtension && <Lock className="w-3 h-3" />}
                    <span>
                      {isSubActive && !allowExtension
                        ? 'Active (Locked)'
                        : playerBal < 165000
                        ? 'Need $165k'
                        : 'Buy ($165k USD)'}
                    </span>
                  </button>
                  <button
                    disabled={purchasingKey !== null || (isSubActive && !allowExtension) || playerGold < 120}
                    onClick={() => handlePurchase('1m', true)}
                    className={`w-full py-1.5 font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                        : playerGold < 120
                        ? 'bg-amber-500/10 text-rose-300/80 border-rose-500/20'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {purchasingKey === '1m-gold' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{playerGold < 120 && (!isSubActive || allowExtension) ? 'Need 120 Gold' : 'Buy (120 Gold)'}</span>
                  </button>
                </div>
              </div>

              {/* Tier 3: Monthly Auto-Renewal */}
              <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                  Auto-Renew
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Monthly Auto</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">30 days + continuous renew</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-2">$145,000 USD</div>
                  <div className="text-[10px] font-mono text-amber-400">or 100 Gold</div>
                </div>
                <div className="space-y-1.5">
                  <button
                    disabled={purchasingKey !== null || (isSubActive && !allowExtension) || playerBal < 145000}
                    onClick={() => handlePurchase('auto', false)}
                    className={`w-full py-2 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : playerBal < 145000
                        ? 'bg-slate-800 text-rose-300/80 border border-rose-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    }`}
                  >
                    {purchasingKey === 'auto-usd' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSubActive && !allowExtension && <Lock className="w-3 h-3" />}
                    <span>
                      {isSubActive && !allowExtension
                        ? 'Active (Locked)'
                        : playerBal < 145000
                        ? 'Need $145k'
                        : 'Buy ($145k USD)'}
                    </span>
                  </button>
                  <button
                    disabled={purchasingKey !== null || (isSubActive && !allowExtension) || playerGold < 100}
                    onClick={() => handlePurchase('auto', true)}
                    className={`w-full py-1.5 font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                        : playerGold < 100
                        ? 'bg-cyan-500/10 text-rose-300/80 border-rose-500/20'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {purchasingKey === 'auto-gold' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{playerGold < 100 && (!isSubActive || allowExtension) ? 'Need 100 Gold' : 'Buy (100 Gold)'}</span>
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
                {state?.availableContracts?.length || 0} available consignment(s)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly match idle trucks, available drivers, and unlocked regional freight corridors with the highest-yielding cargo consignments.
            </p>
            <button
              disabled={!isSubActive || loading || (state?.availableContracts?.length || 0) === 0}
              onClick={handleAutoDispatch}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Executing AI Autonomous Dispatch...' : '⚡ Execute AI Auto-Dispatch All Eligible Jobs'}</span>
            </button>

            {dispatchResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-3 animate-in fade-in ${
                  dispatchResult.includes('Successfully')
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{dispatchResult}</span>
              </div>
            )}
          </div>

          {/* Available Jobs Quick List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Live Freight Exchange
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(state?.availableContracts || []).map((contract) => {
                const origin = state?.hubs?.find((h) => h.id === contract.originHubId)?.name || contract.originHubId;
                const dest = state?.hubs?.find((h) => h.id === contract.destinationHubId)?.name || contract.destinationHubId;
                return (
                  <div
                    key={contract.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{contract.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {origin} ➔ {dest} · ${contract.payoutUsd.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDispatch(contract.id);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-mono text-[11px] border border-slate-700 cursor-pointer"
                    >
                      Dispatch
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Brain,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp,
  Lock,
  Clock,
  Sparkles,
  DollarSign,
  Coins,
} from 'lucide-react';

interface AiDispatcherPageProps {
  onOpenDispatch: (contractId?: string) => void;
}

export const AiDispatcherPage: React.FC<AiDispatcherPageProps> = ({ onOpenDispatch }) => {
  const { state, activateAiSuite, executeAiAutoDispatch, toggleAiAutoDispatch } = useGame();
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allowExtension, setAllowExtension] = useState<boolean>(false);

  // Unified Form State
  const [selectedPlan, setSelectedPlan] = useState<'7d' | '1m' | 'auto' | 'year'>('1m');
  const [includeMaintenance, setIncludeMaintenance] = useState<boolean>(true);
  const [includeOfflineDispatch, setIncludeOfflineDispatch] = useState<boolean>(true);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);

  const simTime = state?.simTimeMinutes || 0;
  const isSubActive = !!(state?.aiDispatcherActive && simTime < (state?.aiSubscriptionExpiresSimMinutes || 0));
  const [isExpanded, setIsExpanded] = useState<boolean>(!isSubActive);

  // Exact remaining time calculation
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

  const remainingDispMinutes = Math.max(0, (state?.aiSubscriptionExpiresSimMinutes || 0) - simTime);
  const remainingDispDays = Math.ceil(remainingDispMinutes / 1440);

  const isMaintActive = !!(state?.aiFleetMaintenanceActive && simTime < (state?.aiFleetMaintenanceExpiresSimMinutes || 0));
  const isOfflineActive = !!(state?.aiOfflineDispatchActive && simTime < (state?.aiOfflineDispatchExpiresSimMinutes || 0));

  const isAutoDispatchEligible = isSubActive || isOfflineActive;
  const isAutoDispatchRunning = isAutoDispatchEligible && (state?.aiAutoDispatchEnabled !== false);

  // Pricing Matrix (Accurate 7 Days, 1 Month, Monthly Auto, 1 Year)
  const plans = {
    '7d': { days: 7, usd: 45000, gold: 40, label: '7-Day Express License' },
    '1m': { days: 30, usd: 165000, gold: 120, label: '1-Month Corporate License' },
    'auto': { days: 30, usd: 145000, gold: 100, label: 'Monthly Auto-Renewal Enterprise' },
    'year': { days: 365, usd: 950000, gold: 650, label: '1-Year Annual Fleet License' },
  };
  const maintPlans = {
    '7d': { usd: 25000, gold: 20 },
    '1m': { usd: 85000, gold: 60 },
    'auto': { usd: 75000, gold: 50 },
    'year': { usd: 550000, gold: 400 },
  };
  const offlineDispatchPlans = {
    '7d': { usd: 25000, gold: 20 },
    '1m': { usd: 85000, gold: 60 },
    'auto': { usd: 75000, gold: 50 },
    'year': { usd: 550000, gold: 400 },
  };

  const currentPlan = plans[selectedPlan];
  const currentMaint = includeMaintenance ? maintPlans[selectedPlan] : { usd: 0, gold: 0 };
  const currentOffline = includeOfflineDispatch ? offlineDispatchPlans[selectedPlan] : { usd: 0, gold: 0 };
  const totalUsd = currentPlan.usd + currentMaint.usd + currentOffline.usd;
  const totalGold = currentPlan.gold + currentMaint.gold + currentOffline.gold;

  const playerBalanceUsd = state?.balanceUsd || 0;
  const playerGold = state?.gold || 0;
  const canAffordUsd = playerBalanceUsd >= totalUsd;
  const canAffordGold = playerGold >= totalGold;

  // Checkout Handler: Zero window.confirm, handles extension & multi-deduction prevention
  const handleCheckout = (useGold: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Multi-deduction protection check
    if (isSubActive && !allowExtension) {
      setErrorMsg(
        `Subscription is already active until ${formatExpiryDate(state?.aiSubscriptionExpiresSimMinutes || 0)} (${formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}). To prevent accidental double-billing, further payment deductions are locked. Check "Extend Existing Subscription" below if you wish to add days.`
      );
      return;
    }

    // Balance check
    if (useGold) {
      if (playerGold < totalGold) {
        setErrorMsg(
          `Cannot subscribe: Your company has ${playerGold} Gold, but this plan requires ${totalGold} Gold. Purchase or earn Gold through promotions and achievements.`
        );
        return;
      }
    } else {
      if (playerBalanceUsd < totalUsd) {
        setErrorMsg(
          `Cannot subscribe: Your company treasury has $${playerBalanceUsd.toLocaleString()} USD, but this plan requires $${totalUsd.toLocaleString()} USD. You can take a commercial loan in Finance or complete freight runs to build treasury.`
        );
        return;
      }
    }

    const key = useGold ? 'gold' : 'usd';
    setCheckoutKey(key);

    try {
      const success = activateAiSuite({
        planTier: selectedPlan,
        includeMaintenance,
        includeOfflineDispatch,
        useGold,
        autoRenew: selectedPlan === 'auto' ? true : autoRenew,
        allowExtension,
      });

      setTimeout(() => {
        setCheckoutKey(null);
        if (success) {
          setSuccessMsg(
            isSubActive
              ? `Successfully extended AI Suite subscription by ${currentPlan.days} days! Active until ${formatExpiryDate((state?.aiSubscriptionExpiresSimMinutes || 0) + currentPlan.days * 1440)}.`
              : `Successfully subscribed to AI Suite (${currentPlan.label})! Autonomous dispatch and selected add-ons are now active.`
          );
          setAllowExtension(false);
          setIsExpanded(false);
        } else {
          setErrorMsg('Subscription could not be activated. Check company balance and active status.');
        }
      }, 350);
    } catch (err) {
      setCheckoutKey(null);
      setErrorMsg(`Subscription activation error: ${err instanceof Error ? err.message : String(err)}`);
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
            <h2 className="text-xl font-bold text-white flex flex-wrap items-center gap-3">
              <span>Neural AI Dispatcher & Enterprise Automation</span>
              <span
                className={`px-2.5 py-0.5 text-xs font-mono rounded-full border ${
                  isSubActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {isSubActive
                  ? `ACTIVE: ${formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}`
                  : 'LICENSE REQUIRED'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous route optimization, real-time fleet telemetry, and continuous automated job dispatch
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
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

      {/* Error / Alert Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-between gap-3 text-rose-300 text-xs font-bold animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-200">Subscription Notice:</span>
              <p className="text-[11px] text-rose-300/90 font-normal leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white text-xs cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Autonomous Offline Dispatcher & Maintenance Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 shadow-md">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Autonomous Offline Fleet Redispatch</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              When active, the AI neural core automatically detects when trucks complete their hauls and become idle, instantly pairing them with lucrative regional consignments even while you are offline.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 shadow-md">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Autonomous Fleet Maintenance Add-on</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Works harmoniously alongside auto-dispatching to continuously monitor component wear, execute B-Services, and maintain 100% fleet reliability without human intervention.
            </p>
          </div>
        </div>
      </div>

      {/* Compacted vs Expanded Subscription & Checkout Card */}
      {isSubActive && !isExpanded ? (
        <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                <span>AI Suite & Enterprise Automation Active</span>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  (Valid until {formatExpiryDate(state?.aiSubscriptionExpiresSimMinutes || 0)})
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1.5 flex flex-wrap items-center gap-3">
                <span>
                  Auto-Dispatch:{' '}
                  <strong className={isAutoDispatchRunning ? 'text-cyan-400' : isAutoDispatchEligible ? 'text-amber-400' : 'text-slate-400'}>
                    {isAutoDispatchRunning ? 'CONTINUOUS ACTIVE' : isAutoDispatchEligible ? 'PAUSED' : 'INACTIVE'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Maintenance Add-on:{' '}
                  <strong className={isMaintActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {isMaintActive ? formatDetailedRemaining(state?.aiFleetMaintenanceExpiresSimMinutes || 0, simTime) : 'INACTIVE'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Auto-Renew: <strong className={state?.aiAutoRenew ? 'text-emerald-400' : 'text-slate-400'}>{state?.aiAutoRenew ? 'ON' : 'OFF'}</strong>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700 flex items-center gap-2 shrink-0"
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
                <p className="text-xs text-slate-400">
                  Select your corporate plan duration, checkmark optional add-ons, and manage automation billing.
                </p>
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

          {/* Active Subscription Countdown Breakdown if already active */}
          {isSubActive && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Active Subscription Status:</span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Expires on: <strong className="text-slate-200">{formatExpiryDate(state?.aiSubscriptionExpiresSimMinutes || 0)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono pt-1">
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">AI Neural Dispatcher</div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    {formatDetailedRemaining(state?.aiSubscriptionExpiresSimMinutes || 0, simTime)}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Offline Auto-Dispatch Add-on</div>
                  <div className={isOfflineActive ? 'text-cyan-400 font-bold mt-0.5' : 'text-slate-500 mt-0.5'}>
                    {isOfflineActive ? formatDetailedRemaining(state?.aiOfflineDispatchExpiresSimMinutes || 0, simTime) : 'Not Active'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Fleet Maintenance Add-on</div>
                  <div className={isMaintActive ? 'text-amber-400 font-bold mt-0.5' : 'text-slate-500 mt-0.5'}>
                    {isMaintActive ? formatDetailedRemaining(state?.aiFleetMaintenanceExpiresSimMinutes || 0, simTime) : 'Not Active'}
                  </div>
                </div>
              </div>

              {/* Multi-Deduction Protection Banner & Extension Toggle */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-amber-300/90 font-mono">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Multi-deduction protection enabled: Payment buttons are locked while an active plan is running.</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allowExtension}
                    onChange={(e) => setAllowExtension(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-cyan-400">
                    Extend Existing Subscription (+{currentPlan.label})
                  </span>
                </label>
              </div>
            </div>
          )}

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
                      <div>
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.days} simulation days</div>
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 font-bold">
                        ${p.usd.toLocaleString()} <span className="text-slate-400 font-normal">or</span> {p.gold} Gold
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 & 3: Add-ons & Billing */}
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
                      Continuously inspects fleet wear and executes preventive servicing & overhauls (+${maintPlans[selectedPlan].usd.toLocaleString()} or {maintPlans[selectedPlan].gold} Gold).
                    </p>
                  </div>
                </label>

                {/* Autonomous Offline Dispatch Add-on Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={includeOfflineDispatch}
                    onChange={(e) => setIncludeOfflineDispatch(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>Autonomous Offline AI Dispatcher Add-on</span>
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Continuously pairs idle trucks with regional freight contracts online and offline (+${offlineDispatchPlans[selectedPlan].usd.toLocaleString()} or {offlineDispatchPlans[selectedPlan].gold} Gold).
                    </p>
                  </div>
                </label>

                {/* Auto-Renew Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={selectedPlan === 'auto' || autoRenew}
                    disabled={selectedPlan === 'auto'}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Enable Auto-Renewal</span>
                      {selectedPlan === 'auto' && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                          Default on Auto Tier
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Automatically renew company license upon expiration to prevent automation downtime.
                    </p>
                  </div>
                </label>
              </div>

              {/* Bundled Summary & Direct Checkout Buttons */}
              <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Bundled Price:</span>
                  <span className="text-emerald-400 font-bold">
                    ${totalUsd.toLocaleString()} USD <span className="text-slate-400">or</span> {totalGold} Gold
                  </span>
                </div>

                {/* Player Current Treasury & Gold Status */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" /> Treasury:
                    </span>
                    <span className={canAffordUsd ? 'text-slate-200 font-bold' : 'text-rose-400 font-bold'}>
                      ${playerBalanceUsd.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" /> Gold:
                    </span>
                    <span className={canAffordGold ? 'text-amber-300 font-bold' : 'text-rose-400 font-bold'}>
                      {playerGold} Coins
                    </span>
                  </div>
                </div>

                {/* Payment Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={checkoutKey !== null || (isSubActive && !allowExtension) || !canAffordUsd}
                    onClick={() => handleCheckout(false)}
                    className={`py-2.5 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : !canAffordUsd
                        ? 'bg-slate-800/80 text-rose-300 border border-rose-500/30 hover:border-rose-500/50'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-cyan-500/20'
                    }`}
                    title={
                      isSubActive && !allowExtension
                        ? 'Subscription is active. Multi-deduction protected.'
                        : !canAffordUsd
                        ? `Insufficient treasury ($${playerBalanceUsd.toLocaleString()} available, $${totalUsd.toLocaleString()} needed)`
                        : `Pay $${totalUsd.toLocaleString()} USD from company treasury`
                    }
                  >
                    {checkoutKey === 'usd' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSubActive && !allowExtension ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : null}
                    <span>
                      {isSubActive && !allowExtension
                        ? 'Active (Locked)'
                        : !canAffordUsd
                        ? `Need $${totalUsd.toLocaleString()}`
                        : allowExtension
                        ? `Extend ($${totalUsd.toLocaleString()})`
                        : `Pay USD ($${totalUsd.toLocaleString()})`}
                    </span>
                  </button>

                  <button
                    disabled={checkoutKey !== null || (isSubActive && !allowExtension) || !canAffordGold}
                    onClick={() => handleCheckout(true)}
                    className={`py-2.5 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isSubActive && !allowExtension
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : !canAffordGold
                        ? 'bg-slate-800/80 text-rose-300 border border-rose-500/30 hover:border-rose-500/50'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20'
                    }`}
                    title={
                      isSubActive && !allowExtension
                        ? 'Subscription is active. Multi-deduction protected.'
                        : !canAffordGold
                        ? `Insufficient Gold (${playerGold} available, ${totalGold} needed)`
                        : `Pay ${totalGold} Gold coins`
                    }
                  >
                    {checkoutKey === 'gold' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSubActive && !allowExtension ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : null}
                    <span>
                      {isSubActive && !allowExtension
                        ? 'Active (Locked)'
                        : !canAffordGold
                        ? `Need ${totalGold} Gold`
                        : allowExtension
                        ? `Extend (${totalGold} Gold)`
                        : `Pay Gold (${totalGold} Gold)`}
                    </span>
                  </button>
                </div>

                {isSubActive && !allowExtension && (
                  <p className="text-[10px] text-center text-slate-400 font-mono pt-1">
                    🔒 Multi-deduction protection active. Check "Extend Existing Subscription" above if you wish to add days.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Auto-Dispatch Engine Section */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Autonomous Auto-Dispatch Engine
              </h3>
              <p className="text-xs text-slate-400">Continuous background job matching & manual instant fleet dispatch</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
            {contracts.length} available consignment(s)
          </span>
        </div>

        {/* Live Continuous Dispatch Engine Card */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isAutoDispatchRunning
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : isAutoDispatchEligible
              ? 'bg-amber-950/20 border-amber-500/30'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                isAutoDispatchRunning ? 'bg-emerald-400 animate-ping' : isAutoDispatchEligible ? 'bg-amber-400' : 'bg-slate-600'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Continuous Dispatching:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isAutoDispatchRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isAutoDispatchEligible
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isAutoDispatchRunning ? 'RUNNING AUTOMATICALLY' : isAutoDispatchEligible ? 'PAUSED' : 'LICENSE REQUIRED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {isAutoDispatchRunning
                  ? 'The AI Neural Core monitors your fleet every simulation tick. Idle trucks with rested drivers are automatically dispatched to eligible consignments online and offline.'
                  : isAutoDispatchEligible
                  ? 'Continuous background dispatching is paused. Trucks will remain parked until you resume automation or run manual dispatch.'
                  : 'Subscribe to the AI Suite or Autonomous Auto-Dispatch add-on to activate continuous background dispatching.'}
              </p>
            </div>
          </div>

          {isAutoDispatchEligible && (
            <button
              onClick={toggleAiAutoDispatch}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all shrink-0 cursor-pointer border ${
                isAutoDispatchRunning
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 shadow-md'
              }`}
            >
              {isAutoDispatchRunning ? 'Pause Engine' : 'Resume Engine'}
            </button>
          )}
        </div>

        {/* Manual Instant Trigger */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-300 leading-relaxed">
            Want to immediately dispatch all currently parked trucks without waiting for the next tick? Trigger instant bulk auto-dispatch below:
          </p>
          <button
            disabled={!isAutoDispatchEligible || loading || contracts.length === 0}
            onClick={handleAutoDispatch}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Executing AI Autonomous Dispatch...' : '⚡ Execute Instant Bulk Auto-Dispatch Now'}</span>
          </button>
        </div>

        {dispatchResult && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono font-bold flex items-center gap-3 animate-in fade-in ${
              dispatchResult.includes('Successfully')
                ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-500/25 border-amber-500/50 text-amber-300'
            }`}
          >
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
            const aiNotifications = (state?.notifications || []).filter((n) => n.type === 'ai');
            if (aiNotifications.length === 0) {
              return (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No AI action logs recorded yet. Run autonomous auto-dispatch or subscribe to AI dispatcher tiers to generate neural feed events.
                </div>
              );
            }
            return aiNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[240px]">{notif.title}</span>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {notif.simTimeFormatted}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{notif.message}</p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

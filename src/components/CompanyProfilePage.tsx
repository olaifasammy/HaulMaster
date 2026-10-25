import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Building2,
  Award,
  DollarSign,
  Truck,
  Package,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Brain,
  Database,
  ShieldAlert,
  Coins,
} from 'lucide-react';

interface CompanyProfilePageProps {
  onOpenAchievements: () => void;
  onOpenDatabase?: () => void;
  onOpenAiPage?: () => void;
  onOpenExchange: () => void;
  onOpenCryptoExchange: () => void;
  onOpenEventsPage: () => void;
}

export const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ onOpenAchievements, onOpenDatabase, onOpenAiPage, onOpenExchange, onOpenCryptoExchange, onOpenEventsPage }) => {
  const { state, resetGame } = useGame();
  const [companyNameInput, setCompanyNameInput] = useState<string>(state.companyName);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim()) return;
    state.companyName = companyNameInput.trim();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExecuteReset = () => {
    resetGame();
  };

  const totalTrucks = state.trucks.length;
  const totalTrailers = state.trailers?.length || 0;
  const totalDrivers = state.drivers.length;
  const totalHubsUnlocked = state.hubs.filter((h) => h.isUnlocked).length;
  const totalRoutesUnlocked = state.routes.filter((r) => r.isUnlocked).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Enterprise Profile & Management</h2>
            <p className="text-xs text-slate-400 mt-1">
              Corporate credentials, operational statistics, and executive control
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Company Identity & Rename */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
          Registered Corporate Identity
        </h3>
        <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={companyNameInput}
            onChange={(e) => setCompanyNameInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-white text-sm font-medium outline-none transition-colors"
            placeholder="Company Trade Name"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 shadow-md cursor-pointer"
          >
            Update Name
          </button>
        </form>
        {savedSuccess && (
          <p className="text-xs font-mono text-emerald-400">Corporate name successfully updated.</p>
        )}
      </div>

      {/* Section 2: Executive Rank & Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-xs font-mono text-slate-400 uppercase block">Carrier Rank</span>
          <div className="text-lg font-bold text-amber-400 mt-2 flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span>Rank {state.playerRank}</span>
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">{state.rankTitle}</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-xs font-mono text-slate-400 uppercase block">Treasury Capital</span>
          <div className="text-lg font-bold text-emerald-400 mt-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <span>${state.balanceUsd.toLocaleString()}</span>
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Liquid reserves</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-xs font-mono text-slate-400 uppercase block">Active Fleet</span>
          <div className="text-lg font-bold text-white mt-2 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>{totalTrucks} Units</span>
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">{totalTrailers} trailers · {totalDrivers} drivers</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-xs font-mono text-slate-400 uppercase block">Network Scale</span>
          <div className="text-lg font-bold text-white mt-2 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-400" />
            <span>{totalHubsUnlocked} Terminals</span>
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">{totalRoutesUnlocked} corridors</span>
        </div>
      </div>

      {/* Achievements & Rewards Quick Link Banner */}
      <button
        onClick={onOpenAchievements}
        className="w-full p-6 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-950 border border-amber-500/40 hover:border-amber-400 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-400 text-slate-950">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              Executive Achievement Milestones & Gold Rewards
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Claim milestone progression bonuses, XP rewards, and executive accolades
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Enterprise Crypto Exchange & Digital Asset Treasury Banner */}
      <button
        onClick={onOpenCryptoExchange}
        className="w-full p-6 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-slate-950 border border-blue-500/40 hover:border-blue-400 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-400 text-slate-950 font-bold">
            <Coins className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              Enterprise Crypto Treasury & Digital Asset Exchange
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Trade major digital assets (BTC, ETH, SOL, HAUL, LGT), manage cold storage reserves, and earn compounding APY in yield staking vaults
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Enterprise Exchange & International Trade Banner */}
      <button
        onClick={onOpenExchange}
        className="w-full p-6 bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-slate-950 border border-cyan-500/40 hover:border-cyan-400 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-400 text-slate-950 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              Enterprise Exchange & International Trade Hub
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Negotiate multi-week B2B supply accords, issue corporate bonds, execute M&A subsidiary acquisitions, and ratify customs trade pacts
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* AI Dispatcher Intelligence Suite Banner */}
      <button
        onClick={onOpenAiPage}
        className="w-full p-6 bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-slate-950 border border-teal-500/40 hover:border-teal-400 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-400 text-slate-950 font-bold">
            <Brain className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
              AI Neural Dispatcher & Autonomous Fleet Suite
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Configure autonomous AI auto-dispatches, automated maintenance bay overhauls, and subscription tiers
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Database & Phone Memory Manager Banner */}
      <button
        onClick={onOpenDatabase}
        className="w-full p-6 bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-slate-950 border border-purple-500/40 hover:border-purple-400 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-400 text-slate-950 font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
              Phone Memory Database & Storage Manager
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Inspect IndexedDB persistent storage, export SQL database dumps, and manage game memory backup states
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Global Events, Commercial Risk & Insurance Bureau Banner */}
      <button
        onClick={onOpenEventsPage}
        className="w-full p-6 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-950 border border-amber-500/40 hover:border-amber-400 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              Global Events, Commercial Risk & Insurance Bureau
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Monitor active macroeconomic world events, review fleet incident records, file insurance claims, and check gold market bullion rates
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Section 3: Executive Reset / New Game */}
      <div className="p-6 bg-slate-900 border border-rose-500/30 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Executive Enterprise Reset & Hard Reboot</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Executing a hard corporate reset clears all company assets, ledger history, hubs, and progress, returning the enterprise to initial onboarding setup.
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Initialize Corporate Reset</span>
          </button>
        ) : (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl space-y-3">
            <div className="text-xs font-bold text-rose-200">
              ⚠️ Are you absolutely certain? All progress will be permanently erased.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteReset}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
              >
                Yes, Erase & Restart
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

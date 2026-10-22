import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Building2,
  Award,
  DollarSign,
  Truck,
  Users,
  Package,
  RotateCcw,
  ShieldCheck,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface CompanyProfileModalProps {
  onClose: () => void;
  onOpenAchievements: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ onClose, onOpenAchievements }) => {
  const { state, resetGame } = useGame();
  const [companyNameInput, setCompanyNameInput] = useState<string>(state.companyName);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim()) return;
    // Update company name directly in state
    state.companyName = companyNameInput.trim();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExecuteReset = () => {
    resetGame();
    onClose();
  };

  const totalTrucks = state.trucks.length;
  const totalTrailers = state.trailers?.length || 0;
  const totalDrivers = state.drivers.length;
  const totalHubsUnlocked = state.hubs.filter((h) => h.isUnlocked).length;
  const totalRoutesUnlocked = state.routes.filter((r) => r.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enterprise Profile & Management</h3>
              <p className="text-[11px] text-slate-400">
                Corporate credentials, operational statistics, and executive control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Company Identity & Rename */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Registered Corporate Identity
            </h4>
            <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={companyNameInput}
                onChange={(e) => setCompanyNameInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl text-white text-sm font-medium outline-none transition-colors"
                placeholder="Company Trade Name"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0"
              >
                Update Name
              </button>
            </form>
            {savedSuccess && (
              <p className="text-[11px] font-mono text-emerald-400">Corporate name successfully updated.</p>
            )}
          </div>

          {/* Section 2: Executive Rank & Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Carrier Rank</span>
              <div className="text-sm font-bold text-amber-400 mt-1 flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span>Rank {state.playerRank}</span>
              </div>
              <span className="text-[10px] text-slate-500">{state.rankTitle}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Treasury Capital</span>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>${state.balanceUsd.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-slate-500">Liquid reserves</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Fleet</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>{totalTrucks} Units</span>
              </div>
              <span className="text-[10px] text-slate-500">{totalTrailers} trailers</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Network Scale</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1">
                <Package className="w-4 h-4 text-sky-400" />
                <span>{totalHubsUnlocked} Terminals</span>
              </div>
              <span className="text-[10px] text-slate-500">{totalRoutesUnlocked} corridors</span>
            </div>
          </div>

          {/* Achievements & Rewards Quick Link Banner */}
          <button
            onClick={() => {
              onClose();
              onOpenAchievements();
            }}
            className="w-full p-4 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-950 border border-amber-500/40 hover:border-amber-400 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-400 text-slate-950">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  View Achievements & Executive Rewards
                </div>
                <div className="text-[11px] text-slate-400">
                  Claim cash bonuses and XP milestones for your logistics operations
                </div>
              </div>
            </div>
            <div className="text-amber-400 font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/30 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              View →
            </div>
          </button>

          {/* Section 3: Operational Statistics */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono text-slate-300">
            <div className="text-amber-400 font-bold mb-1">AGGREGATE LOGISTICS PERFORMANCE</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-500">Total Cargo Delivered:</span>
                <span className="font-bold text-white">{state.totalCargoDeliveredTons.toLocaleString()} metric tons</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-500">Total Distance Driven:</span>
                <span className="font-bold text-white">{state.totalKilometersDriven.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-500">Total Fuel Consumed:</span>
                <span className="font-bold text-white">{state.totalFuelBurnedLiters.toLocaleString()} liters</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900 rounded">
                <span className="text-slate-500">Active Crew Roster:</span>
                <span className="font-bold text-white">{totalDrivers} drivers</span>
              </div>
            </div>
          </div>

          {/* Section 4: Factory Reset / Restart Game */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone: Enterprise Liquidation & Restart</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Permanently wipe all enterprise assets, financial ledgers, unlocked hubs, fleet trucks, and restart your logistics empire from scratch with onboarding.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
              >
                Reset & Restart Enterprise
              </button>
            ) : (
              <div className="p-3 bg-slate-900 border border-rose-500/50 rounded-lg space-y-2">
                <p className="text-xs font-bold text-rose-300">Are you absolutely sure? All progress will be lost.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteReset}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Yes, Wipe & Restart
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-500">HaulMaster Logistics Suite v3.2</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

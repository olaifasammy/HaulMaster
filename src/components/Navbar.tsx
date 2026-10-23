import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Play, Pause, PlusCircle, Fuel, HelpCircle, Award, Globe, Bell, Plus, LogOut, Cpu } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDispatchModal: () => void;
  onOpenCompanyProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenDispatchModal, onOpenCompanyProfile }) => {
  const { state, setSimSpeed, setShowGuide, restartOnboarding } = useGame();
  const [aiActive, setAiActive] = useState(true);

  const day = Math.floor(state.simTimeMinutes / 1440) + 1;
  const hours = Math.floor((state.simTimeMinutes % 1440) / 60);
  const mins = state.simTimeMinutes % 60;
  const formattedTime = `Day ${day} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  const currentLevel = state.playerRank;
  const currentExp = state.playerXp;
  const nextLevelExp = currentLevel * 2500;
  const expPercent = Math.min(100, (currentExp / Math.max(1, nextLevelExp)) * 100);
  const circleCircumference = 2 * Math.PI * 13;

  const navLinks = [
    { id: 'operations', label: 'Operations' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'freight', label: 'Freight Jobs' },
    { id: 'market', label: 'Marketplace' },
    { id: 'hubs', label: 'Hubs' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'ledger', label: 'Financials' },
  ];

  const handleNewGame = () => {
    const confirmed = window.confirm(
      "Start a new game? Your current company progress will be replaced when you finish the new setup."
    );
    if (confirmed) restartOnboarding();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-xl">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14 gap-2">
        
        {/* Zone 1: Circular Level Progress & Company Info */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCompanyProfile}
            title="Open Enterprise Profile & Management"
            className="flex items-center gap-2.5 text-white font-bold tracking-tight text-left min-h-[44px] cursor-pointer hover:opacity-90 transition-opacity group"
          >
            <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
              <svg className="absolute inset-0 w-9 h-9 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="2.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-amber-500 fill-none transition-all duration-1000 ease-out"
                  strokeWidth="2.5"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={(2 * Math.PI * 14) * (1 - expPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs relative z-10">
                <Fuel className="w-3 h-3" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white tracking-tight leading-none truncate max-w-[120px] sm:max-w-[180px]">
                {state.companyName}
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-semibold mt-1 truncate">
                <span>Rank {currentLevel}</span>
                <span>•</span>
                <span className="font-mono font-bold text-amber-300">{state.rankTitle}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`whitespace-nowrap transition-colors py-1.5 border-b-2 min-h-[44px] flex items-center cursor-pointer ${
                currentTab === link.id
                  ? 'text-amber-400 border-amber-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Financial Balances, Time Warp & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Capital & Gold Reserves */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 hidden sm:block">Treasury</span>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                ${state.balanceUsd.toLocaleString()}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-slate-800 hidden sm:block" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-mono tracking-wider text-amber-500 hidden sm:block">Gold</span>
              <span className="text-xs font-mono font-bold text-amber-400 tabular-nums flex items-center gap-0.5">
                <span>★</span> {state.gold} G
              </span>
            </div>
          </div>

          {/* Time & Pause Controls (Permanent 1x) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSimSpeed(state.simSpeed === 0 ? 1 : 0)}
              title={state.simSpeed === 0 ? 'Resume Simulation' : 'Pause Simulation'}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                state.simSpeed === 0 ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              {state.simSpeed === 0 ? (
                <>
                  <Play className="w-3 h-3" />
                  <span>PAUSED</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  <span>1x LIVE</span>
                </>
              )}
            </button>
          </div>

          {/* AI Dispatcher Toggle */}
          <button
            onClick={() => setAiActive(!aiActive)}
            className={`p-1.5 rounded-lg border transition-all duration-300 relative cursor-pointer ${
              aiActive
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-slate-800 text-slate-500 border-slate-700/60'
            }`}
            title={aiActive ? 'AI Dispatcher: Active' : 'AI Dispatcher: Idle'}
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Guide / Field Manual */}
          <button
            onClick={() => setShowGuide(true)}
            title="Field Guide"
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer hidden md:flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Quick Dispatch CTA button */}
          <button
            onClick={onOpenDispatchModal}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dispatch</span>
          </button>
        </div>
      </div>

      {/* Sub-Bar: Fuel Price Ticker, Clock & Weather */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-3 py-1 flex items-center justify-between text-[10px] font-medium text-slate-400 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <Fuel className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>Diesel Market:</span>
          <strong className="text-amber-300 font-mono font-bold">$1.45/L</strong>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="font-mono font-bold text-slate-200">
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
            <span>☀️</span>
            <span className="font-semibold">Clear Skies (18°C)</span>
          </div>
        </div>
      </div>
    </header>
  );
};

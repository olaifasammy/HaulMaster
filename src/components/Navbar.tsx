import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlusCircle, Fuel, HelpCircle, Award, Globe, Bell, Plus, LogOut, Brain, Coins, Database } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDispatchModal: () => void;
  onOpenCompanyProfile: () => void;
  onOpenDatabaseModal: () => void;
  onOpenAiDispatcher: () => void;
  onOpenEventsModal?: (tab?: 'events' | 'incidents' | 'insurance' | 'gold') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenDispatchModal,
  onOpenCompanyProfile,
  onOpenDatabaseModal,
  onOpenAiDispatcher,
  onOpenEventsModal,
}) => {
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
  const isSubActive = !!(state?.aiDispatcherActive && (state?.simTimeMinutes || 0) < (state?.aiSubscriptionExpiresSimMinutes || 0));

  const spotGold = state.goldMarket?.spotPriceUsd || 2540;
  const spotChange = state.goldMarket?.dayChangePercent || 1.0;
  const activeEvents = state.activeEvents || [];
  const primaryEvent = activeEvents[0];

  const navLinks = [
    { id: 'operations', label: 'Operations' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'repair', label: 'Workshop' },
    { id: 'freight', label: 'Freight Jobs' },
    { id: 'market', label: 'Marketplace' },
    { id: 'hubs', label: 'Hubs' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'ledger', label: 'Financials' },
    { id: 'events', label: 'Risk Bureau' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-xl">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14 gap-2">
        
        {/* Zone 1: Circular Level Progress & Company Info */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            onClick={() => onSelectTab('profile')}
            title="Open Enterprise Profile & Management"
            className={`flex items-center gap-2 text-white font-bold tracking-tight text-left min-h-[44px] cursor-pointer transition-all group min-w-0 px-2 py-1 rounded-xl border ${
              currentTab === 'profile'
                ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
            }`}
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0">
              <svg className="absolute inset-0 w-8 h-8 sm:w-9 sm:h-9 -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  className="stroke-slate-800 fill-none sm:cx-[18] sm:cy-[18] sm:r-[14]"
                  strokeWidth="2.5"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  className="stroke-amber-500 fill-none transition-all duration-1000 ease-out sm:cx-[18] sm:cy-[18] sm:r-[14]"
                  strokeWidth="2.5"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={(2 * Math.PI * 14) * (1 - expPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-[10px] sm:text-xs relative z-10">
                <Fuel className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-none whitespace-nowrap">
                {state.companyName}
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-amber-400 font-semibold mt-1 whitespace-nowrap">
                <span>Rk {currentLevel}</span>
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

        {/* Zone 3: Financial Balances & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 ml-auto shrink-0">
          
          {/* Capital & Gold Reserves (Clickable to open Gold Valuation Desk) */}
          <button
            onClick={() => onOpenEventsModal?.('gold')}
            title="Open Gold Valuation & Bullion Exchange Desk"
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 rounded-lg px-2 py-1 cursor-pointer transition-all text-left"
          >
            <div className="flex flex-col items-end">
              <span className="text-[8px] sm:text-[9px] uppercase font-mono tracking-wider text-slate-500 hidden sm:block">Treasury</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-400 tabular-nums">
                ${state.balanceUsd.toLocaleString()}
              </span>
            </div>
            <div className="w-[1px] h-5 sm:h-6 bg-slate-800" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] sm:text-[9px] uppercase font-mono tracking-wider text-amber-500 hidden sm:block">Gold</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-400 tabular-nums flex items-center gap-0.5 sm:gap-1">
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                <span>{state.gold.toLocaleString()}</span>
              </span>
            </div>
          </button>

          {/* Guide / Field Manual */}
          <button
            onClick={() => setShowGuide(true)}
            title="Field Guide"
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer hidden md:flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Quick AI Action button (only displayed when AI subscription is active) */}
          {isSubActive && (
            <button
              onClick={onOpenAiDispatcher}
              title="AI Dispatcher Hub"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-lg animate-pulse"
            >
              <Brain className="w-4 h-4" />
              <span>AI Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Bar: Fuel Price Ticker, Gold Spot Price, Active Event, Clock & Weather */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-3 py-1 flex items-center justify-between text-[10px] font-medium text-slate-400 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <Fuel className="w-3 h-3 text-amber-400" />
            <span>Diesel Market:</span>
            <strong className="text-amber-300 font-mono font-bold">$1.45/L</strong>
          </div>

          <button
            onClick={() => onOpenEventsModal?.('gold')}
            className="flex items-center space-x-1 hover:text-amber-300 cursor-pointer transition-colors"
            title="Click to open Gold Valuation & Exchange Desk"
          >
            <Coins className="w-3 h-3 text-amber-400" />
            <span>Gold Spot:</span>
            <strong className="text-amber-300 font-mono font-bold">${spotGold.toLocaleString()}/oz</strong>
            <span className="text-[9px] text-emerald-400 font-mono">({spotChange >= 0 ? '+' : ''}{spotChange}%)</span>
          </button>

          {primaryEvent && (
            <button
              onClick={() => onOpenEventsModal?.('events')}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer transition-all animate-pulse"
              title="Click to view full world event details"
            >
              <span>⚡</span>
              <span className="font-bold truncate max-w-[160px] sm:max-w-xs">{primaryEvent.title}</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => onOpenEventsModal?.('incidents')}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-300 cursor-pointer transition-colors"
            title="Open Incidents & Safety Bureau"
          >
            <span>🚨 Risk Bureau</span>
          </button>
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

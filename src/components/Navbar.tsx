import React from 'react';
import { useGame } from '../context/GameContext';
import { Play, Pause, PlusCircle, Fuel, HelpCircle, Award, ShoppingBag, Truck, Package, Trophy } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDispatchModal: () => void;
  onOpenCompanyProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenDispatchModal, onOpenCompanyProfile }) => {
  const { state, setSimSpeed, setShowGuide } = useGame();

  const day = Math.floor(state.simTimeMinutes / 1440) + 1;
  const hours = Math.floor((state.simTimeMinutes % 1440) / 60);
  const mins = state.simTimeMinutes % 60;
  const formattedTime = `D${day} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  const navLinks = [
    { id: 'operations', label: 'Operations' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'freight', label: 'Freight Jobs' },
    { id: 'market', label: 'Marketplace' },
    { id: 'hubs', label: 'Hubs' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'ledger', label: 'Financials' },
    { id: 'achievements', label: 'Achievements' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14 gap-2">
        {/* Zone 1: Brand Wordmark & Carrier Rank Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCompanyProfile}
            title="Open Enterprise Profile & Management (Reset / Restart)"
            className="flex items-center gap-2 text-white font-bold tracking-tight text-sm sm:text-base text-left min-h-[44px] cursor-pointer hover:opacity-90 transition-opacity group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-400 flex items-center justify-center text-amber-500 shrink-0 transition-colors">
              <Fuel className="w-4 h-4" />
            </div>
            <span className="font-extrabold tracking-wider hidden sm:inline">{state.companyName}</span>
          </button>

          {/* Company Rank Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px] hidden xs:inline">Rank {state.playerRank}:</span>
            <span className="text-amber-300 font-bold text-[11px] truncate max-w-[110px] sm:max-w-none">
              {state.rankTitle}
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links (hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
              {link.id === 'market' && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-mono">
                  Market
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Time Controls, Capital & Quick Dispatch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Guide walkthrough trigger button */}
          <button
            onClick={() => setShowGuide(true)}
            title="Open Field Guide & Operations Manual"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors min-h-[32px] cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Field Guide</span>
          </button>

          {/* Time & Speed Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSimSpeed(state.simSpeed === 0 ? 1 : 0)}
              title={state.simSpeed === 0 ? 'Resume' : 'Pause'}
              className={`p-1.5 rounded min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors cursor-pointer ${
                state.simSpeed === 0 ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {state.simSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSimSpeed(state.simSpeed === 5 ? 15 : state.simSpeed === 15 ? 1 : 5)}
              title="Simulation Speed Warp"
              className="px-2 py-1 font-mono text-[11px] font-bold text-amber-400 min-h-[32px] flex items-center cursor-pointer"
            >
              {state.simSpeed === 0 ? 'PAUSE' : `${state.simSpeed}x`}
            </button>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400 px-2 border-l border-slate-800 tabular-nums">
              {formattedTime}
            </span>
          </div>

          {/* Capital */}
          <div className="flex flex-col items-end px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 hidden sm:block">Capital</span>
            <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
              ${(state.balanceUsd / 1000).toFixed(0)}k
            </span>
          </div>

          {/* Quick Dispatch CTA button on larger screens */}
          <button
            onClick={onOpenDispatchModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap min-h-[36px] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dispatch</span>
          </button>
        </div>
      </div>
    </header>
  );
};

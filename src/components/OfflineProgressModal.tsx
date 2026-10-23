import React from 'react';
import { useGame } from '../context/GameContext';
import { Clock, MapPin, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export const OfflineProgressModal: React.FC = () => {
  const { state, dismissOfflineProgress } = useGame();

  if (!state.offlineProgress || !state.offlineProgress.visible) return null;

  const { hoursElapsed, completedContracts, revenueEarned, kmCovered } = state.offlineProgress;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-amber-500/20 to-slate-900 p-6 text-center border-b border-slate-800/50">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back!</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Fleet Operations Report</p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-300 text-center leading-relaxed">
            Your logistics network remained active while you were away, simulating <span className="text-white font-bold">{hoursElapsed} hours</span> of transport operations.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Revenue</div>
              <div className="text-lg font-black text-emerald-400 font-mono">+${revenueEarned.toLocaleString()}</div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <div className="flex justify-center mb-1">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Jobs Done</div>
              <div className="text-lg font-black text-white font-mono">{completedContracts}</div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <div className="flex justify-center mb-1">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Distance</div>
              <div className="text-lg font-black text-amber-400 font-mono">{kmCovered.toLocaleString()} km</div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <div className="flex justify-center mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Away Time</div>
              <div className="text-lg font-black text-slate-200 font-mono">{hoursElapsed}h</div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center">
            <p className="text-[10px] text-blue-300/80 font-medium italic">
              "Your drivers maintained safety protocols across all regional corridors."
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={dismissOfflineProgress}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            Collect Earnings & Resume Dispatch
          </button>
        </div>
      </div>
    </div>
  );
};

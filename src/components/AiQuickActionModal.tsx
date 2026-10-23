import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Brain, Zap, X, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

interface AiQuickActionModalProps {
  onClose: () => void;
  onOpenAiPage: () => void;
}

export const AiQuickActionModal: React.FC<AiQuickActionModalProps> = ({ onClose, onOpenAiPage }) => {
  const { state, executeAiAutoDispatch } = useGame();
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const isSubActive = !!(state?.aiDispatcherActive && (state?.simTimeMinutes || 0) < (state?.aiSubscriptionExpiresSimMinutes || 0));
  const remainingMinutes = Math.max(0, (state?.aiSubscriptionExpiresSimMinutes || 0) - (state?.simTimeMinutes || 0));
  const remainingDays = Math.ceil(remainingMinutes / 1440);

  const handleAutoDispatch = () => {
    setLoading(true);
    setResultMsg(null);
    setTimeout(() => {
      const res = executeAiAutoDispatch();
      setResultMsg(res.message);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Neural AI Quick Action</h3>
              <p className="text-[10px] text-slate-400 font-mono">Autonomous Dispatch & Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Badge */}
          <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-white">Neural Dispatcher Online</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {remainingDays} days remaining
            </span>
          </div>

          {/* Quick Auto-Dispatch Action */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Instant Bulk Auto-Dispatch
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Instantly scan all available freight contracts and assign eligible idle trucks and rested drivers automatically.
            </p>
            <button
              disabled={loading || !isSubActive}
              onClick={handleAutoDispatch}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Processing Dispatch...' : 'Run Auto-Dispatch Now'}</span>
            </button>
          </div>

          {resultMsg && (
            <div className="p-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* Full Hub Link */}
          <button
            onClick={() => {
              onClose();
              onOpenAiPage();
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Full AI Dispatcher Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};

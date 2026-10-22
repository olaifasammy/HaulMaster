import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  HelpCircle,
  X,
  MapPin,
  Truck,
  Package,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const UserGuideWalkthrough: React.FC = () => {
  const { state, setShowGuide } = useGame();
  const [guideStep, setGuideStep] = useState<number>(0);

  if (!state.showGuide) return null;

  const steps = [
    {
      badge: 'TERRITORY & PROGRESSION',
      title: 'Active Corridors & Locked Locations',
      icon: MapPin,
      iconColor: 'text-amber-400',
      description:
        'Your logistics enterprise starts with your Primary Base and 2 connected hubs. All remaining hubs and corridors on the map are LOCKED. To expand your territory, earn reputation XP on deliveries to promote your Rank, then acquire Hub Concessions and Route Licenses in the Marketplace.',
      highlights: [
        { label: 'Initial Territory', val: '3 Unlocked Hubs & 2 Corridors' },
        { label: 'Locked Hubs', val: 'Requires Rank 2-5 + Purchase Fee' },
        { label: 'Traffic & Demands', val: 'Hub prices scale with cargo volume' },
      ],
    },
    {
      badge: 'STATIONED FLEET MECHANICS',
      title: 'Trucks Are Stationed in Hub Yards',
      icon: Truck,
      iconColor: 'text-emerald-400',
      description:
        'Every truck and trailer is physically stationed at a specific hub. You can only dispatch freight hauls that originate from the yard where your truck is currently stationed! When a trip completes, your truck arrives and stays at the destination hub ready for a return haul.',
      highlights: [
        { label: 'Stationed Yard', val: 'Visible on every truck card & map' },
        { label: 'Origin Validation', val: 'Truck must be at contract origin' },
        { label: 'Ferry Repositioning', val: 'Deadhead transfer idle trucks anytime' },
      ],
    },
    {
      badge: 'DYNAMIC LOGISTICS FREIGHT',
      title: 'Contracts Filtered Exclusively By Your Routes',
      icon: Package,
      iconColor: 'text-sky-400',
      description:
        'Freight consignments in the market are generated ONLY for routes and hubs in your licensed network. As you acquire new hubs and license new commercial corridors in the Marketplace, lucrative contracts and cold-chain/ADR hauls immediately spawn for those lanes.',
      highlights: [
        { label: 'Licensed Lanes Only', val: 'No irrelevant or unreachable jobs' },
        { label: 'Tachograph Hours', val: 'Mandatory 45m rest every 4.5 hours' },
        { label: 'Midnight Restock', val: 'Fresh high-yield spot contracts daily' },
      ],
    },
    {
      badge: 'COMMERCIAL MARKETPLACE',
      title: 'Hubs, Routes & Dealership Market',
      icon: ShoppingBag,
      iconColor: 'text-purple-400',
      description:
        'The Marketplace is your primary engine for corporate expansion. Here you can purchase Hub Concessions, license new Commercial Corridors between your hubs, and visit the Commercial Truck Dealership to order new heavy haulers and refrigerated trailers delivered to any owned hub of your choice.',
      highlights: [
        { label: 'Hub Concessions', val: 'Buy strategic coastal & inland hubs' },
        { label: 'Route Licensing', val: 'Connect custom corridors between hubs' },
        { label: 'Dealership', val: 'Order trucks directly to any owned hub' },
      ],
    },
  ];

  const current = steps[guideStep];
  const Icon = current.icon;

  const handleClose = () => {
    setShowGuide(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
                Enterprise Field Guide · {guideStep + 1} of {steps.length}
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">Quick Operations Briefing</h3>
            </div>
          </div>

          {/* Skip / Close Guide Button (Requested) */}
          <button
            onClick={handleClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <span>Skip Guide</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0 ${current.iconColor}`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                {current.badge}
              </span>
              <h4 className="text-base font-bold text-white leading-snug">{current.title}</h4>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
            {current.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            {current.highlights.map((h, i) => (
              <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[9px] uppercase">{h.label}</span>
                <span className="font-bold text-slate-200 mt-0.5 block">{h.val}</span>
              </div>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setGuideStep(i)}
                className={`h-2 rounded-full transition-all ${
                  guideStep === i ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {guideStep > 0 ? (
            <button
              onClick={() => setGuideStep(guideStep - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {guideStep < steps.length - 1 ? (
            <button
              onClick={() => setGuideStep(guideStep + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-md"
            >
              <span>Next Briefing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Operations</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

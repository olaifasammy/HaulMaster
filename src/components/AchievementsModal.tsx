import React from 'react';
import { useGame } from '../context/GameContext';
import {
  Trophy,
  Award,
  CheckCircle2,
  Lock,
  DollarSign,
  Sparkles,
  X,
  Truck,
  Users,
  Package,
  MapPin,
  Compass,
} from 'lucide-react';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { state, claimAchievementReward } = useGame();

  const totalDeliveries = state.drivers.reduce((acc, d) => acc + d.stats.deliveriesCompleted, 0);
  const totalKm = state.totalKilometersDriven;
  const ownedHubsCount = state.hubs.filter((h) => h.isUnlocked).length;
  const cargoTons = state.totalCargoDeliveredTons;
  const truckCount = state.trucks.length;
  const driverCount = state.drivers.length;

  const achievements = [
    {
      id: 'first_haul',
      title: 'First Commercial Dispatch',
      description: 'Successfully dispatch and complete your first logistics freight haul.',
      icon: Package,
      target: 1,
      current: totalDeliveries >= 1 ? 1 : 0,
      rewardCash: 5000,
      rewardXp: 200,
    },
    {
      id: 'interstate_driver',
      title: 'Interstate Fleet Operator',
      description: 'Accumulate over 5,000 kilometers driven across highway corridors.',
      icon: Compass,
      target: 5000,
      current: totalKm,
      rewardCash: 12000,
      rewardXp: 500,
    },
    {
      id: 'hub_tycoon',
      title: 'Terminal Tycoon',
      description: 'Unlock and operate 3 or more regional terminal hubs in your network.',
      icon: MapPin,
      target: 3,
      current: ownedHubsCount,
      rewardCash: 25000,
      rewardXp: 1000,
    },
    {
      id: 'heavy_hauler',
      title: 'Heavy Tonnage Logistics',
      description: 'Deliver a cumulative total of 50 metric tons of freight cargo.',
      icon: Trophy,
      target: 50,
      current: cargoTons,
      rewardCash: 15000,
      rewardXp: 600,
    },
    {
      id: 'fleet_master',
      title: 'Fleet Commander',
      description: 'Expand your enterprise commercial fleet to 3 or more active trucks.',
      icon: Truck,
      target: 3,
      current: truckCount,
      rewardCash: 20000,
      rewardXp: 800,
    },
    {
      id: 'crew_chief',
      title: 'Crew Recruitment Chief',
      description: 'Onboard and manage 3 or more professional drivers in your crew roster.',
      icon: Users,
      target: 3,
      current: driverCount,
      rewardCash: 10000,
      rewardXp: 400,
    },
  ];

  const claimedIds = state.claimedAchievementIds || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Achievements & Executive Rewards</h3>
              <p className="text-[11px] text-slate-400">
                Complete milestones to earn treasury cash bonuses and executive XP rank advancement
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
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => {
              const isCompleted = ach.current >= ach.target;
              const isClaimed = claimedIds.includes(ach.id);
              const progressPct = Math.min(100, Math.round((ach.current / ach.target) * 100));
              const IconComp = ach.icon;

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-lg ${
                    isClaimed
                      ? 'bg-slate-950/60 border-emerald-500/30'
                      : isCompleted
                      ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/20'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${isClaimed ? 'bg-emerald-500/10 text-emerald-400' : isCompleted ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                          <span className="text-[10px] font-mono text-amber-400">
                            Reward: ${ach.rewardCash.toLocaleString()} · {ach.rewardXp} XP
                          </span>
                        </div>
                      </div>

                      {isClaimed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Claimed</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          <span>Ready!</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800">
                          {progressPct}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-snug">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Progress</span>
                        <span>
                          {typeof ach.current === 'number' && ach.current > 999
                            ? ach.current.toLocaleString()
                            : ach.current}{' '}
                          / {ach.target.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${isClaimed ? 'bg-emerald-500' : isCompleted ? 'bg-amber-400' : 'bg-sky-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div>
                    {isClaimed ? (
                      <div className="w-full py-2 bg-slate-900 text-slate-500 font-mono text-xs rounded-xl text-center font-bold">
                        Milestone Completed
                      </div>
                    ) : isCompleted ? (
                      <button
                        onClick={() => claimAchievementReward(ach.id, ach.rewardCash, ach.rewardXp)}
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Claim Reward (${ach.rewardCash.toLocaleString()})</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-slate-950/80 text-slate-600 font-mono text-xs rounded-xl text-center border border-slate-800/80">
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

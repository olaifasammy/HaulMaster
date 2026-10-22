import React from 'react';
import { useGame } from '../context/GameContext';
import {
  Trophy,
  Award,
  CheckCircle2,
  Lock,
  DollarSign,
  Sparkles,
  Truck,
  Users,
  Package,
  MapPin,
  Compass,
  Star,
  Fuel,
  Wrench,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';

const generateInfiniteTiers = (baseTarget: number, baseCash: number, baseXp: number, multiplier: number = 2.2) => {
  const tiers = [];
  let currentTarget = baseTarget;
  let currentCash = baseCash;
  let currentXp = baseXp;

  const suffixes = ['Novice', 'Regular', 'Veteran', 'Expert', 'Master', 'Grandmaster', 'Elite', 'Legendary', 'Mythic', 'Transcendent', 'Titan', 'Immortal', 'Supreme', 'Absolute', 'Infinite', 'Celestial', 'Cosmic', 'Universal', 'Omnipotent', 'Apex'];

  for (let i = 1; i <= 50; i++) {
    tiers.push({
      tier: i,
      target: Math.round(currentTarget),
      rewardCash: Math.round(currentCash),
      rewardXp: Math.round(currentXp),
      titleSuffix: suffixes[(i - 1) % suffixes.length] + (i > suffixes.length ? ` ${Math.floor((i - 1) / suffixes.length) + 1}` : ''),
    });
    currentTarget *= multiplier;
    currentCash *= 1.7;
    currentXp *= 1.5;
  }
  return tiers;
};

const getMetallicBadge = (tier: number) => {
  if (tier >= 46) {
    return { name: 'Diamond', bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-400/60', icon: Award };
  } else if (tier >= 31) {
    return { name: 'Platinum', bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-400/50', icon: Award };
  } else if (tier >= 16) {
    return { name: 'Gold', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', icon: Trophy };
  } else if (tier >= 6) {
    return { name: 'Silver', bg: 'bg-slate-300/20', text: 'text-slate-200', border: 'border-slate-400/40', icon: Award };
  } else {
    return { name: 'Bronze', bg: 'bg-amber-800/30', text: 'text-amber-500', border: 'border-amber-700/40', icon: Award };
  }
};

export const AchievementsPage: React.FC = () => {
  const { state, claimAchievementReward } = useGame();

  const totalDeliveries = state.drivers.reduce((acc, d) => acc + d.stats.deliveriesCompleted, 0);
  const totalKm = state.totalKilometersDriven;
  const ownedHubsCount = state.hubs.filter((h) => h.isUnlocked).length;
  const cargoTons = state.totalCargoDeliveredTons;
  const truckCount = state.trucks.length;
  const driverCount = state.drivers.length;
  const fuelBurned = state.totalFuelBurnedLiters;
  
  const maintenanceCount = Math.floor(totalKm / 4000) + totalDeliveries;
  const specializedCargoCount = Math.floor(totalDeliveries * 0.45);
  const estimatedNetWorth = state.balanceUsd + state.trucks.length * 110000 + state.hubs.filter(h => h.isUnlocked).reduce((acc, h) => acc + h.purchasePriceUsd, 0);
  const totalCertsCount = state.drivers.reduce((acc, d) => acc + (d.stats.mountainCert ? 1 : 0) + (d.stats.winterCert ? 1 : 0) + (d.stats.hazmatCert ? 1 : 0), 0);

  const claimedIds = state.claimedAchievementIds || [];

  const achievementChains = [
    {
      categoryId: 'dispatches',
      title: 'Commercial Freight Dispatches',
      description: 'Successfully dispatch and complete freight deliveries across corridors.',
      icon: Package,
      currentValue: totalDeliveries,
      tiers: generateInfiniteTiers(1, 5000, 200, 2.3),
    },
    {
      categoryId: 'distance',
      title: 'Interstate Distance Driven',
      description: 'Accumulate kilometers driven across highway freight corridors.',
      icon: Compass,
      currentValue: totalKm,
      tiers: generateInfiniteTiers(2500, 8000, 300, 2.3),
    },
    {
      categoryId: 'hubs',
      title: 'Terminal Network Concessions',
      description: 'Unlock and operate regional terminal hubs in your logistics empire.',
      icon: MapPin,
      currentValue: ownedHubsCount,
      tiers: generateInfiniteTiers(2, 15000, 600, 1.6),
    },
    {
      categoryId: 'tonnage',
      title: 'Heavy Tonnage Freight Cargo',
      description: 'Deliver cumulative metric tons of high-capacity freight.',
      icon: Trophy,
      currentValue: cargoTons,
      tiers: generateInfiniteTiers(25, 10000, 400, 2.3),
    },
    {
      categoryId: 'fleet',
      title: 'Commercial Fleet Expansion',
      description: 'Expand your enterprise commercial truck fleet.',
      icon: Truck,
      currentValue: truckCount,
      tiers: generateInfiniteTiers(2, 12000, 500, 1.8),
    },
    {
      categoryId: 'crew',
      title: 'Professional Driver Roster',
      description: 'Recruit and manage professional drivers in your crew.',
      icon: Users,
      currentValue: driverCount,
      tiers: generateInfiniteTiers(2, 8000, 350, 1.8),
    },
    {
      categoryId: 'eco_fuel',
      title: 'Fuel Consumption & Eco Fleet',
      description: 'Burn diesel fuel across long-haul highway transit.',
      icon: Fuel,
      currentValue: fuelBurned,
      tiers: generateInfiniteTiers(1000, 6000, 250, 2.3),
    },
    {
      categoryId: 'maintenance',
      title: 'Fleet Workshop Servicing',
      description: 'Maintain and service commercial trucks at terminal maintenance bays.',
      icon: Wrench,
      currentValue: maintenanceCount,
      tiers: generateInfiniteTiers(2, 7000, 300, 1.8),
    },
    {
      categoryId: 'specialized_cargo',
      title: 'Specialized & Hazmat Cargo',
      description: 'Transport high-value refrigerated, hazardous, and heavy industrial loads.',
      icon: ShieldAlert,
      currentValue: specializedCargoCount,
      tiers: generateInfiniteTiers(2, 10000, 400, 2.3),
    },
    {
      categoryId: 'capital_wealth',
      title: 'Enterprise Capital & Wealth',
      description: 'Accumulate corporate treasury capital and enterprise asset valuation.',
      icon: DollarSign,
      currentValue: estimatedNetWorth,
      tiers: generateInfiniteTiers(250000, 20000, 1000, 2.5),
    },
    {
      categoryId: 'driver_certs',
      title: 'Driver Training & Accreditation',
      description: 'Enroll crew drivers in advanced mountain, winter, and hazmat training.',
      icon: GraduationCap,
      currentValue: totalCertsCount,
      tiers: generateInfiniteTiers(1, 8000, 350, 1.8),
    },
  ];

  const totalPossibleTiers = achievementChains.reduce((acc, c) => acc + c.tiers.length, 0);
  const totalClaimedTiers = claimedIds.filter((id) => achievementChains.some((c) => c.tiers.some((t) => `${c.categoryId}_tier_${t.tier}` === id))).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Achievements & Executive Rewards</h2>
            <p className="text-[11px] text-slate-400">
              Complete infinite escalating multi-tier milestones with metallic badge progression.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <span className="text-slate-500 text-[9px] uppercase block">Tiers Claimed</span>
            <span className="text-emerald-400 font-bold">{totalClaimedTiers} / {totalPossibleTiers}</span>
          </div>
        </div>
      </div>

      {/* Compact Achievement Chains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {achievementChains.map((chain) => {
          const activeTierIndex = chain.tiers.findIndex((t) => !claimedIds.includes(`${chain.categoryId}_tier_${t.tier}`));
          const isFullyCompleted = activeTierIndex === -1;
          const currentTier = isFullyCompleted ? chain.tiers[chain.tiers.length - 1] : chain.tiers[activeTierIndex];
          const previousTierTarget = activeTierIndex > 0 ? chain.tiers[activeTierIndex - 1].target : 0;
          
          const tierCurrent = chain.currentValue;
          const tierTarget = currentTier.target;
          const isCompleted = tierCurrent >= tierTarget;
          const tierId = `${chain.categoryId}_tier_${currentTier.tier}`;
          
          const progressPct = isFullyCompleted ? 100 : Math.min(100, Math.max(0, Math.round(((tierCurrent - previousTierTarget) / (tierTarget - previousTierTarget)) * 100)));
          const IconComp = chain.icon;
          const badge = getMetallicBadge(currentTier.tier);
          const BadgeIcon = badge.icon;

          return (
            <div
              key={chain.categoryId}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 shadow-md ${
                isFullyCompleted
                  ? 'bg-slate-950/70 border-emerald-500/30'
                  : isCompleted
                  ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/20'
                  : 'bg-slate-900/60 border-slate-800/90'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isFullyCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isCompleted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-white truncate">{chain.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${badge.bg} ${badge.text} border ${badge.border} flex items-center gap-0.5 shrink-0`}>
                          <BadgeIcon className="w-2.5 h-2.5" />
                          <span>{badge.name} T{currentTier.tier}</span>
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold truncate">
                          · ${currentTier.rewardCash.toLocaleString()} · {currentTier.rewardXp}XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {isFullyCompleted ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5 shrink-0">
                      <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      <span>Max</span>
                    </span>
                  ) : isCompleted ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 animate-pulse shrink-0">
                      <Sparkles className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-800 shrink-0">
                      T{currentTier.tier}/{chain.tiers.length}
                    </span>
                  )}
                </div>

                {/* Progress Bar & Numbers */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate pr-1">{chain.description}</span>
                    <span className="font-bold text-white shrink-0">
                      {typeof tierCurrent === 'number' ? Math.round(tierCurrent).toLocaleString() : tierCurrent}/{tierTarget.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all ${isFullyCompleted ? 'bg-emerald-500' : isCompleted ? 'bg-amber-400' : 'bg-sky-500'}`}
                      style={{ width: `${isFullyCompleted ? 100 : progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isFullyCompleted ? (
                  <div className="w-full py-1.5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg text-center font-bold border border-emerald-500/20 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All Tiers Claimed</span>
                  </div>
                ) : isCompleted ? (
                  <button
                    onClick={() => claimAchievementReward(tierId, currentTier.rewardCash, currentTier.rewardXp, tierCurrent, tierTarget)}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded-lg transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Claim T{currentTier.tier} (${currentTier.rewardCash.toLocaleString()})</span>
                  </button>
                ) : (
                  <div className="w-full py-1.5 bg-slate-950/80 text-slate-500 font-mono text-[10px] rounded-lg text-center border border-slate-800/80 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>In Progress ({progressPct}%)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

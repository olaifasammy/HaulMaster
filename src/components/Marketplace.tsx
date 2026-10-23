import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS, TRAILER_MODELS, LIVERY_PALETTES, RANK_TIERS } from '../constants/gameData';
import {
  TruckModelId,
  TrailerModelId,
  SleeperTier,
  FleetLivery,
  FinancingMethod,
  GeoRegion,
} from '../types/game';
import {
  ShoppingBag,
  MapPin,
  Route,
  Truck,
  CheckCircle2,
  Lock,
  DollarSign,
  Fuel,
  Wrench,
  Gauge,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Building2,
  Check,
  CreditCard,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Marketplace: React.FC = () => {
  const {
    state,
    buyHubConcession,
    buyRouteLicense,
    connectRouteBetweenHubs,
    buySpokeLocationRoute,
    buyTruckWithConfig,
    buyTrailer,
    unlockRegion,
  } = useGame();

  const [activeMarketTab, setActiveMarketTab] = useState<'hubs' | 'routes' | 'dealership' | 'spokes' | 'regions'>('hubs');

  // Customer Route Connection to Hub builder state
  const ownedHubs = state.hubs.filter((h) => h.isUnlocked && (h.isHub ?? true));
  const [connectHubOriginId, setConnectHubOriginId] = useState<string>(
    ownedHubs[0]?.id || 'hub-seattle'
  );

  const originHub = state.hubs.find((h) => h.id === connectHubOriginId) || ownedHubs[0] || state.hubs[0];
  const availableDestHubs = state.hubs.filter(
    (h) => h.id !== originHub?.id && h.region === originHub?.region && (h.isHub ?? true)
  );

  const [connectHubDestId, setConnectHubDestId] = useState<string>(
    availableDestHubs[0]?.id || ''
  );
  const destHub = state.hubs.find((h) => h.id === connectHubDestId) || availableDestHubs[0];

  // Delivery Locations (Spoke Terminals) State
  const [selectedHubPerLocation, setSelectedHubPerLocation] = useState<Record<string, string>>({});
  const [spokeRegionFilter, setSpokeRegionFilter] = useState<'all' | GeoRegion>('all');
  const [spokeStatusFilter, setSpokeStatusFilter] = useState<'all' | 'connected' | 'unconnected' | 'unlocked_region'>('all');
  const [spokeSearch, setSpokeSearch] = useState<string>('');

  // Hub filters
  const [hubRegionFilter, setHubRegionFilter] = useState<'all' | GeoRegion>('all');
  const [hubStatusFilter, setHubStatusFilter] = useState<'all' | 'available' | 'locked' | 'owned'>('all');

  // Route filters
  const [routeRegionFilter, setRouteRegionFilter] = useState<'all' | GeoRegion>('all');
  const [routeStatusFilter, setRouteStatusFilter] = useState<'all' | 'unlocked' | 'licensable' | 'locked'>('all');

  // Dealership State
  const [dealershipMode, setDealershipMode] = useState<'trucks' | 'trailers'>('trucks');
  const [selectedTruckModelId, setSelectedTruckModelId] = useState<TruckModelId>('titan-540');
  const [truckHubId, setTruckHubId] = useState<string>(
    state.hubs.find((h) => h.isUnlocked)?.id || 'hub-seattle'
  );
  const [truckHasAero, setTruckHasAero] = useState(true);
  const [truckHasRetarder, setTruckHasRetarder] = useState(true);
  const [truckTireCompound, setTruckTireCompound] = useState<'highway_eco' | 'all_weather' | 'severe_snow'>('highway_eco');
  const [truckSleeperTier, setTruckSleeperTier] = useState<SleeperTier>('standard_sleeper');
  const [truckLivery, setTruckLivery] = useState<FleetLivery>('obsidian_slate');
  const [truckFinancing, setTruckFinancing] = useState<FinancingMethod>('cash');
  const [truckBrandFilter, setTruckBrandFilter] = useState<'all' | 'Mercedes-Benz' | 'Scania' | 'MAN' | 'American' | 'Asian' | 'Rigid'>('all');

  // Trailer State
  const [selectedTrailerModelId, setSelectedTrailerModelId] = useState<TrailerModelId>('dry-van-53');
  const [trailerHubId, setTrailerHubId] = useState<string>(
    state.hubs.find((h) => h.isUnlocked)?.id || 'hub-seattle'
  );
  const [trailerHasAero, setTrailerHasAero] = useState(true);
  const [trailerHasReefer, setTrailerHasReefer] = useState(true);
  const [trailerTireCompound, setTrailerTireCompound] = useState<'highway_eco' | 'all_weather' | 'severe_snow'>('highway_eco');
  const [trailerFinancing, setTrailerFinancing] = useState<FinancingMethod>('cash');

  // Bundle Trailer State for Truck Dealership
  const [bundleTrailer, setBundleTrailer] = useState<boolean>(false);
  const [bundledTrailerModelId, setBundledTrailerModelId] = useState<TrailerModelId>('dry-van-53');
  const [bundledTrailerHasAero, setBundledTrailerHasAero] = useState<boolean>(true);

  // Active models
  const selectedTruckModel = TRUCK_MODELS.find((m) => m.id === selectedTruckModelId) || TRUCK_MODELS[0];
  const selectedTrailerModel = TRAILER_MODELS.find((m) => m.id === selectedTrailerModelId) || TRAILER_MODELS[0];
  const bundledTrailerModel = TRAILER_MODELS.find((m) => m.id === bundledTrailerModelId) || TRAILER_MODELS[0];

  // Pricing calculations
  const truckAeroCost = truckHasAero ? 4500 : 0;
  const truckRetarderCost = truckHasRetarder ? 3200 : 0;
  const truckTiresCost = truckTireCompound === 'severe_snow' ? 1800 : truckTireCompound === 'all_weather' ? 800 : 0;
  const truckSleeperCost = truckSleeperTier === 'deluxe_suite' ? 8500 : truckSleeperTier === 'standard_sleeper' ? 3500 : 0;
  const truckLiveryCost = truckLivery !== 'obsidian_slate' ? 1200 : 0;
  const truckTotalCost =
    selectedTruckModel.basePriceUsd + truckAeroCost + truckRetarderCost + truckTiresCost + truckSleeperCost + truckLiveryCost;

  const bundledTrailerCost = !selectedTruckModel.isRigid && bundleTrailer ? bundledTrailerModel.basePriceUsd + (bundledTrailerHasAero ? 2200 : 0) : 0;
  const truckTotalCostWithTrailer = truckTotalCost + bundledTrailerCost;

  const truckDownPayment = Math.round(truckTotalCostWithTrailer * 0.2);
  const truckFinancedAmount = truckTotalCostWithTrailer - truckDownPayment;
  const truckTotalLeaseRepay = Math.round(truckFinancedAmount * 1.06);
  const truckDailyLease = Math.round(truckTotalLeaseRepay / 60);

  const trailerAeroCost = trailerHasAero ? 2200 : 0;
  const trailerReeferCost = trailerHasReefer && selectedTrailerModel.supportsReeferUnit ? 9500 : 0;
  const trailerTiresCost = trailerTireCompound === 'severe_snow' ? 1200 : trailerTireCompound === 'all_weather' ? 600 : 0;
  const trailerTotalCost = selectedTrailerModel.basePriceUsd + trailerAeroCost + trailerReeferCost + trailerTiresCost;
  const trailerDownPayment = Math.round(trailerTotalCost * 0.2);
  const trailerFinancedAmount = trailerTotalCost - trailerDownPayment;
  const trailerTotalLeaseRepay = Math.round(trailerFinancedAmount * 1.06);
  const trailerDailyLease = Math.round(trailerTotalLeaseRepay / 60);

  // List of ONLY owned hubs for truck delivery (using top-level ownedHubs)

  const handleBuyTruck = () => {
    buyTruckWithConfig({
      modelId: selectedTruckModelId,
      hubId: truckHubId,
      hasAeroPackage: truckHasAero,
      hasRetarder: truckHasRetarder,
      tireCompound: truckTireCompound,
      sleeperTier: truckSleeperTier,
      liveryColor: truckLivery,
      financingMethod: truckFinancing,
      selectedTrailerModelId: bundleTrailer ? bundledTrailerModelId : null,
      hasTrailerAeroSkirts: bundledTrailerHasAero,
    });
  };

  const handleBuyTrailer = () => {
    buyTrailer({
      modelId: selectedTrailerModelId,
      hubId: trailerHubId,
      hasAeroSkirts: trailerHasAero,
      hasReeferUnit: trailerHasReefer,
      tireCompound: trailerTireCompound,
      financingMethod: trailerFinancing,
    });
  };

  const handleUnlockRegion = (region: GeoRegion, fee: number) => {
    if (window.confirm(`Confirm intercontinental expansion: Unlock ${region} territory concession for $${fee.toLocaleString()}?`)) {
      unlockRegion(region);
    }
  };

  const handleBuyHub = (hubId: string, name: string, price: number) => {
    if (window.confirm(`Confirm terminal concession: Purchase ${name} for $${price.toLocaleString()}?`)) {
      buyHubConcession(hubId);
    }
  };

  const handleBuySpoke = (hubId: string, spokeId: string, spokeName: string, price: number) => {
    if (window.confirm(`Confirm delivery location acquisition: Purchase & connect ${spokeName} for $${price.toLocaleString()}?`)) {
      buySpokeLocationRoute(hubId, spokeId);
    }
  };

  const handleLicenseRoute = (routeId: string, routeName: string, fee: number) => {
    if (window.confirm(`Confirm corridor licensing: Acquire operating rights for ${routeName} for $${fee.toLocaleString()}?`)) {
      buyRouteLicense(routeId);
    }
  };

  const handleConnectHubs = (originName: string, destName: string, fee: number) => {
    if (window.confirm(`Confirm route connection: Connect ${originName} to ${destName} for $${fee.toLocaleString()}?`)) {
      connectRouteBetweenHubs(originHub.id, destHub.id);
    }
  };

  const handleBuyTruckConfirm = () => {
    const cost = truckFinancing === 'cash' ? truckTotalCostWithTrailer : truckDownPayment;
    const msg = truckFinancing === 'cash'
      ? `Confirm equipment acquisition: Purchase custom truck configuration for $${cost.toLocaleString()} cash?`
      : `Confirm commercial lease: Pay 20% down payment of $${cost.toLocaleString()} and commit to 60-day daily installments?`;
    if (window.confirm(msg)) {
      handleBuyTruck();
    }
  };

  const handleBuyTrailerConfirm = () => {
    const cost = trailerFinancing === 'cash' ? trailerTotalCost : trailerDownPayment;
    const msg = trailerFinancing === 'cash'
      ? `Confirm trailer purchase: Acquire trailer for $${cost.toLocaleString()} cash?`
      : `Confirm trailer lease: Pay 20% down payment of $${cost.toLocaleString()} and commit to 60-day lease?`;
    if (window.confirm(msg)) {
      handleBuyTrailer();
    }
  };

  // Filtered Hubs (Strictly restricted to unlocked regions)
  const filteredHubs = state.hubs.filter((h) => {
    const unlockedRegions = state.unlockedRegions || ['North America'];
    if (!unlockedRegions.includes(h.region)) return false;

    if (hubRegionFilter !== 'all' && h.region !== hubRegionFilter) return false;
    if (hubStatusFilter === 'owned' && !h.isUnlocked) return false;
    if (hubStatusFilter === 'available' && (h.isUnlocked || state.playerRank < h.requiredRank)) return false;
    if (hubStatusFilter === 'locked' && (h.isUnlocked || state.playerRank >= h.requiredRank)) return false;
    return true;
  });

  // Filtered Routes (Strictly restricted to unlocked regions)
  const filteredRoutes = state.routes.filter((r) => {
    const rOrigin = state.hubs.find((h) => h.id === r.originHubId);
    const rDest = state.hubs.find((h) => h.id === r.destinationHubId);
    if (!rOrigin || !rDest) return false;

    const unlockedRegions = state.unlockedRegions || ['North America'];
    if (!unlockedRegions.includes(rOrigin.region) || !unlockedRegions.includes(rDest.region)) return false;

    // Both ends must be in the same region for a regional corridor
    if (rOrigin.region !== rDest.region) return false;

    // If a hub is selected, the route list will only show what's in that hub's region
    if (originHub && rOrigin.region !== originHub.region) {
      return false;
    }

    if (routeRegionFilter !== 'all' && rOrigin.region !== routeRegionFilter) return false;

    const bothHubsOwned = rOrigin.isUnlocked && rDest.isUnlocked;

    if (routeStatusFilter === 'unlocked' && !r.isUnlocked) return false;
    if (routeStatusFilter === 'licensable' && (r.isUnlocked || !bothHubsOwned)) return false;
    if (routeStatusFilter === 'locked' && (r.isUnlocked || bothHubsOwned)) return false;
    return true;
  });

  const [hubPage, setHubPage] = useState<number>(1);
  const [spokePage, setSpokePage] = useState<number>(1);
  const [routePage, setRoutePage] = useState<number>(1);
  const marketPageSize = 6;

  const [expandedHubMarketIds, setExpandedHubMarketIds] = useState<Record<string, boolean>>({});
  const [expandedSpokeIds, setExpandedSpokeIds] = useState<Record<string, boolean>>({});
  const [expandedRouteIds, setExpandedRouteIds] = useState<Record<string, boolean>>({});

  const toggleHubMarketExpand = (id: string) => setExpandedHubMarketIds(p => ({ ...p, [id]: !p[id] }));
  const toggleSpokeExpand = (id: string) => setExpandedSpokeIds(p => ({ ...p, [id]: !p[id] }));
  const toggleRouteExpand = (id: string) => setExpandedRouteIds(p => ({ ...p, [id]: !p[id] }));

  const filteredSpokes = state.hubs
    .filter((h) => !h.isHub)
    .filter((spoke) => {
      if (spokeRegionFilter !== 'all' && spoke.region !== spokeRegionFilter) return false;
      if (spokeSearch) {
        const q = spokeSearch.toLowerCase();
        if (
          !spoke.name.toLowerCase().includes(q) &&
          !spoke.code.toLowerCase().includes(q) &&
          !spoke.country.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      const connectedKeys = (state.ownedSpokeConnections || []).filter((k) => k.endsWith(`:${spoke.id}`));
      const hasConnections = connectedKeys.length > 0;
      const isRegionUnlocked = state.hubs.some((h) => (h.isHub ?? true) && h.isUnlocked && h.region === spoke.region);

      if (spokeStatusFilter === 'connected' && !hasConnections) return false;
      if (spokeStatusFilter === 'unconnected' && hasConnections) return false;
      if (spokeStatusFilter === 'unlocked_region' && !isRegionUnlocked) return false;
      return true;
    });

  const totalHubPages = Math.ceil(filteredHubs.length / marketPageSize) || 1;
  const paginatedHubs = filteredHubs.slice((hubPage - 1) * marketPageSize, hubPage * marketPageSize);

  const totalSpokePages = Math.ceil(filteredSpokes.length / marketPageSize) || 1;
  const paginatedSpokes = filteredSpokes.slice((spokePage - 1) * marketPageSize, spokePage * marketPageSize);

  const totalRoutePages = Math.ceil(filteredRoutes.length / marketPageSize) || 1;
  const paginatedRoutes = filteredRoutes.slice((routePage - 1) * marketPageSize, routePage * marketPageSize);

  const renderMarketPagination = (currentPage: number, totalPages: number, setPage: (p: number | ((prev: number) => number)) => void, totalItems: number, label: string) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-mono text-slate-400 mt-6">
        <div>
          Showing {(currentPage - 1) * marketPageSize + 1} - {Math.min(currentPage * marketPageSize, totalItems)} of {totalItems} {label}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Marketplace Header & Rank Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Commercial Marketplace & Concessions</span>
              </h2>
              <p className="text-xs text-slate-400">
                Acquire terminal concessions, license route rights connecting your hubs, and purchase fleet equipment.
              </p>
            </div>
          </div>
        </div>

        {/* Player Rank & Capital Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block">Company Rank</span>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <span>⭐ Rank {state.playerRank}</span>
              <span className="text-slate-400">({state.rankTitle})</span>
            </span>
          </div>

          <div className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block">Available Treasury</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ${state.balanceUsd.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveMarketTab('hubs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeMarketTab === 'hubs'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hub Concessions ({state.hubs.filter((h) => !h.isUnlocked).length} Available)</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('routes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeMarketTab === 'routes'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Route Corridors ({state.routes.filter((r) => !r.isUnlocked).length} Corridors)</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('dealership')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeMarketTab === 'dealership'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Commercial Dealership (Station to Hub)</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('spokes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeMarketTab === 'spokes'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Spoke Terminals & Delivery Routes</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('regions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeMarketTab === 'regions'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Intercontinental Regions</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: INTERCONTINENTAL REGIONS & EXPANSION                          */}
      {/* ========================================================================= */}
      {activeMarketTab === 'regions' && (
        <div className="space-y-5">
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border border-amber-500/30 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Intercontinental Expansion & Regional Concessions</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To expand your corporate logistics network across continents (e.g. from North America to Europe or vice versa), your company must achieve Rank 4 (Logistics Enterprise) and invest a substantial expansion capital fee of $450,000. Until unlocked, you cannot view hub listings or trade corridors in locked regions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['North America', 'Europe'] as const).map((region) => {
              const unlockedRegions = state.unlockedRegions || ['North America'];
              const isUnlocked = unlockedRegions.includes(region);
              const requiredRank = 4;
              const unlockPrice = 450000;
              const hasRank = state.playerRank >= requiredRank;
              const canAfford = state.balanceUsd >= unlockPrice;

              return (
                <div
                  key={region}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-6 shadow-xl ${
                    isUnlocked
                      ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950/90 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                          Geographic Territory
                        </span>
                        <h3 className="text-xl font-extrabold text-white mt-1">{region} Expansion Zone</h3>
                      </div>
                      {isUnlocked ? (
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Unlocked & Active</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5">
                          <Lock className="w-4 h-4" />
                          <span>Territory Locked</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {region === 'North America'
                        ? 'Features Seattle, Los Angeles, Chicago, New York, Denver, Dallas, and 14 regional spoke terminals across transcontinental highway and mountain pass corridors.'
                        : 'Features Rotterdam Europort, Hamburg, Paris, London, Milan, Munich, Warsaw, and 13 European commercial gateway and port terminals.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase block">Required Rank</span>
                        <span className={`text-sm font-bold ${hasRank ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Rank {requiredRank} (Logistics Enterprise)
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase block">Expansion Fee</span>
                        <span className="text-sm font-bold text-amber-400">${unlockPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Operating Concession Fully Active</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnlockRegion(region, unlockPrice)}
                        disabled={!hasRank || !canAfford}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          !hasRank
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            : !canAfford
                            ? 'bg-slate-800 text-amber-500/70 border border-slate-700 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg active:scale-95 cursor-pointer'
                        }`}
                      >
                        {!hasRank ? (
                          <>
                            <Lock className="w-4 h-4 text-rose-400" />
                            <span>Locked · Requires Rank {requiredRank} (Current: Rank {state.playerRank})</span>
                          </>
                        ) : !canAfford ? (
                          <>
                            <DollarSign className="w-4 h-4" />
                            <span>Insufficient Treasury (${unlockPrice.toLocaleString()})</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Unlock {region} Territory ($450,000)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* SECTION 1: HUB CONCESSIONS & REAL ESTATE MARKET                           */}
      {/* ========================================================================= */}
      {activeMarketTab === 'hubs' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">Region:</span>
              {(['all', 'North America', 'Europe'] as const).map((reg) => (
                <button
                  key={reg}
                  onClick={() => { setHubRegionFilter(reg); setHubPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    hubRegionFilter === reg
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/70'
                  }`}
                >
                  {reg === 'all' ? 'All Continents' : reg}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">Status:</span>
              {[
                { id: 'all', label: 'All Hubs' },
                { id: 'available', label: 'Ready to License' },
                { id: 'locked', label: 'Locked by Rank' },
                { id: 'owned', label: 'Owned Base' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => { setHubStatusFilter(st.id as any); setHubPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    hubStatusFilter === st.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/70'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hub Concessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHubs.map((hub) => {
              const isOwned = hub.isUnlocked;
              const hasRank = state.playerRank >= hub.requiredRank;
              const canAfford = state.balanceUsd >= hub.purchasePriceUsd;

              return (
                <div
                  key={hub.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                    isOwned
                      ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : hasRank
                      ? 'bg-slate-900/80 border-slate-700 hover:border-amber-400'
                      : 'bg-slate-950/70 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div>
                    {/* Header: Region, Code, & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                          {hub.region} · {hub.country}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">{hub.name}</h3>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="px-2 py-0.5 font-mono text-xs font-bold bg-slate-950 border border-slate-800 rounded text-slate-300">
                          {hub.code}
                        </span>
                        {isOwned ? (
                          <span className="mt-1 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Owned</span>
                          </span>
                        ) : !hasRank ? (
                          <span className="mt-1 text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>Rank {hub.requiredRank} Req</span>
                          </span>
                        ) : (
                          <span className="mt-1 text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Licensable</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-mono">
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Traffic Rate</span>
                        <span className="text-sm font-bold text-emerald-400">{hub.trafficDemandScore}% Volume</span>
                        <span className="text-[9px] text-slate-500 block">{hub.monthlyCargoVolume}</span>
                      </div>

                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Spot Diesel</span>
                        <span className="text-sm font-bold text-amber-400">${hub.fuelPricePerLiter.toFixed(2)}/L</span>
                        <span className="text-[9px] text-slate-500 block">Tier {hub.workshopLevel} Workshop</span>
                      </div>
                    </div>

                    {/* Price and Rank Requirement Details */}
                    <div className="mt-3 p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 block">Concession Fee</span>
                        <span className="text-base font-bold text-white tabular-nums">
                          ${hub.purchasePriceUsd.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase text-slate-500 block">Reputation Rank</span>
                        <span className={`font-bold ${hasRank ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {hub.rankTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isOwned ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Terminal Operating Base</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyHub(hub.id, hub.name, hub.purchasePriceUsd)}
                        disabled={!hasRank || !canAfford}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          !hasRank
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : !canAfford
                            ? 'bg-slate-800/80 text-amber-500/70 border border-slate-700 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg active:scale-95'
                        }`}
                      >
                        {!hasRank ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked · Requires {hub.rankTitle}</span>
                          </>
                        ) : !canAfford ? (
                          <>
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Insufficient Treasury (${hub.purchasePriceUsd.toLocaleString()})</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Acquire Hub Concession (${(hub.purchasePriceUsd / 1000).toFixed(0)}k)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: DELIVERY LOCATIONS & SPOKE TERMINALS                           */}
      {/* ========================================================================= */}
      {activeMarketTab === 'spokes' && (
        <div className="space-y-5">
          {/* Information & Policy Header */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Regional Delivery Locations & Spoke Terminals Network
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Locations can be purchased if their region is unlocked. A location can be connected to any owned hub in its region, and can connect to multiple hubs (each connection requires payment), but cannot connect to the same hub twice.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
                  Total Active Connections: {state.ownedSpokeConnections?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">Region:</span>
              {(['all', 'North America', 'Europe'] as const).map((reg) => (
                <button
                  key={reg}
                  onClick={() => { setSpokeRegionFilter(reg); setSpokePage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    spokeRegionFilter === reg
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/70'
                  }`}
                >
                  {reg === 'all' ? 'All Regions' : reg}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {[
                  { id: 'all', label: 'All Cities' },
                  { id: 'connected', label: 'Connected' },
                  { id: 'unconnected', label: 'Unconnected' },
                  { id: 'unlocked_region', label: 'Region Unlocked' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => { setSpokeStatusFilter(st.id as any); setSpokePage(1); }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      spokeStatusFilter === st.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white bg-slate-950/70'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search city/code..."
                value={spokeSearch}
                onChange={(e) => { setSpokeSearch(e.target.value); setSpokePage(1); }}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 w-36 sm:w-44"
              />
            </div>
          </div>

          {/* Spoke Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.hubs
              .filter((h) => !h.isHub)
              .filter((spoke) => {
                if (spokeRegionFilter !== 'all' && spoke.region !== spokeRegionFilter) return false;
                if (spokeSearch) {
                  const q = spokeSearch.toLowerCase();
                  if (
                    !spoke.name.toLowerCase().includes(q) &&
                    !spoke.code.toLowerCase().includes(q) &&
                    !spoke.country.toLowerCase().includes(q)
                  ) {
                    return false;
                  }
                }
                const connectedKeys = (state.ownedSpokeConnections || []).filter((k) => k.endsWith(`:${spoke.id}`));
                const hasConnections = connectedKeys.length > 0;
                const isRegionUnlocked = state.hubs.some((h) => (h.isHub ?? true) && h.isUnlocked && h.region === spoke.region);

                if (spokeStatusFilter === 'connected' && !hasConnections) return false;
                if (spokeStatusFilter === 'unconnected' && hasConnections) return false;
                if (spokeStatusFilter === 'unlocked_region' && !isRegionUnlocked) return false;
                return true;
              })
              .map((spoke) => {
                const isRegionUnlocked = state.hubs.some((h) => (h.isHub ?? true) && h.isUnlocked && h.region === spoke.region);
                const ownedRegionalHubs = state.hubs.filter((h) => (h.isHub ?? true) && h.isUnlocked && h.region === spoke.region);
                const connectedHubKeys = (state.ownedSpokeConnections || []).filter((k) => k.endsWith(`:${spoke.id}`));
                const connectedHubIds = connectedHubKeys.map((k) => k.split(':')[0]);
                const connectedHubs = state.hubs.filter((h) => connectedHubIds.includes(h.id));

                const defaultHubChoice =
                  selectedHubPerLocation[spoke.id] ||
                  ownedRegionalHubs.find((h) => !connectedHubIds.includes(h.id))?.id ||
                  ownedRegionalHubs[0]?.id ||
                  '';

                const targetHub = state.hubs.find((h) => h.id === defaultHubChoice);
                const isAlreadyConnectedToTarget = connectedHubIds.includes(defaultHubChoice);
                const fee = spoke.purchasePriceUsd || 18000;
                const canAfford = state.balanceUsd >= fee;

                return (
                  <div
                    key={spoke.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                      connectedHubs.length > 0
                        ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : isRegionUnlocked
                        ? 'bg-slate-900/80 border-slate-700 hover:border-amber-400'
                        : 'bg-slate-950/70 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                            {spoke.region} · {spoke.country}
                          </span>
                          <h3 className="text-base font-bold text-white mt-0.5">{spoke.name}</h3>
                        </div>
                        <span className="px-2 py-0.5 font-mono text-xs font-bold bg-slate-950 border border-slate-800 rounded text-slate-300">
                          {spoke.code}
                        </span>
                      </div>

                      {/* Region Status Pill */}
                      <div className="mt-2.5">
                        {isRegionUnlocked ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Region Unlocked ({ownedRegionalHubs.length} Owned Base{ownedRegionalHubs.length > 1 ? 's' : ''})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
                            <Lock className="w-3 h-3" />
                            <span>Region Locked (No owned hub in {spoke.region})</span>
                          </div>
                        )}
                      </div>

                      {/* Location Metrics */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono">
                        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 uppercase block">Traffic Demand</span>
                          <span className="text-sm font-bold text-emerald-400">{spoke.trafficDemandScore}%</span>
                          <span className="text-[9px] text-slate-500 block">{spoke.monthlyCargoVolume}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 uppercase block">Connection Fee</span>
                          <span className="text-sm font-bold text-amber-400">${fee.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-500 block">Per Hub Connection</span>
                        </div>
                      </div>

                      {/* Connected Hubs list */}
                      <div className="mt-3 p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg text-xs font-mono space-y-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Connected Hubs ({connectedHubs.length}):
                        </span>
                        {connectedHubs.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {connectedHubs.map((h) => (
                              <span
                                key={h.id}
                                className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                {h.name.split(' ')[0]} ({h.code})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic block">
                            No hub connections yet (no default connections)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/60">
                      {!isRegionUnlocked ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-mono font-bold flex items-center justify-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Acquire a {spoke.region} Hub First</span>
                        </div>
                      ) : ownedRegionalHubs.length === 0 ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-mono font-bold flex items-center justify-center gap-2">
                          <Lock className="w-3.5 h-3.5" />
                          <span>No Active Hubs in {spoke.region}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                              Connect to Hub in {spoke.region}:
                            </label>
                            <select
                              value={defaultHubChoice}
                              onChange={(e) =>
                                setSelectedHubPerLocation((prev) => ({
                                  ...prev,
                                  [spoke.id]: e.target.value,
                                }))
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium text-xs focus:border-amber-400 outline-none"
                            >
                              {ownedRegionalHubs.map((h) => {
                                const isConn = connectedHubIds.includes(h.id);
                                return (
                                  <option key={h.id} value={h.id}>
                                    {h.name} ({h.code}) {isConn ? '· [Connected]' : '· [Available]'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {isAlreadyConnectedToTarget ? (
                            <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Connected to {targetHub?.code} (Cannot connect twice)</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => defaultHubChoice && handleBuySpoke(defaultHubChoice, spoke.id, spoke.name, spoke.purchasePriceUsd || 18000)}
                              disabled={!canAfford}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                !canAfford
                                  ? 'bg-slate-800 text-amber-500/70 border border-slate-700 cursor-not-allowed'
                                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg active:scale-95 cursor-pointer'
                              }`}
                            >
                              <Route className="w-4 h-4" />
                              <span>Connect to {targetHub?.code} (${(fee / 1000).toFixed(0)}k Fee)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ROUTE CORRIDORS & COMMERCIAL LICENSING                         */}
      {/* ========================================================================= */}
      {activeMarketTab === 'routes' && (
        <div className="space-y-5">
          {/* Direct Route Connection & Hub Linking Studio */}
          {(() => {
            const originHub = state.hubs.find((h) => h.id === connectHubOriginId) || ownedHubs[0];
            const destHub = state.hubs.find((h) => h.id === connectHubDestId) || state.hubs.find((h) => h.id !== originHub?.id);
            const isSelf = originHub?.id === destHub?.id;

            // Check if route already exists
            const existingRoute = state.routes.find(
              (r) =>
                (r.originHubId === originHub?.id && r.destinationHubId === destHub?.id) ||
                (r.originHubId === destHub?.id && r.destinationHubId === originHub?.id)
            );

            const dx = (originHub?.coord.x || 0) - (destHub?.coord.x || 0);
            const dy = (originHub?.coord.y || 0) - (destHub?.coord.y || 0);
            const calcDist = existingRoute?.distanceKm || Math.max(320, Math.round(Math.sqrt(dx * dx + dy * dy) * 3.5));
            const fee = existingRoute?.licenseFeeUsd || Math.round(calcDist * 18);
            const reqRank = existingRoute?.requiredRank || Math.min(5, Math.max(1, Math.floor(calcDist / 700) + 1));
            const traffic = existingRoute?.trafficRateScore || Math.round(((originHub?.trafficDemandScore || 50) + (destHub?.trafficDemandScore || 50)) / 2);

            const isAlreadyLicensed = existingRoute?.isUnlocked ?? false;
            const hasRank = state.playerRank >= reqRank;
            const canAfford = state.balanceUsd >= fee;

            return (
              <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border-2 border-amber-500/30 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Direct Route Connection Studio
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Connect Customer Trade Route to Selected Hub
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    Network: {ownedHubs.length} Owned Bases
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Hub (Owned) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                      1. Select Your Base Hub (Origin)
                    </label>
                    <select
                      value={connectHubOriginId}
                      onChange={(e) => {
                        const newOriginId = e.target.value;
                        setConnectHubOriginId(newOriginId);
                        const newOrigin = state.hubs.find((h) => h.id === newOriginId);
                        const validDests = state.hubs.filter(
                          (h) => h.id !== newOriginId && h.region === newOrigin?.region && (h.isHub ?? true)
                        );
                        if (validDests.length > 0 && !validDests.some((h) => h.id === connectHubDestId)) {
                          setConnectHubDestId(validDests[0].id);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium text-xs focus:border-amber-400 outline-none"
                    >
                      {ownedHubs.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.code} · {h.country}) - {h.region} Base
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Destination Hub (Strictly Same Region) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                      2. Connect Route to Destination Hub (Same Region: {originHub?.region})
                    </label>
                    <select
                      value={connectHubDestId}
                      onChange={(e) => setConnectHubDestId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium text-xs focus:border-amber-400 outline-none"
                    >
                      {availableDestHubs.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.code} · {h.country}) · {h.isUnlocked ? 'Owned Base' : `Unowned Concession ($${(h.purchasePriceUsd / 1000).toFixed(0)}k)`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Corridor Preview Bar */}
                {originHub && destHub && !isSelf && (
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
                        <span className="font-bold text-white">{originHub.code}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            destHub.isUnlocked ? 'bg-emerald-400 ring-2 ring-emerald-500/20' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white">{destHub.code}</span>
                      </div>
                      <span className="text-slate-400 font-bold">· {calcDist} km</span>
                      <span className="text-emerald-400">· {traffic}% Demand</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {isAlreadyLicensed ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold w-full sm:w-auto justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Connected & Active Corridor</span>
                        </div>
                      ) : !destHub.isUnlocked ? (
                        <button
                          onClick={() => handleBuyHub(destHub.id, destHub.name, destHub.purchasePriceUsd)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all w-full sm:w-auto cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Acquire {destHub.code} Concession (${(destHub.purchasePriceUsd / 1000).toFixed(0)}k)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectHubs(originHub.name, destHub.name, fee)}
                          disabled={!hasRank || !canAfford}
                          className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg w-full sm:w-auto ${
                            !hasRank
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : !canAfford
                              ? 'bg-slate-800 text-amber-500/70 border border-slate-700 cursor-not-allowed'
                              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {!hasRank ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Requires Rank {reqRank}</span>
                            </>
                          ) : !canAfford ? (
                            <>
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Insufficient Capital (${fee.toLocaleString()})</span>
                            </>
                          ) : (
                            <>
                              <Route className="w-4 h-4" />
                              <span>Connect & License Corridor (${fee.toLocaleString()})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Hub Region Filter Sync Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-900/80 border border-amber-500/30 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-400">Selected Hub:</span>
              <span className="text-white font-bold">{originHub?.name} ({originHub?.code})</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px] uppercase">
                {originHub?.region}
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              Routes list filtered strictly to {originHub?.region} corridors
            </span>
          </div>

          {/* Route Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">Region:</span>
              {(['all', 'North America', 'Europe'] as const).map((reg) => (
                <button
                  key={reg}
                  onClick={() => setRouteRegionFilter(reg)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    routeRegionFilter === reg
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/70'
                  }`}
                >
                  {reg === 'all' ? 'All Regions' : reg}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">Corridor Status:</span>
              {[
                { id: 'all', label: 'All Corridors' },
                { id: 'licensable', label: 'Ready to License' },
                { id: 'unlocked', label: 'Active & Licensed' },
                { id: 'locked', label: 'Missing Hubs' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setRouteStatusFilter(st.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    routeStatusFilter === st.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/70'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Routes List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoutes.map((route) => {
              const originHub = state.hubs.find((h) => h.id === route.originHubId);
              const destHub = state.hubs.find((h) => h.id === route.destinationHubId);
              const bothHubsOwned = (originHub?.isUnlocked ?? false) && (destHub?.isUnlocked ?? false);
              const hasRank = state.playerRank >= route.requiredRank;
              const canAfford = state.balanceUsd >= route.licenseFeeUsd;

              return (
                <div
                  key={route.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-lg ${
                    route.isUnlocked
                      ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : bothHubsOwned && hasRank
                      ? 'bg-slate-900/80 border-slate-700 hover:border-amber-400'
                      : 'bg-slate-950/70 border-slate-800/80 opacity-75'
                  }`}
                >
                  <div>
                    {/* Route Cities Header */}
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-amber-400 font-bold">{route.roadType}</span>
                      <span className="text-slate-400">{route.distanceKm} km</span>
                    </div>

                    <h4 className="text-base font-bold text-white">{route.name}</h4>

                    {/* Corridor Endpoints */}
                    <div className="flex items-center gap-2 mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            originHub?.isUnlocked ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white">{originHub?.name.split(' ')[0]}</span>
                        {!originHub?.isUnlocked && <span className="text-[10px] text-rose-400">(Unowned)</span>}
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 mx-auto" />

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            destHub?.isUnlocked ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white">{destHub?.name.split(' ')[0]}</span>
                        {!destHub?.isUnlocked && <span className="text-[10px] text-rose-400">(Unowned)</span>}
                      </div>
                    </div>

                    {/* Corridor Telemetry Specs */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-mono text-slate-400">
                      <div className="p-2 bg-slate-950 rounded">
                        <span className="text-slate-500 block">Traffic Index</span>
                        <span className="text-emerald-400 font-bold">{route.trafficRateScore}% Volume</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded">
                        <span className="text-slate-500 block">Electronic Toll</span>
                        <span className="text-slate-300 font-bold">${route.tollCostUsd}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded">
                        <span className="text-slate-500 block">Required Rank</span>
                        <span className="text-amber-400 font-bold">Rank {route.requiredRank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action / Licensing Button */}
                  <div>
                    {route.isUnlocked ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Licensed Active Corridor (Generating Freight)</span>
                      </div>
                    ) : !bothHubsOwned ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Acquire both connecting hubs to license this route</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLicenseRoute(route.id, route.name, route.licenseFeeUsd)}
                        disabled={!hasRank || !canAfford}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          !hasRank
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : !canAfford
                            ? 'bg-slate-800/80 text-amber-500/70 border border-slate-700 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg active:scale-95'
                        }`}
                      >
                        {!hasRank ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Requires Rank {route.requiredRank}</span>
                          </>
                        ) : !canAfford ? (
                          <>
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Insufficient Treasury (${route.licenseFeeUsd.toLocaleString()})</span>
                          </>
                        ) : (
                          <>
                            <Route className="w-4 h-4" />
                            <span>License Corridor Operating Rights (${route.licenseFeeUsd.toLocaleString()})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: COMMERCIAL TRUCK & TRAILER DEALERSHIP                          */}
      {/* ========================================================================= */}
      {activeMarketTab === 'dealership' && (
        <div className="space-y-6">
          {/* Sub-Switch: Trucks vs Trailers */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDealershipMode('trucks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dealershipMode === 'trucks'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Commercial Trucks ({TRUCK_MODELS.length} Models)
              </button>
              <button
                onClick={() => setDealershipMode('trailers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dealershipMode === 'trailers'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trailer Units ({TRAILER_MODELS.length} Models)
              </button>
            </div>

            {/* Delivery Hub Notice */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Delivered directly to selected stationed hub yard</span>
            </div>
          </div>

          {/* TRUCK DEALERSHIP */}
          {dealershipMode === 'trucks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Models Showcase */}
              <div className="lg:col-span-2 space-y-4">
                {/* Brand & Origin Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: `All Trucks (${TRUCK_MODELS.length})` },
                    { id: 'Mercedes-Benz', label: 'Mercedes-Benz' },
                    { id: 'Scania', label: 'Scania' },
                    { id: 'MAN', label: 'MAN' },
                    { id: 'American', label: 'American' },
                    { id: 'Asian', label: 'Asian' },
                    { id: 'Rigid', label: 'Rigid & Sprinter' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      onClick={() => setTruckBrandFilter(filterTab.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs ${
                        truckBrandFilter === filterTab.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TRUCK_MODELS.filter((truck) => {
                    if (truckBrandFilter === 'all') return true;
                    if (truckBrandFilter === 'Mercedes-Benz') return truck.brand === 'Mercedes-Benz';
                    if (truckBrandFilter === 'Scania') return truck.brand === 'Scania';
                    if (truckBrandFilter === 'MAN') return truck.brand === 'MAN';
                    if (truckBrandFilter === 'American') return truck.origin === 'North America' || truck.brand === 'Peterbilt' || truck.brand === 'Freightliner';
                    if (truckBrandFilter === 'Asian') return truck.origin === 'Asia' || truck.brand === 'Isuzu' || truck.brand === 'Hino';
                    if (truckBrandFilter === 'Rigid') return truck.isRigid;
                    return true;
                  }).map((truck) => {
                    const isSelected = selectedTruckModelId === truck.id;
                    return (
                      <div
                        key={truck.id}
                        onClick={() => setSelectedTruckModelId(truck.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                          <img
                            src={truck.image}
                            alt={truck.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/90 text-amber-400 border border-slate-800 shadow">
                            ${truck.basePriceUsd.toLocaleString()}
                          </span>
                          {truck.isRigid && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400 text-slate-950 uppercase shadow">
                              {truck.id === 'mercedes-sprinter-519' ? '★ Rigid Competitor' : 'Rigid Unit'}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                            <span className="text-amber-400 uppercase">
                              {truck.brand ? `${truck.brand} · ${truck.origin || 'Euro'}` : truck.category}
                            </span>
                            <span className="text-slate-400">{truck.specs.driveAxles} · {truck.specs.transmissionGears} Spd</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{truck.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{truck.description}</p>
                        </div>

                        <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                          <div>
                            <span className="text-slate-500 block">Power</span>
                            <span className="font-bold text-white">{truck.specs.horsepower} HP</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Torque</span>
                            <span className="font-bold text-white">{truck.specs.torqueNm} Nm</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Payload</span>
                            <span className="font-bold text-emerald-400">≤{truck.specs.maxPayloadKg / 1000}t</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Fuel Tank</span>
                            <span className="font-bold text-white">{truck.specs.fuelTankCapacityLiters}L</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Truck Configuration & Station Hub Selection */}
              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-5 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
                      Commission Order
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedTruckModel.name}</h3>
                  </div>

                  {/* CRITICAL FEATURE: Select Stationed Hub (Must be owned!) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Station Yard (Owned Hubs Only)</span>
                    </label>
                    <select
                      value={truckHubId}
                      onChange={(e) => setTruckHubId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-medium outline-none focus:border-amber-400"
                    >
                      {ownedHubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.code} - {hub.country})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Truck will be delivered and stationed at this yard for dispatches.
                    </span>
                  </div>

                  {/* Add-ons */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Powertrain & Safety Options
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono cursor-pointer">
                      <span className="text-slate-300">Aerodynamic Fairings Package (-8% Cd)</span>
                      <input
                        type="checkbox"
                        checked={truckHasAero}
                        onChange={(e) => setTruckHasAero(e.target.checked)}
                        className="rounded accent-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono cursor-pointer">
                      <span className="text-slate-300">3-Stage Hydro Retarder (Mountain safety)</span>
                      <input
                        type="checkbox"
                        checked={truckHasRetarder}
                        onChange={(e) => setTruckHasRetarder(e.target.checked)}
                        className="rounded accent-amber-400"
                      />
                    </label>
                  </div>

                  {/* Livery Palette */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Fleet Livery Paint
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {LIVERY_PALETTES.map((liv) => (
                        <button
                          key={liv.id}
                          onClick={() => setTruckLivery(liv.id)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 text-xs font-mono ${
                            truckLivery === liv.id
                              ? 'border-amber-400 bg-amber-500/10 text-white'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: liv.hex }} />
                          <span className="truncate">{liv.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bundle Cargo Trailer */}
                  {!selectedTruckModel.isRigid ? (
                    <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          <span>Bundle Cargo Trailer</span>
                        </label>
                        <button
                          onClick={() => setBundleTrailer(!bundleTrailer)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                            bundleTrailer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {bundleTrailer ? 'Bundled (Active)' : 'Optional Add-on'}
                        </button>
                      </div>

                      {bundleTrailer && (
                        <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2.5">
                          <div>
                            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Select Trailer Model</label>
                            <select
                              value={bundledTrailerModelId}
                              onChange={(e) => setBundledTrailerModelId(e.target.value as TrailerModelId)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-slate-700"
                            >
                              {TRAILER_MODELS.map((tm) => (
                                <option key={tm.id} value={tm.id}>
                                  {tm.name} (${tm.basePriceUsd.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">Aero Skirts (+$2,200)</span>
                            <button
                              onClick={() => setBundledTrailerHasAero(!bundledTrailerHasAero)}
                              className={`px-2.5 py-1 rounded text-xs font-bold ${
                                bundledTrailerHasAero ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {bundledTrailerHasAero ? 'Equipped' : 'None'}
                            </button>
                          </div>

                          <div className="text-[11px] font-mono text-amber-400 pt-1 border-t border-slate-800 flex justify-between">
                            <span>Trailer Cost:</span>
                            <span className="font-bold">+${bundledTrailerCost.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-3 border-t border-slate-800/80">
                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                        <span className="text-amber-400 font-bold block mb-0.5">Rigid Truck Specification</span>
                        <span>This rigid vehicle features an integrated cargo box body. No separate trailer required.</span>
                      </div>
                    </div>
                  )}

                  {/* Payment method */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Financing Structure
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTruckFinancing('cash')}
                        className={`p-2 rounded-lg border text-xs font-mono font-bold ${
                          truckFinancing === 'cash'
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Full Capital Purchase
                      </button>
                      <button
                        onClick={() => setTruckFinancing('lease_60d')}
                        className={`p-2 rounded-lg border text-xs font-mono font-bold ${
                          truckFinancing === 'lease_60d'
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        60-Day Commercial Lease
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary & Action */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-slate-400 uppercase">
                      {truckFinancing === 'cash' ? 'Total Cash Purchase' : 'Initial Down Payment (20%)'}
                    </span>
                    <span className="text-lg font-bold text-white tabular-nums">
                      ${(truckFinancing === 'cash' ? truckTotalCostWithTrailer : truckDownPayment).toLocaleString()}
                    </span>
                  </div>

                  {truckFinancing === 'lease_60d' && (
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Daily installment:</span>
                      <span className="text-amber-400 font-bold">${truckDailyLease}/day</span>
                    </div>
                  )}

                  <button
                    onClick={handleBuyTruckConfirm}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Confirm Order & Station at Yard</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRAILER DEALERSHIP */}
          {dealershipMode === 'trailers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Models Showcase */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TRAILER_MODELS.map((trl) => {
                    const isSelected = selectedTrailerModelId === trl.id;
                    return (
                      <div
                        key={trl.id}
                        onClick={() => setSelectedTrailerModelId(trl.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                          <img
                            src={trl.image}
                            alt={trl.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/90 text-amber-400 border border-slate-800">
                            ${trl.basePriceUsd.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                            {trl.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{trl.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{trl.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                          <div>
                            <span className="text-slate-500 block">Payload</span>
                            <span className="font-bold text-white">{(trl.maxPayloadKg / 1000).toFixed(0)}t cap</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Axles</span>
                            <span className="font-bold text-white">{trl.axleCount} Axles</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trailer Configuration & Station Hub Selection */}
              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-5 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
                      Trailer Unit Order
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedTrailerModel.name}</h3>
                  </div>

                  {/* Station Yard Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Station Yard (Owned Hubs Only)</span>
                    </label>
                    <select
                      value={trailerHubId}
                      onChange={(e) => setTrailerHubId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-medium outline-none focus:border-amber-400"
                    >
                      {ownedHubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trailer Options */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Consignment Specifications
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono cursor-pointer">
                      <span className="text-slate-300">Composite Aero Side Fairings</span>
                      <input
                        type="checkbox"
                        checked={trailerHasAero}
                        onChange={(e) => setTrailerHasAero(e.target.checked)}
                        className="rounded accent-amber-400"
                      />
                    </label>

                    {selectedTrailerModel.supportsReeferUnit && (
                      <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono cursor-pointer">
                        <span className="text-slate-300">Auxiliary Cryo Reefer Unit (-25°C)</span>
                        <input
                          type="checkbox"
                          checked={trailerHasReefer}
                          onChange={(e) => setTrailerHasReefer(e.target.checked)}
                          className="rounded accent-amber-400"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Pricing Summary & Action */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-slate-400 uppercase">Total Unit Price</span>
                    <span className="text-lg font-bold text-white tabular-nums">
                      ${trailerTotalCost.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleBuyTrailerConfirm}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>Acquire Trailer & Station at Yard</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS } from '../constants/gameData';
import {
  Truck,
  Activity,
  Fuel,
  MapPin,
  Clock,
  Coffee,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Gauge,
  AlertTriangle,
} from 'lucide-react';

interface LiveOperationsProps {
  onInspectTruck: (truckId: string) => void;
  onOpenDispatch: () => void;
}

export const LiveOperations: React.FC<LiveOperationsProps> = ({ onInspectTruck, onOpenDispatch }) => {
  const { state, dismissNotification, dispatchRoadsideMechanic, recallTrip } = useGame();
  const [isEnRouteExpanded, setIsEnRouteExpanded] = useState(false);
  const [expandedTripIds, setExpandedTripIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const TRIPS_PER_PAGE = 6;

  const totalTrucks = state.trucks.length;
  const enRouteCount = state.trucks.filter((t) => t.status === 'en_route').length;
  const uptimePercent = totalTrucks > 0 ? Math.round((enRouteCount / totalTrucks) * 100) : 0;

  const avgFleetFuel = state.activeTrips.length > 0
    ? (state.activeTrips.reduce((acc, t) => acc + t.telemetry.instantFuelRateL100km, 0) / state.activeTrips.length).toFixed(1)
    : '31.4';

  const totalTrips = state.activeTrips.length;
  const totalPages = Math.max(1, Math.ceil(totalTrips / TRIPS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedTrips = state.activeTrips.slice((safePage - 1) * TRIPS_PER_PAGE, safePage * TRIPS_PER_PAGE);

  const toggleTripExpanded = (tripId: string) => {
    setExpandedTripIds((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Fleet Uptime</div>
          <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{uptimePercent}%</span>
            <span className="text-[11px] text-slate-400">({enRouteCount}/{totalTrucks})</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Fuel Economy</div>
          <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-amber-400 tabular-nums">{avgFleetFuel}</span>
            <span className="text-[10px] text-slate-400">L/100k</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Cargo Hauled</div>
          <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {Math.round(state.totalCargoDeliveredTons)}
            </span>
            <span className="text-[10px] text-slate-400">tons</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Distance Logged</div>
          <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-sky-400 tabular-nums">
              {(state.totalKilometersDriven / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-slate-400">km</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Hauler Convoys vs Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2 Cols: Active Hauler Cards with individual accordion toggle and pagination */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {/* Collapsible Section Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-sm">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsEnRouteExpanded(!isEnRouteExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEnRouteExpanded(!isEnRouteExpanded);
                }
              }}
              className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none group min-h-[52px]"
              aria-expanded={isEnRouteExpanded}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                      En-Route Fleet
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      totalTrips > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}>
                      {totalTrips > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {totalTrips} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEnRouteExpanded
                      ? 'Real-time telemetry, powertrain diagnostics & driver rest monitoring'
                      : totalTrips > 0
                        ? `${totalTrips} truck${totalTrips === 1 ? '' : 's'} on corridor · Tap to view individual hauls`
                        : 'All trucks parked in terminal · Tap to expand'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDispatch();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                >
                  + Dispatch
                </button>

                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono group-hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <span className="hidden sm:inline text-[11px]">{isEnRouteExpanded ? 'Close' : 'View All'}</span>
                  {isEnRouteExpanded ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Compact preview row when collapsed with active hauls */}
            {!isEnRouteExpanded && totalTrips > 0 && (
              <div
                onClick={() => setIsEnRouteExpanded(true)}
                className="px-3.5 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-950/90 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                  {state.activeTrips.slice(0, 3).map((trip) => {
                    const trk = state.trucks.find((t) => t.id === trip.truckId);
                    const pct = Math.round((trip.progressKm / trip.totalDistanceKm) * 100);
                    return (
                      <span
                        key={trip.id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded-md font-mono text-[10px] text-slate-300 shrink-0"
                      >
                        <span className="text-amber-400 font-semibold">{trk?.plate}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-emerald-400">{pct}%</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{Math.round(trip.telemetry.currentSpeedKmh)} km/h</span>
                      </span>
                    );
                  })}
                  {totalTrips > 3 && (
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      +{totalTrips - 3} more
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-amber-400 font-medium shrink-0 flex items-center gap-1">
                  View <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>

          {/* Expanded Cards Section with individual trip card accordions */}
          {isEnRouteExpanded && (
            <div className="space-y-3 sm:space-y-4">
              {totalTrips === 0 ? (
                <div className="p-6 sm:p-8 bg-slate-900/40 border border-slate-800 rounded-xl text-center space-y-3">
                  <Truck className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">No trucks currently rolling</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Vehicles are idle in yard. Dispatch available contracts from the Freight Market.
                  </p>
                  <button
                    onClick={onOpenDispatch}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors min-h-[44px]"
                  >
                    Create Route Dispatch
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedTrips.map((trip) => {
                      const truck = state.trucks.find((t) => t.id === trip.truckId);
                      const driver = state.drivers.find((d) => d.id === trip.driverId);
                      const model = TRUCK_MODELS.find((m) => m.id === truck?.modelId);
                      const originHub = state.hubs.find((h) => h.id === trip.corridor.originHubId);
                      const destHub = state.hubs.find((h) => h.id === trip.corridor.destinationHubId);

                      const progressPct = Math.min(100, Math.round((trip.progressKm / trip.totalDistanceKm) * 100));
                      const remainingKm = Math.max(0, Math.round(trip.totalDistanceKm - trip.progressKm));
                      const remainingHours = (remainingKm / Math.max(25, trip.telemetry.currentSpeedKmh || 80)).toFixed(1);
                      const isExpanded = !!expandedTripIds[trip.id];

                      return (
                        <div
                          key={trip.id}
                          className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all shadow-sm"
                        >
                          {/* Card Header (Click to expand/collapse individually) */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleTripExpanded(trip.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleTripExpanded(trip.id);
                              }
                            }}
                            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 shrink-0">
                                {truck?.plate}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{trip.contract.title}</h4>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">({progressPct}%)</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {originHub?.name.split(' ')[0]} → {destHub?.name.split(' ')[0]} · {driver?.name}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {trip.isRestingNow ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-950/40 border border-sky-800/60 rounded text-sky-400 text-[11px] font-semibold">
                                  <Coffee className="w-3 h-3" />
                                  <span>Resting</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/40 border border-emerald-800/60 rounded text-emerald-400 text-[11px] font-semibold">
                                  <Activity className="w-3 h-3 animate-pulse" />
                                  <span>{Math.round(trip.telemetry.currentSpeedKmh)} km/h</span>
                                </span>
                              )}

                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Card Details */}
                          {isExpanded && (
                            <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-slate-800/80 pt-4 animate-in fade-in">
                              {/* Breakdown Alert & Roadside Rescue Actions */}
                              {trip.isStalledBreakdown && (
                                <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2.5">
                                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                                    <span>VEHICLE STALLED IN ROADSIDE BREAKDOWN!</span>
                                  </div>
                                  {trip.roadsideRepairMinutesRemaining && trip.roadsideRepairMinutesRemaining > 0 ? (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1.5 text-xs font-mono">
                                      <div className="flex items-center justify-between text-amber-300 font-bold">
                                        <span>{trip.roadsideRepairType === 'heavy_tow' ? '🚛 Heavy Tow & Overhaul in Progress' : '🛠️ Mobile Mechanic On-Site'}</span>
                                        <span className="tabular-nums">~{trip.roadsideRepairMinutesRemaining} sim mins left</span>
                                      </div>
                                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                          className="bg-amber-400 h-full rounded-full animate-pulse"
                                          style={{ width: `${Math.max(10, 100 - (trip.roadsideRepairMinutesRemaining / (trip.roadsideRepairType === 'heavy_tow' ? 60 : 30)) * 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[11px] text-slate-300 leading-snug">
                                        Truck has suffered critical mechanical failure on highway corridor. Dispatch roadside rescue service:
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        <button
                                          onClick={() => {
                                            const confirmed = window.confirm("Dispatch Mobile Roadside Mechanic for $1,800? This will take ~30 simulation minutes on-site before resuming the haul.");
                                            if (confirmed) {
                                              dispatchRoadsideMechanic(trip.id, 'mobile');
                                            }
                                          }}
                                          className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs rounded-lg border border-amber-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                          <span>🛠️ Mobile Mechanic ($1,800)</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            const confirmed = window.confirm("Dispatch Heavy-Duty Tow Truck & Overhaul for $3,500? This will take ~60 simulation minutes before fully repairing and resuming haul.");
                                            if (confirmed) {
                                              dispatchRoadsideMechanic(trip.id, 'heavy_tow');
                                            }
                                          }}
                                          className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs rounded-lg border border-rose-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                          <span>🚛 Heavy Tow & Overhaul ($3,500)</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-400">Route Progress</span>
                                  <span className="text-slate-300 font-semibold tabular-nums text-[11px]">
                                    {remainingKm} km left (~{remainingHours}h)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>

                              {/* Telemetry Strip */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                <div className="p-2 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                                  <span className="text-[9px] text-slate-500 uppercase block">Engine</span>
                                  <span className="font-bold text-white tabular-nums">{trip.telemetry.engineRpm} RPM</span>
                                </div>

                                <div className="p-2 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                                  <span className="text-[9px] text-slate-500 uppercase block">Fuel Burn</span>
                                  <span className="font-bold text-amber-400 tabular-nums">
                                    {trip.telemetry.instantFuelRateL100km} L/100k
                                  </span>
                                </div>

                                <div className="p-2 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                                  <span className="text-[9px] text-slate-500 uppercase block">Weather</span>
                                  <span className="text-sky-300 tabular-nums truncate block">
                                    {trip.telemetry.weatherState.type}
                                  </span>
                                </div>

                                <div className="p-2 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                                  <span className="text-[9px] text-slate-500 uppercase block">Tank</span>
                                  <span className="font-bold text-white tabular-nums">
                                    {Math.round(truck?.fuelCurrentLiters || 0)} L
                                  </span>
                                </div>
                              </div>

                              {/* Action */}
                              <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                                <div className="text-[11px] text-slate-400 font-mono">
                                  Payout: <span className="font-bold text-emerald-400">${trip.contract.payoutUsd.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                  <button
                                    onClick={() => recallTrip(trip.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold transition-colors border border-rose-500/30 cursor-pointer min-h-[36px]"
                                  >
                                    <span>🔄 Recall to Terminal ($1,200)</span>
                                  </button>

                                  <button
                                    onClick={() => onInspectTruck(trip.truckId)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors min-h-[36px] cursor-pointer"
                                  >
                                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Telemetry</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Toolbar */}
                  {totalPages > 1 && (
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono">
                      <div className="text-slate-400 text-[11px]">
                        Showing <span className="text-white font-bold">{(safePage - 1) * TRIPS_PER_PAGE + 1}–{Math.min(safePage * TRIPS_PER_PAGE, totalTrips)}</span> of <span className="text-white font-bold">{totalTrips}</span> trucks
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                          disabled={safePage === 1}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 min-h-[36px]"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Prev</span>
                        </button>

                        <div className="flex items-center gap-1 px-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                                p === safePage
                                  ? 'bg-amber-400 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                          disabled={safePage === totalPages}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 min-h-[36px]"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Logistics Event Feed */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Event Feed</span>
          </h3>

          <div className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5 max-h-[320px] sm:max-h-[500px] overflow-y-auto">
            {state.notifications.map((notif) => (
              <div key={notif.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[180px]">{notif.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">{notif.simTimeFormatted}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {notif.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

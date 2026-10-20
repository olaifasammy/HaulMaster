import React from 'react';
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
  Gauge,
} from 'lucide-react';

interface LiveOperationsProps {
  onInspectTruck: (truckId: string) => void;
  onOpenDispatch: () => void;
}

export const LiveOperations: React.FC<LiveOperationsProps> = ({ onInspectTruck, onOpenDispatch }) => {
  const { state, dismissNotification } = useGame();

  const totalTrucks = state.trucks.length;
  const enRouteCount = state.trucks.filter((t) => t.status === 'en_route').length;
  const uptimePercent = totalTrucks > 0 ? Math.round((enRouteCount / totalTrucks) * 100) : 0;

  const avgFleetFuel = state.activeTrips.length > 0
    ? (state.activeTrips.reduce((acc, t) => acc + t.telemetry.instantFuelRateL100km, 0) / state.activeTrips.length).toFixed(1)
    : '31.4';

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
        {/* Left 2 Cols: Active Hauler Cards */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>En-Route Fleet ({state.activeTrips.length})</span>
            </h3>
            {state.activeTrips.length === 0 && (
              <button
                onClick={onOpenDispatch}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold min-h-[36px] flex items-center"
              >
                + Dispatch Haul
              </button>
            )}
          </div>

          {state.activeTrips.length === 0 ? (
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
            <div className="space-y-3 sm:space-y-4">
              {state.activeTrips.map((trip) => {
                const truck = state.trucks.find((t) => t.id === trip.truckId);
                const driver = state.drivers.find((d) => d.id === trip.driverId);
                const model = TRUCK_MODELS.find((m) => m.id === truck?.modelId);
                const originHub = state.hubs.find((h) => h.id === trip.corridor.originHubId);
                const destHub = state.hubs.find((h) => h.id === trip.corridor.destinationHubId);

                const progressPct = Math.min(100, Math.round((trip.progressKm / trip.totalDistanceKm) * 100));
                const remainingKm = Math.max(0, Math.round(trip.totalDistanceKm - trip.progressKm));
                const remainingHours = (remainingKm / Math.max(25, trip.telemetry.currentSpeedKmh || 80)).toFixed(1);

                return (
                  <div
                    key={trip.id}
                    className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-all space-y-3.5"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {truck?.plate}
                          </span>
                          <span className="text-xs font-semibold text-white">{model?.name.split(' ')[0]}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-xs text-slate-400">{driver?.name}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 leading-snug">{trip.contract.title}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {originHub?.name.split(' ')[0]} → {destHub?.name.split(' ')[0]}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="shrink-0">
                        {trip.isRestingNow ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-950/40 border border-sky-800/60 rounded-lg text-sky-400 text-xs font-semibold">
                            <Coffee className="w-3.5 h-3.5" />
                            <span>Resting ({driver?.currentRestMinutesRemaining}m left)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-400 text-xs font-semibold">
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            <span>Rolling {Math.round(trip.telemetry.currentSpeedKmh)} km/h</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">{progressPct}%</span>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
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
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Payout: <span className="font-bold text-emerald-400">${trip.contract.payoutUsd.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => onInspectTruck(trip.truckId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors min-h-[36px]"
                      >
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        <span>Telemetry</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
            {state.notifications.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                No active event logs.
              </div>
            ) : (
              state.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-2.5 bg-slate-950/80 border border-slate-800/90 rounded-lg space-y-0.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-400">{notif.simTimeFormatted}</span>
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="text-slate-500 hover:text-slate-300 text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                  <div className="font-semibold text-white text-[11px]">{notif.title}</div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS } from '../constants/gameData';
import {
  X,
  Send,
  Truck,
  User,
  Package,
  Route,
  AlertTriangle,
  CheckCircle,
  Fuel,
  DollarSign,
} from 'lucide-react';

interface RouteDispatcherModalProps {
  onClose: () => void;
  preselectedContractId?: string;
}

export const RouteDispatcherModal: React.FC<RouteDispatcherModalProps> = ({
  onClose,
  preselectedContractId,
}) => {
  const { state, dispatchTrip } = useGame();

  const [selectedContractId, setSelectedContractId] = useState<string>(
    preselectedContractId || state.availableContracts[0]?.id || ''
  );
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  const contract = state.availableContracts.find((c) => c.id === selectedContractId);
  const originHub = state.hubs.find((h) => h.id === contract?.originHubId);
  const destHub = state.hubs.find((h) => h.id === contract?.destinationHubId);

  const matchedRoutes = state.routes.filter(
    (r) => r.originHubId === contract?.originHubId && r.destinationHubId === contract?.destinationHubId
  );
  const activeRoute = matchedRoutes.find((r) => r.id === selectedRouteId) || matchedRoutes[0];

  const eligibleTrucks = state.trucks.filter(
    (t) => t.status === 'idle' && t.currentHubId === contract?.originHubId
  );
  const selectedTruck = eligibleTrucks.find((t) => t.id === selectedTruckId) || eligibleTrucks[0];

  const availableDrivers = state.drivers.filter(
    (d) => d.hosStatus !== 'driving' && d.hosStatus !== 'resting'
  );
  const selectedDriver = availableDrivers.find((d) => d.id === selectedDriverId) || availableDrivers[0];

  const distanceKm = activeRoute?.distanceKm || 1000;
  const payloadTons = contract?.weightTons || 15;
  const gradeAdd = activeRoute ? Math.max(0, activeRoute.avgElevationGradePct) * 2.5 : 0;
  const estLitersPer100km = 30 + payloadTons * 0.45 + gradeAdd;
  const estTotalFuelLiters = Math.round((distanceKm / 100) * estLitersPer100km);
  const fuelPrice = originHub?.fuelPricePerLiter || 1.25;
  const estFuelCost = Math.round(estTotalFuelLiters * fuelPrice);
  const estTolls = activeRoute?.tollCostUsd || 0;
  const estDriverWage = Math.round(distanceKm * (selectedDriver?.wagePerKmUsd || 0.45));
  const totalCost = estFuelCost + estTolls + estDriverWage;
  const grossRevenue = (contract?.payoutUsd || 0) + (contract?.bonusOnTimeUsd || 0);
  const projectedNetProfit = grossRevenue - totalCost;
  const profitMarginPct = grossRevenue > 0 ? Math.round((projectedNetProfit / grossRevenue) * 100) : 0;

  const hasHazmatCert = !contract?.isHazardous || selectedDriver?.stats.hazmatCert;
  const hasEnoughFuel = selectedTruck && selectedTruck.fuelCurrentLiters >= 120;
  const canDispatch = contract && selectedTruck && selectedDriver && activeRoute && hasHazmatCert && hasEnoughFuel;

  const handleDispatch = () => {
    if (!contract || !selectedTruck || !selectedDriver || !activeRoute) return;
    const ok = dispatchTrip(contract.id, selectedTruck.id, selectedDriver.id, activeRoute.id);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Route Dispatch & Manifest</h3>
              <p className="text-[11px] text-slate-400 truncate">
                Assign vehicle, driver, and corridor for cargo delivery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden">
          {/* Step 1: Select Cargo Contract */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Choose Freight Consignment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {state.availableContracts.map((c) => {
                const isSelected = c.id === (contract?.id || '');
                const oHub = state.hubs.find((h) => h.id === c.originHubId);
                const dHub = state.hubs.find((h) => h.id === c.destinationHubId);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedContractId(c.id);
                      setSelectedRouteId('');
                      setSelectedTruckId('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-amber-400 font-bold mb-0.5">
                      {c.category} · {c.weightTons}t
                    </div>
                    <div className="text-xs font-semibold line-clamp-1 text-white">{c.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {oHub?.name.split(' ')[0]} → {dHub?.name.split(' ')[0]}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-xs">
                      <span className="font-mono font-bold text-emerald-400">${c.payoutUsd.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">+{c.bonusOnTimeUsd} bonus</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Route Corridor */}
          {matchedRoutes.length > 0 && (
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                2. Highway Corridor Variant
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchedRoutes.map((r) => {
                  const isSelected = r.id === (activeRoute?.id || '');
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/80 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate mr-2">{r.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                          {r.distanceKm} km
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                        <span>Grade: {r.maxGradePct}%</span>
                        <span>Toll: ${r.tollCostUsd}</span>
                        <span>Speed: {r.baseSpeedLimitKmh}k</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Truck Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                3. Stationed Truck ({originHub?.name.split(' ')[0]})
              </label>
              <span className="text-[10px] text-slate-400">{eligibleTrucks.length} idle</span>
            </div>

            {eligibleTrucks.length === 0 ? (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                No idle trucks at {originHub?.name.split(' ')[0]}. Relocate an available vehicle.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {eligibleTrucks.map((t) => {
                  const isSelected = t.id === (selectedTruck?.id || '');
                  const m = TRUCK_MODELS.find((mod) => mod.id === t.modelId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTruckId(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate mr-1">{m?.name.split(' ')[0]}</span>
                        <span className="font-mono text-amber-400 shrink-0">{t.plate}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>Fuel: {Math.round(t.fuelCurrentLiters)}L</span>
                        <span>Eng: {Math.round(t.subsystems.engineBlock)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 4: Driver Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                4. Assigned Driver
              </label>
              <span className="text-[10px] text-slate-400">{availableDrivers.length} ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableDrivers.map((d) => {
                const isSelected = d.id === (selectedDriver?.id || '');
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriverId(d.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate mr-1">{d.name}</span>
                      <span className="font-mono text-slate-400 text-[11px]">${d.wagePerKmUsd}/k</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Eco: {d.stats.ecoDrivingRating}/100 · Safety: {d.stats.safetyScore}/100
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Profitability Forecast */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              <span>Financial Forecast</span>
              <span className="text-emerald-400">{profitMarginPct}% Margin</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Gross Payout</span>
                <div className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                  ${grossRevenue.toLocaleString()}
                </div>
              </div>

              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Est. Fuel</span>
                <div className="text-xs sm:text-sm font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                  ${estFuelCost.toLocaleString()}
                </div>
              </div>

              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Wages & Tolls</span>
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-300 tabular-nums mt-0.5">
                  ${(estDriverWage + estTolls).toLocaleString()}
                </div>
              </div>

              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Net Margin</span>
                <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                  ${projectedNetProfit.toLocaleString()}
                </div>
              </div>
            </div>

            {!hasEnoughFuel && (
              <div className="flex items-center gap-2 text-xs text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Low fuel tank. Refuel at depot before dispatch.</span>
              </div>
            )}
            {!hasHazmatCert && (
              <div className="flex items-center gap-2 text-xs text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Cargo requires ADR / HAZMAT certified driver.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors min-h-[44px]"
          >
            Cancel
          </button>

          <button
            disabled={!canDispatch}
            onClick={handleDispatch}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-lg min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>Authorize & Roll Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS, TRAILER_MODELS, LIVERY_PALETTES } from '../constants/gameData';
import {
  TruckModelId,
  TrailerModelId,
  SleeperTier,
  FleetLivery,
  FinancingMethod,
} from '../types/game';
import {
  Truck,
  Wrench,
  Fuel,
  Gauge,
  PlusCircle,
  Zap,
  Trash2,
  Package,
  Wind,
  Snowflake,
  ShieldCheck,
  Check,
  Layers,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface FleetManagerProps {
  onInspectTruck: (truckId: string) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({ onInspectTruck }) => {
  const { state, buyTruckWithConfig, sellTruck, buyTrailer, sellTrailer } = useGame();

  // Fleet Inventory Sub-Tabs
  const [inventoryTab, setInventoryTab] = useState<'trucks' | 'trailers'>('trucks');

  // Dealership Showroom Mode
  const [showroomMode, setShowroomMode] = useState<'trucks' | 'trailers'>('trucks');

  // Truck Customization State
  const [selectedTruckModelId, setSelectedTruckModelId] = useState<TruckModelId>('titan-540');
  const [truckHubId, setTruckHubId] = useState<string>(state.hubs[0]?.id || 'hub-seattle');
  const [truckHasAero, setTruckHasAero] = useState(true);
  const [truckHasRetarder, setTruckHasRetarder] = useState(true);
  const [truckTireCompound, setTruckTireCompound] = useState<'highway_eco' | 'all_weather' | 'severe_snow'>('highway_eco');
  const [truckSleeperTier, setTruckSleeperTier] = useState<SleeperTier>('standard_sleeper');
  const [truckLivery, setTruckLivery] = useState<FleetLivery>('obsidian_slate');
  const [truckFinancing, setTruckFinancing] = useState<FinancingMethod>('cash');

  // Trailer Customization State
  const [selectedTrailerModelId, setSelectedTrailerModelId] = useState<TrailerModelId>('dry-van-53');
  const [trailerHubId, setTrailerHubId] = useState<string>(state.hubs[0]?.id || 'hub-seattle');
  const [trailerHasAero, setTrailerHasAero] = useState(true);
  const [trailerHasReefer, setTrailerHasReefer] = useState(true);
  const [trailerTireCompound, setTrailerTireCompound] = useState<'highway_eco' | 'all_weather' | 'severe_snow'>('highway_eco');
  const [trailerFinancing, setTrailerFinancing] = useState<FinancingMethod>('cash');

  // Active models
  const selectedTruckModel = TRUCK_MODELS.find((m) => m.id === selectedTruckModelId) || TRUCK_MODELS[0];
  const selectedTrailerModel = TRAILER_MODELS.find((m) => m.id === selectedTrailerModelId) || TRAILER_MODELS[0];

  // Pricing calculations: Truck
  const truckAeroCost = truckHasAero ? 4500 : 0;
  const truckRetarderCost = truckHasRetarder ? 3200 : 0;
  const truckTiresCost = truckTireCompound === 'severe_snow' ? 1800 : truckTireCompound === 'all_weather' ? 800 : 0;
  const truckSleeperCost = truckSleeperTier === 'deluxe_suite' ? 8500 : truckSleeperTier === 'standard_sleeper' ? 3500 : 0;
  const truckLiveryCost = truckLivery !== 'obsidian_slate' ? 1200 : 0;
  const truckTotalCost = selectedTruckModel.basePriceUsd + truckAeroCost + truckRetarderCost + truckTiresCost + truckSleeperCost + truckLiveryCost;
  const truckDownPayment = Math.round(truckTotalCost * 0.20);
  const truckFinancedAmount = truckTotalCost - truckDownPayment;
  const truckTotalLeaseRepay = Math.round(truckFinancedAmount * 1.06);
  const truckDailyLease = Math.round(truckTotalLeaseRepay / 60);

  // Pricing calculations: Trailer
  const trailerAeroCost = trailerHasAero ? 2200 : 0;
  const trailerReeferCost = (trailerHasReefer && selectedTrailerModel.supportsReeferUnit) ? 9500 : 0;
  const trailerTiresCost = trailerTireCompound === 'severe_snow' ? 1200 : trailerTireCompound === 'all_weather' ? 600 : 0;
  const trailerTotalCost = selectedTrailerModel.basePriceUsd + trailerAeroCost + trailerReeferCost + trailerTiresCost;
  const trailerDownPayment = Math.round(trailerTotalCost * 0.20);
  const trailerFinancedAmount = trailerTotalCost - trailerDownPayment;
  const trailerTotalLeaseRepay = Math.round(trailerFinancedAmount * 1.06);
  const trailerDailyLease = Math.round(trailerTotalLeaseRepay / 60);

  // Handlers
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
    });
  };

  const handleBuyTrailer = () => {
    buyTrailer({
      modelId: selectedTrailerModelId,
      hubId: trailerHubId,
      hasAeroSkirts: trailerHasAero,
      hasReeferUnit: trailerHasReefer && selectedTrailerModel.supportsReeferUnit,
      tireCompound: trailerTireCompound,
      financingMethod: trailerFinancing,
    });
  };

  const trailers = state.trailers || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Fleet Inventory Section with Sub-Tabs */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Company Fleet Inventory</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live telemetry, odometers, asset statuses, and maintenance schedules.
            </p>
          </div>

          {/* Sub-Tabs: Trucks vs Trailers */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setInventoryTab('trucks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                inventoryTab === 'trucks'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Commercial Trucks ({state.trucks.length})</span>
            </button>
            <button
              onClick={() => setInventoryTab('trailers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                inventoryTab === 'trailers'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Cargo Trailers ({trailers.length})</span>
            </button>
          </div>
        </div>

        {/* 1A. Commercial Trucks Inventory */}
        {inventoryTab === 'trucks' && (
          <div>
            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {state.trucks.map((truck) => {
                const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
                const hub = state.hubs.find((h) => h.id === truck.currentHubId);
                const isEnRoute = truck.status === 'en_route';

                return (
                  <div
                    key={truck.id}
                    className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{model?.name}</div>
                        <div className="font-mono text-xs text-amber-400 font-semibold">{truck.plate}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {hub?.name.split(' ')[0]} Terminal
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isEnRoute
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                        {truck.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono py-2 border-y border-slate-800/60">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">Odometer</span>
                        <span className="text-slate-200 tabular-nums">{(truck.odometerKm / 1000).toFixed(1)}k km</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">Fuel</span>
                        <span className="text-amber-400 tabular-nums">{Math.round(truck.fuelCurrentLiters)}L</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">Engine</span>
                        <span className={truck.subsystems.engineBlock >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                          {Math.round(truck.subsystems.engineBlock)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onInspectTruck(truck.id)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                      >
                        Cockpit Telemetry
                      </button>
                      {!isEnRoute && state.trucks.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Liquidate truck ${truck.plate} for salvage value?`)) {
                              sellTruck(truck.id);
                            }
                          }}
                          aria-label="Liquidate truck"
                          className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Vehicle Model</th>
                      <th className="py-3 px-4">Plate & VIN</th>
                      <th className="py-3 px-4">Terminal</th>
                      <th className="py-3 px-4">Odometer</th>
                      <th className="py-3 px-4">Fuel</th>
                      <th className="py-3 px-4">Specs & Aero</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {state.trucks.map((truck) => {
                      const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
                      const hub = state.hubs.find((h) => h.id === truck.currentHubId);
                      const isEnRoute = truck.status === 'en_route';

                      return (
                        <tr key={truck.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{model?.name}</div>
                            <div className="text-[11px] text-slate-400">{model?.category}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-amber-400">{truck.plate}</div>
                            <div className="text-[10px] text-slate-500">{truck.vin}</div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            <div>{hub?.name.split(' ')[0]}</div>
                            <div className="text-[10px] text-slate-500">{hub?.code}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-200 tabular-nums">
                            {Math.round(truck.odometerKm).toLocaleString()} km
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs tabular-nums text-white">
                              {Math.round(truck.fuelCurrentLiters)} L
                            </div>
                            <div className="w-16 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full"
                                style={{
                                  width: `${(truck.fuelCurrentLiters / (model?.specs.fuelTankCapacityLiters || 500)) * 100}%`,
                                }}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-xs font-mono">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {truck.hasAeroPackage && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px]">
                                  Aero -12%
                                </span>
                              )}
                              {truck.hasRetarder && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                                  Retarder
                                </span>
                              )}
                              {truck.sleeperTier === 'deluxe_suite' && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                                  Deluxe Cab
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isEnRoute
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isEnRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                              {truck.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => onInspectTruck(truck.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Inspect
                            </button>
                            {!isEnRoute && state.trucks.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Liquidate truck ${truck.plate} for salvage value?`)) {
                                    sellTruck(truck.id);
                                  }
                                }}
                                title="Liquidate Truck"
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 1B. Cargo Trailers Inventory */}
        {inventoryTab === 'trailers' && (
          <div>
            {trailers.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
                <Package className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Standalone Trailers In Fleet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Acquire dedicated freight trailers (Dry Van, PolarFlow Reefer, Heavy Lowboy, ADR Tanker) from the showroom below to expand cargo capacity and haul specialized contracts.
                </p>
                <button
                  onClick={() => setShowroomMode('trailers')}
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Configure Trailer in Showroom</span>
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="sm:hidden space-y-3">
                  {trailers.map((trailer) => {
                    const model = TRAILER_MODELS.find((m) => m.id === trailer.modelId);
                    const hub = state.hubs.find((h) => h.id === trailer.currentHubId);
                    const isEnRoute = trailer.status === 'en_route';

                    return (
                      <div
                        key={trailer.id}
                        className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{model?.name}</div>
                            <div className="font-mono text-xs text-amber-400 font-semibold">{trailer.serialNumber}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {hub?.name.split(' ')[0]} Terminal · {model?.category}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isEnRoute
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isEnRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                            {trailer.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs font-mono py-2 border-y border-slate-800/60">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Payload</span>
                            <span className="text-slate-200 tabular-nums">{(model?.maxPayloadKg ? model.maxPayloadKg / 1000 : 25)}t</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Aero Skirts</span>
                            <span className={trailer.hasAeroSkirts ? 'text-sky-400' : 'text-slate-500'}>
                              {trailer.hasAeroSkirts ? '-6% Drag' : 'None'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Reefer Unit</span>
                            <span className={trailer.hasReeferUnit ? 'text-emerald-400' : 'text-slate-500'}>
                              {trailer.hasReeferUnit ? `${trailer.reeferFuelCurrentLiters}L` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {!isEnRoute && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => {
                                if (confirm(`Liquidate trailer ${trailer.serialNumber} for 70% salvage value?`)) {
                                  sellTrailer(trailer.id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Liquidate</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                        <tr>
                          <th className="py-3 px-4">Trailer Model</th>
                          <th className="py-3 px-4">Serial Number</th>
                          <th className="py-3 px-4">Cargo Compatibility</th>
                          <th className="py-3 px-4">Terminal Depot</th>
                          <th className="py-3 px-4">Max Payload</th>
                          <th className="py-3 px-4">Equipment & Aero</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {trailers.map((trailer) => {
                          const model = TRAILER_MODELS.find((m) => m.id === trailer.modelId);
                          const hub = state.hubs.find((h) => h.id === trailer.currentHubId);
                          const isEnRoute = trailer.status === 'en_route';

                          return (
                            <tr key={trailer.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white">{model?.name}</div>
                                <div className="text-[11px] text-slate-400">{model?.lengthFeet}ft · {model?.axleCount} Axles</div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                                {trailer.serialNumber}
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                                  {model?.category}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-slate-300">
                                <div>{hub?.name.split(' ')[0]}</div>
                                <div className="text-[10px] text-slate-500">{hub?.code}</div>
                              </td>

                              <td className="py-3.5 px-4 font-mono text-slate-200 tabular-nums">
                                {(model?.maxPayloadKg ? model.maxPayloadKg / 1000 : 25)} tons
                              </td>

                              <td className="py-3.5 px-4 text-xs font-mono">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {trailer.hasAeroSkirts && (
                                    <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px]">
                                      Aero Skirts
                                    </span>
                                  )}
                                  {trailer.hasReeferUnit && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                                      Reefer {trailer.reeferFuelCurrentLiters}L
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] capitalize">
                                    {trailer.tireCompound.replace('_', ' ')}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    isEnRoute
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isEnRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                  {trailer.status.replace('_', ' ')}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                {!isEnRoute && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Liquidate trailer ${trailer.serialNumber} for 70% salvage value?`)) {
                                        sellTrailer(trailer.id);
                                      }
                                    }}
                                    title="Liquidate Trailer"
                                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors inline-flex items-center"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Commercial Heavy Truck & Trailer Dealership Showroom */}
      <div className="space-y-4 sm:space-y-5 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Commercial Dealership Showroom & Pre-Buy Configurator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Spec factory-custom heavy haulers and commercial trailers with deep options and instant equipment lease financing.
            </p>
          </div>

          {/* Showroom Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setShowroomMode('trucks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                showroomMode === 'trucks'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Heavy Haulers (4 Models)</span>
            </button>
            <button
              onClick={() => setShowroomMode('trailers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                showroomMode === 'trailers'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Cargo Trailers (5 Models)</span>
            </button>
          </div>
        </div>

        {/* 2A. Heavy Trucks Showroom */}
        {showroomMode === 'trucks' && (
          <div className="space-y-5">
            {/* Model Selection Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {TRUCK_MODELS.map((model) => {
                const isSelected = model.id === selectedTruckModelId;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedTruckModelId(model.id)}
                    className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-0.5">
                      {model.category}
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{model.name}</div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-1 sm:mt-2">
                      ${(model.basePriceUsd / 1000).toFixed(0)}k Base
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Truck Interactive Stage & Configurator */}
            <div className="p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 shadow-xl">
              {/* Photo & Technical Badges */}
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center group w-full">
                  <img
                    src={selectedTruckModel.image}
                    alt={selectedTruckModel.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold uppercase">
                      {selectedTruckModel.specs.driveAxles}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/60 font-mono text-[10px]">
                      {selectedTruckModel.specs.transmissionGears}-Speed
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate mr-2">{selectedTruckModel.manufacturer}</span>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">
                      ${selectedTruckModel.basePriceUsd.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Powertrain Dyno Specs Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block">Horsepower</span>
                    <span className="text-sm font-bold text-white">{selectedTruckModel.specs.horsepower} HP</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{selectedTruckModel.specs.displacementLiters}L {selectedTruckModel.specs.cylinders}cyl</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block">Peak Torque</span>
                    <span className="text-sm font-bold text-white">{selectedTruckModel.specs.torqueNm} Nm</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Heavy Grade Pull</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block">Fuel Tanks</span>
                    <span className="text-sm font-bold text-amber-400">{selectedTruckModel.specs.fuelTankCapacityLiters} L</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">+{selectedTruckModel.specs.adBlueTankLiters}L DEF</span>
                  </div>
                </div>
              </div>

              {/* Pre-Buy Customizer Controls */}
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    {selectedTruckModel.category}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{selectedTruckModel.name}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{selectedTruckModel.description}</p>
                </div>

                {/* Pre-Buy Options Group */}
                <div className="space-y-3">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    Showroom Equipment & Option Packages
                  </div>

                  {/* Option 1: Aero Package */}
                  <label className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={truckHasAero}
                        onChange={(e) => setTruckHasAero(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 min-w-[18px] min-h-[18px]"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-sky-400" />
                          <span>Aerodynamic Cab Skirts & Roof Fairing</span>
                        </div>
                        <div className="text-slate-400 text-[10px]">Reduces highway drag by 12% ($C_d$ optimization)</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">+$4,500</span>
                  </label>

                  {/* Option 2: Engine Retarder */}
                  <label className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={truckHasRetarder}
                        onChange={(e) => setTruckHasRetarder(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 min-w-[18px] min-h-[18px]"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Hydraulic Transmission Retarder</span>
                        </div>
                        <div className="text-slate-400 text-[10px]">Prevents brake fade & heat rotor wear on mountain descents</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">+$3,200</span>
                  </label>

                  {/* Option 3: Tire Compound */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                      Tire Compound Configuration
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'highway_eco', label: 'Highway Eco', sub: 'Low drag (Std)', cost: 0 },
                        { id: 'all_weather', label: 'All-Weather', sub: 'Wet/Dry grip', cost: 800 },
                        { id: 'severe_snow', label: 'Severe Snow', sub: 'Ice siping', cost: 1800 },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTruckTireCompound(t.id as any)}
                          className={`p-2 rounded-lg border text-left transition-all text-xs min-h-[44px] ${
                            truckTireCompound === t.id
                              ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="truncate">{t.label}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {t.cost === 0 ? 'Included' : `+$${t.cost}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 4: Sleeper Cab Tier */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                      Sleeper Cab Amenities & Crew Comfort
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'day_cab', label: 'Day Cab', sub: 'Standard', cost: 0 },
                        { id: 'standard_sleeper', label: 'Std Sleeper', sub: 'Bunk & Heater', cost: 3500 },
                        { id: 'deluxe_suite', label: 'Deluxe Suite', sub: '-25% Fatigue', cost: 8500 },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setTruckSleeperTier(s.id as any)}
                          className={`p-2 rounded-lg border text-left transition-all text-xs min-h-[44px] ${
                            truckSleeperTier === s.id
                              ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="truncate">{s.label}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {s.cost === 0 ? 'Included' : `+$${s.cost}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 5: Fleet Paint Livery */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                      Company Livery Finish
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LIVERY_PALETTES.map((liv) => (
                        <button
                          key={liv.id}
                          type="button"
                          onClick={() => setTruckLivery(liv.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all min-h-[40px] ${
                            truckLivery === liv.id
                              ? 'bg-slate-800 border-amber-500 text-white'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                            style={{ backgroundColor: liv.hex }}
                          />
                          <span className="truncate text-[11px]">{liv.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Hub Destination */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Delivery Destination Terminal
                    </label>
                    <select
                      value={truckHubId}
                      onChange={(e) => setTruckHubId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none min-h-[44px]"
                    >
                      {state.hubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financing & Acquisition Channel */}
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300 uppercase">
                      <span>Capital Acquisition Method</span>
                      <span className="text-emerald-400">Available: ${(state.balanceUsd / 1000).toFixed(0)}k</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTruckFinancing('cash')}
                        className={`p-2 rounded-lg border text-left text-xs transition-all min-h-[44px] ${
                          truckFinancing === 'cash'
                            ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-white">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Cash</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">100% Upfront Acquisition</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTruckFinancing('lease_60d')}
                        className={`p-2 rounded-lg border text-left text-xs transition-all min-h-[44px] ${
                          truckFinancing === 'lease_60d'
                            ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-white">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>60-Day Lease</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">20% Down + Daily Amortization</div>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          {truckFinancing === 'lease_60d' ? 'Down Payment (20%)' : 'Treasury Due'}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          ${(truckFinancing === 'lease_60d' ? truckDownPayment : truckTotalCost).toLocaleString()}
                        </span>
                      </div>
                      {truckFinancing === 'lease_60d' && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Daily Lease Fee</span>
                          <span className="text-sm font-bold text-amber-400">${truckDailyLease}/day (60d)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Total Vehicle Spec</div>
                    <div className="text-lg font-mono font-bold text-white tabular-nums">
                      ${truckTotalCost.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={handleBuyTruck}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg min-h-[44px]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{truckFinancing === 'lease_60d' ? 'Authorize Lease Order' : 'Acquire Commercial Truck'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2B. Cargo Trailers Showroom */}
        {showroomMode === 'trailers' && (
          <div className="space-y-5">
            {/* Model Selection Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {TRAILER_MODELS.map((model) => {
                const isSelected = model.id === selectedTrailerModelId;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedTrailerModelId(model.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-0.5 truncate">
                      {model.category}
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{model.name}</div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-1 sm:mt-2">
                      ${(model.basePriceUsd / 1000).toFixed(0)}k Base
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trailer Interactive Stage & Configurator */}
            <div className="p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 shadow-xl">
              {/* Photo & Technical Badges */}
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center group w-full">
                  <img
                    src={selectedTrailerModel.image}
                    alt={selectedTrailerModel.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold uppercase">
                      {selectedTrailerModel.lengthFeet} FT
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/60 font-mono text-[10px]">
                      {selectedTrailerModel.axleCount} Axles
                    </span>
                    {selectedTrailerModel.supportsReeferUnit && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono text-[10px]">
                        Cold-Chain
                      </span>
                    )}
                    {selectedTrailerModel.supportsHazmatADR && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px]">
                        ADR Hazmat
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate mr-2">{selectedTrailerModel.manufacturer}</span>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">
                      ${selectedTrailerModel.basePriceUsd.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Trailer Technical Specifications Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block">Max Payload</span>
                    <span className="text-sm font-bold text-white">{(selectedTrailerModel.maxPayloadKg / 1000).toFixed(0)} Tons</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Rating</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block">Empty Weight</span>
                    <span className="text-sm font-bold text-white">{(selectedTrailerModel.emptyWeightKg / 1000).toFixed(1)} Tons</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tare Weight</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase block">Axle Count</span>
                    <span className="text-sm font-bold text-amber-400">{selectedTrailerModel.axleCount} Axles</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Air Suspension</span>
                  </div>
                </div>
              </div>

              {/* Pre-Buy Trailer Options */}
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    {selectedTrailerModel.category}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{selectedTrailerModel.name}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{selectedTrailerModel.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    Pre-Buy Trailer Customization
                  </div>

                  {/* Aero Side Skirts */}
                  <label className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={trailerHasAero}
                        onChange={(e) => setTrailerHasAero(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 min-w-[18px] min-h-[18px]"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-sky-400" />
                          <span>Aerodynamic Trailer Side Skirts</span>
                        </div>
                        <div className="text-slate-400 text-[10px]">Composite underbody fairings (-6% highway air resistance)</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">+$2,200</span>
                  </label>

                  {/* Auxiliary Reefer Unit (if model supports it) */}
                  {selectedTrailerModel.supportsReeferUnit && (
                    <label className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={trailerHasReefer}
                          onChange={(e) => setTrailerHasReefer(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-amber-500 min-w-[18px] min-h-[18px]"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                            <span>Auxiliary Thermo King Cryo Unit & 180L Tank</span>
                          </div>
                          <div className="text-slate-400 text-[10px]">Maintains -25°C deep freeze for high-value food & vaccine contracts</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">+$9,500</span>
                    </label>
                  )}

                  {/* Trailer Tire Compound */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                      Axle Tire Compounds
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'highway_eco', label: 'Highway Eco', sub: 'Standard', cost: 0 },
                        { id: 'all_weather', label: 'All-Weather', sub: 'Wet Grip', cost: 600 },
                        { id: 'severe_snow', label: 'Severe Snow', sub: 'Winter Siped', cost: 1200 },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTrailerTireCompound(t.id as any)}
                          className={`p-2 rounded-lg border text-left transition-all text-xs min-h-[44px] ${
                            trailerTireCompound === t.id
                              ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="truncate">{t.label}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {t.cost === 0 ? 'Included' : `+$${t.cost}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Hub Destination */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Delivery Destination Terminal
                    </label>
                    <select
                      value={trailerHubId}
                      onChange={(e) => setTrailerHubId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none min-h-[44px]"
                    >
                      {state.hubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financing & Acquisition Channel */}
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300 uppercase">
                      <span>Capital Acquisition Method</span>
                      <span className="text-emerald-400">Available: ${(state.balanceUsd / 1000).toFixed(0)}k</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTrailerFinancing('cash')}
                        className={`p-2 rounded-lg border text-left text-xs transition-all min-h-[44px] ${
                          trailerFinancing === 'cash'
                            ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-white">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Cash</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">100% Upfront Acquisition</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTrailerFinancing('lease_60d')}
                        className={`p-2 rounded-lg border text-left text-xs transition-all min-h-[44px] ${
                          trailerFinancing === 'lease_60d'
                            ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-white">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>60-Day Lease</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">20% Down + Daily Payment</div>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          {trailerFinancing === 'lease_60d' ? 'Down Payment (20%)' : 'Treasury Due'}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          ${(trailerFinancing === 'lease_60d' ? trailerDownPayment : trailerTotalCost).toLocaleString()}
                        </span>
                      </div>
                      {trailerFinancing === 'lease_60d' && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Daily Lease Fee</span>
                          <span className="text-sm font-bold text-amber-400">${trailerDailyLease}/day (60d)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Total Trailer Spec</div>
                    <div className="text-lg font-mono font-bold text-white tabular-nums">
                      ${trailerTotalCost.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={handleBuyTrailer}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg min-h-[44px]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{trailerFinancing === 'lease_60d' ? 'Authorize Trailer Lease' : 'Acquire Commercial Trailer'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

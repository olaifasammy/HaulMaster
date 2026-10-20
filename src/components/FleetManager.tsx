import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS } from '../constants/gameData';
import { TruckModelId, TruckInstance } from '../types/game';
import {
  Truck,
  Wrench,
  Fuel,
  Gauge,
  PlusCircle,
  Zap,
  Trash2,
} from 'lucide-react';

interface FleetManagerProps {
  onInspectTruck: (truckId: string) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({ onInspectTruck }) => {
  const { state, buyTruck, sellTruck } = useGame();
  const [selectedModelId, setSelectedModelId] = useState<TruckModelId>('titan-540');
  const [selectedHubId, setSelectedHubId] = useState<string>(state.hubs[0]?.id || 'hub-seattle');
  const [includeAeroPackage, setIncludeAeroPackage] = useState(true);

  const selectedModel = TRUCK_MODELS.find((m) => m.id === selectedModelId) || TRUCK_MODELS[0];
  const totalCost = selectedModel.basePriceUsd + (includeAeroPackage ? 4500 : 0);

  const handleBuy = () => {
    buyTruck(selectedModelId, selectedHubId, includeAeroPackage);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Fleet Inventory */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Company Fleet ({state.trucks.length} Vehicles)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status, odometers, and maintenance scheduling.
          </p>
        </div>

        {/* Mobile Cards View (Visible on mobile screens) */}
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

        {/* Desktop Table View (Hidden on mobile) */}
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
                  <th className="py-3 px-4">Engine / Brakes</th>
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

                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className={truck.subsystems.engineBlock >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                          Eng {Math.round(truck.subsystems.engineBlock)}%
                        </span>
                        <span className="text-slate-600 mx-1">·</span>
                        <span className={truck.subsystems.brakePads >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                          Brk {Math.round(truck.subsystems.brakePads)}%
                        </span>
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

      {/* 2. Commercial Dealership Showroom */}
      <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Commercial Heavy Truck Dealership</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Expand fleet with factory-certified commercial haulers.
          </p>
        </div>

        {/* Model Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {TRUCK_MODELS.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-0.5">
                  {model.category}
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">{model.name}</div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-1 sm:mt-2">
                  ${(model.basePriceUsd / 1000).toFixed(0)}k
                </div>
              </button>
            );
          })}
        </div>

        {/* Showcase */}
        <div className="p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 items-center shadow-xl">
          {/* Photo */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center group w-full">
            <img
              src={selectedModel.image}
              alt={selectedModel.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <span className="font-bold text-white truncate mr-2">{selectedModel.manufacturer}</span>
              <span className="font-mono text-amber-400 font-bold shrink-0">{selectedModel.specs.driveAxles}</span>
            </div>
          </div>

          {/* Specs & Purchase */}
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                {selectedModel.category}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{selectedModel.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">{selectedModel.description}</p>
            </div>

            {/* Powertrain Dyno Specs Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Horsepower</span>
                <span className="text-sm font-bold text-white">{selectedModel.specs.horsepower} HP</span>
              </div>
              <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Torque</span>
                <span className="text-sm font-bold text-white">{selectedModel.specs.torqueNm} Nm</span>
              </div>
              <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Fuel Tanks</span>
                <span className="text-sm font-bold text-white">{selectedModel.specs.fuelTankCapacityLiters} L</span>
              </div>
            </div>

            {/* Config & Buy */}
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAeroPackage}
                  onChange={(e) => setIncludeAeroPackage(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 min-w-[20px] min-h-[20px]"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">Aero Cab Skirts (+$4,500)</div>
                  <div className="text-slate-400 text-[10px]">Reduces aerodynamic drag by 12%</div>
                </div>
              </label>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Delivery Destination Terminal
                </label>
                <select
                  value={selectedHubId}
                  onChange={(e) => setSelectedHubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none min-h-[44px]"
                >
                  {state.hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} ({hub.country})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price & Purchase CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase">Total Acquisition</div>
                <div className="text-xl font-mono font-bold text-emerald-400 tabular-nums">
                  ${totalCost.toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleBuy}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Acquire Truck</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

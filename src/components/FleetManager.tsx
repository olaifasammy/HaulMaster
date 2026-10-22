import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS, TRAILER_MODELS } from '../constants/gameData';
import {
  Truck,
  Trash2,
  Package,
  MapPin,
  ChevronDown,
  ChevronUp,
  Gauge,
  Fuel,
  Wrench,
  Activity,
} from 'lucide-react';

interface FleetManagerProps {
  onInspectTruck: (truckId: string) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({ onInspectTruck }) => {
  const { state, sellTruck, sellTrailer, ferryTruck } = useGame();

  // List of unlocked hubs owned by player
  const ownedHubs = state.hubs.filter((h) => h.isUnlocked);

  // Fleet Inventory Sub-Tabs
  const [inventoryTab, setInventoryTab] = useState<'trucks' | 'trailers'>('trucks');

  // Stationed Hub Filter
  const [selectedStationedHub, setSelectedStationedHub] = useState<string>('all');
  const [ferryTargetTruckId, setFerryTargetTruckId] = useState<string | null>(null);
  const [ferryDestHubId, setFerryDestHubId] = useState<string>('');

  // Expanded truck cards state for toggling detailed view
  const [expandedTruckIds, setExpandedTruckIds] = useState<string[]>([]);

  const toggleTruckExpand = (truckId: string) => {
    setExpandedTruckIds((prev) =>
      prev.includes(truckId) ? prev.filter((id) => id !== truckId) : [...prev, truckId]
    );
  };

  const trailers = state.trailers || [];

  // Filtered trucks by stationed hub
  const filteredTrucks = state.trucks.filter((t) => {
    if (selectedStationedHub !== 'all' && t.currentHubId !== selectedStationedHub) {
      return false;
    }
    return true;
  });

  const filteredTrailers = trailers.filter((tr) => {
    if (selectedStationedHub !== 'all' && tr.currentHubId !== selectedStationedHub) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Fleet Header & Dealership Pointer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Company Fleet Assets & Telemetry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Compact card view for your commercial fleet. Click any truck card to toggle expanded technical details, live telemetry links, and yard operations.
          </p>
        </div>
      </div>

      {/* Fleet Inventory Section with Sub-Tabs & Station Yard Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setInventoryTab('trucks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                inventoryTab === 'trailers'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Cargo Trailers ({trailers.length})</span>
            </button>
          </div>

          {/* Stationed Yard Filter */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono py-1">
            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Yard:</span>
            </span>
            <button
              onClick={() => setSelectedStationedHub('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
                selectedStationedHub === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              All Yards
            </button>
            {ownedHubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => setSelectedStationedHub(hub.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
                  selectedStationedHub === hub.id
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {hub.name.split(' ')[0]} ({hub.code})
              </button>
            ))}
          </div>
        </div>

        {/* Compact Trucks Cards View (Expandable) */}
        {inventoryTab === 'trucks' && (
          <div>
            {filteredTrucks.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
                <Truck className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Trucks Stationed in This Yard</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Select another yard filter or visit the Marketplace Dealership to commission custom heavy haulers.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTrucks.map((truck) => {
                  const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
                  const hub = state.hubs.find((h) => h.id === truck.currentHubId);
                  const driver = state.drivers.find((d) => d.assignedTruckId === truck.id);
                  const isEnRoute = truck.status === 'en_route';
                  const isFerrying = ferryTargetTruckId === truck.id;
                  const isExpanded = expandedTruckIds.includes(truck.id);

                  return (
                    <div
                      key={truck.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all"
                    >
                      {/* Compact Bar / Card Header (Always Visible) */}
                      <div
                        onClick={() => toggleTruckExpand(truck.id)}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{model?.name || truck.modelId}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                {truck.plate}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {hub?.name || truck.currentHubId}
                              </span>
                              <span>·</span>
                              <span>
                                {driver ? (
                                  <span className="text-emerald-400 font-semibold">Driver: {driver.name}</span>
                                ) : (
                                  <span className="text-slate-500 italic">Unassigned</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                              isEnRoute
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isEnRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {truck.status.replace('_', ' ')}
                          </span>

                          <button
                            type="button"
                            className="text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 px-2 py-1 bg-slate-950 rounded border border-slate-800"
                          >
                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details Drawer (Only when toggled) */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-0.5">
                                <Gauge className="w-3 h-3 text-amber-400" />
                                Odometer
                              </span>
                              <span className="text-sm font-bold text-white">{truck.odometerKm.toLocaleString()} km</span>
                            </div>

                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-0.5">
                                <Fuel className="w-3 h-3 text-sky-400" />
                                Fuel & AdBlue
                              </span>
                              <span className="text-xs font-bold text-white">
                                {Math.round(truck.fuelCurrentLiters)}L / {Math.round(truck.adBlueCurrentLiters)}L
                              </span>
                            </div>

                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-0.5">
                                <Wrench className="w-3 h-3 text-emerald-400" />
                                Powertrain Health
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                {Math.round(truck.subsystems.engineBlock)}% Nominal
                              </span>
                            </div>

                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-0.5">
                                Livery & Sleeper
                              </span>
                              <span className="text-xs font-bold text-slate-200 capitalize">
                                {truck.liveryColor.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons Toolbar & Telemetry Link */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Dedicated Truck Telemetry Link / Button */}
                              <button
                                onClick={() => onInspectTruck(truck.id)}
                                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow flex items-center gap-1.5"
                              >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Truck Telemetry & Diagnostics</span>
                              </button>

                              {!isEnRoute && ownedHubs.length > 1 && (
                                isFerrying ? (
                                  <div className="inline-flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-amber-500/50">
                                    <select
                                      value={ferryDestHubId}
                                      onChange={(e) => setFerryDestHubId(e.target.value)}
                                      className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                                    >
                                      <option value="">Destination...</option>
                                      {ownedHubs
                                        .filter((h) => h.id !== truck.currentHubId)
                                        .map((h) => (
                                          <option key={h.id} value={h.id}>
                                            {h.name.split(' ')[0]} · $650
                                          </option>
                                        ))}
                                    </select>
                                    <button
                                      onClick={() => {
                                        if (ferryDestHubId) {
                                          ferryTruck(truck.id, ferryDestHubId);
                                          setFerryTargetTruckId(null);
                                        }
                                      }}
                                      disabled={!ferryDestHubId}
                                      className="px-2.5 py-1 bg-amber-400 text-slate-950 font-bold rounded text-xs"
                                    >
                                      Go
                                    </button>
                                    <button
                                      onClick={() => setFerryTargetTruckId(null)}
                                      className="px-1 text-slate-400 hover:text-white text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setFerryTargetTruckId(truck.id);
                                      const nextHub = ownedHubs.find((h) => h.id !== truck.currentHubId);
                                      if (nextHub) setFerryDestHubId(nextHub.id);
                                    }}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    Ferry Yard
                                  </button>
                                )
                              )}
                            </div>

                            {!isEnRoute && state.trucks.length > 1 && (
                              <button
                                onClick={() => sellTruck(truck.id)}
                                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Liquidate Asset</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Trailers Inventory View */}
        {inventoryTab === 'trailers' && (
          <div>
            {filteredTrailers.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
                <Package className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Trailers Stationed in This Yard</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Acquire dedicated freight trailers (Dry Van, Reefer, Lowboy, Tanker) from the Marketplace Dealership.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Trailer Model</th>
                        <th className="py-3 px-4">Serial Number</th>
                        <th className="py-3 px-4">Terminal Depot</th>
                        <th className="py-3 px-4">Max Payload</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredTrailers.map((trailer) => {
                        const model = TRAILER_MODELS.find((m) => m.id === trailer.modelId);
                        const hub = state.hubs.find((h) => h.id === trailer.currentHubId);
                        const isEnRoute = trailer.status === 'en_route';

                        return (
                          <tr key={trailer.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{model?.name}</td>
                            <td className="py-3.5 px-4 font-mono text-amber-400">{trailer.serialNumber}</td>
                            <td className="py-3.5 px-4 text-slate-300">{hub?.name}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-300">
                              {model ? `${(model.maxPayloadKg / 1000).toFixed(0)} Tons` : '25 Tons'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                                {trailer.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {!isEnRoute && (
                                <button
                                  onClick={() => sellTrailer(trailer.id)}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

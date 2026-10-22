import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  MapPin,
  Fuel,
  Wrench,
  Truck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface HubsManagerProps {
  onSelectHub?: (hubId: string) => void;
}

export const HubsManager: React.FC<HubsManagerProps> = ({ onSelectHub }) => {
  const { state, upgradeHub } = useGame();

  const ownedHubs = state.hubs.filter((h) => h.isUnlocked);
  const [expandedHubIds, setExpandedHubIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  const toggleHubExpand = (hubId: string) => {
    setExpandedHubIds((prev) => ({
      ...prev,
      [hubId]: !prev[hubId],
    }));
  };

  const totalPages = Math.ceil(ownedHubs.length / pageSize) || 1;
  const paginatedHubs = ownedHubs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleUpgrade = (hubId: string, type: 'workshop' | 'bulkFuel') => {
    const cost = type === 'workshop' ? 35000 : 45000;
    const name = type === 'workshop' ? 'Workshop Service Bay' : 'Bulk Fuel Tanker Storage';
    if (window.confirm(`Confirm upgrade: Purchase ${name} expansion for $${cost.toLocaleString()}?`)) {
      upgradeHub(hubId, type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Regional Hub Depots & Terminal Logistics Network ({ownedHubs.length} Owned Hubs)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage spot diesel wholesale pricing, bulk fuel bunkering storage, and certified maintenance bays for your company-operated terminals. Click any hub card header to toggle details.
        </p>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedHubs.map((hub) => {
          const isExpanded = !!expandedHubIds[hub.id];
          const stationedTrucks = state.trucks.filter((t) => t.currentHubId === hub.id && t.status !== 'en_route');
          const stationedDrivers = state.drivers.filter((d) => d.currentHubId === hub.id);

          return (
            <div
              key={hub.id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Title & Region / Accordion Toggle */}
                <div
                  onClick={() => toggleHubExpand(hub.id)}
                  className="flex items-start justify-between cursor-pointer select-none group"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                      {hub.region} · {hub.country}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      <span>{hub.name}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {hub.code}
                  </span>
                </div>

                {/* Compact summary when collapsed */}
                {!isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Diesel: ${hub.fuelPricePerLiter.toFixed(2)}/L</span>
                    <span>Workshop T{hub.workshopLevel}</span>
                    <span className="text-amber-400 font-bold hover:underline">Expand details</span>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 mt-4 animate-fadeIn">
                    {/* Spot Market Fuel Pricing & Storage */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Spot Diesel Price</span>
                        <span className="text-lg font-bold text-amber-400 tabular-nums">
                          ${hub.fuelPricePerLiter.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500"> / liter</span>
                      </div>

                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Workshop Facility</span>
                        <span className="text-lg font-bold text-white tabular-nums">
                          Tier {hub.workshopLevel}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{hub.bayCount} service bays</span>
                      </div>
                    </div>

                    {/* Bulk Fuel Storage Status */}
                    <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-amber-400" />
                          Bulk Fuel Depot
                        </span>
                        <span className="text-slate-300 font-semibold tabular-nums">
                          {Math.round(hub.bulkFuelStockLiters).toLocaleString()} / {Math.round(hub.bulkFuelCapacityLiters).toLocaleString()} L
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${(hub.bulkFuelStockLiters / hub.bulkFuelCapacityLiters) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Stationed Assets */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        {stationedTrucks.length} trucks in yard
                      </span>
                      <span>·</span>
                      <span>{stationedDrivers.length} crew idle</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Upgrades (Shown when expanded) */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleUpgrade(hub.id, 'workshop')}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Wrench className="w-3 h-3 text-amber-400" />
                    <span>Expand Workshop ($35k)</span>
                  </button>

                  <button
                    onClick={() => handleUpgrade(hub.id, 'bulkFuel')}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Fuel className="w-3 h-3 text-amber-400" />
                    <span>Bulk Tanker ($45k)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, ownedHubs.length)} of {ownedHubs.length} hubs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

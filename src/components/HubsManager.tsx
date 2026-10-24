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
  const { state, upgradeHub, transferFuelBetweenHubs } = useGame();

  const ownedHubs = state.hubs.filter((h) => h.isUnlocked);
  const [expandedHubIds, setExpandedHubIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Fuel Transfer Modal state
  const [transferSourceHubId, setTransferSourceHubId] = useState<string | null>(null);
  const [transferDestHubId, setTransferDestHubId] = useState<string>('');
  const [transferLiters, setTransferLiters] = useState<number>(10000);

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

  const handleExecuteTransfer = () => {
    if (!transferSourceHubId || !transferDestHubId) return;
    const success = transferFuelBetweenHubs(transferSourceHubId, transferDestHubId, transferLiters);
    if (success) {
      setTransferSourceHubId(null);
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
          Manage spot diesel wholesale pricing, bulk fuel bunkering storage, inter-hub fuel transfers, and certified maintenance bays for your company-operated terminals.
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

                    {/* Bulk Fuel Storage Status & Transfer Button */}
                    <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-lg space-y-2">
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
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Hub-to-hub reserve balancing</span>
                        <button
                          onClick={() => {
                            setTransferSourceHubId(hub.id);
                            const otherHub = ownedHubs.find((h) => h.id !== hub.id);
                            setTransferDestHubId(otherHub ? otherHub.id : '');
                          }}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Transfer Fuel ⇄
                        </button>
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
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Wrench className="w-3 h-3 text-amber-400" />
                    <span>Expand Workshop ($35k)</span>
                  </button>

                  <button
                    onClick={() => handleUpgrade(hub.id, 'bulkFuel')}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
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

      {/* Fuel Transfer Modal */}
      {transferSourceHubId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <span>Inter-Hub Bulk Fuel Transfer</span>
              </h3>
              <button
                onClick={() => setTransferSourceHubId(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Source Terminal (Origin):</label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold">
                  {state.hubs.find((h) => h.id === transferSourceHubId)?.name} (Available:{' '}
                  {Math.round(state.hubs.find((h) => h.id === transferSourceHubId)?.bulkFuelStockLiters || 0).toLocaleString()}L)
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination Terminal:</label>
                <select
                  value={transferDestHubId}
                  onChange={(e) => setTransferDestHubId(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {ownedHubs
                    .filter((h) => h.id !== transferSourceHubId)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Capacity Space:{' '}
                        {Math.round(h.bulkFuelCapacityLiters - h.bulkFuelStockLiters).toLocaleString()}L)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transfer Volume (Liters):</label>
                <input
                  type="number"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={transferLiters}
                  onChange={(e) => setTransferLiters(Number(e.target.value))}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Logistics transport fee: $0.08 per liter transferred.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setTransferSourceHubId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
              >
                Authorize Transfer
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

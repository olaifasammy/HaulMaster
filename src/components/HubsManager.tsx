import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  MapPin,
  Fuel,
  Wrench,
  Truck,
  ChevronDown,
  ChevronUp,
  Ship,
  Train,
  Plane,
  Building2,
  DollarSign,
  Plus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface HubsManagerProps {
  onSelectHub?: (hubId: string) => void;
}

export const HubsManager: React.FC<HubsManagerProps> = ({ onSelectHub }) => {
  const {
    state,
    upgradeHub,
    transferFuelBetweenHubs,
    procureBulkFuelForHub,
    refuelTruckFromBulkReserve,
    refuelAllStationedTrucksFromReserves,
    acquireTerminalConcession,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'hubs' | 'terminals'>('hubs');
  const ownedHubs = state.hubs.filter((h) => h.isUnlocked);
  const [expandedHubIds, setExpandedHubIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Fuel Transfer Modal state
  const [transferSourceHubId, setTransferSourceHubId] = useState<string | null>(null);
  const [transferDestHubId, setTransferDestHubId] = useState<string>('');
  const [transferLiters, setTransferLiters] = useState<number>(10000);

  // Bulk fuel procurement modal / amount state per hub
  const [procureHubId, setProcureHubId] = useState<string | null>(null);
  const [procureLiters, setProcureLiters] = useState<number>(20000);

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

  const handleProcureFuel = (hubId: string) => {
    if (procureLiters <= 0) return;
    procureBulkFuelForHub(hubId, procureLiters);
    setProcureHubId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Corporate Hub Depots & Terminal Concessions</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage company operational headquarters, bulk wholesale fuel reserves ($0 refuel cost), workshop bays, and global port/intermodal terminal concessions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('hubs')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hubs'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Corporate Hub Depots ({ownedHubs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('terminals')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'terminals'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>Terminal Concessions ({state.terminalConcessions?.filter(c => c.isOwned).length || 0} Owned)</span>
          </button>
        </div>
      </div>

      {/* Global Quick Action Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Company-Wide Bulk Fleet Refueling</h4>
            <p className="text-[11px] text-slate-400">Instantly bunker all idle trucks stationed at hubs from company reserves at $0 cost.</p>
          </div>
        </div>
        <button
          onClick={() => refuelAllStationedTrucksFromReserves()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refill All Stationed Trucks ($0)</span>
        </button>
      </div>

      {/* TAB 1: CORPORATE HUB DEPOTS */}
      {activeTab === 'hubs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedHubs.map((hub) => {
              const isExpanded = !!expandedHubIds[hub.id];
              const stationedTrucks = state.trucks.filter((t) => t.currentHubId === hub.id && t.status !== 'en_route');
              const stationedDrivers = state.drivers.filter((d) => d.currentHubId === hub.id);
              const fillPercentage = Math.min(100, (hub.bulkFuelStockLiters / hub.bulkFuelCapacityLiters) * 100);

              return (
                <div
                  key={hub.id}
                  className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
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
                      <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                        {hub.code}
                      </span>
                    </div>

                    {/* Compact summary when collapsed */}
                    {!isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>Reserves: {Math.round(hub.bulkFuelStockLiters).toLocaleString()}L</span>
                        <span>Workshop T{hub.workshopLevel}</span>
                        <span className="text-amber-400 font-bold hover:underline">Manage Depot</span>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="space-y-4 mt-4 animate-fadeIn">
                        {/* Spot Market Fuel Pricing & Storage */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-500 uppercase block">Spot Retail Price</span>
                            <span className="text-base font-bold text-amber-400 tabular-nums">
                              ${hub.fuelPricePerLiter.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500"> / liter</span>
                          </div>

                          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-500 uppercase block">Workshop Bays</span>
                            <span className="text-base font-bold text-white tabular-nums">
                              Tier {hub.workshopLevel}
                            </span>
                            <span className="text-[10px] text-slate-500 block">{hub.bayCount} service bays</span>
                          </div>
                        </div>

                        {/* Bulk Fuel Storage Bar & Controls */}
                        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                              <Fuel className="w-4 h-4 text-amber-400" />
                              Bulk Diesel Reserves
                            </span>
                            <span className="text-amber-400 font-semibold tabular-nums">
                              {Math.round(hub.bulkFuelStockLiters).toLocaleString()} / {Math.round(hub.bulkFuelCapacityLiters).toLocaleString()} L
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setProcureHubId(hub.id)}
                              className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Procure Wholesale ($0.85/L)</span>
                            </button>

                            <button
                              onClick={() => {
                                setTransferSourceHubId(hub.id);
                                const otherHub = ownedHubs.find((h) => h.id !== hub.id);
                                setTransferDestHubId(otherHub ? otherHub.id : '');
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold transition-colors cursor-pointer font-mono"
                            >
                              Transfer ⇄
                            </button>
                          </div>
                        </div>

                        {/* Stationed Assets */}
                        <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-amber-400" />
                            {stationedTrucks.length} trucks in yard
                          </span>
                          <button
                            onClick={() => refuelAllStationedTrucksFromReserves(hub.id)}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Refuel Yard Trucks ($0)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terminal Upgrades (Shown when expanded) */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleUpgrade(hub.id, 'workshop')}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                      >
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>Workshop ($35k)</span>
                      </button>

                      <button
                        onClick={() => handleUpgrade(hub.id, 'bulkFuel')}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                      >
                        <Fuel className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tanker ($45k)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 font-mono text-xs">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 text-slate-300 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 text-slate-300 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERMODAL & PORT TERMINAL CONCESSIONS */}
      {activeTab === 'terminals' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Global Intermodal & Port Concessions</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Acquire exclusive operating leases for deep-water container ports, transcontinental rail-bridge terminals, and air freight cargo ramps. Generates guaranteed daily dividends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(state.terminalConcessions || []).map((concession) => {
              const dailyDiv = Math.round(concession.weeklyRevenueUsd / 7);
              const isOwned = concession.isOwned;

              return (
                <div
                  key={concession.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                    isOwned
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${
                          concession.type === 'port_container'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            : concession.type === 'rail_bridge'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        }`}>
                          {concession.type === 'port_container' && <Ship className="w-5 h-5" />}
                          {concession.type === 'rail_bridge' && <Train className="w-5 h-5" />}
                          {concession.type === 'air_freight' && <Plane className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            {concession.type.replace('_', ' ')} · {concession.location}
                          </span>
                          <h4 className="text-base font-bold text-white">{concession.name}</h4>
                        </div>
                      </div>

                      {isOwned && (
                        <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Owned Concession
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Acquisition Lease</span>
                        <span className="text-base font-bold text-white tabular-nums">
                          ${concession.acquisitionCostUsd.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Daily Dividend Yield</span>
                        <span className="text-base font-bold text-emerald-400 tabular-nums">
                          +${dailyDiv.toLocaleString()} / day
                        </span>
                        <span className="text-[10px] text-slate-500">(${concession.weeklyRevenueUsd.toLocaleString()}/wk)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    {isOwned ? (
                      <div className="w-full py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-center text-xs font-mono text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span>Active Concession Yielding Dividends</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`Acquire terminal concession for ${concession.name} at $${concession.acquisitionCostUsd.toLocaleString()}?`)) {
                            acquireTerminalConcession(concession.id);
                          }
                        }}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Acquire Lease (${concession.acquisitionCostUsd.toLocaleString()})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FUEL TRANSFER MODAL */}
      {transferSourceHubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <span>Inter-Hub Bulk Fuel Transfer</span>
              </h4>
              <button
                onClick={() => setTransferSourceHubId(null)}
                className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Source Hub Depot</label>
                <input
                  type="text"
                  disabled
                  value={ownedHubs.find((h) => h.id === transferSourceHubId)?.name || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination Hub Depot</label>
                <select
                  value={transferDestHubId}
                  onChange={(e) => setTransferDestHubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="">Select destination hub...</option>
                  {ownedHubs
                    .filter((h) => h.id !== transferSourceHubId)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({Math.round(h.bulkFuelStockLiters)}L / {Math.round(h.bulkFuelCapacityLiters)}L)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transfer Volume (Liters)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={transferLiters}
                  onChange={(e) => setTransferLiters(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setTransferSourceHubId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHOLESALE FUEL PROCUREMENT MODAL */}
      {procureHubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <span>Procure Wholesale Diesel</span>
              </h4>
              <button
                onClick={() => setProcureHubId(null)}
                className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <p className="text-slate-300">
                Purchase discounted wholesale diesel ($0.85/L) to replenish bulk reserves at {state.hubs.find(h => h.id === procureHubId)?.name}.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setProcureLiters(amt)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      procureLiters === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {(amt / 1000).toFixed(0)}k Liters
                  </button>
                ))}
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Custom Liters</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={procureLiters}
                  onChange={(e) => setProcureLiters(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Total Wholesale Cost:</span>
                <span className="text-amber-400 font-bold text-sm">
                  ${Math.round(procureLiters * 0.85).toLocaleString()} USD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setProcureHubId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcureFuel(procureHubId)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

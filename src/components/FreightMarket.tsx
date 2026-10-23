import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Package,
  Thermometer,
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  RefreshCw,
  Weight,
  Layers,
} from 'lucide-react';

interface FreightMarketProps {
  onDispatchContract: (contractId: string) => void;
}

export const FreightMarket: React.FC<FreightMarketProps> = ({ onDispatchContract }) => {
  const { state, refreshAvailableContracts } = useGame();
  const unlockedRegions = state.unlockedRegions || [];
  const [selectedRegion, setSelectedRegion] = useState<string>(unlockedRegions[0] || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    if (unlockedRegions.length > 0 && !unlockedRegions.includes(selectedRegion)) {
      setSelectedRegion(unlockedRegions[0]);
    }
  }, [unlockedRegions, selectedRegion]);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Consignments' },
    { id: 'Heavy Machinery', label: 'Heavy Machinery' },
    { id: 'Refrigerated Food', label: 'Cold-Chain Reefer' },
    { id: 'High-Value Tech', label: 'High-Value Tech' },
    { id: 'Hazardous Chemicals', label: 'ADR Chemicals' },
    { id: 'Dry Freight', label: 'Dry General Freight' },
  ];

  const filteredContracts = state.availableContracts.filter((c) => {
    const originHub = state.hubs.find((h) => h.id === c.originHubId);
    if (!originHub || !originHub.isUnlocked || !unlockedRegions.includes(originHub.region)) return false;

    if (selectedRegion && originHub.region !== selectedRegion) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    return true;
  });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshAvailableContracts(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Spot & Contract Freight Exchange</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Dispatch Board
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tender high-yield freight consignments matching your tractor GVWR ratings and trailer equipment. Overweight consignments require certified multi-axle heavy haulers.
          </p>
        </div>

        {/* Action Controls: Instant Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || state.balanceUsd < 1500}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              state.balanceUsd < 1500
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 hover:border-amber-400'
            }`}
            title="Pay express broker fee ($1,500) to generate a brand new set of tendered freight contracts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
            <span>Refresh Board ($1,500 Fee)</span>
          </button>
        </div>
      </div>

      {/* Region Filter Tabs */}
      {unlockedRegions.length > 1 && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
          <span className="text-[11px] font-mono font-bold text-slate-400 pl-2">Region:</span>
          {unlockedRegions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedRegion === reg
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <span className="text-[11px] font-mono text-slate-500 ml-auto pr-3 hidden sm:inline">
          {filteredContracts.length} available consignments
        </span>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContracts.length === 0 ? (
          <div className="col-span-full p-12 bg-slate-900/40 border border-slate-800 rounded-xl text-center space-y-3">
            <Package className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-semibold">No active cargo contracts matching this filter.</p>
            <p className="text-xs text-slate-500">
              Refresh the board for $1,500 broker fee, unlock more route corridors, or wait for automatic restock.
            </p>
            <button
              onClick={handleManualRefresh}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Board Now</span>
            </button>
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const originHub = state.hubs.find((h) => h.id === contract.originHubId);
            const destHub = state.hubs.find((h) => h.id === contract.destinationHubId);
            const matchedRoute = state.routes.find(
              (r) => r.originHubId === contract.originHubId && r.destinationHubId === contract.destinationHubId
            );
            const distanceKm = matchedRoute?.distanceKm || 1200;
            const ratePerKm = (contract.payoutUsd / distanceKm).toFixed(2);

            // Payload classification
            let payloadBadgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            let payloadSuitability = 'Rigid & 4x2 Suitable (≤14t)';
            if (contract.weightTons > 38) {
              payloadBadgeClass = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
              payloadSuitability = 'Extreme Heavy Haul (8x4 / Modular Lowbed)';
            } else if (contract.weightTons > 24) {
              payloadBadgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
              payloadSuitability = '6x4 Heavy Cargo (Lowboy / 34t+)';
            } else if (contract.weightTons > 14) {
              payloadBadgeClass = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
              payloadSuitability = 'Standard 4x2 / 6x4 Tractor (≤24t)';
            }

            return (
              <div
                key={contract.id}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  {/* Category & Weight Rating Header */}
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-amber-400 font-bold">{contract.category}</span>
                    <span className="text-slate-300 font-bold tabular-nums flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5 text-slate-400" />
                      {contract.weightTons} metric tons
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{contract.title}</h4>

                  {/* Issuing Shipper Company */}
                  {contract.shipperCompany && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-300 font-medium truncate" title={contract.shipperCompany}>
                        🏢 <span className="text-white font-semibold">{contract.shipperCompany}</span>
                      </span>
                      {contract.shipperRating && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                          Rating {contract.shipperRating}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Origin to Destination */}
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-300 font-medium">
                    <span className="font-semibold text-white">{originHub?.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-semibold text-white">{destHub?.name.split(' ')[0]}</span>
                    <span className="text-slate-500 text-[11px] font-mono ml-auto">
                      {distanceKm} km
                    </span>
                  </div>

                  {/* Vehicle Compatibility & Equipment Directives */}
                  <div className="mt-3 space-y-1.5">
                    <div className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${payloadBadgeClass}`}>
                      <Layers className="w-3 h-3" />
                      <span>{payloadSuitability}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {contract.temperatureControlled && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                          <Thermometer className="w-3 h-3" />
                          <span>Reefer Trailer Required</span>
                        </span>
                      )}
                      {contract.isHazardous && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{contract.hazardClass || 'ADR Chemical Tanker'}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{Math.round(contract.deadlineMinutes / 60)}h window</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Dispatch Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Gross Revenue</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                      ${contract.payoutUsd.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      +${contract.bonusOnTimeUsd} bonus (${ratePerKm}/km)
                    </div>
                  </div>

                  <button
                    onClick={() => onDispatchContract(contract.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Haul</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CargoCategory } from '../types/game';
import {
  Package,
  Thermometer,
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  Filter,
} from 'lucide-react';

interface FreightMarketProps {
  onDispatchContract: (contractId: string) => void;
}

export const FreightMarket: React.FC<FreightMarketProps> = ({ onDispatchContract }) => {
  const { state } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Consignments' },
    { id: 'Heavy Machinery', label: 'Heavy Machinery' },
    { id: 'Refrigerated Food', label: 'Cold-Chain Reefer' },
    { id: 'High-Value Tech', label: 'High-Value Tech' },
    { id: 'Hazardous Chemicals', label: 'ADR Chemicals' },
    { id: 'Dry Freight', label: 'Dry General Freight' },
  ];

  const filteredContracts = state.availableContracts.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Spot & Contract Logistics Market</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select high-yield freight consignments matching your fleet vehicle specs and driver certifications.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContracts.length === 0 ? (
          <div className="col-span-full p-12 bg-slate-900/40 border border-slate-800 rounded-xl text-center space-y-2">
            <p className="text-sm text-slate-400">No active cargo contracts matching this filter.</p>
            <p className="text-xs text-slate-500">Wait for the midnight market restock or dispatch open routes.</p>
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

            return (
              <div
                key={contract.id}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  {/* Category & Requirements Header */}
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-amber-400 font-bold">{contract.category}</span>
                    <span className="text-slate-400 tabular-nums">{contract.weightTons} metric tons</span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{contract.title}</h4>

                  {/* Origin to Destination */}
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-300 font-medium">
                    <span className="font-semibold text-white">{originHub?.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-semibold text-white">{destHub?.name.split(' ')[0]}</span>
                    <span className="text-slate-500 text-[11px] font-mono ml-auto">
                      {distanceKm} km
                    </span>
                  </div>

                  {/* Cargo Badges & Special Directives */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {contract.temperatureControlled && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                        <Thermometer className="w-3 h-3" />
                        <span>Reefer (-18°C)</span>
                      </span>
                    )}
                    {contract.isHazardous && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{contract.hazardClass || 'ADR Hazmat'}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{Math.round(contract.deadlineMinutes / 60)}h deadline</span>
                    </span>
                  </div>
                </div>

                {/* Pricing & Dispatch Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Gross Payout</div>
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

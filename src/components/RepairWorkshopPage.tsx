import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS } from '../constants/gameData';
import { TruckInstance } from '../types/game';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Truck as TruckIcon,
  Sparkles,
  ShieldAlert,
  Flame,
  Gauge,
  Activity,
  ArrowRight,
  Disc,
  RotateCcw,
  Zap,
  Fuel,
  Info,
} from 'lucide-react';

interface RepairWorkshopPageProps {
  initialTruckId?: string | null;
  onInspectTruck?: (truckId: string) => void;
}

export const RepairWorkshopPage: React.FC<RepairWorkshopPageProps> = ({
  initialTruckId,
  onInspectTruck,
}) => {
  const { state, repairSubsystem, serviceTruck, clearDTCs, upgradeHub, notifyUser } = useGame();

  const [selectedTruckId, setSelectedTruckId] = useState<string>(
    initialTruckId || state.trucks[0]?.id || ''
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_service' | 'critical' | 'idle'>('all');

  const selectedTruck = state.trucks.find((t) => t.id === selectedTruckId) || state.trucks[0];
  const model = selectedTruck ? TRUCK_MODELS.find((m) => m.id === selectedTruck.modelId) : null;
  const currentHub = selectedTruck ? state.hubs.find((h) => h.id === selectedTruck.currentHubId) : null;

  // Workshop tier details
  const workshopLevel = currentHub?.workshopLevel || 1;
  const workshopDiscountPct = workshopLevel === 3 ? 20 : workshopLevel === 2 ? 10 : 0;

  // Filter trucks
  const filteredTrucks = state.trucks.filter((truck) => {
    const minSubHealth = Math.min(
      truck.subsystems.engineBlock,
      truck.subsystems.brakePads,
      truck.subsystems.turbocharger,
      truck.subsystems.steerTires.wearPercentage,
      truck.subsystems.coolingSystem
    );
    const hasDTC = truck.activeDTCs.length > 0;
    const isServiceDue = truck.odometerKm >= truck.serviceDueKm;

    if (activeFilter === 'critical') {
      return minSubHealth < 35 || hasDTC || truck.subsystems.steerTires.treadDepthMm <= 2.5;
    }
    if (activeFilter === 'needs_service') {
      return minSubHealth < 65 || isServiceDue || hasDTC;
    }
    if (activeFilter === 'idle') {
      return truck.status === 'idle';
    }
    return true;
  });

  const getSubsystemStatusColor = (val: number) => {
    if (val >= 75) return 'text-emerald-400';
    if (val >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getSubsystemBg = (val: number) => {
    if (val >= 75) return 'bg-emerald-500';
    if (val >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (state.trucks.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto my-12">
        <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Commercial Trucks in Fleet</h3>
        <p className="text-xs text-slate-400 mt-1">Acquire trucks from the Marketplace to access workshop repairs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workshop Header & Facility Banner */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-500/10 via-cyan-500/5 to-transparent pointer-events-none blur-2xl" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Fleet Maintenance & Workshop Bay
                </h1>
                <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  Tier {workshopLevel} Facility
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Component diagnostics, precision reconditioning, TPMS tire recapping, and OBD ECU servicing
              </p>
            </div>
          </div>

          {/* Current Hub Workshop Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Parts & Labor Tariff
              </div>
              <div className="text-xs font-mono font-bold text-white mt-0.5 flex items-center gap-1.5">
                {workshopDiscountPct > 0 ? (
                  <span className="text-emerald-400 font-bold">{workshopDiscountPct}% Master Discount</span>
                ) : (
                  <span>Standard Depot Rates</span>
                )}
              </div>
            </div>

            {currentHub && currentHub.workshopLevel < 3 && currentHub.isUnlocked && (
              <button
                onClick={() => upgradeHub(currentHub.id, 'workshop')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Upgrade workshop to unlock parts discounts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade Bay ($18k)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Workshop Bay Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Fleet Selection & Health Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Fleet Fleet Roster ({state.trucks.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Select vehicle</span>
            </div>

            {/* Filter Buttons */}
            <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`py-1.5 px-2.5 rounded-lg text-left transition-colors cursor-pointer text-[11px] ${
                  activeFilter === 'all'
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-white bg-slate-950/60'
                }`}
              >
                All Trucks ({state.trucks.length})
              </button>
              <button
                onClick={() => setActiveFilter('needs_service')}
                className={`py-1.5 px-2.5 rounded-lg text-left transition-colors cursor-pointer text-[11px] ${
                  activeFilter === 'needs_service'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-300 bg-slate-950/60'
                }`}
              >
                Service Due
              </button>
              <button
                onClick={() => setActiveFilter('critical')}
                className={`py-1.5 px-2.5 rounded-lg text-left transition-colors cursor-pointer text-[11px] ${
                  activeFilter === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-300 bg-slate-950/60'
                }`}
              >
                Critical Warnings
              </button>
              <button
                onClick={() => setActiveFilter('idle')}
                className={`py-1.5 px-2.5 rounded-lg text-left transition-colors cursor-pointer text-[11px] ${
                  activeFilter === 'idle'
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-white bg-slate-950/60'
                }`}
              >
                In Depot (Ready)
              </button>
            </div>

            {/* Vehicle List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredTrucks.map((truck) => {
                const trkModel = TRUCK_MODELS.find((m) => m.id === truck.modelId);
                const isSelected = truck.id === selectedTruckId;
                const isEnRoute = truck.status === 'en_route';

                const minHealth = Math.min(
                  truck.subsystems.engineBlock,
                  truck.subsystems.brakePads,
                  truck.subsystems.turbocharger,
                  truck.subsystems.steerTires.wearPercentage
                );

                const hasFaults = truck.activeDTCs.length > 0;
                const treadMin = Math.min(
                  truck.subsystems.steerTires.treadDepthMm,
                  truck.subsystems.driveTiresAxle1.treadDepthMm
                );

                return (
                  <button
                    key={truck.id}
                    onClick={() => setSelectedTruckId(truck.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{trkModel?.name || truck.modelId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-amber-400 font-semibold">{truck.plate}</span>
                          <span>·</span>
                          <span>{Math.round(truck.odometerKm).toLocaleString()} km</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          isEnRoute
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isEnRoute ? 'Hauling' : 'Depot'}
                      </span>
                    </div>

                    {/* Subsystem Health Bar & Flags */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Lowest Subsystem</span>
                        <span className={`font-bold tabular-nums ${getSubsystemStatusColor(minHealth)}`}>
                          {Math.round(minHealth)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getSubsystemBg(minHealth)}`}
                          style={{ width: `${Math.max(4, Math.min(100, minHealth))}%` }}
                        />
                      </div>
                    </div>

                    {/* Warning Flags */}
                    {(hasFaults || treadMin <= 2.5) && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-rose-400 font-mono">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>
                          {hasFaults ? `${truck.activeDTCs.length} DTC fault(s)` : `Tire tread low (${treadMin.toFixed(1)}mm)`}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Vehicle Diagnostics & Repair Center (8 cols) */}
        {selectedTruck && model ? (
          <div className="lg:col-span-8 space-y-5">
            
            {/* Selected Truck Hero Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{model.name}</h2>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                        {selectedTruck.plate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span>VIN: {selectedTruck.vin}</span>
                      <span>·</span>
                      <span>Odo: {Math.round(selectedTruck.odometerKm).toLocaleString()} km</span>
                      <span>·</span>
                      <span className="capitalize">{selectedTruck.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {onInspectTruck && (
                  <button
                    onClick={() => onInspectTruck(selectedTruck.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Telemetry Charts</span>
                  </button>
                )}
              </div>

              {/* ECU Diagnostic Faults Banner */}
              {selectedTruck.activeDTCs.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-300">
                        Active ECU Diagnostic Fault Codes Detected ({selectedTruck.activeDTCs.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {selectedTruck.activeDTCs.map((dtc, idx) => (
                          <div key={idx} className="text-[11px] font-mono text-slate-300">
                            <span className="text-rose-400 font-bold">{dtc.code}:</span> {dtc.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => clearDTCs(selectedTruck.id)}
                    className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-lg text-rose-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  >
                    Clear ECU Codes
                  </button>
                </div>
              )}

              {/* Authorized Service Packages */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Comprehensive Service Bay Packages
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Requires truck parked at hub depot
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Routine A-Service</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Synthetic oil, filters, coolant flush, sensor calibration
                      </p>
                      <div className="text-base font-bold font-mono text-amber-400 mt-2">$1,450</div>
                    </div>
                    <button
                      disabled={selectedTruck.status === 'en_route'}
                      onClick={() => serviceTruck(selectedTruck.id, 'A')}
                      className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Authorize A-Service
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Major B-Service</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Brake friction pads, rotors, clutch plate, suspension dampers
                      </p>
                      <div className="text-base font-bold font-mono text-amber-400 mt-2">$3,800</div>
                    </div>
                    <button
                      disabled={selectedTruck.status === 'en_route'}
                      onClick={() => serviceTruck(selectedTruck.id, 'B')}
                      className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Authorize B-Service
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Master Factory Overhaul</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Full strip-down, turbo rebuild, pristine 100% reset on all systems
                      </p>
                      <div className="text-base font-bold font-mono text-amber-400 mt-2">$16,500</div>
                    </div>
                    <button
                      disabled={selectedTruck.status === 'en_route'}
                      onClick={() => serviceTruck(selectedTruck.id, 'Overhaul')}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      Execute Overhaul
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Component-by-Component Precision Repair Bay */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Precision Component Repair Bay</h3>
                  <p className="text-[11px] text-slate-400">
                    Service individual worn parts without paying for unnecessary full-system overhaul packages
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Treasury: ${state.balanceUsd.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* 1. Engine Block */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Engine Cylinders & Block</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${getSubsystemStatusColor(selectedTruck.subsystems.engineBlock)}`}>
                        {Math.round(selectedTruck.subsystems.engineBlock)}%
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getSubsystemBg(selectedTruck.subsystems.engineBlock)}`}
                        style={{ width: `${selectedTruck.subsystems.engineBlock}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cost: ${Math.round(1200 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.engineBlock >= 98 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'engine')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Recondition
                  </button>
                </div>

                {/* 2. Turbocharger */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Turbo VGT Actuator</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${getSubsystemStatusColor(selectedTruck.subsystems.turbocharger)}`}>
                        {Math.round(selectedTruck.subsystems.turbocharger)}%
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getSubsystemBg(selectedTruck.subsystems.turbocharger)}`}
                        style={{ width: `${selectedTruck.subsystems.turbocharger}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cost: ${Math.round(1650 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.turbocharger >= 98 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'turbo')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Replace Actuator
                  </button>
                </div>

                {/* 3. Brakes & Rotors */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Brake Friction Pads</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${getSubsystemStatusColor(selectedTruck.subsystems.brakePads)}`}>
                        {Math.round(selectedTruck.subsystems.brakePads)}%
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getSubsystemBg(selectedTruck.subsystems.brakePads)}`}
                        style={{ width: `${selectedTruck.subsystems.brakePads}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cost: ${Math.round(850 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.brakePads >= 98 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'brakes')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    New Pads
                  </button>
                </div>

                {/* 4. Cooling Radiator */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Cooling Radiator & Pump</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${getSubsystemStatusColor(selectedTruck.subsystems.coolingSystem)}`}>
                        {Math.round(selectedTruck.subsystems.coolingSystem)}%
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getSubsystemBg(selectedTruck.subsystems.coolingSystem)}`}
                        style={{ width: `${selectedTruck.subsystems.coolingSystem}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cost: ${Math.round(650 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.coolingSystem >= 98 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'cooling')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Radiator Flush
                  </button>
                </div>

                {/* 5. Steer Tires */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Steer Axle Tires</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${selectedTruck.subsystems.steerTires.treadDepthMm <= 2.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedTruck.subsystems.steerTires.treadDepthMm.toFixed(1)} mm
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {Math.round(selectedTruck.subsystems.steerTires.wearPercentage)}% integrity · {selectedTruck.subsystems.steerTires.pressurePsi} PSI
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cost: ${Math.round(1100 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.steerTires.treadDepthMm >= 15.5 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'steerTires')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Recap Steer Set
                  </button>
                </div>

                {/* 6. Drive Axle Tires */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Drive Axle Dual Tires</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${selectedTruck.subsystems.driveTiresAxle1.treadDepthMm <= 2.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedTruck.subsystems.driveTiresAxle1.treadDepthMm.toFixed(1)} mm
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {Math.round(selectedTruck.subsystems.driveTiresAxle1.wearPercentage)}% integrity · {selectedTruck.subsystems.driveTiresAxle1.pressurePsi} PSI
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cost: ${Math.round(1500 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.driveTiresAxle1.treadDepthMm >= 15.5 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'driveTires')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Recap Drive Duals
                  </button>
                </div>

                {/* 7. DPF / SCR Emissions */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">DPF Soot & SCR Catalyst</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${getSubsystemStatusColor(selectedTruck.subsystems.exhaustAftertreatment)}`}>
                        {Math.round(selectedTruck.subsystems.exhaustAftertreatment)}%
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getSubsystemBg(selectedTruck.subsystems.exhaustAftertreatment)}`}
                        style={{ width: `${selectedTruck.subsystems.exhaustAftertreatment}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cost: ${Math.round(1100 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.exhaustAftertreatment >= 98 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'emissions')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Regenerate DPF
                  </button>
                </div>

                {/* 8. Air Suspension */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Air Suspension Bellows</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${getSubsystemStatusColor(selectedTruck.subsystems.suspensionDampers)}`}>
                        {Math.round(selectedTruck.subsystems.suspensionDampers)}%
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getSubsystemBg(selectedTruck.subsystems.suspensionDampers)}`}
                        style={{ width: `${selectedTruck.subsystems.suspensionDampers}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cost: ${Math.round(950 * (1 - workshopDiscountPct / 100)).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={selectedTruck.subsystems.suspensionDampers >= 98 || selectedTruck.status === 'en_route'}
                    onClick={() => repairSubsystem(selectedTruck.id, 'suspension')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Replace Bellows
                  </button>
                </div>

              </div>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};

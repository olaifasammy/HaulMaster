import React from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS, TRAILER_MODELS, LIVERY_PALETTES } from '../constants/gameData';
import {
  X,
  Gauge,
  Thermometer,
  Wrench,
  Fuel,
  Activity,
  AlertTriangle,
  CheckCircle,
  Truck as TruckIcon,
  Wind,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface TruckInspectorModalProps {
  truckId: string | null;
  onClose: () => void;
}

export const TruckInspectorModal: React.FC<TruckInspectorModalProps> = ({ truckId, onClose }) => {
  const { state, serviceTruck, refuelTruckAtHub } = useGame();

  if (!truckId) return null;

  const truck = state.trucks.find((t) => t.id === truckId);
  if (!truck) return null;

  const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
  if (!model) return null;

  const activeTrip = state.activeTrips.find((trip) => trip.truckId === truck.id);
  const driver = state.drivers.find((d) => d.id === truck.assignedDriverId);
  const hub = state.hubs.find((h) => h.id === truck.currentHubId);

  const telemetry = activeTrip?.telemetry || {
    currentSpeedKmh: 0,
    engineRpm: 650,
    currentGear: 0,
    instantFuelRateL100km: 0,
    instantFuelRateLitersPerHour: 0,
    engineLoadPct: 0,
    turboBoostBar: 0,
    oilTempCelsius: 75,
    oilPressureBar: 3.2,
    coolantTempCelsius: 75,
    brakeTempCelsius: 35,
    retarderActive: false,
    retarderLevel: 0,
    currentInclinePct: 0,
    currentWindSpeedKmh: 8,
    currentHeadwindComponentKmh: 0,
  };

  const isEnRoute = truck.status === 'en_route';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white">{model.name}</h3>
                <span className="font-mono text-xs text-amber-400 font-semibold">{truck.plate}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {Math.round(truck.odometerKm).toLocaleString()} km · {model.category}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Inspector"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isEnRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-xs sm:text-sm font-semibold capitalize text-white truncate">
                  {truck.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {isEnRoute ? 'In Transit' : hub?.name.split(' ')[0]}
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Driver</div>
              <div className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
                {driver ? driver.name.split(' ')[0] : 'None'}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {driver ? `Eco ${driver.stats.ecoDrivingRating}/100` : 'Uncrewed'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Fuel Level</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                {Math.round(truck.fuelCurrentLiters)} L
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${(truck.fuelCurrentLiters / model.specs.fuelTankCapacityLiters) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Engine Power</div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                {model.specs.horsepower} HP
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {model.specs.torqueNm} Nm Torque
              </div>
            </div>
          </div>

          {/* Live Telemetry Gauges */}
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Live Dyno Telemetry
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {isEnRoute ? 'Active Haul' : 'Engine Idle'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Speed</div>
                <div className="text-base sm:text-lg font-mono font-bold text-white tabular-nums my-0.5">
                  {Math.round(telemetry.currentSpeedKmh)}
                </div>
                <div className="text-[9px] font-mono text-slate-500">km/h</div>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <div className="text-[9px] font-mono text-slate-400 uppercase">RPM</div>
                <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 tabular-nums my-0.5">
                  {telemetry.engineRpm}
                </div>
                <div className="text-[9px] font-mono text-slate-500">Gear {telemetry.currentGear}</div>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Boost</div>
                <div className="text-base sm:text-lg font-mono font-bold text-sky-400 tabular-nums my-0.5">
                  {telemetry.turboBoostBar.toFixed(1)}
                </div>
                <div className="text-[9px] font-mono text-slate-500">{telemetry.engineLoadPct}% load</div>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Burn</div>
                <div className="text-base sm:text-lg font-mono font-bold text-amber-400 tabular-nums my-0.5">
                  {telemetry.instantFuelRateL100km}
                </div>
                <div className="text-[9px] font-mono text-slate-500">L/100km</div>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Oil Temp</div>
                <div className="text-base sm:text-lg font-mono font-bold text-white tabular-nums my-0.5">
                  {telemetry.oilTempCelsius}°
                </div>
                <div className="text-[9px] font-mono text-slate-500">Nominal</div>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Brake</div>
                <div className={`text-base sm:text-lg font-mono font-bold tabular-nums my-0.5 ${telemetry.brakeTempCelsius > 350 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {telemetry.brakeTempCelsius}°
                </div>
                <div className="text-[9px] font-mono text-slate-500">Disc °C</div>
              </div>
            </div>
          </div>

          {/* Subsystems & TPMS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subsystems Degradation */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
              <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                Subsystem Integrity
              </h4>

              {[
                { label: 'Engine Cylinders', val: truck.subsystems.engineBlock },
                { label: 'Turbo VGT Actuator', val: truck.subsystems.turbocharger },
                { label: 'Automated Transmission', val: truck.subsystems.transmission },
                { label: 'Heavy Clutch Plate', val: truck.subsystems.clutchPlate },
                { label: 'Brake Friction Pads', val: truck.subsystems.brakePads },
                { label: 'Cooling Radiator', val: truck.subsystems.coolingSystem },
                { label: 'Air Suspension', val: truck.subsystems.suspensionDampers },
                { label: 'DPF/SCR Emissions', val: truck.subsystems.exhaustAftertreatment },
              ].map((sub, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{sub.label}</span>
                    <span className="font-mono font-semibold text-slate-200 tabular-nums">
                      {Math.round(sub.val)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sub.val >= 70 ? 'bg-emerald-500' : sub.val >= 35 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.max(0, Math.min(100, sub.val))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* TPMS & Diagnostic Codes */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  TPMS Axle Tire Status
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-[9px] font-mono text-slate-400 uppercase">Steer Axle</div>
                    <div className="font-mono font-bold text-white tabular-nums mt-0.5">
                      {truck.subsystems.steerTires.pressurePsi} PSI
                    </div>
                    <div className="text-[10px] font-mono text-amber-400 tabular-nums mt-0.5">
                      {truck.subsystems.steerTires.treadDepthMm} mm tread
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-[9px] font-mono text-slate-400 uppercase">Drive Axle</div>
                    <div className="font-mono font-bold text-white tabular-nums mt-0.5">
                      {truck.subsystems.driveTiresAxle1.pressurePsi} PSI
                    </div>
                    <div className="text-[10px] font-mono text-amber-400 tabular-nums mt-0.5">
                      {truck.subsystems.driveTiresAxle1.treadDepthMm} mm tread
                    </div>
                  </div>
                </div>
              </div>

              {/* DTCs */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                    OBD Diagnostics
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {truck.activeDTCs.length} Faults
                  </span>
                </div>

                {truck.activeDTCs.length === 0 ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-400 text-xs">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>All sensors nominal. Zero error codes.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {truck.activeDTCs.map((dtc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-mono font-bold text-rose-300">{dtc.code}</span>
                        <span className="text-slate-300 truncate">{dtc.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Factory Customization & Equipment Specs */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Dealership Factory Specification & Equipment
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Aero Package</span>
                <span className={`font-bold mt-0.5 block ${truck.hasAeroPackage ? 'text-sky-400' : 'text-slate-400'}`}>
                  {truck.hasAeroPackage ? 'Aero Skirts (-12%)' : 'Standard Cab'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Engine Retarder</span>
                <span className={`font-bold mt-0.5 block ${truck.hasRetarder ? 'text-amber-400' : 'text-slate-400'}`}>
                  {truck.hasRetarder ? 'Hydraulic Equipped' : 'Standard Disc'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Tire Compound</span>
                <span className="font-bold text-white mt-0.5 block capitalize">
                  {truck.tireCompound ? truck.tireCompound.replace('_', ' ') : 'Highway Eco'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase block">Sleeper Amenity</span>
                <span className="font-bold text-emerald-400 mt-0.5 block capitalize">
                  {truck.sleeperTier ? truck.sleeperTier.replace('_', ' ') : 'Std Sleeper'}
                </span>
              </div>
            </div>

            {/* Coupled Trailer Info */}
            <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Coupled Trailer:</span>
                {truck.assignedTrailerId ? (
                  (() => {
                    const trl = (state.trailers || []).find((t) => t.id === truck.assignedTrailerId);
                    const trlModel = trl ? TRAILER_MODELS.find((m) => m.id === trl.modelId) : null;
                    return (
                      <span className="font-bold text-white font-mono">
                        {trl?.serialNumber} · {trlModel?.name.split(' ')[0]} {trlModel?.name.split(' ')[1]}
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-slate-500 italic">No dedicated trailer coupled</span>
                )}
              </div>
              {truck.liveryColor && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span>Livery:</span>
                  <span className="capitalize text-slate-200">{truck.liveryColor.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Workshop Service Bay Actions */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Authorized Service Bay Actions
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'A')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px]"
              >
                <div className="text-xs font-semibold text-white">A-Service</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$1,450</div>
              </button>

              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'B')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px]"
              >
                <div className="text-xs font-semibold text-white">B-Service</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$3,800</div>
              </button>

              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'ReplaceTires')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px]"
              >
                <div className="text-xs font-semibold text-white">Tire Set</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$2,400</div>
              </button>

              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'Overhaul')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px]"
              >
                <div className="text-xs font-semibold text-white">Overhaul</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$16,500</div>
              </button>
            </div>

            {!isEnRoute && truck.fuelCurrentLiters < model.specs.fuelTankCapacityLiters - 20 && (
              <button
                onClick={() => refuelTruckAtHub(truck.id, 9999)}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Fuel className="w-4 h-4" />
                <span>Refuel to Tank Capacity (${Math.round((model.specs.fuelTankCapacityLiters - truck.fuelCurrentLiters) * (hub?.fuelPricePerLiter || 1.25))})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

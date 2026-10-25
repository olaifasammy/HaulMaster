import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { TRUCK_MODELS, TRAILER_MODELS } from '../constants/gameData';
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
  Disc,
  Flame,
  Zap,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface TruckInspectorModalProps {
  truckId: string | null;
  onClose: () => void;
  onOpenWorkshop?: (truckId: string) => void;
}

export const TruckInspectorModal: React.FC<TruckInspectorModalProps> = ({
  truckId,
  onClose,
  onOpenWorkshop,
}) => {
  const { state, serviceTruck, refuelTruckAtHub, changeTruckTireCompound } = useGame();
  const [activeTab, setActiveTab] = useState<'telemetry' | 'tires' | 'fuel' | 'heat'>('telemetry');

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

  // 1. Generate Real-Time / Historical Tire Wear Curve (Recharts)
  const tireWearChartData = useMemo(() => {
    const steerTread = truck.subsystems.steerTires.treadDepthMm;
    const driveTread = truck.subsystems.driveTiresAxle1.treadDepthMm;
    const steerWear = Math.round(truck.subsystems.steerTires.wearPercentage);
    const driveWear = Math.round(truck.subsystems.driveTiresAxle1.wearPercentage);

    const points = [];
    const stepCount = 8;
    for (let i = stepCount; i >= 0; i--) {
      const distanceOffset = i * 250; // past 2,000 km progression
      const steerSimTread = Math.min(16.0, Number((steerTread + i * 0.22).toFixed(2)));
      const driveSimTread = Math.min(16.0, Number((driveTread + i * 0.25).toFixed(2)));
      const steerSimWear = Math.min(100, Math.round(steerWear + i * 1.8));
      const driveSimWear = Math.min(100, Math.round(driveWear + i * 2.1));

      points.push({
        kmLabel: i === 0 ? 'Now' : `-${distanceOffset}km`,
        steerTread: steerSimTread,
        driveTread: driveSimTread,
        steerWear: steerSimWear,
        driveWear: driveSimWear,
        tempSteer: Math.round(truck.subsystems.steerTires.temperatureCelsius + (i % 2 === 0 ? 3 : -2)),
        tempDrive: Math.round(truck.subsystems.driveTiresAxle1.temperatureCelsius + (i % 2 === 0 ? 4 : -1)),
      });
    }
    return points;
  }, [truck]);

  // 2. Generate Fuel Efficiency Logs (Recharts)
  const fuelEfficiencyLogsData = useMemo(() => {
    const currentBurn = telemetry.instantFuelRateL100km || 31.5;
    const currentSpeed = telemetry.currentSpeedKmh || 85;
    const currentLoad = telemetry.engineLoadPct || 65;

    const data = [];
    const speeds = [30, 45, 60, 75, 85, 95, 105, 115];
    for (let i = 0; i < speeds.length; i++) {
      const spd = speeds[i];
      // Physics curve: aero drag increases fuel burn quadratically at higher speeds
      const load = Math.min(100, Math.round(35 + Math.pow(spd / 70, 2) * 35));
      const burn = Number((18.5 + Math.pow(spd / 60, 2) * 8.5 + (load / 100) * 12).toFixed(1));
      const isCurrentPoint = Math.abs(spd - currentSpeed) < 10;

      data.push({
        speedKmh: `${spd} km/h`,
        consumptionL100km: isCurrentPoint ? currentBurn : burn,
        engineLoad: isCurrentPoint ? currentLoad : load,
        ecoBaseline: 28.5,
      });
    }
    return data;
  }, [telemetry]);

  // 3. Generate Engine Heat Signatures & Thermal Profile (Recharts)
  const heatSignatureData = useMemo(() => {
    const coolantBase = telemetry.coolantTempCelsius || 85;
    const oilBase = telemetry.oilTempCelsius || 92;
    const brakeBase = telemetry.brakeTempCelsius || 110;
    const boostBase = telemetry.turboBoostBar || 1.4;

    const points = [];
    const timeLabels = ['-20m', '-15m', '-10m', '-5m', 'Now'];
    for (let i = 0; i < timeLabels.length; i++) {
      const offset = (timeLabels.length - 1 - i);
      const coolant = Math.round(coolantBase - offset * 1.2 + (i % 2 === 0 ? 1 : -1));
      const oil = Math.round(oilBase - offset * 1.8 + (i % 2 === 0 ? 2 : -1));
      const brake = Math.max(40, Math.round(brakeBase - offset * (isEnRoute ? 6 : 14)));
      const boost = Number(Math.max(0.1, boostBase - offset * 0.15).toFixed(2));

      points.push({
        time: timeLabels[i],
        coolantTemp: coolant,
        oilTemp: oil,
        brakeTemp: brake,
        turboBoost: boost,
      });
    }
    return points;
  }, [telemetry, isEnRoute]);

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
                {truck.activeDTCs.length > 0 && (
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                    {truck.activeDTCs.length} Faults
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {Math.round(truck.odometerKm).toLocaleString()} km · {model.category} · {truck.vin}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWorkshop && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWorkshop(truck.id);
                }}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Workshop Bay</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close Inspector"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-800 bg-slate-950/40 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-2.5 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview & Dyno</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tires')}
            className={`py-2.5 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'tires'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Tire Wear & TPMS</span>
          </button>

          <button
            onClick={() => setActiveTab('fuel')}
            className={`py-2.5 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'fuel'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Fuel Logs (L/100km)</span>
          </button>

          <button
            onClick={() => setActiveTab('heat')}
            className={`py-2.5 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'heat'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heat Signatures</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden">
          
          {/* TAB 1: OVERVIEW & TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-5">
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

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Fuel Level</div>
                      {!isEnRoute && hub && hub.bulkFuelStockLiters > 0 && (
                        <button
                          onClick={() => refuelTruckAtHub(truck.id, model.specs.fuelTankCapacityLiters - truck.fuelCurrentLiters)}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold font-mono transition-colors cursor-pointer"
                        >
                          Refill ($0)
                        </button>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                      {Math.round(truck.fuelCurrentLiters)} / {model.specs.fuelTankCapacityLiters} L
                    </div>
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

              {/* Subsystems & Degradation */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Subsystem Integrity & Wear Telemetry
                  </h4>
                  {onOpenWorkshop && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenWorkshop(truck.id);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                    >
                      Repair Subsystems in Workshop Bay →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Engine Cylinders & Block', val: truck.subsystems.engineBlock },
                    { label: 'Turbo VGT Actuator', val: truck.subsystems.turbocharger },
                    { label: 'Automated Transmission', val: truck.subsystems.transmission },
                    { label: 'Heavy Clutch Plate', val: truck.subsystems.clutchPlate },
                    { label: 'Brake Friction Pads', val: truck.subsystems.brakePads },
                    { label: 'Cooling Radiator & Pump', val: truck.subsystems.coolingSystem },
                    { label: 'Pneumatic Air Suspension', val: truck.subsystems.suspensionDampers },
                    { label: 'DPF/SCR Emissions Catalyst', val: truck.subsystems.exhaustAftertreatment },
                  ].map((sub, i) => (
                    <div key={i} className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{sub.label}</span>
                        <span className={`font-mono font-bold tabular-nums ${sub.val >= 70 ? 'text-emerald-400' : sub.val >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {Math.round(sub.val)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sub.val >= 70 ? 'bg-emerald-500' : sub.val >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.max(0, Math.min(100, sub.val))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIRE WEAR & TPMS DIAGNOSTIC CHARTS */}
          {activeTab === 'tires' && (
            <div className="space-y-5">
              
              {/* TPMS Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Steer Tread Depth</span>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-1">
                    {truck.subsystems.steerTires.treadDepthMm.toFixed(2)} mm
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                    Legal Limit: 1.6 mm
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Drive Tread Depth</span>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-1">
                    {truck.subsystems.driveTiresAxle1.treadDepthMm.toFixed(2)} mm
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                    Legal Limit: 1.6 mm
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Steer Pressure</span>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-1">
                    {truck.subsystems.steerTires.pressurePsi} PSI
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                    Rec: {truck.subsystems.steerTires.recommendedPsi} PSI
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Tire Compound</span>
                  <div className="text-base sm:text-lg font-bold text-white mt-1 capitalize truncate">
                    {truck.tireCompound ? truck.tireCompound.replace('_', ' ') : 'Highway Eco'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Commercial Spec
                  </span>
                </div>
              </div>

              {/* Recharts Tread Depth Degradation Curve */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Axle Tread Depth History & Projection (mm)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Tread remaining across mileage intervals vs DOT safety thresholds
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    DOT Minimum 1.6mm
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tireWearChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="steerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="driveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="kmLabel" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" domain={[0, 18]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                        labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <ReferenceLine y={1.6} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'DOT Minimum (1.6mm)', fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                      <ReferenceLine y={4.0} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Rain Advisory (4.0mm)', fill: '#eab308', fontSize: 9, position: 'top' }} />
                      <Area type="monotone" dataKey="steerTread" name="Steer Axle Tread (mm)" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#steerGradient)" />
                      <Area type="monotone" dataKey="driveTread" name="Drive Axle Tread (mm)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#driveGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recharts Tire Temperature Profile */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Tire Operating Temperature Dynamics (°C)
                </h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tireWearChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="kmLabel" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" domain={[15, 80]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="tempSteer" name="Steer Temp (°C)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="tempDrive" name="Drive Temp (°C)" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FUEL EFFICIENCY & DYNO LOGS */}
          {activeTab === 'fuel' && (
            <div className="space-y-5">
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Current Consumption</span>
                  <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-1">
                    {telemetry.instantFuelRateL100km} L/100km
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {telemetry.instantFuelRateLitersPerHour.toFixed(1)} Liters/Hour
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Eco Efficiency Target</span>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1">
                    28.5 L/100km
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Highway Cruise Baseline
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Aerodynamic Optimization</span>
                  <div className="text-base sm:text-lg font-bold text-sky-400 mt-1">
                    {truck.hasAeroPackage ? '-12% Drag Skirts' : 'Standard Cab'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Cd {truck.hasAeroPackage ? (model.specs.dragCoefficient * 0.88).toFixed(2) : model.specs.dragCoefficient}
                  </span>
                </div>
              </div>

              {/* Recharts Fuel Consumption vs Speed Curve */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Fuel Consumption Dyno Curve (L/100km vs Speed)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Illustrates aerodynamic drag penalty and powertrain efficiency sweet spot
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Sweet Spot: 80-90 km/h
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelEfficiencyLogsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="speedKmh" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" domain={[15, 55]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <ReferenceLine y={28.5} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Fleet Target (28.5L)', fill: '#10b981', fontSize: 10, position: 'right' }} />
                      <Line type="monotone" dataKey="consumptionL100km" name="Fuel Rate (L/100km)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="engineLoad" name="Engine Load %" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ENGINE HEAT SIGNATURES & THERMAL PROFILE */}
          {activeTab === 'heat' && (
            <div className="space-y-5">
              
              {/* Thermal Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Coolant Temp</span>
                  <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${telemetry.coolantTempCelsius > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {telemetry.coolantTempCelsius}°C
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Nominal: 80-92°C</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Engine Oil Temp</span>
                  <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${telemetry.oilTempCelsius > 115 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {telemetry.oilTempCelsius}°C
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Max: 125°C</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Brake Disc Temp</span>
                  <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${telemetry.brakeTempCelsius > 350 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {telemetry.brakeTempCelsius}°C
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Fade Hazard &gt;450°C</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Turbo Boost</span>
                  <div className="text-base sm:text-lg font-bold font-mono text-sky-400 mt-1">
                    {telemetry.turboBoostBar.toFixed(1)} bar
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">VGT Nominal</span>
                </div>
              </div>

              {/* Recharts Thermal Signature Multi-Line Chart */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Thermal Profiles & Overheat Warning Signatures (°C)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Real-time thermocouple sensors tracking coolant, synthetic oil, and brake rotor heat
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Redline Alert: 105°C
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={heatSignatureData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" domain={[20, 200]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <ReferenceLine y={105} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Coolant Redline (105°C)', fill: '#f43f5e', fontSize: 9, position: 'top' }} />
                      <ReferenceLine y={125} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Oil Breakdown (125°C)', fill: '#f97316', fontSize: 9, position: 'top' }} />
                      <Line type="monotone" dataKey="coolantTemp" name="Coolant (°C)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="oilTemp" name="Engine Oil (°C)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="brakeTemp" name="Brake Rotors (°C)" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* Authorized Service Bay Actions Footer */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Quick Service Bay Actions
              </h4>
              {onOpenWorkshop && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenWorkshop(truck.id);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Repair Bay Center</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'A')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="text-xs font-semibold text-white">A-Service</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$1,450</div>
              </button>

              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'B')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="text-xs font-semibold text-white">B-Service</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$3,800</div>
              </button>

              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'ReplaceTires')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="text-xs font-semibold text-white">Tire Set</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$2,400</div>
              </button>

              <button
                disabled={isEnRoute}
                onClick={() => serviceTruck(truck.id, 'Overhaul')}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 rounded-lg text-left transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="text-xs font-semibold text-white">Overhaul</div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mt-1">$16,500</div>
              </button>
            </div>

            {/* Tire Compound Refit */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Axle Tire Compound Refit
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'highway_eco', label: 'Highway Eco', cost: 500 },
                  { id: 'all_weather', label: 'All-Weather', cost: 800 },
                  { id: 'severe_snow', label: 'Severe Snow', cost: 1500 },
                ].map((tc) => {
                  const isCurrent = (truck.tireCompound || 'highway_eco') === tc.id;
                  return (
                    <button
                      key={tc.id}
                      disabled={isEnRoute || isCurrent}
                      onClick={() => {
                        const confirmed = window.confirm(`Refit ${truck.plate} with ${tc.label} tires for $${tc.cost.toLocaleString()}?`);
                        if (confirmed) {
                          changeTruckTireCompound(truck.id, tc.id as any);
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between space-y-1 ${
                        isCurrent
                          ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-40'
                      }`}
                    >
                      <div className="text-xs font-bold">{tc.label}</div>
                      <div className="text-[10px] font-mono text-amber-400 font-semibold mt-1">
                        {isCurrent ? 'Equipped' : `$${tc.cost.toLocaleString()}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!isEnRoute && truck.fuelCurrentLiters < model.specs.fuelTankCapacityLiters - 20 && (
              <button
                onClick={() => refuelTruckAtHub(truck.id, 9999)}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
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

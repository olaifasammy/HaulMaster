import {
  SubsystemHealth,
  MechanicalAssemblyCategory,
  PartQualityTier,
  RealisticTruckPart,
} from '../types/game';

export interface PartDefinition {
  id: string;
  name: string;
  assembly: MechanicalAssemblyCategory;
  basePriceUsd: number;
  laborUsd: number;
  metricPrefix: string;
  nominalMetric: string;
  wearCause: string;
  isCritical: boolean;
  baseWearRatePer1000Km: number;
}

export const PART_DEFINITIONS: PartDefinition[] = [
  // 1. ENGINE & COMBUSTION
  {
    id: 'pistons_rings',
    name: 'Cylinder Pistons & Compression Rings',
    assembly: 'engine',
    basePriceUsd: 1450,
    laborUsd: 650,
    metricPrefix: 'Compression',
    nominalMetric: '480 PSI nominal',
    wearCause: 'High engine load (>85%) & high RPM cycles',
    isCritical: true,
    baseWearRatePer1000Km: 2.5,
  },
  {
    id: 'turbo_actuator',
    name: 'VGT Turbocharger Impeller & Wastegate',
    assembly: 'engine',
    basePriceUsd: 1650,
    laborUsd: 450,
    metricPrefix: 'Vane clearance',
    nominalMetric: '0.12mm tolerance',
    wearCause: 'Peak boost (>1.8 bar) & exhaust thermal shock',
    isCritical: true,
    baseWearRatePer1000Km: 3.2,
  },
  {
    id: 'fuel_injectors',
    name: 'Common-Rail High-Pressure Injectors',
    assembly: 'engine',
    basePriceUsd: 1100,
    laborUsd: 380,
    metricPrefix: 'Spray pressure',
    nominalMetric: '2,200 bar atomization',
    wearCause: 'Fuel throughput & micron nozzle erosion',
    isCritical: true,
    baseWearRatePer1000Km: 2.1,
  },
  {
    id: 'crankshaft_bearings',
    name: 'Crankshaft Main & Connecting Rod Bearings',
    assembly: 'engine',
    basePriceUsd: 980,
    laborUsd: 550,
    metricPrefix: 'Oil film gap',
    nominalMetric: '0.045mm clearance',
    wearCause: 'High torque load & oil degradation',
    isCritical: true,
    baseWearRatePer1000Km: 1.8,
  },
  {
    id: 'engine_oil',
    name: '15W-40 Synthetic Engine Oil & Filter',
    assembly: 'engine',
    basePriceUsd: 380,
    laborUsd: 120,
    metricPrefix: 'Fluid life',
    nominalMetric: '100% viscosity index',
    wearCause: 'Thermal cycles (>105°C) & operating hours',
    isCritical: false,
    baseWearRatePer1000Km: 5.5,
  },

  // 2. TRANSMISSION & DRIVETRAIN
  {
    id: 'clutch_disc',
    name: 'Dual-Plate Ceramic Clutch Friction Disc',
    assembly: 'drivetrain',
    basePriceUsd: 950,
    laborUsd: 480,
    metricPrefix: 'Facing thickness',
    nominalMetric: '12.5mm lining',
    wearCause: 'Low-speed creeping (<30 km/h) & uphill starts',
    isCritical: true,
    baseWearRatePer1000Km: 2.8,
  },
  {
    id: 'transmission_gears',
    name: 'Gearbox Synchronizers & Planetary Gears',
    assembly: 'drivetrain',
    basePriceUsd: 1400,
    laborUsd: 620,
    metricPrefix: 'Backlash',
    nominalMetric: '0.15mm gear mesh',
    wearCause: 'Torque shifting under heavy GCW cargo load',
    isCritical: true,
    baseWearRatePer1000Km: 1.9,
  },
  {
    id: 'driveshaft_diff',
    name: 'Cardan Driveshaft U-Joints & Rear Differential',
    assembly: 'drivetrain',
    basePriceUsd: 1250,
    laborUsd: 420,
    metricPrefix: 'Pinion lash',
    nominalMetric: '0.18mm backlash',
    wearCause: 'High driveline torque on steep climbs',
    isCritical: true,
    baseWearRatePer1000Km: 2.0,
  },

  // 3. BRAKING SYSTEM
  {
    id: 'steer_brake_pads',
    name: 'Front Steer Axle Ceramic Brake Pads',
    assembly: 'brakes',
    basePriceUsd: 420,
    laborUsd: 180,
    metricPrefix: 'Lining thickness',
    nominalMetric: '18.0mm friction pad',
    wearCause: 'Kinetic deceleration braking force',
    isCritical: true,
    baseWearRatePer1000Km: 4.2,
  },
  {
    id: 'drive_brake_pads',
    name: 'Rear Drive Tandem Axle Brake Pads',
    assembly: 'brakes',
    basePriceUsd: 580,
    laborUsd: 220,
    metricPrefix: 'Lining thickness',
    nominalMetric: '18.0mm friction pad',
    wearCause: 'Downhill descent without retarder assistance',
    isCritical: true,
    baseWearRatePer1000Km: 4.8,
  },
  {
    id: 'brake_rotors',
    name: 'Ventilated Heavy Cast Iron Brake Rotors',
    assembly: 'brakes',
    basePriceUsd: 780,
    laborUsd: 280,
    metricPrefix: 'Disc thickness',
    nominalMetric: '45.0mm rotor face',
    wearCause: 'Thermal heat cycling (>350°C) & rotor warping',
    isCritical: true,
    baseWearRatePer1000Km: 2.2,
  },
  {
    id: 'air_compressor',
    name: 'Pneumatic Air Compressor & Dryer Cartridge',
    assembly: 'brakes',
    basePriceUsd: 620,
    laborUsd: 190,
    metricPrefix: 'Air supply',
    nominalMetric: '12.5 bar governed',
    wearCause: 'Continuous pneumatic brake duty cycle',
    isCritical: true,
    baseWearRatePer1000Km: 1.6,
  },

  // 4. COOLING & INDUCTION
  {
    id: 'radiator_core',
    name: 'Aluminum Crossflow Radiator Core',
    assembly: 'cooling',
    basePriceUsd: 650,
    laborUsd: 240,
    metricPrefix: 'Core flow',
    nominalMetric: '100% coolant flow rate',
    wearCause: 'High coolant pressure & ambient thermal cycles',
    isCritical: false,
    baseWearRatePer1000Km: 1.7,
  },
  {
    id: 'water_pump',
    name: 'Centrifugal Water Pump Impeller & Thermostat',
    assembly: 'cooling',
    basePriceUsd: 420,
    laborUsd: 180,
    metricPrefix: 'Bearing seal',
    nominalMetric: 'Zero leakage sealed',
    wearCause: 'Continuous engine rotation & thermal cycling',
    isCritical: true,
    baseWearRatePer1000Km: 1.9,
  },
  {
    id: 'intercooler',
    name: 'Air-to-Air Charge Air Intercooler',
    assembly: 'cooling',
    basePriceUsd: 560,
    laborUsd: 180,
    metricPrefix: 'Boost seal',
    nominalMetric: '0 psi pressure drop',
    wearCause: 'Compressed intake thermal expansion',
    isCritical: false,
    baseWearRatePer1000Km: 1.4,
  },

  // 5. EXHAUST & AFTERTREATMENT
  {
    id: 'dpf_filter',
    name: 'Diesel Particulate Filter (DPF) Soot Core',
    assembly: 'exhaust',
    basePriceUsd: 1200,
    laborUsd: 320,
    metricPrefix: 'Soot capacity',
    nominalMetric: '4g/L clean differential',
    wearCause: 'Diesel soot accumulation & failed regenerations',
    isCritical: true,
    baseWearRatePer1000Km: 3.4,
  },
  {
    id: 'scr_catalyst',
    name: 'SCR Catalyst & AdBlue Dosing Valve',
    assembly: 'exhaust',
    basePriceUsd: 950,
    laborUsd: 260,
    metricPrefix: 'NOx conversion',
    nominalMetric: '98% catalytic reduction',
    wearCause: 'DEF crystallization & thermal exhaust flow',
    isCritical: false,
    baseWearRatePer1000Km: 2.2,
  },
  {
    id: 'egr_valve',
    name: 'EGR Gas Recirculation Cooler & Actuator',
    assembly: 'exhaust',
    basePriceUsd: 680,
    laborUsd: 210,
    metricPrefix: 'Valve response',
    nominalMetric: '100% position accuracy',
    wearCause: 'Carbon soot varnish & acidic condensation',
    isCritical: false,
    baseWearRatePer1000Km: 2.6,
  },

  // 6. CHASSIS & SUSPENSION
  {
    id: 'steer_air_bellows',
    name: 'Front Steer Pneumatic Air Spring Bellows',
    assembly: 'suspension',
    basePriceUsd: 540,
    laborUsd: 210,
    metricPrefix: 'Ride height',
    nominalMetric: '105mm pneumatic travel',
    wearCause: 'Road roughness, potholes & winter frost heaves',
    isCritical: false,
    baseWearRatePer1000Km: 2.1,
  },
  {
    id: 'drive_air_bellows',
    name: 'Rear Drive Tandem Air Bellows & Dampers',
    assembly: 'suspension',
    basePriceUsd: 780,
    laborUsd: 260,
    metricPrefix: 'Damping force',
    nominalMetric: '96% shock absorption',
    wearCause: 'Payload cargo mass deflection & oscillation',
    isCritical: false,
    baseWearRatePer1000Km: 2.5,
  },
  {
    id: 'steering_linkage',
    name: 'Front Kingpins, Drag Link & Tie-Rod Ends',
    assembly: 'suspension',
    basePriceUsd: 620,
    laborUsd: 280,
    metricPrefix: 'Pivot play',
    nominalMetric: '0.0mm zero lash',
    wearCause: 'Steering scrub under heavy front axle weight',
    isCritical: true,
    baseWearRatePer1000Km: 1.8,
  },

  // 7. COMMERCIAL TIRES
  {
    id: 'steer_left_tire',
    name: 'Steer Axle Left Commercial Tire',
    assembly: 'tires',
    basePriceUsd: 550,
    laborUsd: 80,
    metricPrefix: 'Tread depth',
    nominalMetric: '15.5mm / 110 PSI',
    wearCause: 'Steering friction, cornering lateral load',
    isCritical: true,
    baseWearRatePer1000Km: 4.8,
  },
  {
    id: 'steer_right_tire',
    name: 'Steer Axle Right Commercial Tire',
    assembly: 'tires',
    basePriceUsd: 550,
    laborUsd: 80,
    metricPrefix: 'Tread depth',
    nominalMetric: '15.5mm / 110 PSI',
    wearCause: 'Steering friction, road camber scrub',
    isCritical: true,
    baseWearRatePer1000Km: 4.8,
  },
  {
    id: 'drive_dual_tires',
    name: 'Drive Axle Dual Wheel Traction Tires',
    assembly: 'tires',
    basePriceUsd: 1450,
    laborUsd: 160,
    metricPrefix: 'Tread depth',
    nominalMetric: '15.0mm / 105 PSI',
    wearCause: 'Tractive wheel torque & acceleration slip',
    isCritical: true,
    baseWearRatePer1000Km: 5.2,
  },
];

/**
 * Creates or synchronizes a truck's detailed parts from its subsystem health.
 */
export function createDefaultParts(subsystems?: SubsystemHealth): Record<string, RealisticTruckPart> {
  const parts: Record<string, RealisticTruckPart> = {};

  PART_DEFINITIONS.forEach((def) => {
    let initialCond = 96;

    if (subsystems) {
      if (def.assembly === 'engine') {
        if (def.id === 'turbo_actuator') initialCond = subsystems.turbocharger;
        else initialCond = subsystems.engineBlock;
      } else if (def.assembly === 'drivetrain') {
        if (def.id === 'clutch_disc') initialCond = subsystems.clutchPlate;
        else initialCond = subsystems.transmission;
      } else if (def.assembly === 'brakes') {
        if (def.id === 'brake_rotors') initialCond = subsystems.brakeRotors;
        else initialCond = subsystems.brakePads;
      } else if (def.assembly === 'cooling') {
        initialCond = subsystems.coolingSystem;
      } else if (def.assembly === 'exhaust') {
        initialCond = subsystems.exhaustAftertreatment;
      } else if (def.assembly === 'suspension') {
        initialCond = subsystems.suspensionDampers;
      } else if (def.assembly === 'tires') {
        if (def.id.includes('steer')) initialCond = subsystems.steerTires.wearPercentage;
        else initialCond = subsystems.driveTiresAxle1.wearPercentage;
      }
    }

    // Generate dynamic metric label based on condition
    let metricLabel = def.nominalMetric;
    if (def.assembly === 'tires') {
      const tread = Number((1.6 + (initialCond / 100) * 14.4).toFixed(1));
      metricLabel = `${tread} mm tread · 108 PSI`;
    } else if (def.id === 'engine_oil') {
      metricLabel = `${Math.round(initialCond)}% viscosity life`;
    } else if (def.id === 'steer_brake_pads' || def.id === 'drive_brake_pads') {
      const padMm = Number((3.0 + (initialCond / 100) * 15.0).toFixed(1));
      metricLabel = `${padMm} mm pad thickness`;
    } else if (def.id === 'dpf_filter') {
      metricLabel = `${Math.round(100 - initialCond)}% soot capacity`;
    }

    parts[def.id] = {
      id: def.id,
      name: def.name,
      assembly: def.assembly,
      conditionPct: Math.max(0, Math.min(100, Math.round(initialCond))),
      basePriceUsd: def.basePriceUsd,
      laborUsd: def.laborUsd,
      metricLabel,
      wearCause: def.wearCause,
      isCritical: def.isCritical,
    };
  });

  return parts;
}

/**
 * Computes average subsystem percentages from granular parts to keep top-level stats in sync.
 */
export function syncSubsystemsFromParts(
  subsystems: SubsystemHealth,
  parts: Record<string, RealisticTruckPart>
): SubsystemHealth {
  const getAvg = (ids: string[], fallback: number): number => {
    const valid = ids.map((id) => parts[id]?.conditionPct).filter((v) => v !== undefined);
    if (valid.length === 0) return fallback;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  };

  const steerTireCond = getAvg(['steer_left_tire', 'steer_right_tire'], subsystems.steerTires.wearPercentage);
  const driveTireCond = parts['drive_dual_tires']?.conditionPct ?? subsystems.driveTiresAxle1.wearPercentage;

  const steerTread = Number((1.6 + (steerTireCond / 100) * 14.4).toFixed(2));
  const driveTread = Number((1.6 + (driveTireCond / 100) * 14.4).toFixed(2));

  return {
    ...subsystems,
    engineBlock: getAvg(['pistons_rings', 'crankshaft_bearings', 'fuel_injectors', 'engine_oil'], subsystems.engineBlock),
    turbocharger: parts['turbo_actuator']?.conditionPct ?? subsystems.turbocharger,
    transmission: getAvg(['transmission_gears', 'driveshaft_diff'], subsystems.transmission),
    clutchPlate: parts['clutch_disc']?.conditionPct ?? subsystems.clutchPlate,
    brakePads: getAvg(['steer_brake_pads', 'drive_brake_pads'], subsystems.brakePads),
    brakeRotors: parts['brake_rotors']?.conditionPct ?? subsystems.brakeRotors,
    coolingSystem: getAvg(['radiator_core', 'water_pump', 'intercooler'], subsystems.coolingSystem),
    suspensionDampers: getAvg(['steer_air_bellows', 'drive_air_bellows', 'steering_linkage'], subsystems.suspensionDampers),
    exhaustAftertreatment: getAvg(['dpf_filter', 'scr_catalyst', 'egr_valve'], subsystems.exhaustAftertreatment),
    steerTires: {
      ...subsystems.steerTires,
      wearPercentage: steerTireCond,
      treadDepthMm: steerTread,
    },
    driveTiresAxle1: {
      ...subsystems.driveTiresAxle1,
      wearPercentage: driveTireCond,
      treadDepthMm: driveTread,
    },
  };
}

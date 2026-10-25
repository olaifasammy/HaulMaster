import {
  PowertrainSpecs,
  SubsystemHealth,
  WeatherCondition,
  LiveTelemetry,
  DiagnosticCode,
  DriverStats,
} from '../types/game';

// Physical constants
const AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m^3
const GRAVITY = 9.80665; // m/s^2
const DIESEL_DENSITY_KG_L = 0.835; // kg per liter
const DIESEL_ENERGY_DENSITY_MJ_L = 35.8; // MJ per liter

export interface StepPhysicsParams {
  specs: PowertrainSpecs;
  payloadKg: number;
  subsystems: SubsystemHealth;
  driverStats: DriverStats;
  weather: WeatherCondition;
  gradePct: number; // e.g. 3.5% = +0.035
  speedLimitKmh: number;
  hasAeroPackage: boolean;
  hasTrailerAeroSkirts?: boolean;
  hasRetarder: boolean;
  isReeferCargo: boolean;
  tireCompound?: 'highway_eco' | 'all_weather' | 'severe_snow';
  trailerEmptyWeightKg?: number;
  deltaSeconds: number; // e.g. 60s per sim minute
  currentSpeedKmh: number;
  driverId?: string;
  simTimeMinutes?: number;
}

export function getDriverPersonality(driverId: string) {
  let hash = 0;
  for (let i = 0; i < driverId.length; i++) {
    hash = (hash << 5) - hash + driverId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const speedMultiplier = 0.92 + (positiveHash % 23) * 0.01; // 0.92 to 1.14 (cautious vs speed demon)
  const throttleResponsiveness = 0.85 + ((positiveHash >> 3) % 40) * 0.01; // 0.85 to 1.25
  const cruiseVariance = 3.5 + ((positiveHash >> 6) % 6); // 3.5 to 9.5 km/h fluctuation
  return { speedMultiplier, throttleResponsiveness, cruiseVariance };
}

export interface StepPhysicsResult {
  nextSpeedKmh: number;
  distanceCoveredKm: number;
  fuelBurnedLiters: number;
  adBlueBurnedLiters: number;
  telemetry: LiveTelemetry;
  updatedSubsystems: SubsystemHealth;
  newDTCs: DiagnosticCode[];
  wearStressFactor: number;
}

export function computePhysicsStep(params: StepPhysicsParams): StepPhysicsResult {
  const {
    specs,
    payloadKg,
    subsystems,
    driverStats,
    weather,
    gradePct,
    speedLimitKmh,
    hasAeroPackage,
    hasTrailerAeroSkirts,
    hasRetarder,
    isReeferCargo,
    tireCompound,
    trailerEmptyWeightKg,
    deltaSeconds,
    currentSpeedKmh,
    driverId,
    simTimeMinutes,
  } = params;

  // 1. Total Gross Combination Weight (GCW) in kg
  const totalMassKg = specs.curbWeightKg + (trailerEmptyWeightKg || 0) + payloadKg;

  // 2. Road & Weather friction and speed targeting with Driver Personality
  let compoundGripFactor = 1.0;
  if (tireCompound === 'severe_snow' && weather.type.includes('Snow')) {
    compoundGripFactor = 1.25;
  } else if (tireCompound === 'highway_eco' && weather.type.includes('Snow')) {
    compoundGripFactor = 0.88;
  }

  const effectiveRoadFriction = Math.min(1.0, weather.roadFrictionCoeff * compoundGripFactor);
  const frictionLimitSpeedKmh = 120 * Math.sqrt(effectiveRoadFriction / 0.85);

  const personality = getDriverPersonality(driverId || 'drv-default');
  const fatigue = driverStats.fatiguePercent ?? 0;
  const fatiguePenalty = fatigue > 50 ? (fatigue - 50) * 0.002 : 0;
  const effectiveSpeedMultiplier = Math.max(0.85, personality.speedMultiplier - fatiguePenalty);

  const safety = driverStats.safetyScore ?? 80;
  const weatherCautionFactor = weather.type.includes('Snow') || weather.type.includes('Rain') || weather.type.includes('Blizzard')
    ? (safety > 75 ? 0.92 : 0.97)
    : 1.0;

  const timeSec = simTimeMinutes !== undefined ? simTimeMinutes * 60 : Date.now() / 1000;
  const microFluctuation = Math.sin(timeSec * 0.03 + (driverId ? driverId.charCodeAt(0) : 1)) * personality.cruiseVariance;

  const baseTarget = Math.min(speedLimitKmh * effectiveSpeedMultiplier * weatherCautionFactor, frictionLimitSpeedKmh);
  const targetSpeedKmh = Math.max(15, baseTarget + microFluctuation);

  // Smooth acceleration / braking adjustment with driver responsiveness
  let speedKmh = currentSpeedKmh;
  if (speedKmh <= 0) {
    speedKmh = Math.min(targetSpeedKmh, 25);
  } else {
    const diff = targetSpeedKmh - speedKmh;
    const rate = diff > 0 ? 0.12 * personality.throttleResponsiveness : 0.22 * personality.throttleResponsiveness; // braking sharper than acceleration
    speedKmh = speedKmh + diff * rate;
  }
  const speedMs = speedKmh / 3.6;

  // 3. Aerodynamics Force
  // Headwind vector: positive if headwind, negative if tailwind
  const windAngleRad = ((weather.windDirectionDeg - 0) * Math.PI) / 180; // approximate route heading
  const headwindKmh = weather.windSpeedKmh * Math.cos(windAngleRad);
  const relativeAirSpeedMs = Math.max(0, (speedKmh + headwindKmh) / 3.6);

  // Aero package reduces truck Cd by 12%; trailer aero skirts reduce total drag by another 6%
  let effectiveCd = hasAeroPackage ? specs.dragCoefficient * 0.88 : specs.dragCoefficient;
  if (hasTrailerAeroSkirts) {
    effectiveCd *= 0.94;
  }

  const altitudeScale = 1.0; // standard density
  const rhoAir = AIR_DENSITY_SEA_LEVEL * altitudeScale;
  const F_drag = 0.5 * rhoAir * effectiveCd * specs.frontalAreaM2 * Math.pow(relativeAirSpeedMs, 2);

  // 4. Rolling Resistance Force
  // Base Crr = 0.0055 for low-resistance highway truck tires
  let baseCrr = 0.0055;
  if (tireCompound === 'highway_eco') baseCrr = 0.0048;
  else if (tireCompound === 'severe_snow') baseCrr = 0.0065;

  if (subsystems.steerTires.wearPercentage < 30) baseCrr += 0.0015; // worn tires increase rolling resistance
  const effectiveCrr = baseCrr * weather.rollingResistanceMultiplier;
  const F_rr = effectiveCrr * totalMassKg * GRAVITY;

  // 5. Incline / Grade Resistance Force
  const thetaRad = Math.atan(gradePct / 100);
  const F_grade = totalMassKg * GRAVITY * Math.sin(thetaRad);

  // Total Tractive Force required at drive wheels (Newtons)
  const totalResistanceForce = F_drag + F_rr + F_grade;

  // 6. Engine Power & Load Calculation
  const drivetrainEfficiency = 0.88; // manual/automated transmission + differential losses
  let powerDemandedWatts = 0;
  let retarderActive = false;
  let retarderLevel = 0;

  if (totalResistanceForce > 0) {
    // Uphill or steady cruising: Engine delivers positive power
    powerDemandedWatts = (totalResistanceForce * speedMs) / drivetrainEfficiency;
  } else {
    // Downhill: Retarder / compression brake needed to hold speed
    retarderActive = hasRetarder;
    retarderLevel = Math.min(3, Math.ceil(Math.abs(gradePct) / 2.5));
    powerDemandedWatts = 25000; // idle engine load while coasting
  }

  // Max engine power available (Watts)
  const maxPowerWatts = specs.horsepower * 745.7 * (subsystems.engineBlock / 100);
  const actualPowerWatts = Math.min(powerDemandedWatts, maxPowerWatts);
  const engineLoadPct = Math.min(100, Math.round((actualPowerWatts / maxPowerWatts) * 100));

  // 7. Engine RPM & Gear selection
  // Modern heavy trucks operate in the sweet spot 1050 - 1450 RPM at 85-105 km/h
  const maxGears = specs.transmissionGears;
  const speedRatio = Math.min(1.0, speedKmh / 110);
  const currentGear = Math.max(1, Math.min(maxGears, Math.round(speedRatio * (maxGears - 2)) + 2));
  
  // Simulated RPM based on gear and load
  const baseRpm = 650; // idle
  const cruisingRpm = 1150 + (speedKmh % 15) * 20 + (engineLoadPct * 2.5);
  const engineRpm = Math.min(2100, Math.round(Math.max(baseRpm, cruisingRpm)));

  // 8. Fuel Consumption Physics
  // Brake Specific Fuel Consumption (BSFC): ~195 g/kWh at peak efficiency
  // Adjust BSFC based on driver eco rating (rating 100 = 185 g/kWh, rating 50 = 225 g/kWh)
  const ecoFactor = 1.0 - (driverStats.ecoDrivingRating - 75) * 0.003; // +/- 7.5%
  const bsfc_g_per_kwh = (195 + Math.abs(engineLoadPct - 65) * 0.4) * ecoFactor;

  // Mechanical energy in kWh used during deltaSeconds
  const energyKwh = (actualPowerWatts / 1000) * (deltaSeconds / 3600);
  const fuelMassGrams = energyKwh * bsfc_g_per_kwh;
  let fuelBurnedLiters = fuelMassGrams / 1000 / DIESEL_DENSITY_KG_L;

  // Auxiliary fuel burn (Reefer cooling unit: +2.4 L/h, HVAC: +0.8 L/h)
  let auxiliaryLitersPerHour = 0.6; // baseline electronics, alternator, air compressor
  if (isReeferCargo) auxiliaryLitersPerHour += 2.2;
  if (weather.tempCelsius < 0 || weather.tempCelsius > 32) auxiliaryLitersPerHour += 0.8;
  fuelBurnedLiters += (auxiliaryLitersPerHour * deltaSeconds) / 3600;

  // AdBlue / DEF burn is typically 4.5% of diesel consumption
  const adBlueBurnedLiters = fuelBurnedLiters * 0.045;

  // Instantaneous L/100km and L/hour
  const distanceCoveredKm = (speedKmh * deltaSeconds) / 3600;
  const instantFuelRateLitersPerHour = (fuelBurnedLiters / deltaSeconds) * 3600;
  const instantFuelRateL100km = distanceCoveredKm > 0.001
    ? (fuelBurnedLiters / distanceCoveredKm) * 100
    : instantFuelRateLitersPerHour;

  // 9. Turbo Boost and Temperatures
  const turboBoostBar = Number((0.2 + (engineLoadPct / 100) * 2.2 * (subsystems.turbocharger / 100)).toFixed(2));
  const ambientTemp = weather.tempCelsius;
  const engineHeatContribution = (engineLoadPct / 100) * 35;
  const oilTempCelsius = Math.round(82 + engineHeatContribution + ambientTemp * 0.2);
  const coolantTempCelsius = Math.round(80 + (engineLoadPct / 100) * 15);
  const oilPressureBar = Number((2.8 + (engineRpm / 2000) * 2.2).toFixed(1));

  // Brake temperature: friction brakes heat up on downhills if retarder not adequate
  let brakeTemp = 90;
  if (gradePct < -2.0) {
    const gradeStress = Math.abs(gradePct);
    const retarderRelief = hasRetarder ? 0.7 : 0.0;
    brakeTemp += Math.round(gradeStress * 45 * (1 - retarderRelief));
  }
  const brakeTempCelsius = Math.min(650, brakeTemp);

  // 10. Subsystem Degradation & Wear Math
  // Realistic heavy transport wear: mileage, steep grades, thermal overheating, and heavy braking degrade components
  const mechanicalSympathyFactor = 1.0 - (driverStats.mechanicalSympathy - 75) * 0.004;
  const thermalStress = oilTempCelsius > 115 ? 3.0 : 1.0;
  const gradeStress = Math.abs(gradePct) > 4.5 ? 2.5 : 1.0;
  const wearMultiplier = mechanicalSympathyFactor * thermalStress * gradeStress;

  // Realistic commercial rate: ~3-5% component degradation per 1,000km under heavy freight
  const baseWearPerKm = 0.0035 * wearMultiplier;
  const updatedSubsystems: SubsystemHealth = {
    ...subsystems,
    engineBlock: Math.max(0, subsystems.engineBlock - distanceCoveredKm * baseWearPerKm * (engineLoadPct > 85 ? 1.4 : 0.8)),
    turbocharger: Math.max(0, subsystems.turbocharger - distanceCoveredKm * baseWearPerKm * (turboBoostBar > 1.8 ? 1.6 : 0.9)),
    transmission: Math.max(0, subsystems.transmission - distanceCoveredKm * baseWearPerKm * 0.85),
    clutchPlate: Math.max(0, subsystems.clutchPlate - (speedKmh < 30 ? 0.005 : baseWearPerKm * 0.6)),
    brakePads: Math.max(0, subsystems.brakePads - (brakeTempCelsius > 250 ? distanceCoveredKm * baseWearPerKm * 3.5 : distanceCoveredKm * baseWearPerKm * 1.2)),
    brakeRotors: Math.max(0, subsystems.brakeRotors - distanceCoveredKm * baseWearPerKm * 0.8),
    coolingSystem: Math.max(0, subsystems.coolingSystem - distanceCoveredKm * baseWearPerKm * 0.75),
    suspensionDampers: Math.max(0, subsystems.suspensionDampers - distanceCoveredKm * baseWearPerKm * (weather.type === 'Snow' || weather.type === 'Blizzard' ? 2.2 : 1.0)),
    exhaustAftertreatment: Math.max(0, subsystems.exhaustAftertreatment - distanceCoveredKm * baseWearPerKm * 1.1),
    steerTires: {
      ...subsystems.steerTires,
      wearPercentage: Math.max(0, subsystems.steerTires.wearPercentage - distanceCoveredKm * 0.005),
      treadDepthMm: Math.max(1.0, Number((subsystems.steerTires.treadDepthMm - distanceCoveredKm * 0.0009).toFixed(2))),
      temperatureCelsius: Math.round(20 + speedKmh * 0.3 + ambientTemp * 0.5),
      pressurePsi: Math.round(subsystems.steerTires.recommendedPsi + (ambientTemp - 20) * 0.25),
    },
    driveTiresAxle1: {
      ...subsystems.driveTiresAxle1,
      wearPercentage: Math.max(0, subsystems.driveTiresAxle1.wearPercentage - distanceCoveredKm * 0.0055),
      treadDepthMm: Math.max(1.0, Number((subsystems.driveTiresAxle1.treadDepthMm - distanceCoveredKm * 0.001).toFixed(2))),
      temperatureCelsius: Math.round(22 + speedKmh * 0.35 + ambientTemp * 0.5),
      pressurePsi: Math.round(subsystems.driveTiresAxle1.recommendedPsi + (ambientTemp - 20) * 0.25),
    },
  };

  // 11. Diagnostic Trouble Code (DTC) Triggering
  const newDTCs: DiagnosticCode[] = [];
  if (updatedSubsystems.turbocharger < 40) {
    newDTCs.push({
      code: 'P0299',
      severity: 'warning',
      description: 'Turbocharger Underboost: Vane Geometry Stuck',
      system: 'powertrain',
      active: true,
    });
  }
  if (updatedSubsystems.brakePads < 25) {
    newDTCs.push({
      code: 'C1095',
      severity: 'critical',
      description: 'Axle Brake Lining Thickness Below Minimum (3mm)',
      system: 'brakes',
      active: true,
    });
  }
  if (updatedSubsystems.steerTires.treadDepthMm <= 2.0) {
    newDTCs.push({
      code: 'T0411',
      severity: 'critical',
      description: 'Steer Axle Tire Tread Depth Warning (< 2.0mm)',
      system: 'tires',
      active: true,
    });
  }
  if (brakeTempCelsius > 480) {
    newDTCs.push({
      code: 'B0882',
      severity: 'critical',
      description: 'Brake Disc Thermal Overheat: Imminent Fade Hazard',
      system: 'brakes',
      active: true,
    });
  }

  const telemetry: LiveTelemetry = {
    currentSpeedKmh: Math.round(speedKmh),
    engineRpm,
    currentGear,
    instantFuelRateL100km: Number(instantFuelRateL100km.toFixed(1)),
    instantFuelRateLitersPerHour: Number(instantFuelRateLitersPerHour.toFixed(1)),
    engineLoadPct,
    turboBoostBar,
    oilTempCelsius,
    oilPressureBar,
    coolantTempCelsius,
    brakeTempCelsius,
    retarderActive,
    retarderLevel,
    currentInclinePct: Number(gradePct.toFixed(1)),
    currentWindSpeedKmh: Math.round(weather.windSpeedKmh),
    currentHeadwindComponentKmh: Math.round(headwindKmh),
    weatherState: weather,
  };

  return {
    nextSpeedKmh: speedKmh,
    distanceCoveredKm,
    fuelBurnedLiters,
    adBlueBurnedLiters,
    telemetry,
    updatedSubsystems,
    newDTCs,
    wearStressFactor: Number(wearMultiplier.toFixed(2)),
  };
}

export type GeoRegion = 'North America' | 'Europe';

export interface Coordinate {
  x: number; // 0-1000 coordinate space for logistics map
  y: number;
}

export interface Hub {
  id: string;
  name: string;
  code: string;
  country: string;
  region: GeoRegion;
  coord: Coordinate;
  fuelPricePerLiter: number; // dynamically fluctuates ($)
  bulkFuelStockLiters: number;
  bulkFuelCapacityLiters: number;
  hasBulkFuelDepot: boolean;
  workshopLevel: number; // 1 = basic, 2 = advanced, 3 = master overhaul
  bayCount: number;
  activeTruckIds: string[];
  storedCargoCount: number;
}

export type WeatherType = 'Clear' | 'Overcast' | 'Rain' | 'Heavy Storm' | 'Snow' | 'Blizzard' | 'Heatwave';

export interface WeatherCondition {
  type: WeatherType;
  tempCelsius: number;
  windSpeedKmh: number;
  windDirectionDeg: number; // 0 = North, 90 = East, 180 = South, 270 = West
  precipitationMm: number;
  roadFrictionCoeff: number; // 0.85 = dry, 0.55 = wet, 0.25 = snow, 0.12 = black ice
  rollingResistanceMultiplier: number;
}

export type RoadType = 'Interstate Highway' | 'Mountain Pass' | 'Coastal Express' | 'Arterial Corridor';

export interface RouteWaypoint {
  name: string;
  coord: Coordinate;
  elevationMeters: number;
}

export interface RouteCorridor {
  id: string;
  originHubId: string;
  destinationHubId: string;
  name: string;
  distanceKm: number;
  roadType: RoadType;
  baseSpeedLimitKmh: number;
  avgElevationGradePct: number; // positive = uphill, negative = downhill
  maxGradePct: number;
  tollCostUsd: number;
  waypoints: RouteWaypoint[];
  hazardRisk: number; // 0.0 to 1.0 (mountain passes have higher risk)
}

export interface DiagnosticCode {
  code: string;
  severity: 'advisory' | 'warning' | 'critical';
  description: string;
  system: 'powertrain' | 'brakes' | 'emissions' | 'tires';
  active: boolean;
}

export interface TireAxleState {
  pressurePsi: number;
  recommendedPsi: number;
  temperatureCelsius: number;
  treadDepthMm: number; // 16.0mm new down to 1.6mm legal limit
  wearPercentage: number;
}

export interface SubsystemHealth {
  engineBlock: number; // 100% down to 0%
  turbocharger: number;
  transmission: number;
  clutchPlate: number;
  brakePads: number;
  brakeRotors: number;
  steerTires: TireAxleState;
  driveTiresAxle1: TireAxleState;
  driveTiresAxle2?: TireAxleState;
  coolingSystem: number;
  suspensionDampers: number;
  exhaustAftertreatment: number; // DPF / SCR catalyst
}

export interface PowertrainSpecs {
  horsepower: number;
  torqueNm: number;
  displacementLiters: number;
  cylinders: number;
  transmissionGears: number;
  driveAxles: '4x2' | '6x4';
  curbWeightKg: number;
  maxPayloadKg: number;
  fuelTankCapacityLiters: number;
  adBlueTankLiters: number;
  dragCoefficient: number; // Cd
  frontalAreaM2: number;
}

export type TruckModelId = 'titan-540' | 'strada-460' | 'vanguard-600' | 'metro-320';

export interface TruckModel {
  id: TruckModelId;
  name: string;
  manufacturer: string;
  category: 'Heavy Haul' | 'Efficiency Long-Haul' | 'Flagship Highway' | 'Urban Distribution';
  image: string;
  basePriceUsd: number;
  specs: PowertrainSpecs;
  description: string;
}

export type TruckStatus = 'idle' | 'en_route' | 'maintenance' | 'breakdown';

export interface TruckInstance {
  id: string;
  modelId: TruckModelId;
  vin: string;
  plate: string;
  currentHubId: string;
  status: TruckStatus;
  odometerKm: number;
  fuelCurrentLiters: number;
  adBlueCurrentLiters: number;
  subsystems: SubsystemHealth;
  activeDTCs: DiagnosticCode[];
  assignedDriverId: string | null;
  activeTripId: string | null;
  lastServiceKm: number;
  hasAeroPackage: boolean;
  hasRetarder: boolean;
  tireCompound: 'highway_eco' | 'all_weather' | 'severe_snow';
  serviceDueKm: number;
}

export type HOSStatus = 'driving' | 'working' | 'resting' | 'off_duty';

export interface DriverStats {
  ecoDrivingRating: number; // 0 - 100 (affects fuel efficiency by up to +/- 20%)
  mechanicalSympathy: number; // 0 - 100 (reduces powertrain wear)
  mountainCert: boolean;
  winterCert: boolean;
  hazmatCert: boolean;
  fatiguePercent: number; // 0 - 100
  totalKmDriven: number;
  deliveriesCompleted: number;
  safetyScore: number; // 0 - 100
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  experienceYears: number;
  wagePerKmUsd: number;
  dailyRetainerUsd: number;
  homeHubId: string;
  currentHubId: string;
  assignedTruckId: string | null;
  hosStatus: HOSStatus;
  continuousDriveMinutes: number; // max 270 (4.5h) before 45m break required
  dailyDriveMinutes: number; // max 540 (9h) before 11h daily rest
  currentRestMinutesRemaining: number;
  stats: DriverStats;
}

export type CargoCategory = 'Dry Freight' | 'Refrigerated Food' | 'Heavy Machinery' | 'Hazardous Chemicals' | 'High-Value Tech';

export interface CargoContract {
  id: string;
  title: string;
  originHubId: string;
  destinationHubId: string;
  category: CargoCategory;
  weightTons: number;
  payoutUsd: number;
  bonusOnTimeUsd: number;
  penaltyLateUsd: number;
  deadlineMinutes: number; // total trip simulation minutes allowed
  temperatureControlled: boolean; // reefer requires extra diesel burn
  hazardClass?: 'Class 3 Flammable' | 'Class 8 Corrosive';
  isHazardous: boolean;
}

export interface LiveTelemetry {
  currentSpeedKmh: number;
  engineRpm: number;
  currentGear: number;
  instantFuelRateL100km: number;
  instantFuelRateLitersPerHour: number;
  engineLoadPct: number;
  turboBoostBar: number;
  oilTempCelsius: number;
  oilPressureBar: number;
  coolantTempCelsius: number;
  brakeTempCelsius: number;
  retarderActive: boolean;
  retarderLevel: number; // 0 - 3
  currentInclinePct: number;
  currentWindSpeedKmh: number;
  currentHeadwindComponentKmh: number;
  weatherState: WeatherCondition;
}

export interface ActiveTrip {
  id: string;
  contract: CargoContract;
  corridor: RouteCorridor;
  truckId: string;
  driverId: string;
  progressKm: number;
  totalDistanceKm: number;
  elapsedMinutes: number;
  departureTimeSimMinutes: number;
  fuelConsumedLiters: number;
  telemetry: LiveTelemetry;
  eventLogs: string[];
  isRestingNow: boolean;
  isStalledBreakdown: boolean;
}

export type TransactionType = 'freight_revenue' | 'fuel_expense' | 'maintenance_expense' | 'driver_wages' | 'toll_expense' | 'loan_repay' | 'loan_disbursement' | 'equipment_purchase' | 'depot_upgrade' | 'breakdown_recovery';

export interface LedgerEntry {
  id: string;
  simDay: number;
  simTimeFormatted: string;
  type: TransactionType;
  description: string;
  amountUsd: number; // positive = income, negative = expense
  runningBalanceUsd: number;
}

export interface BankLoan {
  id: string;
  principalUsd: number;
  remainingBalanceUsd: number;
  annualInterestRate: number; // e.g., 0.06 = 6%
  dailyPaymentUsd: number;
  daysRemaining: number;
}

export interface GameEventNotification {
  id: string;
  simTimeFormatted: string;
  title: string;
  message: string;
  type: 'delivery' | 'weather' | 'maintenance' | 'breakdown' | 'finance' | 'driver';
  timestamp: number;
}

export interface GameState {
  companyName: string;
  balanceUsd: number;
  simTimeMinutes: number; // 0 = Day 1, 00:00
  simSpeed: 0 | 1 | 5 | 15;
  selectedRegion: GeoRegion;
  hubs: Hub[];
  routes: RouteCorridor[];
  trucks: TruckInstance[];
  drivers: Driver[];
  availableContracts: CargoContract[];
  activeTrips: ActiveTrip[];
  ledger: LedgerEntry[];
  loans: BankLoan[];
  notifications: GameEventNotification[];
  totalCargoDeliveredTons: number;
  totalFuelBurnedLiters: number;
  totalKilometersDriven: number;
  ratingScore: number; // 0 - 5.0 rating
}

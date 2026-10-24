export type GeoRegion = 'North America' | 'Europe';

export interface Coordinate {
  x: number; // 0-1000 coordinate space for logistics map
  y: number;
}

export type LocationType = 'gateway_hub' | 'regional_hub' | 'spoke_terminal' | 'delivery_location';

export interface Hub {
  id: string;
  name: string;
  code: string;
  country: string;
  region: GeoRegion;
  locationType: LocationType;
  isHub?: boolean; // True if full corporate hub with maintenance workshop & bulk fuel
  connectedToHubId?: string; // Connected parent hub if this is a delivery location
  coord: Coordinate;
  fuelPricePerLiter: number; // dynamically fluctuates ($)
  bulkFuelStockLiters: number;
  bulkFuelCapacityLiters: number;
  hasBulkFuelDepot: boolean;
  workshopLevel: number; // 1 = basic, 2 = advanced, 3 = master overhaul
  bayCount: number;
  activeTruckIds: string[];
  storedCargoCount: number;
  isUnlocked: boolean;
  requiredRank: number;
  rankTitle: string;
  purchasePriceUsd: number;
  goldCost?: number;
  trafficDemandScore: number; // 1-100
  monthlyCargoVolume: string;
  isPrimaryBase?: boolean;
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
  isUnlocked: boolean;
  licenseFeeUsd: number;
  goldCost?: number;
  requiredRank: number;
  trafficRateScore: number;
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
  driveAxles: '4x2' | '6x2' | '6x4' | '8x4';
  curbWeightKg: number;
  maxPayloadKg: number;
  fuelTankCapacityLiters: number;
  adBlueTankLiters: number;
  dragCoefficient: number; // Cd
  frontalAreaM2: number;
}

export type TruckModelId =
  | 'titan-540'
  | 'strada-460'
  | 'vanguard-600'
  | 'metro-320'
  | 'nordic-620'
  | 'colossus-750'
  | 'mercedes-sprinter-519'
  | 'mercedes-actros-1863'
  | 'scania-770s-v8'
  | 'scania-r500-super'
  | 'man-tgx-18640'
  | 'man-tgm-18320'
  | 'peterbilt-389-classic'
  | 'freightliner-cascadia'
  | 'isuzu-giga-520'
  | 'hino-700-profia';

export interface TruckModel {
  id: TruckModelId;
  name: string;
  manufacturer: string;
  brand?: 'Mercedes-Benz' | 'Scania' | 'MAN' | 'Peterbilt' | 'Freightliner' | 'Isuzu' | 'Hino' | 'MetroFreight' | 'Strada' | 'Titan' | 'Vanguard' | 'Nordic';
  origin?: 'Europe' | 'North America' | 'Asia';
  category: 'Heavy Haul' | 'Efficiency Long-Haul' | 'Flagship Highway' | 'Urban Distribution' | 'Severe Duty' | 'Extreme Heavy Haul';
  image: string;
  basePriceUsd: number;
  specs: PowertrainSpecs;
  description: string;
  isRigid?: boolean;
}

export type SleeperTier = 'day_cab' | 'standard_sleeper' | 'deluxe_suite';
export type FleetLivery = 'obsidian_slate' | 'titanium_silver' | 'continental_emerald' | 'apex_amber';
export type FinancingMethod = 'cash' | 'lease_60d';

export interface TruckConfigOptions {
  modelId: TruckModelId;
  hubId: string;
  hasAeroPackage: boolean;
  hasRetarder: boolean;
  tireCompound: 'highway_eco' | 'all_weather' | 'severe_snow';
  sleeperTier: SleeperTier;
  liveryColor: FleetLivery;
  financingMethod: FinancingMethod;
  selectedTrailerModelId?: TrailerModelId | null;
  hasTrailerAeroSkirts?: boolean;
}

export type TrailerModelId = 'dry-van-53' | 'reefer-temp' | 'lowboy-heavy' | 'adr-chemical' | 'intermodal-chassis' | 'modular-heavy-lowboy' | 'wind-blade-transporter';

export interface TrailerModel {
  id: TrailerModelId;
  name: string;
  manufacturer: string;
  category: CargoCategory;
  image: string;
  basePriceUsd: number;
  emptyWeightKg: number;
  maxPayloadKg: number;
  lengthFeet: number;
  axleCount: number;
  supportsReeferUnit: boolean;
  supportsHazmatADR: boolean;
  description: string;
}

export type TrailerStatus = 'idle' | 'en_route' | 'maintenance';

export interface TrailerInstance {
  id: string; // e.g. trl-8921
  modelId: TrailerModelId;
  serialNumber: string;
  currentHubId: string;
  status: TrailerStatus;
  odometerKm: number;
  hasAeroSkirts: boolean; // -6% aerodynamic drag
  hasReeferUnit: boolean;
  reeferFuelCurrentLiters: number;
  tireCompound: 'highway_eco' | 'all_weather' | 'severe_snow';
  assignedTruckId: string | null;
  assignedTripId: string | null;
}

export interface TrailerConfigOptions {
  modelId: TrailerModelId;
  hubId: string;
  hasAeroSkirts: boolean;
  hasReeferUnit: boolean;
  tireCompound: 'highway_eco' | 'all_weather' | 'severe_snow';
  financingMethod: FinancingMethod;
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
  sleeperTier: SleeperTier;
  liveryColor: FleetLivery;
  assignedTrailerId: string | null;
  serviceDueKm: number;
  health?: number;
  maintenanceMinutesRemaining?: number;
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
  cdlClass?: string;
  endorsements?: string[];
  contractDaysRemaining?: number;
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
  shipperCompany?: string;
  shipperRating?: number;
  shipperIndustry?: string;
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
  updatedSubsystems?: Partial<SubsystemHealth>;
}

export interface ActiveTrip {
  id: string;
  contract: CargoContract;
  corridor: RouteCorridor;
  truckId: string;
  driverId: string;
  trailerId?: string | null;
  progressKm: number;
  totalDistanceKm: number;
  elapsedMinutes: number;
  departureTimeSimMinutes: number;
  fuelConsumedLiters: number;
  telemetry: LiveTelemetry;
  eventLogs: string[];
  isRestingNow: boolean;
  isStalledBreakdown: boolean;
  roadsideRepairMinutesRemaining?: number;
  roadsideRepairType?: 'mobile' | 'heavy_tow';
}

export type TransactionType = 'freight_revenue' | 'fuel_expense' | 'maintenance_expense' | 'driver_wages' | 'toll_expense' | 'broker_fee' | 'loan_repay' | 'loan_disbursement' | 'equipment_purchase' | 'depot_upgrade' | 'breakdown_recovery';

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
  type: 'delivery' | 'weather' | 'maintenance' | 'breakdown' | 'finance' | 'driver' | 'ai' | 'event' | 'incident' | 'accident';
  timestamp: number;
}

export interface OnboardingConfig {
  region: GeoRegion;
  primaryHubId: string;
  connectedLocationId?: string; // 1 delivery location connected to starting hub (high realism)
  connectedHubIds?: string[];
  companyName: string;
  starterTruckModelId: TruckModelId;
  starterTrailerModelId: TrailerModelId;
  starterLivery: FleetLivery;
}

export type MacroEventType =
  | 'oil_refinery_disruption'
  | 'dot_safety_blitz'
  | 'polar_vortex_blizzard'
  | 'port_dockworker_congestion'
  | 'summer_heatwave_buckling'
  | 'infrastructure_corridor_subsidy'
  | 'just_in_time_shortage';

export interface MacroWorldEvent {
  id: string;
  type: MacroEventType;
  title: string;
  category: 'economic' | 'weather' | 'regulatory' | 'logistics';
  description: string;
  region?: GeoRegion | 'Global';
  simStartMinutes: number;
  durationMinutes: number;
  expiresSimMinutes: number;
  fuelPriceMultiplier?: number;
  tollMultiplier?: number;
  freightPayoutMultiplier?: number;
  accidentRiskMultiplier?: number;
  inspectionFrequencyMultiplier?: number;
  roadFrictionPenalty?: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  icon: string;
}

export type IncidentSeverity = 'minor_incident' | 'moderate_delay' | 'major_breakdown' | 'severe_accident';

export type IncidentType =
  | 'tire_blowout'
  | 'dot_inspection_citation'
  | 'dot_inspection_clean'
  | 'rockslide_detour'
  | 'cargo_shift'
  | 'intercooler_hose_blow'
  | 'jackknife_accident'
  | 'fog_pileup_accident'
  | 'tanker_rollover'
  | 'dock_backing_collision'
  | 'black_ice_near_miss';

export interface FleetIncidentRecord {
  id: string;
  simDay: number;
  simTimeFormatted: string;
  timestamp: number;
  severity: IncidentSeverity;
  title: string;
  type: IncidentType;
  truckId: string;
  truckPlate: string;
  truckModelName: string;
  driverId: string;
  driverName: string;
  corridorName: string;
  locationKm: number;
  weatherCondition: WeatherType;
  rootCause: string;
  directCostUsd: number;
  insuranceClaimUsd: number;
  netExpenseUsd: number;
  downtimeMinutes: number;
  isResolved: boolean;
  citationDetails?: string;
}

export interface GoldMarketState {
  spotPriceUsd: number; // e.g. $2,500/oz base benchmark
  previousDaySpotPriceUsd: number;
  dayChangePercent: number;
  dayHighUsd: number;
  dayLowUsd: number;
  brokerFeePercent: number; // 1.5%
  totalGoldReserveUsd: number;
  history: Array<{ simDay: number; price: number }>;
}

export interface CommercialInsurancePolicy {
  policyTier: 'basic_liability' | 'comprehensive_fleet' | 'platinum_umbrella';
  tierName: string;
  deductibleUsd: number;
  coverageRatioPercent: number; // 75%, 85%, 95%
  dailyPremiumUsd: number;
  claimsPaidTotalUsd: number;
}

export interface SpotAuctionLoad {
  id: string;
  shipperName: string;
  cargoTitle: string;
  weightTons: number;
  originName: string;
  destinationName: string;
  distanceKm: number;
  baseBidUsd: number;
  currentHighestBidUsd: number;
  expiresSimMinutes: number;
  category: string;
  isHazardous: boolean;
  temperatureControlled: boolean;
  bidStatus: 'open' | 'won' | 'lost';
}

export interface TerminalConcession {
  id: string;
  name: string;
  type: 'port_container' | 'rail_bridge' | 'air_freight';
  location: string;
  acquisitionCostUsd: number;
  weeklyRevenueUsd: number;
  isOwned: boolean;
}

export interface GameState {
  companyName: string;
  balanceUsd: number;
  gold: number;
  goldMarket: GoldMarketState;
  insurancePolicy: CommercialInsurancePolicy;
  activeEvents: MacroWorldEvent[];
  incidentHistory: FleetIncidentRecord[];
  simTimeMinutes: number; // 0 = Day 1, 00:00
  simSpeed: 0 | 1;
  selectedRegion: GeoRegion;
  hubs: Hub[];
  routes: RouteCorridor[];
  trucks: TruckInstance[];
  trailers: TrailerInstance[];
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
  playerRank: number;
  playerXp: number;
  rankTitle: string;
  ownedHubIds: string[];
  ownedRouteIds: string[];
  ownedSpokeConnections: string[]; // Array of 'hubId:spokeLocationId'
  claimedAchievementIds: string[];
  hasCompletedOnboarding: boolean;
  showGuide: boolean;
  lastMarketRefreshSimTime?: number;
  unlockedRegions: GeoRegion[];
  lastRealTimeTimestamp?: number;
  offlineProgress?: {
    hoursElapsed: number;
    completedContracts: number;
    revenueEarned: number;
    kmCovered: number;
    visible: boolean;
  } | null;
  aiDispatcherActive: boolean;
  aiSubscriptionExpiresSimMinutes: number;
  aiFleetMaintenanceActive: boolean;
  aiFleetMaintenanceExpiresSimMinutes: number;
  aiOfflineDispatchActive: boolean;
  aiOfflineDispatchExpiresSimMinutes: number;
  aiAutoRenew?: boolean;
  aiAutoDispatchEnabled?: boolean;
  claimedGrantIds: string[];
  creditScore: string;
  revolvingCreditLimitUsd: number;
  revolvingCreditUsedUsd: number;
  spotAuctions: SpotAuctionLoad[];
  terminalConcessions: TerminalConcession[];
  totalCo2EmissionsKg: number;
  carbonTaxPaidUsd: number;
  greenSubsidiesEarnedUsd: number;
}

export type MechanicalAssemblyCategory = 'engine' | 'transmission' | 'drivetrain' | 'brakes' | 'cooling' | 'suspension' | 'emissions' | 'exhaust' | 'tires';
export type PartQualityTier = 'OEM Standard' | 'Heavy-Duty Reinforced' | 'High-Performance Ceramic';

export interface RealisticTruckPart {
  id: string;
  name: string;
  assembly: MechanicalAssemblyCategory;
  conditionPct: number;
  basePriceUsd: number;
  laborUsd: number;
  metricLabel: string;
  wearCause: string;
  isCritical: boolean;
}


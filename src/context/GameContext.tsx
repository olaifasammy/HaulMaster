import React, { createContext, useContext, useEffect, useState, useRef, useTransition } from 'react';
import {
  GameState,
  GeoRegion,
  ActiveTrip,
  TruckInstance,
  TrailerInstance,
  TrailerModelId,
  TruckConfigOptions,
  TrailerConfigOptions,
  Driver,
  CargoContract,
  LedgerEntry,
  BankLoan,
  GameEventNotification,
  TruckModelId,
  Hub,
  RouteCorridor,
  OnboardingConfig,
} from '../types/game';
import {
  INITIAL_HUBS,
  INITIAL_ROUTES,
  INITIAL_DRIVERS,
  INITIAL_CONTRACTS,
  TRUCK_MODELS,
  TRAILER_MODELS,
  INITIAL_TRAILERS,
  createPristineSubsystems,
  RANK_TIERS,
} from '../constants/gameData';
import { computePhysicsStep } from '../utils/physicsEngine';
import { getLocalWeather } from '../utils/weatherEngine';
import { WorldCompanyRepository } from '../constants/worldCompanies';

const STORAGE_KEY = 'haulmaster_game_state_v3';

export const deduplicateNotifications = (list: GameEventNotification[]): GameEventNotification[] => {
  const seen = new Set<string>();
  const result: GameEventNotification[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    let id = item.id;
    if (!id || seen.has(id)) {
      id = `${id || 'notif'}-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seen.add(id);
    result.push({ ...item, id });
  }
  return result;
};

export const generateContractsForRoutes = (
  unlockedRoutes: RouteCorridor[],
  hubs: Hub[],
  count: number = 8
): CargoContract[] => {
  if (unlockedRoutes.length === 0) return [];

  const cargoCatalog = [
    { title: 'Pharmaceutical Cold-Chain Vaccines', category: 'Refrigerated Food' as const, isCold: true, haz: false, rate: 4.8 },
    { title: 'Aerospace Jet Engine Turbine Castings', category: 'Heavy Machinery' as const, isCold: false, haz: false, rate: 5.2 },
    { title: 'Precision CNC 5-Axis Milling Centers', category: 'Heavy Machinery' as const, isCold: false, haz: false, rate: 4.5 },
    { title: 'Semiconductor Silicon Ingot Billets', category: 'High-Value Tech' as const, isCold: false, haz: false, rate: 5.6 },
    { title: 'Industrial Solvent Stabilizer Base', category: 'Hazardous Chemicals' as const, isCold: false, haz: true, hazClass: 'Class 3 Flammable' as const, rate: 5.0 },
    { title: 'Organic Citrus & Fresh Berry Freight', category: 'Refrigerated Food' as const, isCold: true, haz: false, rate: 4.2 },
    { title: 'High-Density Automotive Battery Modules', category: 'High-Value Tech' as const, isCold: false, haz: false, rate: 5.1 },
    { title: 'Consumer Electronics & Display Glass', category: 'Dry Freight' as const, isCold: false, haz: false, rate: 3.8 },
    { title: 'Commercial Wind Turbine Gearboxes', category: 'Heavy Machinery' as const, isCold: false, haz: false, rate: 5.4 },
    { title: 'Hydrochloric Acid ADR Bulk Solution', category: 'Hazardous Chemicals' as const, isCold: false, haz: true, hazClass: 'Class 8 Corrosive' as const, rate: 5.2 },
  ];

  const contracts: CargoContract[] = [];
  for (let i = 0; i < count; i++) {
    const route = unlockedRoutes[i % unlockedRoutes.length];
    const originHub = hubs.find((h) => h.id === route.originHubId);
    const destHub = hubs.find((h) => h.id === route.destinationHubId);
    if (!originHub || !destHub) continue;

    const shipper = WorldCompanyRepository.getRandomForRegion(originHub.region);
    const template = cargoCatalog[(i + Math.floor(Math.random() * cargoCatalog.length)) % cargoCatalog.length];
    const weightTons = Number((12 + Math.random() * 16).toFixed(1));
    const dist = route.distanceKm;
    const basePayout = Math.round(dist * template.rate * (0.9 + Math.random() * 0.25) * (shipper.rating / 90));

    contracts.push({
      id: `cnt-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      title: template.title,
      originHubId: route.originHubId,
      destinationHubId: route.destinationHubId,
      category: template.category,
      weightTons,
      payoutUsd: basePayout,
      bonusOnTimeUsd: Math.round(basePayout * 0.15),
      penaltyLateUsd: Math.round(basePayout * 0.3),
      deadlineMinutes: Math.round((dist / (route.baseSpeedLimitKmh * 0.85)) * 60 * 1.5),
      temperatureControlled: template.isCold,
      isHazardous: template.haz,
      hazardClass: template.hazClass,
      shipperCompany: shipper.name,
      shipperRating: shipper.rating,
      shipperIndustry: shipper.industry,
    });
  }
  return contracts;
};

interface GameContextType {
  state: GameState;
  setSimSpeed: (speed: 0 | 1 | 5 | 15) => void;
  setSelectedRegion: (region: GeoRegion) => void;
  dispatchTrip: (contractId: string, truckId: string, driverId: string, routeId: string, trailerId?: string | null) => boolean;
  serviceTruck: (truckId: string, serviceTier: 'A' | 'B' | 'Overhaul' | 'ReplaceTires') => void;
  buyTruck: (modelId: TruckModelId, hubId: string, aeroPackage: boolean) => boolean;
  buyTruckWithConfig: (options: TruckConfigOptions) => boolean;
  sellTruck: (truckId: string) => void;
  buyTrailer: (options: TrailerConfigOptions) => boolean;
  sellTrailer: (trailerId: string) => void;
  assignTrailerToTruck: (truckId: string, trailerId: string | null) => void;
  hireDriver: (driverData: Partial<Driver>) => boolean;
  fireDriver: (driverId: string) => void;
  trainDriver: (driverId: string, certType: 'mountain' | 'winter' | 'hazmat' | 'eco') => boolean;
  upgradeHub: (hubId: string, upgradeType: 'workshop' | 'bulkFuel') => boolean;
  refuelTruckAtHub: (truckId: string, liters: number) => boolean;
  takeLoan: (amount: number, termDays: number) => boolean;
  repayLoan: (loanId: string, amount: number) => void;
  dismissNotification: (id: string) => void;
  resetGame: () => void;
  // New onboarding, guide, and marketplace capabilities
  completeOnboarding: (config: OnboardingConfig) => void;
  skipOnboarding: () => void;
  setShowGuide: (show: boolean) => void;
  buyHubConcession: (hubId: string) => boolean;
  buyRouteLicense: (routeId: string) => boolean;
  connectRouteBetweenHubs: (hubAId: string, hubBId: string) => boolean;
  ferryTruck: (truckId: string, destinationHubId: string) => boolean;
  restartOnboarding: () => void;
  refreshAvailableContracts: (paidByPlayer?: boolean) => boolean;
  buySpokeLocationRoute: (hubId: string, spokeLocationId: string) => boolean;
  claimAchievementReward: (achievementId: string, cashReward: number, xpReward: number, currentValue: number, targetValue: number) => boolean;
  unlockRegion: (region: GeoRegion) => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const createInitialState = (): GameState => {
  const primaryHubId = 'hub-denver';
  const activeHubIds = [primaryHubId];

  // Configure initial hubs: strictly 1 primary headquarters hub is unlocked initially (no default connected second hub/location)
  const initialHubs = INITIAL_HUBS.map((hub) => {
    const isOwned = hub.id === primaryHubId;
    return {
      ...hub,
      isUnlocked: isOwned,
      isPrimaryBase: hub.id === primaryHubId,
    };
  });

  // Configure initial routes: strictly NO routes unlocked by default
  const initialRoutes = INITIAL_ROUTES.map((route) => ({
    ...route,
    isUnlocked: false,
  }));

  const ownedHubIds = [primaryHubId];
  const ownedRouteIds: string[] = [];

  // Free starter commercial vehicle: MetroFreight Rigid 320 Urban stationed at Denver primary base
  const initialTrucks: TruckInstance[] = [
    {
      id: 'trk-01',
      modelId: 'metro-320', // Free starter rigid truck
      vin: '1MTR320U9K001844',
      plate: 'CO-320-RG',
      currentHubId: primaryHubId,
      status: 'idle',
      odometerKm: 8500,
      fuelCurrentLiters: 300,
      adBlueCurrentLiters: 42,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: 'drv-01',
      activeTripId: null,
      lastServiceKm: 8000,
      hasAeroPackage: true,
      hasRetarder: false,
      tireCompound: 'highway_eco',
      sleeperTier: 'day_cab',
      liveryColor: 'obsidian_slate',
      assignedTrailerId: 'trl-01',
      serviceDueKm: 50000,
    },
  ];

  const initialTrailers: TrailerInstance[] = [
    {
      ...INITIAL_TRAILERS[0],
      currentHubId: primaryHubId,
    },
  ];

  const initialDrivers: Driver[] = [
    {
      ...INITIAL_DRIVERS[0],
      homeHubId: primaryHubId,
      currentHubId: primaryHubId,
      assignedTruckId: 'trk-01',
    },
  ];

  return {
    companyName: 'Apex Continental Freight',
    balanceUsd: 28500,
    simTimeMinutes: 480, // Day 1, 08:00 AM
    simSpeed: 1,
    selectedRegion: 'North America',
    hubs: initialHubs,
    routes: initialRoutes,
    trucks: initialTrucks,
    trailers: initialTrailers,
    drivers: initialDrivers,
    availableContracts: [],
    activeTrips: [],
    ledger: [
      {
        id: 'led-init',
        simDay: 1,
        simTimeFormatted: 'Day 1 08:00',
        type: 'equipment_purchase',
        description: 'Starting equity capitalization and fleet acquisition',
        amountUsd: 28500,
        runningBalanceUsd: 28500,
      },
    ],
    loans: [],
    notifications: [
      {
        id: 'notif-welcome',
        simTimeFormatted: 'Day 1 08:00',
        title: 'Operations Online',
        message: 'Logistics enterprise initialized. Starter terminal active. No routes or locations have default connections. Connect routes to hubs in the Marketplace to begin freight dispatch.',
        type: 'delivery',
        timestamp: Date.now(),
      },
    ],
    totalCargoDeliveredTons: 0,
    totalFuelBurnedLiters: 0,
    totalKilometersDriven: 0,
    ratingScore: 4.8,
    playerRank: 1,
    playerXp: 0,
    rankTitle: 'Novice Carrier',
    ownedHubIds,
    ownedRouteIds,
    ownedSpokeConnections: [],
    claimedAchievementIds: [],
    hasCompletedOnboarding: false,
    showGuide: false,
    unlockedRegions: ['North America'],
  };
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition();
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.trucks && parsed.hubs) {
          // Strictly deduplicate and ensure unique keys for any restored notifications
          parsed.notifications = deduplicateNotifications(parsed.notifications || []);
          if (!parsed.trailers || parsed.trailers.length === 0) {
            parsed.trailers = INITIAL_TRAILERS;
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return createInitialState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const notifyUser = (title: string, message: string, type: GameEventNotification['type'] = 'maintenance') => {
    const simDay = Math.floor(stateRef.current.simTimeMinutes / 1440) + 1;
    const hours = Math.floor((stateRef.current.simTimeMinutes % 1440) / 60);
    const mins = stateRef.current.simTimeMinutes % 60;
    const simTimeFormatted = `Day ${simDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const newNotif: GameEventNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      simTimeFormatted,
      title,
      message,
      type,
      timestamp: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      notifications: deduplicateNotifications([newNotif, ...prev.notifications]),
    }));
  };

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game state:', e);
    }
  }, [state]);

  // Main Simulation Loop
  useEffect(() => {
    if (state.simSpeed === 0) return;

    // Tick every 1000ms real time.
    // Sim delta in simulation minutes = simSpeed * 1 min
    const intervalMs = 1000;
    const timer = setInterval(() => {
      startTransition(() => {
        setState((prevState) => {
          if (prevState.simSpeed === 0) return prevState;

          const deltaSimMinutes = prevState.simSpeed * 2; // 2 sim minutes per second at 1x
          const newSimMinutes = prevState.simTimeMinutes + deltaSimMinutes;
          const currentDay = Math.floor(newSimMinutes / 1440) + 1;
          const prevDay = Math.floor(prevState.simTimeMinutes / 1440) + 1;
          const isMidnightRollover = currentDay > prevDay;

          const hours = Math.floor((newSimMinutes % 1440) / 60);
          const mins = newSimMinutes % 60;
          const timeFormatted = `Day ${currentDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

          let currentBalance = prevState.balanceUsd;
          const newLedgerEntries: LedgerEntry[] = [];
          const newNotifications: GameEventNotification[] = [];
          let updatedCargoTons = prevState.totalCargoDeliveredTons;
          let updatedFuelBurned = prevState.totalFuelBurnedLiters;
          let updatedKmDriven = prevState.totalKilometersDriven;

          // 1. Process Midnight Rollover (Daily loan payments, driver retainers, hub depot maintenance)
          let updatedLoans = prevState.loans;
          if (isMidnightRollover) {
            // Driver retainers
            let totalRetainers = 0;
            prevState.drivers.forEach((drv) => {
              totalRetainers += drv.dailyRetainerUsd;
            });
            if (totalRetainers > 0) {
              currentBalance -= totalRetainers;
              newLedgerEntries.push({
                id: `led-ret-${newSimMinutes}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'driver_wages',
                description: `Daily driver salary retainers (${prevState.drivers.length} drivers)`,
                amountUsd: -totalRetainers,
                runningBalanceUsd: currentBalance,
              });
            }

            // Loan interest & payments
            updatedLoans = prevState.loans
              .map((loan) => {
                const payment = Math.min(loan.dailyPaymentUsd, loan.remainingBalanceUsd);
                currentBalance -= payment;
                newLedgerEntries.push({
                  id: `led-loan-${loan.id}-${newSimMinutes}`,
                  simDay: currentDay,
                  simTimeFormatted: timeFormatted,
                  type: 'loan_repay',
                  description: `Equipment loan daily installment`,
                  amountUsd: -payment,
                  runningBalanceUsd: currentBalance,
                });
                return {
                  ...loan,
                  remainingBalanceUsd: Math.max(0, loan.remainingBalanceUsd - payment),
                  daysRemaining: Math.max(0, loan.daysRemaining - 1),
                };
              })
              .filter((loan) => loan.remainingBalanceUsd > 0);

            // Fluctuate hub fuel spot prices by +/- 3%
            const updatedHubs = prevState.hubs.map((h) => {
              const delta = (Math.random() - 0.5) * 0.08;
              const newPrice = Math.max(0.85, Math.min(2.4, Number((h.fuelPricePerLiter + delta).toFixed(2))));
              return { ...h, fuelPricePerLiter: newPrice };
            });

            // Restock fresh available contracts ONLY for unlocked routes in the active region!
            const unlockedRoutes = prevState.routes.filter(
              (r) => r.isUnlocked && prevState.hubs.find((h) => h.id === r.originHubId)?.region === prevState.selectedRegion
            );
            if (prevState.availableContracts.length < 8 && unlockedRoutes.length > 0) {
              const freshContracts = generateContractsForRoutes(unlockedRoutes, updatedHubs, 3);
              prevState = {
                ...prevState,
                availableContracts: [...prevState.availableContracts, ...freshContracts],
                hubs: updatedHubs,
              };
            } else {
              prevState = {
                ...prevState,
                hubs: updatedHubs,
              };
            }
          }

          // Periodic commercial freight board auto-refresh (every 180 sim minutes or when < 4 contracts remain)
          const lastRefreshTime = prevState.lastMarketRefreshSimTime || 0;
          const shouldAutoRefresh = (newSimMinutes - lastRefreshTime >= 180) || (prevState.availableContracts.length < 4);
          if (shouldAutoRefresh) {
            const activeRegionRoutes = prevState.routes.filter(
              (r) => r.isUnlocked && prevState.hubs.find((h) => h.id === r.originHubId)?.region === prevState.selectedRegion
            );
            if (activeRegionRoutes.length > 0) {
              const freshBids = generateContractsForRoutes(activeRegionRoutes, prevState.hubs, 4);
              const prunedExisting = prevState.availableContracts.slice(-4);
              prevState = {
                ...prevState,
                availableContracts: [...prunedExisting, ...freshBids],
                lastMarketRefreshSimTime: newSimMinutes,
              };
            }
          }

          // 2. Advance Active Trips & Compute Physics
          const remainingTrips: ActiveTrip[] = [];
          const completedTrips: ActiveTrip[] = [];
          let updatedTrucks = [...prevState.trucks];
          let updatedTrailers = [...(prevState.trailers || [])];
          let updatedDrivers = [...prevState.drivers];

          for (const trip of prevState.activeTrips) {
            const truck = updatedTrucks.find((t) => t.id === trip.truckId);
            const driver = updatedDrivers.find((d) => d.id === trip.driverId);
            const model = TRUCK_MODELS.find((m) => m.id === truck?.modelId);
            const trailer = trip.trailerId ? updatedTrailers.find((tr) => tr.id === trip.trailerId) : null;
            const trailerModel = trailer ? TRAILER_MODELS.find((tm) => tm.id === trailer.modelId) : null;

            if (!truck || !driver || !model) {
              continue;
            }

            // Check if truck is stalled in breakdown
            if (trip.isStalledBreakdown) {
              remainingTrips.push(trip);
              continue;
            }

            // Check Driver Tachograph Rest Status
            let isResting = trip.isRestingNow;
            let currentRestMins = driver.currentRestMinutesRemaining;
            let continuousMins = driver.continuousDriveMinutes;
            let dailyMins = driver.dailyDriveMinutes;

            if (isResting) {
              currentRestMins -= deltaSimMinutes;
              if (currentRestMins <= 0) {
                // Rest period finished! Driver resumes driving
                isResting = false;
                currentRestMins = 0;
                continuousMins = 0;
                newNotifications.push({
                  id: `notif-rest-done-${trip.id}-${newSimMinutes}`,
                  simTimeFormatted: timeFormatted,
                  title: 'Mandatory Driver Rest Concluded',
                  message: `${driver.name} has concluded required rest cycle and resumed haul towards destination.`,
                  type: 'driver',
                  timestamp: Date.now(),
                });
              }
              // Advance time but 0 movement
              remainingTrips.push({
                ...trip,
                elapsedMinutes: trip.elapsedMinutes + deltaSimMinutes,
                isRestingNow: isResting,
                telemetry: {
                  ...trip.telemetry,
                  currentSpeedKmh: 0,
                  engineRpm: 600,
                  instantFuelRateLitersPerHour: 0.8, // idle cab heater
                  instantFuelRateL100km: 0,
                },
              });
              // Update driver state
              updatedDrivers = updatedDrivers.map((d) =>
                d.id === driver.id
                  ? {
                      ...d,
                      currentRestMinutesRemaining: currentRestMins,
                      hosStatus: isResting ? 'resting' : 'driving',
                    }
                  : d
              );
              continue;
            }

            // Calculate current coordinate along corridor waypoints
            const fraction = Math.min(1.0, trip.progressKm / trip.totalDistanceKm);
            const waypoints = trip.corridor.waypoints;
            const segmentCount = waypoints.length - 1;
            const exactSegment = fraction * segmentCount;
            const segIndex = Math.min(segmentCount - 1, Math.floor(exactSegment));
            const segFraction = exactSegment - segIndex;

            const wpStart = waypoints[segIndex];
            const wpEnd = waypoints[segIndex + 1];

            const currentCoord = {
              x: wpStart.coord.x + (wpEnd.coord.x - wpStart.coord.x) * segFraction,
              y: wpStart.coord.y + (wpEnd.coord.y - wpStart.coord.y) * segFraction,
            };
            const currentElevation = wpStart.elevationMeters + (wpEnd.elevationMeters - wpStart.elevationMeters) * segFraction;

            // Segment elevation grade %
            const segDistKm = trip.totalDistanceKm / segmentCount;
            const elevationDeltaM = wpEnd.elevationMeters - wpStart.elevationMeters;
            const gradePct = segDistKm > 0 ? (elevationDeltaM / (segDistKm * 1000)) * 100 : 0;

            // Dynamic Weather at current position
            const weather = getLocalWeather(currentCoord, currentElevation, newSimMinutes);

            // Compute Physics Step
            const deltaSeconds = deltaSimMinutes * 60;
            const physics = computePhysicsStep({
              specs: model.specs,
              payloadKg: trip.contract.weightTons * 1000,
              subsystems: truck.subsystems,
              driverStats: driver.stats,
              weather,
              gradePct,
              speedLimitKmh: trip.corridor.baseSpeedLimitKmh,
              hasAeroPackage: truck.hasAeroPackage,
              hasTrailerAeroSkirts: trailer?.hasAeroSkirts || false,
              hasRetarder: truck.hasRetarder,
              isReeferCargo: trip.contract.temperatureControlled || (trailer?.hasReeferUnit ?? false),
              tireCompound: truck.tireCompound,
              trailerEmptyWeightKg: trailerModel?.emptyWeightKg || 0,
              deltaSeconds,
              currentSpeedKmh: trip.telemetry.currentSpeedKmh,
            });

            // Fuel depletion check
            const nextFuel = Math.max(0, truck.fuelCurrentLiters - physics.fuelBurnedLiters);
            const nextAdBlue = Math.max(0, truck.adBlueCurrentLiters - physics.adBlueBurnedLiters);
            updatedFuelBurned += physics.fuelBurnedLiters;

            if (nextFuel <= 0) {
              // Run out of fuel! Emergency dispatch recovery
              currentBalance -= 2200;
              newLedgerEntries.push({
                id: `led-fuel-empty-${trip.id}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'breakdown_recovery',
                description: `Emergency roadside fuel service for ${truck.plate}`,
                amountUsd: -2200,
                runningBalanceUsd: currentBalance,
              });
              newNotifications.push({
                id: `notif-fuel-empty-${trip.id}-${newSimMinutes}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: 'Fuel Depletion Alert',
                message: `Truck ${truck.plate} exhausted fuel tanks. Roadside recovery tanker dispatched ($2,200).`,
                type: 'breakdown',
                timestamp: Date.now(),
              });
            }

            // Check component catastrophic failure
            let isBreakdown = false;
            if (physics.updatedSubsystems.brakePads <= 0 || physics.updatedSubsystems.engineBlock <= 0) {
              isBreakdown = true;
              currentBalance -= 3800;
              newLedgerEntries.push({
                id: `led-cat-breakdown-${trip.id}-${newSimMinutes}-${Math.random().toString(36).substring(2, 7)}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'breakdown_recovery',
                description: `Emergency towing & mobile mechanic repair for ${truck.plate}`,
                amountUsd: -3800,
                runningBalanceUsd: currentBalance,
              });
              newNotifications.push({
                id: `notif-cat-breakdown-${trip.id}-${newSimMinutes}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: 'Critical Mechanical Breakdown',
                message: `Critical mechanical failure on ${truck.plate}. Tow truck dispatched to scene.`,
                type: 'breakdown',
                timestamp: Date.now(),
              });
            }

            // Advance Driver Tachograph
            continuousMins += deltaSimMinutes;
            dailyMins += deltaSimMinutes;

            // Tachograph rule: If continuous >= 270 (4.5h), trigger mandatory 45 min rest
            if (continuousMins >= 270) {
              isResting = true;
              currentRestMins = 45;
              continuousMins = 0; // Reset continuous drive timer so it doesn't repeatedly trigger
              newNotifications.push({
                id: `notif-tach-rest-${trip.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: 'Tachograph Mandatory Rest (4.5h limit)',
                message: `${driver.name} pulled into highway rest bay for 45-minute mandatory break.`,
                type: 'driver',
                timestamp: Date.now(),
              });
            } else if (dailyMins >= 540) {
              // Daily 9h drive limit -> 11h (660 min) sleeper rest
              isResting = true;
              currentRestMins = 660;
              dailyMins = 0;
              continuousMins = 0;
              newNotifications.push({
                id: `notif-daily-rest-${trip.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: 'Mandatory Daily Sleeper Rest (9h Drive Cap)',
                message: `${driver.name} concluded 9h shift. Truck parked in truck stop for 11h rest cycle.`,
                type: 'driver',
                timestamp: Date.now(),
              });
            }

            // Update Truck & Driver instances
            const nextProgressKm = trip.progressKm + physics.distanceCoveredKm;
            updatedKmDriven += physics.distanceCoveredKm;

            updatedTrucks = updatedTrucks.map((t) =>
              t.id === truck.id
                ? {
                    ...t,
                    odometerKm: t.odometerKm + physics.distanceCoveredKm,
                    fuelCurrentLiters: nextFuel <= 0 ? 50 : nextFuel,
                    adBlueCurrentLiters: nextAdBlue,
                    subsystems: physics.updatedSubsystems,
                    activeDTCs: [...t.activeDTCs.filter((d) => d.active), ...physics.newDTCs],
                    status: isBreakdown ? 'breakdown' : 'en_route',
                  }
                : t
            );

            updatedDrivers = updatedDrivers.map((d) =>
              d.id === driver.id
                ? {
                    ...d,
                    continuousDriveMinutes: continuousMins,
                    dailyDriveMinutes: dailyMins,
                    currentRestMinutesRemaining: currentRestMins,
                    hosStatus: isResting ? 'resting' : 'driving',
                    stats: {
                      ...d.stats,
                      totalKmDriven: d.stats.totalKmDriven + physics.distanceCoveredKm,
                    },
                  }
                : d
            );

            // Check if trip arrived at destination
            if (nextProgressKm >= trip.totalDistanceKm) {
              completedTrips.push({
                ...trip,
                progressKm: trip.totalDistanceKm,
                elapsedMinutes: trip.elapsedMinutes + deltaSimMinutes,
                fuelConsumedLiters: trip.fuelConsumedLiters + physics.fuelBurnedLiters,
              });
            } else {
              remainingTrips.push({
                ...trip,
                progressKm: nextProgressKm,
                elapsedMinutes: trip.elapsedMinutes + deltaSimMinutes,
                fuelConsumedLiters: trip.fuelConsumedLiters + physics.fuelBurnedLiters,
                isRestingNow: isResting,
                isStalledBreakdown: isBreakdown,
                telemetry: physics.telemetry,
              });
            }
          }

          // 3. Process Completed Trips & Financial Payouts
          let updatedPlayerXp = prevState.playerXp;
          let updatedPlayerRank = prevState.playerRank;
          let updatedRankTitle = prevState.rankTitle;

          for (const finished of completedTrips) {
            const destHub = prevState.hubs.find((h) => h.id === finished.contract.destinationHubId);
            const isOnTime = finished.elapsedMinutes <= finished.contract.deadlineMinutes;
            const grossPayout = finished.contract.payoutUsd + (isOnTime ? finished.contract.bonusOnTimeUsd : -finished.contract.penaltyLateUsd);
            const finalRevenue = Math.max(0, grossPayout);

            // Driver distance wage
            const driverWage = finished.totalDistanceKm * (prevState.drivers.find((d) => d.id === finished.driverId)?.wagePerKmUsd || 0.45);
            // Tolls
            const tolls = finished.corridor.tollCostUsd;

            currentBalance += finalRevenue - driverWage - tolls;
            updatedCargoTons += finished.contract.weightTons;

            // XP and Rank Promotion
            const earnedXp = Math.round(finished.totalDistanceKm * 0.35 + finished.contract.weightTons * 12);
            updatedPlayerXp += earnedXp;

            for (const tier of RANK_TIERS) {
              if (updatedPlayerXp >= tier.xpRequired && tier.rank > updatedPlayerRank) {
                updatedPlayerRank = tier.rank;
                updatedRankTitle = tier.title;
                newNotifications.push({
                  id: `notif-rank-${tier.rank}-${newSimMinutes}-${Date.now()}`,
                  simTimeFormatted: timeFormatted,
                  title: `⭐ PROMOTED: ${tier.title.toUpperCase()} (Rank ${tier.rank})`,
                  message: `Carrier reputation elevated to Rank ${tier.rank} (${tier.title}). New hub concessions and trade corridors are now unlocked in the Marketplace!`,
                  type: 'delivery',
                  timestamp: Date.now(),
                });
              }
            }

            newLedgerEntries.push({
              id: `led-deliv-${finished.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              simDay: currentDay,
              simTimeFormatted: timeFormatted,
              type: 'freight_revenue',
              description: `Delivered: ${finished.contract.title} (${finished.contract.weightTons}t) to ${destHub?.name || 'Destination'}${isOnTime ? ' (On-Time Bonus)' : ' (Late Penalty)'} [+${earnedXp} XP]`,
              amountUsd: finalRevenue,
              runningBalanceUsd: currentBalance,
            });

            newLedgerEntries.push({
              id: `led-wage-${finished.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              simDay: currentDay,
              simTimeFormatted: timeFormatted,
              type: 'driver_wages',
              description: `Driver mileage payout (${Math.round(finished.totalDistanceKm)} km)`,
              amountUsd: -Math.round(driverWage),
              runningBalanceUsd: currentBalance,
            });

            if (tolls > 0) {
              newLedgerEntries.push({
                id: `led-toll-${finished.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'toll_expense',
                description: `Corridor electronic highway tolls`,
                amountUsd: -tolls,
                runningBalanceUsd: currentBalance,
              });
            }

            newNotifications.push({
              id: `notif-deliv-${finished.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              simTimeFormatted: timeFormatted,
              title: 'Freight Consignment Delivered',
              message: `Cargo arrived at ${destHub?.name}. Net payment: $${finalRevenue.toLocaleString()}. Fuel consumed: ${Math.round(finished.fuelConsumedLiters)}L.`,
              type: 'delivery',
              timestamp: Date.now(),
            });

            // Set truck, trailer, and driver to idle at destination hub
            updatedTrucks = updatedTrucks.map((t) =>
              t.id === finished.truckId
                ? {
                    ...t,
                    status: 'idle',
                    currentHubId: finished.contract.destinationHubId,
                    activeTripId: null,
                  }
                : t
            );

            if (finished.trailerId) {
              updatedTrailers = updatedTrailers.map((tr) =>
                tr.id === finished.trailerId
                  ? {
                      ...tr,
                      status: 'idle',
                      currentHubId: finished.contract.destinationHubId,
                      assignedTripId: null,
                      odometerKm: tr.odometerKm + finished.totalDistanceKm,
                    }
                  : tr
              );
            }

            updatedDrivers = updatedDrivers.map((d) =>
              d.id === finished.driverId
                ? {
                    ...d,
                    currentHubId: finished.contract.destinationHubId,
                    hosStatus: 'off_duty',
                    stats: {
                      ...d.stats,
                      deliveriesCompleted: d.stats.deliveriesCompleted + 1,
                    },
                  }
                : d
            );
          }

          // Deduplicate notifications strictly
          const uniqueNotifications = deduplicateNotifications([...newNotifications, ...prevState.notifications]);

          // Automatically refuel parked trucks at hubs from hub bulk fuel stock
          let finalHubs = [...prevState.hubs];
          updatedTrucks = updatedTrucks.map((truck) => {
            if (truck.status !== 'idle') return truck;
            const hub = finalHubs.find((h) => h.id === truck.currentHubId);
            if (!hub || hub.bulkFuelStockLiters <= 0) return truck;

            const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
            if (!model) return truck;

            const capacity = model.specs.fuelTankCapacityLiters;
            if (truck.fuelCurrentLiters >= capacity) return truck;

            const needed = capacity - truck.fuelCurrentLiters;
            const toTransfer = Math.min(needed, hub.bulkFuelStockLiters);

            if (toTransfer > 0) {
              finalHubs = finalHubs.map((h) =>
                h.id === hub.id ? { ...h, bulkFuelStockLiters: Math.max(0, h.bulkFuelStockLiters - toTransfer) } : h
              );
              return {
                ...truck,
                fuelCurrentLiters: truck.fuelCurrentLiters + toTransfer,
              };
            }
            return truck;
          });

          return {
            ...prevState,
            balanceUsd: currentBalance,
            simTimeMinutes: newSimMinutes,
            activeTrips: remainingTrips,
            trucks: updatedTrucks,
            trailers: updatedTrailers,
            drivers: updatedDrivers,
            hubs: finalHubs,
            loans: updatedLoans,
            ledger: [...newLedgerEntries, ...prevState.ledger].slice(0, 150),
            notifications: uniqueNotifications.slice(0, 40),
            totalCargoDeliveredTons: updatedCargoTons,
            totalFuelBurnedLiters: updatedFuelBurned,
            totalKilometersDriven: updatedKmDriven,
            playerRank: updatedPlayerRank,
            playerXp: updatedPlayerXp,
            rankTitle: updatedRankTitle,
          };
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [state.simSpeed]);

  // Actions
  const setSimSpeed = (speed: 0 | 1 | 5 | 15) => {
    setState((prev) => ({ ...prev, simSpeed: speed }));
  };

  const setSelectedRegion = (region: GeoRegion) => {
    setState((prev) => ({ ...prev, selectedRegion: region }));
  };

  const dispatchTrip = (contractId: string, truckId: string, driverId: string, routeId: string, trailerId?: string | null): boolean => {
    const contract = state.availableContracts.find((c) => c.id === contractId);
    const truck = state.trucks.find((t) => t.id === truckId);
    const driver = state.drivers.find((d) => d.id === driverId);
    const corridor = state.routes.find((r) => r.id === routeId);

    if (!contract || !truck || !driver || !corridor) return false;
    if (truck.status !== 'idle' || driver.hosStatus === 'driving') return false;

    // Check trailer if provided
    if (trailerId) {
      const trailer = state.trailers.find((tr) => tr.id === trailerId);
      if (!trailer || trailer.status !== 'idle') {
        notifyUser('Trailer Unavailable', 'Selected trailer is currently en route or unavailable.', 'maintenance');
        return false;
      }
    }

    // Check truck fuel capacity & range
    if (truck.fuelCurrentLiters < 100) {
      notifyUser('Low Fuel Warning', `Truck ${truck.plate} has low fuel (${Math.round(truck.fuelCurrentLiters)}L). Please refuel at hub depot before departure.`, 'maintenance');
      return false;
    }

    // Check hazardous cert
    if (contract.isHazardous && !driver.stats.hazmatCert) {
      notifyUser('Certification Missing', `Driver ${driver.name} lacks Hazardous Materials (ADR/HAZMAT) certification required for this cargo.`, 'driver');
      return false;
    }

    // Vehicle combination legal payload limits (High Realism)
    const truckModel = TRUCK_MODELS.find((m) => m.id === truck.modelId);
    const trailerInstance = trailerId ? state.trailers.find((tr) => tr.id === trailerId) : null;
    const trailerModel = trailerInstance ? TRAILER_MODELS.find((tm) => tm.id === trailerInstance.modelId) : null;

    const truckMaxTons = (truckModel?.specs.maxPayloadKg || 24000) / 1000;
    let maxAllowedPayloadTons = truckMaxTons;
    if (trailerModel) {
      const trailerMaxTons = trailerModel.maxPayloadKg / 1000;
      maxAllowedPayloadTons = Math.min(truckMaxTons, trailerMaxTons);
    }

    if (contract.weightTons > maxAllowedPayloadTons) {
      notifyUser(
        'Gross Overload Violation',
        `GVWR Overload: Consignment weight (${contract.weightTons}t) exceeds legal rated capacity (${maxAllowedPayloadTons}t max). Upgrade to a multi-axle heavy hauler or heavy machinery lowbed.`,
        'breakdown'
      );
      return false;
    }

    const newTripId = `trp-${Date.now()}`;
    const initialTelemetry = {
      currentSpeedKmh: 0,
      engineRpm: 700,
      currentGear: 1,
      instantFuelRateL100km: 0,
      instantFuelRateLitersPerHour: 1.2,
      engineLoadPct: 15,
      turboBoostBar: 0.2,
      oilTempCelsius: 85,
      oilPressureBar: 3.5,
      coolantTempCelsius: 82,
      brakeTempCelsius: 45,
      retarderActive: false,
      retarderLevel: 0,
      currentInclinePct: corridor.avgElevationGradePct,
      currentWindSpeedKmh: 12,
      currentHeadwindComponentKmh: 5,
      weatherState: getLocalWeather(corridor.waypoints[0].coord, corridor.waypoints[0].elevationMeters, state.simTimeMinutes),
    };

    const newTrip: ActiveTrip = {
      id: newTripId,
      contract,
      corridor,
      truckId,
      driverId,
      trailerId: trailerId || null,
      progressKm: 0,
      totalDistanceKm: corridor.distanceKm,
      elapsedMinutes: 0,
      departureTimeSimMinutes: state.simTimeMinutes,
      fuelConsumedLiters: 0,
      telemetry: initialTelemetry,
      eventLogs: [`Departed ${corridor.waypoints[0].name} on route to destination`],
      isRestingNow: false,
      isStalledBreakdown: false,
    };

    setState((prev) => ({
      ...prev,
      availableContracts: prev.availableContracts.filter((c) => c.id !== contractId),
      activeTrips: [...prev.activeTrips, newTrip],
      trucks: prev.trucks.map((t) => (t.id === truckId ? { ...t, status: 'en_route', activeTripId: newTripId, assignedTrailerId: trailerId || t.assignedTrailerId } : t)),
      trailers: trailerId
        ? prev.trailers.map((tr) => (tr.id === trailerId ? { ...tr, status: 'en_route', assignedTruckId: truckId, assignedTripId: newTripId } : tr))
        : prev.trailers,
      drivers: prev.drivers.map((d) => (d.id === driverId ? { ...d, hosStatus: 'driving', assignedTruckId: truckId } : d)),
      notifications: deduplicateNotifications([
        {
          id: `notif-disp-${newTripId}-${Date.now()}`,
          simTimeFormatted: `Day ${Math.floor(prev.simTimeMinutes / 1440) + 1}`,
          title: 'Haul Dispatched',
          message: `${contract.title} dispatched via ${corridor.name} with truck ${truck.plate}${trailerId ? ' & trailer' : ''} & driver ${driver.name}.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const serviceTruck = (truckId: string, serviceTier: 'A' | 'B' | 'Overhaul' | 'ReplaceTires') => {
    const truck = state.trucks.find((t) => t.id === truckId);
    if (!truck || truck.status === 'en_route') return;

    let cost = 0;
    let description = '';

    setState((prev) => {
      let updatedSub = { ...truck.subsystems };

      if (serviceTier === 'A') {
        cost = 1450;
        description = `Routine A-Service for ${truck.plate} (Fluids, filters, diagnostics)`;
        updatedSub = {
          ...updatedSub,
          engineBlock: Math.min(100, updatedSub.engineBlock + 10),
          coolingSystem: 100,
          exhaustAftertreatment: 98,
        };
      } else if (serviceTier === 'B') {
        cost = 3800;
        description = `Major B-Service for ${truck.plate} (Brake pads & rotors, suspension, transmission)`;
        updatedSub = {
          ...updatedSub,
          brakePads: 100,
          brakeRotors: 100,
          clutchPlate: 98,
          suspensionDampers: 98,
          transmission: 98,
        };
      } else if (serviceTier === 'ReplaceTires') {
        cost = 2400;
        description = `Full axle tire replacement set for ${truck.plate}`;
        updatedSub = {
          ...updatedSub,
          steerTires: {
            pressurePsi: 110,
            recommendedPsi: 110,
            temperatureCelsius: 22,
            treadDepthMm: 16.0,
            wearPercentage: 100,
          },
          driveTiresAxle1: {
            pressurePsi: 105,
            recommendedPsi: 105,
            temperatureCelsius: 22,
            treadDepthMm: 16.0,
            wearPercentage: 100,
          },
        };
      } else if (serviceTier === 'Overhaul') {
        cost = 16500;
        description = `Complete powertrain overhaul & turbo rebuild for ${truck.plate}`;
        updatedSub = createPristineSubsystems();
      }

      if (prev.balanceUsd < cost) {
        notifyUser('Insufficient Funds', 'Insufficient company capital for this maintenance procedure.', 'finance');
        return prev;
      }

      const nextBal = prev.balanceUsd - cost;
      const simDay = Math.floor(prev.simTimeMinutes / 1440) + 1;

      return {
        ...prev,
        balanceUsd: nextBal,
        trucks: prev.trucks.map((t) =>
          t.id === truckId
            ? {
                ...t,
                subsystems: updatedSub,
                activeDTCs: [],
                status: 'idle',
                lastServiceKm: t.odometerKm,
                serviceDueKm: t.odometerKm + 45000,
              }
            : t
        ),
        ledger: [
          {
            id: `led-srv-${Date.now()}`,
            simDay,
            simTimeFormatted: `Day ${simDay}`,
            type: 'maintenance_expense',
            description,
            amountUsd: -cost,
            runningBalanceUsd: nextBal,
          },
          ...prev.ledger,
        ],
        notifications: deduplicateNotifications([
          {
            id: `notif-srv-${truckId}-${Date.now()}`,
            simTimeFormatted: `Day ${simDay}`,
            title: 'Maintenance Certified',
            message: `${description} completed. All diagnostic codes reset to nominal.`,
            type: 'maintenance',
            timestamp: Date.now(),
          },
          ...prev.notifications,
        ]),
      };
    });
  };

  const buyTruck = (modelId: TruckModelId, hubId: string, aeroPackage: boolean): boolean => {
    const model = TRUCK_MODELS.find((m) => m.id === modelId);
    if (!model) return false;

    const aeroCost = aeroPackage ? 4500 : 0;
    const totalCost = model.basePriceUsd + aeroCost;

    if (state.balanceUsd < totalCost) {
      notifyUser('Insufficient Capital', `Price is $${totalCost.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}. Consider taking an equipment loan.`, 'finance');
      return false;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newTruck: TruckInstance = {
      id: `trk-${Date.now()}`,
      modelId,
      vin: `1${modelId.toUpperCase().slice(0, 3)}${randomSuffix}K09${Math.floor(1000 + Math.random() * 9000)}`,
      plate: `TX-${randomSuffix}-FL`,
      currentHubId: hubId,
      status: 'idle',
      odometerKm: 250, // factory delivery distance
      fuelCurrentLiters: model.specs.fuelTankCapacityLiters * 0.9,
      adBlueCurrentLiters: model.specs.adBlueTankLiters * 0.9,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: null,
      activeTripId: null,
      lastServiceKm: 0,
      hasAeroPackage: aeroPackage,
      hasRetarder: true,
      tireCompound: 'highway_eco',
      sleeperTier: 'standard_sleeper',
      liveryColor: 'obsidian_slate',
      assignedTrailerId: null,
      serviceDueKm: 45000,
    };

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - totalCost;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trucks: [...prev.trucks, newTruck],
      ledger: [
        {
          id: `led-buy-${newTruck.id}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'equipment_purchase',
          description: `Acquired new ${model.name} for ${model.manufacturer} fleet`,
          amountUsd: -totalCost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-buy-${newTruck.id}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Fleet Expansion',
          message: `${model.name} delivered to hub. Ready for crew assignment.`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const buyTruckWithConfig = (options: TruckConfigOptions): boolean => {
    const model = TRUCK_MODELS.find((m) => m.id === options.modelId);
    if (!model) return false;

    let extraCost = 0;
    if (options.hasAeroPackage) extraCost += 4500;
    if (options.hasRetarder) extraCost += 3200;
    if (options.tireCompound === 'severe_snow') extraCost += 1800;
    else if (options.tireCompound === 'all_weather') extraCost += 800;
    if (options.sleeperTier === 'deluxe_suite') extraCost += 8500;
    else if (options.sleeperTier === 'standard_sleeper') extraCost += 3500;
    if (options.liveryColor !== 'obsidian_slate') extraCost += 1200;

    let trailerCost = 0;
    let newTrailer: TrailerInstance | null = null;
    const truckId = `trk-${Date.now()}`;

    if (options.selectedTrailerModelId) {
      const trailerModel = TRAILER_MODELS.find((m) => m.id === options.selectedTrailerModelId);
      if (trailerModel) {
        const trailerAero = options.hasTrailerAeroSkirts ? 2200 : 0;
        trailerCost = trailerModel.basePriceUsd + trailerAero;
        newTrailer = {
          id: `trl-${Date.now()}`,
          modelId: options.selectedTrailerModelId,
          serialNumber: `${options.selectedTrailerModelId.toUpperCase().slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`,
          currentHubId: options.hubId,
          status: 'idle',
          odometerKm: 0,
          hasAeroSkirts: options.hasTrailerAeroSkirts || false,
          hasReeferUnit: false,
          reeferFuelCurrentLiters: 0,
          tireCompound: 'highway_eco',
          assignedTruckId: truckId,
          assignedTripId: null,
        };
      }
    }

    const totalCost = model.basePriceUsd + extraCost + trailerCost;
    const isLease = options.financingMethod === 'lease_60d';
    const cashRequired = isLease ? Math.round(totalCost * 0.20) : totalCost;

    if (state.balanceUsd < cashRequired) {
      notifyUser('Insufficient Capital', `${isLease ? '20% Lease Down Payment is' : 'Acquisition cost is'} $${cashRequired.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return false;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newTruck: TruckInstance = {
      id: truckId,
      modelId: options.modelId,
      vin: `1${options.modelId.toUpperCase().slice(0, 3)}${randomSuffix}K09${Math.floor(1000 + Math.random() * 9000)}`,
      plate: `TX-${randomSuffix}-FL`,
      currentHubId: options.hubId,
      status: 'idle',
      odometerKm: 250,
      fuelCurrentLiters: model.specs.fuelTankCapacityLiters * 0.9,
      adBlueCurrentLiters: model.specs.adBlueTankLiters * 0.9,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: null,
      activeTripId: null,
      lastServiceKm: 0,
      hasAeroPackage: options.hasAeroPackage,
      hasRetarder: options.hasRetarder,
      tireCompound: options.tireCompound,
      sleeperTier: options.sleeperTier,
      liveryColor: options.liveryColor,
      assignedTrailerId: newTrailer ? newTrailer.id : null,
      serviceDueKm: 45000,
    };

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - cashRequired;

    let newLoans = state.loans;
    const newLedgerItems: LedgerEntry[] = [];

    if (isLease) {
      const financedAmount = totalCost - cashRequired;
      const leaseInterest = 0.06; // 6% flat term financing
      const totalLeaseRepay = Math.round(financedAmount * (1 + leaseInterest));
      const dailyPayment = Math.round(totalLeaseRepay / 60);

      const leaseLoan: BankLoan = {
        id: `loan-lease-${newTruck.id}`,
        principalUsd: financedAmount,
        remainingBalanceUsd: totalLeaseRepay,
        annualInterestRate: leaseInterest,
        dailyPaymentUsd: dailyPayment,
        daysRemaining: 60,
      };
      newLoans = [...state.loans, leaseLoan];

      newLedgerItems.push({
        id: `led-down-${newTruck.id}`,
        simDay,
        simTimeFormatted: `Day ${simDay}`,
        type: 'equipment_purchase',
        description: `20% Lease Down Payment: ${model.name} (${newTruck.plate})`,
        amountUsd: -cashRequired,
        runningBalanceUsd: nextBal,
      });
    } else {
      newLedgerItems.push({
        id: `led-buy-${newTruck.id}`,
        simDay,
        simTimeFormatted: `Day ${simDay}`,
        type: 'equipment_purchase',
        description: `Acquired new ${model.name} (${newTruck.plate}) in custom specification`,
        amountUsd: -totalCost,
        runningBalanceUsd: nextBal,
      });
    }

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trucks: [...prev.trucks, newTruck],
      trailers: newTrailer ? [newTrailer, ...(prev.trailers || [])] : (prev.trailers || []),
      loans: newLoans,
      ledger: [...newLedgerItems, ...prev.ledger],
      notifications: deduplicateNotifications([
        {
          id: `notif-buy-${newTruck.id}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: isLease ? 'Commercial Truck Leased' : 'Commercial Truck Acquired',
          message: `${model.name} (${newTruck.plate}) delivered to destination depot. Ready for operation.`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const buyTrailer = (options: TrailerConfigOptions): boolean => {
    const model = TRAILER_MODELS.find((m) => m.id === options.modelId);
    if (!model) return false;

    let extraCost = 0;
    if (options.hasAeroSkirts) extraCost += 2200;
    if (options.hasReeferUnit && model.supportsReeferUnit) extraCost += 9500;
    if (options.tireCompound === 'severe_snow') extraCost += 1200;
    else if (options.tireCompound === 'all_weather') extraCost += 600;

    const totalCost = model.basePriceUsd + extraCost;
    const isLease = options.financingMethod === 'lease_60d';
    const cashRequired = isLease ? Math.round(totalCost * 0.20) : totalCost;

    if (state.balanceUsd < cashRequired) {
      notifyUser('Insufficient Capital', `${isLease ? '20% Lease Down Payment is' : 'Trailer price is'} $${cashRequired.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return false;
    }

    const serialNum = `${options.modelId.toUpperCase().slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTrailer: TrailerInstance = {
      id: `trl-${Date.now()}`,
      modelId: options.modelId,
      serialNumber: serialNum,
      currentHubId: options.hubId,
      status: 'idle',
      odometerKm: 0,
      hasAeroSkirts: options.hasAeroSkirts,
      hasReeferUnit: options.hasReeferUnit && model.supportsReeferUnit,
      reeferFuelCurrentLiters: options.hasReeferUnit && model.supportsReeferUnit ? 180 : 0,
      tireCompound: options.tireCompound,
      assignedTruckId: null,
      assignedTripId: null,
    };

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - cashRequired;

    let newLoans = state.loans;
    const newLedgerItems: LedgerEntry[] = [];

    if (isLease) {
      const financedAmount = totalCost - cashRequired;
      const leaseInterest = 0.06;
      const totalLeaseRepay = Math.round(financedAmount * (1 + leaseInterest));
      const dailyPayment = Math.round(totalLeaseRepay / 60);

      const leaseLoan: BankLoan = {
        id: `loan-lease-trl-${newTrailer.id}`,
        principalUsd: financedAmount,
        remainingBalanceUsd: totalLeaseRepay,
        annualInterestRate: leaseInterest,
        dailyPaymentUsd: dailyPayment,
        daysRemaining: 60,
      };
      newLoans = [...state.loans, leaseLoan];

      newLedgerItems.push({
        id: `led-down-${newTrailer.id}`,
        simDay,
        simTimeFormatted: `Day ${simDay}`,
        type: 'equipment_purchase',
        description: `20% Lease Down Payment: ${model.name} (${newTrailer.serialNumber})`,
        amountUsd: -cashRequired,
        runningBalanceUsd: nextBal,
      });
    } else {
      newLedgerItems.push({
        id: `led-buy-${newTrailer.id}`,
        simDay,
        simTimeFormatted: `Day ${simDay}`,
        type: 'equipment_purchase',
        description: `Acquired new ${model.name} (${newTrailer.serialNumber})`,
        amountUsd: -totalCost,
        runningBalanceUsd: nextBal,
      });
    }

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trailers: [...(prev.trailers || []), newTrailer],
      loans: newLoans,
      ledger: [...newLedgerItems, ...prev.ledger],
      notifications: deduplicateNotifications([
        {
          id: `notif-buy-trl-${newTrailer.id}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: isLease ? 'Commercial Trailer Leased' : 'Commercial Trailer Acquired',
          message: `${model.name} (${newTrailer.serialNumber}) delivered to terminal. Ready for freight assignment.`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const sellTrailer = (trailerId: string) => {
    const trailer = state.trailers.find((t) => t.id === trailerId);
    if (!trailer || trailer.status === 'en_route') return;
    const model = TRAILER_MODELS.find((m) => m.id === trailer.modelId);
    if (!model) return;

    const saleValue = Math.round(model.basePriceUsd * 0.70);
    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd + saleValue;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trailers: prev.trailers.filter((t) => t.id !== trailerId),
      trucks: prev.trucks.map((trk) => (trk.assignedTrailerId === trailerId ? { ...trk, assignedTrailerId: null } : trk)),
      ledger: [
        {
          id: `led-sell-${trailerId}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'equipment_purchase',
          description: `Liquidated trailer ${model.name} (${trailer.serialNumber})`,
          amountUsd: saleValue,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));
  };

  const assignTrailerToTruck = (truckId: string, trailerId: string | null) => {
    setState((prev) => ({
      ...prev,
      trucks: prev.trucks.map((trk) => {
        if (trk.id === truckId) return { ...trk, assignedTrailerId: trailerId };
        if (trailerId && trk.assignedTrailerId === trailerId) return { ...trk, assignedTrailerId: null };
        return trk;
      }),
      trailers: prev.trailers.map((trl) => {
        if (trl.id === trailerId) return { ...trl, assignedTruckId: truckId };
        if (trl.assignedTruckId === truckId && trl.id !== trailerId) return { ...trl, assignedTruckId: null };
        return trl;
      }),
    }));
  };

  const sellTruck = (truckId: string) => {
    const truck = state.trucks.find((t) => t.id === truckId);
    if (!truck || truck.status === 'en_route') return;
    const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
    if (!model) return;

    // Resale value based on odometer depreciation & health
    const healthAvg = (truck.subsystems.engineBlock + truck.subsystems.transmission) / 200;
    const odoDiscount = Math.max(0.35, 1.0 - (truck.odometerKm / 500000) * 0.5);
    const saleValue = Math.round(model.basePriceUsd * 0.65 * healthAvg * odoDiscount);

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd + saleValue;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trucks: prev.trucks.filter((t) => t.id !== truckId),
      trailers: prev.trailers.map((trl) => (trl.assignedTruckId === truckId ? { ...trl, assignedTruckId: null } : trl)),
      drivers: prev.drivers.map((d) => (d.assignedTruckId === truckId ? { ...d, assignedTruckId: null } : d)),
      ledger: [
        {
          id: `led-sell-${truckId}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'equipment_purchase',
          description: `Liquidated used ${model.name} (${truck.plate})`,
          amountUsd: saleValue,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));
  };

  const hireDriver = (driverData: Partial<Driver>): boolean => {
    const hiringBonus = 2500;
    if (state.balanceUsd < hiringBonus) {
      notifyUser('Insufficient Funds', 'Insufficient funds for driver onboarding and recruitment stipend ($2,500).', 'finance');
      return false;
    }

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      name: driverData.name || 'Alex Morgan',
      avatar: driverData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      experienceYears: driverData.experienceYears || 5,
      wagePerKmUsd: driverData.wagePerKmUsd || 0.44,
      dailyRetainerUsd: driverData.dailyRetainerUsd || 110,
      homeHubId: driverData.homeHubId || 'hub-chicago',
      currentHubId: driverData.homeHubId || 'hub-chicago',
      assignedTruckId: null,
      hosStatus: 'off_duty',
      continuousDriveMinutes: 0,
      dailyDriveMinutes: 0,
      currentRestMinutesRemaining: 0,
      stats: driverData.stats || {
        ecoDrivingRating: 85,
        mechanicalSympathy: 88,
        mountainCert: false,
        winterCert: true,
        hazmatCert: false,
        fatiguePercent: 0,
        totalKmDriven: 45000,
        deliveriesCompleted: 35,
        safetyScore: 95,
      },
    };

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - hiringBonus;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      drivers: [...prev.drivers, newDriver],
      ledger: [
        {
          id: `led-hire-${newDriver.id}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'driver_wages',
          description: `Driver recruitment & onboarding: ${newDriver.name}`,
          amountUsd: -hiringBonus,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-hire-${newDriver.id}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Crew Member Recruited',
          message: `${newDriver.name} inducted into company driver roster.`,
          type: 'driver',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const fireDriver = (driverId: string) => {
    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.filter((d) => d.id !== driverId),
      trucks: prev.trucks.map((t) => (t.assignedDriverId === driverId ? { ...t, assignedDriverId: null } : t)),
    }));
  };

  const trainDriver = (driverId: string, certType: 'mountain' | 'winter' | 'hazmat' | 'eco'): boolean => {
    const costMap = {
      mountain: 2800,
      winter: 3200,
      hazmat: 4500,
      eco: 1800,
    };
    const cost = costMap[certType];

    if (state.balanceUsd < cost) {
      notifyUser('Insufficient Funds', `Insufficient funds for this certification course ($${cost.toLocaleString()}).`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - cost;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      drivers: prev.drivers.map((d) => {
        if (d.id !== driverId) return d;
        const newStats = { ...d.stats };
        if (certType === 'mountain') newStats.mountainCert = true;
        if (certType === 'winter') newStats.winterCert = true;
        if (certType === 'hazmat') newStats.hazmatCert = true;
        if (certType === 'eco') newStats.ecoDrivingRating = Math.min(100, newStats.ecoDrivingRating + 12);
        return { ...d, stats: newStats };
      }),
      ledger: [
        {
          id: `led-cert-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'driver_wages',
          description: `Advanced driver accreditation course (${certType})`,
          amountUsd: -cost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));

    return true;
  };

  const upgradeHub = (hubId: string, upgradeType: 'workshop' | 'bulkFuel'): boolean => {
    const hub = state.hubs.find((h) => h.id === hubId);
    if (!hub) return false;

    let cost = 0;
    let desc = '';

    if (upgradeType === 'workshop') {
      cost = 35000;
      desc = `Expanded workshop repair bays at ${hub.name} (Tier ${hub.workshopLevel + 1})`;
    } else {
      cost = 45000;
      desc = `Installed high-capacity bulk fuel depot at ${hub.name} (100,000L)`;
    }

    if (state.balanceUsd < cost) {
      notifyUser('Insufficient Capital', `Insufficient funds for infrastructure upgrade ($${cost.toLocaleString()}).`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - cost;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      hubs: prev.hubs.map((h) => {
        if (h.id !== hubId) return h;
        if (upgradeType === 'workshop') {
          return { ...h, workshopLevel: h.workshopLevel + 1, bayCount: h.bayCount + 2 };
        } else {
          return { ...h, hasBulkFuelDepot: true, bulkFuelCapacityLiters: h.bulkFuelCapacityLiters + 60000 };
        }
      }),
      ledger: [
        {
          id: `led-hub-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'depot_upgrade',
          description: desc,
          amountUsd: -cost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));

    return true;
  };

  const refuelTruckAtHub = (truckId: string, liters: number): boolean => {
    const truck = state.trucks.find((t) => t.id === truckId);
    if (!truck || truck.status === 'en_route') return false;
    const hub = state.hubs.find((h) => h.id === truck.currentHubId);
    if (!hub) return false;
    const model = TRUCK_MODELS.find((m) => m.id === truck.modelId);
    if (!model) return false;

    const needed = model.specs.fuelTankCapacityLiters - truck.fuelCurrentLiters;
    const toPump = Math.min(needed, liters);
    if (toPump <= 0) return false;

    const fuelCost = Math.round(toPump * hub.fuelPricePerLiter);
    if (state.balanceUsd < fuelCost) {
      notifyUser('Insufficient Capital', 'Insufficient company funds to bunker fuel tanks.', 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - fuelCost;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trucks: prev.trucks.map((t) => (t.id === truckId ? { ...t, fuelCurrentLiters: t.fuelCurrentLiters + toPump } : t)),
      ledger: [
        {
          id: `led-fuel-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'fuel_expense',
          description: `Bunkered ${Math.round(toPump)}L diesel at ${hub.name} ($${hub.fuelPricePerLiter}/L)`,
          amountUsd: -fuelCost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));

    return true;
  };

  const takeLoan = (amount: number, termDays: number): boolean => {
    const interestRate = 0.07; // 7% flat term interest
    const totalRepay = amount * (1 + interestRate);
    const dailyPayment = Math.round(totalRepay / termDays);

    const newLoan: BankLoan = {
      id: `loan-${Date.now()}`,
      principalUsd: amount,
      remainingBalanceUsd: totalRepay,
      annualInterestRate: interestRate,
      dailyPaymentUsd: dailyPayment,
      daysRemaining: termDays,
    };

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd + amount;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      loans: [...prev.loans, newLoan],
      ledger: [
        {
          id: `led-loan-disb-${newLoan.id}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'loan_disbursement',
          description: `Disbursed commercial equipment credit facility ($${amount.toLocaleString()})`,
          amountUsd: amount,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));

    return true;
  };

  const repayLoan = (loanId: string, amount: number) => {
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) return;

    const repaySum = Math.min(amount, loan.remainingBalanceUsd);
    if (state.balanceUsd < repaySum) {
      notifyUser('Insufficient Capital', 'Insufficient company funds to execute loan repayment.', 'finance');
      return;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - repaySum;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      loans: prev.loans
        .map((l) => (l.id === loanId ? { ...l, remainingBalanceUsd: Math.max(0, l.remainingBalanceUsd - repaySum) } : l))
        .filter((l) => l.remainingBalanceUsd > 0),
      ledger: [
        {
          id: `led-repay-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'loan_repay',
          description: `Accelerated loan principal repayment`,
          amountUsd: -repaySum,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
    }));
  };

  const completeOnboarding = (config: OnboardingConfig) => {
    const primaryHubId = config.primaryHubId;
    const primaryHubObj = INITIAL_HUBS.find((h) => h.id === primaryHubId);
    
    // Default to connecting another hub in the same region if not specified
    let connectedLocationId = config.connectedLocationId;
    if (!connectedLocationId && primaryHubObj) {
      const fallbackHub = INITIAL_HUBS.find(h => h.region === primaryHubObj.region && h.id !== primaryHubId);
      connectedLocationId = fallbackHub ? fallbackHub.id : '';
    }

    const activeHubIds = [primaryHubId];
    const initialSpokeConnections: string[] = [];
    let updatedRoutes = INITIAL_ROUTES.map((route) => ({ ...route, isUnlocked: false }));

    const connHubObj = connectedLocationId ? INITIAL_HUBS.find((h) => h.id === connectedLocationId) : null;

    if (
      connHubObj &&
      primaryHubObj &&
      connHubObj.region === primaryHubObj.region &&
      connHubObj.id !== primaryHubId
    ) {
      activeHubIds.push(connHubObj.id);
      initialSpokeConnections.push(`${primaryHubId}:${connHubObj.id}`);
      updatedRoutes = updatedRoutes.map((r) =>
        (r.originHubId === primaryHubId && r.destinationHubId === connHubObj.id) ||
        (r.originHubId === connHubObj.id && r.destinationHubId === primaryHubId)
          ? { ...r, isUnlocked: true }
          : r
      );
    }

    const updatedHubs = INITIAL_HUBS.map((hub) => {
      const isOwned = activeHubIds.includes(hub.id);
      return {
        ...hub,
        isUnlocked: isOwned,
        isPrimaryBase: hub.id === primaryHubId,
      };
    });

    const starterTruckModel = TRUCK_MODELS.find((m) => m.id === config.starterTruckModelId) || TRUCK_MODELS[0];
    const starterTrailerModel = TRAILER_MODELS.find((m) => m.id === config.starterTrailerModelId) || TRAILER_MODELS[0];

    const starterTruck: TruckInstance = {
      id: 'trk-01',
      modelId: starterTruckModel.id,
      vin: `1${starterTruckModel.id.toUpperCase().slice(0, 3)}889K001`,
      plate: config.region === 'Europe' ? 'EU-792-HM' : 'WA-792-HM',
      currentHubId: primaryHubId,
      status: 'idle',
      odometerKm: 24000,
      fuelCurrentLiters: starterTruckModel.specs.fuelTankCapacityLiters * 0.95,
      adBlueCurrentLiters: starterTruckModel.specs.adBlueTankLiters * 0.9,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: 'drv-01',
      activeTripId: null,
      lastServiceKm: 20000,
      hasAeroPackage: true,
      hasRetarder: true,
      tireCompound: 'highway_eco',
      sleeperTier: 'standard_sleeper',
      liveryColor: config.starterLivery,
      assignedTrailerId: 'trl-01',
      serviceDueKm: 50000,
    };

    const starterTrailer: TrailerInstance = {
      id: 'trl-01',
      modelId: starterTrailerModel.id,
      serialNumber: `AH-${Math.floor(10000 + Math.random() * 90000)}`,
      currentHubId: primaryHubId,
      status: 'idle',
      odometerKm: 12000,
      hasAeroSkirts: true,
      hasReeferUnit: starterTrailerModel.supportsReeferUnit,
      reeferFuelCurrentLiters: starterTrailerModel.supportsReeferUnit ? 180 : 0,
      tireCompound: 'highway_eco',
      assignedTruckId: 'trk-01',
      assignedTripId: null,
    };

    const starterDriver: Driver = {
      id: 'drv-01',
      name: config.region === 'Europe' ? 'Klaus Lindemann' : 'Marcus Vance',
      avatar:
        config.region === 'Europe'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      experienceYears: 12,
      wagePerKmUsd: 0.46,
      dailyRetainerUsd: 115,
      homeHubId: primaryHubId,
      currentHubId: primaryHubId,
      assignedTruckId: 'trk-01',
      hosStatus: 'off_duty',
      continuousDriveMinutes: 0,
      dailyDriveMinutes: 0,
      currentRestMinutesRemaining: 0,
      stats: {
        ecoDrivingRating: 92,
        mechanicalSympathy: 94,
        mountainCert: true,
        winterCert: true,
        hazmatCert: true,
        fatiguePercent: 0,
        totalKmDriven: 110000,
        deliveriesCompleted: 85,
        safetyScore: 98,
      },
    };

    const unlockedRouteList = updatedRoutes.filter((r) => r.isUnlocked);
    const starterContracts = generateContractsForRoutes(unlockedRouteList, updatedHubs, 8);

    const primaryHub = updatedHubs.find((h) => h.id === primaryHubId);
    const connHub = connHubObj ? updatedHubs.find((h) => h.id === connHubObj.id) : null;

    setState((prev) => ({
      ...prev,
      companyName: config.companyName || prev.companyName,
      selectedRegion: config.region,
      hubs: updatedHubs,
      routes: updatedRoutes,
      ownedHubIds: activeHubIds,
      ownedRouteIds: unlockedRouteList.map((r) => r.id),
      ownedSpokeConnections: initialSpokeConnections,
      trucks: [starterTruck],
      trailers: [starterTrailer],
      drivers: [starterDriver],
      availableContracts: starterContracts,
      balanceUsd: 135000,
      playerRank: 1,
      playerXp: 0,
      rankTitle: 'Novice Carrier',
      hasCompletedOnboarding: true,
      showGuide: true,
      unlockedRegions: [config.region],
      lastMarketRefreshSimTime: prev.simTimeMinutes,
      ledger: [
        {
          id: `led-launch-${Date.now()}`,
          simDay: 1,
          simTimeFormatted: 'Day 1 08:00',
          type: 'equipment_purchase',
          description: `Enterprise incorporation & fleet mobilization at ${primaryHub?.name}`,
          amountUsd: 135000,
          runningBalanceUsd: 135000,
        },
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-launch-${Date.now()}`,
          simTimeFormatted: 'Day 1 08:00',
          title: 'Carrier Network Mobilized',
          message: connHub
            ? `Network launched with headquarters at ${primaryHub?.name} connected to ${connHub.name}.`
            : `Network launched with headquarters at ${primaryHub?.name}. Connect corridors or locations in the Marketplace to begin freight operations.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
      ]),
    }));
  };

  const skipOnboarding = () => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      showGuide: false,
    }));
  };

  const setShowGuide = (show: boolean) => {
    setState((prev) => ({ ...prev, showGuide: show }));
  };

  const buyHubConcession = (hubId: string): boolean => {
    const hub = state.hubs.find((h) => h.id === hubId);
    if (!hub) return false;
    if (hub.isUnlocked) {
      notifyUser('Concession Active', `${hub.name} is already part of your active logistics network.`, 'delivery');
      return true;
    }

    if (state.playerRank < hub.requiredRank) {
      notifyUser(
        'Rank Restriction',
        `Access restricted: Requires ${hub.rankTitle} (Company Rank ${hub.requiredRank}). Current rank: Rank ${state.playerRank} (${state.rankTitle}). Complete more deliveries to level up.`,
        'finance'
      );
      return false;
    }

    if (state.balanceUsd < hub.purchasePriceUsd) {
      notifyUser(
        'Insufficient Treasury',
        `Insufficient company treasury. Hub concession costs $${hub.purchasePriceUsd.toLocaleString()}, but available capital is $${state.balanceUsd.toLocaleString()}.`,
        'finance'
      );
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - hub.purchasePriceUsd;

    // Check which corridors now connect this hub to other owned hubs
    const currentlyOwnedHubIds = [...state.ownedHubIds, hubId];
    const newlyUnlockedRouteIds: string[] = [];

    const updatedRoutes = state.routes.map((route) => {
      if (
        (route.originHubId === hubId && currentlyOwnedHubIds.includes(route.destinationHubId)) ||
        (route.destinationHubId === hubId && currentlyOwnedHubIds.includes(route.originHubId))
      ) {
        newlyUnlockedRouteIds.push(route.id);
        return { ...route, isUnlocked: true };
      }
      return route;
    });

    const updatedHubs = state.hubs.map((h) => (h.id === hubId ? { ...h, isUnlocked: true } : h));
    const allUnlockedRoutes = updatedRoutes.filter((r) => r.isUnlocked);
    const newContracts = generateContractsForRoutes(allUnlockedRoutes, updatedHubs, 5);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      hubs: updatedHubs,
      routes: updatedRoutes,
      ownedHubIds: currentlyOwnedHubIds,
      ownedRouteIds: Array.from(new Set([...prev.ownedRouteIds, ...newlyUnlockedRouteIds])),
      availableContracts: [...prev.availableContracts, ...newContracts],
      ledger: [
        {
          id: `led-hub-buy-${hubId}-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'depot_upgrade',
          description: `Acquired commercial logistics concession: ${hub.name}`,
          amountUsd: -hub.purchasePriceUsd,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-hub-buy-${hubId}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '⭐ New Hub Concession Acquired',
          message: `${hub.name} terminal acquired! ${newlyUnlockedRouteIds.length} trade corridors opened with new freight consignments.`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const buyRouteLicense = (routeId: string): boolean => {
    const route = state.routes.find((r) => r.id === routeId);
    if (!route) return false;
    if (route.isUnlocked) {
      notifyUser('Corridor Active', `${route.name} is already licensed in your active corridor network.`, 'delivery');
      return true;
    }

    const originHub = state.hubs.find((h) => h.id === route.originHubId);
    const destHub = state.hubs.find((h) => h.id === route.destinationHubId);

    if (!originHub?.isUnlocked || !destHub?.isUnlocked) {
      notifyUser(
        'Terminal Concession Required',
        `Prerequisite unfulfilled: You must own concessions for both ${originHub?.name || 'Origin'} and ${destHub?.name || 'Destination'} before operating this corridor.`,
        'finance'
      );
      return false;
    }

    if (state.playerRank < route.requiredRank) {
      notifyUser(
        'Rank Restriction',
        `Requires Rank ${route.requiredRank} to license this commercial freight corridor. Current rank: Rank ${state.playerRank}.`,
        'finance'
      );
      return false;
    }

    if (state.balanceUsd < route.licenseFeeUsd) {
      notifyUser(
        'Insufficient Capital',
        `Insufficient capital to purchase corridor operating license ($${route.licenseFeeUsd.toLocaleString()}).`,
        'finance'
      );
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - route.licenseFeeUsd;

    // Unlock both forward and reverse corridor
    const updatedRoutes = state.routes.map((r) => {
      if (
        r.id === routeId ||
        (r.originHubId === route.destinationHubId && r.destinationHubId === route.originHubId)
      ) {
        return { ...r, isUnlocked: true };
      }
      return r;
    });

    const newlyActiveRoutes = updatedRoutes.filter(
      (r) =>
        (r.originHubId === route.originHubId && r.destinationHubId === route.destinationHubId) ||
        (r.originHubId === route.destinationHubId && r.destinationHubId === route.originHubId)
    );

    const freshLaneContracts = generateContractsForRoutes(newlyActiveRoutes, state.hubs, 4);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      routes: updatedRoutes,
      ownedRouteIds: Array.from(new Set([...prev.ownedRouteIds, route.id, ...newlyActiveRoutes.map((r) => r.id)])),
      availableContracts: [...prev.availableContracts, ...freshLaneContracts],
      ledger: [
        {
          id: `led-route-buy-${routeId}-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'depot_upgrade',
          description: `Acquired operating license for ${route.name}`,
          amountUsd: -route.licenseFeeUsd,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-route-buy-${routeId}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Corridor Licensed',
          message: `${route.name} (${route.distanceKm} km) is now open for scheduled freight dispatches.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const buySpokeLocationRoute = (hubId: string, spokeLocationId: string): boolean => {
    const hub = state.hubs.find((h) => h.id === hubId);
    const spoke = state.hubs.find((h) => h.id === spokeLocationId);
    if (!hub || !spoke) return false;

    // 1. Same-region rule
    if (hub.region !== spoke.region) {
      notifyUser(
        'Region Mismatch',
        `Routes must connect locations within the same region. ${spoke.name} is in ${spoke.region}, while ${hub.name} is in ${hub.region}.`,
        'maintenance'
      );
      return false;
    }

    // 2. Region unlocked rule
    const isRegionUnlocked = state.hubs.some((h) => h.isUnlocked && h.region === spoke.region);
    if (!isRegionUnlocked) {
      notifyUser(
        'Region Locked',
        `The ${spoke.region} region is not yet unlocked. You must unlock an operating hub in this region first.`,
        'finance'
      );
      return false;
    }

    // 3. Base hub must be unlocked
    if (!hub.isUnlocked) {
      notifyUser('Terminal Locked', `Your base hub (${hub.name}) must be unlocked first.`, 'finance');
      return false;
    }

    // 4. Cannot connect to the SAME hub twice (can connect to many hubs)
    const connectionKey = `${hubId}:${spokeLocationId}`;
    if (state.ownedSpokeConnections && state.ownedSpokeConnections.includes(connectionKey)) {
      notifyUser('Already Connected', `${spoke.name} is already connected to ${hub.name}. A location cannot be connected to the same hub twice.`, 'delivery');
      return false;
    }

    // 5. Payment calculation & treasury check
    const dx = hub.coord.x - spoke.coord.x;
    const dy = hub.coord.y - spoke.coord.y;
    const dist = Math.max(120, Math.round(Math.sqrt(dx * dx + dy * dy) * 3.2));
    const cost = spoke.purchasePriceUsd || Math.max(16000, Math.round(dist * 16));

    if (state.balanceUsd < cost) {
      notifyUser('Insufficient Treasury', `Connection fee requires $${cost.toLocaleString()}, but available company treasury has $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - cost;

    // Check if routes already exist or create forward and reverse corridors
    const forwardRouteId = `route-${hub.code.toLowerCase()}-${spoke.code.toLowerCase()}`;
    const returnRouteId = `route-${spoke.code.toLowerCase()}-${hub.code.toLowerCase()}`;

    let updatedRoutes = state.routes.map((r) => {
      if (
        (r.originHubId === hubId && r.destinationHubId === spokeLocationId) ||
        (r.originHubId === spokeLocationId && r.destinationHubId === hubId)
      ) {
        return { ...r, isUnlocked: true };
      }
      return r;
    });

    const hasForward = updatedRoutes.some((r) => r.originHubId === hubId && r.destinationHubId === spokeLocationId);
    const hasReturn = updatedRoutes.some((r) => r.originHubId === spokeLocationId && r.destinationHubId === hubId);

    const routesToAdd: RouteCorridor[] = [];
    if (!hasForward) {
      routesToAdd.push({
        id: forwardRouteId,
        originHubId: hubId,
        destinationHubId: spokeLocationId,
        name: `${hub.name.split(' ')[0]} - ${spoke.name.split(' ')[0]} Route`,
        distanceKm: dist,
        roadType: 'Interstate Highway',
        baseSpeedLimitKmh: hub.region === 'Europe' ? 90 : 105,
        avgElevationGradePct: 1.0,
        maxGradePct: 4.5,
        tollCostUsd: Math.round(dist * 0.05),
        waypoints: [
          { name: hub.name, coord: hub.coord, elevationMeters: 50 },
          { name: spoke.name, coord: spoke.coord, elevationMeters: 40 },
        ],
        hazardRisk: 0.12,
        isUnlocked: true,
        licenseFeeUsd: cost,
        requiredRank: 1,
        trafficRateScore: spoke.trafficDemandScore,
      });
    }
    if (!hasReturn) {
      routesToAdd.push({
        id: returnRouteId,
        originHubId: spokeLocationId,
        destinationHubId: hubId,
        name: `${spoke.name.split(' ')[0]} - ${hub.name.split(' ')[0]} Route (Return)`,
        distanceKm: dist,
        roadType: 'Interstate Highway',
        baseSpeedLimitKmh: hub.region === 'Europe' ? 90 : 105,
        avgElevationGradePct: -1.0,
        maxGradePct: 4.5,
        tollCostUsd: Math.round(dist * 0.05),
        waypoints: [
          { name: spoke.name, coord: spoke.coord, elevationMeters: 40 },
          { name: hub.name, coord: hub.coord, elevationMeters: 50 },
        ],
        hazardRisk: 0.12,
        isUnlocked: true,
        licenseFeeUsd: cost,
        requiredRank: 1,
        trafficRateScore: spoke.trafficDemandScore,
      });
    }

    updatedRoutes = [...updatedRoutes, ...routesToAdd];
    const updatedHubs = state.hubs.map((h) => (h.id === spokeLocationId ? { ...h, isUnlocked: true } : h));

    const newlyActiveRoutes = updatedRoutes.filter(
      (r) =>
        (r.originHubId === hubId && r.destinationHubId === spokeLocationId) ||
        (r.originHubId === spokeLocationId && r.destinationHubId === hubId)
    );
    const newContracts = generateContractsForRoutes(newlyActiveRoutes, updatedHubs, 4);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      hubs: updatedHubs,
      routes: updatedRoutes,
      ownedSpokeConnections: [...(prev.ownedSpokeConnections || []), connectionKey],
      ownedRouteIds: Array.from(new Set([...prev.ownedRouteIds, ...newlyActiveRoutes.map((r) => r.id)])),
      availableContracts: [...newContracts, ...prev.availableContracts].slice(0, 35),
      ledger: [
        {
          id: `led-spoke-${connectionKey}-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'equipment_purchase',
          description: `Acquired delivery route & terminal rights: ${spoke.name} connected to ${hub.name}`,
          amountUsd: -cost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: [
        {
          id: `notif-spoke-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Location Route Connected',
          message: `${spoke.name} connected to ${hub.name} terminal network. Paid $${cost.toLocaleString()} connection fee. Freight contracts now available.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ],
    }));

    notifyUser('Route Connected', `${spoke.name} is now connected to ${hub.name} ($${cost.toLocaleString()} fee paid).`, 'delivery');
    return true;
  };

  const claimAchievementReward = (achievementId: string, cashReward: number, xpReward: number, currentValue: number, targetValue: number): boolean => {
    if (currentValue < targetValue) {
      notifyUser('Milestone Locked', 'You have not yet reached the required target for this reward tier.', 'maintenance');
      return false;
    }
    if (state.claimedAchievementIds && state.claimedAchievementIds.includes(achievementId)) {
      return false;
    }
    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd + cashReward;
    const nextXp = state.playerXp + xpReward;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      playerXp: nextXp,
      claimedAchievementIds: [...(prev.claimedAchievementIds || []), achievementId],
      ledger: [
        {
          id: `led-ach-${achievementId}-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'freight_revenue',
          description: `Achievement milestone reward: $${cashReward.toLocaleString()} & ${xpReward} XP`,
          amountUsd: cashReward,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: [
        {
          id: `notif-ach-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Achievement Reward Claimed',
          message: `Successfully claimed reward! Received $${cashReward.toLocaleString()} and ${xpReward} XP.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ],
    }));

    notifyUser('Reward Claimed', `Awarded $${cashReward.toLocaleString()} and ${xpReward} XP!`, 'delivery');
    return true;
  };

  const unlockRegion = (region: GeoRegion): boolean => {
    if (state.unlockedRegions && state.unlockedRegions.includes(region)) {
      notifyUser('Region Active', `${region} is already unlocked in your corporate network.`, 'delivery');
      return true;
    }

    const requiredRank = 4;
    const unlockPriceUsd = 450000;

    if (state.playerRank < requiredRank) {
      notifyUser(
        'Rank Restriction',
        `Unlocking intercontinental expansion to ${region} requires Rank 4 (Logistics Enterprise). Current rank: Rank ${state.playerRank}.`,
        'finance'
      );
      return false;
    }

    if (state.balanceUsd < unlockPriceUsd) {
      notifyUser(
        'Insufficient Treasury',
        `Intercontinental concession fee for ${region} requires $${unlockPriceUsd.toLocaleString()}, but available capital is $${state.balanceUsd.toLocaleString()}.`,
        'finance'
      );
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - unlockPriceUsd;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      unlockedRegions: [...(prev.unlockedRegions || [prev.selectedRegion]), region],
      ledger: [
        {
          id: `led-region-${region}-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'depot_upgrade',
          description: `Acquired intercontinental operating concession & gateway rights for ${region}`,
          amountUsd: -unlockPriceUsd,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-region-${region}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: `🌍 Intercontinental Expansion: ${region} Unlocked`,
          message: `${region} network access successfully acquired! Terminal concessions and trade routes are now available for licensing.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    notifyUser('Region Unlocked', `${region} intercontinental network is now unlocked!`, 'delivery');
    return true;
  };

  const ferryTruck = (truckId: string, destinationHubId: string): boolean => {
    const truck = state.trucks.find((t) => t.id === truckId);
    if (!truck || truck.status !== 'idle') {
      notifyUser('Repositioning Notice', 'Only idle trucks stationed in a terminal yard can be repositioned.', 'maintenance');
      return false;
    }

    if (truck.currentHubId === destinationHubId) {
      notifyUser('Repositioning Notice', 'Truck is already stationed at this terminal.', 'delivery');
      return true;
    }

    const destHub = state.hubs.find((h) => h.id === destinationHubId);
    if (!destHub || !destHub.isUnlocked) {
      notifyUser('Terminal Locked', 'Repositioning destination must be an unlocked terminal in your network.', 'finance');
      return false;
    }

    const curHub = state.hubs.find((h) => h.id === truck.currentHubId);
    const ferryCost = 650;

    if (state.balanceUsd < ferryCost) {
      notifyUser('Insufficient Treasury', `Insufficient funds for deadhead ferry driver & fuel fee ($${ferryCost}).`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - ferryCost;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      trucks: prev.trucks.map((t) => (t.id === truckId ? { ...t, currentHubId: destinationHubId } : t)),
      trailers: prev.trailers.map((tr) => (tr.assignedTruckId === truckId ? { ...tr, currentHubId: destinationHubId } : tr)),
      drivers: prev.drivers.map((d) => (d.assignedTruckId === truckId ? { ...d, currentHubId: destinationHubId } : d)),
      ledger: [
        {
          id: `led-ferry-${truckId}-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'toll_expense',
          description: `Deadhead repositioning fee: ${truck.plate} from ${curHub?.name.split(' ')[0] || 'Origin'} to ${destHub.name.split(' ')[0]}`,
          amountUsd: -ferryCost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-ferry-${truckId}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Truck Repositioned',
          message: `${truck.plate} successfully ferried to ${destHub.name} yard and is ready for dispatch.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const connectRouteBetweenHubs = (hubAId: string, hubBId: string): boolean => {
    if (hubAId === hubBId) {
      notifyUser('Routing Notice', 'Origin and destination hubs must be distinct.', 'maintenance');
      return false;
    }
    const hubA = state.hubs.find((h) => h.id === hubAId);
    const hubB = state.hubs.find((h) => h.id === hubBId);
    if (!hubA || !hubB) return false;

    // Both hubs must be in the same region
    if (hubA.region !== hubB.region) {
      notifyUser(
        'Region Mismatch',
        `Routes must connect hubs within the same region. ${hubA.name} is in ${hubA.region}, while ${hubB.name} is in ${hubB.region}.`,
        'maintenance'
      );
      return false;
    }

    if (!hubA.isUnlocked || !hubB.isUnlocked) {
      notifyUser(
        'Terminal Concession Required',
        `Both terminals (${hubA.name} and ${hubB.name}) must be unlocked in your network before connecting a route between them.`,
        'finance'
      );
      return false;
    }

    // Check if route already exists in state
    const existingRoute = state.routes.find(
      (r) =>
        (r.originHubId === hubAId && r.destinationHubId === hubBId) ||
        (r.originHubId === hubBId && r.destinationHubId === hubAId)
    );

    if (existingRoute) {
      return buyRouteLicense(existingRoute.id);
    }

    // Dynamically calculate corridor properties if no static route exists
    const dx = hubA.coord.x - hubB.coord.x;
    const dy = hubA.coord.y - hubB.coord.y;
    const estDistance = Math.max(300, Math.round(Math.sqrt(dx * dx + dy * dy) * 3.5));
    const licenseFeeUsd = Math.round(estDistance * 18);
    const requiredRank = Math.min(5, Math.max(1, Math.floor(estDistance / 700) + 1));

    if (state.playerRank < requiredRank) {
      notifyUser(
        'Rank Restriction',
        `Connecting corridor between ${hubA.code} and ${hubB.code} requires Rank ${requiredRank}. Current: Rank ${state.playerRank} (${state.rankTitle}).`,
        'finance'
      );
      return false;
    }

    if (state.balanceUsd < licenseFeeUsd) {
      notifyUser(
        'Insufficient Treasury',
        `Capital required: $${licenseFeeUsd.toLocaleString()}, but company treasury has $${state.balanceUsd.toLocaleString()}.`,
        'finance'
      );
      return false;
    }

    const forwardRouteId = `route-${hubA.code.toLowerCase()}-${hubB.code.toLowerCase()}`;
    const reverseRouteId = `route-${hubB.code.toLowerCase()}-${hubA.code.toLowerCase()}`;
    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - licenseFeeUsd;

    const waypointsForward = [
      { name: hubA.name, coord: hubA.coord, elevationMeters: 50 },
      { name: `${hubA.name} / ${hubB.name} Midpoint`, coord: { x: (hubA.coord.x + hubB.coord.x) / 2, y: (hubA.coord.y + hubB.coord.y) / 2 }, elevationMeters: 100 },
      { name: hubB.name, coord: hubB.coord, elevationMeters: 50 },
    ];
    const waypointsReverse = [
      { name: hubB.name, coord: hubB.coord, elevationMeters: 50 },
      { name: `${hubB.name} / ${hubA.name} Midpoint`, coord: { x: (hubB.coord.x + hubA.coord.x) / 2, y: (hubB.coord.y + hubA.coord.y) / 2 }, elevationMeters: 100 },
      { name: hubA.name, coord: hubA.coord, elevationMeters: 50 },
    ];

    const newForwardRoute: RouteCorridor = {
      id: forwardRouteId,
      originHubId: hubAId,
      destinationHubId: hubBId,
      name: `${hubA.name.split(' ')[0]} - ${hubB.name.split(' ')[0]} Commercial Connector`,
      distanceKm: estDistance,
      roadType: 'Interstate Highway',
      baseSpeedLimitKmh: hubA.region === 'Europe' ? 90 : 105,
      avgElevationGradePct: 1.2,
      maxGradePct: 4.5,
      tollCostUsd: Math.round(estDistance * 0.08),
      waypoints: waypointsForward,
      hazardRisk: 0.15,
      isUnlocked: true,
      licenseFeeUsd,
      requiredRank,
      trafficRateScore: Math.round((hubA.trafficDemandScore + hubB.trafficDemandScore) / 2),
    };

    const newReverseRoute: RouteCorridor = {
      id: reverseRouteId,
      originHubId: hubBId,
      destinationHubId: hubAId,
      name: `${hubB.name.split(' ')[0]} - ${hubA.name.split(' ')[0]} Commercial Connector (Return)`,
      distanceKm: estDistance,
      roadType: 'Interstate Highway',
      baseSpeedLimitKmh: hubA.region === 'Europe' ? 90 : 105,
      avgElevationGradePct: -1.2,
      maxGradePct: 4.5,
      tollCostUsd: Math.round(estDistance * 0.08),
      waypoints: waypointsReverse,
      hazardRisk: 0.15,
      isUnlocked: true,
      licenseFeeUsd,
      requiredRank,
      trafficRateScore: Math.round((hubA.trafficDemandScore + hubB.trafficDemandScore) / 2),
    };

    const updatedRoutes = [...state.routes, newForwardRoute, newReverseRoute];
    const newContracts = generateContractsForRoutes([newForwardRoute, newReverseRoute], state.hubs, 4);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      routes: updatedRoutes,
      ownedRouteIds: Array.from(new Set([...prev.ownedRouteIds, forwardRouteId, reverseRouteId])),
      availableContracts: [...prev.availableContracts, ...newContracts],
      ledger: [
        {
          id: `led-route-custom-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'depot_upgrade',
          description: `Commissioned custom corridor: ${hubA.name.split(' ')[0]} ⇄ ${hubB.name.split(' ')[0]}`,
          amountUsd: -licenseFeeUsd,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-custom-route-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'New Commercial Route Connected',
          message: `Corridor commissioned between ${hubA.name} and ${hubB.name} (${estDistance} km). Spot freight generated.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const restartOnboarding = () => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: false,
      showGuide: false,
    }));
  };

  const dismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const resetGame = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setState(createInitialState());
    } catch (e) {
      console.error('Reset error', e);
    }
  };

  const refreshAvailableContracts = (paidByPlayer: boolean = false): boolean => {
    const unlockedRoutes = state.routes.filter(
      (r) => r.isUnlocked && state.hubs.find((h) => h.id === r.originHubId)?.region === state.selectedRegion
    );

    if (unlockedRoutes.length === 0) {
      notifyUser('No Active Corridors', 'No trade corridors are currently unlocked in this region to generate freight contracts.', 'delivery');
      return false;
    }

    const brokerFee = 1500;
    if (paidByPlayer && state.balanceUsd < brokerFee) {
      notifyUser('Insufficient Treasury', `Expedited dispatch board refresh requires $${brokerFee.toLocaleString()} in brokerage fees. Available: $${state.balanceUsd.toLocaleString()}`, 'finance');
      return false;
    }

    const freshContracts = generateContractsForRoutes(unlockedRoutes, state.hubs, 10);
    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = paidByPlayer ? state.balanceUsd - brokerFee : state.balanceUsd;

    setState((prev) => {
      const newLedger = paidByPlayer
        ? [
            {
              id: `led-refresh-${Date.now()}`,
              simDay,
              simTimeFormatted: `Day ${simDay}`,
              type: 'broker_fee' as const,
              description: 'Expedited Commercial Freight Board Refresh Brokerage Fee',
              amountUsd: -brokerFee,
              runningBalanceUsd: nextBal,
            },
            ...prev.ledger,
          ]
        : prev.ledger;

      return {
        ...prev,
        balanceUsd: nextBal,
        availableContracts: freshContracts,
        ledger: newLedger,
        lastMarketRefreshSimTime: prev.simTimeMinutes,
        notifications: deduplicateNotifications([
          {
            id: `notif-refresh-${Date.now()}`,
            simTimeFormatted: `Day ${simDay}`,
            title: 'Freight Exchange Board Refreshed',
            message: paidByPlayer
              ? `Expedited brokerage dispatch board refreshed with ${freshContracts.length} newly tendered commercial consignments ($${brokerFee.toLocaleString()} brokerage fee paid).`
              : `Freight dispatch board replenished with ${freshContracts.length} available consignments.`,
            type: 'delivery',
            timestamp: Date.now(),
          },
          ...prev.notifications,
        ]),
      };
    });

    return true;
  };

  return (
    <GameContext.Provider
      value={{
        state,
        setSimSpeed,
        setSelectedRegion,
        dispatchTrip,
        serviceTruck,
        buyTruck,
        buyTruckWithConfig,
        sellTruck,
        buyTrailer,
        sellTrailer,
        assignTrailerToTruck,
        hireDriver,
        fireDriver,
        trainDriver,
        upgradeHub,
        refuelTruckAtHub,
        takeLoan,
        repayLoan,
        dismissNotification,
        resetGame,
        completeOnboarding,
        skipOnboarding,
        setShowGuide,
        buyHubConcession,
        buyRouteLicense,
        connectRouteBetweenHubs,
        ferryTruck,
        restartOnboarding,
        refreshAvailableContracts,
        buySpokeLocationRoute,
        claimAchievementReward,
        unlockRegion,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

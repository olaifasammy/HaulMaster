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
} from '../constants/gameData';
import { computePhysicsStep } from '../utils/physicsEngine';
import { getLocalWeather } from '../utils/weatherEngine';

const STORAGE_KEY = 'haulmaster_game_state_v1';

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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const createInitialState = (): GameState => {
  // Initial 2 trucks
  const initialTrucks: TruckInstance[] = [
    {
      id: 'trk-01',
      modelId: 'titan-540',
      vin: '1TTN982H7K002914',
      plate: 'WA-792-TL',
      currentHubId: 'hub-seattle',
      status: 'idle',
      odometerKm: 34200,
      fuelCurrentLiters: 580,
      adBlueCurrentLiters: 65,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: 'drv-01',
      activeTripId: null,
      lastServiceKm: 30000,
      hasAeroPackage: true,
      hasRetarder: true,
      tireCompound: 'highway_eco',
      sleeperTier: 'standard_sleeper',
      liveryColor: 'obsidian_slate',
      assignedTrailerId: 'trl-01',
      serviceDueKm: 50000,
    },
    {
      id: 'trk-02',
      modelId: 'strada-460',
      vin: '4STR460E8M110482',
      plate: 'IL-415-MX',
      currentHubId: 'hub-chicago',
      status: 'idle',
      odometerKm: 18400,
      fuelCurrentLiters: 480,
      adBlueCurrentLiters: 55,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: 'drv-02',
      activeTripId: null,
      lastServiceKm: 15000,
      hasAeroPackage: true,
      hasRetarder: true,
      tireCompound: 'all_weather',
      sleeperTier: 'deluxe_suite',
      liveryColor: 'continental_emerald',
      assignedTrailerId: 'trl-02',
      serviceDueKm: 40000,
    },
  ];

  return {
    companyName: 'Apex Continental Freight',
    balanceUsd: 145000,
    simTimeMinutes: 480, // Day 1, 08:00 AM
    simSpeed: 1,
    selectedRegion: 'North America',
    hubs: INITIAL_HUBS,
    routes: INITIAL_ROUTES,
    trucks: initialTrucks,
    trailers: INITIAL_TRAILERS,
    drivers: INITIAL_DRIVERS,
    availableContracts: INITIAL_CONTRACTS,
    activeTrips: [],
    ledger: [
      {
        id: 'led-init',
        simDay: 1,
        simTimeFormatted: 'Day 1 08:00',
        type: 'equipment_purchase',
        description: 'Starting equity capitalization and fleet acquisition',
        amountUsd: 145000,
        runningBalanceUsd: 145000,
      },
    ],
    loans: [],
    notifications: [
      {
        id: 'notif-welcome',
        simTimeFormatted: 'Day 1 08:00',
        title: 'Operations Online',
        message: 'Logistics command center initialized. 2 heavy trucks and trailers stationed at Seattle and Chicago ready for dispatch.',
        type: 'delivery',
        timestamp: Date.now(),
      },
    ],
    totalCargoDeliveredTons: 0,
    totalFuelBurnedLiters: 0,
    totalKilometersDriven: 0,
    ratingScore: 4.8,
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

            // Restock fresh available contracts
            if (prevState.availableContracts.length < 8) {
              const randomHubA = updatedHubs[Math.floor(Math.random() * updatedHubs.length)];
              const randomHubB = updatedHubs.find((h) => h.id !== randomHubA.id && h.region === randomHubA.region) || updatedHubs[0];
              const cargoTitles = [
                'Pharmaceutical Cold-Chain Vaccines',
                'High-Precision CNC Lathes',
                'Aircraft Jet Engine Components',
                'Electronics Display Panels',
                'Organic Citrus & Avocado Produce',
                'Automotive Transmission Assemblies',
              ];
              const randomTitle = cargoTitles[Math.floor(Math.random() * cargoTitles.length)];
              const isCold = randomTitle.includes('Cold-Chain') || randomTitle.includes('Produce');
              const weight = Number((10 + Math.random() * 18).toFixed(1));
              const distEst = 1200;
              const payout = Math.round(distEst * (3.8 + Math.random() * 2.2));

              const generatedContract: CargoContract = {
                id: `cnt-${newSimMinutes}-${Math.random().toString(36).substring(2, 6)}`,
                title: randomTitle,
                originHubId: randomHubA.id,
                destinationHubId: randomHubB.id,
                category: isCold ? 'Refrigerated Food' : 'Heavy Machinery',
                weightTons: weight,
                payoutUsd: payout,
                bonusOnTimeUsd: Math.round(payout * 0.15),
                penaltyLateUsd: Math.round(payout * 0.3),
                deadlineMinutes: Math.round((distEst / 85) * 60 * 1.5),
                temperatureControlled: isCold,
                isHazardous: false,
              };
              prevState = {
                ...prevState,
                availableContracts: [...prevState.availableContracts, generatedContract],
                hubs: updatedHubs,
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

            newLedgerEntries.push({
              id: `led-deliv-${finished.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              simDay: currentDay,
              simTimeFormatted: timeFormatted,
              type: 'freight_revenue',
              description: `Delivered: ${finished.contract.title} (${finished.contract.weightTons}t) to ${destHub?.name || 'Destination'}${isOnTime ? ' (On-Time Bonus)' : ' (Late Penalty)'}`,
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

          return {
            ...prevState,
            balanceUsd: currentBalance,
            simTimeMinutes: newSimMinutes,
            activeTrips: remainingTrips,
            trucks: updatedTrucks,
            trailers: updatedTrailers,
            drivers: updatedDrivers,
            loans: updatedLoans,
            ledger: [...newLedgerEntries, ...prevState.ledger].slice(0, 150),
            notifications: uniqueNotifications.slice(0, 40),
            totalCargoDeliveredTons: updatedCargoTons,
            totalFuelBurnedLiters: updatedFuelBurned,
            totalKilometersDriven: updatedKmDriven,
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
        alert('Selected trailer is currently en route or unavailable.');
        return false;
      }
    }

    // Check truck fuel capacity & range
    if (truck.fuelCurrentLiters < 100) {
      alert(`Truck ${truck.plate} has low fuel (${Math.round(truck.fuelCurrentLiters)}L). Please refuel at hub depot before departure.`);
      return false;
    }

    // Check hazardous cert
    if (contract.isHazardous && !driver.stats.hazmatCert) {
      alert(`Driver ${driver.name} lacks Hazardous Materials (ADR/HAZMAT) certification required for this cargo.`);
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
        alert('Insufficient company capital for this maintenance procedure.');
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
      alert(`Insufficient funds. Price is $${totalCost.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}. Consider taking an equipment loan.`);
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

    const totalCost = model.basePriceUsd + extraCost;
    const isLease = options.financingMethod === 'lease_60d';
    const cashRequired = isLease ? Math.round(totalCost * 0.20) : totalCost;

    if (state.balanceUsd < cashRequired) {
      alert(`Insufficient funds. ${isLease ? '20% Lease Down Payment is' : 'Acquisition cost is'} $${cashRequired.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}.`);
      return false;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newTruck: TruckInstance = {
      id: `trk-${Date.now()}`,
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
      assignedTrailerId: null,
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
      alert(`Insufficient funds. ${isLease ? '20% Lease Down Payment is' : 'Trailer price is'} $${cashRequired.toLocaleString()}, but treasury holds $${state.balanceUsd.toLocaleString()}.`);
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
      alert('Insufficient funds for driver onboarding and recruitment stipend ($2,500).');
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
      alert(`Insufficient funds for this certification course ($${cost.toLocaleString()}).`);
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
      alert(`Insufficient funds for infrastructure upgrade ($${cost.toLocaleString()}).`);
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
      alert('Insufficient funds to fill fuel tanks.');
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
      alert('Insufficient funds to execute loan repayment.');
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

  const dismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset your fleet and company progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setState(createInitialState());
    }
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

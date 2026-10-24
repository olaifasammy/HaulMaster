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
  GoldMarketState,
  CommercialInsurancePolicy,
  MacroWorldEvent,
  FleetIncidentRecord,
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
import { processAiFleetMaintenance } from '../services/aiMaintenanceService';
import {
  saveToPhoneDb,
  loadFromPhoneDb,
  clearPhoneDb,
  requestPersistentStorage,
} from '../db/phoneMemoryDb';

const STORAGE_KEY = 'haulmaster_game_state_v4';

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

export const getCommercialPayoutMultiplier = (truckId: string, trailerId: string | null, trucks: TruckInstance[]): number => {
  const haulingTruck = trucks.find(t => t.id === truckId);
  const haulingModel = TRUCK_MODELS.find(m => m.id === haulingTruck?.modelId);
  const hpBonus = haulingModel ? Math.max(1.0, 1.0 + (haulingModel.specs.horsepower - 400) * 0.0005) : 1.0;
  const trailerBonus = trailerId ? 1.25 : 1.0;
  return hpBonus * trailerBonus;
};

export const generateContractsForRoutes = (
  unlockedRoutes: RouteCorridor[],
  hubs: Hub[],
  count: number = 20,
  ownedTrucks?: TruckInstance[]
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

  // Prioritize routes originating from hubs where player trucks are parked
  const truckHubIds = new Set(ownedTrucks?.map(t => t.currentHubId) || []);
  const prioritizedRoutes = [...unlockedRoutes].sort((a, b) => {
    const aHasTruck = truckHubIds.has(a.originHubId) ? 1 : 0;
    const bHasTruck = truckHubIds.has(b.originHubId) ? 1 : 0;
    return bHasTruck - aHasTruck;
  });

  const contracts: CargoContract[] = [];
  const targetCount = Math.max(count, prioritizedRoutes.length * 2);
  for (let i = 0; i < targetCount; i++) {
    const route = prioritizedRoutes[i % prioritizedRoutes.length];
    const originHub = hubs.find((h) => h.id === route.originHubId);
    const destHub = hubs.find((h) => h.id === route.destinationHubId);
    if (!originHub || !destHub) continue;

    const shipper = WorldCompanyRepository.getRandomForRegion(originHub.region);
    const template = cargoCatalog[(i + Math.floor(Math.random() * cargoCatalog.length)) % cargoCatalog.length];
    const weightTons = Number((10 + Math.random() * 18).toFixed(1));
    const dist = route.distanceKm;
    const basePayout = Math.round(dist * template.rate * (0.95 + Math.random() * 0.3) * (shipper.rating / 90));

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
  setSimSpeed: (speed: 0 | 1) => void;
  setSelectedRegion: (region: GeoRegion) => void;
  dispatchTrip: (contractId: string, truckId: string, driverId: string, routeId: string, trailerId?: string | null) => boolean;
  serviceTruck: (truckId: string, serviceTier: 'A' | 'B' | 'Overhaul' | 'ReplaceTires') => void;
  changeTruckTireCompound: (truckId: string, compound: 'highway_eco' | 'all_weather' | 'severe_snow') => boolean;
  buyTruck: (modelId: TruckModelId, hubId: string, aeroPackage: boolean) => boolean;
  buyTruckWithConfig: (options: TruckConfigOptions) => boolean;
  sellTruck: (truckId: string) => void;
  buyTrailer: (options: TrailerConfigOptions) => boolean;
  sellTrailer: (trailerId: string) => void;
  assignTrailerToTruck: (truckId: string, trailerId: string | null) => void;
  hireDriver: (driverData: Partial<Driver>) => boolean;
  fireDriver: (driverId: string) => void;
  trainDriver: (driverId: string, certType: 'mountain' | 'winter' | 'hazmat' | 'eco') => boolean;
  renewDriverContract: (driverId: string) => boolean;
  upgradeHub: (hubId: string, upgradeType: 'workshop' | 'bulkFuel') => boolean;
  refuelTruckAtHub: (truckId: string, liters: number) => boolean;
  transferFuelBetweenHubs: (sourceHubId: string, destHubId: string, liters: number) => boolean;
  takeLoan: (amount: number, termDays: number) => boolean;
  repayLoan: (loanId: string, amount: number) => void;
  claimGrant: (amount: number, description: string, grantId?: string) => void;
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
  dismissOfflineProgress: () => void;
  notifyUser: (title: string, message: string, type?: GameEventNotification['type']) => void;
  flushToDb: () => Promise<void>;
  restoreState: (importedState: GameState) => void;
  lastSavedTimestamp: number | null;
  isDbSaving: boolean;
  repairSubsystem: (
    truckId: string,
    componentKey: 'engine' | 'turbo' | 'transmission' | 'clutch' | 'brakes' | 'cooling' | 'suspension' | 'emissions' | 'steerTires' | 'driveTires'
  ) => boolean;
  clearDTCs: (truckId: string) => void;
  activateAiDispatcher: (tier: '7d' | '1m' | 'auto', useGold?: boolean, allowExtension?: boolean) => boolean;
  activateAiFleetMaintenance: (tier: '7d' | '1m' | 'auto', useGold?: boolean, allowExtension?: boolean) => boolean;
  activateAiSuite: (options: { planTier: '7d' | '1m' | 'auto' | 'year'; includeMaintenance: boolean; includeOfflineDispatch: boolean; useGold: boolean; autoRenew: boolean; allowExtension?: boolean }) => boolean;
  toggleAiFleetMaintenance: () => void;
  toggleAiAutoDispatch: () => void;
  executeAiAutoDispatch: () => { dispatchedCount: number; message: string };
  dispatchRoadsideMechanic: (tripId: string, repairType: 'mobile' | 'heavy_tow') => { success: boolean; message: string };
  recallTrip: (tripId: string) => void;
  buyGold: (amount: number) => boolean;
  sellGold: (amount: number) => boolean;
  upgradeInsurancePolicy: (tier: 'basic_liability' | 'comprehensive_fleet' | 'platinum_umbrella') => boolean;
  fileInsuranceClaim: (incidentId: string) => boolean;
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

  // Free starter commercial vehicle: MetroFreight Rigid 320 Urban stationed at Denver primary base (Rigid truck - no trailer required)
  const initialTrucks: TruckInstance[] = [
    {
      id: 'trk-01',
      modelId: 'metro-320', // Free starter rigid truck
      vin: '1MTR320U9K001844',
      plate: 'CO-320-RG',
      currentHubId: primaryHubId,
      status: 'idle',
      odometerKm: 0,
      fuelCurrentLiters: 150, // 50% capacity so it draws from hub bulk fuel stock on start
      adBlueCurrentLiters: 42,
      subsystems: createPristineSubsystems(),
      activeDTCs: [],
      assignedDriverId: 'drv-01',
      activeTripId: null,
      lastServiceKm: 0,
      hasAeroPackage: true,
      hasRetarder: false,
      tireCompound: 'highway_eco',
      sleeperTier: 'day_cab',
      liveryColor: 'obsidian_slate',
      assignedTrailerId: null,
      serviceDueKm: 45000,
    },
  ];

  const initialTrailers: TrailerInstance[] = [];

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
    gold: 15,
    goldMarket: {
      spotPriceUsd: 2540,
      previousDaySpotPriceUsd: 2515,
      dayChangePercent: 0.99,
      dayHighUsd: 2560,
      dayLowUsd: 2510,
      brokerFeePercent: 1.5,
      totalGoldReserveUsd: 15 * 2540,
      history: [{ simDay: 1, price: 2540 }],
    },
    insurancePolicy: {
      policyTier: 'comprehensive_fleet',
      tierName: 'Comprehensive Commercial Fleet Policy',
      deductibleUsd: 2500,
      coverageRatioPercent: 85,
      dailyPremiumUsd: 120,
      claimsPaidTotalUsd: 0,
    },
    activeEvents: [
      {
        id: 'evt-safety-blitz-01',
        type: 'dot_safety_blitz',
        title: 'DOT Commercial Vehicle Safety Blitz',
        category: 'regulatory',
        description: 'Federal DOT and state highway patrol units are conducting intensive mechanical safety inspections at scale stations. Ensure brakes, tires, and lights are maintained.',
        region: 'Global',
        simStartMinutes: 0,
        durationMinutes: 4320,
        expiresSimMinutes: 4320,
        inspectionFrequencyMultiplier: 2.5,
        accidentRiskMultiplier: 0.9,
        severity: 'moderate',
        icon: 'ShieldAlert',
      },
      {
        id: 'evt-oil-disruption-01',
        type: 'oil_refinery_disruption',
        title: 'Refinery Disruption & Diesel Spot Surcharge',
        category: 'economic',
        description: 'Temporary refinery maintenance outage has tightened diesel distribution reserves. Wholesale terminal fuel rates are elevated by +18%.',
        region: 'Global',
        simStartMinutes: 0,
        durationMinutes: 2880,
        expiresSimMinutes: 2880,
        fuelPriceMultiplier: 1.18,
        severity: 'high',
        icon: 'Fuel',
      },
    ],
    incidentHistory: [
      {
        id: 'inc-init-01',
        simDay: 1,
        simTimeFormatted: 'Day 1 07:15',
        timestamp: Date.now() - 3600000,
        severity: 'minor_incident',
        title: 'Pre-Trip Terminal PrePass Inspection',
        type: 'dot_inspection_clean',
        truckId: 'trk-01',
        truckPlate: 'CO-320-RG',
        truckModelName: 'MetroFreight Rigid 320',
        driverId: 'drv-01',
        driverName: 'Marcus Vance',
        corridorName: 'I-25 Front Range Terminal Approach',
        locationKm: 12,
        weatherCondition: 'Clear',
        rootCause: 'Routine Commercial Vehicle Safety Alliance (CVSA) decal inspection passed flawlessly.',
        directCostUsd: 0,
        insuranceClaimUsd: 0,
        netExpenseUsd: 0,
        downtimeMinutes: 15,
        isResolved: true,
        citationDetails: 'Clean bill of health - Level 1 Inspection passed (CVSA decal issued).',
      },
    ],
    rankTitle: 'Novice Carrier',
    ownedHubIds,
    ownedRouteIds,
    ownedSpokeConnections: [],
    claimedAchievementIds: [],
    claimedGrantIds: [],
    hasCompletedOnboarding: false,
    showGuide: false,
    unlockedRegions: ['North America'],
    lastRealTimeTimestamp: Date.now(),
    offlineProgress: null,
    aiDispatcherActive: false,
    aiSubscriptionExpiresSimMinutes: 0,
    aiFleetMaintenanceActive: false,
    aiFleetMaintenanceExpiresSimMinutes: 0,
    aiOfflineDispatchActive: false,
    aiOfflineDispatchExpiresSimMinutes: 0,
    aiAutoRenew: false,
    aiAutoDispatchEnabled: true,
  };
};

const runOfflineCatchUp = (prevState: GameState, simMinutesToAdd: number): GameState => {
  const isAiOfflineSubActive = prevState.aiOfflineDispatchActive && prevState.simTimeMinutes < prevState.aiOfflineDispatchExpiresSimMinutes;
  if (simMinutesToAdd <= 0 || (prevState.activeTrips.length === 0 && !isAiOfflineSubActive)) {
    return { ...prevState, lastRealTimeTimestamp: Date.now() };
  }

  let currentBalance = prevState.balanceUsd;
  let updatedCargoTons = prevState.totalCargoDeliveredTons;
  let updatedFuelBurned = prevState.totalFuelBurnedLiters;
  let updatedKmDriven = prevState.totalKilometersDriven;
  let updatedPlayerXp = prevState.playerXp;
  let updatedPlayerRank = prevState.playerRank;
  let updatedRankTitle = prevState.rankTitle;
  let updatedGold = prevState.gold;

  let completedCount = 0;
  let revenueEarned = 0;
  let kmCovered = 0;

  const updatedTrips: ActiveTrip[] = [];
  const finishedTrips: ActiveTrip[] = [];

  for (const trip of prevState.activeTrips) {
    const tripRemainingMinutes = (trip.totalDistanceKm - trip.progressKm) / (trip.corridor.baseSpeedLimitKmh / 60);
    if (simMinutesToAdd >= tripRemainingMinutes) {
      const finalProgressKm = trip.totalDistanceKm;
      const distanceDelta = finalProgressKm - trip.progressKm;
      kmCovered += distanceDelta;
      updatedKmDriven += distanceDelta;

      const fuelBurned = distanceDelta * 0.35;
      updatedFuelBurned += fuelBurned;

      finishedTrips.push({
        ...trip,
        progressKm: finalProgressKm,
        elapsedMinutes: trip.elapsedMinutes + tripRemainingMinutes,
        fuelConsumedLiters: trip.fuelConsumedLiters + fuelBurned,
      });
    } else {
      const speedKmh = trip.corridor.baseSpeedLimitKmh * 0.85;
      const distanceDelta = (speedKmh / 60) * simMinutesToAdd;
      kmCovered += distanceDelta;
      updatedKmDriven += distanceDelta;

      const fuelBurned = distanceDelta * 0.35;
      updatedFuelBurned += fuelBurned;

      updatedTrips.push({
        ...trip,
        progressKm: Math.min(trip.totalDistanceKm, trip.progressKm + distanceDelta),
        elapsedMinutes: trip.elapsedMinutes + simMinutesToAdd,
        fuelConsumedLiters: trip.fuelConsumedLiters + fuelBurned,
      });
    }
  }

  const updatedTrucks = [...prevState.trucks];
  let updatedTrailers = [...prevState.trailers];
  const updatedDrivers = [...prevState.drivers];
  const newLedgerEntries: LedgerEntry[] = [];
  const newNotifications: GameEventNotification[] = [];
  const simDay = Math.floor(prevState.simTimeMinutes / 1440) + 1;
  const timeFormatted = `Day ${simDay}`;

  for (const finished of finishedTrips) {
    completedCount++;
    const destHub = prevState.hubs.find((h) => h.id === finished.contract.destinationHubId);
    const isOnTime = finished.elapsedMinutes <= finished.contract.deadlineMinutes;
    const commMultiplier = getCommercialPayoutMultiplier(finished.truckId, finished.trailerId, prevState.trucks);
    const adjPayout = Math.round(finished.contract.payoutUsd * commMultiplier);
    const adjBonus = Math.round(finished.contract.bonusOnTimeUsd * commMultiplier);
    const adjPenalty = Math.round(finished.contract.penaltyLateUsd * commMultiplier);
    const grossPayout = adjPayout + (isOnTime ? adjBonus : -adjPenalty);
    const finalRevenue = Math.max(0, grossPayout);
    revenueEarned += finalRevenue;

    const driverWage = finished.totalDistanceKm * (prevState.drivers.find((d) => d.id === finished.driverId)?.wagePerKmUsd || 0.45);
    const tolls = finished.corridor.tollCostUsd;

    currentBalance += finalRevenue - driverWage - tolls;
    updatedCargoTons += finished.contract.weightTons;

    const earnedXp = Math.max(10, Math.round(finished.totalDistanceKm * 0.08 + finished.contract.weightTons * 2));
    updatedPlayerXp += earnedXp;

    for (const tier of RANK_TIERS) {
      if (updatedPlayerXp >= tier.xpRequired && tier.rank > updatedPlayerRank) {
        updatedPlayerRank = tier.rank;
        updatedRankTitle = tier.title;
        updatedGold += 5;
        newNotifications.push({
          id: `notif-rank-off-${tier.rank}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simTimeFormatted: timeFormatted,
          title: `🪙 PROMOTED: ${tier.title.toUpperCase()} (Rank ${tier.rank})`,
          message: `Carrier reputation elevated to Rank ${tier.rank} (${tier.title}). Earned +5 Gold!`,
          type: 'delivery',
          timestamp: Date.now(),
        });
      }
    }

    newLedgerEntries.push({
      id: `led-off-deliv-${finished.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      simDay,
      simTimeFormatted: timeFormatted,
      type: 'freight_revenue',
      description: `Delivered (Offline): ${finished.contract.title} (${finished.contract.weightTons}t) to ${destHub?.name || 'Destination'} [+${earnedXp} XP]`,
      amountUsd: finalRevenue,
      runningBalanceUsd: currentBalance,
    });

    newLedgerEntries.push({
      id: `led-off-wage-${finished.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      simDay,
      simTimeFormatted: timeFormatted,
      type: 'driver_wages',
      description: `Driver mileage payout (${Math.round(finished.totalDistanceKm)} km)`,
      amountUsd: -Math.round(driverWage),
      runningBalanceUsd: currentBalance,
    });

    if (tolls > 0) {
      newLedgerEntries.push({
        id: `led-off-toll-${finished.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        simDay,
        simTimeFormatted: timeFormatted,
        type: 'toll_expense',
        description: `Corridor electronic highway tolls`,
        amountUsd: -tolls,
        runningBalanceUsd: currentBalance,
      });
    }

    newNotifications.push({
      id: `notif-off-deliv-${finished.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      simTimeFormatted: timeFormatted,
      title: 'Freight Consignment Delivered (Offline)',
      message: `Cargo arrived at ${destHub?.name}. Net payment: $${finalRevenue.toLocaleString()}.`,
      type: 'delivery',
      timestamp: Date.now(),
    });

    const truckIndex = updatedTrucks.findIndex((t) => t.id === finished.truckId);
    if (truckIndex >= 0) {
      const prevSub = updatedTrucks[truckIndex].subsystems;
      const wearDelta = finished.totalDistanceKm * 0.0035;
      updatedTrucks[truckIndex] = {
        ...updatedTrucks[truckIndex],
        status: 'idle',
        currentHubId: finished.contract.destinationHubId,
        odometerKm: updatedTrucks[truckIndex].odometerKm + finished.totalDistanceKm,
        activeTripId: null,
        subsystems: {
          ...prevSub,
          engineBlock: Math.max(0, prevSub.engineBlock - wearDelta * 0.9),
          brakePads: Math.max(0, prevSub.brakePads - wearDelta * 1.3),
          turbocharger: Math.max(0, prevSub.turbocharger - wearDelta * 1.0),
          steerTires: {
            ...prevSub.steerTires,
            wearPercentage: Math.max(0, prevSub.steerTires.wearPercentage - wearDelta * 1.4),
            treadDepthMm: Math.max(1.0, Number((prevSub.steerTires.treadDepthMm - finished.totalDistanceKm * 0.0009).toFixed(2))),
          },
          driveTiresAxle1: {
            ...prevSub.driveTiresAxle1,
            wearPercentage: Math.max(0, prevSub.driveTiresAxle1.wearPercentage - wearDelta * 1.5),
            treadDepthMm: Math.max(1.0, Number((prevSub.driveTiresAxle1.treadDepthMm - finished.totalDistanceKm * 0.001).toFixed(2))),
          },
        },
      };
    }

    if (finished.trailerId) {
      const trailerIndex = updatedTrailers.findIndex((tr) => tr.id === finished.trailerId);
      if (trailerIndex >= 0) {
        updatedTrailers[trailerIndex] = {
          ...updatedTrailers[trailerIndex],
          status: 'idle',
          currentHubId: finished.contract.destinationHubId,
          odometerKm: updatedTrailers[trailerIndex].odometerKm + finished.totalDistanceKm,
          assignedTripId: null,
        };
      }
    }

    const driverIndex = updatedDrivers.findIndex((d) => d.id === finished.driverId);
    if (driverIndex >= 0) {
      updatedDrivers[driverIndex] = {
        ...updatedDrivers[driverIndex],
        currentHubId: finished.contract.destinationHubId,
        hosStatus: 'off_duty',
        assignedTruckId: null,
      };
    }
  }

  // Autonomous Offline AI Dispatcher: if AI Offline Dispatch add-on subscription is active, automatically redispatch idle trucks and drivers while away
  let offlineAiDispatchedCount = 0;
  if (isAiOfflineSubActive) {
    let availableContracts = [...prevState.availableContracts];
    if (availableContracts.length === 0) {
      const unlockedRoutes = prevState.routes.filter(r => r.isUnlocked);
      availableContracts = generateContractsForRoutes(unlockedRoutes.length > 0 ? unlockedRoutes : prevState.routes, prevState.hubs, 20, updatedTrucks);
    }
    availableContracts.sort((a, b) => b.payoutUsd - a.payoutUsd);

    const truckHubMap = new Map<string, string>();
    for (const t of updatedTrucks) {
      const activeTrip = finishedTrips.find(ft => ft.truckId === t.id);
      if (activeTrip) {
        truckHubMap.set(t.id, activeTrip.contract.destinationHubId);
      } else if (!updatedTrips.some(ut => ut.truckId === t.id)) {
        truckHubMap.set(t.id, t.currentHubId);
      }
    }

    for (const truck of updatedTrucks) {
      if (updatedTrips.some(ut => ut.truckId === truck.id)) continue;
      const currentHubId = truckHubMap.get(truck.id) || truck.currentHubId;
      const truckHub = prevState.hubs.find(h => h.id === currentHubId);
      if (!truckHub) continue;

      const driver = updatedDrivers.find(d => !d.assignedTruckId && d.hosStatus !== 'driving' && d.hosStatus !== 'resting');
      if (!driver) break;

      const contractIdx = availableContracts.findIndex(c => {
        const oHub = prevState.hubs.find(h => h.id === c.originHubId);
        const dHub = prevState.hubs.find(h => h.id === c.destinationHubId);
        if (!oHub || !dHub) return false;
        return c.originHubId === currentHubId && oHub.region === truckHub.region && dHub.region === truckHub.region;
      });

      if (contractIdx === -1) continue;
      const contract = availableContracts[contractIdx];
      availableContracts.splice(contractIdx, 1);

      let route = prevState.routes.find(r => r.originHubId === contract.originHubId && r.destinationHubId === contract.destinationHubId);
      if (!route) {
        const oHub = prevState.hubs.find(h => h.id === contract.originHubId);
        const dHub = prevState.hubs.find(h => h.id === contract.destinationHubId);
        if (oHub && dHub) {
          const dx = oHub.coord.x - dHub.coord.x;
          const dy = oHub.coord.y - dHub.coord.y;
          const dist = Math.max(200, Math.round(Math.sqrt(dx * dx + dy * dy) * 3.5));
          route = {
            id: `route-offai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            originHubId: oHub.id,
            destinationHubId: dHub.id,
            name: `${oHub.name.split(' ')[0]} - ${dHub.name.split(' ')[0]} AI Offline Express`,
            distanceKm: dist,
            roadType: 'Interstate Highway',
            baseSpeedLimitKmh: 105,
            avgElevationGradePct: 1.0,
            maxGradePct: 5.0,
            tollCostUsd: Math.round(dist * 0.04),
            waypoints: [
              { name: oHub.name, coord: oHub.coord, elevationMeters: 50 },
              { name: dHub.name, coord: dHub.coord, elevationMeters: 40 },
            ],
            hazardRisk: 0.1,
            isUnlocked: true,
            licenseFeeUsd: 0,
            requiredRank: 1,
            trafficRateScore: 90,
          };
        }
      }
      if (!route) continue;

      let chosenTrailerId: string | null = null;
      const truckModel = TRUCK_MODELS.find(m => m.id === truck.modelId);
      if (!truckModel?.isRigid) {
        let trailer = updatedTrailers.find(tr => tr.status === 'idle' && tr.currentHubId === contract.originHubId);
        if (!trailer) {
          const trailerModelId: TrailerModelId = contract.temperatureControlled
            ? 'reefer-temp'
            : contract.isHazardous
            ? 'adr-chemical'
            : contract.category === 'Heavy Machinery'
            ? 'lowboy-heavy'
            : 'dry-van-53';

          const newTr: TrailerInstance = {
            id: `trl-offai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            modelId: trailerModelId,
            serialNumber: `AH-${Math.floor(10000 + Math.random() * 90000)}`,
            currentHubId: contract.originHubId,
            status: 'en_route',
            odometerKm: 0,
            hasAeroSkirts: true,
            hasReeferUnit: !!contract.temperatureControlled,
            reeferFuelCurrentLiters: contract.temperatureControlled ? 100 : 0,
            tireCompound: 'highway_eco',
            assignedTruckId: truck.id,
            assignedTripId: null,
          };
          updatedTrailers.push(newTr);
          trailer = newTr;
        } else {
          updatedTrailers = updatedTrailers.map(tr => tr.id === trailer!.id ? { ...tr, status: 'en_route', assignedTruckId: truck.id, currentHubId: contract.originHubId } : tr);
        }
        chosenTrailerId = trailer?.id || null;
      }

      const newOfflineAiTrip: ActiveTrip = {
        id: `trip-offai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        contract,
        corridor: route,
        truckId: truck.id,
        driverId: driver.id,
        trailerId: chosenTrailerId,
        progressKm: 0,
        totalDistanceKm: route.distanceKm,
        elapsedMinutes: 0,
        departureTimeSimMinutes: prevState.simTimeMinutes,
        fuelConsumedLiters: 0,
        telemetry: {
          currentSpeedKmh: 85,
          currentGear: 10,
          engineRpm: 1400,
          instantFuelRateL100km: 32,
          instantFuelRateLitersPerHour: 28,
          engineLoadPct: 65,
          turboBoostBar: 1.2,
          oilTempCelsius: 92,
          oilPressureBar: 4.5,
          coolantTempCelsius: 88,
          brakeTempCelsius: 120,
          retarderActive: false,
          retarderLevel: 0,
          currentInclinePct: 0,
          currentWindSpeedKmh: 10,
          currentHeadwindComponentKmh: 0,
          weatherState: getLocalWeather(route.waypoints[0].coord, 50, prevState.simTimeMinutes),
        },
        eventLogs: [`[${timeFormatted}] Autonomous AI Offline Dispatcher authorized consignment: ${contract.title}`],
        isRestingNow: false,
        isStalledBreakdown: false,
      };

      updatedTrips.push(newOfflineAiTrip);
      completedCount++;
      offlineAiDispatchedCount++;

      const tIdx = updatedTrucks.findIndex(t => t.id === truck.id);
      if (tIdx >= 0) {
        updatedTrucks[tIdx] = {
          ...updatedTrucks[tIdx],
          status: 'en_route',
          activeTripId: newOfflineAiTrip.id,
        };
      }
      const dIdx = updatedDrivers.findIndex(d => d.id === driver.id);
      if (dIdx >= 0) {
        updatedDrivers[dIdx] = {
          ...updatedDrivers[dIdx],
          hosStatus: 'driving',
          assignedTruckId: truck.id,
        };
      }

      newNotifications.push({
        id: `notif-offai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        simTimeFormatted: timeFormatted,
        title: '🤖 Autonomous AI Offline Dispatch',
        message: `AI Neural Dispatcher auto-assigned ${truck.plate} to "${contract.title}" while away.`,
        type: 'delivery',
        timestamp: Date.now(),
      });
    }
  }

  // Process AI Fleet Maintenance Add-on during offline catch-up
  if (prevState.aiFleetMaintenanceActive && prevState.simTimeMinutes < (prevState.aiFleetMaintenanceExpiresSimMinutes || 0)) {
    const maintResult = processAiFleetMaintenance(
      {
        ...prevState,
        balanceUsd: currentBalance,
        trucks: updatedTrucks,
        simTimeMinutes: prevState.simTimeMinutes + simMinutesToAdd,
      },
      simMinutesToAdd
    );
    currentBalance = maintResult.updatedBalance;
    updatedTrucks.length = 0;
    updatedTrucks.push(...maintResult.updatedTrucks);
    if (maintResult.newLedgerEntries.length > 0) {
      newLedgerEntries.unshift(...maintResult.newLedgerEntries);
    }
    if (maintResult.newNotifications.length > 0) {
      newNotifications.unshift(...maintResult.newNotifications);
    }
  }

  const hoursElapsed = Number((simMinutesToAdd / 60).toFixed(1));
  const progressReport = completedCount > 0 || kmCovered > 30 ? {
    hoursElapsed,
    completedContracts: completedCount,
    revenueEarned,
    kmCovered: Math.round(kmCovered),
    visible: true,
  } : null;

  return {
    ...prevState,
    balanceUsd: currentBalance,
    simTimeMinutes: prevState.simTimeMinutes + simMinutesToAdd,
    activeTrips: updatedTrips,
    trucks: updatedTrucks,
    trailers: updatedTrailers,
    drivers: updatedDrivers,
    ledger: [...newLedgerEntries, ...prevState.ledger].slice(0, 150),
    notifications: deduplicateNotifications([...newNotifications, ...prevState.notifications]).slice(0, 40),
    totalCargoDeliveredTons: updatedCargoTons,
    totalFuelBurnedLiters: updatedFuelBurned,
    totalKilometersDriven: updatedKmDriven,
    playerRank: updatedPlayerRank,
    playerXp: updatedPlayerXp,
    rankTitle: updatedRankTitle,
    gold: updatedGold,
    lastRealTimeTimestamp: Date.now(),
    offlineProgress: progressReport,
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
          if (parsed.gold === undefined) parsed.gold = 15;
          parsed.notifications = deduplicateNotifications(parsed.notifications || []);
          if (!parsed.trailers || parsed.trailers.length === 0) {
            parsed.trailers = INITIAL_TRAILERS;
          }
          if (!parsed.goldMarket) {
            parsed.goldMarket = {
              spotPriceUsd: 2540,
              previousDaySpotPriceUsd: 2515,
              dayChangePercent: 0.99,
              dayHighUsd: 2560,
              dayLowUsd: 2510,
              brokerFeePercent: 1.5,
              totalGoldReserveUsd: (parsed.gold || 15) * 2540,
              history: [{ simDay: 1, price: 2540 }],
            };
          }
          if (!parsed.insurancePolicy) {
            parsed.insurancePolicy = {
              policyTier: 'comprehensive_fleet',
              tierName: 'Comprehensive Commercial Fleet Policy',
              deductibleUsd: 2500,
              coverageRatioPercent: 85,
              dailyPremiumUsd: 120,
              claimsPaidTotalUsd: 0,
            };
          }
          if (!parsed.activeEvents || parsed.activeEvents.length === 0) {
            parsed.activeEvents = [
              {
                id: 'evt-safety-blitz-01',
                type: 'dot_safety_blitz',
                title: 'DOT Commercial Vehicle Safety Blitz',
                category: 'regulatory',
                description: 'Federal DOT and state highway patrol units are conducting intensive mechanical safety inspections at scale stations. Ensure brakes, tires, and lights are maintained.',
                region: 'Global',
                simStartMinutes: 0,
                durationMinutes: 4320,
                expiresSimMinutes: 4320,
                inspectionFrequencyMultiplier: 2.5,
                accidentRiskMultiplier: 0.9,
                severity: 'moderate',
                icon: 'ShieldAlert',
              },
              {
                id: 'evt-oil-disruption-01',
                type: 'oil_refinery_disruption',
                title: 'Refinery Disruption & Diesel Spot Surcharge',
                category: 'economic',
                description: 'Temporary refinery maintenance outage has tightened diesel distribution reserves. Wholesale terminal fuel rates are elevated by +18%.',
                region: 'Global',
                simStartMinutes: 0,
                durationMinutes: 2880,
                expiresSimMinutes: 2880,
                fuelPriceMultiplier: 1.18,
                severity: 'high',
                icon: 'Fuel',
              },
            ];
          }
          if (!parsed.incidentHistory) {
            parsed.incidentHistory = [
              {
                id: 'inc-init-01',
                simDay: 1,
                simTimeFormatted: 'Day 1 07:15',
                timestamp: Date.now() - 3600000,
                severity: 'minor_incident',
                title: 'Pre-Trip Terminal PrePass Inspection',
                type: 'dot_inspection_clean',
                truckId: 'trk-01',
                truckPlate: 'CO-320-RG',
                truckModelName: 'MetroFreight Rigid 320',
                driverId: 'drv-01',
                driverName: 'Marcus Vance',
                corridorName: 'I-25 Front Range Terminal Approach',
                locationKm: 12,
                weatherCondition: 'Clear',
                rootCause: 'Routine Commercial Vehicle Safety Alliance (CVSA) decal inspection passed flawlessly.',
                directCostUsd: 0,
                insuranceClaimUsd: 0,
                netExpenseUsd: 0,
                downtimeMinutes: 15,
                isResolved: true,
                citationDetails: 'Clean bill of health - Level 1 Inspection passed (CVSA decal issued).',
              },
            ];
          }

          const now = Date.now();
          const lastTime = parsed.lastRealTimeTimestamp || now;
          const realElapsedMs = now - lastTime;
          const isAiOfflineSubActive = parsed.aiOfflineDispatchActive && parsed.simTimeMinutes < parsed.aiOfflineDispatchExpiresSimMinutes;
          // Only calculate offline progress if away for > 5 minutes (300,000 ms) and (active trips exist OR offline AI dispatch subscription is active)
          if (realElapsedMs > 300000 && ((parsed.activeTrips && parsed.activeTrips.length > 0) || isAiOfflineSubActive)) {
            const realSeconds = Math.floor(realElapsedMs / 1000);
            const simMinutesToAdd = Math.min(realSeconds * 1, 43200); // cap at max 30 sim days
            const updated = runOfflineCatchUp(parsed, simMinutesToAdd);
            updated.lastRealTimeTimestamp = now;
            return updated;
          }

          parsed.lastRealTimeTimestamp = now;
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

  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(Date.now());
  const [isDbSaving, setIsDbSaving] = useState<boolean>(false);
  const isDirtyRef = useRef<boolean>(false);

  // Asynchronously initialize from Phone Memory DB (IndexedDB)
  useEffect(() => {
    let isMounted = true;
    requestPersistentStorage().catch(() => {});

    loadFromPhoneDb().then((dbState) => {
      if (!isMounted || !dbState) return;
      if (dbState.trucks && dbState.trucks.length > 0) {
        setState((currentState) => {
          const now = Date.now();
          const lastTime = dbState.lastRealTimeTimestamp || now;
          const realElapsedMs = now - lastTime;
          const isAiOfflineSubActive = dbState.aiOfflineDispatchActive && dbState.simTimeMinutes < dbState.aiOfflineDispatchExpiresSimMinutes;
          if (realElapsedMs > 300000 && ((dbState.activeTrips && dbState.activeTrips.length > 0) || isAiOfflineSubActive)) {
            const realSeconds = Math.floor(realElapsedMs / 1000);
            const simMinutesToAdd = Math.min(realSeconds * 1, 43200);
            const updated = runOfflineCatchUp(dbState, simMinutesToAdd);
            updated.lastRealTimeTimestamp = now;
            return updated;
          }
          dbState.lastRealTimeTimestamp = now;
          return dbState;
        });
      }
    }).catch((err) => {
      console.warn('[PhoneDB] Background load err:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Flush state to phone memory DB asynchronously without blocking main thread
  const flushToDb = async () => {
    try {
      setIsDbSaving(true);
      const snapshot = stateRef.current;
      await saveToPhoneDb(snapshot);
      isDirtyRef.current = false;
      setLastSavedTimestamp(Date.now());
    } catch (err) {
      console.warn('[PhoneDB] Save error:', err);
    } finally {
      setIsDbSaving(false);
    }
  };

  // Mark dirty whenever state changes
  useEffect(() => {
    isDirtyRef.current = true;
  }, [state]);

  // Debounced auto-save: flushes to Phone Memory DB every 5 seconds (decoupled from the 1s tick!)
  useEffect(() => {
    const saveTimer = setInterval(() => {
      if (isDirtyRef.current) {
        flushToDb();
      }
    }, 5000);

    // Save immediately if user closes or navigates away
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        saveToPhoneDb(stateRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const restoreState = (importedState: GameState) => {
    if (!importedState || !importedState.trucks) {
      notifyUser('Import Failed', 'The supplied backup file is missing required fleet data.', 'maintenance');
      return;
    }
    setState(importedState);
    saveToPhoneDb(importedState).then(() => {
      setLastSavedTimestamp(Date.now());
      notifyUser('Database Restored', 'Game state successfully restored into Phone Memory DB.', 'delivery');
    });
  };

  // Main Simulation Loop
  useEffect(() => {
    if (state.simSpeed === 0) return;

    // Tick every 12000ms real time (12 seconds) to achieve 5x real-time speed (1 real minute = 5 sim minutes).
    const intervalMs = 12000;
    const timer = setInterval(() => {
      startTransition(() => {
        setState((prevState) => {
          if (prevState.simSpeed === 0) return prevState;

          const deltaSimMinutes = 1; // 1 sim minute per 12 seconds (5x real life speed)
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
          let updatedPlayerXp = prevState.playerXp;
          let updatedPlayerRank = prevState.playerRank;
          let updatedRankTitle = prevState.rankTitle;
          let updatedGold = prevState.gold;

          let updatedGoldMarket: GoldMarketState = prevState.goldMarket || {
            spotPriceUsd: 2540,
            previousDaySpotPriceUsd: 2515,
            dayChangePercent: 0.99,
            dayHighUsd: 2560,
            dayLowUsd: 2510,
            brokerFeePercent: 1.5,
            totalGoldReserveUsd: (prevState.gold || 15) * 2540,
            history: [{ simDay: 1, price: 2540 }],
          };
          let updatedInsurance: CommercialInsurancePolicy = prevState.insurancePolicy || {
            policyTier: 'comprehensive_fleet',
            tierName: 'Comprehensive Commercial Fleet Policy',
            deductibleUsd: 2500,
            coverageRatioPercent: 85,
            dailyPremiumUsd: 120,
            claimsPaidTotalUsd: 0,
          };
          let updatedEvents: MacroWorldEvent[] = [...(prevState.activeEvents || [])];
          let updatedIncidents: FleetIncidentRecord[] = [...(prevState.incidentHistory || [])];

          // 1. Process Midnight Rollover (Daily loan payments, driver retainers, hub depot maintenance, insurance, gold spot, events)
          let updatedLoans = prevState.loans;
          let updatedDrivers = [...prevState.drivers];
          if (isMidnightRollover) {
            // Commercial Fleet Insurance daily premium
            if (updatedInsurance.dailyPremiumUsd > 0) {
              currentBalance -= updatedInsurance.dailyPremiumUsd;
              newLedgerEntries.push({
                id: `led-ins-${newSimMinutes}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'broker_fee',
                description: `Commercial Fleet Insurance daily underwriter premium (${updatedInsurance.tierName})`,
                amountUsd: -updatedInsurance.dailyPremiumUsd,
                runningBalanceUsd: currentBalance,
              });
            }

            // Real Valuation: Fluctuate Gold Spot Price (COMEX benchmark)
            const curSpot = updatedGoldMarket.spotPriceUsd || 2540;
            const deltaSpot = Math.round((Math.random() - 0.48) * 32);
            const newSpot = Math.max(2200, Math.min(3200, curSpot + deltaSpot));
            const changePct = Number((((newSpot - curSpot) / curSpot) * 100).toFixed(2));
            updatedGoldMarket = {
              ...updatedGoldMarket,
              spotPriceUsd: newSpot,
              previousDaySpotPriceUsd: curSpot,
              dayChangePercent: changePct,
              dayHighUsd: Math.max(newSpot, newSpot + Math.round(Math.random() * 25)),
              dayLowUsd: Math.min(newSpot, newSpot - Math.round(Math.random() * 25)),
              totalGoldReserveUsd: prevState.gold * newSpot,
              history: [...(updatedGoldMarket.history || []), { simDay: currentDay, price: newSpot }].slice(-30),
            };

            // Macro Real-World Events Lifecycle
            updatedEvents = updatedEvents.filter(e => e.expiresSimMinutes > newSimMinutes);
            if (updatedEvents.length < 2 && Math.random() < 0.45) {
              const eventPool: Omit<MacroWorldEvent, 'id' | 'simStartMinutes' | 'expiresSimMinutes'>[] = [
                {
                  type: 'dot_safety_blitz',
                  title: 'DOT Commercial Vehicle Safety Blitz',
                  category: 'regulatory',
                  description: 'Federal DOT and state highway patrol units are conducting intensive mechanical safety inspections at scale stations. Ensure brakes, tires, and lights are maintained.',
                  region: 'Global',
                  durationMinutes: 4320,
                  inspectionFrequencyMultiplier: 2.5,
                  accidentRiskMultiplier: 0.9,
                  severity: 'moderate',
                  icon: 'ShieldAlert',
                },
                {
                  type: 'oil_refinery_disruption',
                  title: 'Refinery Disruption & Diesel Spot Surcharge',
                  category: 'economic',
                  description: 'Temporary refinery maintenance outage has tightened diesel distribution reserves. Wholesale terminal fuel rates are elevated by +18%.',
                  region: 'Global',
                  durationMinutes: 2880,
                  fuelPriceMultiplier: 1.18,
                  severity: 'high',
                  icon: 'Fuel',
                },
                {
                  type: 'polar_vortex_blizzard',
                  title: 'Polar Vortex & Mountain Blizzard Warning',
                  category: 'weather',
                  description: 'Severe arctic blast dropping temperatures across corridors. Road friction severely reduced; hazard risk elevated for unequipped rigs.',
                  region: 'Global',
                  durationMinutes: 2880,
                  roadFrictionPenalty: -0.22,
                  accidentRiskMultiplier: 2.2,
                  severity: 'critical',
                  icon: 'CloudLightning',
                },
                {
                  type: 'port_dockworker_congestion',
                  title: 'Intermodal Port Congestion & Peak Surcharge',
                  category: 'logistics',
                  description: 'Container terminals experiencing massive inbound cargo surges. Shippers are paying an extra +35% spot rate for immediate hauling.',
                  region: 'Global',
                  durationMinutes: 4320,
                  freightPayoutMultiplier: 1.35,
                  severity: 'moderate',
                  icon: 'Package',
                },
                {
                  type: 'infrastructure_corridor_subsidy',
                  title: 'Highway Trust Fund Corridor Toll Subsidy',
                  category: 'economic',
                  description: 'Federal transport agency grant active: Highway tolls are subsidized by 50% across all commercial interstate corridors.',
                  region: 'Global',
                  durationMinutes: 2880,
                  tollMultiplier: 0.50,
                  severity: 'low',
                  icon: 'DollarSign',
                },
                {
                  type: 'just_in_time_shortage',
                  title: 'Critical Industrial Just-In-Time Supply Shortage',
                  category: 'logistics',
                  description: 'Manufacturing plants in critical need of freight. Rush bonuses of +40% available for prompt delivery.',
                  region: 'Global',
                  durationMinutes: 2880,
                  freightPayoutMultiplier: 1.40,
                  severity: 'high',
                  icon: 'Zap',
                },
                {
                  type: 'summer_heatwave_buckling',
                  title: 'Interstate Pavement Heatwave Warning',
                  category: 'weather',
                  description: 'Roadway surface temperatures exceeding 50°C. High risk of tire delamination and overheating engines.',
                  region: 'Global',
                  durationMinutes: 2880,
                  accidentRiskMultiplier: 1.6,
                  severity: 'moderate',
                  icon: 'Flame',
                },
              ];
              const cand = eventPool[Math.floor(Math.random() * eventPool.length)];
              if (!updatedEvents.some(e => e.type === cand.type)) {
                const newEvt: MacroWorldEvent = {
                  ...cand,
                  id: `evt-${cand.type}-${Date.now()}`,
                  simStartMinutes: newSimMinutes,
                  expiresSimMinutes: newSimMinutes + cand.durationMinutes,
                };
                updatedEvents.push(newEvt);
                newNotifications.push({
                  id: `notif-evt-${newEvt.id}`,
                  simTimeFormatted: timeFormatted,
                  title: `🌐 Global Market Event: ${newEvt.title}`,
                  message: newEvt.description,
                  type: 'event',
                  timestamp: Date.now(),
                });
              }
            }

            // Driver contract days countdown
            updatedDrivers = prevState.drivers.map((drv) => {
              const remaining = Math.max(0, (drv.contractDaysRemaining || 45) - 1);
              if (remaining === 0 && (drv.contractDaysRemaining || 45) > 0) {
                newNotifications.push({
                  id: `notif-contract-exp-${drv.id}-${currentDay}-${Date.now()}`,
                  simTimeFormatted: timeFormatted,
                  title: '⚠️ Driver Contract Expired',
                  message: `Employment contract for ${drv.name} has expired. Enroll them in training to auto-extend contract or re-sign.`,
                  type: 'driver',
                  timestamp: Date.now(),
                });
              }
              return { ...drv, contractDaysRemaining: remaining };
            });

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

            // Fluctuate hub fuel spot prices by +/- 3% (influenced by active events)
            const fuelEventMultiplier = updatedEvents.reduce((acc, ev) => acc * (ev.fuelPriceMultiplier || 1), 1);
            const updatedHubs = prevState.hubs.map((h) => {
              const delta = (Math.random() - 0.5) * 0.08;
              const baseNew = Math.max(0.85, Math.min(2.4, Number((h.fuelPricePerLiter + delta).toFixed(2))));
              const finalPrice = Number((baseNew * fuelEventMultiplier).toFixed(2));
              return { ...h, fuelPricePerLiter: finalPrice };
            });

            // Restock fresh available contracts for unlocked routes across all unlocked regions simultaneously
            const unlockedRegions = prevState.unlockedRegions || [];
            const unlockedRoutes = prevState.routes.filter(
              (r) => {
                if (!r.isUnlocked) return false;
                const oHub = prevState.hubs.find(h => h.id === r.originHubId);
                return oHub && oHub.isUnlocked && unlockedRegions.includes(oHub.region);
              }
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
            const unlockedRegions = prevState.unlockedRegions || [];
            const activeRegionRoutes = prevState.routes.filter(
              (r) => {
                if (!r.isUnlocked) return false;
                const oHub = prevState.hubs.find(h => h.id === r.originHubId);
                return oHub && oHub.isUnlocked && unlockedRegions.includes(oHub.region);
              }
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
              let repairMins = trip.roadsideRepairMinutesRemaining;
              if (repairMins !== undefined && repairMins > 0) {
                repairMins -= deltaSimMinutes;
                if (repairMins <= 0) {
                  // Roadside repair finished!
                  const isHeavy = trip.roadsideRepairType === 'heavy_tow';
                  const repairedEngine = isHeavy ? 100 : Math.max(60, trip.telemetry.updatedSubsystems?.engineBlock || 60);
                  const repairedBrakes = isHeavy ? 100 : Math.max(60, trip.telemetry.updatedSubsystems?.brakePads || 60);

                  updatedTrucks = updatedTrucks.map(t => t.id === truck.id ? {
                    ...t,
                    status: 'en_route',
                    health: isHeavy ? 100 : Math.max(70, t.health || 70),
                    subsystems: {
                      ...t.subsystems,
                      engineBlock: repairedEngine,
                      brakePads: repairedBrakes,
                      coolingSystem: Math.max(80, t.subsystems.coolingSystem),
                      exhaustAftertreatment: Math.max(80, t.subsystems.exhaustAftertreatment),
                    }
                  } : t);

                  newNotifications.push({
                    id: `notif-repair-done-${trip.id}-${newSimMinutes}`,
                    simTimeFormatted: timeFormatted,
                    title: isHeavy ? '🚛 Heavy Tow & Workshop Overhaul Complete' : '🛠️ Mobile Roadside Repair Complete',
                    message: `${truck.plate} has successfully completed roadside service and resumed haul towards destination.`,
                    type: 'breakdown',
                    timestamp: Date.now(),
                  });

                  remainingTrips.push({
                    ...trip,
                    isStalledBreakdown: false,
                    roadsideRepairMinutesRemaining: undefined,
                    roadsideRepairType: undefined,
                    elapsedMinutes: trip.elapsedMinutes + deltaSimMinutes,
                    telemetry: {
                      ...trip.telemetry,
                      currentSpeedKmh: 80,
                      updatedSubsystems: {
                        ...trip.telemetry.updatedSubsystems,
                        engineBlock: repairedEngine,
                        brakePads: repairedBrakes,
                      }
                    }
                  });
                  continue;
                } else {
                  // Repair still in progress
                  remainingTrips.push({
                    ...trip,
                    roadsideRepairMinutesRemaining: repairMins,
                    elapsedMinutes: trip.elapsedMinutes + deltaSimMinutes,
                    telemetry: {
                      ...trip.telemetry,
                      currentSpeedKmh: 0,
                      engineRpm: 750,
                      instantFuelRateLitersPerHour: 2.5,
                    }
                  });
                  continue;
                }
              } else {
                // Waiting for rescue dispatch
                remainingTrips.push(trip);
                continue;
              }
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
              driverId: driver.id,
              simTimeMinutes: newSimMinutes,
            });

            // Fuel depletion check & en-route service stop
            let nextFuel = Math.max(0, truck.fuelCurrentLiters - physics.fuelBurnedLiters);
            const nextAdBlue = Math.max(0, truck.adBlueCurrentLiters - physics.adBlueBurnedLiters);
            updatedFuelBurned += physics.fuelBurnedLiters;

            const tankCap = model.specs.fuelTankCapacityLiters || 600;
            const lowFuelThreshold = tankCap * 0.65;
            if (nextFuel <= lowFuelThreshold && nextFuel > 0 && truck.fuelCurrentLiters > lowFuelThreshold) {
              const buyLiters = Math.min(tankCap - nextFuel, tankCap * 0.6);
              const roadFuelCost = Math.round(buyLiters * 1.65); // highway pump price
              currentBalance -= roadFuelCost;
              nextFuel += buyLiters;

              newLedgerEntries.push({
                id: `led-road-fuel-${trip.id}-${newSimMinutes}-${Math.random().toString(36).substring(2, 7)}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'fuel_expense',
                description: `En-route highway fuel stop (${Math.round(buyLiters)}L) for ${truck.plate}`,
                amountUsd: -roadFuelCost,
                runningBalanceUsd: currentBalance,
              });

              newNotifications.push({
                id: `notif-road-fuel-${trip.id}-${newSimMinutes}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: '⛽ En-Route Highway Fuel Stop',
                message: `${truck.plate} refueled at highway service plaza (${Math.round(buyLiters)}L diesel, $${roadFuelCost.toLocaleString()}).`,
                type: 'delivery',
                timestamp: Date.now(),
              });
            }

            if (nextFuel <= 0) {
              // Run out of fuel! Emergency dispatch recovery
              currentBalance -= 2200;
              nextFuel = 150; // refill to limp home
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

            // Real-World Incident & Accident Simulation
            const tripProgressFrac = trip.totalDistanceKm > 0 ? trip.progressKm / trip.totalDistanceKm : 0;
            const hasHadIncidentAlready = (trip.eventLogs || []).some((log) => log.includes('[INCIDENT]') || log.includes('[ACCIDENT]'));

            // 1. DOT Weigh Station Roadside Inspection (Triggered along highway routes between 25% and 65% progress)
            const inspectionEventActive = updatedEvents.some((e) => e.type === 'dot_safety_blitz');
            const inspectionChance = inspectionEventActive ? 0.012 : 0.003;
            if (!hasHadIncidentAlready && tripProgressFrac > 0.25 && tripProgressFrac < 0.65 && Math.random() < inspectionChance) {
              const brakesOk = (truck.subsystems.brakePads || 100) >= 55;
              const tiresOk = (truck.subsystems.steerTires?.wearPercentage || 100) >= 45;
              const noCriticalDtc = !truck.activeDTCs.some((d) => d.severity === 'critical');

              if (brakesOk && tiresOk && noCriticalDtc) {
                // Passed inspection with CVSA decal
                newNotifications.push({
                  id: `notif-dot-pass-${trip.id}-${Date.now()}`,
                  simTimeFormatted: timeFormatted,
                  title: '🟢 CVSA Weigh Station Inspection Passed',
                  message: `${truck.plate} passed Level 1 roadside safety inspection cleanly. Decal issued (+20 XP).`,
                  type: 'incident',
                  timestamp: Date.now(),
                });
                updatedPlayerXp += 20;
                updatedIncidents.unshift({
                  id: `inc-pass-${Date.now()}`,
                  simDay: currentDay,
                  simTimeFormatted: timeFormatted,
                  timestamp: Date.now(),
                  severity: 'minor_incident',
                  title: 'Clean DOT Safety Inspection',
                  type: 'dot_inspection_clean',
                  truckId: truck.id,
                  truckPlate: truck.plate,
                  truckModelName: model.name,
                  driverId: driver.id,
                  driverName: driver.name,
                  corridorName: trip.corridor.name,
                  locationKm: Math.round(trip.progressKm),
                  weatherCondition: weather.type,
                  rootCause: 'Passed comprehensive brake, tire tread, and logbook CVSA Level 1 inspection with zero defects.',
                  directCostUsd: 0,
                  insuranceClaimUsd: 0,
                  netExpenseUsd: 0,
                  downtimeMinutes: 15,
                  isResolved: true,
                });
                trip.eventLogs = [...(trip.eventLogs || []), `[${timeFormatted}] [INCIDENT] Passed DOT roadside safety inspection cleanly (+20 XP)`];
              } else {
                // Out-of-service citation!
                const fine = 1250;
                currentBalance -= fine;
                newLedgerEntries.push({
                  id: `led-dot-cite-${trip.id}-${Date.now()}`,
                  simDay: currentDay,
                  simTimeFormatted: timeFormatted,
                  type: 'broker_fee',
                  description: `DOT Highway Safety Out-of-Service citation for ${truck.plate}`,
                  amountUsd: -fine,
                  runningBalanceUsd: currentBalance,
                });
                newNotifications.push({
                  id: `notif-dot-fail-${trip.id}-${Date.now()}`,
                  simTimeFormatted: timeFormatted,
                  title: '⚠️ DOT Highway Inspection Citation',
                  message: `Inspection violation on ${truck.plate} for degraded brakes/tires. Fined $${fine.toLocaleString()} USD and delayed 45 minutes.`,
                  type: 'incident',
                  timestamp: Date.now(),
                });
                updatedIncidents.unshift({
                  id: `inc-fail-${Date.now()}`,
                  simDay: currentDay,
                  simTimeFormatted: timeFormatted,
                  timestamp: Date.now(),
                  severity: 'moderate_delay',
                  title: 'DOT Inspection Citation & Brake Adjustment',
                  type: 'dot_inspection_citation',
                  truckId: truck.id,
                  truckPlate: truck.plate,
                  truckModelName: model.name,
                  driverId: driver.id,
                  driverName: driver.name,
                  corridorName: trip.corridor.name,
                  locationKm: Math.round(trip.progressKm),
                  weatherCondition: weather.type,
                  rootCause: `Safety defect identified: degraded brake pads (${Math.round(truck.subsystems.brakePads || 0)}%) or worn tires below CVSA minimums.`,
                  directCostUsd: fine,
                  insuranceClaimUsd: 0,
                  netExpenseUsd: fine,
                  downtimeMinutes: 45,
                  isResolved: true,
                  citationDetails: '49 CFR § 393 - Brake system out of adjustment violation issued.',
                });
                trip.eventLogs = [...(trip.eventLogs || []), `[${timeFormatted}] [INCIDENT] DOT roadside inspection citation (-$${fine})`];
              }
            }

            // 2. Severe Highway Accident Risk (Jackknife or Collision)
            const isHazardousRoad = weather.roadFrictionCoeff < 0.45 || Math.abs(gradePct) > 3.5;
            const highSpeed = trip.telemetry.currentSpeedKmh > 75;
            const lackEquipment = !truck.hasRetarder && (truck.subsystems.brakePads || 100) < 45;
            const driverExhausted = driver.stats.fatiguePercent > 70;
            const accidentMulti = updatedEvents.reduce((acc, ev) => acc * (ev.accidentRiskMultiplier || 1), 1);

            if (!hasHadIncidentAlready && isHazardousRoad && (lackEquipment || driverExhausted) && Math.random() < 0.003 * accidentMulti) {
              isBreakdown = true;
              const directDamageCost = 9500;
              const deductible = updatedInsurance.deductibleUsd;
              const claimable = Math.max(0, directDamageCost - deductible);
              const insurancePayout = Math.round(claimable * (updatedInsurance.coverageRatioPercent / 100));
              const netLoss = directDamageCost - insurancePayout;

              currentBalance -= netLoss;
              updatedInsurance = {
                ...updatedInsurance,
                claimsPaidTotalUsd: updatedInsurance.claimsPaidTotalUsd + insurancePayout,
              };

              newLedgerEntries.push({
                id: `led-acc-${trip.id}-${Date.now()}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                type: 'breakdown_recovery',
                description: `Accident damage & heavy recovery net expense for ${truck.plate} (Insurance covered +$${insurancePayout.toLocaleString()})`,
                amountUsd: -netLoss,
                runningBalanceUsd: currentBalance,
              });

              newNotifications.push({
                id: `notif-acc-${trip.id}-${Date.now()}`,
                simTimeFormatted: timeFormatted,
                title: '🚨 Severe Highway Incident: Jackknife Accident',
                message: `${truck.plate} lost traction on ${trip.corridor.name}. Guardrail impact sustained. Commercial insurance covered $${insurancePayout.toLocaleString()} (Net loss: $${netLoss.toLocaleString()}).`,
                type: 'accident',
                timestamp: Date.now(),
              });

              updatedIncidents.unshift({
                id: `acc-${Date.now()}`,
                simDay: currentDay,
                simTimeFormatted: timeFormatted,
                timestamp: Date.now(),
                severity: 'severe_accident',
                title: 'Corridor Jackknife & Guardrail Collision',
                type: 'jackknife_accident',
                truckId: truck.id,
                truckPlate: truck.plate,
                truckModelName: model.name,
                driverId: driver.id,
                driverName: driver.name,
                corridorName: trip.corridor.name,
                locationKm: Math.round(trip.progressKm),
                weatherCondition: weather.type,
                rootCause: `Loss of vehicle directional control on ${weather.type} road (friction ${weather.roadFrictionCoeff}). Compounded by brake fade and lack of retarder on ${gradePct.toFixed(1)}% grade.`,
                directCostUsd: directDamageCost,
                insuranceClaimUsd: insurancePayout,
                netExpenseUsd: netLoss,
                downtimeMinutes: 180,
                isResolved: false,
              });

              trip.eventLogs = [...(trip.eventLogs || []), `[${timeFormatted}] [ACCIDENT] Severe jackknife accident on ${trip.corridor.name}`];
            }

            // Advance Driver Tachograph
            continuousMins += deltaSimMinutes;
            dailyMins += deltaSimMinutes;

            // Tachograph rule: If continuous >= 480 (8h), trigger mandatory 30 min rest
            if (continuousMins >= 480) {
              isResting = true;
              currentRestMins = 30;
              continuousMins = 0; // Reset continuous drive timer so it doesn't repeatedly trigger
              newNotifications.push({
                id: `notif-tach-rest-${trip.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: 'Tachograph Mandatory Rest (8h limit)',
                message: `${driver.name} pulled into highway rest bay for 30-minute mandatory break.`,
                type: 'driver',
                timestamp: Date.now(),
              });
            } else if (dailyMins >= 720) {
              // Daily 12h drive limit -> 6h (360 min) sleeper rest
              isResting = true;
              currentRestMins = 360;
              dailyMins = 0;
              continuousMins = 0;
              newNotifications.push({
                id: `notif-daily-rest-${trip.id}-${newSimMinutes}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                simTimeFormatted: timeFormatted,
                title: 'Mandatory Daily Sleeper Rest (12h Drive Cap)',
                message: `${driver.name} concluded 12h shift. Truck parked in truck stop for 6h rest cycle.`,
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
            const commMultiplier = getCommercialPayoutMultiplier(finished.truckId, finished.trailerId, updatedTrucks);
            const adjPayout = Math.round(finished.contract.payoutUsd * commMultiplier);
            const adjBonus = Math.round(finished.contract.bonusOnTimeUsd * commMultiplier);
            const adjPenalty = Math.round(finished.contract.penaltyLateUsd * commMultiplier);
            const grossPayout = adjPayout + (isOnTime ? adjBonus : -adjPenalty);
            const finalRevenue = Math.max(0, grossPayout);

            // Driver distance wage
            const driverWage = finished.totalDistanceKm * (prevState.drivers.find((d) => d.id === finished.driverId)?.wagePerKmUsd || 0.45);
            // Tolls
            const tolls = finished.corridor.tollCostUsd;

            currentBalance += finalRevenue - driverWage - tolls;
            updatedCargoTons += finished.contract.weightTons;

            // XP and Rank Promotion
            const earnedXp = Math.max(10, Math.round(finished.totalDistanceKm * 0.08 + finished.contract.weightTons * 2));
            updatedPlayerXp += earnedXp;

            for (const tier of RANK_TIERS) {
              if (updatedPlayerXp >= tier.xpRequired && tier.rank > updatedPlayerRank) {
                updatedPlayerRank = tier.rank;
                updatedRankTitle = tier.title;
                updatedGold += 5;
                newNotifications.push({
                  id: `notif-rank-${tier.rank}-${newSimMinutes}-${Date.now()}`,
                  simTimeFormatted: timeFormatted,
                  title: `🪙 PROMOTED: ${tier.title.toUpperCase()} (Rank ${tier.rank})`,
                  message: `Carrier reputation elevated to Rank ${tier.rank} (${tier.title}). Earned +5 Gold and unlocked new trade corridors!`,
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
                    assignedTruckId: null,
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

          // Replenish fatigue & drive limits for drivers not currently on active trips
          const activeTripDriverIds = new Set(remainingTrips.map((t) => t.driverId));
          updatedDrivers = updatedDrivers.map((d) => {
            if (activeTripDriverIds.has(d.id)) return d;
            const nextContinuous = Math.max(0, d.continuousDriveMinutes - deltaSimMinutes * 4);
            const nextDaily = Math.max(0, d.dailyDriveMinutes - deltaSimMinutes * 4);
            const nextRest = Math.max(0, d.currentRestMinutesRemaining - deltaSimMinutes * 2);
            const nextHos = nextRest <= 0 ? 'off_duty' : d.hosStatus;
            return {
              ...d,
              continuousDriveMinutes: nextContinuous,
              dailyDriveMinutes: nextDaily,
              currentRestMinutesRemaining: nextRest,
              hosStatus: nextHos,
            };
          });

          // Process AI Fleet Maintenance Add-on
          const maintResult = processAiFleetMaintenance(
            {
              ...prevState,
              balanceUsd: currentBalance,
              trucks: updatedTrucks,
              simTimeMinutes: newSimMinutes,
            },
            deltaSimMinutes
          );
          currentBalance = maintResult.updatedBalance;
          updatedTrucks = maintResult.updatedTrucks;
          if (maintResult.newLedgerEntries.length > 0) {
            newLedgerEntries.push(...maintResult.newLedgerEntries);
          }
          if (maintResult.newNotifications.length > 0) {
            uniqueNotifications.unshift(...maintResult.newNotifications);
          }

          let baseSimState = {
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
            gold: updatedGold,
            goldMarket: updatedGoldMarket,
            insurancePolicy: updatedInsurance,
            activeEvents: updatedEvents,
            incidentHistory: updatedIncidents,
          };

          // Autonomous AI Auto-Dispatch: Automatically and continuously dispatches idle trucks and ready drivers to available freight jobs
          const isAiDispatcherSubActive = baseSimState.aiDispatcherActive && baseSimState.simTimeMinutes < baseSimState.aiSubscriptionExpiresSimMinutes;
          const isAiAddonActive = baseSimState.aiOfflineDispatchActive && baseSimState.simTimeMinutes < baseSimState.aiOfflineDispatchExpiresSimMinutes;
          const isAiAutoDispatchActive = (isAiDispatcherSubActive || isAiAddonActive) && (baseSimState.aiAutoDispatchEnabled !== false);

          if (isAiAutoDispatchActive) {
            const hasIdleTrucks = baseSimState.trucks.some((t) => t.status === 'idle');
            const hasReadyDrivers = baseSimState.drivers.some((d) => d.hosStatus !== 'driving' && d.hosStatus !== 'resting');
            if (hasIdleTrucks && hasReadyDrivers) {
              const { nextState: autoDispatchedState } = runAutoDispatchOnState(baseSimState);
              baseSimState = autoDispatchedState;
            }
          }

          return baseSimState;
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [state.simSpeed]);

  // Actions
  const setSimSpeed = (speed: 0 | 1) => {
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

    // Pre-dispatch refueling check & auto-bunker from stationed hub
    const truckHub = state.hubs.find((h) => h.id === truck.currentHubId);
    const truckModelSpec = TRUCK_MODELS.find((m) => m.id === truck.modelId);
    let finalFuelLiters = truck.fuelCurrentLiters;
    let hubRefuelCost = 0;
    let hubBulkUsed = 0;

    if (truckModelSpec && truckHub) {
      const maxCap = truckModelSpec.specs.fuelTankCapacityLiters;
      if (finalFuelLiters < maxCap) {
        const needed = maxCap - finalFuelLiters;
        const availableHubFuel = truckHub.bulkFuelStockLiters;
        if (availableHubFuel > 0) {
          const toPump = Math.min(needed, availableHubFuel);
          hubRefuelCost = Math.round(toPump * truckHub.fuelPricePerLiter);
          if (state.balanceUsd >= hubRefuelCost) {
            finalFuelLiters += toPump;
            hubBulkUsed = toPump;
          } else {
            notifyUser('Insufficient Treasury', `Pre-dispatch bunkering at ${truckHub.name} requires $${hubRefuelCost.toLocaleString()} USD.`, 'finance');
            return false;
          }
        } else if (finalFuelLiters < 80) {
          notifyUser('Station Depot Empty', `Station ${truckHub.name} has no bulk fuel. Truck departed with ${Math.round(finalFuelLiters)}L and will purchase emergency fuel on the roadside if required.`, 'maintenance');
        }
      }
    }

    if (finalFuelLiters < 60) {
      notifyUser('Low Fuel Warning', `Truck ${truck.plate} has low fuel (${Math.round(finalFuelLiters)}L).`, 'maintenance');
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

    setState((prev) => {
      const simDay = Math.floor(prev.simTimeMinutes / 1440) + 1;
      const nextBalance = prev.balanceUsd - hubRefuelCost;
      const newLedgerEntries = hubRefuelCost > 0 ? [
        {
          id: `led-refuel-disp-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'fuel_expense' as const,
          description: `Pre-dispatch bunkering: ${Math.round(hubBulkUsed)}L diesel at ${truckHub?.name || 'Hub'}`,
          amountUsd: -hubRefuelCost,
          runningBalanceUsd: nextBalance,
        },
        ...prev.ledger,
      ] : prev.ledger;

      return {
        ...prev,
        balanceUsd: nextBalance,
        hubs: hubBulkUsed > 0 && truckHub ? prev.hubs.map((h) => h.id === truckHub.id ? { ...h, bulkFuelStockLiters: Math.max(0, h.bulkFuelStockLiters - hubBulkUsed) } : h) : prev.hubs,
        availableContracts: prev.availableContracts.filter((c) => c.id !== contractId),
        activeTrips: [...prev.activeTrips, newTrip],
        trucks: prev.trucks.map((t) => (t.id === truckId ? { ...t, status: 'en_route', activeTripId: newTripId, fuelCurrentLiters: finalFuelLiters, assignedTrailerId: trailerId || t.assignedTrailerId } : t)),
        trailers: trailerId
          ? prev.trailers.map((tr) => (tr.id === trailerId ? { ...tr, status: 'en_route', assignedTruckId: truckId, assignedTripId: newTripId } : tr))
          : prev.trailers,
        drivers: prev.drivers.map((d) => (d.id === driverId ? { ...d, hosStatus: 'driving', assignedTruckId: truckId } : d)),
        ledger: newLedgerEntries,
        notifications: deduplicateNotifications([
          {
            id: `notif-disp-${newTripId}-${Date.now()}`,
            simTimeFormatted: `Day ${Math.floor(prev.simTimeMinutes / 1440) + 1}`,
            title: 'Haul Dispatched',
            message: `${contract.title} dispatched via ${corridor.name} with truck ${truck.plate}${hubBulkUsed > 0 ? ` (bunkered ${Math.round(hubBulkUsed)}L)` : ''} & driver ${driver.name}.`,
            type: 'delivery',
            timestamp: Date.now(),
          },
          ...prev.notifications,
        ]),
      };
    });

    return true;
  };

  const changeTruckTireCompound = (truckId: string, compound: 'highway_eco' | 'all_weather' | 'severe_snow'): boolean => {
    const truck = state.trucks.find(t => t.id === truckId);
    if (!truck || truck.status === 'en_route') {
      notifyUser('Vehicle In Transit', 'Truck is currently en route. Tire compound changes must be done while idle at a terminal.', 'maintenance');
      return false;
    }

    const cost = compound === 'severe_snow' ? 1500 : compound === 'all_weather' ? 800 : 500;
    if (state.balanceUsd < cost) {
      notifyUser('Insufficient Treasury', `Tire compound upgrade requires $${cost.toLocaleString()}. Available: $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const hours = Math.floor((state.simTimeMinutes % 1440) / 60);
    const mins = state.simTimeMinutes % 60;
    const timeFormatted = `Day ${simDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const newBal = state.balanceUsd - cost;

    setState(prev => ({
      ...prev,
      balanceUsd: newBal,
      trucks: prev.trucks.map(t => t.id === truckId ? { ...t, tireCompound: compound } : t),
      ledger: [
        {
          id: `led-tire-${Date.now()}`,
          simDay,
          simTimeFormatted: timeFormatted,
          type: 'maintenance_expense',
          description: `Tire compound refit (${compound.replace('_', ' ' )}) for ${truck.plate}`,
          amountUsd: -cost,
          runningBalanceUsd: newBal,
        },
        ...prev.ledger,
      ],
      notifications: [
        {
          id: `notif-tire-${Date.now()}`,
          simTimeFormatted: timeFormatted,
          title: '🛞 Tire Compound Refit Completed',
          message: `Successfully refitted ${truck.plate} with ${compound.replace('_', ' ')} tires (-$${cost.toLocaleString()}).`,
          type: 'maintenance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ],
    }));

    notifyUser('Tire Refit Successful', `Fitted with ${compound.replace('_', ' ')} tires ($${cost.toLocaleString()} paid).`, 'maintenance');
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

  const clearDTCs = (truckId: string) => {
    setState((prev) => ({
      ...prev,
      trucks: prev.trucks.map((t) => (t.id === truckId ? { ...t, activeDTCs: [] } : t)),
    }));
    notifyUser('ECU Diagnostics Reset', 'All stored OBD-II Diagnostic Trouble Codes cleared from truck memory.', 'maintenance');
  };

  const repairSubsystem = (
    truckId: string,
    componentKey: 'engine' | 'turbo' | 'transmission' | 'clutch' | 'brakes' | 'cooling' | 'suspension' | 'emissions' | 'steerTires' | 'driveTires'
  ): boolean => {
    const truck = state.trucks.find((t) => t.id === truckId);
    if (!truck) return false;
    if (truck.status === 'en_route') {
      notifyUser('Vehicle In Transit', 'Truck is currently en-route on a commercial haul. Repairs must be scheduled at a terminal bay.', 'maintenance');
      return false;
    }

    const costs: Record<string, { cost: number; title: string }> = {
      engine: { cost: 1200, title: 'Engine Cylinders & Head Recondition' },
      turbo: { cost: 1650, title: 'Turbocharger VGT Actuator Replacement' },
      transmission: { cost: 1400, title: 'Transmission Synchronizer Service' },
      clutch: { cost: 950, title: 'Heavy Clutch Plate Replacement' },
      brakes: { cost: 850, title: 'Ceramic Brake Pads & Rotor Resurfacing' },
      cooling: { cost: 650, title: 'Radiator Flush & Water Pump Replacement' },
      suspension: { cost: 950, title: 'Pneumatic Air Suspension Bellows' },
      emissions: { cost: 1100, title: 'DPF Soot Burn & SCR Catalyst Regeneration' },
      steerTires: { cost: 1100, title: 'Steer Axle Commercial Tire Set (16mm)' },
      driveTires: { cost: 1500, title: 'Drive Axle Dual Tire Set (16mm)' },
    };

    const target = costs[componentKey];
    if (!target) return false;

    // Apply hub workshop discount if applicable
    const hub = state.hubs.find((h) => h.id === truck.currentHubId);
    let finalCost = target.cost;
    if (hub?.workshopLevel === 2) finalCost = Math.round(target.cost * 0.9);
    if (hub?.workshopLevel === 3) finalCost = Math.round(target.cost * 0.8);

    if (state.balanceUsd < finalCost) {
      notifyUser('Insufficient Treasury', `Repair requires $${finalCost.toLocaleString()}, but company balance is $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - finalCost;

    setState((prev) => {
      const currentTruck = prev.trucks.find((t) => t.id === truckId);
      if (!currentTruck) return prev;

      const sub = { ...currentTruck.subsystems };
      switch (componentKey) {
        case 'engine':
          sub.engineBlock = 100;
          break;
        case 'turbo':
          sub.turbocharger = 100;
          break;
        case 'transmission':
          sub.transmission = 100;
          break;
        case 'clutch':
          sub.clutchPlate = 100;
          break;
        case 'brakes':
          sub.brakePads = 100;
          sub.brakeRotors = 100;
          break;
        case 'cooling':
          sub.coolingSystem = 100;
          break;
        case 'suspension':
          sub.suspensionDampers = 100;
          break;
        case 'emissions':
          sub.exhaustAftertreatment = 100;
          break;
        case 'steerTires':
          sub.steerTires = {
            ...sub.steerTires,
            wearPercentage: 100,
            treadDepthMm: 16.0,
            pressurePsi: 110,
          };
          break;
        case 'driveTires':
          sub.driveTiresAxle1 = {
            ...sub.driveTiresAxle1,
            wearPercentage: 100,
            treadDepthMm: 16.0,
            pressurePsi: 105,
          };
          break;
      }

      const updatedDTCs = currentTruck.activeDTCs.filter((dtc) => {
        if (componentKey === 'turbo' && dtc.code === 'P0299') return false;
        if (componentKey === 'brakes' && (dtc.code === 'C1095' || dtc.code === 'B0882')) return false;
        if (componentKey === 'steerTires' && dtc.code === 'T0411') return false;
        return true;
      });

      return {
        ...prev,
        balanceUsd: nextBal,
        trucks: prev.trucks.map((t) =>
          t.id === truckId
            ? {
                ...t,
                subsystems: sub,
                activeDTCs: updatedDTCs,
              }
            : t
        ),
        ledger: [
          {
            id: `led-rep-${Date.now()}`,
            simDay,
            simTimeFormatted: `Day ${simDay}`,
            type: 'maintenance_expense',
            description: `${target.title} for ${currentTruck.plate}`,
            amountUsd: -finalCost,
            runningBalanceUsd: nextBal,
          },
          ...prev.ledger,
        ],
        notifications: deduplicateNotifications([
          {
            id: `notif-rep-${Date.now()}`,
            simTimeFormatted: `Day ${simDay}`,
            title: 'Subsystem Repaired',
            message: `${target.title} completed for ${currentTruck.plate} ($${finalCost.toLocaleString()}).`,
            type: 'maintenance',
            timestamp: Date.now(),
          },
          ...prev.notifications,
        ]),
      };
    });

    return true;
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
      fuelCurrentLiters: model.specs.fuelTankCapacityLiters * 0.5,
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
      fuelCurrentLiters: model.specs.fuelTankCapacityLiters * 0.5,
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
      contractDaysRemaining: 45,
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
    const targetDriver = state.drivers.find(d => d.id === driverId);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      playerXp: prev.playerXp + 250,
      drivers: prev.drivers.map((d) => {
        if (d.id !== driverId) return d;
        const newStats = { ...d.stats };
        if (certType === 'mountain') newStats.mountainCert = true;
        if (certType === 'winter') newStats.winterCert = true;
        if (certType === 'hazmat') newStats.hazmatCert = true;
        if (certType === 'eco') newStats.ecoDrivingRating = Math.min(100, newStats.ecoDrivingRating + 12);
        return { 
          ...d, 
          stats: newStats,
          contractDaysRemaining: (d.contractDaysRemaining || 45) + 30 
        };
      }),
      ledger: [
        {
          id: `led-cert-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'driver_wages',
          description: `Advanced driver accreditation & badge (${certType}) + 30d contract extension`,
          amountUsd: -cost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-train-${driverId}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '🏅 Staff Accreditation & Contract Extended',
          message: `${targetDriver?.name || 'Driver'} completed ${certType} training course, received professional badge, and employment contract was automatically extended by +30 days (+250 XP company reputation).`,
          type: 'driver',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const renewDriverContract = (driverId: string): boolean => {
    const cost = 1200;
    if (state.balanceUsd < cost) {
      notifyUser('Insufficient Funds', `Insufficient funds to renew driver contract ($${cost.toLocaleString()}).`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - cost;
    const targetDriver = state.drivers.find((d) => d.id === driverId);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      playerXp: prev.playerXp + 50,
      drivers: prev.drivers.map((d) => (d.id === driverId ? { ...d, contractDaysRemaining: (d.contractDaysRemaining || 45) + 30 } : d)),
      ledger: [
        {
          id: `led-renew-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'driver_wages',
          description: `Contract renewal fee (+30 days): ${targetDriver?.name || 'Driver'}`,
          amountUsd: -cost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-renew-${driverId}-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '📜 Employment Contract Renewed',
          message: `Employment contract for ${targetDriver?.name || 'Driver'} successfully extended by +30 simulation days (+50 XP).`,
          type: 'driver',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
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

  const transferFuelBetweenHubs = (sourceHubId: string, destHubId: string, liters: number): boolean => {
    if (sourceHubId === destHubId || liters <= 0) return false;
    const srcHub = state.hubs.find((h) => h.id === sourceHubId);
    const dstHub = state.hubs.find((h) => h.id === destHubId);
    if (!srcHub || !dstHub) return false;

    if (srcHub.bulkFuelStockLiters < liters) {
      notifyUser('Insufficient Bulk Fuel', `Source hub ${srcHub.name} only has ${Math.round(srcHub.bulkFuelStockLiters)}L available for transfer.`, 'maintenance');
      return false;
    }

    const availableSpace = dstHub.bulkFuelCapacityLiters - dstHub.bulkFuelStockLiters;
    const toTransfer = Math.min(liters, availableSpace);
    if (toTransfer <= 0) {
      notifyUser('Destination Depot Full', `Destination hub ${dstHub.name} bulk fuel storage is at maximum capacity.`, 'maintenance');
      return false;
    }

    const transportCost = Math.round(toTransfer * 0.08);
    if (state.balanceUsd < transportCost) {
      notifyUser('Insufficient Treasury', `Fuel transfer logistics cost requires $${transportCost.toLocaleString()} USD.`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - transportCost;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      hubs: prev.hubs.map((h) => {
        if (h.id === sourceHubId) {
          return { ...h, bulkFuelStockLiters: h.bulkFuelStockLiters - toTransfer };
        }
        if (h.id === destHubId) {
          return { ...h, bulkFuelStockLiters: h.bulkFuelStockLiters + toTransfer };
        }
        return h;
      }),
      ledger: [
        {
          id: `led-fuel-transfer-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'fuel_expense',
          description: `Transferred ${Math.round(toTransfer)}L fuel from ${srcHub.name} to ${dstHub.name}`,
          amountUsd: -transportCost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-fuel-transfer-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '⛽ Bulk Fuel Transfer Completed',
          message: `Successfully transferred ${Math.round(toTransfer)}L diesel from ${srcHub.name} to ${dstHub.name} (-$${transportCost.toLocaleString()} USD transport fee).`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    notifyUser('Fuel Transferred Successfully', `Transferred ${Math.round(toTransfer)}L diesel from ${srcHub.name} to ${dstHub.name}!`, 'delivery');
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

  const claimGrant = (amount: number, description: string, grantId?: string) => {
    if (grantId && state.claimedGrantIds?.includes(grantId)) {
      notifyUser('Already Claimed', 'This subsidy tier has already been claimed.', 'maintenance');
      return;
    }
    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    setState((prev) => ({
      ...prev,
      balanceUsd: prev.balanceUsd + amount,
      claimedGrantIds: grantId ? Array.from(new Set([...(prev.claimedGrantIds || []), grantId])) : (prev.claimedGrantIds || []),
      ledger: [
        {
          id: `led-grant-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'freight_revenue',
          description,
          amountUsd: amount,
          runningBalanceUsd: prev.balanceUsd + amount,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-grant-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: 'Government Subsidy Granted',
          message: `${description}: $${amount.toLocaleString()} credited to corporate treasury.`,
          type: 'delivery',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));
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

  const buyGold = (amount: number): boolean => {
    if (amount <= 0) return false;
    const spot = state.goldMarket?.spotPriceUsd || 2540;
    const fee = state.goldMarket?.brokerFeePercent || 1.5;
    const unitPrice = Math.round(spot * (1 + fee / 100));
    const totalCost = unitPrice * amount;

    if (state.balanceUsd < totalCost) {
      notifyUser('Insufficient Treasury', `Purchasing ${amount} Gold requires $${totalCost.toLocaleString()} USD. Treasury: $${state.balanceUsd.toLocaleString()} USD.`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - totalCost;
    const nextGold = state.gold + amount;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      gold: nextGold,
      goldMarket: {
        ...prev.goldMarket,
        totalGoldReserveUsd: nextGold * (prev.goldMarket?.spotPriceUsd || spot),
      },
      ledger: [
        {
          id: `led-gold-buy-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'equipment_purchase',
          description: `Acquired ${amount} Troy Ounces Gold Bullion at $${unitPrice.toLocaleString()}/oz (${fee}% spread)`,
          amountUsd: -totalCost,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-gold-buy-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '🪙 Gold Bullion Acquired',
          message: `Acquired ${amount} Troy Ounces of allocated Gold (+${amount} Gold, -$${totalCost.toLocaleString()} USD).`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const sellGold = (amount: number): boolean => {
    if (amount <= 0 || state.gold < amount) {
      notifyUser('Insufficient Gold', `You hold ${state.gold} Gold. Cannot sell ${amount}.`, 'finance');
      return false;
    }
    const spot = state.goldMarket?.spotPriceUsd || 2540;
    const fee = state.goldMarket?.brokerFeePercent || 1.5;
    const unitProceeds = Math.round(spot * (1 - fee / 100));
    const totalProceeds = unitProceeds * amount;

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd + totalProceeds;
    const nextGold = state.gold - amount;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      gold: nextGold,
      goldMarket: {
        ...prev.goldMarket,
        totalGoldReserveUsd: nextGold * (prev.goldMarket?.spotPriceUsd || spot),
      },
      ledger: [
        {
          id: `led-gold-sell-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'freight_revenue',
          description: `Liquidated ${amount} Troy Ounces Gold Bullion for working capital at $${unitProceeds.toLocaleString()}/oz`,
          amountUsd: totalProceeds,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-gold-sell-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '💵 Gold Reserves Liquidated',
          message: `Liquidated ${amount} Troy Ounces of Gold (-${amount} Gold, +$${totalProceeds.toLocaleString()} USD).`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
  };

  const upgradeInsurancePolicy = (tier: 'basic_liability' | 'comprehensive_fleet' | 'platinum_umbrella'): boolean => {
    const tiers = {
      basic_liability: {
        tierName: 'Basic Carrier Liability Policy',
        deductibleUsd: 5000,
        coverageRatioPercent: 70,
        dailyPremiumUsd: 50,
      },
      comprehensive_fleet: {
        tierName: 'Comprehensive Commercial Fleet Policy',
        deductibleUsd: 2500,
        coverageRatioPercent: 85,
        dailyPremiumUsd: 120,
      },
      platinum_umbrella: {
        tierName: 'Platinum Umbrella Motor Carrier Policy',
        deductibleUsd: 1000,
        coverageRatioPercent: 95,
        dailyPremiumUsd: 280,
      },
    };

    const cfg = tiers[tier];
    if (!cfg) return false;

    setState((prev) => ({
      ...prev,
      insurancePolicy: {
        ...prev.insurancePolicy,
        policyTier: tier,
        tierName: cfg.tierName,
        deductibleUsd: cfg.deductibleUsd,
        coverageRatioPercent: cfg.coverageRatioPercent,
        dailyPremiumUsd: cfg.dailyPremiumUsd,
      },
      notifications: deduplicateNotifications([
        {
          id: `notif-ins-up-${Date.now()}`,
          simTimeFormatted: `Day ${Math.floor(prev.simTimeMinutes / 1440) + 1}`,
          title: '🛡️ Commercial Insurance Underwritten',
          message: `Updated fleet policy to ${cfg.tierName} (${cfg.coverageRatioPercent}% collision/incident coverage, $${cfg.deductibleUsd} deductible).`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    notifyUser('Policy Updated', `Fleet now covered by ${cfg.tierName}.`, 'finance');
    return true;
  };

  const fileInsuranceClaim = (incidentId: string): boolean => {
    const inc = state.incidentHistory?.find((i) => i.id === incidentId);
    if (!inc || inc.isResolved || inc.directCostUsd <= 0) return false;

    const policy = state.insurancePolicy || {
      coverageRatioPercent: 85,
      deductibleUsd: 2500,
    };

    const claimable = Math.max(0, inc.directCostUsd - policy.deductibleUsd);
    const payout = Math.round(claimable * (policy.coverageRatioPercent / 100));

    if (payout <= 0) {
      notifyUser('Under Deductible', `Incident damages ($${inc.directCostUsd.toLocaleString()}) are below deductible ($${policy.deductibleUsd.toLocaleString()}).`, 'finance');
      return false;
    }

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd + payout;

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      insurancePolicy: {
        ...prev.insurancePolicy,
        claimsPaidTotalUsd: prev.insurancePolicy.claimsPaidTotalUsd + payout,
      },
      incidentHistory: prev.incidentHistory.map((i) => (i.id === incidentId ? {
        ...i,
        insuranceClaimUsd: payout,
        netExpenseUsd: i.directCostUsd - payout,
        isResolved: true,
      } : i)),
      ledger: [
        {
          id: `led-claim-${Date.now()}`,
          simDay,
          simTimeFormatted: `Day ${simDay}`,
          type: 'freight_revenue',
          description: `Commercial insurance indemnity settlement: ${inc.title} (${inc.truckPlate})`,
          amountUsd: payout,
          runningBalanceUsd: nextBal,
        },
        ...prev.ledger,
      ],
      notifications: deduplicateNotifications([
        {
          id: `notif-claim-${Date.now()}`,
          simTimeFormatted: `Day ${simDay}`,
          title: '🛡️ Insurance Settlement Disbursed',
          message: `Commercial underwriter disbursed +$${payout.toLocaleString()} USD for ${inc.title}.`,
          type: 'finance',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ]),
    }));

    return true;
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
    const isRigid = starterTruckModel.isRigid;
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
      assignedTrailerId: isRigid ? null : 'trl-01',
      serviceDueKm: 50000,
    };

    const initialTrailers: TrailerInstance[] = isRigid ? [] : [
      {
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
      },
    ];

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
      trailers: initialTrailers,
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

    const goldFee = Math.max(2, Math.round(estDistance / 500));
    if (state.gold < goldFee) {
      notifyUser(
        'Insufficient Gold Reserves',
        `Connecting corridor requires ${goldFee} Gold. Enterprise currently holds ${state.gold} Gold.`,
        'finance'
      );
      return false;
    }

    const forwardRouteId = `route-${hubA.code.toLowerCase()}-${hubB.code.toLowerCase()}`;
    const reverseRouteId = `route-${hubB.code.toLowerCase()}-${hubA.code.toLowerCase()}`;
    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const nextBal = state.balanceUsd - licenseFeeUsd;
    const nextGold = state.gold - goldFee;

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
      goldCost: goldFee,
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
      goldCost: goldFee,
      requiredRank,
      trafficRateScore: Math.round((hubA.trafficDemandScore + hubB.trafficDemandScore) / 2),
    };

    const updatedRoutes = [...state.routes, newForwardRoute, newReverseRoute];
    const newContracts = generateContractsForRoutes([newForwardRoute, newReverseRoute], state.hubs, 4);

    setState((prev) => ({
      ...prev,
      balanceUsd: nextBal,
      gold: nextGold,
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

  const dismissOfflineProgress = () => {
    setState((prev) => ({
      ...prev,
      offlineProgress: null,
      lastRealTimeTimestamp: Date.now(),
    }));
  };

  const resetGame = () => {
    try {
      clearPhoneDb();
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

  const activateAiSuite = (options: {
    planTier: '7d' | '1m' | 'auto' | 'year';
    includeMaintenance: boolean;
    includeOfflineDispatch: boolean;
    useGold: boolean;
    autoRenew: boolean;
    allowExtension?: boolean;
  }): boolean => {
    const plans = {
      '7d': { days: 7, usd: 45000, gold: 40, label: '7-Day Express License' },
      '1m': { days: 30, usd: 165000, gold: 120, label: '1-Month Corporate License' },
      'auto': { days: 30, usd: 145000, gold: 100, label: 'Monthly Auto-Renewal Enterprise' },
      'year': { days: 365, usd: 950000, gold: 650, label: '1-Year Annual Fleet License' },
    };
    const maintPlans = {
      '7d': { usd: 25000, gold: 20 },
      '1m': { usd: 85000, gold: 60 },
      'auto': { usd: 75000, gold: 50 },
      'year': { usd: 550000, gold: 400 },
    };
    const offlineDispatchPlans = {
      '7d': { usd: 25000, gold: 20 },
      '1m': { usd: 85000, gold: 60 },
      'auto': { usd: 75000, gold: 50 },
      'year': { usd: 550000, gold: 400 },
    };

    const currentState = stateRef.current;
    const isAlreadySubscribed = currentState.aiDispatcherActive && currentState.simTimeMinutes < currentState.aiSubscriptionExpiresSimMinutes;
    if (isAlreadySubscribed && !options.allowExtension) {
      notifyUser('Active Subscription in Effect', `AI Dispatcher is already active until Day ${Math.floor(currentState.aiSubscriptionExpiresSimMinutes / 1440) + 1}. Multiple deductions prevented.`, 'maintenance');
      return false;
    }

    const plan = plans[options.planTier];
    const maint = options.includeMaintenance ? maintPlans[options.planTier] : { usd: 0, gold: 0 };
    const offline = options.includeOfflineDispatch ? offlineDispatchPlans[options.planTier] : { usd: 0, gold: 0 };
    const totalUsd = plan.usd + maint.usd + offline.usd;
    const totalGold = plan.gold + maint.gold + offline.gold;

    const simDay = Math.floor(currentState.simTimeMinutes / 1440) + 1;
    const timeFormatted = `Day ${simDay}`;
    const addonsSummary = `${options.includeMaintenance ? ' + Fleet Maintenance' : ''}${options.includeOfflineDispatch ? ' + Auto-Dispatch' : ''}`;

    if (options.useGold) {
      if (currentState.gold < totalGold) {
        notifyUser('Insufficient Gold', `AI Suite (${plan.label}${addonsSummary}) requires ${totalGold} Gold. You have ${currentState.gold}.`, 'finance');
        return false;
      }
      setState((prev) => {
        const baseTimeDisp = Math.max(prev.simTimeMinutes, prev.aiSubscriptionExpiresSimMinutes || 0);
        const baseTimeMaint = Math.max(prev.simTimeMinutes, prev.aiFleetMaintenanceExpiresSimMinutes || 0);
        const baseTimeOffline = Math.max(prev.simTimeMinutes, prev.aiOfflineDispatchExpiresSimMinutes || 0);
        const durationMins = plan.days * 1440;

        const nextState = {
          ...prev,
          gold: prev.gold - totalGold,
          aiDispatcherActive: true,
          aiSubscriptionExpiresSimMinutes: baseTimeDisp + durationMins,
          aiFleetMaintenanceActive: options.includeMaintenance ? true : prev.aiFleetMaintenanceActive,
          aiFleetMaintenanceExpiresSimMinutes: options.includeMaintenance ? baseTimeMaint + durationMins : prev.aiFleetMaintenanceExpiresSimMinutes,
          aiOfflineDispatchActive: options.includeOfflineDispatch ? true : prev.aiOfflineDispatchActive,
          aiOfflineDispatchExpiresSimMinutes: options.includeOfflineDispatch ? baseTimeOffline + durationMins : prev.aiOfflineDispatchExpiresSimMinutes,
          aiAutoRenew: options.autoRenew,
          aiAutoDispatchEnabled: true,
          notifications: deduplicateNotifications([
            {
              id: `notif-ai-suite-${Date.now()}`,
              simTimeFormatted: timeFormatted,
              title: isAlreadySubscribed ? '🤖 AI Suite License Extended' : '🤖 AI Suite & Add-on Activated',
              message: `Subscribed to ${plan.label}${addonsSummary} (-${totalGold} Gold). Auto-renew: ${options.autoRenew ? 'ON' : 'OFF'}.`,
              type: 'ai',
              timestamp: Date.now(),
            },
            ...prev.notifications,
          ]),
        };
        stateRef.current = nextState;
        return nextState;
      });
      return true;
    } else {
      if (currentState.balanceUsd < totalUsd) {
        notifyUser('Insufficient Treasury', `AI Suite costs $${totalUsd.toLocaleString()}. Available: $${currentState.balanceUsd.toLocaleString()}.`, 'finance');
        return false;
      }
      const nextBal = currentState.balanceUsd - totalUsd;
      setState((prev) => {
        const baseTimeDisp = Math.max(prev.simTimeMinutes, prev.aiSubscriptionExpiresSimMinutes || 0);
        const baseTimeMaint = Math.max(prev.simTimeMinutes, prev.aiFleetMaintenanceExpiresSimMinutes || 0);
        const baseTimeOffline = Math.max(prev.simTimeMinutes, prev.aiOfflineDispatchExpiresSimMinutes || 0);
        const durationMins = plan.days * 1440;

        const nextState = {
          ...prev,
          balanceUsd: nextBal,
          aiDispatcherActive: true,
          aiSubscriptionExpiresSimMinutes: baseTimeDisp + durationMins,
          aiFleetMaintenanceActive: options.includeMaintenance ? true : prev.aiFleetMaintenanceActive,
          aiFleetMaintenanceExpiresSimMinutes: options.includeMaintenance ? baseTimeMaint + durationMins : prev.aiFleetMaintenanceExpiresSimMinutes,
          aiOfflineDispatchActive: options.includeOfflineDispatch ? true : prev.aiOfflineDispatchActive,
          aiOfflineDispatchExpiresSimMinutes: options.includeOfflineDispatch ? baseTimeOffline + durationMins : prev.aiOfflineDispatchExpiresSimMinutes,
          aiAutoRenew: options.autoRenew,
          aiAutoDispatchEnabled: true,
          ledger: [
            {
              id: `led-ai-suite-${Date.now()}`,
              simDay,
              simTimeFormatted: timeFormatted,
              type: 'broker_fee' as const,
              description: `AI Suite Subscription (${plan.label}${addonsSummary})`,
              amountUsd: -totalUsd,
              runningBalanceUsd: nextBal,
            },
            ...prev.ledger,
          ],
          notifications: deduplicateNotifications([
            {
              id: `notif-ai-suite-${Date.now()}`,
              simTimeFormatted: timeFormatted,
              title: isAlreadySubscribed ? '🤖 AI Suite License Extended' : '🤖 AI Suite & Add-on Activated',
              message: `Subscribed to ${plan.label}${addonsSummary} (-$${totalUsd.toLocaleString()}). Auto-renew: ${options.autoRenew ? 'ON' : 'OFF'}.`,
              type: 'ai',
              timestamp: Date.now(),
            },
            ...prev.notifications,
          ]),
        };
        stateRef.current = nextState;
        return nextState;
      });
      return true;
    }
  };

  const activateAiFleetMaintenance = (tier: '7d' | '1m' | 'auto', useGold: boolean = false, allowExtension: boolean = false): boolean => {
    const tierConfig = {
      '7d': { days: 7, usd: 25000, gold: 20, label: '7-Day Maintenance Pass' },
      '1m': { days: 30, usd: 85000, gold: 60, label: '1-Month Corporate Pass (30 Days)' },
      'auto': { days: 30, usd: 75000, gold: 50, label: 'Monthly Auto-Renewal Pass (30 Days)' },
    };

    const cfg = tierConfig[tier] || tierConfig['1m'];
    const currentState = stateRef.current;
    const isAlreadyActive = currentState.aiFleetMaintenanceActive && currentState.simTimeMinutes < currentState.aiFleetMaintenanceExpiresSimMinutes;
    if (isAlreadyActive && !allowExtension) {
      notifyUser('Active Maintenance in Effect', `AI Fleet Maintenance is already active until Day ${Math.floor(currentState.aiFleetMaintenanceExpiresSimMinutes / 1440) + 1}. Multiple deductions prevented.`, 'maintenance');
      return false;
    }
    const simDay = Math.floor(currentState.simTimeMinutes / 1440) + 1;

    if (useGold) {
      if (currentState.gold < cfg.gold) {
        notifyUser('Insufficient Gold', `AI Fleet Maintenance (${cfg.label}) requires ${cfg.gold} Gold coins. You have ${currentState.gold}.`, 'finance');
        return false;
      }
      setState((prev) => {
        const baseTime = Math.max(prev.simTimeMinutes, prev.aiFleetMaintenanceExpiresSimMinutes || 0);
        const nextState = {
          ...prev,
          gold: prev.gold - cfg.gold,
          aiFleetMaintenanceActive: true,
          aiFleetMaintenanceExpiresSimMinutes: baseTime + (cfg.days * 1440),
          notifications: deduplicateNotifications([
            {
              id: `notif-ai-maint-sub-${Date.now()}`,
              simTimeFormatted: `Day ${simDay}`,
              title: isAlreadyActive ? 'AI Fleet Maintenance Extended' : 'AI Fleet Maintenance Add-on Activated',
              message: `Subscribed to ${cfg.label} (-${cfg.gold} Gold). Autonomous fleet servicing active!`,
              type: 'ai',
              timestamp: Date.now(),
            },
            ...prev.notifications,
          ]),
        };
        stateRef.current = nextState;
        return nextState;
      });
      return true;
    } else {
      if (currentState.balanceUsd < cfg.usd) {
        notifyUser('Insufficient Treasury', `AI Fleet Maintenance (${cfg.label}) costs $${cfg.usd.toLocaleString()}. Available: $${currentState.balanceUsd.toLocaleString()}.`, 'finance');
        return false;
      }
      const nextBal = currentState.balanceUsd - cfg.usd;
      setState((prev) => {
        const baseTime = Math.max(prev.simTimeMinutes, prev.aiFleetMaintenanceExpiresSimMinutes || 0);
        const nextState = {
          ...prev,
          balanceUsd: nextBal,
          aiFleetMaintenanceActive: true,
          aiFleetMaintenanceExpiresSimMinutes: baseTime + (cfg.days * 1440),
          ledger: [
            {
              id: `led-ai-maint-sub-${Date.now()}`,
              simDay,
              simTimeFormatted: `Day ${simDay}`,
              type: 'maintenance_expense' as const,
              description: `AI Fleet Maintenance Add-on purchase (${cfg.label})`,
              amountUsd: -cfg.usd,
              runningBalanceUsd: nextBal,
            },
            ...prev.ledger,
          ],
          notifications: deduplicateNotifications([
            {
              id: `notif-ai-maint-sub-${Date.now()}`,
              simTimeFormatted: `Day ${simDay}`,
              title: isAlreadyActive ? 'AI Fleet Maintenance Extended' : 'AI Fleet Maintenance Add-on Activated',
              message: `Subscribed to ${cfg.label} (-$${cfg.usd.toLocaleString()}). Autonomous fleet servicing active!`,
              type: 'ai',
              timestamp: Date.now(),
            },
            ...prev.notifications,
          ]),
        };
        stateRef.current = nextState;
        return nextState;
      });
      return true;
    }
  };

  const toggleAiFleetMaintenance = () => {
    setState(prev => ({
      ...prev,
      aiFleetMaintenanceActive: !prev.aiFleetMaintenanceActive,
    }));
  };

  const toggleAiAutoDispatch = () => {
    setState(prev => {
      const nextVal = prev.aiAutoDispatchEnabled !== undefined ? !prev.aiAutoDispatchEnabled : false;
      return {
        ...prev,
        aiAutoDispatchEnabled: nextVal,
        notifications: deduplicateNotifications([
          {
            id: `notif-ai-toggle-${Date.now()}`,
            simTimeFormatted: `Day ${Math.floor(prev.simTimeMinutes / 1440) + 1}`,
            title: nextVal ? '⚡ AI Autonomous Dispatch Resumed' : '⏸️ AI Autonomous Dispatch Paused',
            message: nextVal
              ? 'Autonomous neural dispatcher is active and will continuously dispatch idle trucks to available freight jobs.'
              : 'Autonomous auto-dispatch engine paused. Idle trucks will remain at base until manually dispatched.',
            type: 'ai',
            timestamp: Date.now(),
          },
          ...prev.notifications,
        ]),
      };
    });
  };

  const activateAiDispatcher = (tier: '7d' | '1m' | 'auto', useGold: boolean = false, allowExtension: boolean = false): boolean => {
    const tierConfig = {
      '7d': { days: 7, usd: 45000, gold: 40, label: '7-Day Express License' },
      '1m': { days: 30, usd: 165000, gold: 120, label: '1-Month Corporate License (30 Days)' },
      'auto': { days: 30, usd: 145000, gold: 100, label: 'Monthly Auto-Renewal Enterprise (30 Days)' },
    };

    const cfg = tierConfig[tier] || tierConfig['1m'];
    const currentState = stateRef.current;
    const isAlreadyActive = currentState.aiDispatcherActive && currentState.simTimeMinutes < currentState.aiSubscriptionExpiresSimMinutes;
    if (isAlreadyActive && !allowExtension) {
      notifyUser('Active License in Effect', `AI Dispatcher is already active until Day ${Math.floor(currentState.aiSubscriptionExpiresSimMinutes / 1440) + 1}. Multiple deductions prevented.`, 'maintenance');
      return false;
    }
    const simDay = Math.floor(currentState.simTimeMinutes / 1440) + 1;

    if (useGold) {
      if (currentState.gold < cfg.gold) {
        notifyUser('Insufficient Gold', `AI Dispatcher (${cfg.label}) requires ${cfg.gold} Gold coins. You have ${currentState.gold}.`, 'finance');
        return false;
      }
      setState((prev) => {
        const baseTime = Math.max(prev.simTimeMinutes, prev.aiSubscriptionExpiresSimMinutes);
        const nextState = {
          ...prev,
          gold: prev.gold - cfg.gold,
          aiDispatcherActive: true,
          aiSubscriptionExpiresSimMinutes: baseTime + (cfg.days * 1440),
          notifications: deduplicateNotifications([
            {
              id: `notif-ai-sub-${Date.now()}`,
              simTimeFormatted: `Day ${simDay}`,
              title: isAlreadyActive ? 'Neural AI Dispatcher Extended' : 'Neural AI Dispatcher License Activated',
              message: `Subscribed to ${cfg.label} (-${cfg.gold} Gold). Autonomous dispatching active!`,
              type: 'ai',
              timestamp: Date.now(),
            },
            ...prev.notifications,
          ]),
        };
        stateRef.current = nextState;
        return nextState;
      });
      return true;
    } else {
      if (currentState.balanceUsd < cfg.usd) {
        notifyUser('Insufficient Treasury', `AI Dispatcher (${cfg.label}) costs $${cfg.usd.toLocaleString()}. Available treasury: $${currentState.balanceUsd.toLocaleString()}.`, 'finance');
        return false;
      }
      const nextBal = currentState.balanceUsd - cfg.usd;
      setState((prev) => {
        const baseTime = Math.max(prev.simTimeMinutes, prev.aiSubscriptionExpiresSimMinutes);
        const nextState = {
          ...prev,
          balanceUsd: nextBal,
          aiDispatcherActive: true,
          aiSubscriptionExpiresSimMinutes: baseTime + (cfg.days * 1440),
          ledger: [
            {
              id: `led-ai-sub-${Date.now()}`,
              simDay,
              simTimeFormatted: `Day ${simDay}`,
              type: 'broker_fee' as const,
              description: `Neural AI Dispatcher license purchase (${cfg.label})`,
              amountUsd: -cfg.usd,
              runningBalanceUsd: nextBal,
            },
            ...prev.ledger,
          ],
          notifications: deduplicateNotifications([
            {
              id: `notif-ai-sub-${Date.now()}`,
              simTimeFormatted: `Day ${simDay}`,
              title: isAlreadyActive ? 'Neural AI Dispatcher Extended' : 'Neural AI Dispatcher License Activated',
              message: `Subscribed to ${cfg.label} (-$${cfg.usd.toLocaleString()}). Autonomous dispatching active!`,
              type: 'ai',
              timestamp: Date.now(),
            },
            ...prev.notifications,
          ]),
        };
        stateRef.current = nextState;
        return nextState;
      });
      return true;
    }
  };

  const runAutoDispatchOnState = (currentState: GameState): { nextState: GameState; dispatchedCount: number } => {
    let idleTrucks = [...currentState.trucks.filter(t => t.status === 'idle')];
    let readyDrivers = [...currentState.drivers.filter(d => d.hosStatus !== 'driving' && d.hosStatus !== 'resting')];
    let trailers = [...(currentState.trailers || [])];
    let routes = [...currentState.routes];
    let hubs = [...currentState.hubs];

    if (idleTrucks.length === 0 || readyDrivers.length === 0) {
      return { nextState: currentState, dispatchedCount: 0 };
    }

    let contracts = [...currentState.availableContracts];
    if (contracts.length === 0) {
      const unlockedRoutes = routes.filter(r => r.isUnlocked);
      contracts = generateContractsForRoutes(unlockedRoutes.length > 0 ? unlockedRoutes : routes, hubs, 20, idleTrucks);
    }
    contracts.sort((a, b) => b.payoutUsd - a.payoutUsd);

    let dispatchedCount = 0;
    let updatedTrucks = [...currentState.trucks];
    let updatedDrivers = [...currentState.drivers];
    let updatedTrailers = [...trailers];
    let updatedRoutes = [...routes];
    const newNotifications = [...currentState.notifications];
    const activeTrips = [...currentState.activeTrips];
    let remainingContracts = [...contracts];

    for (let i = 0; i < idleTrucks.length; i++) {
      if (readyDrivers.length === 0) break;

      const truck = idleTrucks[i];
      const driver = readyDrivers[0];
      if (!truck || !driver) continue;

      const truckHub = hubs.find(h => h.id === truck.currentHubId);

      // 1. First prioritize contracts originating directly at the truck's current hub
      let matchingContractIdx = remainingContracts.findIndex(c => c.originHubId === truck.currentHubId);

      // 2. If no contract exists directly at the truck's hub, adapt any available listed contract in the same region
      if (matchingContractIdx === -1 && truckHub) {
        const regionalContractIdx = remainingContracts.findIndex(c => {
          const oHub = hubs.find(h => h.id === c.originHubId);
          return oHub && oHub.region === truckHub.region;
        });

        if (regionalContractIdx !== -1) {
          const baseContract = remainingContracts[regionalContractIdx];
          const destHubId = baseContract.destinationHubId !== truck.currentHubId
            ? baseContract.destinationHubId
            : (hubs.find(h => h.region === truckHub.region && h.id !== truck.currentHubId)?.id || baseContract.destinationHubId);

          const adaptedContract: CargoContract = {
            ...baseContract,
            id: `cnt-ai-adp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            originHubId: truck.currentHubId,
            destinationHubId: destHubId,
          };
          remainingContracts[regionalContractIdx] = adaptedContract;
          matchingContractIdx = regionalContractIdx;
        }
      }

      // 3. If still none found, dynamically generate a lucrative regional express corridor contract
      if (matchingContractIdx === -1 && truckHub) {
        const sameRegionHubs = hubs.filter(h => h.region === truckHub.region && h.id !== truckHub.id);
        const destHub = sameRegionHubs.length > 0
          ? sameRegionHubs[Math.floor(Math.random() * sameRegionHubs.length)]
          : hubs.find(h => h.id !== truckHub.id);

        if (destHub) {
          const dx = truckHub.coord.x - destHub.coord.x;
          const dy = truckHub.coord.y - destHub.coord.y;
          const dist = Math.max(250, Math.round(Math.sqrt(dx * dx + dy * dy) * 3.5));

          const dynamicContract: CargoContract = {
            id: `cnt-ai-dyn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: 'Express Regional Freight Consignment',
            originHubId: truckHub.id,
            destinationHubId: destHub.id,
            category: 'Dry Freight',
            weightTons: 16,
            payoutUsd: Math.round(dist * 4.8),
            bonusOnTimeUsd: Math.round(dist * 0.8),
            penaltyLateUsd: Math.round(dist * 1.5),
            deadlineMinutes: Math.round((dist / 85) * 60 * 1.5),
            temperatureControlled: false,
            isHazardous: false,
            shipperCompany: 'NexHaul Logistics Prime',
            shipperRating: 95,
          };
          remainingContracts.unshift(dynamicContract);
          matchingContractIdx = 0;
        }
      }

      if (matchingContractIdx === -1) {
        continue;
      }

      const contract = remainingContracts[matchingContractIdx];
      remainingContracts.splice(matchingContractIdx, 1);

      if (truck.fuelCurrentLiters < 100) {
        truck.fuelCurrentLiters = Math.max(truck.fuelCurrentLiters, 450);
      }

      let route = updatedRoutes.find(r => r.originHubId === contract.originHubId && r.destinationHubId === contract.destinationHubId);
      if (!route) {
        const oHub = hubs.find(h => h.id === contract.originHubId);
        const dHub = hubs.find(h => h.id === contract.destinationHubId);
        if (oHub && dHub) {
          const dx = oHub.coord.x - dHub.coord.x;
          const dy = oHub.coord.y - dHub.coord.y;
          const dist = Math.max(200, Math.round(Math.sqrt(dx * dx + dy * dy) * 3.5));
          route = {
            id: `route-ai-${oHub.code}-${dHub.code}-${Date.now()}`,
            originHubId: oHub.id,
            destinationHubId: dHub.id,
            name: `${oHub.name.split(' ')[0]} - ${dHub.name.split(' ')[0]} AI Express`,
            distanceKm: dist,
            roadType: 'Interstate Highway',
            baseSpeedLimitKmh: 105,
            avgElevationGradePct: 1.0,
            maxGradePct: 5.0,
            tollCostUsd: Math.round(dist * 0.04),
            waypoints: [
              { name: oHub.name, coord: oHub.coord, elevationMeters: 50 },
              { name: dHub.name, coord: dHub.coord, elevationMeters: 40 },
            ],
            hazardRisk: 0.1,
            isUnlocked: true,
            licenseFeeUsd: 0,
            requiredRank: 1,
            trafficRateScore: 90,
          };
          updatedRoutes.push(route);
        } else {
          continue;
        }
      } else if (!route.isUnlocked) {
        updatedRoutes = updatedRoutes.map(r => r.id === route!.id ? { ...r, isUnlocked: true } : r);
        route = { ...route, isUnlocked: true };
      }

      let chosenTrailerId: string | null = null;
      const truckModel = TRUCK_MODELS.find(m => m.id === truck.modelId);
      if (!truckModel?.isRigid) {
        let bestTr = truck.assignedTrailerId ? updatedTrailers.find(tr => tr.id === truck.assignedTrailerId && tr.status === 'idle') : null;
        if (!bestTr) {
          bestTr = updatedTrailers.find(tr => tr.status === 'idle' && tr.currentHubId === contract.originHubId) ||
                   updatedTrailers.find(tr => tr.status === 'idle' && hubs.find(h => h.id === tr.currentHubId)?.region === hubs.find(h => h.id === contract.originHubId)?.region);
        }
        if (!bestTr) {
          const trailerModelId: TrailerModelId = contract.temperatureControlled
            ? 'reefer-temp'
            : contract.isHazardous
            ? 'adr-chemical'
            : contract.category === 'Heavy Machinery'
            ? 'lowboy-heavy'
            : 'dry-van-53';

          const newTr: TrailerInstance = {
            id: `trl-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            modelId: trailerModelId,
            serialNumber: `AH-${Math.floor(10000 + Math.random() * 90000)}`,
            currentHubId: contract.originHubId,
            status: 'en_route',
            odometerKm: 0,
            hasAeroSkirts: true,
            hasReeferUnit: !!contract.temperatureControlled,
            reeferFuelCurrentLiters: contract.temperatureControlled ? 100 : 0,
            tireCompound: 'highway_eco',
            assignedTruckId: truck.id,
            assignedTripId: null,
          };
          updatedTrailers.push(newTr);
          bestTr = newTr;
        } else {
          updatedTrailers = updatedTrailers.map(tr => tr.id === bestTr!.id ? { ...tr, status: 'en_route', assignedTruckId: truck.id, currentHubId: contract.originHubId } : tr);
        }
        chosenTrailerId = bestTr.id;
      }

      const simDay = Math.floor(currentState.simTimeMinutes / 1440) + 1;
      const hours = Math.floor((currentState.simTimeMinutes % 1440) / 60);
      const mins = currentState.simTimeMinutes % 60;
      const timeFormatted = `Day ${simDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      const newTrip: ActiveTrip = {
        id: `trip-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        contract,
        corridor: route,
        truckId: truck.id,
        driverId: driver.id,
        trailerId: chosenTrailerId,
        progressKm: 0,
        totalDistanceKm: route.distanceKm,
        elapsedMinutes: 0,
        departureTimeSimMinutes: currentState.simTimeMinutes,
        fuelConsumedLiters: 0,
        telemetry: {
          currentSpeedKmh: 85,
          currentGear: 10,
          engineRpm: 1400,
          instantFuelRateL100km: 32,
          instantFuelRateLitersPerHour: 28,
          engineLoadPct: 65,
          turboBoostBar: 1.2,
          oilTempCelsius: 92,
          oilPressureBar: 4.5,
          coolantTempCelsius: 88,
          brakeTempCelsius: 120,
          retarderActive: false,
          retarderLevel: 0,
          currentInclinePct: 0,
          currentWindSpeedKmh: 10,
          currentHeadwindComponentKmh: 0,
          weatherState: getLocalWeather(route.waypoints[0].coord, 50, currentState.simTimeMinutes),
        },
        eventLogs: [`[${timeFormatted}] AI Neural Dispatcher authorized consignment: ${contract.title}`],
        isRestingNow: false,
        isStalledBreakdown: false,
      };

      activeTrips.push(newTrip);
      dispatchedCount++;

      updatedTrucks = updatedTrucks.map(t => t.id === truck.id ? { 
        ...t, 
        status: 'en_route', 
        activeTripId: newTrip.id,
        assignedDriverId: driver.id,
        assignedTrailerId: chosenTrailerId || t.assignedTrailerId,
        fuelCurrentLiters: Math.max(150, t.fuelCurrentLiters),
      } : t);

      updatedDrivers = updatedDrivers.map(d => d.id === driver.id ? { ...d, hosStatus: 'driving', assignedTruckId: truck.id } : d);
      readyDrivers.shift();
    }

    if (dispatchedCount === 0) {
      return { nextState: currentState, dispatchedCount: 0 };
    }

    const nextState = {
      ...currentState,
      activeTrips,
      trucks: updatedTrucks,
      drivers: updatedDrivers,
      trailers: updatedTrailers,
      routes: updatedRoutes,
      availableContracts: remainingContracts,
      notifications: deduplicateNotifications([
        {
          id: `notif-ai-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simTimeFormatted: `Day ${Math.floor(currentState.simTimeMinutes / 1440) + 1} ${Math.floor((currentState.simTimeMinutes % 1440) / 60).toString().padStart(2, '0')}:${(currentState.simTimeMinutes % 60).toString().padStart(2, '0')}`,
          title: '🤖 AI Autonomous Dispatch Executed',
          message: `Neural AI Dispatcher successfully auto-dispatched ${dispatchedCount} truck(s) to consignment routes.`,
          type: 'ai',
          timestamp: Date.now(),
        },
        ...newNotifications,
      ]),
    };

    return { nextState, dispatchedCount };
  };

  const executeAiAutoDispatch = (): { dispatchedCount: number; message: string } => {
    const currentState = stateRef.current;
    const isSubActive = (currentState.aiDispatcherActive && currentState.simTimeMinutes < currentState.aiSubscriptionExpiresSimMinutes) ||
                        (currentState.aiOfflineDispatchActive && currentState.simTimeMinutes < currentState.aiOfflineDispatchExpiresSimMinutes);
    if (!isSubActive) {
      return { dispatchedCount: 0, message: 'AI Dispatcher or Auto-Dispatch subscription is inactive or expired. Activate subscription in the AI Hub.' };
    }

    const { nextState, dispatchedCount } = runAutoDispatchOnState(currentState);
    if (dispatchedCount === 0) {
      return { dispatchedCount: 0, message: 'No idle trucks or rested drivers available for dispatch, or no matching local consignments found.' };
    }

    setState(nextState);
    stateRef.current = nextState;

    const resMsg = dispatchedCount > 0
      ? `Successfully auto-dispatched ${dispatchedCount} truck(s) to freight jobs!`
      : `No matching idle trucks or ready drivers available for dispatch. Ensure trucks are idle and drivers are rested.`;

    notifyUser(
      dispatchedCount > 0 ? 'AI Auto-Dispatch Successful' : 'AI Auto-Dispatch Notice',
      resMsg,
      dispatchedCount > 0 ? 'delivery' : 'maintenance'
    );

    return {
      dispatchedCount,
      message: resMsg,
    };
  };

  const recallTrip = (tripId: string) => {
    const trip = state.activeTrips.find(t => t.id === tripId);
    if (!trip) return;

    const confirmed = window.confirm("Recall truck to base hub? Active consignment will be cancelled, and the truck will return to its origin hub.");
    if (!confirmed) return;

    const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
    const hours = Math.floor((state.simTimeMinutes % 1440) / 60);
    const mins = state.simTimeMinutes % 60;
    const timeFormatted = `Day ${simDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const cancelFee = 1200;
    const newBal = Math.max(0, state.balanceUsd - cancelFee);
    const truck = state.trucks.find(t => t.id === trip.truckId);

    setState(prev => ({
      ...prev,
      balanceUsd: newBal,
      activeTrips: prev.activeTrips.filter(t => t.id !== tripId),
      trucks: prev.trucks.map(t => t.id === trip.truckId ? {
        ...t,
        status: 'idle',
        activeTripId: null,
        currentHubId: trip.contract.originHubId,
      } : t),
      drivers: prev.drivers.map(d => d.id === trip.driverId ? {
        ...d,
        hosStatus: 'off_duty',
        assignedTruckId: null,
      } : d),
      trailers: prev.trailers.map(tr => tr.id === trip.trailerId ? {
        ...tr,
        status: 'idle',
        assignedTruckId: null,
        currentHubId: trip.contract.originHubId,
      } : tr),
      ledger: [
        {
          id: `led-recall-${trip.id}-${Date.now()}`,
          simDay,
          simTimeFormatted: timeFormatted,
          type: 'broker_fee',
          description: `Consignment cancellation & truck recall fee for ${truck?.plate || 'Truck'}`,
          amountUsd: -cancelFee,
          runningBalanceUsd: newBal,
        },
        ...prev.ledger,
      ],
      notifications: [
        {
          id: `notif-recall-${trip.id}-${Date.now()}`,
          simTimeFormatted: timeFormatted,
          title: '🔄 Truck Recalled to Terminal',
          message: `${truck?.plate || 'Truck'} successfully recalled to origin hub. Consignment cancelled (-$${cancelFee.toLocaleString()}).`,
          type: 'breakdown',
          timestamp: Date.now(),
        },
        ...prev.notifications,
      ],
    }));

    notifyUser('Truck Recalled', `Vehicle returned to terminal. Cancellation fee: $${cancelFee.toLocaleString()}`, 'breakdown');
  };

  const dispatchRoadsideMechanic = (tripId: string, repairType: 'mobile' | 'heavy_tow'): { success: boolean; message: string } => {
    const trip = state.activeTrips.find((t) => t.id === tripId);
    if (!trip || !trip.isStalledBreakdown) {
      return { success: false, message: 'Trip not found or vehicle is not currently stalled in breakdown.' };
    }

    if (trip.roadsideRepairMinutesRemaining && trip.roadsideRepairMinutesRemaining > 0) {
      return { success: false, message: 'Roadside rescue unit is already dispatched and en route to vehicle.' };
    }

    const cost = repairType === 'mobile' ? 1800 : 3500;
    if (state.balanceUsd < cost) {
      notifyUser('Insufficient Treasury', `Roadside rescue ($${cost.toLocaleString()}) requires $${cost.toLocaleString()}. Available: $${state.balanceUsd.toLocaleString()}.`, 'finance');
      return { success: false, message: `Insufficient treasury for roadside rescue ($${cost.toLocaleString()} required).` };
    }

    const truck = state.trucks.find((t) => t.id === trip.truckId);
    const newBalance = state.balanceUsd - cost;
    const timeFormatted = `Day ${Math.floor(state.simTimeMinutes / 1440) + 1} ${Math.floor((state.simTimeMinutes % 1440) / 60).toString().padStart(2, '0')}:${(state.simTimeMinutes % 60).toString().padStart(2, '0')}`;
    const repairDurationMins = repairType === 'mobile' ? 30 : 60;

    const updatedTrips = state.activeTrips.map((t) => {
      if (t.id === tripId) {
        return {
          ...t,
          roadsideRepairMinutesRemaining: repairDurationMins,
          roadsideRepairType: repairType,
        };
      }
      return t;
    });

    const newLedgerEntry = {
      id: `led-breakdown-rescue-${Date.now()}`,
      simDay: Math.floor(state.simTimeMinutes / 1440) + 1,
      simTimeFormatted: timeFormatted,
      type: 'breakdown_recovery' as const,
      description: repairType === 'mobile'
        ? `Mobile roadside mechanic dispatch for ${truck?.plate || 'Truck'}`
        : `Heavy-duty tow and workshop overhaul dispatch for ${truck?.plate || 'Truck'}`,
      amountUsd: -cost,
      runningBalanceUsd: newBalance,
    };

    const newNotif = {
      id: `notif-rescue-${Date.now()}`,
      simTimeFormatted: timeFormatted,
      title: repairType === 'mobile' ? '🛠️ Mobile Mechanic En Route' : '🚛 Heavy Tow En Route',
      message: repairType === 'mobile'
        ? `Mobile roadside mechanic dispatched to ${truck?.plate || 'truck'}. Estimated repair time: 30 sim mins ($${cost.toLocaleString()}).`
        : `Heavy tow truck & workshop recovery dispatched to ${truck?.plate || 'truck'}. Estimated overhaul time: 60 sim mins ($${cost.toLocaleString()}).`,
      type: 'breakdown' as const,
      timestamp: Date.now(),
    };

    const nextState = {
      ...state,
      balanceUsd: newBalance,
      activeTrips: updatedTrips,
      ledger: [newLedgerEntry, ...state.ledger],
      notifications: deduplicateNotifications([newNotif, ...state.notifications]),
    };

    setState(nextState);
    stateRef.current = nextState;
    notifyUser(newNotif.title, newNotif.message, 'breakdown');

    return { success: true, message: `Roadside rescue dispatched successfully for $${cost.toLocaleString()}!` };
  };

  return (
    <GameContext.Provider
      value={{
        state,
        setSimSpeed,
        setSelectedRegion,
        dispatchTrip,
        serviceTruck,
        changeTruckTireCompound,
        buyTruck,
        buyTruckWithConfig,
        sellTruck,
        buyTrailer,
        sellTrailer,
        assignTrailerToTruck,
        hireDriver,
        fireDriver,
        trainDriver,
        renewDriverContract,
        upgradeHub,
        refuelTruckAtHub,
        transferFuelBetweenHubs,
        takeLoan,
        repayLoan,
        claimGrant,
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
        dismissOfflineProgress,
        notifyUser,
        flushToDb,
        restoreState,
        lastSavedTimestamp,
        isDbSaving,
        repairSubsystem,
        clearDTCs,
        activateAiDispatcher,
        activateAiFleetMaintenance,
        activateAiSuite,
        toggleAiFleetMaintenance,
        toggleAiAutoDispatch,
        executeAiAutoDispatch,
        dispatchRoadsideMechanic,
        recallTrip,
        buyGold,
        sellGold,
        upgradeInsurancePolicy,
        fileInsuranceClaim,
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

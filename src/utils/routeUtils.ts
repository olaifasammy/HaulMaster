import { Hub, RouteCorridor, RoadType } from '../types/game';

/**
 * Calculates realistic road distance in kilometers based on hub map coordinates.
 */
export const calculateCorridorDistance = (hubA: Hub, hubB: Hub): number => {
  const dx = hubA.coord.x - hubB.coord.x;
  const dy = hubA.coord.y - hubB.coord.y;
  const euclidean = Math.sqrt(dx * dx + dy * dy);

  // Calibration: Coordinate grid distances scaled to European and North American road corridors
  // e.g., Warsaw (860, 210) to Paris (640, 240) -> dx 220, dy 30 -> euclidean 222 -> ~1,580 km
  // e.g., Seattle (90, 140) to Denver (230, 280) -> dx 140, dy 140 -> euclidean 198 -> ~2,050 km
  const multiplier = hubA.region === 'Europe' ? 7.1 : 9.8;
  const calculated = Math.round(euclidean * multiplier);
  return Math.max(320, calculated);
};

/**
 * Determines appropriate highway classification based on geography and hubs.
 */
export const determineRoadType = (hubA: Hub, hubB: Hub): RoadType => {
  const mountainCodes = ['DEN', 'SLC', 'MXP', 'ZRH', 'VIE', 'INN'];
  if (mountainCodes.includes(hubA.code) || mountainCodes.includes(hubB.code)) {
    return 'Mountain Pass';
  }
  const coastalCodes = ['SEA', 'LAX', 'RTM', 'MIA', 'YVR', 'LON', 'BCN'];
  if (coastalCodes.includes(hubA.code) && coastalCodes.includes(hubB.code)) {
    return 'Coastal Express';
  }
  return hubA.region === 'Europe' ? 'Arterial Corridor' : 'Interstate Highway';
};

/**
 * Creates a complete RouteCorridor between two hubs in one direction.
 */
export const createCorridorInstance = (
  originHub: Hub,
  destHub: Hub,
  isReverse: boolean = false
): RouteCorridor => {
  const dist = calculateCorridorDistance(originHub, destHub);
  const roadType = determineRoadType(originHub, destHub);
  const isEurope = originHub.region === 'Europe';
  const baseSpeed = roadType === 'Mountain Pass' ? (isEurope ? 75 : 85) : isEurope ? 90 : 105;
  const isMountain = roadType === 'Mountain Pass';

  const originElev = isMountain ? (originHub.code === 'DEN' ? 1609 : 450) : 40;
  const destElev = isMountain ? (destHub.code === 'DEN' ? 1609 : 450) : 40;
  const midElev = isMountain ? 1800 : 95;

  const originCity = originHub.name.split(' ')[0];
  const destCity = destHub.name.split(' ')[0];

  const corridorName = isEurope
    ? `${originCity} - ${destCity} Trans-European Corridor (${originHub.code} ⇄ ${destHub.code})`
    : `${originCity} - ${destCity} Interstate Arterial (${originHub.code} ⇄ ${destHub.code})`;

  const routeId = `route-${originHub.code.toLowerCase()}-${destHub.code.toLowerCase()}`;

  const waypoints = [
    {
      name: `${originCity} Commercial Terminal`,
      coord: originHub.coord,
      elevationMeters: originElev,
    },
    {
      name: `${originCity} / ${destCity} Transit Intermediate`,
      coord: {
        x: Math.round((originHub.coord.x + destHub.coord.x) / 2),
        y: Math.round((originHub.coord.y + destHub.coord.y) / 2),
      },
      elevationMeters: midElev,
    },
    {
      name: `${destCity} Commercial Terminal`,
      coord: destHub.coord,
      elevationMeters: destElev,
    },
  ];

  return {
    id: routeId,
    originHubId: originHub.id,
    destinationHubId: destHub.id,
    name: corridorName,
    distanceKm: dist,
    roadType,
    baseSpeedLimitKmh: baseSpeed,
    avgElevationGradePct: isReverse ? -0.8 : 0.8,
    maxGradePct: isMountain ? 6.5 : 3.2,
    tollCostUsd: Math.round(dist * (isEurope ? 0.08 : 0.03)),
    waypoints,
    hazardRisk: isMountain ? 0.32 : 0.12,
    isUnlocked: true,
    licenseFeeUsd: Math.round(dist * 18),
    requiredRank: 1,
    trafficRateScore: Math.round((originHub.trafficDemandScore + destHub.trafficDemandScore) / 2),
  };
};

/**
 * Guarantees that bidirectional corridors exist between hubA and hubB,
 * and sets them to unlocked.
 */
export const ensureCorridorBetweenHubs = (
  routes: RouteCorridor[],
  hubs: Hub[],
  hubAId: string,
  hubBId: string,
  shouldUnlock: boolean = true
): { updatedRoutes: RouteCorridor[]; unlockedRoutes: RouteCorridor[] } => {
  const hubA = hubs.find((h) => h.id === hubAId);
  const hubB = hubs.find((h) => h.id === hubBId);

  if (!hubA || !hubB) {
    return {
      updatedRoutes: routes,
      unlockedRoutes: routes.filter((r) => r.isUnlocked),
    };
  }

  let forwardRoute = routes.find(
    (r) => r.originHubId === hubAId && r.destinationHubId === hubBId
  );
  let reverseRoute = routes.find(
    (r) => r.originHubId === hubBId && r.destinationHubId === hubAId
  );

  const updatedRoutes = [...routes];

  if (!forwardRoute) {
    forwardRoute = createCorridorInstance(hubA, hubB, false);
    if (shouldUnlock) forwardRoute.isUnlocked = true;
    updatedRoutes.push(forwardRoute);
  } else if (shouldUnlock && !forwardRoute.isUnlocked) {
    forwardRoute = { ...forwardRoute, isUnlocked: true };
    const idx = updatedRoutes.findIndex((r) => r.id === forwardRoute!.id);
    if (idx !== -1) updatedRoutes[idx] = forwardRoute;
  }

  if (!reverseRoute) {
    reverseRoute = createCorridorInstance(hubB, hubA, true);
    if (shouldUnlock) reverseRoute.isUnlocked = true;
    updatedRoutes.push(reverseRoute);
  } else if (shouldUnlock && !reverseRoute.isUnlocked) {
    reverseRoute = { ...reverseRoute, isUnlocked: true };
    const idx = updatedRoutes.findIndex((r) => r.id === reverseRoute!.id);
    if (idx !== -1) updatedRoutes[idx] = reverseRoute;
  }

  const activeRoutes = updatedRoutes.filter(
    (r) =>
      (r.originHubId === hubAId && r.destinationHubId === hubBId) ||
      (r.originHubId === hubBId && r.destinationHubId === hubAId)
  );

  return {
    updatedRoutes,
    unlockedRoutes: activeRoutes,
  };
};

/**
 * Self-heals the carrier network routes:
 * If a player has unlocked hubs, guarantees that corridors connecting them exist
 * and are unlocked, preventing "No Active Corridors" errors.
 */
export const selfHealNetworkCorridors = (
  routes: RouteCorridor[],
  hubs: Hub[],
  selectedRegion?: string
): { updatedRoutes: RouteCorridor[]; unlockedRoutes: RouteCorridor[] } => {
  const ownedHubs = hubs.filter((h) => h.isUnlocked);
  const primaryHub = ownedHubs.find((h) => h.isPrimaryBase) || ownedHubs[0];

  let currentRoutes = [...routes];

  // If at least 2 hubs are owned, ensure corridors between primaryHub and other owned hubs
  if (primaryHub && ownedHubs.length >= 2) {
    const otherOwnedHubs = ownedHubs.filter((h) => h.id !== primaryHub.id);
    for (const otherHub of otherOwnedHubs) {
      const res = ensureCorridorBetweenHubs(currentRoutes, hubs, primaryHub.id, otherHub.id, true);
      currentRoutes = res.updatedRoutes;
    }
  } else if (ownedHubs.length === 1 && hubs.length >= 2) {
    // If only 1 hub is owned, find the nearest regional hub and connect them
    const base = ownedHubs[0];
    const candidateHubs = hubs.filter((h) => h.id !== base.id && (!selectedRegion || h.region === selectedRegion));
    const target = candidateHubs[0] || hubs.find((h) => h.id !== base.id);
    if (target) {
      const res = ensureCorridorBetweenHubs(currentRoutes, hubs, base.id, target.id, true);
      currentRoutes = res.updatedRoutes;
    }
  }

  const unlockedRoutes = currentRoutes.filter((r) => r.isUnlocked);
  return {
    updatedRoutes: currentRoutes,
    unlockedRoutes,
  };
};

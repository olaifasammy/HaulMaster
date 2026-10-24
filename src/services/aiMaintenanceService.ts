import { GameState, LedgerEntry, GameEventNotification, SubsystemHealth } from '../types/game';

interface MaintenanceResult {
  updatedTrucks: GameState['trucks'];
  updatedBalance: number;
  newLedgerEntries: LedgerEntry[];
  newNotifications: GameEventNotification[];
}

const createPristineSubsystems = (): SubsystemHealth => ({
  engineBlock: 100,
  cylinderHead: 100,
  turbocharger: 100,
  fuelInjectors: 100,
  transmission: 100,
  clutchPlate: 100,
  driveshaft: 100,
  differential: 100,
  steerTires: { pressurePsi: 110, recommendedPsi: 110, temperatureCelsius: 22, treadDepthMm: 16.0, wearPercentage: 100 },
  driveTiresAxle1: { pressurePsi: 105, recommendedPsi: 105, temperatureCelsius: 22, treadDepthMm: 16.0, wearPercentage: 100 },
  driveTiresAxle2: { pressurePsi: 105, recommendedPsi: 105, temperatureCelsius: 22, treadDepthMm: 16.0, wearPercentage: 100 },
  brakePads: 100,
  brakeRotors: 100,
  airCompressor: 100,
  absModule: 100,
  steeringGearbox: 100,
  suspensionDampers: 100,
  leafSprings: 100,
  radiator: 100,
  waterPump: 100,
  thermostat: 100,
  coolingSystem: 100,
  alternator: 100,
  starterMotor: 100,
  batteryBank: 100,
  wiringHarness: 100,
  ecuModule: 100,
  exhaustAftertreatment: 100,
  dieselParticulateFilter: 100,
  noxSensor: 100,
});

export function processAiFleetMaintenance(state: GameState, deltaSimMinutes: number): MaintenanceResult {
  const isMaintenanceActive = !!(
    state.aiFleetMaintenanceActive &&
    state.simTimeMinutes < (state.aiFleetMaintenanceExpiresSimMinutes || 0)
  );

  const updatedTrucks = [...state.trucks];
  let updatedBalance = state.balanceUsd;
  const newLedgerEntries: LedgerEntry[] = [];
  const newNotifications: GameEventNotification[] = [];

  if (!isMaintenanceActive) {
    // If maintenance subscription is inactive, ensure any stuck maintenance trucks are released to idle
    let released = false;
    const releasedTrucks = updatedTrucks.map((t) => {
      if (t.status === 'maintenance') {
        released = true;
        return {
          ...t,
          status: 'idle' as const,
          health: 100,
          subsystems: createPristineSubsystems(),
          activeDTCs: [],
          maintenanceMinutesRemaining: undefined,
        };
      }
      return t;
    });
    return {
      updatedTrucks: released ? releasedTrucks : updatedTrucks,
      updatedBalance,
      newLedgerEntries,
      newNotifications,
    };
  }

  const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
  const hours = Math.floor((state.simTimeMinutes % 1440) / 60);
  const mins = state.simTimeMinutes % 60;
  const timeFormatted = `Day ${simDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  for (let i = 0; i < updatedTrucks.length; i++) {
    const truck = updatedTrucks[i];

    // Release any stuck maintenance trucks immediately
    if (truck.status === 'maintenance') {
      updatedTrucks[i] = {
        ...truck,
        status: 'idle',
        health: 100,
        subsystems: createPristineSubsystems(),
        activeDTCs: [],
        maintenanceMinutesRemaining: undefined,
      };
      continue;
    }

    const needsService =
      truck.status === 'idle' &&
      ((truck.health ?? 100) < 85 ||
        truck.subsystems.engineBlock < 80 ||
        truck.subsystems.brakePads < 80 ||
        truck.subsystems.coolingSystem < 80 ||
        (truck.activeDTCs && truck.activeDTCs.length > 0));

    if (needsService) {
      const serviceCost = 3800; // Major B-Service cost ($3,800)
      if (updatedBalance >= serviceCost) {
        updatedBalance -= serviceCost;

        updatedTrucks[i] = {
          ...truck,
          status: 'idle', // Instant professional service - ready for immediate dispatch
          health: 100,
          subsystems: createPristineSubsystems(),
          activeDTCs: [],
          maintenanceMinutesRemaining: undefined,
          lastServiceKm: truck.odometerKm,
        };

        newLedgerEntries.push({
          id: `led-ai-maint-${truck.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simDay,
          simTimeFormatted,
          type: 'maintenance_expense',
          description: `AI Autonomous B-Service & Overhaul completed for ${truck.plate}`,
          amountUsd: -serviceCost,
          runningBalanceUsd: updatedBalance,
        });

        newNotifications.push({
          id: `notif-ai-maint-start-${truck.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simTimeFormatted,
          title: '🤖 AI Fleet Maintenance Overhaul',
          message: `AI Auto-Serviced ${truck.plate} to 100% pristine health (B-Service overhaul, -$${serviceCost.toLocaleString()}).`,
          type: 'ai',
          timestamp: Date.now(),
        });
      }
    }
  }

  return {
    updatedTrucks,
    updatedBalance,
    newLedgerEntries,
    newNotifications,
  };
}

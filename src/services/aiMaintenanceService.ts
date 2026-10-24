import { GameState, LedgerEntry, GameEventNotification } from '../types/game';

interface MaintenanceResult {
  updatedTrucks: GameState['trucks'];
  updatedBalance: number;
  newLedgerEntries: LedgerEntry[];
  newNotifications: GameEventNotification[];
}

export function processAiFleetMaintenance(state: GameState, deltaSimMinutes: number): MaintenanceResult {
  const isMaintenanceActive = !!(
    state.aiFleetMaintenanceActive &&
    state.simTimeMinutes < (state.aiFleetMaintenanceExpiresSimMinutes || 0)
  );

  const updatedTrucks = [...state.trucks];
  let updatedBalance = state.balanceUsd;
  const newLedgerEntries: LedgerEntry[] = [];
  const newNotifications: GameEventNotification[] = [];

  const simDay = Math.floor(state.simTimeMinutes / 1440) + 1;
  const hours = Math.floor((state.simTimeMinutes % 1440) / 60);
  const mins = state.simTimeMinutes % 60;
  const timeFormatted = `Day ${simDay} ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  for (let i = 0; i < updatedTrucks.length; i++) {
    const truck = updatedTrucks[i];

    // 1. Process active maintenance countdown if truck is in service bay
    if (truck.status === 'maintenance' && truck.maintenanceMinutesRemaining !== undefined) {
      const remaining = truck.maintenanceMinutesRemaining - deltaSimMinutes;
      if (remaining <= 0) {
        // Maintenance finished!
        updatedTrucks[i] = {
          ...truck,
          status: 'idle',
          health: 100,
          subsystems: {
            ...truck.subsystems,
            engineBlock: 100,
            brakePads: 100,
            brakeRotors: 100,
            coolingSystem: 100,
            exhaustAftertreatment: 98,
            transmission: 98,
            suspensionDampers: 98,
          },
          activeDTCs: [],
          maintenanceMinutesRemaining: undefined,
        };

        newNotifications.push({
          id: `notif-ai-maint-done-${truck.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simTimeFormatted: timeFormatted,
          title: '🤖 AI Fleet Maintenance Completed',
          message: `Service bay overhaul completed for ${truck.plate}. Vehicle returned to idle terminal fleet at 100% health.`,
          type: 'ai',
          timestamp: Date.now(),
        });
      } else {
        // Still in service bay
        updatedTrucks[i] = {
          ...truck,
          maintenanceMinutesRemaining: remaining,
        };
      }
      continue;
    }

    // 2. Check if idle truck needs new maintenance dispatch
    if (!isMaintenanceActive) continue;

    const needsService =
      truck.status === 'idle' &&
      ((truck.health ?? 100) < 75 ||
        truck.subsystems.engineBlock < 65 ||
        truck.subsystems.brakePads < 65 ||
        truck.subsystems.coolingSystem < 60);

    if (needsService) {
      const serviceCost = 3800; // Aligned with manual Major B-Service cost ($3,800)
      if (updatedBalance >= serviceCost) {
        updatedBalance -= serviceCost;

        updatedTrucks[i] = {
          ...truck,
          status: 'maintenance',
          maintenanceMinutesRemaining: 45, // 45 simulation minutes in service bay
        };

        newLedgerEntries.push({
          id: `led-ai-maint-${truck.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simDay,
          simTimeFormatted: timeFormatted,
          type: 'maintenance_expense',
          description: `AI Autonomous B-Service & Overhaul dispatched for ${truck.plate}`,
          amountUsd: -serviceCost,
          runningBalanceUsd: updatedBalance,
        });

        newNotifications.push({
          id: `notif-ai-maint-start-${truck.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          simTimeFormatted: timeFormatted,
          title: '🤖 AI Fleet Maintenance Dispatched',
          message: `Truck ${truck.plate} routed to service bay for scheduled overhaul (~45 sim mins, -$${serviceCost.toLocaleString()}).`,
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

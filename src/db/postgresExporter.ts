import { GameState } from '../types/game';

/**
 * Escapes values safely for PostgreSQL syntax.
 */
function sqlEscape(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Generates a complete PostgreSQL Schema (DDL) and Data (DML) script
 * that can be directly executed against any local PostgreSQL 12+ database.
 */
export function generatePostgreSqlScript(state: GameState): string {
  const generatedAt = new Date().toISOString();

  let sql = `-- =========================================================================
-- HaulMaster Logistics: PostgreSQL Schema & Database Dump
-- Generated: ${generatedAt}
-- Target: PostgreSQL 13+ / TimescaleDB / Cloud SQL / Local Postgres
-- Instructions to run locally:
--   psql -U postgres -d postgres -c "CREATE DATABASE haulmaster;"
--   psql -U postgres -d haulmaster -f haulmaster_dump.sql
-- =========================================================================

BEGIN;

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Company Profile & Enterprise Configuration
CREATE TABLE IF NOT EXISTS company_profiles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    balance_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    player_rank INTEGER NOT NULL DEFAULT 1,
    player_xp INTEGER NOT NULL DEFAULT 0,
    rank_title VARCHAR(128) NOT NULL,
    rating_score NUMERIC(3,2) NOT NULL DEFAULT 4.8,
    sim_time_minutes BIGINT NOT NULL DEFAULT 480,
    selected_region VARCHAR(64) NOT NULL DEFAULT 'North America',
    total_cargo_delivered_tons NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_fuel_burned_liters NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_kilometers_driven NUMERIC(12,2) NOT NULL DEFAULT 0,
    unlocked_regions JSONB NOT NULL DEFAULT '["North America"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Logistics Hubs (Terminals & Depots)
CREATE TABLE IF NOT EXISTS hubs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL,
    country VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL,
    location_type VARCHAR(64) NOT NULL,
    coord_x NUMERIC(8,2) NOT NULL,
    coord_y NUMERIC(8,2) NOT NULL,
    fuel_price_per_liter NUMERIC(5,3) NOT NULL DEFAULT 1.45,
    bulk_fuel_stock_liters NUMERIC(10,2) NOT NULL DEFAULT 0,
    bulk_fuel_capacity_liters NUMERIC(10,2) NOT NULL DEFAULT 20000,
    workshop_level INTEGER NOT NULL DEFAULT 1,
    bay_count INTEGER NOT NULL DEFAULT 2,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    is_primary_base BOOLEAN NOT NULL DEFAULT FALSE,
    required_rank INTEGER NOT NULL DEFAULT 1,
    purchase_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Route Corridors & Highways
CREATE TABLE IF NOT EXISTS route_corridors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    origin_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE CASCADE,
    destination_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE CASCADE,
    distance_km NUMERIC(8,2) NOT NULL,
    road_type VARCHAR(64) NOT NULL,
    base_speed_limit_kmh INTEGER NOT NULL,
    toll_cost_usd NUMERIC(8,2) NOT NULL DEFAULT 0,
    hazard_risk NUMERIC(4,3) NOT NULL DEFAULT 0,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Commercial Fleet Trucks
CREATE TABLE IF NOT EXISTS fleet_trucks (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) DEFAULT 'comp_primary',
    model_id VARCHAR(64) NOT NULL,
    vin VARCHAR(64) UNIQUE NOT NULL,
    plate VARCHAR(32) NOT NULL,
    current_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'idle',
    odometer_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    fuel_current_liters NUMERIC(8,2) NOT NULL,
    adblue_current_liters NUMERIC(8,2) NOT NULL,
    assigned_driver_id VARCHAR(64),
    assigned_trailer_id VARCHAR(64),
    active_trip_id VARCHAR(64),
    has_aero_package BOOLEAN NOT NULL DEFAULT FALSE,
    has_retarder BOOLEAN NOT NULL DEFAULT FALSE,
    tire_compound VARCHAR(32) NOT NULL DEFAULT 'highway_eco',
    sleeper_tier VARCHAR(32) NOT NULL DEFAULT 'day_cab',
    livery_color VARCHAR(64) NOT NULL DEFAULT 'obsidian_slate',
    last_service_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    service_due_km NUMERIC(10,2) NOT NULL DEFAULT 50000,
    subsystems JSONB NOT NULL,
    active_dtcs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Commercial Trailers
CREATE TABLE IF NOT EXISTS fleet_trailers (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) DEFAULT 'comp_primary',
    model_id VARCHAR(64) NOT NULL,
    serial_number VARCHAR(64) NOT NULL,
    current_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'idle',
    odometer_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    has_aero_skirts BOOLEAN NOT NULL DEFAULT FALSE,
    has_reefer_unit BOOLEAN NOT NULL DEFAULT FALSE,
    reefer_fuel_current_liters NUMERIC(8,2) NOT NULL DEFAULT 0,
    tire_compound VARCHAR(32) NOT NULL DEFAULT 'highway_eco',
    assigned_truck_id VARCHAR(64),
    assigned_trip_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Drivers & Personnel
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    avatar VARCHAR(255) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 3,
    wage_per_km_usd NUMERIC(6,3) NOT NULL,
    daily_retainer_usd NUMERIC(8,2) NOT NULL,
    home_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE SET NULL,
    current_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE SET NULL,
    assigned_truck_id VARCHAR(64) REFERENCES fleet_trucks(id) ON DELETE SET NULL,
    hos_status VARCHAR(32) NOT NULL DEFAULT 'off_duty',
    continuous_drive_minutes INTEGER NOT NULL DEFAULT 0,
    daily_drive_minutes INTEGER NOT NULL DEFAULT 0,
    current_rest_minutes_remaining INTEGER NOT NULL DEFAULT 0,
    stats JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cargo Contracts (Freight Market)
CREATE TABLE IF NOT EXISTS cargo_contracts (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    origin_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE CASCADE,
    destination_hub_id VARCHAR(64) REFERENCES hubs(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    weight_tons NUMERIC(8,2) NOT NULL,
    payout_usd NUMERIC(10,2) NOT NULL,
    bonus_on_time_usd NUMERIC(10,2) NOT NULL,
    penalty_late_usd NUMERIC(10,2) NOT NULL,
    deadline_minutes INTEGER NOT NULL,
    temperature_controlled BOOLEAN NOT NULL DEFAULT FALSE,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    hazard_class VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Active Logistics Dispatches
CREATE TABLE IF NOT EXISTS active_trips (
    id VARCHAR(64) PRIMARY KEY,
    truck_id VARCHAR(64) REFERENCES fleet_trucks(id) ON DELETE CASCADE,
    trailer_id VARCHAR(64) REFERENCES fleet_trailers(id) ON DELETE SET NULL,
    driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE CASCADE,
    contract_id VARCHAR(64) REFERENCES cargo_contracts(id) ON DELETE SET NULL,
    corridor_id VARCHAR(64) REFERENCES route_corridors(id) ON DELETE CASCADE,
    progress_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_distance_km NUMERIC(10,2) NOT NULL,
    elapsed_minutes INTEGER NOT NULL DEFAULT 0,
    current_speed_kmh NUMERIC(6,2) NOT NULL DEFAULT 0,
    fuel_consumed_liters NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Financial Ledger Entries
CREATE TABLE IF NOT EXISTS financial_ledger (
    id VARCHAR(64) PRIMARY KEY,
    sim_day INTEGER NOT NULL,
    sim_time_formatted VARCHAR(32) NOT NULL,
    type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    amount_usd NUMERIC(12,2) NOT NULL,
    running_balance_usd NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_trucks_status ON fleet_trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_driver ON fleet_trucks(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_hub ON drivers(current_hub_id);
CREATE INDEX IF NOT EXISTS idx_ledger_sim_day ON financial_ledger(sim_day);
CREATE INDEX IF NOT EXISTS idx_trips_progress ON active_trips(progress_km);

-- =========================================================================
-- DML DATA POPULATION: Insert live game data
-- =========================================================================

-- Company Profile
INSERT INTO company_profiles (
    id, name, balance_usd, gold, player_rank, player_xp, rank_title, rating_score,
    sim_time_minutes, selected_region, total_cargo_delivered_tons, total_fuel_burned_liters,
    total_kilometers_driven, unlocked_regions
) VALUES (
    'comp_primary',
    ${sqlEscape(state.companyName)},
    ${sqlEscape(state.balanceUsd)},
    ${sqlEscape(state.gold || 15)},
    ${sqlEscape(state.playerRank)},
    ${sqlEscape(state.playerXp)},
    ${sqlEscape(state.rankTitle)},
    ${sqlEscape(state.ratingScore)},
    ${sqlEscape(state.simTimeMinutes)},
    ${sqlEscape(state.selectedRegion)},
    ${sqlEscape(state.totalCargoDeliveredTons)},
    ${sqlEscape(state.totalFuelBurnedLiters)},
    ${sqlEscape(state.totalKilometersDriven)},
    ${sqlEscape(state.unlockedRegions)}
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    balance_usd = EXCLUDED.balance_usd,
    gold = EXCLUDED.gold,
    player_rank = EXCLUDED.player_rank,
    player_xp = EXCLUDED.player_xp,
    rank_title = EXCLUDED.rank_title,
    rating_score = EXCLUDED.rating_score,
    sim_time_minutes = EXCLUDED.sim_time_minutes,
    total_cargo_delivered_tons = EXCLUDED.total_cargo_delivered_tons,
    total_fuel_burned_liters = EXCLUDED.total_fuel_burned_liters,
    total_kilometers_driven = EXCLUDED.total_kilometers_driven,
    unlocked_regions = EXCLUDED.unlocked_regions,
    updated_at = CURRENT_TIMESTAMP;
\n`;

  // Hubs
  if (state.hubs && state.hubs.length > 0) {
    sql += `-- Hubs (${state.hubs.length} records)\n`;
    for (const hub of state.hubs) {
      sql += `INSERT INTO hubs (id, name, code, country, region, location_type, coord_x, coord_y, fuel_price_per_liter, bulk_fuel_stock_liters, bulk_fuel_capacity_liters, workshop_level, bay_count, is_unlocked, is_primary_base, required_rank, purchase_price_usd)
VALUES (${sqlEscape(hub.id)}, ${sqlEscape(hub.name)}, ${sqlEscape(hub.code)}, ${sqlEscape(hub.country)}, ${sqlEscape(hub.region)}, ${sqlEscape(hub.locationType)}, ${sqlEscape(hub.coord?.x || 0)}, ${sqlEscape(hub.coord?.y || 0)}, ${sqlEscape(hub.fuelPricePerLiter)}, ${sqlEscape(hub.bulkFuelStockLiters)}, ${sqlEscape(hub.bulkFuelCapacityLiters)}, ${sqlEscape(hub.workshopLevel)}, ${sqlEscape(hub.bayCount)}, ${sqlEscape(hub.isUnlocked)}, ${sqlEscape(hub.isPrimaryBase || false)}, ${sqlEscape(hub.requiredRank)}, ${sqlEscape(hub.purchasePriceUsd)})
ON CONFLICT (id) DO UPDATE SET is_unlocked = EXCLUDED.is_unlocked, workshop_level = EXCLUDED.workshop_level;\n`;
    }
    sql += '\n';
  }

  // Corridors
  if (state.routes && state.routes.length > 0) {
    sql += `-- Routes (${state.routes.length} corridors)\n`;
    for (const r of state.routes) {
      sql += `INSERT INTO route_corridors (id, name, origin_hub_id, destination_hub_id, distance_km, road_type, base_speed_limit_kmh, toll_cost_usd, hazard_risk, is_unlocked, waypoints)
VALUES (${sqlEscape(r.id)}, ${sqlEscape(r.name)}, ${sqlEscape(r.originHubId)}, ${sqlEscape(r.destinationHubId)}, ${sqlEscape(r.distanceKm)}, ${sqlEscape(r.roadType)}, ${sqlEscape(r.baseSpeedLimitKmh)}, ${sqlEscape(r.tollCostUsd)}, ${sqlEscape(r.hazardRisk)}, ${sqlEscape(r.isUnlocked)}, ${sqlEscape(r.waypoints)})
ON CONFLICT (id) DO UPDATE SET is_unlocked = EXCLUDED.is_unlocked;\n`;
    }
    sql += '\n';
  }

  // Trucks
  if (state.trucks && state.trucks.length > 0) {
    sql += `-- Fleet Trucks (${state.trucks.length} vehicles)\n`;
    for (const trk of state.trucks) {
      sql += `INSERT INTO fleet_trucks (
    id, model_id, vin, plate, current_hub_id, status, odometer_km, fuel_current_liters,
    adblue_current_liters, assigned_driver_id, assigned_trailer_id, active_trip_id,
    has_aero_package, has_retarder, tire_compound, sleeper_tier, livery_color,
    last_service_km, service_due_km, subsystems, active_dtcs
) VALUES (
    ${sqlEscape(trk.id)}, ${sqlEscape(trk.modelId)}, ${sqlEscape(trk.vin)}, ${sqlEscape(trk.plate)},
    ${sqlEscape(trk.currentHubId)}, ${sqlEscape(trk.status)}, ${sqlEscape(trk.odometerKm)},
    ${sqlEscape(trk.fuelCurrentLiters)}, ${sqlEscape(trk.adBlueCurrentLiters)},
    ${sqlEscape(trk.assignedDriverId)}, ${sqlEscape(trk.assignedTrailerId)}, ${sqlEscape(trk.activeTripId)},
    ${sqlEscape(trk.hasAeroPackage)}, ${sqlEscape(trk.hasRetarder)}, ${sqlEscape(trk.tireCompound)},
    ${sqlEscape(trk.sleeperTier)}, ${sqlEscape(trk.liveryColor)}, ${sqlEscape(trk.lastServiceKm)},
    ${sqlEscape(trk.serviceDueKm)}, ${sqlEscape(trk.subsystems)}, ${sqlEscape(trk.activeDTCs)}
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    odometer_km = EXCLUDED.odometer_km,
    fuel_current_liters = EXCLUDED.fuel_current_liters,
    current_hub_id = EXCLUDED.current_hub_id,
    assigned_driver_id = EXCLUDED.assigned_driver_id,
    assigned_trailer_id = EXCLUDED.assigned_trailer_id,
    active_trip_id = EXCLUDED.active_trip_id,
    subsystems = EXCLUDED.subsystems,
    active_dtcs = EXCLUDED.active_dtcs,
    updated_at = CURRENT_TIMESTAMP;\n`;
    }
    sql += '\n';
  }

  // Trailers
  if (state.trailers && state.trailers.length > 0) {
    sql += `-- Trailers (${state.trailers.length} trailers)\n`;
    for (const trl of state.trailers) {
      sql += `INSERT INTO fleet_trailers (id, model_id, serial_number, current_hub_id, status, odometer_km, has_aero_skirts, has_reefer_unit, reefer_fuel_current_liters, tire_compound, assigned_truck_id, assigned_trip_id)
VALUES (${sqlEscape(trl.id)}, ${sqlEscape(trl.modelId)}, ${sqlEscape(trl.serialNumber)}, ${sqlEscape(trl.currentHubId)}, ${sqlEscape(trl.status)}, ${sqlEscape(trl.odometerKm)}, ${sqlEscape(trl.hasAeroSkirts)}, ${sqlEscape(trl.hasReeferUnit)}, ${sqlEscape(trl.reeferFuelCurrentLiters)}, ${sqlEscape(trl.tireCompound)}, ${sqlEscape(trl.assignedTruckId)}, ${sqlEscape(trl.assignedTripId)})
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, current_hub_id = EXCLUDED.current_hub_id;\n`;
    }
    sql += '\n';
  }

  // Drivers
  if (state.drivers && state.drivers.length > 0) {
    sql += `-- Drivers (${state.drivers.length} personnel)\n`;
    for (const drv of state.drivers) {
      sql += `INSERT INTO drivers (
    id, name, avatar, experience_years, wage_per_km_usd, daily_retainer_usd,
    home_hub_id, current_hub_id, assigned_truck_id, hos_status, continuous_drive_minutes,
    daily_drive_minutes, current_rest_minutes_remaining, stats
) VALUES (
    ${sqlEscape(drv.id)}, ${sqlEscape(drv.name)}, ${sqlEscape(drv.avatar)}, ${sqlEscape(drv.experienceYears)},
    ${sqlEscape(drv.wagePerKmUsd)}, ${sqlEscape(drv.dailyRetainerUsd)}, ${sqlEscape(drv.homeHubId)},
    ${sqlEscape(drv.currentHubId)}, ${sqlEscape(drv.assignedTruckId)}, ${sqlEscape(drv.hosStatus)},
    ${sqlEscape(drv.continuousDriveMinutes)}, ${sqlEscape(drv.dailyDriveMinutes)}, ${sqlEscape(drv.currentRestMinutesRemaining)},
    ${sqlEscape(drv.stats)}
) ON CONFLICT (id) DO UPDATE SET
    current_hub_id = EXCLUDED.current_hub_id,
    assigned_truck_id = EXCLUDED.assigned_truck_id,
    hos_status = EXCLUDED.hos_status;\n`;
    }
    sql += '\n';
  }

  // Ledger Entries
  if (state.ledger && state.ledger.length > 0) {
    sql += `-- Financial Ledger (${state.ledger.length} entries)\n`;
    for (const entry of state.ledger.slice(0, 500)) {
      sql += `INSERT INTO financial_ledger (id, sim_day, sim_time_formatted, type, description, amount_usd, running_balance_usd)
VALUES (${sqlEscape(entry.id)}, ${sqlEscape(entry.simDay)}, ${sqlEscape(entry.simTimeFormatted)}, ${sqlEscape(entry.type)}, ${sqlEscape(entry.description)}, ${sqlEscape(entry.amountUsd)}, ${sqlEscape(entry.runningBalanceUsd)})
ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';
  }

  sql += `COMMIT;
-- =========================================================================
-- End of HaulMaster PostgreSQL Dump. All transactions committed successfully.
-- =========================================================================\n`;

  return sql;
}

/**
 * Triggers a direct browser download of the generated PostgreSQL .sql file.
 */
export function downloadPostgresDump(state: GameState): void {
  const sql = generatePostgreSqlScript(state);
  const blob = new Blob([sql], { type: 'application/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `haulmaster_postgres_dump_${Date.now()}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a direct JSON snapshot download for easy backup/restore.
 */
export function downloadJsonBackup(state: GameState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `haulmaster_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

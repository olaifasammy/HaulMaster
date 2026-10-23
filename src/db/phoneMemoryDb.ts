import { GameState } from '../types/game';

const DB_NAME = 'HaulMaster_PhoneDB';
const DB_VERSION = 1;
const SNAPSHOT_STORE = 'game_snapshot';
const METADATA_STORE = 'system_meta';

export interface StorageMetrics {
  usedBytes: number;
  quotaBytes: number;
  percentageUsed: number;
  isPersistent: boolean;
  lastSavedAt: number | null;
  recordCounts: {
    trucks: number;
    trailers: number;
    drivers: number;
    hubs: number;
    routes: number;
    trips: number;
    ledger: number;
    contracts: number;
    notifications: number;
  };
}

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

/**
 * Open and initialize the IndexedDB database instance.
 * IndexedDB operates natively in device/phone memory and storage,
 * providing non-blocking, asynchronous read/writes with zero 5MB quota restrictions.
 */
export async function getPhoneDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported on this device/browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        initPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      initPromise = null;
      reject(request.error || new Error('Failed to open Phone Memory Database'));
    };
  });

  return initPromise;
}

/**
 * Save complete game state asynchronously to IndexedDB.
 * Completely off the main thread — does NOT block rendering or game physics.
 */
export async function saveToPhoneDb(state: GameState): Promise<void> {
  // Always update localStorage synchronously so initial useState has immediate access
  try {
    localStorage.setItem('haulmaster_game_state_v4', JSON.stringify(state));
  } catch {
    // ignore
  }

  try {
    const db = await getPhoneDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([SNAPSHOT_STORE, METADATA_STORE], 'readwrite');
      const snapStore = tx.objectStore(SNAPSHOT_STORE);
      const metaStore = tx.objectStore(METADATA_STORE);

      // Save deep snapshot
      snapStore.put({ key: 'active_session', data: state, updatedAt: Date.now() });

      // Save quick metadata header for fast inspection
      metaStore.put({
        key: 'stats',
        updatedAt: Date.now(),
        companyName: state.companyName,
        balanceUsd: state.balanceUsd,
        playerRank: state.playerRank,
        truckCount: state.trucks.length,
        driverCount: state.drivers.length,
        activeTripCount: state.activeTrips.length,
        ledgerCount: state.ledger.length,
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Already backed up to localStorage above
  }
}

/**
 * Load game state asynchronously from Phone Memory DB (IndexedDB),
 * with backward-compatible migration from legacy localStorage.
 */
export async function loadFromPhoneDb(): Promise<GameState | null> {
  try {
    const db = await getPhoneDb();
    const state = await new Promise<GameState | null>((resolve, reject) => {
      const tx = db.transaction([SNAPSHOT_STORE], 'readonly');
      const store = tx.objectStore(SNAPSHOT_STORE);
      const req = store.get('active_session');

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as GameState);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => reject(req.error);
    });

    if (state) {
      return state;
    }
  } catch (err) {
    console.warn('[PhoneDB] Failed to load from IndexedDB, checking localStorage fallback:', err);
  }

  // Fallback: check legacy localStorage and migrate
  try {
    const raw = localStorage.getItem('haulmaster_game_state_v4');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.trucks) {
        // Asynchronously migrate to Phone Memory DB
        saveToPhoneDb(parsed).catch(() => {});
        return parsed as GameState;
      }
    }
  } catch (err) {
    console.warn('[PhoneDB] Failed to read localStorage fallback:', err);
  }

  return null;
}

/**
 * Request persistent phone/device storage from the browser so the OS
 * does not evict data under storage pressure.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Query live storage metrics (phone memory used, quota, table counts).
 */
export async function getStorageMetrics(state?: GameState): Promise<StorageMetrics> {
  let usedBytes = 0;
  let quotaBytes = 0;
  let isPersistent = false;

  if (typeof navigator !== 'undefined' && navigator.storage) {
    if (navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usedBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch {
        // ignore
      }
    }
    if (navigator.storage.persisted) {
      try {
        isPersistent = await navigator.storage.persisted();
      } catch {
        // ignore
      }
    }
  }

  let lastSavedAt: number | null = null;
  try {
    const db = await getPhoneDb();
    lastSavedAt = await new Promise<number | null>((resolve) => {
      const tx = db.transaction([METADATA_STORE], 'readonly');
      const store = tx.objectStore(METADATA_STORE);
      const req = store.get('stats');
      req.onsuccess = () => {
        resolve(req.result?.updatedAt || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    // ignore
  }

  const recordCounts = {
    trucks: state ? state.trucks.length : 0,
    trailers: state ? state.trailers.length : 0,
    drivers: state ? state.drivers.length : 0,
    hubs: state ? state.hubs.length : 0,
    routes: state ? state.routes.length : 0,
    trips: state ? state.activeTrips.length : 0,
    ledger: state ? state.ledger.length : 0,
    contracts: state ? state.availableContracts.length : 0,
    notifications: state ? state.notifications.length : 0,
  };

  const percentageUsed = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

  return {
    usedBytes,
    quotaBytes,
    percentageUsed,
    isPersistent,
    lastSavedAt,
    recordCounts,
  };
}

/**
 * Reset and clear the on-device database.
 */
export async function clearPhoneDb(): Promise<void> {
  try {
    const db = await getPhoneDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([SNAPSHOT_STORE, METADATA_STORE], 'readwrite');
      tx.objectStore(SNAPSHOT_STORE).clear();
      tx.objectStore(METADATA_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.removeItem('haulmaster_game_state_v4');
  } catch (err) {
    console.warn('[PhoneDB] Failed to clear DB:', err);
  }
}

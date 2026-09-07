'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The demo garage's storage layer.
 *
 * `localStorage` on purpose, and said so in the UI: this build has no accounts,
 * and inventing a server-side "guest garage" keyed on a cookie would be a user
 * record in everything but name — exactly the thing the plan cut.
 *
 * Every read and write is wrapped: `localStorage` throws outright in a private
 * window on some browsers and when site data is blocked, and a garage page that
 * white-screens because storage is disabled is worse than one that quietly
 * starts empty.
 */

const STORAGE_KEY = 'karaj:garage:v1';

export type GarageCar = {
  id: string;
  makeSlug: string;
  modelSlug: string;
  /** Resolved at save time so the card renders without the reference data. */
  label: string;
  year: number;
  plate: string;
  odometerKm: number;
  /** ISO date. */
  addedAt: string;
};

export type GarageRecord = {
  id: string;
  carId: string;
  serviceSlug: string;
  /** ISO date, day precision. */
  performedAt: string;
  odometerKm: number;
};

export type GarageState = {
  cars: GarageCar[];
  records: GarageRecord[];
};

const EMPTY: GarageState = { cars: [], records: [] };

function read(): GarageState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as unknown;
    // Anything can be in localStorage — another tab, an older version of this
    // app, or a person editing it by hand. Validate the shape before trusting.
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    const candidate = parsed as Partial<GarageState>;
    return {
      cars: Array.isArray(candidate.cars) ? candidate.cars : [],
      records: Array.isArray(candidate.records) ? candidate.records : [],
    };
  } catch {
    return EMPTY;
  }
}

function write(state: GarageState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked. The in-memory state still works for this
    // session, which is the best available outcome.
  }
}

export function useGarage() {
  const [state, setState] = useState<GarageState>(EMPTY);
  /**
   * Storage cannot be read during render without breaking hydration — the
   * server has no localStorage, so the first client render must match the
   * server's empty one and the real state arrives in an effect.
   */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  // Two tabs open on the garage should not silently diverge.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: (current: GarageState) => GarageState) => {
    setState((current) => {
      const value = next(current);
      write(value);
      return value;
    });
  }, []);

  const addCar = useCallback(
    (car: Omit<GarageCar, 'id' | 'addedAt'>) => {
      const id = crypto.randomUUID();
      update((current) => ({
        ...current,
        cars: [...current.cars, { ...car, id, addedAt: new Date().toISOString() }],
      }));
      return id;
    },
    [update],
  );

  const updateCar = useCallback(
    (id: string, patch: Partial<Omit<GarageCar, 'id'>>) => {
      update((current) => ({
        ...current,
        cars: current.cars.map((car) => (car.id === id ? { ...car, ...patch } : car)),
      }));
    },
    [update],
  );

  const removeCar = useCallback(
    (id: string) => {
      update((current) => ({
        cars: current.cars.filter((car) => car.id !== id),
        // Orphaned records would silently inflate a future car's history.
        records: current.records.filter((record) => record.carId !== id),
      }));
    },
    [update],
  );

  const addRecord = useCallback(
    (record: Omit<GarageRecord, 'id'>) => {
      update((current) => ({
        ...current,
        records: [...current.records, { ...record, id: crypto.randomUUID() }],
      }));
    },
    [update],
  );

  const removeRecord = useCallback(
    (id: string) => {
      update((current) => ({
        ...current,
        records: current.records.filter((record) => record.id !== id),
      }));
    },
    [update],
  );

  return { state, hydrated, addCar, updateCar, removeCar, addRecord, removeRecord };
}

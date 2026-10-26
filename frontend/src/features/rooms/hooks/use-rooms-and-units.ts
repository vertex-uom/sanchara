"use client";

import { useCallback, useEffect, useState } from "react";
import { toApiError, type ApiError } from "@/lib/api-client/errors";
import { roomsApi, type RoomsApi } from "../api";
import { computeStats } from "../stats";
import type { CreateUnitInput, RoomType, RoomTypeInput, RoomUnit, UpdateUnitInput } from "../types";

// The only way rooms components reach data. They never import the API or
// mock directly; tests can pass their own RoomsApi. Loads on mount.
export function useRoomsAndUnits(propertyId: string, api: RoomsApi = roomsApi) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [units, setUnits] = useState<RoomUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  // Bumped by reload() to fetch again.
  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listRoomTypes(propertyId), api.listUnits(propertyId)])
      .then(([nextTypes, nextUnits]) => {
        if (cancelled) return;
        setRoomTypes(nextTypes);
        setUnits(nextUnits);
        setError(null);
      })
      .catch((failure: unknown) => {
        if (!cancelled) setError(toApiError(failure));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, propertyId, loadCount]);

  const reload = useCallback(() => {
    setLoading(true);
    setLoadCount((count) => count + 1);
  }, []);

  // Runs a write with the saving flag; rejects with an ApiError for forms.
  const mutate = useCallback(async <T,>(write: () => Promise<T>) => {
    setSaving(true);
    try {
      return await write();
    } catch (failure) {
      throw toApiError(failure);
    } finally {
      setSaving(false);
    }
  }, []);

  const createUnit = useCallback(
    (input: CreateUnitInput) =>
      mutate(async () => {
        const unit = await api.createUnit(propertyId, input);
        setUnits((current) => [...current, unit]);
        return unit;
      }),
    [api, propertyId, mutate],
  );

  const updateUnit = useCallback(
    (unitId: string, input: UpdateUnitInput) =>
      mutate(async () => {
        const unit = await api.updateUnit(propertyId, unitId, input);
        setUnits((current) => current.map((u) => (u.id === unitId ? unit : u)));
        return unit;
      }),
    [api, propertyId, mutate],
  );

  const createRoomType = useCallback(
    (input: RoomTypeInput) =>
      mutate(async () => {
        const roomType = await api.createRoomType(propertyId, input);
        setRoomTypes((current) => [...current, roomType]);
        return roomType;
      }),
    [api, propertyId, mutate],
  );

  const updateRoomType = useCallback(
    (roomTypeId: string, input: RoomTypeInput) =>
      mutate(async () => {
        const roomType = await api.updateRoomType(propertyId, roomTypeId, input);
        setRoomTypes((current) => current.map((t) => (t.id === roomTypeId ? roomType : t)));
        return roomType;
      }),
    [api, propertyId, mutate],
  );

  return {
    roomTypes,
    units,
    stats: computeStats(roomTypes, units),
    loading,
    error,
    reload,
    saving,
    createUnit,
    updateUnit,
    createRoomType,
    updateRoomType,
  };
}

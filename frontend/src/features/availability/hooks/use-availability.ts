"use client";

import { useCallback, useRef, useState } from "react";
import type { ApiError } from "@/lib/api-client/errors";
import { availabilityApi, type AvailabilityApi } from "../api";
import type {
  AvailabilityResult,
  AvailabilitySearchParams,
  BlockConflict,
  CreateBlockInput,
  DateBlock,
  PropertyUnits,
} from "../types";

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "status" in value && "code" in value && "message" in value;
}

function toApiError(value: unknown): ApiError {
  if (isApiError(value)) return value;
  return { status: 0, code: "network_error", message: "Something went wrong. Try again.", fieldErrors: {} };
}

// The only way availability components reach data. They never import the
// API or mock directly; tests can pass their own AvailabilityApi.
export function useAvailability(propertyId: string, api: AvailabilityApi = availabilityApi) {
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<ApiError | null>(null);

  const [propertyUnits, setPropertyUnits] = useState<PropertyUnits | null>(null);
  const [unitsError, setUnitsError] = useState<ApiError | null>(null);

  const [blocks, setBlocks] = useState<DateBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blocksError, setBlocksError] = useState<ApiError | null>(null);

  const [conflicts, setConflicts] = useState<BlockConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only the newest search may update the results.
  const searchSeq = useRef(0);
  const conflictSeq = useRef(0);

  // The last search, so results can be refreshed after a change.
  const lastParams = useRef<AvailabilitySearchParams | null>(null);

  const search = useCallback(
    async (params: AvailabilitySearchParams) => {
      lastParams.current = params;
      const seq = ++searchSeq.current;
      setSearching(true);
      setSearchError(null);
      try {
        const next = await api.searchAvailability(propertyId, params);
        if (seq === searchSeq.current) setResult(next);
      } catch (error) {
        if (seq === searchSeq.current) setSearchError(toApiError(error));
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    },
    [api, propertyId],
  );

  // Re-runs the last search (after a block is saved or removed).
  const refresh = useCallback(async () => {
    if (lastParams.current) await search(lastParams.current);
  }, [search]);

  const loadUnits = useCallback(async () => {
    setUnitsError(null);
    try {
      setPropertyUnits(await api.listUnits(propertyId));
    } catch (error) {
      setUnitsError(toApiError(error));
    }
  }, [api, propertyId]);

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true);
    setBlocksError(null);
    try {
      setBlocks(await api.listBlocks(propertyId));
    } catch (error) {
      setBlocksError(toApiError(error));
    } finally {
      setBlocksLoading(false);
    }
  }, [api, propertyId]);

  // Rejects with an ApiError so forms can show field errors.
  const checkConflicts = useCallback(
    async (input: CreateBlockInput) => {
      const seq = ++conflictSeq.current;
      setCheckingConflicts(true);
      try {
        const found = await api.checkBlockConflicts(propertyId, input);
        if (seq === conflictSeq.current) setConflicts(found);
        return found;
      } catch (error) {
        throw toApiError(error);
      } finally {
        if (seq === conflictSeq.current) setCheckingConflicts(false);
      }
    },
    [api, propertyId],
  );

  const clearConflicts = useCallback(() => {
    conflictSeq.current++;
    setConflicts([]);
    setCheckingConflicts(false);
  }, []);

  const createBlock = useCallback(
    async (input: CreateBlockInput) => {
      setSaving(true);
      try {
        const created = await api.createBlock(propertyId, input);
        setBlocks((current) => [...current, ...created].sort((a, b) => a.startDate.localeCompare(b.startDate)));
        setConflicts([]);
        return created;
      } catch (error) {
        throw toApiError(error);
      } finally {
        setSaving(false);
      }
    },
    [api, propertyId],
  );

  const deleteBlock = useCallback(
    async (blockId: string) => {
      try {
        await api.deleteBlock(propertyId, blockId);
        setBlocks((current) => current.filter((b) => b.id !== blockId));
      } catch (error) {
        throw toApiError(error);
      }
    },
    [api, propertyId],
  );

  return {
    result,
    searching,
    searchError,
    search,
    refresh,
    propertyUnits,
    unitsError,
    loadUnits,
    blocks,
    blocksLoading,
    blocksError,
    loadBlocks,
    conflicts,
    checkingConflicts,
    checkConflicts,
    clearConflicts,
    saving,
    createBlock,
    deleteBlock,
  };
}

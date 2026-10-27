"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError, type ApiError } from "@/lib/api-client/errors";
import { reviewsApi, type ReviewsApi } from "../api";
import type { ListReviewsParams, Review, ReviewFilters, ReviewSummary } from "../types";

export const DEFAULT_REVIEW_FILTERS: ReviewFilters = { rating: "all", sort: "newest", query: "" };

function toParams(filters: ReviewFilters, cursor?: string): ListReviewsParams {
  return {
    rating: filters.rating === "all" ? undefined : filters.rating,
    sort: filters.sort,
    query: filters.query.trim() || undefined,
    cursor,
  };
}

// The only way reviews components reach data. They never import the API or
// mock directly; tests can pass their own ReviewsApi. Read-only.
export function useReviews(propertyId: string, api: ReviewsApi = reviewsApi) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [summaryError, setSummaryError] = useState<ApiError | null>(null);

  const [filters, setFiltersState] = useState<ReviewFilters>(DEFAULT_REVIEW_FILTERS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // Bumped by retry() to fetch again.
  const [attempt, setAttempt] = useState(0);
  // The filters the current list belongs to; a late page for older filters is dropped.
  const listFor = useRef(filters);

  useEffect(() => {
    let cancelled = false;
    api
      .getSummary(propertyId)
      .then((next) => {
        if (!cancelled) {
          setSummary(next);
          setSummaryError(null);
        }
      })
      .catch((failure: unknown) => {
        if (!cancelled) setSummaryError(toApiError(failure));
      });
    return () => {
      cancelled = true;
    };
  }, [api, propertyId, attempt]);

  // First page whenever the filters change.
  useEffect(() => {
    let cancelled = false;
    listFor.current = filters;
    api
      .listReviews(propertyId, toParams(filters))
      .then((page) => {
        if (cancelled) return;
        setReviews(page.reviews);
        setTotal(page.total);
        setNextCursor(page.nextCursor);
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
  }, [api, propertyId, filters, attempt]);

  const setFilters = useCallback((next: ReviewFilters) => {
    setLoading(true);
    setFiltersState(next);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    const forFilters = filters;
    setLoadingMore(true);
    try {
      const page = await api.listReviews(propertyId, toParams(forFilters, nextCursor));
      if (listFor.current !== forFilters) return;
      setReviews((current) => [...current, ...page.reviews]);
      setTotal(page.total);
      setNextCursor(page.nextCursor);
    } catch (failure) {
      if (listFor.current === forFilters) setError(toApiError(failure));
    } finally {
      setLoadingMore(false);
    }
  }, [api, propertyId, filters, nextCursor, loadingMore]);

  const retry = useCallback(() => {
    setLoading(true);
    setAttempt((count) => count + 1);
  }, []);

  return {
    summary,
    summaryError,
    reviews,
    total,
    filters,
    setFilters,
    loading,
    loadingMore,
    hasMore: nextCursor !== null,
    error,
    loadMore,
    retry,
  };
}

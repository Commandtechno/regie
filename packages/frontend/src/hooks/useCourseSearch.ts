import { useState, useEffect, useRef, useCallback } from "react";
import { searchCoursesGrouped } from "../api.ts";
import type { CourseGroup, SearchParams } from "../types.ts";

export function useCourseSearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Omit<SearchParams, "q" | "page" | "limit">>({});
  const [results, setResults] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(
    async (q: string, f: typeof filters, p: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params: SearchParams = { ...f, page: p, limit: 25 };
        if (q.trim()) params.q = q.trim();

        const data = await searchCoursesGrouped(params);
        if (controller.signal.aborted) return;

        setResults(data.results);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.error("Search error:", e);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSearch(query, filters, 1);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, filters, doSearch]);

  const goToPage = useCallback(
    (p: number) => {
      if (p >= 1 && p <= totalPages && !loading) {
        doSearch(query, filters, p);
      }
    },
    [totalPages, loading, query, filters, doSearch]
  );

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => {
      const merged = { ...prev };
      for (const [k, v] of Object.entries(newFilters)) {
        if (v) {
          (merged as Record<string, string>)[k] = v;
        } else {
          delete (merged as Record<string, string>)[k];
        }
      }
      return merged;
    });
  }, []);

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    results,
    loading,
    total,
    page,
    totalPages,
    goToPage,
  };
}

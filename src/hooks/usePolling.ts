"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function usePolling<T>(
  url: string,
  intervalMs = 15000,
  initial: T | null = null
) {
  const [data, setData] = useState<T | null>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as T;
      if (activeRef.current) {
        setData(json);
        setError(null);
      }
    } catch (err) {
      if (activeRef.current) {
        setError(err instanceof Error ? err.message : "Network error");
      }
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    activeRef.current = true;
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      activeRef.current = false;
      clearInterval(id);
    };
  }, [load, intervalMs]);

  return { data, loading, error };
}

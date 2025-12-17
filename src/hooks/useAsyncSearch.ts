import { useEffect, useRef, useState } from "react";
import {
  startSearch,
  getSearchStatus,
  getSearchResult,
  SearchStatus,
} from "@/src/api/search";
import { Candidate } from "@/types";

interface UseAsyncSearchArgs {
  query: string | null;
  onCompleted: (candidates: Candidate[]) => void;
  onFailed?: (error: string) => void;
}

export function useAsyncSearch({
  query,
  onCompleted,
  onFailed,
}: UseAsyncSearchArgs) {
  const [status, setStatus] = useState<SearchStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    const run = async () => {
      try {
        // 1. Start search
        setStatus("IN_PROGRESS");
        const session = await startSearch(query, 15);
        if (cancelled) return;

        sessionRef.current = session.session_id;

        // 2. Poll status
        pollingRef.current = setInterval(async () => {
          try {
            if (!sessionRef.current) return;

            const st = await getSearchStatus(sessionRef.current);
            if (cancelled) return;

            setStatus(st.status);
            setProgress(st.progress ?? 0);

            if (st.status === "COMPLETED") {
              clearInterval(pollingRef.current!);

              // 3. Fetch results
              const result = await getSearchResult(sessionRef.current);

              const candidates: Candidate[] = result?.data?.results ?? [];

              onCompleted(candidates);
            }

            if (st.status === "FAILED") {
              clearInterval(pollingRef.current!);
              onFailed?.("Search failed on server");
            }
          } catch (err: any) {
            clearInterval(pollingRef.current!);
            onFailed?.(err?.message ?? "Polling error");
          }
        }, 2500);
      } catch (err: any) {
        onFailed?.(err?.message ?? "Search init failed");
      }
    };

    run();

    return () => {
      cancelled = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      sessionRef.current = null;
    };
  }, [query]);

  return {
    status,
    progress,
    isSearching: status === "IN_PROGRESS",
  };
}

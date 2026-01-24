import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreditsData } from "@/lib/server/get-credits";
import { getCredits } from "@/lib/server/get-credits";

export type { CreditsData };

export function useCredits() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user", "credits"],
    queryFn: () => getCredits(),
  });

  // Memoize refetch to prevent unnecessary re-renders
  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["user", "credits"] }),
    [queryClient],
  );

  // Memoize return object for stable identity
  return useMemo(
    () => ({
      credits: data?.credits ?? 0,
      customerId: data?.customerId ?? null,
      isAuthenticated: data?.isAuthenticated ?? false,
      isLoading,
      error: error instanceof Error ? error.message : null,
      hasCredits: (data?.credits ?? 0) > 0,
      refetch,
    }),
    [data, isLoading, error, refetch],
  );
}

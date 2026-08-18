import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "../lib/metrics";

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchOnWindowFocus: false,
  });
}
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesHistory, recordSale } from "../lib/sales";
import type { RecordSaleInput } from "../types";

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: getSalesHistory,
  });
}

export function useRecordSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordSaleInput) => recordSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}
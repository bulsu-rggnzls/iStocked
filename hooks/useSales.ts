import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSale, getSalesHistory } from "../lib/sales";
import type { NewSaleInput } from "../types";

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: getSalesHistory,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sale: NewSaleInput) => createSale(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
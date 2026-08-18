import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeSale, createSale, getSalesHistory, type CompleteSaleInput } from "../lib/sales";
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
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useCompleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteSaleInput) => completeSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}
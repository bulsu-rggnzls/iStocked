import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InventoryItem } from "../types";

async function fetchInventory() {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("status", "Available")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as InventoryItem[];
}

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as InventoryItem;
    },
    enabled: !!id,
  });
}
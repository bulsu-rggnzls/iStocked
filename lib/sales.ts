import { supabase } from "../lib/supabase";
import type { NewSaleInput, Sale } from "../types";

export async function createSale(sale: NewSaleInput) {
  const { data, error } = await supabase
    .from("sales")
    .insert([
      {
        inventory_id: sale.inventoryId,
        sold_price: sale.soldPrice,
        profit: sale.profit,
        buyer_name: sale.buyerName ?? null,
        buyer_contact: sale.buyerContact ?? null,
        notes: sale.notes ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  const { error: inventoryError } = await supabase
    .from("inventory")
    .update({ status: "Sold", updated_at: new Date().toISOString() })
    .eq("id", sale.inventoryId);

  if (inventoryError) throw inventoryError;

  return data as Sale;
}

export async function getSalesHistory() {
  const { data, error } = await supabase
    .from("sales")
    .select("*, inventory(*)")
    .order("sold_at", { ascending: false });

  if (error) throw error;
  return data as Sale[];
}
import { supabase } from "../lib/supabase";
import type { InventoryItem, NewDeviceInput } from "../types";

export async function addDevice(deviceData: NewDeviceInput) {
  const { data, error } = await supabase
    .from("inventory")
    .insert([
      {
        imei: deviceData.imei,
        serial: deviceData.serial ?? null,
        model: deviceData.model,
        color: deviceData.color,
        storage: deviceData.storage,
        purchase_cost: deviceData.purchaseCost,
        asking_price: deviceData.askingPrice,
        battery_health: deviceData.batteryHealth ?? null,
        condition: deviceData.condition ?? null,
        notes: deviceData.notes ?? null,
        status: "Available",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

export async function updateDevice(
  id: string,
  deviceData: Partial<NewDeviceInput>,
) {
  const { data, error } = await supabase
    .from("inventory")
    .update({
      imei: deviceData.imei,
      serial: deviceData.serial,
      model: deviceData.model,
      color: deviceData.color,
      storage: deviceData.storage,
      purchase_cost: deviceData.purchaseCost,
      asking_price: deviceData.askingPrice,
      battery_health: deviceData.batteryHealth,
      condition: deviceData.condition,
      notes: deviceData.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

export async function deleteDevice(id: string) {
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
}
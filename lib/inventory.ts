import { ensureDb, genId } from "./db";
import type { SQLiteBindValue } from "expo-sqlite";
import type { Device, DeviceStatus, NewDeviceInput } from "../types";

export interface DeviceFilters {
  status?: "all" | DeviceStatus;
  condition?: string | null;
  networkLock?: string | null;
}

export async function fetchDevices(filters: DeviceFilters = {}) {
  const db = await ensureDb();
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.status && filters.status !== "all") {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  if (filters.condition && filters.condition !== "all") {
    clauses.push("condition = ?");
    params.push(filters.condition);
  }
  if (filters.networkLock && filters.networkLock !== "all") {
    clauses.push("network_lock = ?");
    params.push(filters.networkLock);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.getAllAsync<Device>(
    `SELECT * FROM devices ${where} ORDER BY date_bought DESC, created_at DESC`,
    params,
  );
}

export async function fetchDeviceById(id: string) {
  const db = await ensureDb();
  const row = await db.getFirstAsync<Device>(
    "SELECT * FROM devices WHERE id = ?",
    id,
  );
  if (!row) throw new Error("Device not found");
  return row;
}

export async function lookupDeviceByImei(imei: string) {
  const db = await ensureDb();
  return (
    (await db.getFirstAsync<Device>(
      "SELECT * FROM devices WHERE imei = ?",
      imei,
    )) ?? null
  );
}

export async function addDevice(input: NewDeviceInput) {
  const db = await ensureDb();
  const id = genId();
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO devices (id, model, imei, storage, condition, buy_price, list_price, battery_health, color, network_lock, repair_cost, status, date_bought, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', ?, ?)",
    id,
    input.model,
    input.imei,
    input.storage,
    input.condition,
    input.buy_price,
    input.list_price,
    input.battery_health ?? null,
    input.color?.trim() || null,
    input.network_lock ?? null,
    input.repair_cost ?? 0,
    now,
    now,
  );
  const row = await db.getFirstAsync<Device>(
    "SELECT * FROM devices WHERE id = ?",
    id,
  );
  if (!row) throw new Error("Failed to create device");
  return row;
}

export async function updateDevice(
  id: string,
  deviceData: Partial<NewDeviceInput> & { status?: DeviceStatus },
) {
  const db = await ensureDb();
  const sets: string[] = [];
  const params: SQLiteBindValue[] = [];

  const fields: Array<keyof NewDeviceInput | "status"> = [
    "model",
    "imei",
    "storage",
    "condition",
    "buy_price",
    "list_price",
    "battery_health",
    "color",
    "network_lock",
    "repair_cost",
    "status",
  ];
  for (const field of fields) {
    const value = deviceData[field];
    if (value !== undefined) {
      sets.push(`${field} = ?`);
      params.push(value);
    }
  }

  if (sets.length > 0) {
    params.push(id);
    await db.runAsync(
      `UPDATE devices SET ${sets.join(", ")} WHERE id = ?`,
      params,
    );
  }

  const row = await db.getFirstAsync<Device>(
    "SELECT * FROM devices WHERE id = ?",
    id,
  );
  if (!row) throw new Error("Device not found");
  return row;
}

export async function deleteDevice(id: string) {
  const db = await ensureDb();
  await db.runAsync("DELETE FROM devices WHERE id = ?", id);
}
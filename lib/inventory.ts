import { ensureDb, genId } from "./db";
import type { SQLiteBindValue } from "expo-sqlite";
import type { Device, NewDeviceInput } from "../types";

export interface DeviceFilters {
  status?: "all" | Device["status"];
  condition?: string | null;
}

export async function fetchDevices(filters: DeviceFilters = {}) {
  const db = ensureDb();
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

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.getAllAsync<Device>(
    `SELECT * FROM devices ${where} ORDER BY created_at DESC, id DESC`,
    params,
  );
}

export async function fetchDeviceById(id: string) {
  const db = ensureDb();
  const row = await db.getFirstAsync<Device>(
    "SELECT * FROM devices WHERE id = ?",
    id,
  );
  if (!row) throw new Error("Device not found");
  return row;
}

export async function lookupDeviceByImei(imei: string) {
  const db = ensureDb();
  return (
    (await db.getFirstAsync<Device>(
      "SELECT * FROM devices WHERE imei = ?",
      imei,
    )) ?? null
  );
}

export async function addDevice(deviceData: NewDeviceInput) {
  const db = ensureDb();
  const id = genId();
  await db.runAsync(
    "INSERT INTO devices (id, model, imei, storage, condition, cost_price, selling_price, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    deviceData.model,
    deviceData.imei,
    deviceData.storage,
    deviceData.condition,
    deviceData.cost_price,
    deviceData.selling_price,
    deviceData.status ?? "in_stock",
    new Date().toISOString(),
    deviceData.created_by ?? null,
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
  deviceData: Partial<NewDeviceInput>,
) {
  const db = ensureDb();
  const sets: string[] = [];
  const params: SQLiteBindValue[] = [];

  const fields: Array<keyof NewDeviceInput> = [
    "model",
    "imei",
    "storage",
    "condition",
    "cost_price",
    "selling_price",
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
  const db = ensureDb();
  await db.runAsync("DELETE FROM devices WHERE id = ?", id);
}
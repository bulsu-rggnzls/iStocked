import { ensureDb } from "./db";
import type { Device, RecordSaleInput } from "../types";

export async function recordSale(input: RecordSaleInput) {
  const db = await ensureDb();
  const device = await db.getFirstAsync<Device>(
    "SELECT * FROM devices WHERE id = ?",
    input.deviceId,
  );
  if (!device) throw new Error("Device not found");
  if (device.status === "sold") throw new Error("Device is already sold");

  await db.runAsync(
    "UPDATE devices SET status = 'sold', sold_price = ?, customer_name = ?, date_sold = ? WHERE id = ?",
    input.soldPrice,
    input.customerName.trim() || null,
    input.dateSold ?? new Date().toISOString(),
    input.deviceId,
  );

  const row = await db.getFirstAsync<Device>(
    "SELECT * FROM devices WHERE id = ?",
    input.deviceId,
  );
  if (!row) throw new Error("Failed to record sale");
  return row;
}

export async function getSalesHistory() {
  const db = await ensureDb();
  return db.getAllAsync<Device>(
    "SELECT * FROM devices WHERE status = 'sold' ORDER BY date_sold DESC, created_at DESC",
  );
}
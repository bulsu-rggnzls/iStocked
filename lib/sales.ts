import { ensureDb, genId } from "./db";
import { findOrCreateCustomer } from "./customers";
import type { Customer, Device, NewSaleInput, Sale } from "../types";

export async function createSale(sale: NewSaleInput) {
  const db = ensureDb();
  const id = genId();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "INSERT INTO sales (id, device_id, customer_id, final_price, payment_method, sold_by, sold_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      id,
      sale.device_id,
      sale.customer_id ?? null,
      sale.final_price,
      sale.payment_method ?? "cash",
      sale.sold_by ?? null,
      new Date().toISOString(),
    );
    await db.runAsync("UPDATE devices SET status = 'sold' WHERE id = ?", sale.device_id);
  });

  const row = await db.getFirstAsync<Sale>(
    "SELECT * FROM sales WHERE id = ?",
    id,
  );
  if (!row) throw new Error("Failed to create sale");
  return row;
}

export async function getSalesHistory() {
  const db = ensureDb();
  const [sales, devices, customers] = await Promise.all([
    db.getAllAsync<Omit<Sale, "device" | "customer">>(
      "SELECT * FROM sales ORDER BY sold_at DESC, id DESC",
    ),
    db.getAllAsync<Device>("SELECT * FROM devices"),
    db.getAllAsync<Customer>("SELECT * FROM customers"),
  ]);

  const deviceMap = new Map(devices.map((d) => [d.id, d]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return sales.map<Sale>((s) => ({
    ...s,
    device: deviceMap.get(s.device_id) ?? null,
    customer: s.customer_id ? customerMap.get(s.customer_id) ?? null : null,
  }));
}

export interface CompleteSaleInput {
  device: Device;
  customerName: string;
  phone?: string;
  finalPrice: number;
  paymentMethod: string;
}

export async function completeSale(input: CompleteSaleInput) {
  const customer = await findOrCreateCustomer({
    full_name: input.customerName,
    phone: input.phone,
  });

  return createSale({
    device_id: input.device.id,
    customer_id: customer.id,
    final_price: input.finalPrice,
    payment_method: input.paymentMethod,
  });
}
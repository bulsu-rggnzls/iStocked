import { ensureDb, genId } from "./db";
import type { Customer, NewCustomerInput } from "../types";

export async function findOrCreateCustomer(
  input: NewCustomerInput,
): Promise<Customer> {
  const db = ensureDb();
  const phone = input.phone?.trim() || null;

  if (phone) {
    const existing = await db.getFirstAsync<Customer>(
      "SELECT * FROM customers WHERE phone = ?",
      phone,
    );
    if (existing) return existing;
  }

  const id = genId();
  await db.runAsync(
    "INSERT INTO customers (id, full_name, phone, email, created_at) VALUES (?, ?, ?, ?, ?)",
    id,
    input.full_name,
    phone,
    input.email ?? null,
    new Date().toISOString(),
  );

  const row = await db.getFirstAsync<Customer>(
    "SELECT * FROM customers WHERE id = ?",
    id,
  );
  if (!row) throw new Error("Failed to create customer");
  return row;
}
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

let dbPromise: Promise<SQLiteDatabase> | null = null;
let initialized = false;

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) dbPromise = openDatabaseAsync("istocked.db");
  return dbPromise;
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureDb(): Promise<SQLiteDatabase> {
  const database = await getDb();
  if (!initialized) {
    const version = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    if ((version?.user_version ?? 0) < 2) {
      await database.execAsync(`
        DROP TABLE IF EXISTS devices;
        DROP TABLE IF EXISTS customers;
        DROP TABLE IF EXISTS sales;
        PRAGMA user_version = 2;
      `);
    }
    await database.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY NOT NULL,
        model TEXT NOT NULL,
        imei TEXT NOT NULL UNIQUE,
        storage TEXT NOT NULL,
        condition TEXT NOT NULL,
        buy_price REAL NOT NULL,
        list_price REAL NOT NULL,
        sold_price REAL,
        status TEXT NOT NULL DEFAULT 'in_stock',
        date_bought TEXT NOT NULL,
        date_sold TEXT,
        customer_name TEXT,
        created_at TEXT NOT NULL
      );
    `);
    await seedIfEmpty(database);
    initialized = true;
  }
  return database;
}

async function seedIfEmpty(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM devices",
  );
  if ((row?.c ?? 0) > 0) return;

  const now = new Date().toISOString();
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  const inStock: Array<[string, string, string, string, number, number]> = [
    ["iPhone 13 Pro", "353981102938475", "128GB", "Good", 450, 620],
    ["iPhone 15 Pro Max", "359182049281740", "512GB", "Brand New", 900, 1150],
  ];
  for (const [model, imei, storage, condition, buy, list] of inStock) {
    await database.runAsync(
      "INSERT INTO devices (id, model, imei, storage, condition, buy_price, list_price, status, date_bought, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_stock', ?, ?)",
      genId(),
      model,
      imei,
      storage,
      condition,
      buy,
      list,
      daysAgo(9),
      now,
    );
  }

  await database.runAsync(
    "INSERT INTO devices (id, model, imei, storage, condition, buy_price, list_price, sold_price, status, date_bought, date_sold, customer_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sold', ?, ?, ?, ?)",
    genId(),
    "iPhone 14",
    "356891104820193",
    "256GB",
    "Like New",
    520,
    700,
    700,
    daysAgo(30),
    daysAgo(3),
    "Juan dela Cruz",
    now,
  );
}
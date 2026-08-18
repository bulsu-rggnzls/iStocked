import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

let db: SQLiteDatabase | null = null;
let initialized = false;

export function getDb(): SQLiteDatabase {
  if (!db) db = openDatabaseSync("istocked.db");
  return db;
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureDb(): SQLiteDatabase {
  const database = getDb();
  if (!initialized) {
    database.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY NOT NULL,
        model TEXT NOT NULL,
        imei TEXT NOT NULL UNIQUE,
        storage TEXT NOT NULL,
        condition TEXT NOT NULL,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_stock',
        created_at TEXT NOT NULL,
        created_by TEXT
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT UNIQUE,
        email TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY NOT NULL,
        device_id TEXT NOT NULL,
        customer_id TEXT,
        final_price REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        sold_by TEXT,
        sold_at TEXT NOT NULL
      );
    `);
    seedIfEmpty(database);
    initialized = true;
  }
  return database;
}

function seedIfEmpty(database: SQLiteDatabase) {
  const row = database.getFirstSync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM devices",
  );
  if ((row?.c ?? 0) > 0) return;

  const now = new Date().toISOString();
  const seeds: Array<[string, string, string, string, number, number]> = [
    ["iPhone 13 Pro", "353981102938475", "128GB", "Excellent", 450, 620],
    ["iPhone 14", "356891104820193", "256GB", "Good", 520, 700],
    ["iPhone 15 Pro Max", "359182049281740", "512GB", "Brand New", 900, 1150],
  ];

  for (const [model, imei, storage, condition, cost, selling] of seeds) {
    database.runSync(
      "INSERT INTO devices (id, model, imei, storage, condition, cost_price, selling_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_stock', ?)",
      genId(),
      model,
      imei,
      storage,
      condition,
      cost,
      selling,
      now,
    );
  }
}
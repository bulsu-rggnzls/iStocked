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

async function addColumnIfMissing(
  database: SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
) {
  const columns = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  if (!columns.some((c) => c.name === column)) {
    await database.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
    );
  }
}

export async function ensureDb(): Promise<SQLiteDatabase> {
  const database = await getDb();
  if (!initialized) {
    const row = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const version = row?.user_version ?? 0;
    if (version < 2) {
      await database.execAsync(`
        DROP TABLE IF EXISTS devices;
        DROP TABLE IF EXISTS customers;
        DROP TABLE IF EXISTS sales;
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
        battery_health REAL,
        color TEXT,
        network_lock TEXT,
        repair_cost REAL NOT NULL DEFAULT 0,
        buyer_contact TEXT,
        created_at TEXT NOT NULL
      );
    `);

    await addColumnIfMissing(database, "devices", "battery_health", "REAL");
    await addColumnIfMissing(database, "devices", "color", "TEXT");
    await addColumnIfMissing(database, "devices", "network_lock", "TEXT");
    await addColumnIfMissing(
      database,
      "devices",
      "repair_cost",
      "REAL NOT NULL DEFAULT 0",
    );
    await addColumnIfMissing(database, "devices", "buyer_contact", "TEXT");
    await database.execAsync("PRAGMA user_version = 3");

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

  const inStock: Array<
    [string, string, string, string, number, number, number | null, string, string, number]
  > = [
    ["iPhone 13 Pro", "353981102938475", "128GB", "Good", 450, 620, 88, "Graphite", "Unlocked", 0],
    ["iPhone 15 Pro Max", "359182049281740", "512GB", "Brand New", 900, 1150, 100, "Natural Titanium", "Carrier Locked", 0],
  ];
  for (const [model, imei, storage, condition, buy, list, battery, color, lock, repair] of inStock) {
    await database.runAsync(
      "INSERT INTO devices (id, model, imei, storage, condition, buy_price, list_price, battery_health, color, network_lock, repair_cost, status, date_bought, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', ?, ?)",
      genId(),
      model,
      imei,
      storage,
      condition,
      buy,
      list,
      battery,
      color,
      lock,
      repair,
      daysAgo(9),
      now,
    );
  }

  await database.runAsync(
    "INSERT INTO devices (id, model, imei, storage, condition, buy_price, list_price, sold_price, battery_health, color, network_lock, repair_cost, status, date_bought, date_sold, customer_name, buyer_contact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sold', ?, ?, ?, ?, ?)",
    genId(),
    "iPhone 14",
    "356891104820193",
    "256GB",
    "Like New",
    520,
    700,
    700,
    92,
    "Midnight",
    "Unlocked",
    250,
    daysAgo(30),
    daysAgo(3),
    "Juan dela Cruz",
    "FB: juancruz.ph",
    now,
  );
}
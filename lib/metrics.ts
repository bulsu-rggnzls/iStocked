import { ensureDb } from "./db";
import type { Device } from "../types";

export interface Metrics {
  totalNetProfit: number;
  totalInvestment: number;
  totalRepairCost: number;
  unitsAvailable: number;
  unitsSold: number;
  recentSales: Device[];
}

export async function fetchMetrics(): Promise<Metrics> {
  const db = await ensureDb();
  const [recentSales, investmentRow, profitRow, repairRow, stockRow, soldRow] =
    await Promise.all([
      db.getAllAsync<Device>(
        "SELECT * FROM devices WHERE status = 'sold' ORDER BY date_sold DESC, created_at DESC LIMIT 15",
      ),
      db.getFirstAsync<{ c: number | null }>(
        "SELECT SUM(buy_price + repair_cost) AS c FROM devices WHERE status = 'in_stock'",
      ),
      db.getFirstAsync<{ c: number | null }>(
        "SELECT SUM(sold_price - buy_price - repair_cost) AS c FROM devices WHERE status = 'sold'",
      ),
      db.getFirstAsync<{ c: number | null }>(
        "SELECT SUM(repair_cost) AS c FROM devices",
      ),
      db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM devices WHERE status = 'in_stock'",
      ),
      db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM devices WHERE status = 'sold'",
      ),
    ]);

  return {
    totalNetProfit: Number(profitRow?.c ?? 0),
    totalInvestment: Number(investmentRow?.c ?? 0),
    totalRepairCost: Number(repairRow?.c ?? 0),
    unitsAvailable: stockRow?.c ?? 0,
    unitsSold: soldRow?.c ?? 0,
    recentSales,
  };
}
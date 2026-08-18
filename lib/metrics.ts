import { ensureDb } from "./db";
import { getSalesHistory } from "./sales";
import type { Sale } from "../types";

export interface Metrics {
  totalSales: number;
  netProfit: number;
  unitsSold: number;
  availableStock: number;
  recentSales: Sale[];
}

export async function fetchMetrics(): Promise<Metrics> {
  const db = ensureDb();
  const [sales, stockRow] = await Promise.all([
    getSalesHistory(),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) AS c FROM devices WHERE status = 'in_stock'",
    ),
  ]);

  const totalSales = sales.reduce((sum, s) => sum + Number(s.final_price), 0);
  const netProfit = sales.reduce(
    (sum, s) => sum + (Number(s.final_price) - Number(s.device?.cost_price ?? 0)),
    0,
  );

  return {
    totalSales,
    netProfit,
    unitsSold: sales.length,
    availableStock: stockRow?.c ?? 0,
    recentSales: sales.slice(0, 15),
  };
}
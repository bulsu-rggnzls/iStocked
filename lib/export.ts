import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ensureDb } from "./db";
import type { Device } from "../types";
import { formatPrice } from "./format";

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function escCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildSalesCsv(sales: Device[]): string {
  const rows = [
    [
      "Model",
      "IMEI",
      "IMEI 2",
      "Storage",
      "Condition",
      "Buy Price",
      "Repair Cost",
      "Sold Price",
      "Profit",
      "Customer",
      "Buyer Contact",
      "Warranty",
      "Accessories",
      "Notes",
      "Date Sold",
    ].join(","),
  ];
  for (const s of sales) {
    const profit = Number(s.sold_price ?? 0) - Number(s.buy_price) - Number(s.repair_cost ?? 0);
    const warranty = s.warranty_period === "7_day" ? "7-day" : s.warranty_period === "30_day" ? "30-day" : "None";
    const acc = s.accessories ?? "";
    const accLabels = acc ? JSON.parse(acc).join("; ") : "";
    rows.push(
      [
        escCsv(s.model),
        s.imei,
        s.imei2 ?? "",
        s.storage,
        escCsv(s.condition),
        Number(s.buy_price).toFixed(2),
        Number(s.repair_cost ?? 0).toFixed(2),
        Number(s.sold_price ?? 0).toFixed(2),
        profit.toFixed(2),
        escCsv(s.customer_name ?? "Walk-in"),
        escCsv(s.buyer_contact ?? ""),
        warranty,
        escCsv(accLabels),
        escCsv(s.notes ?? ""),
        s.date_sold ? new Date(s.date_sold).toISOString().slice(0, 10) : "",
      ].join(","),
    );
  }
  return rows.join("\n");
}

function buildInventoryCsv(devices: Device[]): string {
  const rows = [
    [
      "Model",
      "IMEI",
      "IMEI 2",
      "Storage",
      "Condition",
      "Buy Price",
      "Repair Cost",
      "Total Cost",
      "List Price",
      "Potential Profit",
      "Network Lock",
      "Accessories",
      "Notes",
      "Date Bought",
    ].join(","),
  ];
  for (const d of devices) {
    const totalCost = Number(d.buy_price) + Number(d.repair_cost ?? 0);
    const potential = Number(d.list_price) - totalCost;
    const acc = d.accessories ?? "";
    const accLabels = acc ? JSON.parse(acc).join("; ") : "";
    rows.push(
      [
        escCsv(d.model),
        d.imei,
        d.imei2 ?? "",
        d.storage,
        escCsv(d.condition),
        Number(d.buy_price).toFixed(2),
        Number(d.repair_cost ?? 0).toFixed(2),
        totalCost.toFixed(2),
        Number(d.list_price).toFixed(2),
        potential.toFixed(2),
        escCsv(d.network_lock ?? "Open"),
        escCsv(accLabels),
        escCsv(d.notes ?? ""),
        d.date_bought ? new Date(d.date_bought).toISOString().slice(0, 10) : "",
      ].join(","),
    );
  }
  return rows.join("\n");
}

function buildSummaryCsv(sales: Device[], inventory: Device[]): string {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((s, d) => s + Number(d.sold_price ?? 0), 0);
  const totalBuyCost = sales.reduce((s, d) => s + Number(d.buy_price), 0);
  const totalRepair = sales.reduce((s, d) => s + Number(d.repair_cost ?? 0), 0);
  const totalProfit = totalRevenue - totalBuyCost - totalRepair;

  const stockCost = inventory.reduce((s, d) => s + Number(d.buy_price) + Number(d.repair_cost ?? 0), 0);
  const stockList = inventory.reduce((s, d) => s + Number(d.list_price), 0);

  const lines = [
    "iStocked Transaction Report",
    `Generated,${new Date().toISOString().slice(0, 10)}`,
    "",
    "Sales Summary",
    `Total Sales,${totalSales}`,
    `Total Revenue,"${formatPrice(totalRevenue)}"`,
    `Total Buy Cost,"${formatPrice(totalBuyCost)}"`,
    `Total Repair Cost,"${formatPrice(totalRepair)}"`,
    `Net Profit,"${formatPrice(totalProfit)}"`,
    "",
    "Inventory Capital",
    `Units in Stock,${inventory.length}`,
    `Capital Locked,"${formatPrice(stockCost)}"`,
    `Total List Value,"${formatPrice(stockList)}"`,
    "",
  ];
  return lines.join("\n");
}

function downloadWeb(content: string, fileName: string, mimeType: string) {
  const win = globalThis as unknown as {
    document?: {
      createElement(tag: "a"): {
        href: string;
        download: string;
        click(): void;
      };
    };
    URL?: { createObjectURL(blob: unknown): string; revokeObjectURL(url: string): void };
    Blob?: new (parts: string[], options?: { type: string }) => unknown;
  };
  const blob = new win.Blob!([content], { type: mimeType });
  const url = win.URL!.createObjectURL(blob);
  const link = win.document!.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  win.URL!.revokeObjectURL(url);
}

async function getExportData() {
  const db = await ensureDb();
  const [sales, inventory] = await Promise.all([
    db.getAllAsync<Device>(
      "SELECT * FROM devices WHERE status = 'sold' ORDER BY date_sold DESC",
    ),
    db.getAllAsync<Device>(
      "SELECT * FROM devices WHERE status = 'in_stock' ORDER BY date_bought DESC",
    ),
  ]);
  return { sales, inventory };
}

export async function exportCsv(): Promise<{ fileName: string }> {
  const { sales, inventory } = await getExportData();
  const summary = buildSummaryCsv(sales, inventory);
  const salesCsv = buildSalesCsv(sales);
  const inventoryCsv = buildInventoryCsv(inventory);

  const full = [summary, "--- Sales Detail ---", "", salesCsv, "", "--- Active Inventory ---", "", inventoryCsv].join("\n");
  const fileName = `istocked-report-${stamp()}.csv`;

  if (Platform.OS === "web") {
    downloadWeb(full, fileName, "text/csv");
    return { fileName };
  }

  const file = new File(Paths.cache, fileName);
  file.write(full);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Export transaction report",
    });
  }
  return { fileName };
}

export async function exportDatabase(): Promise<{ fileName: string }> {
  const db = await ensureDb();
  const devices = await db.getAllAsync<Device>("SELECT * FROM devices");
  const json = JSON.stringify(
    { app: "iStocked", exportedAt: new Date().toISOString(), devices },
    null,
    2,
  );
  const fileName = `istocked-backup-${stamp()}.json`;

  if (Platform.OS === "web") {
    downloadWeb(json, fileName, "application/json");
    return { fileName };
  }

  const file = new File(Paths.cache, fileName);
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Export database",
    });
  }
  return { fileName };
}

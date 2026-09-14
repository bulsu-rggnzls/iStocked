import { Text } from "react-native";
import type { WarrantyPeriod } from "../types";

export function WarrantyTag({ period, dateSold }: { period: WarrantyPeriod | null; dateSold: string | null }) {
  if (!period || period === "none" || !dateSold) return null;
  const days = period === "7_day" ? 7 : 30;
  const soldDate = new Date(dateSold);
  const expiry = new Date(soldDate.getTime() + days * 24 * 60 * 60 * 1000);
  const active = new Date() < expiry;

  return (
    <Text className={`text-[11px] font-semibold ${active ? "text-emerald-700" : "text-zinc-400"}`}>
      {active ? `${days}d warranty` : `${days}d warranty expired`}
    </Text>
  );
}

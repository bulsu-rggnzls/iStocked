import { Text, View } from "react-native";
import type { DeviceStatus } from "../../types";

export type BadgeTone = "brand" | "gray" | "amber" | "emerald";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}

const toneStyles: Record<BadgeTone, string> = {
  brand: "border border-zinc-200 bg-zinc-100 text-zinc-900",
  gray: "border border-zinc-200 bg-zinc-100 text-zinc-600",
  amber: "border border-zinc-200 bg-zinc-100 text-zinc-700",
  emerald: "border border-zinc-200 bg-zinc-100 text-zinc-700",
};

const dotStyles: Record<BadgeTone, string> = {
  brand: "bg-black",
  gray: "bg-zinc-400",
  amber: "bg-zinc-600",
  emerald: "bg-zinc-600",
};

export function Badge({ label, tone = "gray", dot = false }: BadgeProps) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${toneStyles[tone]}`}
    >
      {dot ? <View className={`h-1.5 w-1.5 rounded-full ${dotStyles[tone]}`} /> : null}
      <Text className="text-[11px] font-semibold">{label}</Text>
    </View>
  );
}

export const STATUS_META: Record<DeviceStatus, { label: string; tone: BadgeTone }> = {
  in_stock: { label: "In stock", tone: "brand" },
  sold: { label: "Sold", tone: "gray" },
};

export const CONDITION_META: Record<string, { tone: BadgeTone }> = {
  "Brand New": { tone: "brand" },
  Used: { tone: "gray" },
  "Like New": { tone: "emerald" },
  Good: { tone: "amber" },
  Fair: { tone: "gray" },
};

export function StatusBadge({ status }: { status: DeviceStatus }) {
  const meta = STATUS_META[status];
  return <Badge label={meta.label} tone={meta.tone} dot />;
}

export function ConditionBadge({ condition }: { condition: string }) {
  const tone = CONDITION_META[condition]?.tone ?? "gray";
  return <Badge label={condition} tone={tone} />;
}
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
  accent?: "brand" | "ink" | "amber" | "emerald";
  trend?: string;
}

const accentCircle: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-50",
  ink: "bg-[#EEF1EE]",
  amber: "bg-amber-50",
  emerald: "bg-emerald-50",
};

const accentIcon: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "#16a34a",
  ink: "#3A4A40",
  amber: "#d97706",
  emerald: "#059669",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "brand",
  trend,
}: StatCardProps) {
  return (
    <View
      className="rounded-2xl border border-slate-100 bg-white p-4"
      style={{
        shadowColor: "#13241B",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${accentCircle[accent]}`}>
        <Ionicons name={icon} size={20} color={accentIcon[accent]} />
      </View>
      <Text className="mt-3 text-2xl font-bold text-[#13241B]">{value}</Text>
      <Text className="mt-0.5 text-sm text-[#5F6F64]">{label}</Text>
      {trend ? (
        <Text className="mt-1 text-xs text-[#9AA69D]">{trend}</Text>
      ) : null}
    </View>
  );
}
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
  trend?: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <View
      className="rounded-2xl border border-zinc-200 bg-white p-3"
      style={{
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
        <Ionicons name={icon} size={16} color="#09090b" />
      </View>
      <Text className="mt-2 text-xl font-bold text-zinc-950">{value}</Text>
      <Text className="mt-0.5 text-xs text-zinc-500">{label}</Text>
      {trend ? (
        <Text className="mt-0.5 text-[10px] text-zinc-400">{trend}</Text>
      ) : null}
    </View>
  );
}
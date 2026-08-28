import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View
      className="h-32 flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
    >
      <View className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
        <Ionicons name={icon} size={16} color="#334155" />
      </View>
      <View>
        <Text className="text-xl font-bold text-zinc-950">{value}</Text>
        <Text className="mt-0.5 text-xs text-zinc-500">{label}</Text>
      </View>
    </View>
  );
}
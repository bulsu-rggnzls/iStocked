import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Device } from "../types";
import { formatImei, formatPrice } from "../lib/format";
import { ConditionBadge, StatusBadge } from "./ui/Badge";

interface DeviceCardProps {
  device: Device;
  onPress?: () => void;
  onSell?: () => void;
}

export function DeviceCard({ device, onPress, onSell }: DeviceCardProps) {
  const sellable = device.status === "in_stock";

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-[#E3E8E2] bg-white p-5 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-lg font-bold text-[#13241B]">
          {device.model}
        </Text>
        <Text className="text-lg font-bold text-[#13241B]">
          {formatPrice(device.selling_price)}
        </Text>
      </View>

      <View className="mt-2 flex-row items-center gap-2">
        <Text className="text-xs font-medium text-[#5F6F64]">
          {device.storage}
        </Text>
        <View className="h-1 w-1 rounded-full bg-[#C3CCC5]" />
        <ConditionBadge condition={device.condition} />
      </View>

      <Text className="mt-2 font-mono text-xs tracking-wide text-slate-400">
        {formatImei(device.imei)}
      </Text>

      <View className="mt-4 flex-row items-center justify-between border-t border-[#EFF2EE] pt-4">
        <StatusBadge status={device.status} />
        <View className="flex-row items-center gap-2">
          {sellable && onSell ? (
            <Pressable
              onPress={onSell}
              className="rounded-lg bg-brand-500 px-3.5 py-2 active:bg-brand-600"
            >
              <Text className="text-sm font-semibold text-white">Sell</Text>
            </Pressable>
          ) : null}
          <View className="flex-row items-center gap-0.5 rounded-lg border border-[#E3E8E2] bg-white px-3 py-2 active:bg-[#F1F4F0]">
            <Text className="text-sm font-medium text-[#5F6F64]">Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#5F6F64" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
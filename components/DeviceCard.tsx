import { Pressable, Text, View } from "react-native";
import type { Device } from "../types";
import { formatImei, formatPrice } from "../lib/format";
import { ConditionBadge } from "./ui/Badge";

interface DeviceCardProps {
  device: Device;
  onPress?: () => void;
  onRecordSale?: () => void;
}

export function DeviceCard({ device, onPress, onRecordSale }: DeviceCardProps) {
  const sellable = device.status === "in_stock";

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-zinc-200 bg-white p-5 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-zinc-950">
            {device.model}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <ConditionBadge condition={device.condition} />
            <Text className="text-xs font-medium text-zinc-500">
              {device.storage}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            List price
          </Text>
          <Text className="text-lg font-bold text-zinc-950">
            {formatPrice(device.list_price)}
          </Text>
        </View>
      </View>

      <Text className="mt-2 font-mono text-xs tracking-wide text-zinc-400">
        {formatImei(device.imei)}
      </Text>

      <View className="mt-4 flex-row items-center justify-between border-t border-zinc-100 pt-4">
        <View>
          <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            Buy price
          </Text>
          <Text className="mt-0.5 text-sm font-semibold text-zinc-700">
            {formatPrice(device.buy_price)}
          </Text>
        </View>
        {sellable && onRecordSale ? (
          <Pressable
            onPress={onRecordSale}
            className="rounded-lg bg-black px-4 py-2.5 active:bg-zinc-900"
          >
            <Text className="text-sm font-semibold text-white">Record Sale</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
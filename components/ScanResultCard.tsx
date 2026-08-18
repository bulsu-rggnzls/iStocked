import { Text, View } from "react-native";
import type { Device } from "../types";
import { formatImei, formatPrice } from "../lib/format";
import { ConditionBadge, StatusBadge } from "./ui/Badge";

interface ScanResultCardProps {
  device: Device;
}

export function ScanResultCard({ device }: ScanResultCardProps) {
  return (
    <View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold text-[#13241B]">
            {device.model}
          </Text>
          <Text className="mt-1 font-mono text-sm tracking-wide text-[#5F6F64]">
            {formatImei(device.imei)}
          </Text>
        </View>
        <StatusBadge status={device.status} />
      </View>

      <View className="mt-3 flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
        <Text className="text-sm text-[#5F6F64]">{device.storage}</Text>
        <View className="h-1 w-1 rounded-full bg-[#C3CCC5]" />
        <ConditionBadge condition={device.condition} />
      </View>

      <View className="mt-4 rounded-xl bg-[#F6F8F5] px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-[#5F6F64]">Selling price</Text>
          <Text className="text-xl font-bold text-[#13241B]">
            {formatPrice(device.selling_price)}
          </Text>
        </View>
      </View>
    </View>
  );
}
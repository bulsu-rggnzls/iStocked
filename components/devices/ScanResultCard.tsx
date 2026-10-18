import { Text, View } from "react-native";
import type { Device } from "@/types";
import { formatImei, formatPrice } from "@/utils/format";
import { ConditionBadge, StatusBadge } from "@/components/ui/Badge";

interface ScanResultCardProps {
  device: Device;
}

export function ScanResultCard({ device }: ScanResultCardProps) {
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);

  return (
    <View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold text-text-on-surface">
            {device.model}
          </Text>
          <Text className="mt-1 font-mono text-sm tracking-wide text-text-muted">
            {formatImei(device.imei)}
          </Text>
        </View>
        <StatusBadge status={device.status} />
      </View>

      <View className="mt-3 flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
        <Text className="text-sm text-text-muted">{device.storage}</Text>
        <View className="h-1 w-1 rounded-full bg-border-subtle" />
        <ConditionBadge condition={device.condition} />
      </View>

      <View className="mt-4 rounded-xl bg-bg-surface-secondary px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-text-muted">List price</Text>
          <Text className="text-xl font-bold text-text-on-surface">
            {formatPrice(device.list_price)}
          </Text>
        </View>
        {Number(device.repair_cost ?? 0) > 0 ? (
          <View className="mt-2 flex-row items-center justify-between border-t border-border-subtle pt-2">
            <Text className="text-sm text-text-muted">Total cost (buy + repair)</Text>
            <Text className="text-sm font-semibold text-text-muted-foreground">
              {formatPrice(totalCost)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

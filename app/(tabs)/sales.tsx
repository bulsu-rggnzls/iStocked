import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSales } from "../../hooks/useSales";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { EmptyState } from "../../components/EmptyState";
import { ConditionBadge } from "../../components/ui/Badge";
import { formatDate, formatImei, formatPrice } from "../../lib/format";
import type { Device } from "../../types";

function SoldCard({ device }: { device: Device }) {
  const profit = Number(device.sold_price ?? 0) - Number(device.buy_price);

  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-zinc-950">
            {device.model}
          </Text>
          <Text className="mt-1 font-mono text-xs tracking-wide text-zinc-400">
            {formatImei(device.imei)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            Sold price
          </Text>
          <Text className="text-lg font-bold text-zinc-950">
            {formatPrice(device.sold_price ?? 0)}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center gap-2">
        <ConditionBadge condition={device.condition} />
        <Text className="text-xs text-zinc-400">{device.storage}</Text>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-zinc-100 pt-3">
        <View className="flex-row items-center gap-4">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Buy price
            </Text>
            <Text className="mt-0.5 text-sm font-medium text-zinc-700">
              {formatPrice(device.buy_price)}
            </Text>
          </View>
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Sold on
            </Text>
            <Text className="mt-0.5 text-sm font-medium text-zinc-700">
              {device.date_sold ? formatDate(device.date_sold) : "—"}
            </Text>
          </View>
        </View>
        <View className="items-end rounded-lg bg-zinc-900 px-3 py-2">
          <Text className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Profit
          </Text>
          <Text className="text-sm font-bold text-white">
            {formatPrice(profit)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SalesHistoryScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } = useSales();

  const header = (
    <ScreenHeader
      eyebrow="Flip ledger"
      title="Sales History"
      subtitle={
        data ? `${data.length} ${data.length === 1 ? "sale" : "sales"} recorded` : undefined
      }
    />
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-100">
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#09090b" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-zinc-100">
        {header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base font-semibold text-zinc-950">
            Couldn't load sales history
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-red-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-5 rounded-xl bg-black px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-100">
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <SoldCard device={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="No sales yet"
            message="Sales you record from stock will show up here."
            actionLabel="View inventory"
            onAction={() => router.push("/inventory")}
          />
        }
        contentContainerClassName="gap-3 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#09090b"
          />
        }
      />
    </View>
  );
}
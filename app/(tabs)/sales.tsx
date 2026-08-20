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
import { networkLockShort } from "../../lib/networkLock";
import { formatDate, formatPrice } from "../../lib/format";
import type { Device } from "../../types";

function SoldRow({ device }: { device: Device }) {
  const sold = Number(device.sold_price ?? 0);
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = sold - totalCost;
  const lock = networkLockShort(device.network_lock);

  return (
    <View className="flex-row items-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-1.5">
          <Text className="shrink text-sm font-bold text-zinc-950" numberOfLines={1}>
            {device.model}
          </Text>
          {lock ? (
            <View className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-px">
              <Text className="text-[9px] font-semibold text-zinc-600">{lock}</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 text-[11px] text-zinc-500" numberOfLines={1}>
          {device.date_sold ? formatDate(device.date_sold) : "—"} ·{" "}
          {device.customer_name ?? "Walk-in"}
        </Text>
        {device.buyer_contact ? (
          <Text className="mt-0.5 text-[10px] text-zinc-400" numberOfLines={1}>
            {device.buyer_contact}
          </Text>
        ) : null}
      </View>

      <View className="items-end">
        <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
          {formatPrice(sold)}
        </Text>
        <View className="mt-1 rounded-full bg-zinc-900 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-white">
            {profit >= 0 ? "+" : "−"}
            {formatPrice(Math.abs(profit))} net
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
          <View className="px-4">
            <SoldRow device={item} />
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
        contentContainerClassName="gap-1.5 pb-10"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        removeClippedSubviews
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
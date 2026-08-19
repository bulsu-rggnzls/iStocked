import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMetrics } from "../../hooks/useMetrics";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { StatCard } from "../../components/StatCard";
import { EmptyState } from "../../components/EmptyState";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { formatDate, formatPrice } from "../../lib/format";
import type { Device } from "../../types";

function QuickAction({
  icon,
  label,
  primary = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center rounded-2xl px-3 py-4 active:opacity-80 ${
        primary ? "bg-black" : "border border-zinc-200 bg-white"
      }`}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          primary ? "bg-zinc-800" : "bg-zinc-100"
        }`}
      >
        <Ionicons name={icon} size={20} color={primary ? "#ffffff" : "#09090b"} />
      </View>
      <Text className={`mt-2 text-sm font-semibold ${primary ? "text-white" : "text-zinc-950"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function SaleRow({ device }: { device: Device }) {
  const profit = Number(device.sold_price ?? 0) - Number(device.buy_price);
  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base font-semibold text-zinc-950">
          {device.model}
        </Text>
        <Text className="text-lg font-bold text-zinc-950">
          {formatPrice(device.sold_price ?? 0)}
        </Text>
      </View>
      <View className="mt-1.5 flex-row items-center justify-between gap-3">
        <Text className="text-sm text-zinc-500">
          {device.date_sold ? formatDate(device.date_sold) : "—"} ·{" "}
          {device.customer_name ?? "Walk-in"}
        </Text>
        <Text className="text-sm font-semibold text-zinc-700">
          +{formatPrice(profit)} profit
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } =
    useMetrics();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const header = (
    <View>
      <ScreenHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      <View className="flex-row flex-wrap px-3.5 pt-1">
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Total net profit"
            value={data ? formatPrice(data.totalNetProfit) : "—"}
            icon="trending-up-outline"
            trend="sold price − buy price"
          />
        </View>
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Investment in stock"
            value={data ? formatPrice(data.totalInvestment) : "—"}
            icon="cash-outline"
            trend="capital locked up"
          />
        </View>
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Units available"
            value={data ? String(data.unitsAvailable) : "—"}
            icon="phone-portrait-outline"
            trend="ready to sell"
          />
        </View>
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Units sold"
            value={data ? String(data.unitsSold) : "—"}
            icon="checkmark-done-outline"
            trend="all time"
          />
        </View>
      </View>

      <View className="flex-row gap-2.5 px-5 pt-2">
        <QuickAction
          icon="add"
          label="Add Purchased Phone"
          primary
          onPress={() => setAddSheetOpen(true)}
        />
        <QuickAction
          icon="receipt-outline"
          label="View Sales History"
          onPress={() => router.push("/sales")}
        />
      </View>

      <View className="px-5 pb-2 pt-5">
        <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Activity
        </Text>
        <Text className="mt-1 text-2xl font-bold text-zinc-950">
          Recent sales
        </Text>
      </View>
    </View>
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
            Couldn't load your dashboard
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

  const sales = data?.recentSales ?? [];

  return (
    <View className="flex-1 bg-zinc-100">
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <SaleRow device={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No sales yet"
            message="Record a sale from stock and it will show up here."
            actionLabel="Browse inventory"
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
      <AddDeviceSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
      />
    </View>
  );
}
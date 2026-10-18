import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMetrics } from "@/hooks/useMetrics";
import { useIsTablet } from "@/hooks/useIsTablet";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddDeviceSheet } from "@/components/devices/AddDeviceSheet";
import { WarrantyTag } from "@/components/devices/WarrantyTag";
import { formatDate, formatPrice } from "@/utils/format";
import type { Device } from "@/types";

function ReceiptRow({ device, last }: { device: Device; last: boolean }) {
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = Number(device.sold_price ?? 0) - totalCost;
  const positive = profit >= 0;

  return (
    <View
      className={`flex-row items-center gap-3 py-2.5 ${last ? "" : "border-b border-dashed border-border-subtle"}`}
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-surface-secondary">
        <Ionicons name="checkmark" size={15} color="#3f3f46" />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-text-on-surface">
          {device.model}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="text-[11px] text-text-muted">
            {device.date_sold ? formatDate(device.date_sold) : "\u2014"} · {device.customer_name ?? "Walk-in"}
          </Text>
          <WarrantyTag period={device.warranty_period} dateSold={device.date_sold} />
        </View>
      </View>

      <View className="items-end">
        <Text className="text-sm font-bold text-text-on-surface">{formatPrice(device.sold_price ?? 0)}</Text>
        <Text className={`text-[11px] font-semibold ${positive ? "text-emerald-700" : "text-state-error"}`}>
          {positive ? "+" : "\u2212"}
          {formatPrice(Math.abs(profit))} net
        </Text>
      </View>
    </View>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted" numberOfLines={1}>
        {label}
      </Text>
      <Text className="mt-1 text-lg font-bold text-text-on-surface" numberOfLines={1}>
        {value}
      </Text>
      {sub ? <Text className="mt-0.5 text-[11px] text-text-muted" numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } = useMetrics();
  const isTablet = useIsTablet();
  const insets = useSafeAreaInsets();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const sales = data?.recentSales ?? [];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-surface-secondary">
        <ActivityIndicator size="large" color="#09090b" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-surface-secondary px-8">
        <Text className="text-center text-base font-semibold text-text-on-surface">
          Couldn&apos;t load your dashboard
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-state-error">
          {error instanceof Error ? error.message : "Something went wrong."}
        </Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading dashboard"
          className="mt-5 rounded-xl bg-text-on-surface px-6 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-brand-primary-foreground">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-surface-secondary"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#09090b" />
      }
    >
      {/* Header */}
      <View className="px-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text className="mt-1 text-3xl font-bold text-text-on-surface">Dashboard</Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            className="h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface active:bg-bg-surface-secondary"
          >
            <Ionicons name="settings-outline" size={20} color="#09090b" />
          </Pressable>
        </View>
      </View>

      {/* Hero: the ledger */}
      <View className="px-4 pt-4">
        <View className="rounded-2xl bg-bg-surface p-4 shadow-sm border border-border-subtle">
          <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            Net profit
          </Text>
          <View className="mt-1 flex-row items-baseline gap-2">
            <Text className="text-[36px] leading-[41px] font-bold tracking-tight text-text-on-surface">
              {formatPrice(data?.totalNetProfit ?? 0)}
            </Text>
          </View>
          <Text className="mt-1 text-xs text-text-muted">
            from {data?.unitsSold ?? 0} {data?.unitsSold === 1 ? "phone" : "phones"} sold to date
          </Text>

          <View className="mt-3.5 border-t border-dashed border-border-subtle pt-3 flex-row gap-4">
            <HeroStat
              label="In stock"
              value={formatPrice(data?.totalInvestment ?? 0)}
              sub={`${data?.unitsAvailable ?? 0} ${data?.unitsAvailable === 1 ? "unit" : "units"} on shelf`}
            />
            <View className="w-px bg-border-subtle" />
            <HeroStat
              label="If all sells"
              value={formatPrice(data?.potentialProfit ?? 0)}
              sub="profit at list price"
            />
            {isTablet ? (
              <>
                <View className="w-px bg-border-subtle" />
                <HeroStat
                  label="Repairs"
                  value={formatPrice(data?.totalRepairCost ?? 0)}
                  sub="spent to date"
                />
              </>
            ) : null}
          </View>

          {!isTablet && (data?.totalRepairCost ?? 0) > 0 ? (
            <Text className="mt-3 text-[11px] text-text-muted">
              Repair spend to date · {formatPrice(data?.totalRepairCost ?? 0)}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Actions */}
      <View className="px-4 pt-4 flex-row gap-3">
        <Pressable
          onPress={() => setAddSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add purchased phone"
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-text-on-surface active:opacity-80"
        >
          <Ionicons name="add" size={17} color="#ffffff" />
          <Text className="text-xs font-semibold text-brand-primary-foreground">Add purchased phone</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/sales")}
          accessibilityRole="button"
          accessibilityLabel="View sales history"
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-bg-surface active:bg-bg-surface-secondary"
        >
          <Ionicons name="receipt-outline" size={16} color="#09090b" />
          <Text className="text-xs font-semibold text-text-on-surface">Sales history</Text>
        </Pressable>
      </View>

      {/* Recent sales */}
      <View className="px-4 pt-5">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
            Recent sales
          </Text>
          {sales.length > 0 ? (
            <Pressable
              onPress={() => router.push("/sales")}
              accessibilityRole="button"
              accessibilityLabel="View all recent sales"
              hitSlop={8}
            >
              <Text className="text-xs font-semibold text-text-on-surface">View all</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="rounded-2xl border border-border-subtle bg-bg-surface px-4">
          {sales.length === 0 ? (
            <View className="py-2">
              <EmptyState
                icon="receipt-outline"
                title="No sales yet"
                message="Record a sale from stock and it will show up here."
                actionLabel="Browse inventory"
                onAction={() => router.push("/inventory")}
              />
            </View>
          ) : (
            sales.map((item, i) => (
              <ReceiptRow device={item} key={item.id} last={i === sales.length - 1} />
            ))
          )}
        </View>
      </View>

      <AddDeviceSheet visible={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
    </ScrollView>
  );
}

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMetrics } from "../../hooks/useMetrics";
import { useIsTablet } from "../../hooks/useIsTablet";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { StatCard } from "../../components/StatCard";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/EmptyState";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { exportCsv, exportDatabase } from "../../lib/export";
import { formatDate, formatPrice } from "../../lib/format";
import type { Device, WarrantyPeriod } from "../../types";

function WarrantyBadge({ period, dateSold }: { period: WarrantyPeriod | null; dateSold: string | null }) {
  if (!period || period === "none" || !dateSold) return null;
  const days = period === "7_day" ? 7 : 30;
  const soldDate = new Date(dateSold);
  const expiry = new Date(soldDate.getTime() + days * 24 * 60 * 60 * 1000);
  const now = new Date();
  const active = now < expiry;

  return (
    <Badge
      label={active ? `${days}d warranty` : `${days}d expired`}
      tone={active ? "emerald" : "gray"}
      dot
    />
  );
}

function QuickAction({
  icon,
  label,
  primary = false,
  onPress,
  isTablet = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  primary?: boolean;
  onPress: () => void;
  isTablet?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-2xl px-3 py-3 active:opacity-80 ${
        isTablet ? "h-32" : ""
      } ${primary ? "bg-black" : "border border-zinc-200 bg-white"}`}
    >
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${
          primary ? "bg-zinc-800" : "bg-zinc-100"
        }`}
      >
        <Ionicons name={icon} size={16} color={primary ? "#ffffff" : "#09090b"} />
      </View>
      <Text className={`mt-1.5 text-xs font-semibold ${primary ? "text-white" : "text-zinc-950"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function SaleRow({ device }: { device: Device }) {
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = Number(device.sold_price ?? 0) - totalCost;
  return (
    <View className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-bold text-zinc-950" numberOfLines={1}>
          {device.model}
        </Text>
        <Text className="text-sm font-bold text-zinc-950">
          {formatPrice(device.sold_price ?? 0)}
        </Text>
      </View>
      <View className="mt-1 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-1.5">
          <Text className="text-[11px] text-zinc-500" numberOfLines={1}>
            {device.date_sold ? formatDate(device.date_sold) : "\u2014"} ·{" "}
            {device.customer_name ?? "Walk-in"}
          </Text>
          <WarrantyBadge period={device.warranty_period} dateSold={device.date_sold} />
        </View>
        <Text className="text-[11px] font-semibold text-zinc-700">
          +{formatPrice(profit)} net
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } =
    useMetrics();
  const isTablet = useIsTablet();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    Alert.alert("Export Report", "Choose export format", [
      {
        text: "CSV Report",
        onPress: async () => {
          if (exporting) return;
          setExporting(true);
          try {
            await exportCsv();
            setExported(true);
            setTimeout(() => setExported(false), 2000);
          } finally {
            setExporting(false);
          }
        },
      },
      {
        text: "JSON Backup",
        onPress: async () => {
          if (exporting) return;
          setExporting(true);
          try {
            await exportDatabase();
            setExported(true);
            setTimeout(() => setExported(false), 2000);
          } finally {
            setExporting(false);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const sales = data?.recentSales ?? [];

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
        trailing={
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white active:bg-zinc-100"
            accessibilityLabel="Export report"
          >
            <Ionicons
              name={exported ? "checkmark" : exporting ? "hourglass-outline" : "download-outline"}
              size={20}
              color="#09090b"
            />
          </Pressable>
        }
      />

      <View className={`${isTablet ? "max-w-4xl mx-auto w-full px-6 py-6" : "px-5"}`}>
        <View className={`flex-row flex-wrap pt-1 ${isTablet ? "gap-4" : "px-3.5"}`}>
          <View className={`${isTablet ? "w-[calc(25%-12px)]" : "w-1/2 p-1.5"}`}>
            <StatCard
              label="Total net profit"
              value={data ? formatPrice(data.totalNetProfit) : "\u2014"}
              icon="trending-up-outline"
              trend="sold - buy - repair"
            />
          </View>
          <View className={`${isTablet ? "w-[calc(25%-12px)]" : "w-1/2 p-1.5"}`}>
            <StatCard
              label="Investment in stock"
              value={data ? formatPrice(data.totalInvestment) : "\u2014"}
              icon="cash-outline"
              trend="capital locked up"
            />
          </View>
          <View className={`${isTablet ? "w-[calc(25%-12px)]" : "w-1/2 p-1.5"}`}>
            <StatCard
              label="Repair expenses"
              value={data ? formatPrice(data.totalRepairCost) : "\u2014"}
              icon="build-outline"
              trend="all-time repair spend"
            />
          </View>
          <View className={`${isTablet ? "w-[calc(25%-12px)]" : "w-1/2 p-1.5"}`}>
            <StatCard
              label="Units available"
              value={data ? String(data.unitsAvailable) : "\u2014"}
              icon="phone-portrait-outline"
              trend="ready to sell"
            />
          </View>
        </View>

        <View className={`flex-row gap-2.5 pt-4 ${isTablet ? "" : "px-5"}`}>
          <View className={`${isTablet ? "w-[calc(50%-5px)]" : "flex-1"}`}>
            <QuickAction
              icon="add"
              label="Add Purchased Phone"
              primary
              onPress={() => setAddSheetOpen(true)}
              isTablet={isTablet}
            />
          </View>
          <View className={`${isTablet ? "w-[calc(50%-5px)]" : "flex-1"}`}>
            <QuickAction
              icon="receipt-outline"
              label="View Sales History"
              onPress={() => router.push("/sales")}
              isTablet={isTablet}
            />
          </View>
        </View>

        <View className={`pb-2 pt-5 ${isTablet ? "" : "px-5"}`}>
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Activity
          </Text>
          <Text className="mt-1 text-2xl font-bold text-zinc-950">
            Recent sales
          </Text>
        </View>
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

  return (
    <ScrollView
      className="flex-1 bg-zinc-100"
      contentContainerClassName={`pb-8 ${isTablet ? "" : ""}`}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor="#09090b"
        />
      }
    >
      {header}

      <View className={`${isTablet ? "max-w-4xl mx-auto w-full px-6" : "px-5"}`}>
        {sales.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No sales yet"
            message="Record a sale from stock and it will show up here."
            actionLabel="Browse inventory"
            onAction={() => router.push("/inventory")}
          />
        ) : (
          <View className={`flex-row flex-wrap ${isTablet ? "gap-3" : ""}`}>
            {sales.map((item) => (
              <View
                key={item.id}
                className={`${isTablet ? "w-[calc(50%-6px)]" : "w-full"}`}
              >
                <SaleRow device={item} />
              </View>
            ))}
          </View>
        )}
      </View>

      <AddDeviceSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
      />
    </ScrollView>
  );
}

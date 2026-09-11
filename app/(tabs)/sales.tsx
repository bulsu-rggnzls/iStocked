import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import { useSales } from "../../hooks/useSales";
import { useUpdateDevice } from "../../hooks/useInventory";
import { BottomSheet } from "../../components/BottomSheet";
import { EmptyState } from "../../components/EmptyState";
import { networkLockShort } from "../../lib/networkLock";
import { formatDate, formatImei, formatPrice } from "../../lib/format";
import type { Device, WarrantyPeriod } from "../../types";

function WarrantyTag({ period, dateSold }: { period: WarrantyPeriod | null; dateSold: string | null }) {
  if (!period || period === "none" || !dateSold) return null;
  const days = period === "7_day" ? 7 : 30;
  const soldDate = new Date(dateSold);
  const expiry = new Date(soldDate.getTime() + days * 24 * 60 * 60 * 1000);
  const active = new Date() < expiry;

  return (
    <Text className={`text-[11px] font-semibold ${active ? "text-emerald-700" : "text-zinc-400"}`}>
      {active ? `${days}d warranty` : `${days}d warranty expired`}
    </Text>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2">
      <Text className="shrink text-sm text-zinc-500" numberOfLines={1}>{label}</Text>
      <Text
        className={`text-sm text-zinc-950 ${strong ? "font-bold" : "font-medium"}`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function LedgerRow({ device, onPress, last }: { device: Device; onPress: () => void; last: boolean }) {
  const sold = Number(device.sold_price ?? 0);
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = sold - totalCost;
  const positive = profit >= 0;
  const lock = networkLockShort(device.network_lock);

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-2.5 active:opacity-70 ${last ? "" : "border-b border-dashed border-zinc-200"}`}
    >
      <View className="w-9 h-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
        <Ionicons name="checkmark" size={15} color="#3f3f46" />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink text-sm font-semibold text-zinc-950">
            {device.model}
          </Text>
          {lock ? (
            <View className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-px">
              <Text className="text-[9px] font-semibold text-zinc-600">{lock}</Text>
            </View>
          ) : null}
        </View>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink text-[11px] text-zinc-500">
            {device.date_sold ? formatDate(device.date_sold) : "\u2014"} · {device.customer_name ?? "Walk-in"}
          </Text>
          <WarrantyTag period={device.warranty_period} dateSold={device.date_sold} />
        </View>
      </View>

      <View className="items-end">
        <Text numberOfLines={1} className="text-sm font-bold text-zinc-950">
          {formatPrice(sold)}
        </Text>
        <Text
          numberOfLines={1}
          className={`text-[11px] font-semibold ${positive ? "text-emerald-700" : "text-red-700"}`}
        >
          {positive ? "+" : "\u2212"}
          {formatPrice(Math.abs(profit))} net
        </Text>
      </View>
    </Pressable>
  );
}

export default function SalesHistoryScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } = useSales();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const groupedByMonth = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; items: Device[]; profit: number; count: number }
    >();
    for (const d of data ?? []) {
      const date = d.date_sold ? new Date(d.date_sold) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          items: [],
          profit: 0,
          count: 0,
        });
      }
      const g = groups.get(key)!;
      g.items.push(d);
      g.count += 1;
      g.profit += Number(d.sold_price ?? 0) - Number(d.buy_price) - Number(d.repair_cost ?? 0);
    }
    return Array.from(groups.values());
  }, [data]);

  // Year navigation: derive available years, filter months for the selected year
  const availableYears = useMemo(
    () => [...new Set(groupedByMonth.map((g) => Number(g.key.slice(0, 4))))].sort((a, b) => b - a),
    [groupedByMonth],
  );

  const monthsThisYear = useMemo(
    () => groupedByMonth.filter((g) => g.key.startsWith(String(selectedYear))),
    [groupedByMonth, selectedYear],
  );

  const filteredGroups = selectedMonth
    ? groupedByMonth.filter((g) => g.key === selectedMonth)
    : monthsThisYear;

  const selectedGroup = selectedMonth
    ? groupedByMonth.find((g) => g.key === selectedMonth) ?? null
    : null;

  // Short month label for compact chips ("Sep" not "September")
  const shortMonth = (isoKey: string) => {
    const date = new Date(`${isoKey}-01T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  const changeYear = (year: number) => {
    setSelectedYear(year);
    if (selectedMonth && !selectedMonth.startsWith(String(year))) {
      setSelectedMonth(null);
    }
  };

  // Year-scoped totals: "All" shows the selected year's numbers, not all-time
  const yearTotal = monthsThisYear.reduce((s, g) => s + g.profit, 0);
  const yearCount = monthsThisYear.reduce((s, g) => s + g.count, 0);

  const displayTotal = selectedGroup ? selectedGroup.profit : yearTotal;
  const displayCount = selectedGroup ? selectedGroup.count : yearCount;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-100">
        <ActivityIndicator size="large" color="#09090b" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-100 px-8">
        <Text className="text-center text-base font-semibold text-zinc-950">
          Couldn&apos;t load sales history
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
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-100"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor="#09090b"
        />
      }
    >
      {/* Header */}
      <View className="px-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Flip ledger
            </Text>
            <Text className="mt-1 text-3xl font-bold text-zinc-950">Sales history</Text>
          </View>
        </View>
      </View>

      {/* Totals strip */}
      <View className="px-4 pt-4">
        <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>
                {selectedGroup
                  ? selectedGroup.label
                  : selectedYear === new Date().getFullYear()
                    ? "This year"
                    : String(selectedYear)}
              </Text>
              <Text className="mt-1 text-lg font-bold text-zinc-950" numberOfLines={1}>
                {formatPrice(displayTotal)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-zinc-500" numberOfLines={1}>
                {displayCount} {displayCount === 1 ? "sale" : "sales"}
              </Text>
            </View>
            <View className="w-px bg-zinc-200" />
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>
                {selectedGroup ? "Per sale" : "Avg. per sale"}
              </Text>
              <Text className="mt-1 text-lg font-bold text-zinc-950" numberOfLines={1}>
                {formatPrice(displayCount ? displayTotal / displayCount : 0)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-zinc-500" numberOfLines={1}>
                {selectedGroup ? "in this month" : "across this year"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Month filter */}
      {groupedByMonth.length > 0 ? (
        <View className="px-4 pt-4">
          {/* Year toggle */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Period
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => changeYear(Math.max(Math.min(...availableYears), selectedYear - 1))}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Ionicons name="chevron-back" size={18} color="#71717a" />
              </Pressable>
              <Text className="text-sm font-bold text-zinc-950 min-w-[3ch] text-center">
                {selectedYear}
              </Text>
              <Pressable
                onPress={() => changeYear(Math.min(Math.max(...availableYears), selectedYear + 1))}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Ionicons name="chevron-forward" size={18} color="#71717a" />
              </Pressable>
            </View>
          </View>
          {/* Month pills (scrollable, short labels) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            <Pressable
              onPress={() => setSelectedMonth(null)}
              className="h-9 shrink-0 items-center justify-center rounded-full border px-4 active:opacity-80"
              style={{
                backgroundColor: selectedMonth === null ? "#09090b" : "#ffffff",
                borderColor: selectedMonth === null ? "#09090b" : "#e4e4e7",
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: selectedMonth === null ? "#ffffff" : "#3f3f46" }}>
                All
              </Text>
            </Pressable>
            {monthsThisYear.map((g) => (
              <Pressable
                key={g.key}
                onPress={() => setSelectedMonth(selectedMonth === g.key ? null : g.key)}
                className="h-9 shrink-0 items-center justify-center rounded-full border px-4 active:opacity-80"
                style={{
                  backgroundColor: selectedMonth === g.key ? "#09090b" : "#ffffff",
                  borderColor: selectedMonth === g.key ? "#09090b" : "#e4e4e7",
                }}
              >
                <Text className="text-xs font-semibold" style={{ color: selectedMonth === g.key ? "#ffffff" : "#3f3f46" }}>
                  {shortMonth(g.key)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Monthly compiled */}
      <View className="px-4 pt-5">
        <Text className="pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Transactions
        </Text>

        {filteredGroups.length === 0 ? (
          <View className="rounded-2xl border border-zinc-200 bg-white px-4">
            <View className="py-2">
              <EmptyState
                icon="checkmark-circle-outline"
                title="No sales yet"
                message="Sales you record from stock will show up here."
                actionLabel="View inventory"
                onAction={() => router.push("/inventory")}
              />
            </View>
          </View>
        ) : (
          <View className="gap-5">
            {filteredGroups.map((group) => (
              <View key={group.key}>
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-sm font-bold text-zinc-950">{group.label}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[11px] font-medium text-zinc-500">
                      {group.count} {group.count === 1 ? "sale" : "sales"}
                    </Text>
                    <Text
                      className={`text-sm font-bold ${group.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {group.profit >= 0 ? "+" : "\u2212"}
                      {formatPrice(Math.abs(group.profit))} net
                    </Text>
                  </View>
                </View>
                <View className="rounded-2xl border border-zinc-200 bg-white px-4">
                  {group.items.map((item, i) => (
                    <LedgerRow
                      device={item}
                      key={item.id}
                      last={i === group.items.length - 1}
                      onPress={() => setSelectedDevice(item)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <SaleDetailSheet
        device={selectedDevice}
        visible={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
    </ScrollView>
  );
}

function SaleDetailSheet({
  device,
  visible,
  onClose,
}: {
  device: Device | null;
  visible: boolean;
  onClose: () => void;
}) {
  const updateDevice = useUpdateDevice();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  if (!device) return null;

  const sold = Number(device.sold_price ?? 0);
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = sold - totalCost;
  const lock = networkLockShort(device.network_lock);
  const warrantyDays =
    device.warranty_period === "7_day" ? 7 : device.warranty_period === "30_day" ? 30 : 0;

  const handlePrintReceipt = async () => {
    const warrantyLabel = warrantyDays > 0 ? `${warrantyDays}-Day Warranty` : "No Warranty";
    const profitColor = profit >= 0 ? "#059669" : "#dc2626";
    const html = [
      "<!DOCTYPE html><html><head><style>",
      "body{font-family:-apple-system,sans-serif;padding:32px;color:#18181b}",
      "h1{font-size:20px;margin:0 0 4px}",
      ".sub{font-size:12px;color:#71717a;margin-bottom:24px}",
      "table{width:100%;border-collapse:collapse}",
      "td{padding:8px 0;font-size:13px;border-bottom:1px solid #e4e4e7}",
      "td:last-child{text-align:right;font-weight:600}",
      ".total td{border-bottom:none;font-size:15px;font-weight:700;padding-top:12px}",
      `.profit{color:${profitColor}}`,
      "</style></head><body>",
      "<h1>iStocked Receipt</h1>",
      `<p class="sub">${device.date_sold ? formatDate(device.date_sold) : ""}</p>`,
      "<table>",
      `<tr><td>Device</td><td>${device.model}</td></tr>`,
      `<tr><td>Storage / Condition</td><td>${device.storage} &middot; ${device.condition}</td></tr>`,
      device.color ? `<tr><td>Color</td><td>${device.color}</td></tr>` : "",
      `<tr><td>IMEI</td><td>${formatImei(device.imei)}</td></tr>`,
      lock ? `<tr><td>Network</td><td>${lock}</td></tr>` : "",
      `<tr><td>Buyer</td><td>${device.customer_name || "Walk-in"}</td></tr>`,
      device.buyer_contact ? `<tr><td>Contact</td><td>${device.buyer_contact}</td></tr>` : "",
      `<tr><td>Warranty</td><td>${warrantyLabel}</td></tr>`,
      `<tr><td>Purchase Price</td><td>${formatPrice(device.buy_price)}</td></tr>`,
      Number(device.repair_cost ?? 0) > 0
        ? `<tr><td>Repair Cost</td><td>${formatPrice(device.repair_cost)}</td></tr>`
        : "",
      `<tr><td>Selling Price</td><td>${formatPrice(sold)}</td></tr>`,
      `<tr class="total"><td>Net Profit</td><td class="profit">${profit >= 0 ? "+" : ""}${formatPrice(profit)}</td></tr>`,
      "</table></body></html>",
    ].join("\n");

    try {
      const { uri } = await Print.printToFileAsync({ html });
      // Copy to a directory expo-sharing's FileProvider can actually read
      // (expo-print's internal cache isn't exposed through the Android share sheet)
      const source = new File(uri);
      const dest = new File(Paths.cache, "receipt.pdf");
      await source.copy(dest, { overwrite: true });
      await Sharing.shareAsync(dest.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share receipt",
      });
    } catch (err) {
      Alert.alert(
        "Could not generate receipt",
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    }
  };

  const handleRefund = () => {
    Alert.alert(
      "Refund transaction",
      "This will revert the sale and return the device to inventory. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refund",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDevice.mutateAsync({
                id: device.id,
                data: {
                  status: "in_stock",
                  sold_price: 0,
                  date_sold: null,
                  customer_name: null,
                  buyer_contact: null,
                  warranty_period: null,
                },
              });
              onClose();
            } catch {
              Alert.alert("Error", "Could not refund this transaction.");
            }
          },
        },
      ],
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Transaction details">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        className="px-4 pt-3"
        contentContainerClassName="pb-10"
        style={{ flexShrink: 1, maxHeight: Math.round(height * 0.45) }}
      >
        <Text className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Device info
        </Text>
        <View className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
          <DetailRow label="Model" value={device.model} />
          <DetailRow label="Storage" value={device.storage} />
          <DetailRow label="Condition" value={device.condition} />
          {device.color ? <DetailRow label="Color" value={device.color} /> : null}
          <DetailRow label="IMEI" value={formatImei(device.imei)} />
          {lock ? <DetailRow label="Network" value={lock} /> : null}
        </View>

        <Text className="mb-1.5 mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Financial breakdown
        </Text>
        <View className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
          <DetailRow label="Purchase price" value={formatPrice(device.buy_price)} />
          {Number(device.repair_cost ?? 0) > 0 ? (
            <DetailRow label="Repair / extra" value={formatPrice(device.repair_cost)} />
          ) : null}
          <DetailRow label="Selling price" value={formatPrice(sold)} />
          <View className="border-t border-dashed border-zinc-200">
            <DetailRow
              label="Net profit"
              value={`${profit >= 0 ? "+" : "\u2212"}${formatPrice(Math.abs(profit))}`}
              strong
            />
          </View>
        </View>

        <Text className="mb-1.5 mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Buyer &amp; date
        </Text>
        <View className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
          <DetailRow label="Buyer name" value={device.customer_name || "Walk-in"} />
          {device.buyer_contact ? (
            <DetailRow label="Contact" value={device.buyer_contact} />
          ) : null}
          <DetailRow label="Sale date" value={device.date_sold ? formatDate(device.date_sold) : "\u2014"} />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-zinc-500">Warranty</Text>
            <WarrantyTag period={device.warranty_period} dateSold={device.date_sold} />
          </View>
        </View>
      </ScrollView>
      <View
        className="shrink-0 flex-col gap-2 border-t border-zinc-100 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          onPress={handlePrintReceipt}
          className="h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-black active:opacity-80"
        >
          <Ionicons name="document-text-outline" size={16} color="#ffffff" />
          <Text className="text-xs font-semibold text-white">Save / share PDF receipt</Text>
        </Pressable>
        <Pressable
          onPress={handleRefund}
          className="h-11 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white active:bg-red-50"
        >
          <Ionicons name="arrow-undo-outline" size={16} color="#dc2626" />
          <Text className="text-xs font-semibold text-red-600">Refund transaction</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

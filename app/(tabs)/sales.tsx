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
import { useSales } from "@/hooks/useSales";
import { useUpdateDevice } from "@/hooks/useInventory";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { WarrantyTag } from "@/components/devices/WarrantyTag";
import { useIsTablet } from "@/hooks/useIsTablet";
import { networkLockShort } from "@/lib/networkLock";
import { formatDate, formatImei, formatPrice } from "@/utils/format";
import type { Device } from "@/types";

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2">
      <Text className="shrink text-sm text-text-muted" numberOfLines={1}>{label}</Text>
      <Text
        className={`text-sm text-text-on-surface ${strong ? "font-bold" : "font-medium"}`}
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
      accessibilityRole="button"
      accessibilityLabel={`View sale details for ${device.model}`}
      className={`flex-row items-center gap-3 py-2.5 active:opacity-70 ${last ? "" : "border-b border-dashed border-border-subtle"}`}
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-surface-secondary">
        <Ionicons name="checkmark" size={15} color="#3f3f46" />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink text-sm font-semibold text-text-on-surface">
            {device.model}
          </Text>
          {lock ? (
            <View className="rounded border border-border-subtle bg-bg-surface-secondary px-1.5 py-px">
              <Text className="text-[9px] font-semibold text-text-muted-foreground">{lock}</Text>
            </View>
          ) : null}
        </View>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink text-[11px] text-text-muted">
            {device.date_sold ? formatDate(device.date_sold) : "\u2014"} · {device.customer_name ?? "Walk-in"}
          </Text>
          <WarrantyTag period={device.warranty_period} dateSold={device.date_sold} />
        </View>
      </View>

      <View className="items-end">
        <Text numberOfLines={1} className="text-sm font-bold text-text-on-surface">
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
  
  // Calculate additional totals
  const yearRevenue = useMemo(() => {
    return (data ?? [])
      .filter(d => {
        const date = d.date_sold ? new Date(d.date_sold) : new Date();
        return date.getFullYear() === selectedYear;
      })
      .reduce((sum, d) => sum + Number(d.sold_price ?? 0), 0);
  }, [data, selectedYear]);
  
  const yearCost = useMemo(() => {
    return (data ?? [])
      .filter(d => {
        const date = d.date_sold ? new Date(d.date_sold) : new Date();
        return date.getFullYear() === selectedYear;
      })
      .reduce((sum, d) => sum + Number(d.buy_price) + Number(d.repair_cost ?? 0), 0);
  }, [data, selectedYear]);

  const displayTotal = selectedGroup ? selectedGroup.profit : yearTotal;
  const displayCount = selectedGroup ? selectedGroup.count : yearCount;
  const displayRevenue = selectedGroup 
    ? selectedGroup.items.reduce((sum, d) => sum + Number(d.sold_price ?? 0), 0)
    : yearRevenue;
  const displayCost = selectedGroup
    ? selectedGroup.items.reduce((sum, d) => sum + Number(d.buy_price) + Number(d.repair_cost ?? 0), 0)
    : yearCost;

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
          Couldn&apos;t load sales history
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-state-error">
          {error instanceof Error ? error.message : "Something went wrong."}
        </Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading sales history"
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
            <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Flip ledger
            </Text>
            <Text className="mt-1 text-3xl font-bold text-text-on-surface">Sales history</Text>
          </View>
        </View>
      </View>

      {/* Totals strip */}
      <View className="px-4 pt-4">
        <View className="rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-sm">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted" numberOfLines={1}>
                {selectedGroup
                  ? selectedGroup.label
                  : selectedYear === new Date().getFullYear()
                    ? "This year"
                    : String(selectedYear)}
              </Text>
              <Text className="mt-1 text-lg font-bold text-text-on-surface" numberOfLines={1}>
                {formatPrice(displayTotal)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-text-muted" numberOfLines={1}>
                {displayCount} {displayCount === 1 ? "sale" : "sales"}
              </Text>
            </View>
            <View className="w-px bg-border-subtle" />
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted" numberOfLines={1}>
                {selectedGroup ? "Per sale" : "Avg. per sale"}
              </Text>
              <Text className="mt-1 text-lg font-bold text-text-on-surface" numberOfLines={1}>
                {formatPrice(displayCount ? displayTotal / displayCount : 0)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-text-muted" numberOfLines={1}>
                {selectedGroup ? "in this month" : "across this year"}
              </Text>
            </View>
          </View>
          <View className="mt-3 flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted" numberOfLines={1}>
                Revenue
              </Text>
              <Text className="mt-1 text-lg font-bold text-emerald-700" numberOfLines={1}>
                {formatPrice(displayRevenue)}
              </Text>
            </View>
            <View className="w-px bg-border-subtle" />
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted" numberOfLines={1}>
                Cost
              </Text>
              <Text className="mt-1 text-lg font-bold text-state-error" numberOfLines={1}>
                {formatPrice(displayCost)}
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
            <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Period
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => changeYear(Math.max(Math.min(...availableYears), selectedYear - 1))}
                accessibilityRole="button"
                accessibilityLabel="Previous year"
                hitSlop={8}
                className="active:opacity-60"
              >
                <Ionicons name="chevron-back" size={18} color="#71717a" />
              </Pressable>
              <Text className="text-sm font-bold text-text-on-surface min-w-[3ch] text-center">
                {selectedYear}
              </Text>
              <Pressable
                onPress={() => changeYear(Math.min(Math.max(...availableYears), selectedYear + 1))}
                accessibilityRole="button"
                accessibilityLabel="Next year"
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
              accessibilityRole="button"
              accessibilityLabel="Show all months"
              accessibilityState={{ selected: selectedMonth === null }}
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
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${shortMonth(g.key)}`}
                accessibilityState={{ selected: selectedMonth === g.key }}
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
        <Text className="pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
          Transactions
        </Text>

        {filteredGroups.length === 0 ? (
          <View className="rounded-2xl border border-border-subtle bg-bg-surface px-4">
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
                  <Text className="text-sm font-bold text-text-on-surface">{group.label}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[11px] font-medium text-text-muted">
                      {group.count} {group.count === 1 ? "sale" : "sales"}
                    </Text>
                    <Text
                      className={`text-sm font-bold ${group.profit >= 0 ? "text-emerald-700" : "text-state-error"}`}
                    >
                      {group.profit >= 0 ? "+" : "\u2212"}
                      {formatPrice(Math.abs(group.profit))} net
                    </Text>
                  </View>
                </View>
                <View className="rounded-2xl border border-border-subtle bg-bg-surface px-4">
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
  const isTablet = useIsTablet();
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
    const buyerName = device.customer_name || "Walk-in Customer";
    const saleDate = device.date_sold ? formatDate(device.date_sold) : "";
    const imeiFormatted = formatImei(device.imei);

    const html = [
      "<!DOCTYPE html><html><head><style>",
      "body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px 32px;color:#18181b;background:#fff}",
      "@media print { body { padding: 0; } }",
      ".receipt{max-width:420px;margin:0 auto;background:#fff}",
      ".header{text-align:center;border-bottom:2px solid #18181b;padding-bottom:24px;margin-bottom:24px}",
      ".shop-name{font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#71717a;margin-bottom:8px}",
      ".receipt-title{font-size:28px;font-weight:800;color:#18181b;margin:0 0 4px;letter-spacing:-0.02em}",
      ".buyer-name{font-size:22px;font-weight:700;color:#18181b;margin:0 0 8px;letter-spacing:-0.01em}",
      ".sale-date{font-size:13px;color:#71717a;margin:0}",
      ".section{margin-bottom:20px}",
      ".section-title{font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#71717a;margin-bottom:12px;display:flex;align-items:center;gap:8px}",
      ".section-title::before{content:'';width:24px;height:1px;background:#e4e4e7}",
      ".unit-card{background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:16px}",
      ".unit-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:13px}",
      ".unit-row:last-child{border-bottom:none;padding-bottom:0}",
      ".unit-label{color:#71717a;font-weight:500}",
      ".unit-value{color:#18181b;font-weight:600;text-align:right;max-width:65%;word-break:break-word}",
      ".unit-row.highlight .unit-value{font-size:15px;font-weight:700;color:#18181b}",
      ".financial-table{width:100%;border-collapse:collapse}",
      ".financial-table td{padding:10px 0;font-size:13px;border-bottom:1px solid #e4e4e7}",
      ".financial-table td:first-child{color:#71717a;font-weight:500}",
      ".financial-table td:last-child{text-align:right;font-weight:600;color:#18181b}",
      ".financial-table tr.total td{border-bottom:none;font-size:15px;font-weight:700;padding-top:16px}",
      `.financial-table .profit{color:${profitColor}}`,
      ".warranty-badge{display:inline-block;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:#f0fdf4;color:#059669}",
      ".warranty-badge.none{background:#fef2f2;color:#dc2626}",
      ".footer{margin-top:32px;padding-top:20px;border-top:1px solid #e4e4e7;text-align:center;font-size:11px;color:#a1a1aa}",
      "</style></head><body>",
      "<div class='receipt'>",
      "<div class='header'>",
      "<div class='shop-name'>iStocked</div>",
      "<h1 class='receipt-title'>Sales Receipt</h1>",
      `<p class='buyer-name'>${buyerName}</p>`,
      `<p class='sale-date'>${saleDate}</p>`,
      "</div>",

      "<div class='section'>",
      "<div class='section-title'>Unit Details</div>",
      "<div class='unit-card'>",
      `<div class='unit-row highlight'><span class='unit-label'>Model</span><span class='unit-value'>${device.model}</span></div>`,
      `<div class='unit-row'><span class='unit-label'>Storage / Condition</span><span class='unit-value'>${device.storage} · ${device.condition}</span></div>`,
      device.color ? `<div class='unit-row'><span class='unit-label'>Color</span><span class='unit-value'>${device.color}</span></div>` : "",
      `<div class='unit-row'><span class='unit-label'>IMEI</span><span class='unit-value'>${imeiFormatted}</span></div>`,
      lock ? `<div class='unit-row'><span class='unit-label'>Network</span><span class='unit-value'>${lock}</span></div>` : "",
      `<div class='unit-row'><span class='unit-label'>Warranty</span><span class='unit-value'>${warrantyLabel}</span></div>`,
      "</div>",
      "</div>",

      "<div class='section'>",
      "<div class='section-title'>Financial Summary</div>",
      "<table class='financial-table'>",
      `<tr><td>Purchase Price</td><td>${formatPrice(device.buy_price)}</td></tr>`,
      Number(device.repair_cost ?? 0) > 0
        ? `<tr><td>Repair Cost</td><td>${formatPrice(device.repair_cost)}</td></tr>`
        : "",
      `<tr><td>Selling Price</td><td>${formatPrice(sold)}</td></tr>`,
      `<tr class='total'><td>Net Profit</td><td class='profit'>${profit >= 0 ? "+" : "−"}${formatPrice(Math.abs(profit))}</td></tr>`,
      "</table>",
      "</div>",

      device.buyer_contact
        ? `<div class='section'><div class='section-title'>Buyer Contact</div><div class='unit-card' style='padding:12px 16px;'><div style='font-size:13px;font-weight:600;color:#18181b'>${device.buyer_contact}</div></div></div>`
        : "",

      "<div class='footer'>Thank you for your business · Generated by iStocked</div>",
      "</div>",
      "</body></html>",
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
        style={{ flexShrink: 1, maxHeight: Math.round(height * (isTablet ? 0.35 : 0.45)) }}
      >
        <Text className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          Device info
        </Text>
        <View className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-3.5">
          <DetailRow label="Model" value={device.model} />
          <DetailRow label="Storage" value={device.storage} />
          <DetailRow label="Condition" value={device.condition} />
          {device.color ? <DetailRow label="Color" value={device.color} /> : null}
          <DetailRow label="IMEI" value={formatImei(device.imei)} />
          {lock ? <DetailRow label="Network" value={lock} /> : null}
        </View>

        <Text className="mb-1.5 mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          Financial breakdown
        </Text>
        <View className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-3.5">
          <DetailRow label="Purchase price" value={formatPrice(device.buy_price)} />
          {Number(device.repair_cost ?? 0) > 0 ? (
            <DetailRow label="Repair / extra" value={formatPrice(device.repair_cost)} />
          ) : null}
          <DetailRow label="Selling price" value={formatPrice(sold)} />
          <View className="border-t border-dashed border-border-subtle">
            <DetailRow
              label="Net profit"
              value={`${profit >= 0 ? "+" : "\u2212"}${formatPrice(Math.abs(profit))}`}
              strong
            />
          </View>
        </View>

        <Text className="mb-1.5 mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          Buyer &amp; date
        </Text>
        <View className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-3.5">
          <DetailRow label="Buyer name" value={device.customer_name || "Walk-in"} />
          {device.buyer_contact ? (
            <DetailRow label="Contact" value={device.buyer_contact} />
          ) : null}
          <DetailRow label="Sale date" value={device.date_sold ? formatDate(device.date_sold) : "\u2014"} />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-text-muted">Warranty</Text>
            <WarrantyTag period={device.warranty_period} dateSold={device.date_sold} />
          </View>
        </View>
      </ScrollView>
      <View
        className="shrink-0 flex-col gap-2 border-t border-border-subtle bg-bg-surface px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          onPress={handlePrintReceipt}
          accessibilityRole="button"
          accessibilityLabel="Save or share PDF receipt"
          className="h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-text-on-surface active:opacity-80"
        >
          <Ionicons name="document-text-outline" size={16} color="#ffffff" />
          <Text className="text-xs font-semibold text-brand-primary-foreground">Save / share PDF receipt</Text>
        </Pressable>
        <Pressable
          onPress={handleRefund}
          accessibilityRole="button"
          accessibilityLabel="Refund transaction"
          className="h-11 flex-row items-center justify-center gap-2 rounded-2xl border border-state-error/30 bg-bg-surface active:bg-red-50"
        >
          <Ionicons name="arrow-undo-outline" size={16} color="#dc2626" />
          <Text className="text-xs font-semibold text-state-error">Refund transaction</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

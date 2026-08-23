import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useSales } from "../../hooks/useSales";
import { useIsTablet } from "../../hooks/useIsTablet";
import { useUpdateDevice } from "../../hooks/useInventory";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Badge } from "../../components/ui/Badge";
import { BottomSheet } from "../../components/BottomSheet";
import { EmptyState } from "../../components/EmptyState";
import { networkLockShort } from "../../lib/networkLock";
import { formatDate, formatImei, formatPrice } from "../../lib/format";
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2">
      <Text className="shrink text-sm text-zinc-500" numberOfLines={1}>{label}</Text>
      <Text className="text-sm font-medium text-zinc-950" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function SoldRow({ device, onPress }: { device: Device; onPress: () => void }) {
  const sold = Number(device.sold_price ?? 0);
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = sold - totalCost;
  const lock = networkLockShort(device.network_lock);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 active:bg-zinc-100"
    >
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
        <View className="mt-1 flex-row items-center gap-1.5">
          <WarrantyBadge period={device.warranty_period} dateSold={device.date_sold} />
          {Number(device.repair_cost ?? 0) > 0 ? (
            <Badge label={`Repair ₱${Number(device.repair_cost).toFixed(0)}`} tone="amber" />
          ) : null}
        </View>
      </View>

      <View className="items-end">
        <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
          {formatPrice(sold)}
        </Text>
        <View className="mt-1 rounded-full bg-emerald-50 px-2.5 py-1">
          <Text className="text-xs font-semibold text-emerald-700">
            {profit >= 0 ? "+" : "−"}
            {formatPrice(Math.abs(profit))} net
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function SalesHistoryScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } = useSales();
  const isTablet = useIsTablet();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const header = (
    <View className={`${isTablet ? "max-w-4xl mx-auto w-full px-6 py-6" : ""}`}>
      <ScreenHeader
        eyebrow="Flip ledger"
        title="Sales History"
        subtitle={
          data ? `${data.length} ${data.length === 1 ? "sale" : "sales"} recorded` : undefined
        }
      />
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
    <ScrollView
      className="flex-1 bg-zinc-100"
      contentContainerClassName="pb-8"
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
        {(data ?? []).length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No sales yet"
            message="Sales you record from stock will show up here."
            actionLabel="View inventory"
            onAction={() => router.push("/inventory")}
          />
        ) : (
          <View className={`flex-row flex-wrap ${isTablet ? "gap-4" : ""}`}>
            {(data ?? []).map((item) => (
              <View
                key={item.id}
                className={`${isTablet ? "w-[calc(50%-8px)]" : "w-full"}`}
              >
                <SoldRow device={item} onPress={() => setSelectedDevice(item)} />
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
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share receipt" });
      }
    } catch {
      Alert.alert("Error", "Could not generate receipt.");
    }
  };

  const handleRefund = () => {
    Alert.alert(
      "Refund Transaction",
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
    <BottomSheet visible={visible} onClose={onClose} title="Transaction Details">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Device Info
        </Text>
        <View className="rounded-xl border border-zinc-200 bg-zinc-50 px-4">
          <DetailRow label="Model" value={device.model} />
          <DetailRow label="Storage" value={device.storage} />
          <DetailRow label="Condition" value={device.condition} />
          {device.color ? <DetailRow label="Color" value={device.color} /> : null}
          <DetailRow label="IMEI" value={formatImei(device.imei)} />
          {lock ? <DetailRow label="Network" value={lock} /> : null}
        </View>

        <Text className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Financial Breakdown
        </Text>
        <View className="rounded-xl border border-zinc-200 bg-zinc-50 px-4">
          <DetailRow label="Purchase Price" value={formatPrice(device.buy_price)} />
          {Number(device.repair_cost ?? 0) > 0 ? (
            <DetailRow label="Repair / Extra" value={formatPrice(device.repair_cost)} />
          ) : null}
          <DetailRow label="Selling Price" value={formatPrice(sold)} />
          <View className="border-t border-zinc-200">
            <DetailRow
              label="Net Profit"
              value={`${profit >= 0 ? "+" : ""}${formatPrice(profit)}`}
            />
          </View>
        </View>

        <Text className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Buyer & Date
        </Text>
        <View className="rounded-xl border border-zinc-200 bg-zinc-50 px-4">
          <DetailRow label="Buyer Name" value={device.customer_name || "Walk-in"} />
          {device.buyer_contact ? (
            <DetailRow label="Contact" value={device.buyer_contact} />
          ) : null}
          <DetailRow label="Sale Date" value={device.date_sold ? formatDate(device.date_sold) : "\u2014"} />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-zinc-500">Warranty</Text>
            <WarrantyBadge period={device.warranty_period} dateSold={device.date_sold} />
          </View>
        </View>

        <View className="mt-5 gap-3">
          <Pressable
            onPress={handlePrintReceipt}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-black py-3 active:bg-zinc-900"
          >
            <Ionicons name="print-outline" size={18} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Print / Export Receipt</Text>
          </Pressable>
          <Pressable
            onPress={handleRefund}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 active:bg-red-50"
          >
            <Ionicons name="arrow-undo-outline" size={18} color="#dc2626" />
            <Text className="text-sm font-semibold text-red-600">Refund Transaction</Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

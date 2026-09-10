import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "./BottomSheet";
import { useRecordSale } from "../hooks/useSales";
import { DateField } from "./ui/DateField";
import { formatPrice, todayIso } from "../lib/format";
import type { Device, WarrantyPeriod } from "../types";

const inputClass =
  "h-12 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full";

interface RecordSaleSheetProps {
  device: Device | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </Text>
      {children}
    </View>
  );
}

const WARRANTY_OPTIONS: { label: string; value: WarrantyPeriod; short: string }[] = [
  { label: "No warranty", value: "none", short: "No" },
  { label: "7-day warranty", value: "7_day", short: "7-day" },
  { label: "30-day warranty", value: "30_day", short: "30-day" },
];

export function RecordSaleSheet({ device, onClose }: RecordSaleSheetProps) {
  const recordSale = useRecordSale();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [customerName, setCustomerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [dateSold, setDateSold] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState<WarrantyPeriod>("none");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setCustomerName("");
      setBuyerContact("");
      setSoldPrice(String(device.list_price));
      setDateSold(todayIso());
      setWarrantyPeriod("none");
      setError(null);
    }
  }, [device]);

  if (!device) return null;

  const price = Number(soldPrice) || 0;
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = price - totalCost;
  const positive = profit >= 0;

  const handleConfirm = async () => {
    if (price <= 0) {
      setError("Enter a valid sold price.");
      return;
    }
    setError(null);
    try {
      await recordSale.mutateAsync({
        deviceId: device.id,
        customerName: customerName.trim(),
        soldPrice: price,
        buyerContact: buyerContact.trim() || undefined,
        warrantyPeriod,
        dateSold: dateSold
          ? new Date(`${dateSold}T00:00:00`).toISOString()
          : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't record the sale.");
    }
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Record sale"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        className="px-4 pt-2"
        contentContainerClassName="pb-10 gap-4"
        style={{ flexShrink: 1, maxHeight: Math.round(height * 0.55) }}
      >
        {/* Device summary — horizontal, left-aligned */}
        <View className="flex-row items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4">
          <View className="flex-1 pr-3">
            <Text numberOfLines={1} className="text-sm font-bold text-zinc-950">
              {device.model}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-zinc-500">
              {device.storage} · {device.condition}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs font-medium text-zinc-600">
              Cost {formatPrice(totalCost)}
            </Text>
            {Number(device.repair_cost ?? 0) > 0 ? (
              <Text className="mt-0.5 text-[11px] text-zinc-400">
                incl. repair {formatPrice(device.repair_cost)}
              </Text>
            ) : null}
          </View>
        </View>

        <Field label="Customer name">
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="e.g. Juan dela Cruz"
            placeholderTextColor="#a1a1aa"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>

        <Field label="Buyer contact">
          <TextInput
            value={buyerContact}
            onChangeText={setBuyerContact}
            placeholder="Phone or link"
            placeholderTextColor="#a1a1aa"
            autoCapitalize="none"
            autoCorrect={false}
            className={inputClass}
          />
        </Field>

        <Field label="Final sold price (₱)">
          <TextInput
            value={soldPrice}
            onChangeText={(t) => setSoldPrice(t.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            placeholderTextColor="#a1a1aa"
            keyboardType="decimal-pad"
            className={inputClass}
          />
        </Field>

        <Field label="Date sold">
          <DateField value={dateSold} onChange={setDateSold} />
        </Field>

        {/* Warranty chips */}
        <View>
          <Text className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Warranty
          </Text>
          <View className="flex-row gap-2">
            {WARRANTY_OPTIONS.map((option) => {
              const selected = warrantyPeriod === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setWarrantyPeriod(option.value)}
                  className="h-10 flex-1 items-center justify-center rounded-xl border active:opacity-80"
                  style={{
                    backgroundColor: selected ? "#000000" : "#ffffff",
                    borderColor: selected ? "#000000" : "#e4e4e7",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    className="text-xs font-semibold"
                    style={{ color: selected ? "#ffffff" : "#3f3f46" }}
                  >
                    {option.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Profit banner — horizontal split */}
        <View
          className="flex-row items-center justify-between rounded-2xl border px-5 py-3.5"
          style={{
            backgroundColor: positive ? "#ecfdf5" : "#fef2f2",
            borderColor: positive ? "#a7f3d0" : "#fecaca",
          }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-[0.16em]"
            style={{ color: positive ? "#065f46" : "#991b1b" }}
          >
            Profit
          </Text>
          <Text
            className="text-base font-extrabold"
            style={{ color: positive ? "#047857" : "#b91c1c" }}
          >
            {positive ? "+" : "\u2212"}
            {formatPrice(Math.abs(profit))}
          </Text>
        </View>

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      </ScrollView>

      <View
        className="shrink-0 flex-row gap-3 border-t border-zinc-100 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          onPress={onClose}
          className="h-11 flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white active:bg-zinc-100"
        >
          <Text className="text-xs font-semibold text-zinc-950">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={recordSale.isPending}
          className="h-11 flex-1 items-center justify-center rounded-2xl bg-black active:opacity-80"
        >
          {recordSale.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-xs font-semibold text-white">Confirm sale</Text>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

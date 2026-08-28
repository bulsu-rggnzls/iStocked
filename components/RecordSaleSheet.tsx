import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BottomSheet } from "./BottomSheet";
import { useRecordSale } from "../hooks/useSales";
import { formatPrice } from "../lib/format";
import type { Device, WarrantyPeriod } from "../types";

const inputClass =
  "h-10 px-3.5 rounded-xl border-zinc-200 text-xs font-medium focus:ring-2 focus:ring-zinc-900 w-full border bg-white text-zinc-950";

interface RecordSaleSheetProps {
  device: Device | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex flex-col">
      <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1 block text-left">
        {label}
      </Text>
      {children}
    </View>
  );
}

const WARRANTY_OPTIONS: { label: string; value: WarrantyPeriod; desc: string }[] = [
  { label: "No warranty", value: "none", desc: "Sold as-is" },
  { label: "7-day warranty", value: "7_day", desc: "Covers 7 days from sale" },
  { label: "30-day warranty", value: "30_day", desc: "Covers 30 days from sale" },
];

export function RecordSaleSheet({ device, onClose }: RecordSaleSheetProps) {
  const recordSale = useRecordSale();
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
      setDateSold(new Date().toISOString().slice(0, 10));
      setWarrantyPeriod("none");
      setError(null);
    }
  }, [device]);

  if (!device) return null;

  const price = Number(soldPrice) || 0;
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = price - totalCost;

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
        dateSold: dateSold.trim()
          ? new Date(`${dateSold.trim()}T00:00:00`).toISOString()
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
        className="flex-1 overflow-y-auto px-4 pt-2 pb-20 space-y-3"
        contentContainerClassName="pb-4 space-y-3"
      >
        <View className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 flex items-center justify-between text-left">
          <View className="flex flex-col items-center text-center flex-1">
            <Text className="text-sm font-bold text-zinc-900 text-center">
              {device.model}
            </Text>
            <Text className="text-xs font-mono text-zinc-400 text-center">
              {device.imei}
            </Text>
          </View>
          <View className="flex flex-col text-right">
            <Text className="text-xs text-zinc-600 text-right">Cost: {formatPrice(totalCost)}</Text>
            {Number(device.repair_cost ?? 0) > 0 ? (
              <Text className="text-xs text-zinc-400 text-right">+ repair {formatPrice(device.repair_cost)}</Text>
            ) : null}
          </View>
        </View>

        <View className="flex flex-col space-y-3">
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
            <TextInput
              value={dateSold}
              onChangeText={setDateSold}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#a1a1aa"
              autoCapitalize="none"
              autoCorrect={false}
              className={`${inputClass} font-mono tracking-wide`}
            />
          </Field>
        </View>

        <View className="space-y-1">
          <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase block text-left">Warranty</Text>
          <View className="flex items-center gap-1.5" style={{ flexDirection: "row" }}>
            {WARRANTY_OPTIONS.map((option) => {
              const selected = warrantyPeriod === option.value;
              const shortLabel = option.value === "none" ? "No" : option.value === "7_day" ? "7-day" : "30-day";
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setWarrantyPeriod(option.value)}
                  className={`flex items-center justify-center px-2.5 py-1.5 text-xs rounded-lg font-medium border active:opacity-80 ${
                    selected ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      selected ? "text-white" : "text-zinc-700"
                    }`}
                    numberOfLines={1}
                  >
                    {shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-3 flex items-center justify-between text-left">
          <Text className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Profit</Text>
          <Text className="text-base font-extrabold text-emerald-700">
            {formatPrice(profit)}
          </Text>
        </View>

        {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
      </ScrollView>

      <View className="shrink-0 p-4 bg-white/95 backdrop-blur-md border-t border-zinc-100 flex gap-2 z-10">
        <View className="flex-row gap-2 w-full">
          <Pressable
            onPress={onClose}
            className="flex-1 h-11 rounded-xl text-sm font-semibold w-full border border-zinc-200 bg-white items-center justify-center active:bg-zinc-100"
          >
            <Text className="text-sm font-semibold text-zinc-950">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            disabled={recordSale.isPending}
            className="flex-1 h-11 rounded-xl text-sm font-semibold w-full bg-zinc-900 items-center justify-center active:bg-black disabled:opacity-60"
          >
            {recordSale.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-sm font-semibold text-white">Confirm sale</Text>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

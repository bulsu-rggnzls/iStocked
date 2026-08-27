import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./ui/Button";
import { useRecordSale } from "../hooks/useSales";
import { formatPrice } from "../lib/format";
import type { Device, WarrantyPeriod } from "../types";

const inputClass =
  "rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-base text-zinc-950";

interface RecordSaleSheetProps {
  device: Device | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <Text className="text-base font-semibold text-zinc-950">
            {device.model}
          </Text>
          <Text className="mt-0.5 font-mono text-xs tracking-wide text-zinc-500">
            {device.imei}
          </Text>
          <View className="mt-3 flex-row items-center justify-between border-t border-zinc-200 pt-3">
            <Text className="text-sm text-zinc-500">Bought for</Text>
            <Text className="text-sm font-medium text-zinc-950">
              {formatPrice(device.buy_price)}
            </Text>
          </View>
          {Number(device.repair_cost ?? 0) > 0 ? (
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-zinc-500">Repair cost</Text>
              <Text className="text-sm font-medium text-zinc-950">
                {formatPrice(device.repair_cost)}
              </Text>
            </View>
          ) : null}
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

        <Field label="Buyer contact (optional)">
          <TextInput
            value={buyerContact}
            onChangeText={setBuyerContact}
            placeholder="Name, phone, or social link"
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

        <Field label="Date sold (YYYY-MM-DD)">
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

        <Field label="Warranty">
          <View className="grid grid-cols-3 gap-2">
            {WARRANTY_OPTIONS.map((option) => {
              const selected = warrantyPeriod === option.value;
              const shortLabel = option.value === "none" ? "No" : option.value === "7_day" ? "7-day" : "30-day";
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setWarrantyPeriod(option.value)}
                  className={`items-center justify-center rounded-full border px-3 py-2 active:opacity-80 ${
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
        </Field>

        <View className="mb-4 flex-row items-center justify-between rounded-xl bg-zinc-100 px-4 py-3">
          <Text className="text-sm font-semibold text-zinc-700">Profit</Text>
          <Text className="text-base font-bold text-zinc-950">
            {formatPrice(profit)}
          </Text>
        </View>

        {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancel" variant="secondary" onPress={onClose} />
          </View>
          <View className="flex-1">
            <Button
              title="Confirm sale"
              onPress={handleConfirm}
              loading={recordSale.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

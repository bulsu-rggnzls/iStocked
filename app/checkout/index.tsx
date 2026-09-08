import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDevice } from "../../hooks/useInventory";
import { useRecordSale } from "../../hooks/useSales";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { DateField } from "../../components/ui/DateField";
import { AppHeader } from "../../components/ui/AppHeader";
import { formatImei, formatPrice, todayIso } from "../../lib/format";
import type { WarrantyPeriod } from "../../types";

const WARRANTY_OPTIONS: { label: string; value: WarrantyPeriod; desc: string }[] = [
  { label: "No warranty", value: "none", desc: "Sold as-is" },
  { label: "7-day warranty", value: "7_day", desc: "Covers 7 days from sale" },
  { label: "30-day warranty", value: "30_day", desc: "Covers 30 days from sale" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const { data: device, isLoading, isError } = useDevice(deviceId);

  const [customerName, setCustomerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [dateSold, setDateSold] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState<WarrantyPeriod>("none");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setSoldPrice(String(device.list_price));
      setDateSold(todayIso());
    }
  }, [device]);

  const recordSale = useRecordSale();

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Record Sale" />
        <View className="flex-1 items-center justify-center bg-zinc-100">
          <ActivityIndicator size="large" color="#09090b" />
        </View>
      </>
    );
  }

  if (isError || !device) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Record Sale" />
        <View className="flex-1 items-center justify-center bg-zinc-100 px-8">
          <Text className="text-center text-base font-semibold text-zinc-950">
            Couldn't load this device
          </Text>
        </View>
      </>
    );
  }

  const price = Number(soldPrice) || 0;
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const profit = price - totalCost;

  const handleConfirm = () => {
    setError(null);
    if (price <= 0) {
      setError("Enter a valid sold price.");
      return;
    }
    recordSale.mutate(
      {
        deviceId: device.id,
        customerName: customerName.trim(),
        soldPrice: price,
        buyerContact: buyerContact.trim(),
        warrantyPeriod,
        dateSold: dateSold
          ? new Date(`${dateSold}T00:00:00`).toISOString()
          : undefined,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-zinc-100">
        <AppHeader title="Record Sale" />
        <ScrollView contentContainerClassName="p-5 pb-6" bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Item summary
          </Text>

          <View className="mt-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <Text className="text-xl font-bold text-zinc-950">
              {device.model}
            </Text>
            <Text className="mt-1 font-mono text-sm tracking-wide text-zinc-500">
              {formatImei(device.imei)}
            </Text>
            <Text className="mt-1 text-sm text-zinc-500">
              {device.storage} · {device.condition}
            </Text>
            <View className="mt-3 flex-row items-center justify-between border-t border-zinc-100 pt-3">
              <Text className="text-sm text-zinc-500">Bought for</Text>
              <Text className="text-sm font-semibold text-zinc-950">
                {formatPrice(device.buy_price)}
              </Text>
            </View>
            {Number(device.repair_cost ?? 0) > 0 ? (
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-sm text-zinc-500">Repair cost</Text>
                <Text className="text-sm font-semibold text-zinc-950">
                  {formatPrice(device.repair_cost)}
                </Text>
              </View>
            ) : null}
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-zinc-500">List price</Text>
              <Text className="text-lg font-bold text-zinc-950">
                {formatPrice(device.list_price)}
              </Text>
            </View>
          </View>

          <Text className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Sale details
          </Text>
          <View className="mt-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <TextField
              label="Customer name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Juan dela Cruz"
            />
            <View className="mt-4">
              <TextField
                label="Buyer contact / social link"
                value={buyerContact}
                onChangeText={setBuyerContact}
                placeholder="Name, phone, or social link"
                autoCapitalize="none"
              />
            </View>
            <View className="mt-4">
              <TextField
                label="Final sold price (₱)"
                value={soldPrice}
                onChangeText={(t) => setSoldPrice(t.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="mt-4">
              <DateField label="Date sold" value={dateSold} onChange={setDateSold} />
            </View>

            <Text className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              Warranty
            </Text>
            <View className="gap-2">
              {WARRANTY_OPTIONS.map((option) => {
                const selected = warrantyPeriod === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setWarrantyPeriod(option.value)}
                    className="flex-row items-center justify-between rounded-xl border px-4 py-3 active:opacity-80"
                    style={{
                      backgroundColor: selected ? "#09090b" : "#ffffff",
                      borderColor: selected ? "#09090b" : "#e4e4e7",
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: selected ? "#ffffff" : "#09090b" }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: selected ? "#a1a1aa" : "#71717a" }}
                      >
                        {option.desc}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    ) : (
                      <View className="h-5 w-5 rounded-full border border-zinc-300" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? (
            <Text className="mt-4 text-sm leading-5 text-red-600">{error}</Text>
          ) : null}
        </ScrollView>

        <View
          className="border-t border-zinc-200 bg-white px-5 py-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Sold for
              </Text>
              <Text className="text-2xl font-bold text-zinc-950">
                {formatPrice(price)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-zinc-500">Profit</Text>
              <Text
                className={`text-sm font-semibold ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}
              >
                {profit >= 0 ? "+" : "\u2212"}
                {formatPrice(Math.abs(profit))}
              </Text>
            </View>
          </View>
          <View className="mt-3">
            <Button
              title="Confirm sale"
              onPress={handleConfirm}
              loading={recordSale.isPending}
            />
          </View>
        </View>
      </View>
    </>
  );
}

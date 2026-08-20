import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDevice } from "../../hooks/useInventory";
import { useRecordSale } from "../../hooks/useSales";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { AppHeader } from "../../components/ui/AppHeader";
import { formatImei, formatPrice } from "../../lib/format";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const { data: device, isLoading, isError } = useDevice(deviceId);

  const [customerName, setCustomerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [dateSold, setDateSold] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setSoldPrice(String(device.list_price));
      setDateSold(new Date().toISOString().slice(0, 10));
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
        dateSold: dateSold.trim()
          ? new Date(`${dateSold.trim()}T00:00:00`).toISOString()
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
        <ScrollView contentContainerClassName="p-5 pb-6">
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
              <TextField
                label="Date sold (YYYY-MM-DD)"
                value={dateSold}
                onChangeText={setDateSold}
                placeholder="YYYY-MM-DD"
              />
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
              <Text className="text-sm font-semibold text-zinc-900">
                {formatPrice(profit)}
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
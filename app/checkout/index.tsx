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
import { useCompleteSale } from "../../hooks/useSales";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { FilterChips } from "../../components/ui/FilterChips";
import { AppHeader } from "../../components/ui/AppHeader";
import { formatImei, formatPrice } from "../../lib/format";

const PAYMENT_OPTIONS = [
  { label: "Cash", value: "cash" },
  { label: "GCash", value: "gcash" },
  { label: "Bank Transfer", value: "bank transfer" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const { data: device, isLoading, isError } = useDevice(deviceId);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [finalPrice, setFinalPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) setFinalPrice(String(device.selling_price));
  }, [device]);

  const completeSale = useCompleteSale();

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Checkout" />
        <View className="flex-1 items-center justify-center bg-[#F6F8F5]">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </>
    );
  }

  if (isError || !device) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Checkout" />
        <View className="flex-1 items-center justify-center bg-[#F6F8F5] px-8">
          <Text className="text-center text-base font-semibold text-[#13241B]">
            Couldn't load this device
          </Text>
        </View>
      </>
    );
  }

  const price = Number(finalPrice) || 0;
  const profit = price - Number(device.cost_price);

  const handleComplete = () => {
    setError(null);
    if (!customerName.trim()) {
      setError("Enter the customer's name to continue.");
      return;
    }
    if (price <= 0) {
      setError("Enter a valid final price.");
      return;
    }
    completeSale.mutate(
      {
        device,
        customerName: customerName.trim(),
        phone: phone.trim() || undefined,
        finalPrice: price,
        paymentMethod,
      },
      {
        onSuccess: () => router.replace("/"),
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-[#F6F8F5]">
        <AppHeader title="Checkout" />
        <ScrollView contentContainerClassName="p-5 pb-6">
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5F6F64]">
            Item summary
          </Text>

          <View className="mt-3 rounded-2xl border border-[#E3E8E2] bg-white p-5">
            <Text className="text-xl font-bold text-[#13241B]">
              {device.model}
            </Text>
            <Text className="mt-1 font-mono text-sm tracking-wide text-[#5F6F64]">
              {formatImei(device.imei)}
            </Text>
            <Text className="mt-1 text-sm text-[#5F6F64]">
              {device.storage} · {device.condition}
            </Text>
            <View className="mt-3 flex-row items-center justify-between border-t border-[#EFF2EE] pt-3">
              <Text className="text-sm text-[#5F6F64]">Selling price</Text>
              <Text className="text-lg font-bold text-[#13241B]">
                {formatPrice(device.selling_price)}
              </Text>
            </View>
          </View>

          <Text className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5F6F64]">
            Customer
          </Text>
          <View className="mt-3 rounded-2xl border border-[#E3E8E2] bg-white p-5">
            <TextField
              label="Full name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Juan dela Cruz"
            />
            <View className="mt-4">
              <TextField
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Optional"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Text className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5F6F64]">
            Payment method
          </Text>
          <FilterChips
            options={PAYMENT_OPTIONS}
            value={paymentMethod}
            onChange={setPaymentMethod}
          />

          <Text className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5F6F64]">
            Final price
          </Text>
          <View className="rounded-2xl border border-[#E3E8E2] bg-white p-5">
            <TextField
              label="Amount"
              value={finalPrice}
              onChangeText={setFinalPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {error ? (
            <Text className="mt-4 text-sm leading-5 text-red-600">{error}</Text>
          ) : null}
        </ScrollView>

        <View
          className="border-t border-[#E3E8E2] bg-white px-5 py-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5F6F64]">
                Total
              </Text>
              <Text className="text-2xl font-bold text-[#13241B]">
                {formatPrice(price)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-[#5F6F64]">Est. profit</Text>
              <Text className="text-sm font-semibold text-brand-700">
                {formatPrice(profit)}
              </Text>
            </View>
          </View>
          <View className="mt-3">
            <Button
              title="Complete sale"
              onPress={handleComplete}
              loading={completeSale.isPending}
            />
          </View>
        </View>
      </View>
    </>
  );
}
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useDevice, useUpdateDevice } from "../../hooks/useInventory";
import type { Device } from "../../types";
import { AppHeader } from "../../components/ui/AppHeader";
import { StatusBadge } from "../../components/ui/Badge";
import { FilterChips } from "../../components/ui/FilterChips";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { formatImei, formatPrice } from "../../lib/format";

const STATUS_OPTIONS = [
  { label: "In stock", value: "in_stock" },
  { label: "Sold", value: "sold" },
  { label: "Reserved", value: "reserved" },
];

const CONDITION_OPTIONS = [
  { label: "Brand New", value: "Brand New" },
  { label: "Excellent", value: "Excellent" },
  { label: "Good", value: "Good" },
  { label: "Fair", value: "Fair" },
];

function MarginTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-brand-500 bg-brand-50"
          : "border-[#E3E8E2] bg-white"
      }`}
    >
      <Text
        className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
          highlight ? "text-brand-900" : "text-[#5F6F64]"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`mt-1.5 text-xl font-bold ${
          highlight ? "text-brand-900" : "text-[#13241B]"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

export default function DeviceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: device, isLoading, isError, error } = useDevice(id);
  const updateMutation = useUpdateDevice();

  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [status, setStatus] = useState("in_stock");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) return;
    setCostPrice(String(device.cost_price));
    setSellingPrice(String(device.selling_price));
    setCondition(device.condition);
    setStatus(device.status);
  }, [device]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Device" />
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
        <AppHeader title="Device" />
        <View className="flex-1 items-center justify-center bg-[#F6F8F5] px-8">
          <Text className="text-center text-base font-semibold text-[#13241B]">
            Couldn't load this device
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-red-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
        </View>
      </>
    );
  }

  const cost = Number(costPrice) || 0;
  const sell = Number(sellingPrice) || 0;
  const profit = sell - cost;
  const margin = sell > 0 ? ((profit / sell) * 100).toFixed(0) : "0";

  const handleSave = () => {
    setSaveError(null);
    updateMutation.mutate(
      {
        id: device.id,
        data: {
          cost_price: Number(costPrice) || 0,
          selling_price: Number(sellingPrice) || 0,
          condition,
          status: status as Device["status"],
        },
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
        onError: (err: Error) => setSaveError(err.message),
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Device" />
      <ScrollView className="flex-1 bg-[#F6F8F5]" contentContainerClassName="pb-10">
        <View className="bg-[#13241B] px-5 pb-8 pt-6">
          <Text className="text-2xl font-bold text-white">{device.model}</Text>
          <Text className="mt-1.5 font-mono text-sm tracking-wide text-white/70">
            {formatImei(device.imei)}
          </Text>
          <View className="mt-3">
            <StatusBadge status={device.status} />
          </View>
        </View>

        <View className="-mt-5 px-5">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <MarginTile label="Cost price" value={formatPrice(cost)} />
            </View>
            <View className="flex-1">
              <MarginTile label="Selling price" value={formatPrice(sell)} />
            </View>
          </View>
          <View className="mt-3">
            <MarginTile
              label="Profit margin"
              value={`${formatPrice(profit)} (${margin}%)`}
              highlight
            />
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5F6F64]">
            Edit details
          </Text>

          <View className="rounded-2xl border border-[#E3E8E2] bg-white p-5">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Cost price"
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Selling price"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3A4A40]">
              Condition
            </Text>
            <FilterChips
              options={CONDITION_OPTIONS}
              value={condition}
              onChange={setCondition}
            />

            <Text className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3A4A40]">
              Status
            </Text>
            <FilterChips
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />

            {saveError ? (
              <Text className="mt-4 text-sm text-red-600">{saveError}</Text>
            ) : null}

            <View className="mt-6">
              <Button
                title={saved ? "Saved" : "Save changes"}
                onPress={handleSave}
                loading={updateMutation.isPending}
                disabled={saved}
              />
            </View>
          </View>

          {device.status === "in_stock" ? (
            <View className="mt-5">
              <Button
                title="Sell this device"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/checkout",
                    params: { deviceId: device.id },
                  })
                }
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
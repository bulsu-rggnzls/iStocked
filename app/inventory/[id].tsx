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
];

const CONDITION_OPTIONS = [
  { label: "Brand New", value: "Brand New" },
  { label: "Like New", value: "Like New" },
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
          ? "border-zinc-900 bg-zinc-900"
          : "border-zinc-200 bg-white"
      }`}
    >
      <Text
        className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
          highlight ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`mt-1.5 text-xl font-bold ${
          highlight ? "text-white" : "text-zinc-950"
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

  const [buyPrice, setBuyPrice] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [condition, setCondition] = useState("Good");
  const [status, setStatus] = useState("in_stock");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) return;
    setBuyPrice(String(device.buy_price));
    setListPrice(String(device.list_price));
    setCondition(device.condition);
    setStatus(device.status);
  }, [device]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Device" />
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
        <AppHeader title="Device" />
        <View className="flex-1 items-center justify-center bg-zinc-100 px-8">
          <Text className="text-center text-base font-semibold text-zinc-950">
            Couldn't load this device
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-red-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
        </View>
      </>
    );
  }

  const buy = Number(buyPrice) || 0;
  const list = Number(listPrice) || 0;
  const sold = Number(device.sold_price ?? 0);
  const profit = device.status === "sold" ? sold - buy : list - buy;
  const margin = list > 0 ? ((profit / list) * 100).toFixed(0) : "0";

  const handleSave = () => {
    setSaveError(null);
    updateMutation.mutate(
      {
        id: device.id,
        data: {
          buy_price: Number(buyPrice) || 0,
          list_price: Number(listPrice) || 0,
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
      <ScrollView className="flex-1 bg-zinc-100" contentContainerClassName="pb-10">
        <View className="bg-zinc-950 px-5 pb-8 pt-6">
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
              <MarginTile label="Buy price" value={formatPrice(buy)} />
            </View>
            <View className="flex-1">
              <MarginTile label="List price" value={formatPrice(list)} />
            </View>
          </View>
          <View className="mt-3">
            <MarginTile
              label="Profit"
              value={`${formatPrice(profit)} (${margin}%)`}
              highlight
            />
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Edit details
          </Text>

          <View className="rounded-2xl border border-zinc-200 bg-white p-5">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Buy price"
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="List price"
                  value={listPrice}
                  onChangeText={setListPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Condition
            </Text>
            <FilterChips
              options={CONDITION_OPTIONS}
              value={condition}
              onChange={setCondition}
            />

            <Text className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
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
                title="Record sale"
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
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  useDevice,
  useDeleteDevice,
  useUpdateDevice,
} from "../../hooks/useInventory";
import { AppHeader } from "../../components/ui/AppHeader";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { RecordSaleSheet } from "../../components/RecordSaleSheet";
import { NETWORK_LOCK_OPTIONS, networkLockShort } from "../../lib/networkLock";
import { formatImei, formatPrice } from "../../lib/format";

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITION_OPTIONS = ["Brand New", "Like New", "Good", "Fair"];

type Tab = "overview" | "edit";

function SegmentedControl({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "edit", label: "Edit Specs" },
  ];
  return (
    <View className="flex-row rounded-xl bg-zinc-200 p-1">
      {tabs.map((tab) => {
        const selected = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`flex-1 items-center rounded-lg py-2 active:opacity-80 ${
              selected ? "bg-black" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                selected ? "text-white" : "text-zinc-600"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
  even = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  even?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center rounded-full px-3 py-1.5 active:opacity-80 ${
        even ? "min-w-[64px] flex-1" : ""
      } ${selected ? "bg-black" : "border border-zinc-200 bg-white"}`}
    >
      <Text
        className={`text-xs font-medium ${
          selected ? "text-white" : "text-zinc-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PickerField({
  label,
  options,
  value,
  onChange,
  even = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  even?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {options.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(option)}
            even={even}
          />
        ))}
      </View>
    </View>
  );
}

export default function DeviceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: device, isLoading, isError, error } = useDevice(id);
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  const [tab, setTab] = useState<Tab>("overview");
  const [buyPrice, setBuyPrice] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [storage, setStorage] = useState("");
  const [condition, setCondition] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [color, setColor] = useState("");
  const [networkLock, setNetworkLock] = useState<string>(NETWORK_LOCK_OPTIONS[0]);
  const [repairCost, setRepairCost] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) return;
    setBuyPrice(String(device.buy_price));
    setListPrice(String(device.list_price));
    setStorage(device.storage);
    setCondition(device.condition);
    setBatteryHealth(
      device.battery_health !== null && device.battery_health !== undefined
        ? String(device.battery_health)
        : "",
    );
    setColor(device.color ?? "");
    setNetworkLock(device.network_lock ?? NETWORK_LOCK_OPTIONS[0]);
    setRepairCost(device.repair_cost ? String(device.repair_cost) : "");
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
  const repair = Number(repairCost) || 0;
  const sold = Number(device.sold_price ?? 0);
  const profit = device.status === "sold" ? sold - buy - repair : list - buy - repair;
  const margin = list > 0 ? ((profit / list) * 100).toFixed(0) : "0";

  const specRows = [
    {
      label: "IMEI",
      value: formatImei(device.imei),
      mono: true,
    },
    { label: "Storage", value: storage || "—" },
    { label: "Condition", value: condition || "—" },
    {
      label: "Battery health",
      value: batteryHealth.trim() ? `${batteryHealth}%` : "N/A",
    },
    { label: "Color", value: color.trim() || "N/A" },
    {
      label: "Network lock",
      value: networkLockShort(networkLock) ?? "N/A",
    },
  ];

  const handleSave = () => {
    setSaveError(null);
    const battery = batteryHealth.trim() ? Number(batteryHealth) : null;
    if (battery !== null && !(battery >= 0 && battery <= 100)) {
      setSaveError("Battery health must be between 0 and 100.");
      return;
    }
    updateMutation.mutate(
      {
        id: device.id,
        data: {
          buy_price: Number(buyPrice) || 0,
          list_price: Number(listPrice) || 0,
          storage,
          condition,
          battery_health: battery,
          color: color.trim() || null,
          network_lock: networkLock,
          repair_cost: repair,
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

  const handleDelete = () => {
    Alert.alert(
      "Delete device",
      `Permanently remove ${device.model} (${formatImei(device.imei)}) from the database? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSaveError(null);
            deleteMutation.mutate(device.id, {
              onSuccess: () => router.back(),
              onError: (err: Error) => setSaveError(err.message),
            });
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-zinc-100">
        <AppHeader
          title={device.model}
          right={<StatusBadge status={device.status} />}
        />

        <View className="px-5 pb-3">
          <SegmentedControl value={tab} onChange={setTab} />
        </View>

        {tab === "overview" ? (
          <View className="flex-1 px-5">
            <View className="rounded-2xl bg-zinc-900 p-4">
              <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Net profit
              </Text>
              <Text className="mt-1 text-3xl font-bold text-white">
                {formatPrice(profit)}
                <Text className="text-lg text-zinc-400"> ({margin}%)</Text>
              </Text>
            </View>

            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  Buy price
                </Text>
                <Text className="mt-1 text-base font-bold text-zinc-950">
                  {formatPrice(buy)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  List price
                </Text>
                <Text className="mt-1 text-base font-bold text-zinc-950">
                  {formatPrice(list)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  Repair
                </Text>
                <Text className="mt-1 text-base font-bold text-zinc-950">
                  {formatPrice(repair)}
                </Text>
              </View>
            </View>

            <Text className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Specs
            </Text>
            <View className="mt-1.5 rounded-2xl border border-zinc-200 bg-white px-4">
              {specRows.map((row, i) => (
                <View
                  key={row.label}
                  className={`flex-row items-center justify-between py-2.5 ${
                    i > 0 ? "border-t border-zinc-100" : ""
                  }`}
                >
                  <Text className="text-sm text-zinc-500">{row.label}</Text>
                  <Text
                    className={`text-sm font-semibold text-zinc-950 ${
                      row.mono ? "font-mono text-xs tracking-wide" : ""
                    }`}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-1 px-5">
            <View className="rounded-2xl border border-zinc-200 bg-white p-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField
                    label="Buy price (₱)"
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="List price (₱)"
                    value={listPrice}
                    onChangeText={setListPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View className="mt-2 flex-row gap-3">
                <View className="flex-1">
                  <PickerField
                    label="Storage"
                    options={STORAGE_OPTIONS}
                    value={storage}
                    onChange={setStorage}
                  />
                </View>
                <View className="flex-1">
                  <PickerField
                    label="Condition"
                    options={CONDITION_OPTIONS}
                    value={condition}
                    onChange={setCondition}
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField
                    label="Battery health (%)"
                    value={batteryHealth}
                    onChangeText={(t) =>
                      setBatteryHealth(t.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="e.g. 85"
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="Color"
                    value={color}
                    onChangeText={setColor}
                    placeholder="e.g. Natural Titanium"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <PickerField
                label="Network lock"
                options={NETWORK_LOCK_OPTIONS.map(
                  (o) => networkLockShort(o) ?? o,
                )}
                value={networkLockShort(networkLock) ?? networkLock}
                onChange={(short) => {
                  const full = NETWORK_LOCK_OPTIONS.find(
                    (o) => (networkLockShort(o) ?? o) === short,
                  );
                  setNetworkLock(full ?? short);
                }}
                even
              />

              <TextField
                label="Repair cost (₱)"
                value={repairCost}
                onChangeText={(t) =>
                  setRepairCost(t.replace(/[^0-9.]/g, ""))
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>

            {saveError ? (
              <Text className="mt-3 text-sm text-red-600">{saveError}</Text>
            ) : null}
          </View>
        )}

        <View className="border-t border-zinc-200 bg-white px-5 py-4">
          {tab === "overview" ? (
            <View className="gap-2.5">
              {device.status === "in_stock" ? (
                <Button title="Record Sale" onPress={() => setSaleOpen(true)} />
              ) : null}
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className="items-center py-1 active:opacity-60"
              >
                <Text className="text-sm font-semibold text-red-600">
                  {deleteMutation.isPending ? "Deleting…" : "Delete Device"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title={saved ? "Saved" : "Save Changes"}
              onPress={handleSave}
              loading={updateMutation.isPending}
              disabled={saved}
            />
          )}
        </View>
      </View>

      <RecordSaleSheet
        device={saleOpen ? device : null}
        onClose={() => setSaleOpen(false)}
      />
    </>
  );
}
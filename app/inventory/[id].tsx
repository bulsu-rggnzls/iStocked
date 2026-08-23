import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

function colorPlaceholder(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes("iphone")) return "e.g. Black, White, Blue";
  if (lower.includes("samsung") || lower.includes("galaxy"))
    return "e.g. Phantom Black, Green";
  if (lower.includes("pixel")) return "e.g. Obsidian, Hazel";
  if (lower.includes("xiaomi") || lower.includes("redmi"))
    return "e.g. Onyx Black, Ice Blue";
  if (lower.includes("oppo")) return "e.g. Glossy Black, Sunrise Gold";
  if (lower.includes("vivo")) return "e.g. Cosmic Black, Sunset Gold";
  if (lower.includes("realme")) return "e.g. Tech Black, Neon Green";
  return "Enter color";
}

function SpecRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2.5">
      <View className="flex-row shrink items-center gap-2.5">
        <Ionicons name={icon} size={16} color="#a1a1aa" />
        <Text className="text-sm text-zinc-500" numberOfLines={1}>{label}</Text>
      </View>
      <Text
        className={`text-sm font-semibold text-zinc-950 ${
          mono ? "font-mono text-xs tracking-wide" : ""
        }`}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

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

function CenteredPillRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-start gap-2">
      {options.map((option) => (
        <Pill
          key={option}
          label={option}
          selected={value === option}
          onPress={() => onChange(option)}
        />
      ))}
    </View>
  );
}

function PickerField({
  label,
  options,
  value,
  onChange,
  even = false,
  center = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  even?: boolean;
  center?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </Text>
      {center ? (
        <CenteredPillRow options={options} value={value} onChange={onChange} />
      ) : (
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
      )}
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
          <ScrollView className="flex-1 px-5">
            <View className="flex-row gap-2">
              <View
                className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3"
                style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <Ionicons name="trending-up-outline" size={16} color="#09090b" />
                </View>
                <Text className="mt-2 text-2xl font-bold text-zinc-950" numberOfLines={1}>
                  {formatPrice(profit)}
                </Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Net Profit
                </Text>
                <View className="mt-1.5 self-start rounded-full bg-zinc-100 px-2 py-0.5">
                  <Text className="text-xs font-semibold text-zinc-900">{margin}%</Text>
                </View>
              </View>
              <View
                className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3"
                style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <Ionicons name="cash-outline" size={16} color="#09090b" />
                </View>
                <Text className="mt-2 text-2xl font-bold text-zinc-950" numberOfLines={1}>
                  {formatPrice(buy)}
                </Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Buy Price
                </Text>
              </View>
            </View>

            <View className="mt-2 flex-row gap-2">
              <View
                className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3"
                style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <Ionicons name="pricetag-outline" size={16} color="#09090b" />
                </View>
                <Text className="mt-2 text-2xl font-bold text-zinc-950" numberOfLines={1}>
                  {formatPrice(list)}
                </Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  List Price
                </Text>
              </View>
              <View
                className="flex-1 rounded-2xl border border-zinc-200 bg-white p-3"
                style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <Ionicons name="build-outline" size={16} color="#09090b" />
                </View>
                <Text className="mt-2 text-2xl font-bold text-zinc-950" numberOfLines={1}>
                  {formatPrice(repair)}
                </Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Repair Cost
                </Text>
              </View>
            </View>

            <Text className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Specs
            </Text>
            <View className="mt-1.5 rounded-2xl border border-zinc-200 bg-white px-4 divide-y divide-zinc-100">
              <SpecRow icon="call-outline" label="IMEI" value={formatImei(device.imei)} mono />
              <SpecRow icon="layers-outline" label="Storage" value={storage || "\u2014"} />
              <SpecRow icon="star-outline" label="Condition" value={condition || "\u2014"} />
              {batteryHealth.trim() ? (
                <SpecRow icon="battery-half-outline" label="Battery Health" value={`${batteryHealth}%`} />
              ) : null}
              {color.trim() ? (
                <SpecRow icon="color-palette-outline" label="Color" value={color} />
              ) : null}
              <SpecRow icon="globe-outline" label="Network Lock" value={networkLockShort(networkLock) ?? "\u2014"} />
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-5">
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
                    placeholder={colorPlaceholder(device.model)}
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
                center
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
          </ScrollView>
        )}

        <View className="border-t border-zinc-200 bg-white px-5 py-4">
          {tab === "overview" ? (
            <View className="gap-2.5">
              {device.status === "in_stock" ? (
                <Pressable
                  onPress={() => setSaleOpen(true)}
                  className="items-center justify-center rounded-xl bg-black py-3 active:bg-zinc-900"
                  style={{ height: 48 }}
                >
                  <Text className="text-sm font-semibold text-white">Record Sale</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className="items-center justify-center rounded-xl py-2.5 active:bg-red-50"
              >
                <Text className="text-sm font-medium text-red-600">
                  {deleteMutation.isPending ? "Deleting\u2026" : "Delete Device"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title={saved ? "Saved" : "Save Changes"}
              onPress={handleSave}
              loading={updateMutation.isPending}
              disabled={saved}
              className="h-12"
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
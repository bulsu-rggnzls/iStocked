import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useDevice,
  useDeleteDevice,
  useUpdateDevice,
} from "../../hooks/useInventory";
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
    <View className="w-full bg-zinc-100 p-1 rounded-xl flex-row gap-1 my-4">
      {tabs.map((tab) => {
        const selected = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`flex-1 items-center justify-center rounded-lg py-2 active:opacity-80 ${
              selected ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-sm ${
                selected ? "font-bold text-zinc-900" : "font-medium text-zinc-500"
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
    <View className="flex flex-row items-center justify-between py-3 text-xs">
      <View className="flex items-center gap-2 text-zinc-500 font-medium">
        <Ionicons name={icon} size={14} color="#a1a1aa" />
        <Text className="text-zinc-500 font-medium">{label}</Text>
      </View>
      <Text
        className={`text-zinc-900 ${mono ? "font-semibold font-mono" : "font-semibold"}`}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-lg border active:opacity-80 ${
        selected
          ? "bg-black border-black"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <Text
        className={`text-xs ${
          selected ? "font-semibold text-white" : "font-medium text-zinc-600"
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
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </Text>
      <View className="flex flex-row flex-wrap gap-2 mt-1.5 w-full">
        {options.map((option) => (
          <OptionChip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(option)}
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
        <View className="flex-1 bg-zinc-100 items-center justify-center">
          <ActivityIndicator size="large" color="#09090b" />
        </View>
      </>
    );
  }

  if (isError || !device) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-zinc-100 items-center justify-center px-8">
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
        {/* Header */}
        <View className="w-full flex-row items-center justify-between px-4 py-3 bg-white border-b border-zinc-100">
          <Pressable
            onPress={() => router.back()}
            className="flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 active:bg-zinc-200"
          >
            <Ionicons name="chevron-back" size={14} color="#52525b" />
            <Text className="text-xs font-semibold text-zinc-700">Back</Text>
          </Pressable>
          <View className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50">
            <View className={`h-1.5 w-1.5 rounded-full ${device.status === "in_stock" ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <Text className="text-xs font-semibold text-emerald-700">
              {device.status === "in_stock" ? "In Stock" : "Sold"}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="px-4">
          <SegmentedControl value={tab} onChange={setTab} />
        </View>

        {/* Content */}
        {tab === "overview" ? (
          <ScrollView className="flex-1 px-4">
            {/* Stat Cards */}
            <View className="grid grid-cols-2 gap-3 w-full">
              <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Net Profit
                </Text>
                <View className="flex flex-row items-center gap-2 mt-2">
                  <Text className="text-lg font-bold text-zinc-900" numberOfLines={1}>
                    {formatPrice(profit)}
                  </Text>
                  <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Text className="text-[11px] font-semibold text-emerald-600">{margin}%</Text>
                  </View>
                </View>
              </View>
              <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Buy Price
                </Text>
                <Text className="text-lg font-bold text-zinc-900 mt-2" numberOfLines={1}>
                  {formatPrice(buy)}
                </Text>
              </View>
              <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  List Price
                </Text>
                <Text className="text-lg font-bold text-zinc-900 mt-2" numberOfLines={1}>
                  {formatPrice(list)}
                </Text>
              </View>
              <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Repair Cost
                </Text>
                <Text className="text-lg font-bold text-zinc-900 mt-2" numberOfLines={1}>
                  {formatPrice(repair)}
                </Text>
              </View>
            </View>

            {/* Specs Card */}
            <Text className="mt-5 mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Specs
            </Text>
            <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col divide-y divide-zinc-100">
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
            <View className="h-32" />
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-4">
            <View className="w-full flex flex-col gap-4 bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
              <View className="grid grid-cols-2 gap-3 w-full">
                <View>
                  <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Buy price (₱)
                  </Text>
                  <TextInput
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#a1a1aa"
                    className="w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
                  />
                </View>
                <View>
                  <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    List price (₱)
                  </Text>
                  <TextInput
                    value={listPrice}
                    onChangeText={setListPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#a1a1aa"
                    className="w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
                  />
                </View>
              </View>

              <PickerField
                label="Storage"
                options={STORAGE_OPTIONS}
                value={storage}
                onChange={setStorage}
              />
              <PickerField
                label="Condition"
                options={CONDITION_OPTIONS}
                value={condition}
                onChange={setCondition}
              />

              <View className="grid grid-cols-2 gap-3 w-full">
                <View>
                  <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Battery health (%)
                  </Text>
                  <TextInput
                    value={batteryHealth}
                    onChangeText={(t) => setBatteryHealth(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="e.g. 85"
                    placeholderTextColor="#a1a1aa"
                    className="w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
                  />
                </View>
                <View>
                  <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Color
                  </Text>
                  <TextInput
                    value={color}
                    onChangeText={setColor}
                    placeholder={colorPlaceholder(device.model)}
                    placeholderTextColor="#a1a1aa"
                    autoCapitalize="words"
                    className="w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
                  />
                </View>
              </View>

              <PickerField
                label="Network Lock"
                options={NETWORK_LOCK_OPTIONS.map((o) => networkLockShort(o) ?? o)}
                value={networkLockShort(networkLock) ?? networkLock}
                onChange={(short) => {
                  const full = NETWORK_LOCK_OPTIONS.find(
                    (o) => (networkLockShort(o) ?? o) === short,
                  );
                  setNetworkLock(full ?? short);
                }}
              />

              <View>
                <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Repair cost (₱)
                </Text>
                <TextInput
                  value={repairCost}
                  onChangeText={(t) => setRepairCost(t.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                  className="w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
                />
              </View>
            </View>

            {saveError ? (
              <Text className="mt-3 text-sm text-red-600">{saveError}</Text>
            ) : null}
            <View className="h-32" />
          </ScrollView>
        )}

        {/* Bottom Action Bar */}
        <View className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-4 flex flex-col gap-2 z-40 max-w-4xl mx-auto">
          {tab === "overview" ? (
            <>
              {device.status === "in_stock" ? (
                <Pressable
                  onPress={() => setSaleOpen(true)}
                  className="w-full h-11 bg-black rounded-xl items-center justify-center active:bg-zinc-800"
                >
                  <Text className="text-sm font-semibold text-white">Record Sale</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full py-2 items-center justify-center active:bg-red-50 rounded-xl"
              >
                <Text className="text-xs font-semibold text-red-600">
                  {deleteMutation.isPending ? "Deleting\u2026" : "Delete Device"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleSave}
              disabled={updateMutation.isPending || saved}
              className="w-full h-11 bg-black rounded-xl items-center justify-center active:bg-zinc-800"
            >
              <Text className="text-sm font-semibold text-white">
                {saved ? "Saved" : updateMutation.isPending ? "Saving\u2026" : "Save Changes"}
              </Text>
            </Pressable>
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

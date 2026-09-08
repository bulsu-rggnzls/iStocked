import { useEffect, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useDevice,
  useDeleteDevice,
  useUpdateDevice,
} from "../../hooks/useInventory";
import { RecordSaleSheet } from "../../components/RecordSaleSheet";
import { FormField } from "../../components/ui/FormField";
import { NETWORK_LOCK_OPTIONS, networkLockShort } from "../../lib/networkLock";
import { formatDate, formatImei, formatPrice } from "../../lib/format";
import {
  ACCESSORY_OPTIONS,
  type AccessoryItem,
} from "../../types";

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITION_OPTIONS = ["Brand New", "Used"];

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
    <View className="w-full flex-row gap-1 rounded-xl bg-zinc-100 p-1">
      {tabs.map((tab) => {
        const selected = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className="flex-1 items-center justify-center rounded-lg py-1.5 active:opacity-80"
            style={selected ? { backgroundColor: "#ffffff" } : undefined}
          >
            <Text
              className="text-sm"
              style={{
                color: selected ? "#18181b" : "#71717a",
                fontWeight: selected ? "700" : "500",
              }}
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
    <View className="flex flex-row items-center justify-between py-2.5 border-b border-dashed border-zinc-200 last:border-0">
      <View className="flex flex-row items-center gap-2">
        <View className="w-4 h-4 flex items-center justify-center shrink-0">
          <Ionicons name={icon} size={16} color="#a1a1aa" />
        </View>
        <Text className="text-xs font-medium text-zinc-500">{label}</Text>
      </View>
      <Text
        className={`text-xs font-semibold text-zinc-900 ${mono ? "font-mono" : ""}`}
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
      className="h-9 shrink-0 items-center justify-center rounded-lg border px-3.5 active:opacity-80"
      style={{
        backgroundColor: selected ? "#18181b" : "#ffffff",
        borderColor: selected ? "#18181b" : "#e4e4e7",
      }}
    >
      <Text
        className="text-xs"
        style={{ color: selected ? "#ffffff" : "#52525b", fontWeight: selected ? "600" : "500", includeFontPadding: false }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AccessoryChips({
  selected,
  onToggle,
}: {
  selected: AccessoryItem[];
  onToggle: (item: AccessoryItem) => void;
}) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
        Included Accessories
      </Text>
      <View className="flex flex-row flex-wrap gap-2">
        {ACCESSORY_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => onToggle(opt.key)}
              className="h-9 shrink-0 flex-row items-center justify-center gap-1.5 rounded-lg border px-3.5 active:opacity-80"
              style={{
                backgroundColor: isSelected ? "#ecfdf5" : "#ffffff",
                borderColor: isSelected ? "#6ee7b7" : "#e4e4e7",
              }}
            >
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={isSelected ? "#059669" : "#a1a1aa"}
              />
              <Text
                className="text-xs"
                style={{
                  color: isSelected ? "#047857" : "#52525b",
                  fontWeight: isSelected ? "600" : "500",
                  includeFontPadding: false,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
      <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
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
  const insets = useSafeAreaInsets();
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
  const [imei2, setImei2] = useState("");
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const formInitRef = useRef<string | null>(null);

  useEffect(() => {
    if (!device || formInitRef.current === device.id) return;
    formInitRef.current = device.id;
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
    setImei2(device.imei2 ?? "");
    let parsedAccessories: AccessoryItem[] = [];
    if (device.accessories) {
      try {
        const parsed = JSON.parse(device.accessories);
        if (Array.isArray(parsed)) parsedAccessories = parsed;
      } catch {
        parsedAccessories = [];
      }
    }
    setAccessories(parsedAccessories);
    setNotes(device.notes ?? "");
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

  const hasChanges =
    device.status === "sold" ||
    buyPrice !== String(device.buy_price) ||
    listPrice !== String(device.list_price) ||
    repairCost !== (device.repair_cost ? String(device.repair_cost) : "") ||
    storage !== device.storage ||
    condition !== device.condition ||
    batteryHealth !==
      (device.battery_health !== null && device.battery_health !== undefined
        ? String(device.battery_health)
        : "") ||
    color !== (device.color ?? "") ||
    networkLock !== (device.network_lock ?? NETWORK_LOCK_OPTIONS[0]) ||
    imei2 !== (device.imei2 ?? "") ||
    JSON.stringify(accessories) !== (device.accessories ?? "[]") ||
    notes !== (device.notes ?? "");

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
          imei2: imei2.trim() || null,
          accessories: accessories.length > 0 ? JSON.stringify(accessories) : null,
          notes: notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
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
      {/* legacy header string for compatibility: sticky top-0 bg-zinc-50/90 backdrop-blur-md z-10 px-4 py-2 flex items-center justify-between border-b border-zinc-200/50 */}
      <View className="flex-1 bg-zinc-100">
        {/* Header */}
        <View
          className="flex-row items-center justify-between w-full px-4 py-2 bg-white border-b border-zinc-200/70"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            className="h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white active:bg-zinc-100"
          >
            <Ionicons name="chevron-back" size={20} color="#09090b" />
          </Pressable>
          <View className="flex-row items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1">
            <View className={`h-1.5 w-1.5 rounded-full ${device.status === "in_stock" ? "bg-emerald-600" : "bg-zinc-400"}`} />
            <Text className="text-xs font-semibold text-emerald-800">
              {device.status === "in_stock" ? "In Stock" : "Sold"}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="px-4 mt-2.5 mb-1.5">
          <SegmentedControl value={tab} onChange={setTab} />
        </View>

        {/* Content */}
        {tab === "overview" ? (
          <ScrollView className="flex-1 px-4" contentContainerClassName="pb-4" bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
            {/* Device hero */}
            <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {device.status === "in_stock" ? "On the shelf" : "Sold"}
                  </Text>
                  <Text className="mt-0.5 text-xl font-bold leading-6 text-zinc-950" numberOfLines={2}>
                    {device.model}
                  </Text>
                </View>
                <View className="items-end shrink-0">
                  <Text className="text-[11px] font-mono text-zinc-500">
                    {device.imei.startsWith("NO-IMEI")
                      ? "No IMEI"
                      : `IMEI ····${device.imei.slice(-5)}`}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-zinc-950">{storage || "\u2014"}</Text>
                  <Text className="mt-0.5 text-xs font-semibold text-zinc-600">{condition || "\u2014"}</Text>
                </View>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between border-t border-zinc-100 pt-2">
                <Text className="flex-1 text-[11px] text-zinc-400" numberOfLines={1}>
                  Bought {formatDate(device.date_bought)}
                  {device.date_sold ? ` · Sold ${formatDate(device.date_sold)}` : ""}
                  {device.customer_name ? ` · ${device.customer_name}` : ""}
                </Text>
                {color.trim() ? (
                  <Text className="text-[11px] font-medium text-zinc-500">{color}</Text>
                ) : null}
              </View>
            </View>

            {/* Money ledger */}
            <View className="mt-3 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
              {device.status === "in_stock" ? (
                <>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    If sold at list price
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text
                      className="text-[32px] font-bold leading-9 tracking-tight"
                      style={{ color: profit >= 0 ? "#09090b" : "#b91c1c" }}
                      numberOfLines={1}
                    >
                      {profit >= 0 ? "" : "\u2212"}
                      {formatPrice(Math.abs(profit))}
                    </Text>
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: profit >= 0 ? "#ecfdf5" : "#fef2f2" }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: profit >= 0 ? "#059669" : "#dc2626" }}
                      >
                        {margin}%
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Net profit
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text
                      className="text-[32px] font-bold leading-9 tracking-tight"
                      style={{ color: profit >= 0 ? "#09090b" : "#b91c1c" }}
                      numberOfLines={1}
                    >
                      {profit >= 0 ? "+" : "\u2212"}
                      {formatPrice(Math.abs(profit))}
                    </Text>
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: profit >= 0 ? "#ecfdf5" : "#fef2f2" }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: profit >= 0 ? "#059669" : "#dc2626" }}
                      >
                        {margin}%
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <View className="mt-3.5 flex-row gap-4 border-t border-dashed border-zinc-200 pt-3">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>Bought</Text>
                  <Text className="mt-1 text-sm font-bold text-zinc-950" numberOfLines={1}>{formatPrice(buy)}</Text>
                </View>
                <View className="w-px bg-zinc-200" />
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>List</Text>
                  <Text className="mt-1 text-sm font-bold text-zinc-950" numberOfLines={1}>{formatPrice(list)}</Text>
                </View>
                <View className="w-px bg-zinc-200" />
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>Repair</Text>
                  <Text className="mt-1 text-sm font-bold text-zinc-950" numberOfLines={1}>{formatPrice(repair)}</Text>
                </View>
              </View>
            </View>

            {(imei2.trim() || batteryHealth.trim() || networkLock) ? (
              <>
                <Text className="mt-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Details
                </Text>
                <View className="w-full bg-white rounded-2xl px-4 border border-zinc-100 shadow-sm flex flex-col">
                  {imei2.trim() ? (
                    <SpecRow icon="call-outline" label="IMEI 2" value={formatImei(imei2)} mono />
                  ) : null}
                  {batteryHealth.trim() ? (
                    <SpecRow icon="battery-half-outline" label="Battery Health" value={`${batteryHealth}%`} />
                  ) : null}
                  <SpecRow icon="globe-outline" label="Network Lock" value={networkLockShort(networkLock) ?? "\u2014"} />
                </View>
              </>
            ) : null}

            {accessories.length > 0 ? (
              <>
                <Text className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Included Accessories
                </Text>
                <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                  <View className="flex flex-row flex-wrap gap-2">
                    {accessories.map((item) => {
                      const opt = ACCESSORY_OPTIONS.find((o) => o.key === item);
                      return (
                        <View key={item} className="flex-row items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text className="text-xs font-semibold text-emerald-700">{opt?.label ?? item}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}

            {notes.trim() ? (
              <>
                <Text className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Defects / Notes
                </Text>
                <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                  <Text className="text-sm text-zinc-700 leading-5">{notes}</Text>
                </View>
              </>
            ) : null}
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-4" contentContainerClassName="pb-4" bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
            <Text className="mt-2 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Pricing
            </Text>
            <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
              <View className="flex-row flex-wrap justify-between gap-y-3 w-full">
                <View className="w-[48.5%]">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    Buy price (₱)
                  </Text>
                  <FormField
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    keyboardType="decimal-pad"
                    prefix="₱"
                  />
                </View>
                <View className="w-[48.5%]">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    List price (₱)
                  </Text>
                  <FormField
                    value={listPrice}
                    onChangeText={setListPrice}
                    keyboardType="decimal-pad"
                    prefix="₱"
                  />
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                  Repair cost (₱)
                </Text>
                <FormField
                  value={repairCost}
                  onChangeText={(t) => setRepairCost(t.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  prefix="₱"
                />
              </View>
            </View>

            <Text className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Identity
            </Text>
            <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
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
              <View className="flex-row flex-wrap justify-between gap-y-3 w-full">
                <View className="w-[48.5%]">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    Battery health (%)
                  </Text>
                  <FormField
                    value={batteryHealth}
                    onChangeText={(t) => setBatteryHealth(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="e.g. 85"
                  />
                </View>
                <View className="w-[48.5%]">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    Color
                  </Text>
                  <FormField
                    value={color}
                    onChangeText={setColor}
                    placeholder={colorPlaceholder(device.model)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Live Profit & ROI */}
              <View className="mt-3 flex-row items-center gap-3 rounded-xl border px-4 py-3" style={{ backgroundColor: "#fafafa", borderColor: "#e4e4e7" }}>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Expected profit
                  </Text>
                  <Text
                    className="text-base font-bold mt-0.5"
                    style={{ color: profit >= 0 ? "#059669" : "#dc2626" }}
                    numberOfLines={1}
                  >
                    {profit >= 0 ? "+" : "\u2212"}
                    {formatPrice(Math.abs(profit))}
                  </Text>
                </View>
                <View className="h-8 w-px bg-zinc-200" />
                <View className="flex-1 items-end">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    ROI
                  </Text>
                  <View
                    className="flex-row items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: profit >= 0 ? "#ecfdf5" : "#fef2f2" }}
                  >
                    <Ionicons
                      name={profit >= 0 ? "trending-up" : "trending-down"}
                      size={12}
                      color={profit >= 0 ? "#059669" : "#dc2626"}
                    />
                    <Text
                      className="text-sm font-bold"
                      style={{ color: profit >= 0 ? "#059669" : "#dc2626" }}
                    >
                      {margin}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setAdditionalOpen((v) => !v)}
              className="mt-4 flex-row items-center justify-between rounded-2xl border border-zinc-200/70 bg-white px-4 py-3.5 active:bg-zinc-50"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-zinc-950">More details</Text>
                <Text className="mt-0.5 text-[11px] text-zinc-500">
                  Network lock · Dual SIM · Accessories
                </Text>
              </View>
              <Ionicons name={additionalOpen ? "chevron-up" : "chevron-down"} size={18} color="#71717a" />
            </Pressable>
            {additionalOpen ? (
              <View className="mt-2 gap-4 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
                <PickerField
                  label="Network lock"
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
                  <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    IMEI 2 (optional, for dual-SIM)
                  </Text>
                  <FormField
                    value={imei2}
                    onChangeText={(t) => setImei2(t.replace(/\D/g, ""))}
                    placeholder="15-digit secondary IMEI"
                    keyboardType="number-pad"
                    maxLength={15}
                    style={{ fontFamily: "Poppins_400Regular", letterSpacing: 1 }}
                  />
                </View>

                <AccessoryChips
                  selected={accessories}
                  onToggle={(item) =>
                    setAccessories((prev) =>
                      prev.includes(item)
                        ? prev.filter((a) => a !== item)
                        : [...prev, item],
                    )
                  }
                />
              </View>
            ) : null}

            <Text className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Condition report
            </Text>
            <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                  Defects / notes
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Small scratch on top bezel, replaced screen"
                  placeholderTextColor="#a1a1aa"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-950"
                />
              </View>
            </View>

            {saveError ? (
              <Text className="mt-3 text-sm text-red-600">{saveError}</Text>
            ) : null}
          </ScrollView>
        )}

        {/* Bottom Action Bar */}
        <View
          className="bg-white border-t border-zinc-200 px-4 pt-2.5 gap-1"
          style={{ paddingBottom: 12 + insets.bottom }}
        >
          {tab === "overview" ? (
            <>
              {device.status === "in_stock" ? (
                <Pressable
                  onPress={() => setSaleOpen(true)}
                  className="w-full h-11 bg-black rounded-2xl flex items-center justify-center active:opacity-80"
                >
                  <Text className="text-sm font-semibold text-white">Record Sale</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full py-1.5 rounded-lg flex items-center justify-center active:bg-red-50"
              >
                <Text className="text-xs font-semibold text-red-600 text-center">
                  {deleteMutation.isPending ? "Deleting\u2026" : "Delete Device"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || updateMutation.isPending || saved}
              className={`w-full h-11 rounded-2xl flex items-center justify-center active:opacity-80 ${
                !hasChanges || saved ? "bg-zinc-300" : "bg-black"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${!hasChanges || saved ? "text-zinc-500" : "text-white"}`}
              >
                {saved
                  ? "Saved"
                  : updateMutation.isPending
                    ? "Saving\u2026"
                    : "Save Changes"}
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

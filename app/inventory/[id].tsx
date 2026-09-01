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
    <View className="w-full grid grid-cols-2 p-1 bg-zinc-100 rounded-xl flex-row gap-1 my-4">
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
    <View className="flex flex-row items-center justify-between py-3 border-b border-zinc-100 last:border-0">
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
      className={`px-3 py-1.5 text-xs rounded-lg font-medium border active:opacity-80 ${
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

function AccessoryChips({
  selected,
  onToggle,
}: {
  selected: AccessoryItem[];
  onToggle: (item: AccessoryItem) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
        Included Accessories
      </Text>
      <View className="flex flex-row flex-wrap gap-2 mt-1.5">
        {ACCESSORY_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => onToggle(opt.key)}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border active:opacity-80 ${
                isSelected
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white border-zinc-200"
              }`}
            >
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={isSelected ? "#059669" : "#a1a1aa"}
              />
              <Text
                className={`text-xs ${
                  isSelected ? "font-semibold text-emerald-700" : "font-medium text-zinc-600"
                }`}
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
      <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
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
  const [imei2, setImei2] = useState("");
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);

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
    setImei2(device.imei2 ?? "");
    setAccessories(
      device.accessories ? JSON.parse(device.accessories) : [],
    );
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
      {/* legacy header string for compatibility: sticky top-0 bg-zinc-50/90 backdrop-blur-md z-10 px-4 py-2 flex items-center justify-between border-b border-zinc-200/50 */}
      <View className="flex-1 bg-zinc-100">
        {/* Header */}
        <View className="flex flex-row items-center justify-between w-full px-4 py-3 bg-zinc-50/90 sticky top-0 z-10 border-b border-zinc-200/50 backdrop-blur-md">
          <Pressable
            onPress={() => router.back()}
            className="bg-white border border-zinc-200 text-zinc-800 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm hover:bg-zinc-100 flex flex-row items-center gap-1.5 active:bg-zinc-50"
          >
            <Ionicons name="chevron-back" size={14} color="#27272a" />
            <Text className="text-xs font-medium text-zinc-800">Back</Text>
          </Pressable>
          <View className="bg-emerald-100/80 text-emerald-800 border border-emerald-300/60 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 flex-row">
            <View className={`h-1.5 w-1.5 rounded-full ${device.status === "in_stock" ? "bg-emerald-600" : "bg-zinc-400"}`} />
            <Text className="text-xs font-semibold text-emerald-800">
              {device.status === "in_stock" ? "In Stock" : "Sold"}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="px-4 mt-3 mb-2">
          <SegmentedControl value={tab} onChange={setTab} />
        </View>

        {/* Content */}
        {tab === "overview" ? (
          <ScrollView className="flex-1 px-4" contentContainerClassName="pb-6" bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
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
                  <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <Text className="text-xs font-semibold text-emerald-700">{margin}%</Text>
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
            <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col">
              <SpecRow icon="call-outline" label="IMEI" value={formatImei(device.imei)} mono />
              {imei2.trim() ? (
                <SpecRow icon="call-outline" label="IMEI 2" value={formatImei(imei2)} mono />
              ) : null}
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

            {accessories.length > 0 ? (
              <>
                <Text className="mt-5 mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
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
                <Text className="mt-5 mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Defects / Notes
                </Text>
                <View className="w-full bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                  <Text className="text-sm text-zinc-700 leading-5">{notes}</Text>
                </View>
              </>
            ) : null}
            <View className="h-4" />
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-4" contentContainerClassName="pb-6" bounces={false} alwaysBounceVertical={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
            <View className="w-full flex flex-col space-y-3 bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
              <View className="grid grid-cols-2 gap-3 w-full">
                <View>
                  <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                    Buy price (₱)
                  </Text>
                  <TextInput
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#a1a1aa"
                    className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full"
                  />
                </View>
                <View>
                  <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                    List price (₱)
                  </Text>
                  <TextInput
                    value={listPrice}
                    onChangeText={setListPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#a1a1aa"
                    className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full"
                  />
                </View>
              </View>

              {/* Core required fields grouped at top */}
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

              {/* Live Profit & ROI */}
              <View className="flex-row items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    Expected Profit
                  </Text>
                  <Text
                    className={`text-base font-bold mt-0.5 ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    numberOfLines={1}
                  >
                    {formatPrice(profit)}
                  </Text>
                </View>
                <View className="h-8 w-px bg-zinc-200" />
                <View className="flex-1 items-end">
                  <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    ROI
                  </Text>
                  <View className={`flex-row items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full ${profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <Ionicons
                      name={profit >= 0 ? "trending-up" : "trending-down"}
                      size={12}
                      color={profit >= 0 ? "#059669" : "#dc2626"}
                    />
                    <Text
                      className={`text-sm font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {margin}%
                    </Text>
                  </View>
                </View>
              </View>

              <View className="grid grid-cols-2 gap-3 w-full">
                <View>
                  <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                    Battery health (%)
                  </Text>
                  <TextInput
                    value={batteryHealth}
                    onChangeText={(t) => setBatteryHealth(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="e.g. 85"
                    placeholderTextColor="#a1a1aa"
                    className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full"
                  />
                </View>
                <View>
                  <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                    Color
                  </Text>
                  <TextInput
                    value={color}
                    onChangeText={setColor}
                    placeholder={colorPlaceholder(device.model)}
                    placeholderTextColor="#a1a1aa"
                    autoCapitalize="words"
                    className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full"
                  />
                </View>
              </View>

              {/* Collapsible secondary fields */}
              <Pressable
                onPress={() => setAdditionalOpen((v) => !v)}
                className="flex flex-row items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl active:bg-zinc-100"
              >
                <Text className="text-sm font-semibold text-zinc-900">Additional Options — Accessories & Dual SIM</Text>
                <Ionicons name={additionalOpen ? "chevron-up" : "chevron-down"} size={16} color="#71717a" />
              </Pressable>
              {additionalOpen ? (
                <View className="space-y-3">
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
                    <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                      IMEI 2 (optional, for dual-SIM)
                    </Text>
                    <TextInput
                      value={imei2}
                      onChangeText={(t) => setImei2(t.replace(/\D/g, ""))}
                      placeholder="15-digit secondary IMEI"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="number-pad"
                      maxLength={15}
                      className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full font-mono tracking-wide"
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

              <View>
                <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                  Defects / Notes
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Small scratch on top bezel, replaced screen"
                  placeholderTextColor="#a1a1aa"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="w-full px-3.5 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-950 min-h-[80px]"
                />
              </View>

              <View>
                <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5">
                  Repair cost (₱)
                </Text>
                <TextInput
                  value={repairCost}
                  onChangeText={(t) => setRepairCost(t.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                  className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-950 w-full"
                />
              </View>
            </View>

            {saveError ? (
              <Text className="mt-3 text-sm text-red-600">{saveError}</Text>
            ) : null}
            <View className="h-4" />
          </ScrollView>
        )}

        {/* Bottom Action Bar */}
        <View className="sticky bottom-0 bg-white border-t border-zinc-200 p-4 shadow-lg z-10 space-y-2">
          {tab === "overview" ? (
            <>
              {device.status === "in_stock" ? (
                <Pressable
                  onPress={() => setSaleOpen(true)}
                  className="w-full h-11 bg-zinc-900 rounded-xl flex items-center justify-center active:bg-zinc-800"
                >
                  <Text className="text-sm font-semibold text-white">Record Sale</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full py-2 rounded-lg flex items-center justify-center active:bg-red-50"
              >
                <Text className="text-xs font-semibold text-red-600 text-center">
                  {deleteMutation.isPending ? "Deleting\u2026" : "Delete Device"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleSave}
              disabled={updateMutation.isPending || saved}
              className="w-full h-11 bg-zinc-900 rounded-xl flex items-center justify-center active:bg-zinc-800"
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

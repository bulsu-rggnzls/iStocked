import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { useIsTablet } from "../hooks/useIsTablet";
import { useAddDevice } from "../hooks/useInventory";
import { NETWORK_LOCK_OPTIONS, networkLockShort } from "../lib/networkLock";
import { todayIso } from "../lib/format";
import { Tag } from "./ui/Tag";
import { FormField } from "./ui/FormField";
import { DateField } from "./ui/DateField";
import { genId } from "../lib/db";
import {
  ACCESSORY_OPTIONS,
  type AccessoryItem,
  type Device,
} from "../types";

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITION_OPTIONS = ["Brand New", "Used"];

interface AddDeviceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (device: Device) => void;
  prefilledImei?: string | null;
  prefilledModel?: string | null;
  prefilledStorage?: string | null;
  prefilledColor?: string | null;
  prefilledSerial?: string | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function AddDeviceSheet({ visible, onClose, onSaved, prefilledImei, prefilledModel, prefilledStorage, prefilledColor, prefilledSerial }: AddDeviceSheetProps) {
  const addDevice = useAddDevice();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isTablet = useIsTablet();
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [storage, setStorage] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [buyPrice, setBuyPrice] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [dateBought, setDateBought] = useState(todayIso());
  const [networkLock, setNetworkLock] = useState<string>(NETWORK_LOCK_OPTIONS[0]);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [batteryHealth, setBatteryHealth] = useState("");
  const [color, setColor] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [imei2, setImei2] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setModel(prefilledModel?.trim() ?? "");
      setImei(prefilledImei?.replace(/\D/g, "") ?? "");
      setStorage(prefilledStorage ?? null);
      setCondition(null);
      setBuyPrice("");
      setListPrice("");
      setDateBought(todayIso());
      setNetworkLock(NETWORK_LOCK_OPTIONS[0]);
      setSpecsOpen(false);
      setBatteryHealth("");
      setColor(prefilledColor ?? "");
      setRepairCost("");
      setImei2("");
      setSerialNumber(prefilledSerial?.trim() ?? "");
      setAccessories([]);
      setNotes("");
      setError(null);
    }
  }, [visible, prefilledImei, prefilledModel, prefilledStorage, prefilledColor, prefilledSerial]);

  const handleSave = async () => {
    const digits = imei.replace(/\D/g, "");
    if (digits.length !== 0 && digits.length !== 15) {
      setError("IMEI must be exactly 15 digits if provided.");
      return;
    }
    const buy = Number(buyPrice);
    const list = Number(listPrice);
    if (!(buy > 0) || !(list > 0)) {
      setError("Enter valid buy and list prices.");
      return;
    }
    const battery = batteryHealth.trim() ? Number(batteryHealth) : null;
    if (battery !== null && !(battery >= 0 && battery <= 100)) {
      setError("Battery health must be between 0 and 100.");
      return;
    }
    setError(null);
    const finalImei = digits.length === 15 ? digits : `NO-IMEI-${genId()}`;
    try {
      const device = await addDevice.mutateAsync({
        model: model.trim(),
        imei: finalImei,
        imei2: imei2.trim() || null,
        serial_number: serialNumber.trim() || null,
        storage: storage ?? "",
        condition: condition ?? "",
        buy_price: buy,
        list_price: list,
        battery_health: battery,
        color: color.trim() || null,
        network_lock: networkLock,
        repair_cost: repairCost.trim() ? Number(repairCost) : 0,
        date_bought: dateBought,
        accessories: accessories.length > 0 ? JSON.stringify(accessories) : null,
        notes: notes.trim() || null,
      });
      onSaved?.(device);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save device.");
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add purchased phone">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        className="px-4 py-3"
        contentContainerClassName="pb-10 gap-4"
        style={{ flexShrink: 1, maxHeight: Math.round(height * (isTablet ? 0.4 : 0.55)) }}
      >
        <Field label="Brand & model">
          <FormField
            value={model}
            onChangeText={setModel}
            placeholder="e.g. iPhone 15 Pro Max"
            autoCapitalize="words"
          />
        </Field>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Storage">
              <View className="flex flex-wrap gap-1.5" style={{ flexDirection: "row" }}>
                {STORAGE_OPTIONS.map((option) => (
                  <Tag
                    key={option}
                    label={option}
                    selected={storage === option}
                    onPress={() => setStorage(option)}
                  />
                ))}
              </View>
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Condition">
              <View className="flex flex-wrap gap-1.5" style={{ flexDirection: "row" }}>
                {CONDITION_OPTIONS.map((option) => (
                  <Tag
                    key={option}
                    label={option}
                    selected={condition === option}
                    onPress={() => setCondition(option)}
                  />
                ))}
              </View>
            </Field>
          </View>
        </View>

        <Field label="IMEI / Serial number (optional)">
          <FormField
            value={imei}
            onChangeText={(t) => setImei(t.replace(/\D/g, ""))}
            placeholder="15-digit IMEI (optional)"
            keyboardType="number-pad"
            maxLength={15}
            style={{ fontFamily: "Poppins_400Regular", letterSpacing: 1 }}
            suffixIcon={<Ionicons name="scan-outline" size={18} color="#a1a1aa" />}
          />
        </Field>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Buy price (₱)">
              <FormField
                value={buyPrice}
                onChangeText={(t) => setBuyPrice(t.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="₱"
              />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="List price (₱)">
              <FormField
                value={listPrice}
                onChangeText={(t) => setListPrice(t.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="₱"
              />
            </Field>
          </View>
        </View>

        <Field label="Date bought">
          <DateField value={dateBought} onChange={setDateBought} />
        </Field>

        <Field label="Network lock">
          <View className="flex flex-wrap gap-1.5" style={{ flexDirection: "row" }}>
            {NETWORK_LOCK_OPTIONS.map((option) => (
              <Tag
                key={option}
                label={networkLockShort(option) ?? option}
                selected={networkLock === option}
                onPress={() => setNetworkLock(option)}
              />
            ))}
          </View>
        </Field>

        <Pressable
          onPress={() => setSpecsOpen((o) => !o)}
          className="mb-3 flex flex-row items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50 px-4 py-3 active:bg-zinc-100"
        >
          <Text className="text-sm font-semibold text-zinc-950">
            Optional Specs (Battery, Color, Repair)
          </Text>
          <Ionicons
            name={specsOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#71717a"
          />
        </Pressable>

        {specsOpen ? (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Battery health (%)">
                  <FormField
                    value={batteryHealth}
                    onChangeText={(t) => setBatteryHealth(t.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 85"
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="Color">
                  <FormField
                    value={color}
                    onChangeText={setColor}
                    placeholder="e.g. Natural Titanium"
                    autoCapitalize="words"
                  />
                </Field>
              </View>
            </View>

            <Field label="Repair / extra cost (₱)">
              <FormField
                value={repairCost}
                onChangeText={(t) => setRepairCost(t.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="₱"
              />
            </Field>

            <Field label="IMEI 2 (optional, for dual-SIM)">
              <FormField
                value={imei2}
                onChangeText={(t) => setImei2(t.replace(/\D/g, ""))}
                placeholder="15-digit secondary IMEI"
                keyboardType="number-pad"
                maxLength={15}
                style={{ fontFamily: "Poppins_400Regular", letterSpacing: 1 }}
              />
            </Field>

            <Field label="Serial number (optional, from box)">
              <FormField
                value={serialNumber}
                onChangeText={(t) => setSerialNumber(t.replace(/[^A-Z0-9]/gi, "").toUpperCase())}
                placeholder="e.g. F2LX80GHQ1L5"
                autoCapitalize="characters"
                style={{ fontFamily: "Poppins_400Regular", letterSpacing: 1 }}
              />
            </Field>

            <Field label="Included Accessories">
              <View className="flex flex-wrap gap-1.5" style={{ flexDirection: "row" }}>
                {ACCESSORY_OPTIONS.map((opt) => {
                  const isSelected = accessories.includes(opt.key);
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() =>
                        setAccessories((prev) =>
                          prev.includes(opt.key)
                            ? prev.filter((a) => a !== opt.key)
                            : [...prev, opt.key],
                        )
                      }
                      className="flex-row items-center gap-1.5 rounded-lg border px-2.5 py-1.5 active:opacity-80"
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
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Defects / Notes">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Small scratch on top bezel, replaced screen"
                placeholderTextColor="#a1a1aa"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                scrollEnabled
                className="h-24 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-950"
              />
            </Field>
          </View>
        ) : null}

        {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
      </ScrollView>

      <View
        className="shrink-0 flex-row items-center gap-2 border-t border-zinc-100 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <View className="flex-row gap-2 w-full">
          <Pressable
            onPress={onClose}
            className="flex-1 h-10 text-xs font-semibold rounded-xl w-full border border-zinc-200 bg-white items-center justify-center active:bg-zinc-100"
          >
            <Text className="text-xs font-semibold text-zinc-950">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={addDevice.isPending}
            className="flex-1 h-10 text-xs font-semibold rounded-xl w-full bg-zinc-900 items-center justify-center active:bg-black disabled:opacity-60"
          >
            {addDevice.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-xs font-semibold text-white">Add to stock</Text>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

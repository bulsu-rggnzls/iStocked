import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./ui/Button";
import { useAddDevice } from "../hooks/useInventory";
import { NETWORK_LOCK_OPTIONS, networkLockShort } from "../lib/networkLock";
import {
  ACCESSORY_OPTIONS,
  type AccessoryItem,
  type Device,
} from "../types";

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITION_OPTIONS = ["Brand New", "Like New", "Good", "Fair"];

const inputClass =
  "rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950";

interface AddDeviceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (device: Device) => void;
  prefilledImei?: string | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Pill({
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
      className={`rounded-full px-3.5 py-2 active:opacity-80 ${
        selected ? "border border-black bg-black" : "border border-zinc-200 bg-zinc-100"
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          selected ? "text-white" : "text-zinc-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AddDeviceSheet({ visible, onClose, onSaved, prefilledImei }: AddDeviceSheetProps) {
  const addDevice = useAddDevice();
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [storage, setStorage] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [buyPrice, setBuyPrice] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [networkLock, setNetworkLock] = useState<string>(NETWORK_LOCK_OPTIONS[0]);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [batteryHealth, setBatteryHealth] = useState("");
  const [color, setColor] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [imei2, setImei2] = useState("");
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setModel("");
      setImei(prefilledImei?.replace(/\D/g, "") ?? "");
      setStorage(null);
      setCondition(null);
      setBuyPrice("");
      setListPrice("");
      setNetworkLock(NETWORK_LOCK_OPTIONS[0]);
      setSpecsOpen(false);
      setBatteryHealth("");
      setColor("");
      setRepairCost("");
      setImei2("");
      setAccessories([]);
      setNotes("");
      setError(null);
    }
  }, [visible, prefilledImei]);

  const handleSave = async () => {
    const digits = imei.replace(/\D/g, "");
    if (digits.length !== 15) {
      setError("IMEI must be exactly 15 digits.");
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
    try {
      const device = await addDevice.mutateAsync({
        model: model.trim(),
        imei: digits,
        imei2: imei2.trim() || null,
        storage: storage ?? "",
        condition: condition ?? "",
        buy_price: buy,
        list_price: list,
        battery_health: battery,
        color: color.trim() || null,
        network_lock: networkLock,
        repair_cost: repairCost.trim() ? Number(repairCost) : 0,
        accessories: accessories.length > 0 ? JSON.stringify(accessories) : null,
        notes: notes.trim() || null,
      });
      onSaved?.(device);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save device.");
    }
  };

  const canSave =
    model.trim().length > 0 &&
    imei.trim().length > 0 &&
    storage !== null &&
    condition !== null &&
    Number(buyPrice) > 0 &&
    Number(listPrice) > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add purchased phone">
      <View className="max-h-[76vh]">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Field label="Brand & model">
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="e.g. iPhone 15 Pro Max"
              placeholderTextColor="#a1a1aa"
              autoCapitalize="words"
              className={inputClass}
            />
          </Field>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Storage">
                <View className="flex-row flex-wrap gap-1.5">
                  {STORAGE_OPTIONS.map((option) => (
                    <Pill
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
                <View className="flex-row flex-wrap gap-1.5">
                  {CONDITION_OPTIONS.map((option) => (
                    <Pill
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

          <Field label="IMEI / Serial number">
            <View className="relative">
              <TextInput
                value={imei}
                onChangeText={(t) => setImei(t.replace(/\D/g, ""))}
                placeholder="15-digit IMEI"
                placeholderTextColor="#a1a1aa"
                keyboardType="number-pad"
                maxLength={15}
                className={`${inputClass} pr-12 font-mono tracking-wide`}
              />
              <View className="absolute bottom-0 right-3.5 top-0 justify-center">
                <Ionicons name="scan-outline" size={20} color="#a1a1aa" />
              </View>
            </View>
          </Field>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Buy price (₱)">
                <TextInput
                  value={buyPrice}
                  onChangeText={(t) => setBuyPrice(t.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="decimal-pad"
                  className={inputClass}
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="List price (₱)">
                <TextInput
                  value={listPrice}
                  onChangeText={(t) => setListPrice(t.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="decimal-pad"
                  className={inputClass}
                />
              </Field>
            </View>
          </View>

          <Field label="Network lock">
            <View className="flex-row flex-wrap gap-1.5">
              {NETWORK_LOCK_OPTIONS.map((option) => (
                <Pill
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
            className="mb-3 flex-row items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 active:bg-zinc-100"
          >
            <View className="flex-row items-center gap-2">
              <View className="h-5 w-5 items-center justify-center rounded-full bg-black">
                <Ionicons name={specsOpen ? "remove" : "add"} size={14} color="#ffffff" />
              </View>
              <Text className="text-sm font-semibold text-zinc-950">
                Optional Specs (Battery, Color, Repair)
              </Text>
            </View>
            <Ionicons
              name={specsOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#71717a"
            />
          </Pressable>

          {specsOpen ? (
            <View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field label="Battery health (%)">
                    <TextInput
                      value={batteryHealth}
                      onChangeText={(t) => setBatteryHealth(t.replace(/[^0-9]/g, ""))}
                      placeholder="e.g. 85"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="number-pad"
                      maxLength={3}
                      className={inputClass}
                    />
                  </Field>
                </View>
                <View className="flex-1">
                  <Field label="Color">
                    <TextInput
                      value={color}
                      onChangeText={setColor}
                      placeholder="e.g. Natural Titanium"
                      placeholderTextColor="#a1a1aa"
                      autoCapitalize="words"
                      className={inputClass}
                    />
                  </Field>
                </View>
              </View>

              <Field label="Repair / extra cost (₱)">
                <TextInput
                  value={repairCost}
                  onChangeText={(t) => setRepairCost(t.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="decimal-pad"
                  className={inputClass}
                />
              </Field>

              <Field label="IMEI 2 (optional, for dual-SIM)">
                <TextInput
                  value={imei2}
                  onChangeText={(t) => setImei2(t.replace(/\D/g, ""))}
                  placeholder="15-digit secondary IMEI"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="number-pad"
                  maxLength={15}
                  className={`${inputClass} font-mono tracking-wide`}
                />
              </Field>

              <Field label="Included Accessories">
                <View className="flex-row flex-wrap gap-2">
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
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border active:opacity-80 ${
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
                  className={`${inputClass} min-h-[80px]`}
                />
              </Field>
            </View>
          ) : null}

          {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
        </ScrollView>

        <View className="mt-3 border-t border-zinc-100 pt-3">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Add to stock"
                onPress={handleSave}
                disabled={!canSave || addDevice.isPending}
                loading={addDevice.isPending}
                className="h-12"
              />
            </View>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
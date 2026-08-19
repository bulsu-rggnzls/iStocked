import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./ui/Button";
import { useAddDevice } from "../hooks/useInventory";
import type { Device } from "../types";

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITION_OPTIONS = ["Brand New", "Like New", "Good", "Fair"];

const inputClass =
  "rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-base text-zinc-950";

interface AddDeviceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (device: Device) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Chip({
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
      className={`rounded-full px-4 py-2 active:opacity-80 ${
        selected ? "bg-black" : "border border-zinc-200 bg-white"
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? "text-white" : "text-zinc-600"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AddDeviceSheet({ visible, onClose, onSaved }: AddDeviceSheetProps) {
  const addDevice = useAddDevice();
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [storage, setStorage] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [buyPrice, setBuyPrice] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setModel("");
      setImei("");
      setStorage(null);
      setCondition(null);
      setBuyPrice("");
      setListPrice("");
      setError(null);
    }
  }, [visible]);

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
    setError(null);
    try {
      const device = await addDevice.mutateAsync({
        model: model.trim(),
        imei: digits,
        storage: storage ?? "",
        condition: condition ?? "",
        buy_price: buy,
        list_price: list,
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
      <ScrollView showsVerticalScrollIndicator={false}>
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

        <Field label="Storage">
          <View className="flex-row flex-wrap gap-2">
            {STORAGE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={storage === option}
                onPress={() => setStorage(option)}
              />
            ))}
          </View>
        </Field>

        <Field label="Condition">
          <View className="flex-row flex-wrap gap-2">
            {CONDITION_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={condition === option}
                onPress={() => setCondition(option)}
              />
            ))}
          </View>
        </Field>

        <Field label="IMEI / Serial number">
          <TextInput
            value={imei}
            onChangeText={(t) => setImei(t.replace(/\D/g, ""))}
            placeholder="15-digit IMEI"
            placeholderTextColor="#a1a1aa"
            keyboardType="number-pad"
            maxLength={15}
            className={`${inputClass} font-mono tracking-wide`}
          />
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

        {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}

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
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
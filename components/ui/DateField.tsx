import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

interface DateFieldProps {
  label?: string;
  /** "yyyy-mm-dd" */
  value: string;
  onChange: (value: string) => void;
}

function toDate(value: string): Date {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => toDate(value));

  const display = value
    ? toDate(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";

  const toggle = () => {
    if (!open) setDraft(toDate(value));
    setOpen((o) => !o);
  };

  const pick = (selected: Date) => {
    setDraft(selected);
    onChange(toIso(selected));
  };

  return (
    <View>
      {label ? (
        <Text className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={toggle}
        className="h-12 flex-row items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 active:opacity-80"
      >
        <Text
          className={`flex-1 text-sm font-medium ${value ? "text-zinc-950" : "text-zinc-400"}`}
          numberOfLines={1}
          style={{ includeFontPadding: false }}
        >
          {display}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#71717a" />
      </Pressable>

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={draft}
          mode="date"
          onChange={(event, selected) => {
            setOpen(false);
            if (event.type === "set" && selected) pick(selected);
          }}
        />
      ) : null}

      {open && Platform.OS === "ios" ? (
        <View className="mt-2 rounded-2xl border border-zinc-200 bg-white">
          <View className="flex-row items-center justify-between px-3 pb-1 pt-2">
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Text className="text-sm font-semibold text-zinc-900">Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            onChange={(_, selected) => {
              if (selected) pick(selected);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDevices } from "../../hooks/useInventory";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { SearchBar } from "../../components/ui/SearchBar";
import { FilterChips } from "../../components/ui/FilterChips";
import { DeviceCard } from "../../components/DeviceCard";
import { BottomSheet } from "../../components/BottomSheet";
import { EmptyState } from "../../components/EmptyState";
import type { Device, DeviceStatus } from "../../types";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "In stock", value: "in_stock" },
  { label: "Sold", value: "sold" },
  { label: "Reserved", value: "reserved" },
];

const CONDITION_OPTIONS = [
  { label: "All conditions", value: "all" },
  { label: "Brand New", value: "Brand New" },
  { label: "Excellent", value: "Excellent" },
  { label: "Good", value: "Good" },
];

export default function InventoryScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<"all" | DeviceStatus>("all");
  const [condition, setCondition] = useState<string>("all");
  const [conditionSheetOpen, setConditionSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, isRefetching, refetch } =
    useDevices({ status, condition });

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (d) =>
        d.model.toLowerCase().includes(term) ||
        d.imei.includes(term),
    );
  }, [data, debouncedSearch]);

  const openDevice = (device: Device) =>
    router.push({ pathname: "/inventory/[id]", params: { id: device.id } });

  const startSale = (device: Device) =>
    router.push({ pathname: "/checkout", params: { deviceId: device.id } });

  const header = (
    <View>
      <ScreenHeader
        eyebrow="Stock on hand"
        title="Inventory"
        subtitle={
          data
            ? `${filtered.length} of ${data.length} ${data.length === 1 ? "device" : "devices"}`
            : undefined
        }
      />
      <View className="px-5 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onFilterPress={() => setConditionSheetOpen(true)}
        />
      </View>
      <FilterChips options={STATUS_OPTIONS} value={status} onChange={(v) => setStatus(v as "all" | DeviceStatus)} />
      <View className="pb-2" />
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F6F8F5]">
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-[#F6F8F5]">
        {header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base font-semibold text-[#13241B]">
            Couldn't load inventory
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-red-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-5 rounded-xl bg-brand-500 px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F8F5]">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <DeviceCard
              device={item}
              onPress={() => openDevice(item)}
              onSell={() => startSale(item)}
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="phone-portrait-outline"
            title={
              data && data.length > 0 ? "No devices match" : "No devices in stock"
            }
            message={
              data && data.length > 0
                ? "Try a different search or filter."
                : "Add your first device to start tracking inventory."
            }
          />
        }
        contentContainerClassName="gap-3 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#16a34a"
          />
        }
      />

      <BottomSheet
        visible={conditionSheetOpen}
        onClose={() => setConditionSheetOpen(false)}
        title="Filter by condition"
      >
        {CONDITION_OPTIONS.map((option) => {
          const selected = condition === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                setCondition(option.value);
                setConditionSheetOpen(false);
              }}
              className="flex-row items-center justify-between rounded-xl px-3 py-3.5 active:bg-[#F1F4F0]"
            >
              <Text className="text-base text-[#13241B]">{option.label}</Text>
              {selected ? (
                <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
              ) : (
                <View className="h-5 w-5 rounded-full border border-[#E3E8E2]" />
              )}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}
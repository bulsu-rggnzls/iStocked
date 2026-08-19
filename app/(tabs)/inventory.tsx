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
import { DeviceCard } from "../../components/DeviceCard";
import { BottomSheet } from "../../components/BottomSheet";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { RecordSaleSheet } from "../../components/RecordSaleSheet";
import { EmptyState } from "../../components/EmptyState";
import { formatPrice } from "../../lib/format";
import type { Device } from "../../types";

const CONDITION_OPTIONS = [
  { label: "All conditions", value: "all" },
  { label: "Brand New", value: "Brand New" },
  { label: "Like New", value: "Like New" },
  { label: "Good", value: "Good" },
  { label: "Fair", value: "Fair" },
];

export default function InventoryScreen() {
  const router = useRouter();
  const [condition, setCondition] = useState<string>("all");
  const [conditionSheetOpen, setConditionSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [saleDevice, setSaleDevice] = useState<Device | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, isRefetching, refetch } = useDevices({
    status: "in_stock",
    condition,
  });

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (d) =>
        d.model.toLowerCase().includes(term) ||
        d.imei.includes(term),
    );
  }, [data, debouncedSearch]);

  const capitalInStock = useMemo(
    () => (data ?? []).reduce((sum, d) => sum + Number(d.buy_price), 0),
    [data],
  );

  const openDevice = (device: Device) =>
    router.push({ pathname: "/inventory/[id]", params: { id: device.id } });

  const header = (
    <View>
      <ScreenHeader
        eyebrow="Stock on hand"
        title="Inventory"
        subtitle={
          data
            ? `${filtered.length} of ${data.length} ${data.length === 1 ? "phone" : "phones"}`
            : undefined
        }
        trailing={
          <Pressable
            onPress={() => setAddSheetOpen(true)}
            className="flex-row items-center gap-1 rounded-xl bg-black px-4 py-2.5 active:bg-zinc-900"
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Buy Phone</Text>
          </Pressable>
        }
      />
      <View className="px-5 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onFilterPress={() => setConditionSheetOpen(true)}
        />
      </View>

      <View className="mx-5 mb-3 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3.5">
        <View>
          <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            Capital in stock
          </Text>
          <Text className="mt-0.5 text-xl font-bold text-zinc-950">
            {formatPrice(capitalInStock)}
          </Text>
        </View>
        <Text className="text-xs text-zinc-400">
          {data?.length ?? 0} {data?.length === 1 ? "phone" : "phones"} ready
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-100">
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#09090b" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-zinc-100">
        {header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base font-semibold text-zinc-950">
            Couldn't load inventory
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-red-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-5 rounded-xl bg-black px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-100">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <DeviceCard
              device={item}
              onPress={() => openDevice(item)}
              onRecordSale={() => setSaleDevice(item)}
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="phone-portrait-outline"
            title={data && data.length > 0 ? "No devices match" : "No stock on hand"}
            message={
              data && data.length > 0
                ? "Try a different search or filter."
                : "Log your first purchased phone to start flipping."
            }
            actionLabel={data && data.length > 0 ? undefined : "Add a phone"}
            onAction={data && data.length > 0 ? undefined : () => setAddSheetOpen(true)}
          />
        }
        contentContainerClassName="gap-3 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#09090b"
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
              className="flex-row items-center justify-between rounded-xl px-3 py-3.5 active:bg-zinc-100"
            >
              <Text className="text-base text-zinc-950">{option.label}</Text>
              {selected ? (
                <Ionicons name="checkmark-circle" size={22} color="#09090b" />
              ) : (
                <View className="h-5 w-5 rounded-full border border-zinc-300" />
              )}
            </Pressable>
          );
        })}
      </BottomSheet>

      <AddDeviceSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
      />

      <RecordSaleSheet
        device={saleDevice}
        onClose={() => setSaleDevice(null)}
      />
    </View>
  );
}
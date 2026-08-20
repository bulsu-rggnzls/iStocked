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
import { BottomSheet } from "../../components/BottomSheet";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { RecordSaleSheet } from "../../components/RecordSaleSheet";
import { EmptyState } from "../../components/EmptyState";
import { NETWORK_LOCK_OPTIONS, networkLockShort } from "../../lib/networkLock";
import { formatImei, formatPrice } from "../../lib/format";
import type { Device } from "../../types";

const CONDITION_OPTIONS = [
  { label: "All conditions", value: "all" },
  { label: "Brand New", value: "Brand New" },
  { label: "Like New", value: "Like New" },
  { label: "Good", value: "Good" },
  { label: "Fair", value: "Fair" },
];

const NETWORK_FILTER_OPTIONS = [
  { label: "All networks", value: "all" },
  ...NETWORK_LOCK_OPTIONS.map((option) => ({ label: option, value: option })),
];

function NetworkBadge({ value }: { value: string | null }) {
  const short = networkLockShort(value);
  if (!short) return null;
  return (
    <View className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-px">
      <Text className="text-[9px] font-semibold text-zinc-600">{short}</Text>
    </View>
  );
}

function InventoryRow({
  device,
  onPress,
  onSell,
}: {
  device: Device;
  onPress: () => void;
  onSell: () => void;
}) {
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const potential = Number(device.list_price) - totalCost;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 active:bg-zinc-100"
    >
      <View className="flex-1 pr-2">
        <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
          {device.model}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Text
            className="shrink text-[11px] text-zinc-500"
            numberOfLines={1}
          >
            {device.storage} · {device.condition}
          </Text>
          <NetworkBadge value={device.network_lock} />
        </View>
        <Text className="mt-0.5 font-mono text-[10px] tracking-wide text-zinc-400" numberOfLines={1}>
          {formatImei(device.imei)}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
          {formatPrice(device.list_price)}
        </Text>
        <Text className="mt-0.5 text-[11px] font-semibold text-zinc-600" numberOfLines={1}>
          +{formatPrice(potential)}
        </Text>
      </View>

      <Pressable
        onPress={onSell}
        className="ml-3 rounded-md bg-black px-3 py-2 active:bg-zinc-900"
      >
        <Text className="text-xs font-semibold text-white">Sell</Text>
      </Pressable>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const [condition, setCondition] = useState<string>("all");
  const [networkLock, setNetworkLock] = useState<string>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
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
    networkLock,
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
    () => (data ?? []).reduce((sum, d) => sum + Number(d.buy_price) + Number(d.repair_cost ?? 0), 0),
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
          onFilterPress={() => setFilterSheetOpen(true)}
        />
      </View>

      <View className="flex-row items-center justify-between border-y border-zinc-200 bg-white px-5 py-2.5">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Capital in stock
        </Text>
        <Text className="text-sm font-bold text-zinc-950">
          {formatPrice(capitalInStock)}
        </Text>
        <Text className="text-[11px] text-zinc-400">
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
          <View className="px-4">
            <InventoryRow
              device={item}
              onPress={() => openDevice(item)}
              onSell={() => setSaleDevice(item)}
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
        contentContainerClassName="gap-1.5 pb-10"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#09090b"
          />
        }
      />

      <BottomSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter inventory"
      >
        <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Condition
        </Text>
        {CONDITION_OPTIONS.map((option) => {
          const selected = condition === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setCondition(option.value)}
              className="flex-row items-center justify-between rounded-xl px-3 py-3 active:bg-zinc-100"
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

        <Text className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Network lock
        </Text>
        {NETWORK_FILTER_OPTIONS.map((option) => {
          const selected = networkLock === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setNetworkLock(option.value)}
              className="flex-row items-center justify-between rounded-xl px-3 py-3 active:bg-zinc-100"
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

        <View className="mt-4">
          <Pressable
            onPress={() => setFilterSheetOpen(false)}
            className="items-center rounded-xl bg-black py-3 active:bg-zinc-900"
          >
            <Text className="font-semibold text-white">Done</Text>
          </Pressable>
        </View>
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
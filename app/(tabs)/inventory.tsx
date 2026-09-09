import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDevices } from "../../hooks/useInventory";
import { SearchBar } from "../../components/ui/SearchBar";
import { BottomSheet } from "../../components/BottomSheet";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { RecordSaleSheet } from "../../components/RecordSaleSheet";
import { EmptyState } from "../../components/EmptyState";
import { NETWORK_LOCK_OPTIONS } from "../../lib/networkLock";
import { formatPrice } from "../../lib/format";
import type { Device } from "../../types";

const CONDITION_OPTIONS = [
  { label: "All conditions", value: "all" },
  { label: "Brand New", value: "Brand New" },
  { label: "Used", value: "Used" },
];

const NETWORK_FILTER_OPTIONS = [
  { label: "All networks", value: "all" },
  ...NETWORK_LOCK_OPTIONS.map((option) => ({ label: option, value: option })),
];

function ShelfRow({
  device,
  onPress,
  onSell,
  last,
}: {
  device: Device;
  onPress: () => void;
  onSell: () => void;
  last: boolean;
}) {
  const totalCost = Number(device.buy_price) + Number(device.repair_cost ?? 0);
  const potential = Number(device.list_price) - totalCost;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-2.5 active:opacity-70 ${last ? "" : "border-b border-dashed border-zinc-200"}`}
    >
      <View className="w-9 h-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
        <Ionicons name="phone-portrait-outline" size={15} color="#3f3f46" />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-zinc-950">
          {device.model}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[11px] text-zinc-500">
          {device.storage} · {device.condition}
        </Text>
      </View>

      <View className="items-end">
        <Text numberOfLines={1} className="text-sm font-bold text-zinc-950">
          {formatPrice(device.list_price)}
        </Text>
        <Text
          numberOfLines={1}
          className={`text-[11px] font-semibold ${potential >= 0 ? "text-emerald-700" : "text-red-700"}`}
        >
          {potential >= 0 ? "+" : "\u2212"}
          {formatPrice(Math.abs(potential))}
        </Text>
      </View>

      <Pressable
        onPress={onSell}
        className="rounded-xl bg-black px-3.5 py-2 active:opacity-80"
      >
        <Text className="text-xs font-semibold text-white">Sell</Text>
      </Pressable>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; addImei?: string }>();
  const insets = useSafeAreaInsets();
  const [condition, setCondition] = useState<string>("all");
  const [networkLock, setNetworkLock] = useState<string>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [draftCondition, setDraftCondition] = useState<string>("all");
  const [draftNetworkLock, setDraftNetworkLock] = useState<string>("all");
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [saleDevice, setSaleDevice] = useState<Device | null>(null);
  const [search, setSearch] = useState(params.search ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(params.search ?? "");
  const [prefilledImei, setPrefilledImei] = useState<string | null>(params.addImei ?? null);
  const paramsHandledRef = useRef(false);

  useEffect(() => {
    if (paramsHandledRef.current) return;
    if (params.search || params.addImei) {
      paramsHandledRef.current = true;
      if (params.addImei) setAddSheetOpen(true);
      router.replace("/(tabs)/inventory");
    }
  }, [params.search, params.addImei, router]);

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
    () => filtered.reduce((sum, d) => sum + Number(d.buy_price) + Number(d.repair_cost ?? 0), 0),
    [filtered],
  );

  const potentialProfit = useMemo(
    () =>
      filtered.reduce(
        (sum, d) => sum + Number(d.list_price) - Number(d.buy_price) - Number(d.repair_cost ?? 0),
        0,
      ),
    [filtered],
  );

  const openDevice = (device: Device) =>
    router.push({ pathname: "/inventory/[id]", params: { id: device.id } });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const activeFilterCount =
    (condition !== "all" ? 1 : 0) + (networkLock !== "all" ? 1 : 0);

  const openFilterSheet = () => {
    setDraftCondition(condition);
    setDraftNetworkLock(networkLock);
    setFilterSheetOpen(true);
  };

  const applyFilters = () => {
    setCondition(draftCondition);
    setNetworkLock(draftNetworkLock);
    setFilterSheetOpen(false);
  };

  const resetFilters = () => {
    setDraftCondition("all");
    setDraftNetworkLock("all");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-100">
        <ActivityIndicator size="large" color="#09090b" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-100 px-8">
        <Text className="text-center text-base font-semibold text-zinc-950">
          Couldn&apos;t load inventory
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
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-100"
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor="#09090b"
        />
      }
    >
      {/* Header */}
      <View className="px-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Stock on hand
            </Text>
            <Text className="mt-1 text-3xl font-bold text-zinc-950">Inventory</Text>
          </View>
          <Pressable
            onPress={() => setAddSheetOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white active:bg-zinc-100"
            accessibilityLabel="Add purchased phone"
          >
            <Ionicons name="add" size={20} color="#09090b" />
          </Pressable>
        </View>

        <View className="mt-3.5">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            filterCount={activeFilterCount}
            onFilterPress={openFilterSheet}
          />
        </View>
      </View>

      {/* Capital summary */}
      <View className="px-4 pt-4">
        <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>
                Capital in stock
              </Text>
              <Text className="mt-1 text-lg font-bold text-zinc-950" numberOfLines={1}>
                {formatPrice(capitalInStock)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-zinc-500" numberOfLines={1}>
                {filtered.length} {filtered.length === 1 ? "unit" : "units"} on shelf
              </Text>
            </View>
            <View className="w-px bg-zinc-200" />
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500" numberOfLines={1}>
                If all sells
              </Text>
              <Text className="mt-1 text-lg font-bold text-zinc-950" numberOfLines={1}>
                {formatPrice(potentialProfit)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-zinc-500" numberOfLines={1}>
                profit at list price
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* List */}
      <View className="px-4 pt-5">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            On the shelf
          </Text>
          {filtered.length > 0 ? (
            <Text className="text-xs font-medium text-zinc-500">
              {filtered.length} of {data?.length ?? 0} shown
            </Text>
          ) : null}
        </View>

        <View className="rounded-2xl border border-zinc-200 bg-white px-4">
          {filtered.length === 0 ? (
            <View className="py-2">
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
            </View>
          ) : (
            filtered.map((item, i) => (
              <ShelfRow
                key={item.id}
                device={item}
                last={i === filtered.length - 1}
                onPress={() => openDevice(item)}
                onSell={() => setSaleDevice(item)}
              />
            ))
          )}
        </View>
      </View>

      <AddDeviceSheet
        visible={addSheetOpen}
        onClose={() => { setAddSheetOpen(false); setPrefilledImei(null); }}
        prefilledImei={prefilledImei}
      />

      <RecordSaleSheet
        device={saleDevice}
        onClose={() => setSaleDevice(null)}
      />

      <BottomSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter inventory"
      >
        <ScrollView
          className="px-4 pt-4"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <View>
            <Text className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Condition
            </Text>
            <View className="gap-1">
              {CONDITION_OPTIONS.map((option) => {
                const selected = draftCondition === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraftCondition(option.value)}
                    className="flex-row items-center justify-between rounded-xl px-3 py-2.5 active:bg-zinc-100"
                  >
                    <Text className="text-xs font-medium text-zinc-800">{option.label}</Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#09090b" />
                    ) : (
                      <View className="h-5 w-5 rounded-full border border-zinc-300" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-6">
            <Text className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Network lock
            </Text>
            <View className="gap-1">
              {NETWORK_FILTER_OPTIONS.map((option) => {
                const selected = draftNetworkLock === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraftNetworkLock(option.value)}
                    className="flex-row items-center justify-between rounded-xl px-3 py-2.5 active:bg-zinc-100"
                  >
                    <Text className="text-xs font-medium text-zinc-800">{option.label}</Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#09090b" />
                    ) : (
                      <View className="h-5 w-5 rounded-full border border-zinc-300" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View className="flex-row gap-3 border-t border-zinc-100 bg-white px-4 pb-4 pt-3">
          <Pressable
            onPress={resetFilters}
            className="h-11 flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white active:bg-zinc-100"
          >
            <Text className="text-xs font-semibold text-zinc-950">Reset</Text>
          </Pressable>
          <Pressable
            onPress={applyFilters}
            className="h-11 flex-1 items-center justify-center rounded-2xl bg-black active:opacity-80"
          >
            <Text className="text-xs font-semibold text-white">Apply filters</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </ScrollView>
  );
}

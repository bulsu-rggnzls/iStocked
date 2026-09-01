import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDevices } from "../../hooks/useInventory";
import { useIsTablet } from "../../hooks/useIsTablet";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { SearchBar } from "../../components/ui/SearchBar";
import { BottomSheet } from "../../components/BottomSheet";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { RecordSaleSheet } from "../../components/RecordSaleSheet";
import { EmptyState } from "../../components/EmptyState";
import { NETWORK_LOCK_OPTIONS } from "../../lib/networkLock";
import { formatImei, formatPrice } from "../../lib/format";
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
      className="w-full bg-white rounded-xl border border-zinc-200 flex flex-row items-center justify-between px-3.5 py-2.5 active:bg-zinc-50"
    >
      <View className="flex flex-col items-start text-left gap-0.5 flex-1 mr-3">
        <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
          {device.model}
        </Text>
        <Text className="text-[11px] text-zinc-500 font-mono truncate max-w-[180px]" numberOfLines={1} ellipsizeMode="tail">
          {device.storage} · {device.condition} · {formatImei(device.imei)}
        </Text>
      </View>

      <View className="flex flex-row items-center gap-3 shrink-0">
        <View className="flex flex-col items-end text-right">
          <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
            {formatPrice(device.list_price)}
          </Text>
          <View className="mt-0.5 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            <Text className="text-xs font-semibold text-emerald-700 whitespace-nowrap" style={{ textDecorationLine: 'none' }} numberOfLines={1}>
              +{formatPrice(potential)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onSell}
          className="bg-black px-3.5 py-1.5 rounded-lg active:bg-zinc-800"
        >
          <Text className="text-xs font-semibold text-white">Sell</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; addImei?: string }>();
  const isTablet = useIsTablet();
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
    () => (data ?? []).reduce((sum, d) => sum + Number(d.buy_price) + Number(d.repair_cost ?? 0), 0),
    [data],
  );

  const openDevice = (device: Device) =>
    router.push({ pathname: "/inventory/[id]", params: { id: device.id } });

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

  const header = (
    <View className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
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
      <SearchBar
        value={search}
        onChangeText={setSearch}
        filterCount={activeFilterCount}
        onFilterPress={openFilterSheet}
      />

      <View className="flex flex-row items-center justify-between px-4 py-3 bg-white rounded-xl border border-zinc-100">
        <Text className="text-xs font-bold text-zinc-400 tracking-wider">
          CAPITAL IN STOCK
        </Text>
        <Text className="text-base font-bold text-zinc-900">
          {formatPrice(capitalInStock)}
        </Text>
        <Text className="text-xs font-medium text-zinc-400">
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
    <ScrollView
      className="flex-1 bg-zinc-100"
      contentContainerClassName="pb-8"
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
      {header}

      <View className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {filtered.length === 0 ? (
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
        ) : (
          <View className="flex flex-col gap-3">
            {filtered.map((item) => (
              <InventoryRow
                key={item.id}
                device={item}
                onPress={() => openDevice(item)}
                onSell={() => setSaleDevice(item)}
              />
            ))}
          </View>
        )}
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
        <ScrollView className="px-4 pt-4 pb-6 space-y-6 overflow-y-auto" showsVerticalScrollIndicator={false} bounces={false} alwaysBounceVertical={false} overScrollMode="never">
          <View>
            <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block px-1">
              Condition
            </Text>
            <View className="space-y-1">
              {CONDITION_OPTIONS.map((option) => {
                const selected = draftCondition === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraftCondition(option.value)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer text-xs font-medium text-zinc-800 flex-row active:bg-zinc-100"
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

          <View>
            <Text className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block px-1">
              Network lock
            </Text>
            <View className="space-y-1">
              {NETWORK_FILTER_OPTIONS.map((option) => {
                const selected = draftNetworkLock === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraftNetworkLock(option.value)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer text-xs font-medium text-zinc-800 flex-row active:bg-zinc-100"
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

        <View className="px-4 pt-3 pb-4 border-t border-zinc-100 bg-white flex-row gap-3">
          <Pressable
            onPress={resetFilters}
            className="flex-1 h-11 rounded-xl text-sm font-semibold border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 items-center justify-center active:bg-zinc-100"
          >
            <Text className="text-sm font-semibold text-zinc-700">Reset</Text>
          </Pressable>
          <Pressable
            onPress={applyFilters}
            className="flex-1 h-11 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm items-center justify-center active:bg-zinc-900"
          >
            <Text className="text-sm font-semibold text-white">Apply Filters</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </ScrollView>
  );
}
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMetrics } from "../../hooks/useMetrics";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { StatCard } from "../../components/StatCard";
import { EmptyState } from "../../components/EmptyState";
import { formatDate, formatPrice } from "../../lib/format";
import type { Sale } from "../../types";

const titleCase = (value: string) =>
  value
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function SaleRow({ sale }: { sale: Sale }) {
  return (
    <View className="rounded-2xl border border-[#E3E8E2] bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base font-semibold text-[#13241B]">
          {sale.device?.model ?? "Device sale"}
        </Text>
        <Text className="text-lg font-bold text-[#13241B]">
          {formatPrice(sale.final_price)}
        </Text>
      </View>
      <View className="mt-1.5 flex-row items-center justify-between gap-3">
        <Text className="text-sm text-[#5F6F64]">
          {formatDate(sale.sold_at)} · {titleCase(sale.payment_method)}
        </Text>
        <Text className="text-sm text-[#5F6F64]">
          {sale.customer?.full_name ?? "Walk-in"}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, isRefetching, refetch } =
    useMetrics();

  const header = (
    <View>
      <ScreenHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      <View className="flex-row flex-wrap px-3.5 pt-1">
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Total sales"
            value={data ? formatPrice(data.totalSales) : "—"}
            icon="cash-outline"
            accent="brand"
            trend="+0% this week"
          />
        </View>
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Net profit"
            value={data ? formatPrice(data.netProfit) : "—"}
            icon="trending-up-outline"
            accent="emerald"
            trend="+0% this week"
          />
        </View>
        <View className="w-1/2 p-1.5">
          <StatCard
            label="Units sold"
            value={data ? String(data.unitsSold) : "—"}
            icon="phone-portrait-outline"
            accent="ink"
            trend="this week"
          />
        </View>
        <View className="w-1/2 p-1.5">
          <StatCard
            label="In stock"
            value={data ? String(data.availableStock) : "—"}
            icon="layers-outline"
            accent="amber"
            trend="ready to sell"
          />
        </View>
      </View>

      <View className="px-5 pb-2 pt-5">
        <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5F6F64]">
          Activity
        </Text>
        <Text className="mt-1 text-2xl font-bold text-[#13241B]">
          Recent sales
        </Text>
      </View>
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
            Couldn't load your dashboard
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

  const sales = data?.recentSales ?? [];

  return (
    <View className="flex-1 bg-[#F6F8F5]">
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <SaleRow sale={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No sales yet"
            message="Sales you record will show up here."
            actionLabel="Browse inventory"
            onAction={() => router.push("/inventory")}
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
    </View>
  );
}
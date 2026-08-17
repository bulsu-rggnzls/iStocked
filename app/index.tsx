import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import type { InventoryItem } from "../types";

export default function HomeScreen() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("inventory").select("*");
    if (error) {
      console.error("Supabase Connection Error:", error);
      setError(error.message);
      setData([]);
    } else {
      setData(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    testFetch();
  }, [testFetch]);

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-xl font-bold">iStocked App</Text>
      {loading ? (
        <ActivityIndicator className="mt-4" />
      ) : error ? (
        <>
          <Text className="mt-2 text-red-500">Connection error</Text>
          <Text className="mt-1 text-gray-600 text-center">{error}</Text>
        </>
      ) : (
        <Text className="mt-2 text-gray-600">
          Total items in DB: {data.length}
        </Text>
      )}
      <Pressable
        onPress={testFetch}
        className="mt-6 rounded-lg bg-brand-500 px-6 py-2"
      >
        <Text className="font-semibold text-white">Retry</Text>
      </Pressable>
    </View>
  );
}
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function AppHeader({ title, onBack, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View
      className="flex-row items-center gap-3 bg-zinc-100 px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable
        onPress={handleBack}
        hitSlop={8}
        className="flex-row items-center gap-0.5 rounded-full border border-zinc-200 bg-white py-2 pl-2 pr-3.5 active:opacity-80"
      >
        <Ionicons name="chevron-back" size={18} color="#09090b" />
        <Text className="text-sm font-semibold text-zinc-950">Back</Text>
      </Pressable>
      <Text className="flex-1 text-lg font-bold text-zinc-950" numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}
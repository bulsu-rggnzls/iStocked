import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  filterCount?: number;
  onFilterPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search IMEI or model",
  filterCount = 0,
  onFilterPress,
}: SearchBarProps) {
  return (
    <View className="h-12 flex-row items-center rounded-xl border border-zinc-200 bg-white px-4">
      <Ionicons name="search-outline" size={18} color="#71717a" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a1a1aa"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 px-2.5 text-base text-zinc-950"
      />
      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          hitSlop={8}
          className="relative rounded-lg bg-zinc-100 p-2 active:opacity-70"
        >
          <Ionicons name="options-outline" size={18} color="#71717a" />
          {filterCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-black">
              <Text className="text-[9px] font-bold text-white">{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : filterCount > 0 ? (
        <View className="rounded-lg bg-black px-2 py-1">
          <Text className="text-[10px] font-bold text-white">{filterCount}</Text>
        </View>
      ) : null}
    </View>
  );
}
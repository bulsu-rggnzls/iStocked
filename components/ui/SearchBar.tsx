import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search IMEI or model",
  onFilterPress,
}: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-xl border border-zinc-200 bg-white px-3.5">
      <Ionicons name="search-outline" size={18} color="#71717a" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a1a1aa"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 px-2.5 py-3 text-base text-zinc-950"
      />
      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          hitSlop={8}
          className="rounded-lg bg-zinc-100 p-2 active:opacity-70"
        >
          <Ionicons name="options-outline" size={18} color="#71717a" />
        </Pressable>
      ) : null}
    </View>
  );
}
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
    <View className="flex-row items-center rounded-xl border border-[#E3E8E2] bg-white px-3.5">
      <Ionicons name="search-outline" size={18} color="#9AA69D" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA69D"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 px-2.5 py-3 text-base text-[#13241B]"
      />
      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          hitSlop={8}
          className="rounded-lg bg-[#F1F4F0] p-2 active:opacity-70"
        >
          <Ionicons name="options-outline" size={18} color="#5F6F64" />
        </Pressable>
      ) : null}
    </View>
  );
}
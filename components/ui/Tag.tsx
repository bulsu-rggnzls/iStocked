import { Pressable, Text } from "react-native";

interface TagProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Tag({ label, selected = false, onPress }: TagProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex items-center justify-center px-2.5 py-1.5 text-xs rounded-lg font-medium active:opacity-80 ${
        selected ? "bg-zinc-900 shadow-sm" : "bg-zinc-100 active:bg-zinc-200/80"
      }`}
    >
      <Text
        className={`text-xs ${
          selected ? "font-semibold text-white" : "font-medium text-zinc-700"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

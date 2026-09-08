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
      className="h-9 shrink-0 items-center justify-center rounded-lg px-3.5 active:opacity-80"
      style={{
        backgroundColor: selected ? "#18181b" : "#f4f4f5",
      }}
    >
      <Text
        className="text-xs"
        style={{
          color: selected ? "#ffffff" : "#3f3f46",
          fontWeight: selected ? "600" : "500",
          includeFontPadding: false,
          textAlignVertical: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
      className={`h-9 shrink-0 items-center justify-center rounded-lg px-3.5 active:opacity-80 ${
        selected ? "bg-text-main" : "bg-bg-surface-secondary"
      }`}
    >
      <Text
        className={`text-xs ${
          selected ? "font-semibold text-text-inverted" : "font-medium text-text-muted-foreground"
        }`}
        style={{
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
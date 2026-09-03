import { Pressable, ScrollView, Text } from "react-native";

export interface FilterChipOption {
  label: string;
  value: string;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      alwaysBounceHorizontal={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      contentContainerClassName="gap-2 px-5 py-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`h-9 flex items-center justify-center px-3.5 rounded-xl active:opacity-80 ${
              selected ? "bg-zinc-900 shadow-sm" : "bg-zinc-100 active:bg-zinc-200/80"
            }`}
          >
            <Text
              className={`text-xs ${
                selected ? "font-semibold text-white" : "font-medium text-zinc-700"
              }`}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
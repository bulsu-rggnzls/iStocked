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
      contentContainerClassName="gap-2 px-5 py-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`rounded-full px-3.5 py-2 active:opacity-80 ${
              selected ? "border border-black bg-black" : "border border-zinc-200 bg-zinc-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                selected ? "text-white" : "text-zinc-700"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
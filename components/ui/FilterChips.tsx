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
            className={`rounded-full px-4 py-2 active:opacity-80 ${
              selected ? "bg-brand-500" : "border border-[#E3E8E2] bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selected ? "text-white" : "text-[#5F6F64]"
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
import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-2 pt-16">
      <View className="flex-1 pr-4">
        {eyebrow ? (
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="mt-1 text-3xl font-bold text-zinc-950">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 text-sm text-zinc-500">{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
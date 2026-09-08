import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./ui/Button";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center px-6 py-7">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
        <Ionicons name={icon} size={22} color="#52525b" />
      </View>
      <Text className="mt-3 text-sm font-semibold text-zinc-950">
        {title}
      </Text>
      <Text className="mt-1 text-center text-xs leading-4 text-zinc-500">{message}</Text>
      {actionLabel && onAction ? (
        <View className="mt-4 w-full">
          <Button title={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

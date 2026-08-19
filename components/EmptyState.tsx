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
    <View className="items-center px-8 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
        <Ionicons name={icon} size={28} color="#ffffff" />
      </View>
      <Text className="mt-4 text-base font-semibold text-zinc-950">
        {title}
      </Text>
      <Text className="mt-2 text-center text-sm text-zinc-500">{message}</Text>
      {actionLabel && onAction ? (
        <View className="mt-5 w-full">
          <Button title={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
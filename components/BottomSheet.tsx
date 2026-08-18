import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          onPress={onClose}
          className="absolute inset-0 bg-black/40"
        />
        <View
          className="rounded-t-3xl bg-white p-5"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E3E8E2]" />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-[#13241B]">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#5F6F64" />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
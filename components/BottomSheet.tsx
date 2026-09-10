import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsTablet } from "../hooks/useIsTablet";

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
  const isTablet = useIsTablet();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Outer container: locked to viewport, never moves */}
      <View className="flex-1 justify-end">
        <Pressable onPress={onClose} className="absolute inset-0 bg-black/40" />
        {/* Sheet container: fixed cap, rounded, clips content */}
        <View
          className={`flex flex-col rounded-t-2xl bg-white overflow-hidden ${
            isTablet ? "mx-auto max-w-lg my-auto rounded-2xl" : ""
          }`}
          style={{ maxHeight: "90%" }}
        >
          {/* Inside-only keyboard avoidance: grows padding on iOS (capped by maxHeight), no-op on Android.
              flexShrink lets this wrapper yield height when the sheet hits its cap, so the inner
              ScrollView actually shrinks and the footer is never clipped. */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
            style={{
              paddingBottom: Math.max(insets.bottom, 0),
              flexShrink: 1,
              minHeight: 0,
            }}
          >
            {/* Fixed header: pinned top, outside the scroll area */}
            <View className="shrink-0 px-4 pt-3 pb-3 border-b border-zinc-100">
              <View className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-200" />
              <View className="flex flex-row items-center justify-between">
                <Text className="text-lg font-bold text-zinc-950">{title}</Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={24} color="#71717a" />
                </Pressable>
              </View>
            </View>
            {children}
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

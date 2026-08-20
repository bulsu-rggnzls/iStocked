import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TextFieldProps extends Omit<TextInputProps, "secureTextEntry"> {
  label?: string;
  error?: string | null;
  secure?: boolean;
}

export function TextField({
  label,
  error,
  secure = false,
  ...inputProps
}: TextFieldProps) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View>
      {label ? (
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </Text>
      ) : null}
      <View className="relative">
        <TextInput
          {...inputProps}
          secureTextEntry={hidden}
          placeholderTextColor={inputProps.placeholderTextColor ?? "#a1a1aa"}
          className={`rounded-xl border bg-white px-4 py-3.5 text-base text-zinc-950 ${
            error ? "border-red-400" : "border-zinc-200"
          } ${secure ? "pr-12" : ""}`}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            className="absolute right-4 top-0 bottom-0 justify-center"
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#71717a"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1.5 text-sm leading-5 text-red-600">{error}</Text>
      ) : null}
    </View>
  );
}
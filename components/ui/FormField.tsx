import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

interface FormFieldProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label?: string;
  error?: string | null;
  prefix?: string;
  suffixIcon?: React.ReactNode;
}

export function FormField({
  label,
  error,
  prefix,
  suffixIcon,
  style,
  ...inputProps
}: FormFieldProps) {
  return (
    <View>
      {label ? (
        <Text className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </Text>
      ) : null}
      <View
        className={`h-12 flex-row items-center rounded-xl border bg-white px-4 ${
          error ? "border-red-400" : "border-zinc-200"
        }`}
      >
        {prefix ? (
          <Text
            className="mr-1.5 text-sm font-semibold text-zinc-400"
            style={{ includeFontPadding: false }}
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor="#a1a1aa"
          className="flex-1 text-sm font-medium text-zinc-950"
          style={[
            {
              includeFontPadding: false,
              textAlignVertical: "center",
              paddingVertical: 0,
            },
            ...(Array.isArray(style) ? style : style ? [style] : []),
          ]}
        />
        {suffixIcon}
      </View>
    </View>
  );
}

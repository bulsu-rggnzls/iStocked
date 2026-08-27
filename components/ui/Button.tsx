import { ActivityIndicator, Pressable, Text } from "react-native";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 active:bg-black",
  secondary: "border border-zinc-200 bg-white active:bg-zinc-100",
  danger: "bg-red-600 active:bg-red-700",
  ghost: "bg-transparent active:opacity-70",
};

const textStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-zinc-950",
  danger: "text-white",
  ghost: "text-zinc-900",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "px-4 py-3",
  lg: "px-5 py-4",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? "opacity-60" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#ffffff" : "#09090b"} />
      ) : (
        <Text className={`text-base font-semibold ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
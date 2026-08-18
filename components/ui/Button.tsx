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
  primary: "bg-brand-500 active:bg-brand-600",
  secondary: "border border-[#E3E8E2] bg-white active:bg-[#F1F4F0]",
  danger: "bg-red-600 active:bg-red-700",
  ghost: "bg-transparent active:opacity-70",
};

const textStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-[#13241B]",
  danger: "text-white",
  ghost: "text-brand-700",
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
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#ffffff" : "#16a34a"} />
      ) : (
        <Text className={`text-base font-semibold ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
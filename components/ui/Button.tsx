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
  primary: "bg-brand-primary active:bg-brand-purple",
  secondary: "border border-border-subtle bg-surface active:bg-surface-secondary",
  danger: "bg-state-error active:bg-red-700",
  ghost: "bg-transparent active:opacity-80",
};

const textStyles: Record<ButtonVariant, string> = {
  primary: "text-brand-primary-foreground",
  secondary: "text-text-on-surface",
  danger: "text-state-error-foreground",
  ghost: "text-text-muted-foreground",
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
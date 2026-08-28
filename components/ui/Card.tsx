import { View } from "react-native";
import type { ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`bg-white rounded-xl border border-zinc-200 px-3.5 py-2.5 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

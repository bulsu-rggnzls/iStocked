"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Pressable, View, Text, TextInput, PressableProps } from "react-native";

export const buttonVariants = cva(
  "items-center justify-center rounded-xl px-4 py-3 active:opacity-90 transition-all duration-200",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-brand-primary-foreground shadow-sm hover:bg-brand-purple hover:shadow-md",
        secondary:
          "border border-border-subtle bg-surface text-text-on-surface shadow-sm hover:bg-surface-secondary hover:shadow-md",
        danger:
          "bg-state-error text-state-error-foreground shadow-sm hover:bg-red-700 hover:shadow-md",
        ghost: "bg-transparent text-text-muted-foreground hover:bg-surface-secondary",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3 text-base",
        lg: "px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const cardVariants = cva(
  "rounded-xl border border-border-subtle bg-surface p-4 shadow-sm",
  {
    variants: {
      padded: {
        true: "p-4",
        false: "p-3",
      },
    },
    defaultVariants: {
      padded: true,
    },
  }
);

export const inputVariants = cva(
  "h-12 w-full rounded-xl border bg-surface px-4 text-base font-medium transition-all duration-200 placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
  {
    variants: {
      error: {
        true: "border-state-error focus:border-state-error",
        false: "border-border-subtle",
      },
      size: {
        sm: "h-10 text-sm",
        md: "h-12 text-base",
        lg: "h-14 text-lg",
      },
    },
    defaultVariants: {
      error: false,
      size: "md",
    },
  }
);

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        brand: "border border-border-subtle bg-surface-secondary text-text-muted-foreground",
        gray: "border border-border-subtle bg-surface-secondary text-text-muted",
        amber: "border border-border-subtle bg-surface-secondary text-text-muted-foreground",
        emerald: "border border-border-subtle bg-surface-secondary text-text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "gray",
    },
  }
);

export const layoutVariants = {
  container: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
  page: "min-h-screen bg-canvas",
  section: "py-6 md:py-8",
  grid: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
  flex: "flex flex-wrap gap-2",
};

export function Button(
  props: PressableProps & VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
) {
  const { className, variant, size, loading, leftIcon, rightIcon, ...rest } = props;

  return (
    <Pressable
      className={buttonVariants({ variant, size, className })}
      disabled={loading || props.disabled}
      {...rest}
    >
      {loading ? (
        <View className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {leftIcon}
          {props.children}
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

export function Card(
  props: React.ComponentProps<typeof View> & VariantProps<typeof cardVariants>
) {
  const { className, padded, ...rest } = props;

  return <View className={cardVariants({ padded, className })} {...rest} />;
}

export function Input(
  props: React.ComponentProps<typeof TextInput> & VariantProps<typeof inputVariants>
) {
  const { className, error, size, ...rest } = props;

  return <TextInput className={inputVariants({ error, size, className })} {...rest} />;
}

export function Badge(
  props: React.ComponentProps<typeof View> & VariantProps<typeof badgeVariants> & {
    dot?: boolean;
    dotColor?: string;
  }
) {
  const { className, tone, dot, dotColor, ...rest } = props;

  return (
    <View className={badgeVariants({ tone, className })} {...rest}>
      {dot && (
        <View
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor || (tone === "brand" ? "#6d28d9" : "#a1a1aa") }}
        />
      )}
      {props.children}
    </View>
  );
}

export function Container({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className || ""}`} {...props} />;
}

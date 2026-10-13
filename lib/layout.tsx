"use client";

import { cva, type VariantProps } from "class-variance-authority";

export const layoutVariants = {
  container: cva(
    "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
    {
      variants: {
        padding: {
          none: "px-0",
          sm: "px-4",
          md: "px-6",
          lg: "px-8",
        },
      },
      defaultVariants: {
        padding: "md",
      },
    }
  ),
  page: "min-h-screen bg-canvas",
  section: "py-6 md:py-8",
  grid: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
  flex: "flex flex-wrap gap-2",
};

export function LayoutContainer({ 
  className = "", 
  padding = "md", 
  children 
}: {
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <View 
      className={`${layoutVariants.container} ${className || ""} ${layoutVariants.padding(padding)}`} 
      {...props}
    >
      {children}
    </View>
  );
}
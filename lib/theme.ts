"use client";

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
} as const;

export const textColors = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
  "muted-foreground": "text-text-muted-foreground",
  "on-surface": "text-text-on-surface",
  "on-surface-light": "text-zinc-700",
} as const;

export const backgroundColors = {
  canvas: "bg-canvas",
  "canvas-light": "bg-canvas-light",
  surface: "bg-surface",
  "surface-secondary": "bg-surface-secondary",
} as const;

export const borderColors = {
  subtle: "border-border-subtle",
  "subtle-hover": "border-border-subtle-hover",
} as const;

export const statusColors = {
  wishlist: {
    bg: "bg-status-wishlist",
    text: "text-status-wishlist-foreground",
  },
  applied: {
    bg: "bg-status-applied",
    text: "text-status-applied-foreground",
  },
  interviewing: {
    bg: "bg-status-interviewing",
    text: "text-status-interviewing-foreground",
  },
  offer: {
    bg: "bg-status-offer",
    text: "text-status-offer-foreground",
  },
} as const;

export const stateColors = {
  error: {
    bg: "bg-state-error",
    text: "text-state-error-foreground",
    border: "border-state-error",
  },
  warning: {
    bg: "bg-state-warning",
    text: "text-state-warning-foreground",
  },
  success: {
    bg: "bg-status-applied",
    text: "text-status-applied-foreground",
  },
} as const;

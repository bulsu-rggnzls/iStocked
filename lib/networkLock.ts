export const NETWORK_LOCK_OPTIONS = [
  "Openline (Factory Unlocked)",
  "Globe",
  "Smart",
  "DITO",
  "Dual (Globe + Smart)",
] as const;

export type NetworkLock = (typeof NETWORK_LOCK_OPTIONS)[number];

const SHORT_LABELS: Record<string, string> = {
  "Openline (Factory Unlocked)": "Openline",
  "Dual (Globe + Smart)": "Dual (Globe+Smart)",
};

export function networkLockShort(value: string | null | undefined): string | null {
  if (!value) return null;
  return SHORT_LABELS[value] ?? value;
}
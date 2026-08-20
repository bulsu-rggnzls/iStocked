import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ensureDb } from "./db";
import type { Device } from "../types";

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function buildJson(): Promise<string> {
  const db = await ensureDb();
  const devices = await db.getAllAsync<Device>("SELECT * FROM devices");
  return JSON.stringify(
    { app: "iStocked", exportedAt: new Date().toISOString(), devices },
    null,
    2,
  );
}

export async function exportDatabase(): Promise<{ fileName: string }> {
  const json = await buildJson();
  const fileName = `istocked-backup-${stamp()}.json`;

  if (Platform.OS === "web") {
    const win = globalThis as unknown as {
      document?: {
        createElement(tag: "a"): {
          href: string;
          download: string;
          click(): void;
        };
      };
      URL?: { createObjectURL(blob: unknown): string; revokeObjectURL(url: string): void };
      Blob?: new (parts: string[], options?: { type: string }) => unknown;
    };
    const blob = new win.Blob!([json], { type: "application/json" });
    const url = win.URL!.createObjectURL(blob);
    const link = win.document!.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    win.URL!.revokeObjectURL(url);
    return { fileName };
  }

  const file = new File(Paths.cache, fileName);
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Export database",
    });
  }
  return { fileName };
}
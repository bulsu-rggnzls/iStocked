import { ensureDb } from "./db";
import type { SQLiteBindValue } from "expo-sqlite";
import { supabase } from "./supabase";
import type { Device } from "../types";

export interface SyncResult {
  pushed: number;
  pulled: number;
  skipped: boolean;
}

type RemoteDevice = Omit<Device, "updated_at"> & {
  user_id: string;
  updated_at: string;
};

// Two-way last-write-wins sync keyed on id + updated_at.
// Local SQLite stays the working copy; Supabase is the durable per-user copy.
export async function syncAll(): Promise<SyncResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { pushed: 0, pulled: 0, skipped: true };

  const db = await ensureDb();
  const local = await db.getAllAsync<Device>("SELECT * FROM devices");
  const { data: remote, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", session.user.id);
  if (error) throw new Error(error.message);

  const stampOf = (v: string | null | undefined) =>
    new Date(v ?? 0).getTime();
  const remoteMap = new Map((remote ?? []).map((r) => [r.id, r]));

  // 1) Local → Cloud: rows that are new or locally newer
  const toPush = local.filter((l) => {
    const r = remoteMap.get(l.id);
    return !r || stampOf(l.updated_at) > stampOf(r.updated_at);
  });
  let pushed = 0;
  if (toPush.length > 0) {
    const rows = toPush.map((d) => ({
      ...d,
      updated_at: d.updated_at ?? new Date().toISOString(),
      user_id: session.user.id,
    }));
    const { error: upsertError } = await supabase
      .from("devices")
      .upsert(rows, { onConflict: "id" });
    if (upsertError) throw new Error(upsertError.message);
    pushed = rows.length;
  }

  // 2) Cloud → Local: rows that are new or remotely newer
  let pulled = 0;
  for (const r of (remote ?? []) as RemoteDevice[]) {
    const l = local.find((x) => x.id === r.id);
    if (l && stampOf(l.updated_at) >= stampOf(r.updated_at)) continue;

    const { user_id: _userId, updated_at, ...row } = r;
    const cols = Object.keys(row);
    const values = cols.map((c) => (row as Record<string, unknown>)[c]) as SQLiteBindValue[];
    await db.runAsync(
      `INSERT OR REPLACE INTO devices (${cols.join(", ")}, updated_at) VALUES (${cols
        .map(() => "?")
        .join(", ")}, ?)`,
      [...values, updated_at],
    );
    pulled += 1;
  }

  return { pushed, pulled, skipped: false };
}

// Fire-and-forget push of a single device after a local mutation
export async function pushDevice(device: Device): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.from("devices").upsert(
    {
      ...device,
      updated_at: device.updated_at ?? new Date().toISOString(),
      user_id: session.user.id,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteRemoteDevice(id: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

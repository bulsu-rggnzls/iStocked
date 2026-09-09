import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeviceByImei } from "../../hooks/useInventory";
import { lookupDeviceByImei } from "../../lib/inventory";
import { lookupByTac, IPHONE_MODELS, type TacResult } from "../../lib/tacLookup";
import { lookupByPartNumber, type PartNumberResult } from "../../lib/partNumberLookup";
import { BottomSheet } from "../../components/BottomSheet";
import { ScanResultCard } from "../../components/ScanResultCard";
import { AddDeviceSheet } from "../../components/AddDeviceSheet";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";
import { formatImei, isValidImei } from "../../lib/format";

const BARCODE_TYPES: BarcodeType[] = ["code128", "ean13", "ean8", "upc_a", "itf14", "qr"];

type ScannerMode = "box" | "device";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);

  // Mode
  const [mode, setMode] = useState<ScannerMode>("device");

  // Box scan state
  const [boxImei, setBoxImei] = useState<string | null>(null);
  const [boxSerial, setBoxSerial] = useState<string | null>(null);
  const [boxTac, setBoxTac] = useState<TacResult | null>(null);
  const [boxModel, setBoxModel] = useState<string | null>(null);
  const [boxPnResult, setBoxPnResult] = useState<PartNumberResult | null>(null);
  const [boxStorage, setBoxStorage] = useState<string | null>(null);
  const [boxColor, setBoxColor] = useState<string | null>(null);

  // Device scan state
  const [deviceImei, setDeviceImei] = useState<string | null>(null);
  const [tacResult, setTacResult] = useState<TacResult | null>(null);
  const [deviceModel, setDeviceModel] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Inventory lookup for device mode
  const { data: existingDevice, isFetching: isLookingUp } = useDeviceByImei(
    mode === "device" ? deviceImei : null,
  );

  // Manual entry
  const [manualOpen, setManualOpen] = useState(false);
  const [manualImei, setManualImei] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Add device sheet
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [addPrefilledImei, setAddPrefilledImei] = useState<string | null>(null);
  const [addPrefilledModel, setAddPrefilledModel] = useState<string | null>(null);
  const [addPrefilledStorage, setAddPrefilledStorage] = useState<string | null>(null);
  const [addPrefilledColor, setAddPrefilledColor] = useState<string | null>(null);
  const [addPrefilledSerial, setAddPrefilledSerial] = useState<string | null>(null);

  // ─── Box scan handler ────────────────────────────────────────────────────────
  const handleBoxScan = (result: BarcodeScanningResult) => {
    if (boxImei && boxSerial && boxPnResult) return;

    const raw = result.data.trim();

    // 15-digit Luhn-valid number → IMEI (checksum rejects misreads)
    const digits = raw.replace(/\D/g, "");
    if (!boxImei && isValidImei(digits)) {
      setBoxImei(digits);
      const tac = lookupByTac(digits);
      setBoxTac(tac);
      setBoxModel(tac?.model ?? null);
      setBoxStorage(tac?.storageOptions[0] ?? null);
      setBoxColor(tac?.colorOptions[0] ?? null);
      return;
    }

    // 10-12 alphanumeric with at least one letter → Serial number
    if (!boxSerial && /^[A-Z0-9]{10,12}$/i.test(raw) && /[A-Z]/i.test(raw)) {
      setBoxSerial(raw.toUpperCase());
      return;
    }

    // 5+ char part number (Apple PN, e.g. MQ8D3LL/A) → exact variant
    if (!boxPnResult && (raw.includes("/") || /^[A-Z0-9]{5,9}$/i.test(raw))) {
      const pn = lookupByPartNumber(raw);
      if (pn) {
        setBoxPnResult(pn);
        return;
      }
    }
  };

  // ─── Device screen scan handler ──────────────────────────────────────────────
  const handleDeviceScan = (result: BarcodeScanningResult) => {
    if (deviceImei) return;

    const digits = result.data.replace(/\D/g, "");
    if (!isValidImei(digits)) return;

    setDeviceImei(digits);
    const tac = lookupByTac(digits);
    setTacResult(tac);
    setDeviceModel(tac?.model ?? null);
    setSelectedStorage(tac?.storageOptions[0] ?? null);
    setSelectedColor(tac?.colorOptions[0] ?? null);
  };

  // ─── Combined barcode handler ────────────────────────────────────────────────
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (mode === "box") handleBoxScan(result);
    else handleDeviceScan(result);
  };

  // ─── Reset helpers ──────────────────────────────────────────────────────────
  const resetBox = () => {
    setBoxImei(null);
    setBoxSerial(null);
    setBoxTac(null);
    setBoxModel(null);
    setBoxPnResult(null);
    setBoxStorage(null);
    setBoxColor(null);
  };

  const resetDevice = () => {
    setDeviceImei(null);
    setTacResult(null);
    setDeviceModel(null);
    setSelectedStorage(null);
    setSelectedColor(null);
  };

  const resetCurrentMode = () => {
    if (mode === "box") resetBox();
    else resetDevice();
  };

  // ─── Manual lookup ──────────────────────────────────────────────────────────
  const handleManualLookup = async () => {
    const digits = manualImei.replace(/\D/g, "");
    if (digits.length !== 15) {
      setManualError("Enter a valid 15-digit IMEI.");
      return;
    }
    setManualError(null);
    setManualLoading(true);
    try {
      await lookupDeviceByImei(digits);
      setManualOpen(false);
      const tac = lookupByTac(digits);
      if (mode === "device") {
        setDeviceImei(digits);
        setTacResult(tac);
        setDeviceModel(tac?.model ?? null);
        setSelectedStorage(tac?.storageOptions[0] ?? null);
        setSelectedColor(tac?.colorOptions[0] ?? null);
      } else {
        setBoxImei(digits);
        setBoxTac(tac);
        setBoxModel(tac?.model ?? null);
        setBoxStorage(tac?.storageOptions[0] ?? null);
        setBoxColor(tac?.colorOptions[0] ?? null);
      }
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setManualLoading(false);
    }
  };

  // ─── Actions from scan result ────────────────────────────────────────────────
  const viewItem = (id: string) => {
    resetCurrentMode();
    router.push({ pathname: "/inventory/[id]", params: { id } });
  };

  const addToSale = (id: string) => {
    resetCurrentMode();
    router.push({ pathname: "/checkout", params: { deviceId: id } });
  };

  const openAddFromBox = () => {
    if (!boxImei) return;
    setAddPrefilledImei(boxImei);
    setAddPrefilledModel(boxPnResult?.model ?? boxTac?.model ?? boxModel ?? null);
    setAddPrefilledStorage(boxPnResult?.storage ?? boxStorage ?? null);
    setAddPrefilledColor(boxPnResult?.color ?? boxColor ?? null);
    setAddPrefilledSerial(boxSerial);
    resetBox();
    setAddSheetVisible(true);
  };

  const openAddFromDevice = () => {
    if (!deviceImei || !tacResult) return;
    setAddPrefilledImei(deviceImei);
    setAddPrefilledModel(tacResult.model);
    setAddPrefilledStorage(selectedStorage);
    setAddPrefilledColor(selectedColor);
    resetDevice();
    setAddSheetVisible(true);
  };

  const openAddWithImeiOnly = () => {
    const imei = mode === "device" ? deviceImei : boxImei;
    if (!imei) return;
    const model = mode === "device" ? deviceModel : boxModel;
    const tac = lookupByTac(imei);
    setAddPrefilledImei(imei);
    setAddPrefilledModel(tac?.model ?? model ?? null);
    setAddPrefilledStorage(null);
    setAddPrefilledColor(null);
    resetCurrentMode();
    setAddSheetVisible(true);
  };

  const prefillSearch = () => {
    const imei = mode === "device" ? deviceImei : boxImei;
    resetCurrentMode();
    if (imei) router.push({ pathname: "/inventory", params: { search: imei } });
  };

  // ─── Sheet visibility ────────────────────────────────────────────────────────
  const boxSheetOpen = mode === "box" && boxImei !== null;
  const deviceSheetOpen = mode === "device" && deviceImei !== null;

  // ─── Permission gates ────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-8">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-8">
        <Ionicons name="scan-outline" size={44} color="#ffffff" />
        <Text className="mt-4 text-center text-xl font-bold text-white">
          Camera access needed
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-white/70">
          iStocked scans IMEI barcodes to check stock instantly.
        </Text>
        <View className="mt-6 w-full">
          <Button title="Grant camera access" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Camera */}
      {isFocused && !mountError ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          onBarcodeScanned={handleBarcodeScanned}
          onMountError={(e) => setMountError(e.message)}
        />
      ) : null}

      {/* Mount error overlay */}
      {mountError ? (
        <View className="absolute inset-0 items-center justify-center bg-zinc-950 px-8">
          <Ionicons name="warning-outline" size={44} color="#ffffff" />
          <Text className="mt-4 text-center text-xl font-bold text-white">
            Camera failed to start
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-white/70">
            {mountError}
          </Text>
          <View className="mt-6 w-full">
            <Button title="Try again" onPress={() => { setMountError(null); setTorch(false); }} />
          </View>
        </View>
      ) : null}

      {/* ─── Top bar: mode toggle + torch ─────────────────────────────────── */}
      <View
        className="absolute inset-x-0 flex-row items-center justify-between px-5"
        style={{ top: insets.top + 8 }}
      >
        <View className="flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            Scanner
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={() => { setMode("box"); resetCurrentMode(); }}
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: mode === "box" ? "#ffffff" : "rgba(255,255,255,0.15)" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: mode === "box" ? "#09090b" : "#ffffff" }}
              >
                Scan Box
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode("device"); resetCurrentMode(); }}
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: mode === "device" ? "#ffffff" : "rgba(255,255,255,0.15)" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: mode === "device" ? "#09090b" : "#ffffff" }}
              >
                Scan Device (*#06#)
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={() => setTorch((t) => !t)}
          className="ml-3 h-11 w-11 items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: torch ? "#ffffff" : "rgba(255,255,255,0.15)" }}
        >
          <Ionicons
            name={torch ? "flashlight" : "flashlight-outline"}
            size={22}
            color={torch ? "#09090b" : "#ffffff"}
          />
        </Pressable>
      </View>

      {/* ─── Scan frame overlay ───────────────────────────────────────────── */}
      <View className="absolute inset-0 items-center justify-center">
        <View
          className="border-white"
          style={{
            width: "86%",
            height: 180,
            borderWidth: 2,
            borderRadius: 20,
            borderColor: "rgba(255,255,255,0.95)",
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        >
          <View className="absolute left-0 top-0 h-10 w-10 rounded-tl-3xl border-l-4 border-t-4 border-white" />
          <View className="absolute right-0 top-0 h-10 w-10 rounded-tr-3xl border-r-4 border-t-4 border-white" />
          <View className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-3xl border-b-4 border-l-4 border-white" />
          <View className="absolute bottom-0 right-0 h-10 w-10 rounded-br-3xl border-b-4 border-r-4 border-white" />
          <View className="absolute inset-x-6 top-1/2 -translate-y-px h-0.5 bg-emerald-400/60" />
        </View>
        <Text className="mt-4 text-center text-xs font-medium text-white/60">
          Fill the frame with the barcode
        </Text>
      </View>

      {/* ─── Bottom bar: scan feedback + manual button (clears the tab bar) ── */}
      <View
        className="absolute inset-x-0 px-5"
        style={{ bottom: insets.bottom + 80 }}
      >
        {mode === "box" ? (
          <View className="items-center">
            <View className="gap-1.5">
              {boxImei ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color="#34d399" />
                  <Text className="text-sm text-white/85">
                    IMEI: {formatImei(boxImei)}
                    {boxTac ? ` · ${boxTac.model}` : ""}
                  </Text>
                </View>
              ) : (
                <Text className="text-center text-sm text-white/85">
                  Scan the IMEI barcode on the box
                </Text>
              )}
              {boxSerial ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color="#34d399" />
                  <Text className="text-sm text-white/85">Serial: {boxSerial}</Text>
                </View>
              ) : null}
              {boxImei && !boxPnResult ? (
                <Text className="text-center text-sm text-white/60">
                  Now scan the Part No. barcode for exact storage &amp; color
                </Text>
              ) : null}
              {boxPnResult ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color="#34d399" />
                  <Text className="text-sm text-white/85">
                    {boxPnResult.model} {boxPnResult.storage} · {boxPnResult.color}
                  </Text>
                </View>
              ) : null}

              {!boxPnResult && boxTac ? (
                <View className="flex-row items-center justify-center gap-1.5">
                  <Ionicons name="scan-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text className="text-center text-sm text-white/60">
                    Scan the Part No. barcode to auto-fill exact storage &amp; color
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="mt-4 w-full">
              <Button title="Enter IMEI manually" variant="secondary" onPress={() => setManualOpen(true)} />
            </View>
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-center text-sm text-white/85">
              Point at the IMEI on the phone&apos;s *#06# screen
            </Text>
            <View className="mt-4 w-full">
              <Button title="Enter IMEI manually" variant="secondary" onPress={() => setManualOpen(true)} />
            </View>
          </View>
        )}
      </View>

      {/* ─── Manual IMEI entry sheet ──────────────────────────────────────── */}
      <BottomSheet visible={manualOpen} onClose={() => setManualOpen(false)} title="Enter IMEI">
        <View className="gap-4 pb-8 px-4 pt-3">
          <TextInput
            value={manualImei}
            onChangeText={(t) => setManualImei(t.replace(/\D/g, ""))}
            placeholder="15-digit IMEI"
            placeholderTextColor="#a1a1aa"
            keyboardType="number-pad"
            maxLength={15}
            autoFocus
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-base text-zinc-950"
          />
          {manualError ? <Text className="text-sm text-red-600">{manualError}</Text> : null}
          <Button title="Look up device" onPress={handleManualLookup} loading={manualLoading} />
        </View>
      </BottomSheet>

      {/* ─── Box scan result sheet ────────────────────────────────────────── */}
      <BottomSheet
        visible={boxSheetOpen}
        onClose={resetBox}
        title="Box scanned"
      >
        <View className="px-4 pb-8 pt-3 gap-4">
          {/* Identified variant: PN exact match wins, else TAC, else user picks */}
          <View className="rounded-xl bg-zinc-100 px-4 py-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">Model</Text>
              <Text className="text-sm font-semibold text-zinc-950">
                {boxPnResult?.model ?? boxTac?.model ?? boxModel ?? "Pick below"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">IMEI</Text>
              <Text className="font-mono text-sm text-zinc-600">{formatImei(boxImei ?? "")}</Text>
            </View>
            {boxSerial ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">Serial</Text>
                <Text className="font-mono text-sm text-zinc-600">{boxSerial}</Text>
              </View>
            ) : null}
          </View>

          {!boxPnResult && boxTac ? (
            <View className="gap-3">
              <View>
                <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Storage</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {boxTac.storageOptions.map((opt) => (
                    <Tag
                      key={opt}
                      label={opt}
                      selected={boxStorage === opt}
                      onPress={() => setBoxStorage(opt)}
                    />
                  ))}
                </View>
              </View>
              <View>
                <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Color</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {boxTac.colorOptions.map((opt) => (
                    <Tag
                      key={opt}
                      label={opt}
                      selected={boxColor === opt}
                      onPress={() => setBoxColor(opt)}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {!boxPnResult && !boxTac ? (
            <View>
              <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Pick your model
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {IPHONE_MODELS.map((opt) => (
                  <Tag
                    key={opt}
                    label={opt}
                    selected={boxModel === opt}
                    onPress={() => setBoxModel(opt)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Button title="Add to inventory" onPress={openAddFromBox} />
          {!boxPnResult ? (
            <View className="flex-row items-center justify-center gap-1.5">
              <Ionicons name="scan-outline" size={14} color="#a1a1aa" />
              <Text className="text-center text-[11px] text-zinc-400">
                Point at the Part No. barcode (e.g. MYWX3) — this sheet fills in automatically
              </Text>
            </View>
          ) : (
            <Text className="text-center text-[11px] text-zinc-400">
              Tip: scan the serial number barcode for a complete record
            </Text>
          )}
        </View>
      </BottomSheet>

      {/* ─── Device scan result sheet ─────────────────────────────────────── */}
      <BottomSheet
        visible={deviceSheetOpen}
        onClose={resetDevice}
        title={existingDevice ? "Device found" : tacResult ? "Device identified" : "IMEI scanned"}
      >
        <View className="px-4 pb-8 pt-3">
          {isLookingUp ? (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#09090b" />
              <Text className="mt-3 text-sm text-zinc-500">Looking up device…</Text>
            </View>
          ) : existingDevice ? (
            <>
              <ScanResultCard device={existingDevice} />
              <View className="mt-5 flex-row gap-3">
                <View className="flex-1">
                  <Button title="View item" variant="secondary" onPress={() => viewItem(existingDevice.id)} />
                </View>
                <View className="flex-1">
                  <Button title="Add to sale" onPress={() => addToSale(existingDevice.id)} />
                </View>
              </View>
            </>
          ) : (
            <View className="gap-4">
              {/* Model identification */}
              {tacResult ? (
                <View className="rounded-xl bg-zinc-100 px-4 py-3 gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">Model</Text>
                    <Text className="text-sm font-semibold text-zinc-950">{tacResult.model}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">IMEI</Text>
                    <Text className="font-mono text-sm text-zinc-600">{formatImei(deviceImei ?? "")}</Text>
                  </View>

                  {/* Storage chips */}
                  <View>
                    <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Storage</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {tacResult.storageOptions.map((opt) => (
                        <Tag
                          key={opt}
                          label={opt}
                          selected={selectedStorage === opt}
                          onPress={() => setSelectedStorage(opt)}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Color chips */}
                  <View>
                    <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Color</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {tacResult.colorOptions.map((opt) => (
                        <Tag
                          key={opt}
                          label={opt}
                          selected={selectedColor === opt}
                          onPress={() => setSelectedColor(opt)}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                <View className="gap-3">
                  <View className="rounded-xl bg-zinc-100 px-4 py-3">
                    <Text className="text-sm text-zinc-500">
                      IMEI{" "}
                      <Text className="font-mono text-zinc-950">{formatImei(deviceImei ?? "")}</Text>{" "}
                      isn&apos;t in our model database yet — pick your model:
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    {IPHONE_MODELS.map((opt) => (
                      <Tag
                        key={opt}
                        label={opt}
                        selected={deviceModel === opt}
                        onPress={() => setDeviceModel(opt)}
                      />
                    ))}
                  </View>
                </View>
              )}

              <Button
                title="Add to inventory"
                onPress={tacResult ? openAddFromDevice : openAddWithImeiOnly}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button title="Search inventory" variant="secondary" onPress={prefillSearch} />
                </View>
              </View>
            </View>
          )}
        </View>
      </BottomSheet>

      {/* ─── Add Device Sheet ─────────────────────────────────────────────── */}
      <AddDeviceSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        prefilledImei={addPrefilledImei}
        prefilledModel={addPrefilledModel}
        prefilledStorage={addPrefilledStorage}
        prefilledColor={addPrefilledColor}
        prefilledSerial={addPrefilledSerial}
      />
    </View>
  );
}

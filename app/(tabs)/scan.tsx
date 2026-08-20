import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeviceByImei } from "../../hooks/useInventory";
import { lookupDeviceByImei } from "../../lib/inventory";
import { BottomSheet } from "../../components/BottomSheet";
import { ScanResultCard } from "../../components/ScanResultCard";
import { Button } from "../../components/ui/Button";
import { formatImei } from "../../lib/format";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualImei, setManualImei] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const [scannedImei, setScannedImei] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState(false);
  const guardRef = useRef<number | null>(null);

  const { data: device, isFetching: isLookingUp } = useDeviceByImei(scannedImei);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scannedImei) return;
    const digits = result.data.replace(/\D/g, "");
    if (digits.length !== 15) return;
    if (guardRef.current) return;
    guardRef.current = setTimeout(() => {
      guardRef.current = null;
    }, 2000);
    setLookupError(false);
    setScannedImei(digits);
  };

  const handleManualLookup = async () => {
    const digits = manualImei.replace(/\D/g, "");
    if (digits.length !== 15) {
      setManualError("Enter a valid 15-digit IMEI.");
      return;
    }
    setManualError(null);
    setManualLoading(true);
    try {
      const found = await lookupDeviceByImei(digits);
      if (found) {
        setManualOpen(false);
        setLookupError(false);
        setScannedImei(digits);
      } else {
        setLookupError(true);
        setScannedImei(digits);
        setManualOpen(false);
      }
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setManualLoading(false);
    }
  };

  const closeSheet = () => {
    setScannedImei(null);
    setLookupError(false);
  };

  const viewItem = () => {
    const id = device?.id;
    closeSheet();
    if (id) router.push({ pathname: "/inventory/[id]", params: { id } });
  };

  const addToSale = () => {
    const id = device?.id;
    closeSheet();
    if (id) router.push({ pathname: "/checkout", params: { deviceId: id } });
  };

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

  return (
    <View className="flex-1 bg-zinc-950">
      {isFocused ? (
        <CameraView
          className="flex-1"
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ["code128", "ean13", "ean8", "code39", "upc_a", "itf14", "qr"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      ) : null}

      <View
        className="absolute inset-x-0 flex-row items-center justify-between px-5 pt-5"
        style={{ top: insets.top + 8 }}
      >
        <View>
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            Scanner
          </Text>
          <Text className="mt-1 text-2xl font-bold text-white">Scan IMEI</Text>
        </View>
        <Pressable
          onPress={() => setTorch((t) => !t)}
          className={`h-11 w-11 items-center justify-center rounded-full active:opacity-80 ${
            torch ? "bg-white" : "bg-white/15"
          }`}
        >
          <Ionicons
            name={torch ? "flashlight" : "flashlight-outline"}
            size={22}
            color={torch ? "#09090b" : "#ffffff"}
          />
        </Pressable>
      </View>

      <View className="absolute inset-0 items-center justify-center">
        <View className="h-60 w-60">
          <View className="absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-white" />
          <View className="absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-white" />
          <View className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-white" />
          <View className="absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-white" />
        </View>
      </View>

      <View
        className="absolute inset-x-0 px-5"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Text className="text-center text-sm text-white/85">
          Point at the IMEI barcode or QR code
        </Text>
        <View className="mt-4">
          <Button
            title="Enter IMEI manually"
            variant="secondary"
            onPress={() => setManualOpen(true)}
          />
        </View>
      </View>

      <BottomSheet
        visible={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Enter IMEI"
      >
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
        {manualError ? (
          <Text className="mt-2 text-sm text-red-600">{manualError}</Text>
        ) : null}
        <View className="mt-4">
          <Button
            title="Look up device"
            onPress={handleManualLookup}
            loading={manualLoading}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={scannedImei !== null}
        onClose={closeSheet}
        title={device ? "Device found" : lookupError ? "No match" : "Checking"}
      >
        {isLookingUp ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#09090b" />
            <Text className="mt-3 text-sm text-zinc-500">Looking up device…</Text>
          </View>
        ) : device ? (
          <>
            <ScanResultCard device={device} />
            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Button title="View item" variant="secondary" onPress={viewItem} />
              </View>
              <View className="flex-1">
                <Button title="Add to sale" onPress={addToSale} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text className="text-sm leading-6 text-zinc-500">
              No device in your inventory matches{" "}
              <Text className="font-mono text-zinc-950">
                {formatImei(scannedImei ?? "")}
              </Text>
              .
            </Text>
            <View className="mt-5">
              <Button
                title="Try again"
                variant="secondary"
                onPress={() => setManualOpen(true)}
              />
            </View>
          </>
        )}
      </BottomSheet>
    </View>
  );
}
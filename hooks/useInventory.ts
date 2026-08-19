import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDevice,
  fetchDevices,
  fetchDeviceById,
  lookupDeviceByImei,
  updateDevice,
  type DeviceFilters,
} from "../lib/inventory";
import type { Device, NewDeviceInput } from "../types";

export function useDevices(filters: DeviceFilters = {}) {
  return useQuery({
    queryKey: ["devices", filters],
    queryFn: () => fetchDevices(filters),
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => fetchDeviceById(id),
    enabled: !!id,
  });
}

export function useDeviceByImei(imei: string | null) {
  return useQuery({
    queryKey: ["devices", "imei", imei],
    queryFn: () => lookupDeviceByImei(imei ?? ""),
    enabled: !!imei,
  });
}

export function useAddDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewDeviceInput) => addDevice(data),
    onSuccess: (device: Device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.setQueryData(["devices", device.id], device);
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NewDeviceInput> & { status?: Device["status"] };
    }) => updateDevice(id, data),
    onSuccess: (device: Device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.setQueryData(["devices", device.id], device);
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}
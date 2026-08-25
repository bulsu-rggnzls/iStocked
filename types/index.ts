export type DeviceStatus = "in_stock" | "sold";

export type WarrantyPeriod = "none" | "7_day" | "30_day";

export type AccessoryItem = "box" | "charger" | "cable" | "receipt" | "warranty_card";

export const ACCESSORY_OPTIONS: { key: AccessoryItem; label: string }[] = [
  { key: "box", label: "Box" },
  { key: "charger", label: "Original Charger" },
  { key: "cable", label: "Cable" },
  { key: "receipt", label: "Receipt" },
  { key: "warranty_card", label: "Warranty Card" },
];

export interface Device {
  id: string;
  model: string;
  storage: string;
  condition: string;
  imei: string;
  imei2: string | null;
  buy_price: number;
  list_price: number;
  sold_price: number | null;
  status: DeviceStatus;
  date_bought: string;
  date_sold: string | null;
  customer_name: string | null;
  battery_health: number | null;
  color: string | null;
  network_lock: string | null;
  repair_cost: number;
  buyer_contact: string | null;
  warranty_period: WarrantyPeriod | null;
  accessories: string | null;
  notes: string | null;
  created_at: string;
}

export interface NewDeviceInput {
  model: string;
  storage: string;
  condition: string;
  imei: string;
  imei2?: string | null;
  buy_price: number;
  list_price: number;
  battery_health?: number | null;
  color?: string | null;
  network_lock?: string | null;
  repair_cost?: number;
  sold_price?: number;
  date_sold?: string | null;
  customer_name?: string | null;
  buyer_contact?: string | null;
  warranty_period?: WarrantyPeriod | null;
  accessories?: string | null;
  notes?: string | null;
}

export interface RecordSaleInput {
  deviceId: string;
  customerName: string;
  soldPrice: number;
  dateSold?: string;
  buyerContact?: string;
  warrantyPeriod?: WarrantyPeriod;
}
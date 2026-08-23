export type DeviceStatus = "in_stock" | "sold";

export type WarrantyPeriod = "none" | "7_day" | "30_day";

export interface Device {
  id: string;
  model: string;
  storage: string;
  condition: string;
  imei: string;
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
  created_at: string;
}

export interface NewDeviceInput {
  model: string;
  storage: string;
  condition: string;
  imei: string;
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
}

export interface RecordSaleInput {
  deviceId: string;
  customerName: string;
  soldPrice: number;
  dateSold?: string;
  buyerContact?: string;
  warrantyPeriod?: WarrantyPeriod;
}
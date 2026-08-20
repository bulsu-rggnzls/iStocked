export type DeviceStatus = "in_stock" | "sold";

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
}

export interface RecordSaleInput {
  deviceId: string;
  customerName: string;
  soldPrice: number;
  dateSold?: string;
  buyerContact?: string;
}
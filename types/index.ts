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
  created_at: string;
}

export interface NewDeviceInput {
  model: string;
  storage: string;
  condition: string;
  imei: string;
  buy_price: number;
  list_price: number;
}

export interface RecordSaleInput {
  deviceId: string;
  customerName: string;
  soldPrice: number;
  dateSold?: string;
}
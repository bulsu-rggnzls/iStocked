export type DeviceStatus = "in_stock" | "sold" | "reserved";

export interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export interface Device {
  id: string;
  model: string;
  imei: string;
  storage: string;
  condition: string;
  cost_price: number;
  selling_price: number;
  status: DeviceStatus;
  created_at: string;
  created_by: string | null;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  device_id: string;
  customer_id: string | null;
  final_price: number;
  payment_method: string;
  sold_by: string | null;
  sold_at: string;
  device?: Device | null;
  customer?: Customer | null;
}

export interface NewDeviceInput {
  model: string;
  imei: string;
  storage: string;
  condition: string;
  cost_price: number;
  selling_price: number;
  status?: DeviceStatus;
  created_by?: string | null;
}

export interface NewCustomerInput {
  full_name: string;
  phone?: string | null;
  email?: string | null;
}

export interface NewSaleInput {
  device_id: string;
  customer_id?: string | null;
  final_price: number;
  payment_method?: string;
  sold_by?: string | null;
}
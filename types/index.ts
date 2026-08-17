export type DeviceStatus = "Available" | "Sold" | "Pending";

export interface InventoryItem {
  id: string;
  imei: string;
  serial?: string | null;
  model: string;
  color: string;
  storage: string;
  purchase_cost: number;
  asking_price: number;
  battery_health?: number | null;
  condition?: string | null;
  status: DeviceStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Sale {
  id: string;
  inventory_id: string;
  sold_price: number;
  sold_at: string;
  profit: number;
  buyer_name?: string | null;
  buyer_contact?: string | null;
  notes?: string | null;
  created_at: string;
  inventory?: InventoryItem;
}

export interface NewDeviceInput {
  imei: string;
  serial?: string;
  model: string;
  color: string;
  storage: string;
  purchaseCost: number;
  askingPrice: number;
  batteryHealth?: number;
  condition?: string;
  notes?: string;
}

export interface NewSaleInput {
  inventoryId: string;
  soldPrice: number;
  profit: number;
  buyerName?: string;
  buyerContact?: string;
  notes?: string;
}
export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  tokenId: string;
  tableNumber: string;
  items: OrderItem[];
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export interface OrderToken {
  id: string;
  tableNumber: string;
  status: "active" | "fulfilled";
  paymentMethod?: "cash" | "card" | "mobile";
  amountPaid?: number;
  createdAt: number;
  updatedAt: number;
  fulfilledAt?: number;
  syncedAt?: number;
  chefName?: string;
  chefStatus?: "starting" | "cooking" | "completed";
}

export interface CreateOrderInput {
  tableNumber: string;
  items: { itemId: string; name: string; price: number; quantity: number; note?: string }[];
}

export interface FulfillTokenInput {
  tokenId: string;
  paymentMethod: "cash" | "card" | "mobile";
  amountPaid: number;
}

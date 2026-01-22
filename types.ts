
export enum PaymentMethod {
  CREDIT = 'Crédito',
  DEBIT = 'Débito',
  CASH = 'Dinheiro',
  PIX = 'Pix'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  description?: string; // Novo: Descrição opcional
  isAvailable?: boolean; // Novo: Controle de disponibilidade
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  password: string;
  role: 'admin' | 'staff' | 'kitchen' | 'display';
}

export interface Transaction {
  id: string;
  orderNumber: string;
  customerName?: string; // Novo: Nome do cliente para chamar
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod | 'Aguardando'; // 'Aguardando' para pedidos online
  amountPaid?: number;
  change?: number;
  sellerName?: string;
  status: 'completed' | 'cancelled' | 'pending_payment'; // Novo status
  kitchenStatus: 'pending' | 'done';
}

export interface DailySummary {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  methodBreakdown: Record<string, number>;
}
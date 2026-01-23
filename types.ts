
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
  description?: string;
  isAvailable?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  password: string;
  role: 'admin' | 'manager' | 'staff' | 'kitchen' | 'display';
}

export interface Transaction {
  id: string;
  orderNumber: string;
  customerName?: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod | 'Aguardando';
  amountPaid?: number;
  change?: number;
  sellerName?: string;
  status: 'completed' | 'cancelled' | 'pending_payment';
  kitchenStatus: 'pending' | 'done';
}

export interface DailySummary {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  methodBreakdown: Record<string, number>;
}

export interface AppModules {
  pos: boolean;      // Vendas / Caixa
  kitchen: boolean;  // Cozinha
  products: boolean; // Cardápio
  reports: boolean;  // Relatórios
  users: boolean;    // Equipe
  customer: boolean; // Autoatendimento (Cliente)
}

export interface AppSettings {
  appName: string;
  schoolClass: string;
  mascotUrl: string;
  schoolLogoUrl: string;
  emptyCartImageUrl: string;
  primaryColor: string;
  buttonSize: 'small' | 'medium' | 'large' | 'xl';
  modules: AppModules;
  // Novos campos de personalização avançada
  customerHeroUrl?: string; // Imagem grande do autoatendimento
  customerWelcomeTitle?: string; // Título "O que você quer comer?"
  marqueeText?: string; // Texto rodapé do telão
}

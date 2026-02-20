
export enum PaymentMethod {
  CREDIT = 'Crédito',
  DEBIT = 'Débito',
  CASH = 'Dinheiro',
  PIX = 'Pix'
}

export interface ComboItem {
  productId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  description?: string;
  isAvailable?: boolean;
  // Novos campos
  stock?: number;
  barcode?: string;
  // Campo para Combos
  comboItems?: ComboItem[]; // Se existir e tiver itens, é um combo
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
  permissions?: Partial<AppModules>; // Permissões específicas por módulo
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

// Nova Interface para Despesas (Retiradas/Compras)
export interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: number;
  registeredBy: string;
  category: 'compra' | 'retirada' | 'pagamento' | 'outros';
  receiptUrl?: string; // Novo campo para Nota Fiscal
}

// NOVA INTERFACE: CONTRIBUIÇÃO DE ALUNOS
export interface Contribution {
  id: string;
  studentName: string;
  amount: number;
  monthReference: string; // Ex: Janeiro, Fevereiro
  paymentDate: number; // Timestamp
  registeredBy: string;
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
  financial: boolean; // Financeiro e Estoque (NOVO)
  contributions?: boolean; // Contribuições Escolares (NOVO)
  settings?: boolean; // Ajustes (NOVO)
}

// --- NOVO SISTEMA DE CMS (BLOCO) ---
export type BlockType = 'hero' | 'text' | 'products' | 'marquee' | 'image' | 'spacer';

export interface LayoutBlock {
  id: string;
  type: BlockType;
  title?: string; // Usado para Hero e Text
  content?: string; // Usado para Text e Marquee
  imageUrl?: string; // Usado para Hero e Image
  style?: {
    backgroundColor?: string;
    textColor?: string;
    height?: string; // 'small', 'medium', 'large'
    fontSize?: string;
    alignment?: 'left' | 'center' | 'right';
    padding?: string;
  };
}

// NOVA INTERFACE: GALERIA DE FOTOS
export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  timestamp: number;
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
  // Layout Builder (Novo)
  customerLayout?: LayoutBlock[]; // Array de blocos que define a home do cliente
  
  // Galeria da Turma (Novo)
  galleryImages?: GalleryImage[];

  // Mantemos compatibilidade com campos antigos, mas o customerLayout terá prioridade
  customerHeroUrl?: string; 
  customerWelcomeTitle?: string; 
  marqueeText?: string; 
}
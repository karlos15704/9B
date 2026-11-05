import { Product, User, AppModules } from '../types';

export const MODULE_LABELS: Record<keyof AppModules, string> = {
  pos: 'Caixa / Vendas',
  kitchen: 'Cozinha / Pedidos',
  products: 'Cardápio / Produtos',
  reports: 'Relatórios',
  users: 'Gerenciar Equipe',
  customer: 'Autoatendimento',
  financial: 'Financeiro',
  contributions: 'Contribuições',
  settings: 'Ajustes do Sistema'
};

export const DEFAULT_ROLE_PERMISSIONS: Record<User['role'], Partial<AppModules>> = {
  admin: { pos: true, kitchen: true, products: true, reports: true, users: true, customer: true, financial: true, contributions: true, settings: true },
  manager: { pos: true, kitchen: true, products: true, reports: true, users: true, customer: true, financial: true, contributions: true, settings: false },
  staff: { pos: true, kitchen: false, products: false, reports: false, users: false, customer: false, financial: false, contributions: false, settings: false },
  kitchen: { pos: false, kitchen: true, products: false, reports: false, users: false, customer: false, financial: false, contributions: false, settings: false },
  display: { pos: false, kitchen: false, products: false, reports: false, users: false, customer: true, financial: false, contributions: false, settings: false }
};

// =================================================================================
// 👥 ÁREA DE LOGIN (USUÁRIOS E SENHAS)
// =================================================================================
export const STAFF_USERS: User[] = [
  // SUPER ADMIN
  { id: '0', name: 'Professor',         password: '0', role: 'admin' },
  // GERENTE (Novo papel)
  { id: '1', name: 'Gerente',           password: '0', role: 'manager' },
  // STAFF
  { id: '2', name: 'João (Caixa)',      password: '0', role: 'staff' },
  { id: '3', name: 'Maria (Caixa)',     password: '0', role: 'staff' },
  // COZINHA
  { id: '99', name: 'Cozinha',          password: '0', role: 'kitchen' },
  // DISPLAY PÚBLICO (TELÃO)
  { id: '100', name: 'Telão (Público)', password: '0', role: 'display' },
];

// =================================================================================
// 🏫 DADOS DA ESCOLA (FEIRA CULTURAL)
// =================================================================================
export const SCHOOL_LOGO_URL = "https://colegioprogressosantista.com.br/wp-content/uploads/2025/11/logo-branca-amarela-1024x1022.webp";
export const SCHOOL_CLASS = "9ºB";

// =================================================================================
// 🍗 PRODUTOS (Imagens Corrigidas - Links Diretos)
// =================================================================================
export const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Combo Tô Frito (Clássico + Refri)', 
    price: 30.00, 
    category: 'Combos', 
    imageUrl: '/images/combo-classico.png',
    comboItems: [
        { productId: '2', quantity: 1 },
        { productId: '4', quantity: 1 }
    ]
  },
  { 
    id: '2', 
    name: "Tô Frito Clássico (150g + Molho)", 
    price: 15.00, 
    category: 'Porções', 
    // Imagem: Balde Grande
    imageUrl: '/images/frito-classico.png' 
  },
  { 
    id: '3', 
    name: "Tô Frito Junior (100g)", 
    price: 10.00, 
    category: 'Porções', 
    // Imagem: Balde Menor
    imageUrl: '/images/frito-junior.png' 
  },
  { 
    id: '4', 
    name: 'REFRIGERANTE', 
    price: 7.00, 
    category: 'Bebidas', 
    imageUrl: '/images/refrigerante.png' 
  },
  { 
    id: '5', 
    name: 'Água Mineral 500ml', 
    price: 4.00, 
    category: 'Bebidas', 
    imageUrl: '/images/agua.png' 
  },
  { 
    id: 'batata', 
    name: 'Batata Frita (150g)', 
    price: 10.00, 
    category: 'Porções', 
    imageUrl: '/images/batata.png',
    stock: 100
  },
  { 
    id: 'soda-coca', 
    name: 'Coca-Cola Lata 350ml', 
    price: 7.00, 
    category: 'Bebidas', 
    imageUrl: '/images/refrigerante.png',
    isAvailable: true,
    stock: 100
  },
  { 
    id: 'soda-soda', 
    name: 'Soda Lata 350ml', 
    price: 7.00, 
    category: 'Bebidas', 
    imageUrl: '/images/refrigerante.png',
    isAvailable: true,
    stock: 100
  },
  { 
    id: 'soda-fanta', 
    name: 'Fanta Laranja Lata 350ml', 
    price: 7.00, 
    category: 'Bebidas', 
    imageUrl: '/images/refrigerante.png',
    isAvailable: true,
    stock: 100
  },
  { 
    id: 'soda-guarana', 
    name: 'Guaraná Antarctica Lata 350ml', 
    price: 7.00, 
    category: 'Bebidas', 
    imageUrl: '/images/refrigerante.png',
    isAvailable: true,
    stock: 100
  },
];

export const APP_NAME = "TÔ FRITO!";

export const MASCOT_URL = "https://cdn-icons-png.flaticon.com/512/3075/3075977.png";

// Imagens Oficiais Rápidas para o Cardápio (Garantidas e Locais)
export const PRESET_PRODUCT_IMAGES = [
  { label: 'Frango 150g (Clássico)', url: '/images/frito-classico.png' },
  { label: 'Frango 100g (Junior)', url: '/images/frito-junior.png' },
  { label: 'Batata Frita (150g)', url: '/images/batata.png' },
  { label: 'Combo Tô Frito (Clássico)', url: '/images/combo-classico.png' },
  { label: 'Combo Batata + Refri', url: '/images/combo-batata-refri.png' },
  { label: 'Refrigerante Lata', url: '/images/refrigerante.png' },
  { label: 'Água Mineral', url: '/images/agua.png' },
];
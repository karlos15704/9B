import { Product, User } from './types';

// =================================================================================
// 👥 ÁREA DE LOGIN (USUÁRIOS E SENHAS)
// =================================================================================
export const STAFF_USERS: User[] = [
  // SUPER ADMIN
  { id: '0', name: 'Professor',         password: '0', role: 'admin' },
  // ADMIN
  { id: '1', name: 'Gerente',           password: '0', role: 'admin' },
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
    price: 18.00, 
    category: 'Combos', 
    // Imagem: Combo (Balde + Lata)
    imageUrl: 'https://i.ibb.co/GQYZ9hqb/Combo-T-Frito-Cl-ssico-Refri.png' 
  },
  { 
    id: '2', 
    name: "Tô Frito Clássico (150g + Molho)", 
    price: 15.00, 
    category: 'Porções', 
    // Imagem: Balde Grande
    imageUrl: 'https://i.ibb.co/ksvNmYDD/T-Frito-Cl-ssico-150g-Molho.png' 
  },
  { 
    id: '3', 
    name: "Tô Frito Junior (100g)", 
    price: 10.00, 
    category: 'Porções', 
    // Imagem: Balde Menor
    imageUrl: 'https://i.ibb.co/cSdmLLMh/T-Frito-Junior-100g.png' 
  },
  { 
    id: '4', 
    name: 'Refrigerante Lata 350ml', 
    price: 5.00, 
    category: 'Bebidas', 
    // Imagem: Lata de Refri
    imageUrl: 'https://i.ibb.co/HmnMHw3/Refrigerante-Lata-350ml.png' 
  },
  { 
    id: '5', 
    name: 'Água Mineral 500ml', 
    price: 3.00, 
    category: 'Bebidas', 
    // Imagem: Garrafa de Água
    imageUrl: 'https://i.ibb.co/Kj9NWxhS/agua.png' 
  },
];

export const APP_NAME = "TÔ FRITO!";

// Mascote (Logo) Atualizado
export const MASCOT_URL = "https://i.ibb.co/W7csYss/mascote.png";
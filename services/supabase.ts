import { createClient } from '@supabase/supabase-js';
import { Transaction, User, Product } from '../types';

/* 
  ==============================================================================
  🚨 CÓDIGO SQL PARA O SUPABASE (SQL EDITOR) 🚨
  ==============================================================================
  
  Copie o código abaixo, cole no "SQL Editor" do Supabase e clique em "RUN".
  Isso vai criar/resetar as tabelas corretamente e adicionar índices para relatórios rápidos.

  -- 1. Limpeza (Remove tabelas antigas para evitar conflitos)
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS products;

  -- 2. Tabela de Vendas (Pedidos)
  CREATE TABLE transactions (
    id text primary key,
    "orderNumber" text,
    "customerName" text,  -- Nome do cliente
    timestamp bigint,
    items jsonb,          -- Itens do carrinho (JSON)
    subtotal numeric,
    discount numeric,
    total numeric,
    "paymentMethod" text,
    "amountPaid" numeric,
    change numeric,
    "sellerName" text,
    status text,          -- 'pending_payment', 'completed', 'cancelled'
    "kitchenStatus" text  -- 'pending', 'done'
  );

  -- 2.1 Índice para relatórios de data (Melhora performance dos filtros de Dia/Mês/Ano)
  CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

  -- 3. Tabela de Usuários (Staff)
  CREATE TABLE users (
    id text primary key,
    name text,
    password text,
    role text
  );

  -- 4. Tabela de Produtos (Cardápio)
  CREATE TABLE products (
    id text primary key,
    name text,
    price numeric,
    category text,
    "imageUrl" text,
    description text,
    "isAvailable" boolean
  );

  -- 5. Segurança (Permite leitura/escrita pública para o app funcionar sem login complexo)
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Acesso Total Vendas" ON transactions FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Acesso Total Usuarios" ON users FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Acesso Total Produtos" ON products FOR ALL USING (true) WITH CHECK (true);
  
  -- 6. Habilita Realtime (Para atualizações instantâneas)
  alter publication supabase_realtime add table transactions;
  alter publication supabase_realtime add table users;
  alter publication supabase_realtime add table products;

  ==============================================================================
*/

// ==============================================================================
// CONFIGURAÇÃO DE CREDENCIAIS
// ==============================================================================

const SUPABASE_URL = 'https://uayvvfiqzfzlwzcbggqy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheXZ2ZmlxemZ6bHd6Y2JnZ3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDYyNzYsImV4cCI6MjA4NDUyMjI3Nn0.V-CP7sywiRVeoZuhxgtWz86IkN0tbuV0MXnb_0nLOrM';

// ==============================================================================

const isConfigured = SUPABASE_URL.startsWith('https://') && 
                     SUPABASE_ANON_KEY.length > 20 && 
                     !SUPABASE_ANON_KEY.includes('COLE_');

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    })
  : null;

// --- FUNÇÕES DE VENDAS (TRANSACTIONS) ---

export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: true });
    if (error) { console.warn('Supabase Error (Fetch Transactions):', error.message); return null; }
    return data as Transaction[];
  } catch (err) { return null; }
};

export const fetchPendingTransactions = async (): Promise<Transaction[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending_payment')
      .order('timestamp', { ascending: true });
      
    if (error) { console.warn('Supabase Error (Fetch Pending):', error.message); return []; }
    return data as Transaction[];
  } catch (err) { return []; }
};

export const fetchTransactionsByIds = async (ids: string[]): Promise<Transaction[]> => {
  if (!supabase || ids.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .in('id', ids)
      .order('timestamp', { ascending: false }); 

    if (error) { console.warn('Supabase Error (Fetch By IDs):', error.message); return []; }
    return data as Transaction[];
  } catch (err) { return []; }
};

export const fetchNextOrderNumber = async (): Promise<string | null> => {
  if (!supabase) return null;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('orderNumber')
      .gte('timestamp', startOfDay.getTime());

    if (error || !data) return null;

    const maxOrder = data.length > 0 
      ? Math.max(...data.map(t => parseInt(t.orderNumber) || 0)) 
      : 0;
    
    return (maxOrder + 1).toString();
  } catch (err) { return null; }
};

export const createTransaction = async (transaction: Transaction): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('transactions').insert([transaction]);
    if (error) {
        console.error("Erro ao criar transação:", error.message);
        return false;
    }
    return true;
  } catch (err) { 
    console.error("Erro inesperado:", err);
    return false; 
  }
};

export const confirmTransactionPayment = async (updatedTransaction: Transaction): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('transactions')
            .update({
                status: 'completed',
                paymentMethod: updatedTransaction.paymentMethod,
                amountPaid: updatedTransaction.amountPaid,
                change: updatedTransaction.change,
                sellerName: updatedTransaction.sellerName,
                total: updatedTransaction.total, 
                discount: updatedTransaction.discount,
                items: updatedTransaction.items, 
                kitchenStatus: 'pending' 
            })
            .eq('id', updatedTransaction.id);
        return !error;
    } catch (err) { return false; }
};

export const updateTransactionStatus = async (id: string, status: 'completed' | 'cancelled') => {
  if (!supabase) return;
  try { await supabase.from('transactions').update({ status }).eq('id', id); } catch (err) {}
};

export const updateKitchenStatus = async (id: string, kitchenStatus: 'pending' | 'done') => {
  if (!supabase) return;
  try { await supabase.from('transactions').update({ kitchenStatus }).eq('id', id); } catch (err) {}
};

// --- FUNÇÃO DE RESETAR BANCO (APENAS PROFESSOR) ---
export const resetDatabase = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // Remove todas as transações (Cuidado: isso apaga o histórico completo)
        const { error } = await supabase.from('transactions').delete().neq('id', 'placeholder'); // neq id placeholder é um hack para 'delete all' em algumas configs, mas delete() sem where costuma funcionar dependendo da policy
        // Se o delete all direto for bloqueado por segurança, precisamos de uma condição verdadeira.
        // A melhor forma de limpar via client é garantir que a Policy permita.
        
        // Tentativa direta:
        // const { error } = await supabase.from('transactions').delete().gt('timestamp', 0);
        
        // Se falhar, use o TRUNCATE via SQL Editor no painel, mas via API client-side:
        const { error: err } = await supabase.from('transactions').delete().gte('timestamp', 0);
        
        return !err;
    } catch (err) {
        console.error("Erro ao resetar banco:", err);
        return false;
    }
};

// --- FUNÇÕES DE USUÁRIOS (USERS) ---

export const fetchUsers = async (): Promise<User[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) { console.warn('Supabase Error (Fetch Users):', error.message); return null; }
    return data as User[];
  } catch (err) { return null; }
};

export const createUser = async (user: User): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').insert([user]);
    return !error;
  } catch (err) { return false; }
};

export const updateUser = async (user: User): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').update({ 
      name: user.name, 
      password: user.password, 
      role: user.role 
    }).eq('id', user.id);
    return !error;
  } catch (err) { return false; }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    return !error;
  } catch (err) { return false; }
};

// --- FUNÇÕES DE PRODUTOS (PRODUCTS) - NOVO! ---

export const fetchProducts = async (): Promise<Product[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) { console.warn('Supabase Error (Fetch Products):', error.message); return null; }
    return data as Product[];
  } catch (err) { return null; }
};

export const createProduct = async (product: Product): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').insert([product]);
    return !error;
  } catch (err) { return false; }
};

export const updateProduct = async (product: Product): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('products').update(product).eq('id', product.id);
        return !error;
    } catch (err) { return false; }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        return !error;
    } catch (err) { return false; }
};

// --- SUBSCRIPTION (TEMPO REAL) ---

export const subscribeToTransactions = (onUpdate: () => void) => {
  if (!supabase) return;
  const channel = supabase
    .channel('db_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onUpdate()) // Escuta produtos também
    .subscribe();
  return channel;
};
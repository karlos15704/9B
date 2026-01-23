import { createClient } from '@supabase/supabase-js';
import { Transaction, User, Product } from '../types';

/* 
  ==============================================================================
  🚨 CÓDIGO SQL PARA O SUPABASE (SQL EDITOR) 🚨
  ==============================================================================
  
  Copie o código abaixo, cole no "SQL Editor" do Supabase e clique em "RUN".

  -- 1. LIMPEZA (Remove tabelas antigas se existirem para evitar erros)
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS products;

  -- 2. CRIAR TABELA DE VENDAS (TRANSACTIONS)
  CREATE TABLE public.transactions (
      id text PRIMARY KEY,
      "orderNumber" text,
      "customerName" text,
      timestamp bigint,
      items jsonb,          -- Armazena os itens do pedido em formato JSON
      subtotal numeric,
      discount numeric,
      total numeric,
      "paymentMethod" text, -- 'Crédito', 'Débito', 'Dinheiro', 'Pix', 'Aguardando'
      "amountPaid" numeric,
      change numeric,
      "sellerName" text,
      status text,          -- 'pending_payment', 'completed', 'cancelled'
      "kitchenStatus" text  -- 'pending', 'done'
  );

  -- 3. CRIAR TABELA DE USUÁRIOS (USERS)
  CREATE TABLE public.users (
      id text PRIMARY KEY,
      name text,
      password text,
      role text             -- 'admin', 'manager', 'staff', 'kitchen', 'display'
  );

  -- 4. CRIAR TABELA DE PRODUTOS (PRODUCTS)
  CREATE TABLE public.products (
      id text PRIMARY KEY,
      name text,
      price numeric,
      category text,
      "imageUrl" text,
      description text,     -- Nova coluna para detalhes do produto
      "isAvailable" boolean DEFAULT true -- Nova coluna para controle de estoque
  );

  -- 5. CRIAR ÍNDICES (Para o Relatório Diário/Mensal carregar rápido)
  CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp);

  -- 6. CONFIGURAR SEGURANÇA (RLS)
  -- Libera leitura e escrita para o app funcionar sem autenticação complexa de email
  ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Acesso Total Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Acesso Total Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Acesso Total Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

  -- 7. ATIVAR REALTIME
  -- Isso faz a cozinha e o telão atualizarem sozinhos quando entra pedido
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

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
        // Se a policy não permitir delete all sem where, usamos gte timestamp 0
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
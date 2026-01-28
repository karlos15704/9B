import { createClient } from '@supabase/supabase-js';
import { Transaction, User, Product, AppSettings, Expense } from '../types';

/* 
  ==============================================================================
  🚨 CÓDIGO SQL PARA O SUPABASE (SQL EDITOR) 🚨
  ==============================================================================
  
  -- 1. Habilitar CMS Visual e Correções:
  ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "customerLayout" jsonb;
  ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "customerHeroUrl" text;
  ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "customerWelcomeTitle" text;
  ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "marqueeText" text;

  -- 2. Atualizar Produtos com Estoque e Código de Barras
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "stock" integer DEFAULT 0;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "barcode" text;

  -- 3. Criar Tabela de Despesas (Controle de Gastos)
  CREATE TABLE IF NOT EXISTS public.expenses (
    id text PRIMARY KEY,
    description text NOT NULL,
    amount numeric NOT NULL,
    timestamp bigint NOT NULL,
    "registeredBy" text,
    category text
  );

  -- Garante permissões de escrita
  GRANT ALL ON public.settings TO anon, authenticated, service_role;
  GRANT ALL ON public.products TO anon, authenticated, service_role;
  GRANT ALL ON public.expenses TO anon, authenticated, service_role;

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

export const resetDatabase = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error: err } = await supabase.from('transactions').delete().gte('timestamp', 0);
        return !err;
    } catch (err) {
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

// --- FUNÇÕES DE PRODUTOS (PRODUCTS) ---

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

// --- FUNÇÕES DE DESPESAS (EXPENSES) ---

export const fetchExpenses = async (): Promise<Expense[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase.from('expenses').select('*').order('timestamp', { ascending: false });
        if (error) {
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                 console.log("🚨 RODE O SQL PARA CRIAR A TABELA EXPENSES");
            }
            return [];
        }
        return data as Expense[];
    } catch (err) { return []; }
};

export const createExpense = async (expense: Expense): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('expenses').insert([expense]);
        return !error;
    } catch (err) { return false; }
};

export const deleteExpense = async (expenseId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        return !error;
    } catch (err) { return false; }
};


// --- FUNÇÕES DE SETTINGS (NOVO) ---

export const fetchSettings = async (): Promise<AppSettings | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
        if (error) { 
            if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
                console.error("🚨 ERRO CRÍTICO: FALTAM COLUNAS NO SUPABASE 🚨");
            }
            if (error.code === 'PGRST116') {
                return null;
            }
            return null; 
        }
        return data as AppSettings;
    } catch (err) { return null; }
};

export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('settings').upsert({ id: 'global', ...settings });
        
        if (error) {
             if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
                 alert("ERRO SQL: Faltam colunas na tabela. Verifique o console.");
             }
            return false;
        }
        return true;
    } catch (err) { return false; }
};

// --- SUBSCRIPTION (TEMPO REAL) ---

export const subscribeToTransactions = (onUpdate: () => void) => {
  if (!supabase) return;
  const channel = supabase
    .channel('db_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        console.log("Settings changed remotely!");
        onUpdate();
    }) 
    .subscribe();
  return channel;
};
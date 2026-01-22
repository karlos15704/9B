import { createClient } from '@supabase/supabase-js';
import { Transaction, User } from '../types';

/* 
  ==============================================================================
  🛠️ CONFIGURAÇÃO DO BANCO DE DADOS (SQL)
  ==============================================================================
  
  Vá no "SQL Editor" do Supabase e rode este código completo para criar as tabelas
  (Vendas e Usuários) e liberar as permissões:

  -- 1. Cria a tabela de Vendas
  create table if not exists transactions (
    id text primary key,
    "orderNumber" text,
    timestamp bigint,
    items jsonb,
    subtotal numeric,
    discount numeric,
    total numeric,
    "paymentMethod" text,
    "amountPaid" numeric,
    change numeric,
    "sellerName" text,
    status text,
    "kitchenStatus" text
  );

  -- 2. Cria a tabela de Usuários (NOVO!)
  create table if not exists users (
    id text primary key,
    name text,
    password text,
    role text
  );

  -- 3. Libera permissões (Necessário para o App funcionar)
  alter table transactions enable row level security;
  alter table users enable row level security;
  
  create policy "Acesso Total Vendas" on transactions for all using (true) with check (true);
  create policy "Acesso Total Usuarios" on users for all using (true) with check (true);

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

// Busca apenas pedidos pendentes de pagamento (Online/App)
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

export const createTransaction = async (transaction: Transaction): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('transactions').insert([transaction]);
    return !error;
  } catch (err) { return false; }
};

// Atualiza uma transação existente (ex: Quando o caixa recebe o pagamento de um pedido online)
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
                total: updatedTransaction.total, // Caso tenha aplicado desconto
                discount: updatedTransaction.discount,
                items: updatedTransaction.items, // Caso tenha editado itens
                kitchenStatus: 'pending' // Garante que vá para cozinha agora
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

// --- FUNÇÕES DE USUÁRIOS (USERS) - NOVO! ---

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
    // Atualiza baseado no ID
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

// --- SUBSCRIPTION (TEMPO REAL) ---

export const subscribeToTransactions = (onUpdate: () => void) => {
  if (!supabase) return;
  const channel = supabase
    .channel('db_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => onUpdate()) // Escuta usuários também
    .subscribe();
  return channel;
};
import { createClient } from '@supabase/supabase-js';
import { Transaction, User, Product, AppSettings, Expense, Contribution } from '../types';

const SUPABASE_URL = 'https://uayvvfiqzfzlwzcbggqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheXZ2ZmlxemZ6bHd6Y2JnZ3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDYyNzYsImV4cCI6MjA4NDUyMjI3Nn0.V-CP7sywiRVeoZuhxgtWz86IkN0tbuV0MXnb_0nLOrM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authPromise = Promise.resolve();

// --- TRANSACTIONS ---
export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: true });
  if (error) { console.error(error); return null; }
  return data as Transaction[];
};

export const fetchPendingTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*').eq('status', 'pending_payment').order('timestamp', { ascending: true });
  if (error) return [];
  return data as Transaction[];
};

export const fetchTransactionsByIds = async (ids: string[]): Promise<Transaction[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('transactions').select('*').in('id', ids).order('timestamp', { ascending: false });
  if (error) return [];
  return data as Transaction[];
};

export const fetchNextOrderNumber = async (): Promise<string | null> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from('transactions').select('orderNumber').gte('timestamp', startOfDay.getTime());
  if (error) return null;
  const maxOrder = data.length > 0 
    ? Math.max(...data.map(d => parseInt(d.orderNumber) || 0)) 
    : 0;
  return (maxOrder + 1).toString();
};

export const createTransaction = async (transaction: Transaction): Promise<boolean> => {
  const { error } = await supabase.from('transactions').insert(transaction);
  if (error) { console.error(error); return false; }
  return true;
};

export const confirmTransactionPayment = async (updatedTransaction: Transaction): Promise<boolean> => {
  const { error } = await supabase.from('transactions').update({
    status: 'completed',
    paymentMethod: updatedTransaction.paymentMethod,
    amountPaid: updatedTransaction.amountPaid,
    change: updatedTransaction.change,
    sellerName: updatedTransaction.sellerName,
    total: updatedTransaction.total, 
    discount: updatedTransaction.discount,
    items: updatedTransaction.items, 
    kitchenStatus: 'pending' 
  }).eq('id', updatedTransaction.id);
  return !error;
};

export const updateTransactionStatus = async (id: string, status: 'completed' | 'cancelled') => {
  await supabase.from('transactions').update({ status }).eq('id', id);
};

export const updateKitchenStatus = async (id: string, kitchenStatus: 'pending' | 'done') => {
  await supabase.from('transactions').update({ kitchenStatus }).eq('id', id);
};

export const resetDatabase = async (): Promise<boolean> => {
  const { error } = await supabase.from('transactions').delete().gte('timestamp', 0);
  if (error) { console.error('Error resetting transactions:', error); return false; }
  return true;
};

// --- USERS ---
export const fetchUsers = async (): Promise<User[] | null> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return null;
  return data as User[];
};

export const createUser = async (user: User): Promise<boolean> => {
  const { error } = await supabase.from('users').insert(user);
  if (error) { console.error('Error creating user:', error); return false; }
  return true;
};

export const updateUser = async (user: User): Promise<boolean> => {
  const { error } = await supabase.from('users').update({ 
    name: user.name, 
    password: user.password, 
    role: user.role 
  }).eq('id', user.id);
  return !error;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  return !error;
};

// --- PRODUCTS ---
export const fetchProducts = async (): Promise<Product[] | null> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return null;
  return data as Product[];
};

export const createProduct = async (product: Product): Promise<boolean> => {
  const { error } = await supabase.from('products').insert(product);
  return !error;
};

export const updateProduct = async (product: Product): Promise<boolean> => {
  const { error } = await supabase.from('products').update(product).eq('id', product.id);
  return !error;
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  return !error;
};

// --- EXPENSES ---
export const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase.from('expenses').select('*').order('timestamp', { ascending: false });
  if (error) return [];
  return data as Expense[];
};

export const uploadReceiptImage = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('receipts').upload(fileName, file);
  if (error) return null;
  const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
};

export const uploadGalleryImage = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('gallery').upload(fileName, file);
  if (error) return null;
  const { data: publicUrlData } = supabase.storage.from('gallery').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
};

export const uploadProductImage = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('products').upload(fileName, file);
  if (error) return null;
  const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
};

export const createExpense = async (expense: Expense): Promise<boolean> => {
  const { error } = await supabase.from('expenses').insert(expense);
  return !error;
};

export const deleteExpense = async (expenseId: string): Promise<boolean> => {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  return !error;
};

// --- CONTRIBUTIONS ---
export const fetchContributions = async (): Promise<Contribution[]> => {
  const { data, error } = await supabase.from('contributions').select('*').order('paymentDate', { ascending: false });
  if (error) return [];
  return data as Contribution[];
};

export const createContribution = async (contribution: Contribution): Promise<boolean> => {
  const { error } = await supabase.from('contributions').insert(contribution);
  return !error;
};

export const deleteContribution = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('contributions').delete().eq('id', id);
  return !error;
};

// --- SETTINGS ---
export const fetchSettings = async (): Promise<AppSettings | null> => {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
  if (error) return null;
  return data as AppSettings;
};

export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
  const { error } = await supabase.from('settings').upsert({ id: 'global', ...settings });
  return !error;
};

// --- SUBSCRIPTION ---
export const subscribeToTransactions = (onUpdate: () => void) => {
  const channel = supabase.channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => onUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => onUpdate())
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};

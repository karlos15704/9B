import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { Transaction, User, Product, AppSettings, Expense, Contribution } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Sign in anonymously to access the database
signInAnonymously(auth).catch(console.error);

// Helper to handle errors
const handleFirestoreError = (error: any) => {
    console.error('Firestore Error:', error);
    return null;
};

// --- TRANSACTIONS ---
export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  try {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Transaction);
  } catch (err) { return handleFirestoreError(err); }
};

export const fetchPendingTransactions = async (): Promise<Transaction[]> => {
  try {
    const q = query(collection(db, 'transactions'), where('status', '==', 'pending_payment'), orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Transaction);
  } catch (err) { return []; }
};

export const fetchTransactionsByIds = async (ids: string[]): Promise<Transaction[]> => {
  if (ids.length === 0) return [];
  try {
    const q = query(collection(db, 'transactions'), where('id', 'in', ids));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Transaction).sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) { return []; }
};

export const fetchNextOrderNumber = async (): Promise<string | null> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const q = query(collection(db, 'transactions'), where('timestamp', '>=', startOfDay.getTime()));
    const snapshot = await getDocs(q);
    const maxOrder = snapshot.docs.length > 0 
      ? Math.max(...snapshot.docs.map(d => parseInt(d.data().orderNumber) || 0)) 
      : 0;
    return (maxOrder + 1).toString();
  } catch (err) { return null; }
};

export const createTransaction = async (transaction: Transaction): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'transactions', transaction.id), transaction);
    return true;
  } catch (err) { 
    console.error(err);
    return false; 
  }
};

export const confirmTransactionPayment = async (updatedTransaction: Transaction): Promise<boolean> => {
    try {
        await updateDoc(doc(db, 'transactions', updatedTransaction.id), {
            status: 'completed',
            paymentMethod: updatedTransaction.paymentMethod,
            amountPaid: updatedTransaction.amountPaid,
            change: updatedTransaction.change,
            sellerName: updatedTransaction.sellerName,
            total: updatedTransaction.total, 
            discount: updatedTransaction.discount,
            items: updatedTransaction.items, 
            kitchenStatus: 'pending' 
        });
        return true;
    } catch (err) { return false; }
};

export const updateTransactionStatus = async (id: string, status: 'completed' | 'cancelled') => {
  try { await updateDoc(doc(db, 'transactions', id), { status }); } catch (err) {}
};

export const updateKitchenStatus = async (id: string, kitchenStatus: 'pending' | 'done') => {
  try { await updateDoc(doc(db, 'transactions', id), { kitchenStatus }); } catch (err) {}
};

export const resetDatabase = async (): Promise<boolean> => {
    try {
        const snapshot = await getDocs(collection(db, 'transactions'));
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        return true;
    } catch (err) { return false; }
};

// --- USERS ---
export const fetchUsers = async (): Promise<User[] | null> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as User);
  } catch (err) { return null; }
};

export const createUser = async (user: User): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'users', user.id), user);
    return true;
  } catch (err) { return false; }
};

export const updateUser = async (user: User): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'users', user.id), { 
      name: user.name, 
      password: user.password, 
      role: user.role 
    });
    return true;
  } catch (err) { return false; }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (err) { return false; }
};

// --- PRODUCTS ---
export const fetchProducts = async (): Promise<Product[] | null> => {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.docs.map(doc => doc.data() as Product);
  } catch (err) { return null; }
};

export const createProduct = async (product: Product): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'products', product.id), product);
    return true;
  } catch (err) { return false; }
};

export const updateProduct = async (product: Product): Promise<boolean> => {
    try {
        await updateDoc(doc(db, 'products', product.id), product as any);
        return true;
    } catch (err) { return false; }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'products', productId));
        return true;
    } catch (err) { return false; }
};

// --- EXPENSES ---
export const fetchExpenses = async (): Promise<Expense[]> => {
    try {
        const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Expense);
    } catch (err) { return []; }
};

export const uploadReceiptImage = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `receipts/${fileName}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) { return null; }
};

export const uploadGalleryImage = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `gallery/${fileName}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) { return null; }
};

export const uploadProductImage = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `products/${fileName}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) { return null; }
};

export const createExpense = async (expense: Expense): Promise<boolean> => {
    try {
        await setDoc(doc(db, 'expenses', expense.id), expense);
        return true;
    } catch (err) { return false; }
};

export const deleteExpense = async (expenseId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        return true;
    } catch (err) { return false; }
};

// --- CONTRIBUTIONS ---
export const fetchContributions = async (): Promise<Contribution[]> => {
    try {
        const q = query(collection(db, 'contributions'), orderBy('paymentDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Contribution);
    } catch (err) { return []; }
};

export const createContribution = async (contribution: Contribution): Promise<boolean> => {
    try {
        await setDoc(doc(db, 'contributions', contribution.id), contribution);
        return true;
    } catch (err) { return false; }
};

export const deleteContribution = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'contributions', id));
        return true;
    } catch (err) { return false; }
};

// --- SETTINGS ---
export const fetchSettings = async (): Promise<AppSettings | null> => {
    try {
        const docSnap = await getDoc(doc(db, 'settings', 'global'));
        if (docSnap.exists()) {
            return docSnap.data() as AppSettings;
        }
        return null;
    } catch (err) { return null; }
};

export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
    try {
        await setDoc(doc(db, 'settings', 'global'), settings);
        return true;
    } catch (err) { return false; }
};

// --- SUBSCRIPTION ---
export const subscribeToTransactions = (onUpdate: () => void) => {
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), () => onUpdate());
    const unsubUsers = onSnapshot(collection(db, 'users'), () => onUpdate());
    const unsubProducts = onSnapshot(collection(db, 'products'), () => onUpdate());
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), () => onUpdate());
    const unsubContributions = onSnapshot(collection(db, 'contributions'), () => onUpdate());
    const unsubSettings = onSnapshot(collection(db, 'settings'), () => onUpdate());
    
    return {
        unsubscribe: () => {
            unsubTransactions();
            unsubUsers();
            unsubProducts();
            unsubExpenses();
            unsubContributions();
            unsubSettings();
        }
    };
};

export const supabase = true; // Mock to prevent breaking existing checks

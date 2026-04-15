import { db } from './supabase'; // which is actually firebase now
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Customer } from '../types';

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    try {
        const q = query(collection(db, 'customers'), where('phone', '==', cleanPhone));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as Customer;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
};

export const createCustomer = async (phone: string, name?: string): Promise<Customer | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const newId = crypto.randomUUID();
    const newCustomer: Customer = {
        id: newId,
        phone: cleanPhone,
        name: name || '',
        points: 0,
        prizes: []
    };

    try {
        await setDoc(doc(db, 'customers', newId), newCustomer);
        return newCustomer;
    } catch (error) {
        console.error('Error creating customer:', error);
        return null;
    }
};

export const addPoints = async (customerId: string, points: number): Promise<boolean> => {
    try {
        const docRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return false;
        
        const customer = docSnap.data() as Customer;
        const newPoints = (customer.points || 0) + points;
        
        await updateDoc(docRef, { points: newPoints });
        return true;
    } catch (error) { return false; }
};

export const redeemPoints = async (customerId: string, pointsToRedeem: number): Promise<boolean> => {
    try {
        const docRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return false;
        
        const customer = docSnap.data() as Customer;
        if ((customer.points || 0) < pointsToRedeem) return false;
        
        const newPoints = customer.points - pointsToRedeem;
        await updateDoc(docRef, { points: newPoints });
        return true;
    } catch (error) { return false; }
};

export const savePrize = async (customerId: string, prizeName: string): Promise<boolean> => {
    try {
        const docRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return false;
        
        const customer = docSnap.data() as Customer;
        const currentPrizes = customer.prizes || [];
        const newPrize = {
            id: crypto.randomUUID(),
            name: prizeName,
            dateWon: Date.now(),
            redeemed: false
        };
        
        await updateDoc(docRef, { prizes: [...currentPrizes, newPrize] });
        return true;
    } catch (error) { return false; }
};

export const redeemPrize = async (customerId: string, prizeId: string): Promise<boolean> => {
    try {
        const docRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return false;
        
        const customer = docSnap.data() as Customer;
        const currentPrizes = customer.prizes || [];
        const updatedPrizes = currentPrizes.map(p => {
            if (p.id === prizeId) {
                return { ...p, redeemed: true, redeemedDate: Date.now() };
            }
            return p;
        });
        
        await updateDoc(docRef, { prizes: updatedPrizes });
        return true;
    } catch (error) { return false; }
};
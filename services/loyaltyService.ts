import { supabase } from './supabase';
import { Customer } from '../types';

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const { data, error } = await supabase.from('customers').select('*').eq('phone', cleanPhone).single();
    if (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
    return data as Customer;
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

    const { error } = await supabase.from('customers').insert(newCustomer);
    if (error) {
        console.error('Error creating customer:', error);
        return null;
    }
    return newCustomer;
};

export const addPoints = async (customerId: string, points: number): Promise<boolean> => {
    const { data: customer, error: fetchError } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (fetchError || !customer) return false;
    
    const newPoints = (customer.points || 0) + points;
    const { error } = await supabase.from('customers').update({ points: newPoints }).eq('id', customerId);
    return !error;
};

export const redeemPoints = async (customerId: string, pointsToRedeem: number): Promise<boolean> => {
    const { data: customer, error: fetchError } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (fetchError || !customer) return false;
    
    if ((customer.points || 0) < pointsToRedeem) return false;
    
    const newPoints = customer.points - pointsToRedeem;
    const { error } = await supabase.from('customers').update({ points: newPoints }).eq('id', customerId);
    return !error;
};

export const savePrize = async (customerId: string, prizeName: string): Promise<boolean> => {
    const { data: customer, error: fetchError } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (fetchError || !customer) return false;
    
    const currentPrizes = customer.prizes || [];
    const newPrize = {
        id: crypto.randomUUID(),
        name: prizeName,
        dateWon: Date.now(),
        redeemed: false
    };
    
    const { error } = await supabase.from('customers').update({ prizes: [...currentPrizes, newPrize] }).eq('id', customerId);
    return !error;
};

export const redeemPrize = async (customerId: string, prizeId: string): Promise<boolean> => {
    const { data: customer, error: fetchError } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (fetchError || !customer) return false;
    
    const currentPrizes = customer.prizes || [];
    const updatedPrizes = currentPrizes.map((p: any) => {
        if (p.id === prizeId) {
            return { ...p, redeemed: true, redeemedDate: Date.now() };
        }
        return p;
    });
    
    const { error } = await supabase.from('customers').update({ prizes: updatedPrizes }).eq('id', customerId);
    return !error;
};
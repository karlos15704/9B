import { supabase } from './supabase';
import { Customer } from '../types';

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    if (!supabase) return null;
    
    // Remove formatação do telefone para busca
    const cleanPhone = phone.replace(/\D/g, '');

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        console.error('Error fetching customer:', error);
        return null;
    }

    return data as Customer;
};

export const createCustomer = async (phone: string, name?: string): Promise<Customer | null> => {
    if (!supabase) return null;

    const cleanPhone = phone.replace(/\D/g, '');

    const { data, error } = await supabase
        .from('customers')
        .insert([{ phone: cleanPhone, name, points: 0 }])
        .select()
        .single();

    if (error) {
        console.error('Error creating customer:', error);
        return null;
    }

    return data as Customer;
};

export const addPoints = async (customerId: string, points: number): Promise<boolean> => {
    if (!supabase) return false;

    // Primeiro busca o saldo atual
    const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('points')
        .eq('id', customerId)
        .single();

    if (fetchError || !customer) return false;

    const newPoints = (customer.points || 0) + points;

    const { error: updateError } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customerId);

    return !updateError;
};

export const redeemPoints = async (customerId: string, pointsToRedeem: number): Promise<boolean> => {
    if (!supabase) return false;

    const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('points')
        .eq('id', customerId)
        .single();

    if (fetchError || !customer) return false;

    if (customer.points < pointsToRedeem) return false; // Saldo insuficiente

    const newPoints = customer.points - pointsToRedeem;

    const { error: updateError } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customerId);

    return !updateError;
};

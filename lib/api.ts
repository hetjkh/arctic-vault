import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InvoiceCreateInput, InvoiceDocument, InvoiceUpdateInput } from '../types';

// Same as Next.js app
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://arctic-vault-back.onrender.com';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;
  try {
    const headers: Record<string, string> = {
      ...(options.headers as any),
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `API Error: ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

export const getStoredUser = async () => {
  try {
    const val = await AsyncStorage.getItem('user');
    return val ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = async (user: any) => {
  try {
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user');
    }
  } catch (e) {
    console.error('Error saving user to storage', e);
  }
};

export async function listInvoices(): Promise<InvoiceDocument[]> {
  return apiFetch('/api/invoices');
}

export async function getInvoice(id: string): Promise<InvoiceDocument> {
  return apiFetch(`/api/invoices/${encodeURIComponent(id)}`);
}

export async function suggestInvoiceNumber(): Promise<{ invoiceNumber: string }> {
  return apiFetch('/api/invoices/suggest-number');
}

export async function createInvoice(input: InvoiceCreateInput): Promise<InvoiceDocument> {
  return apiFetch('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateInvoice(id: string, input: InvoiceUpdateInput): Promise<InvoiceDocument> {
  return apiFetch(`/api/invoices/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiFetch(`/api/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

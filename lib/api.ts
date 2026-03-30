import AsyncStorage from '@react-native-async-storage/async-storage';

// Same as Next.js app
export const BACKEND_URL = 'https://arctic-vault-back.onrender.com';

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

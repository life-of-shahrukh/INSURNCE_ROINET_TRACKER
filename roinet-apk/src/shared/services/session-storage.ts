import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memory = new Map<string, string>();

function useWebStorage(): boolean {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

export async function getSessionItem(key: string): Promise<string | null> {
  try {
    if (useWebStorage()) {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.warn('[SessionStorage] getItem failed, using in-memory fallback:', err);
    return memory.get(key) ?? null;
  }
}

export async function setSessionItem(key: string, value: string): Promise<void> {
  try {
    if (useWebStorage()) {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    console.warn('[SessionStorage] setItem failed, using in-memory fallback:', err);
    memory.set(key, value);
  }
}

export async function removeSessionItem(key: string): Promise<void> {
  try {
    if (useWebStorage()) {
      localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn('[SessionStorage] removeItem failed, using in-memory fallback:', err);
    memory.delete(key);
  }
}

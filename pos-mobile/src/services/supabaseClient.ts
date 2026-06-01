import { createClient } from '@supabase/supabase-js';

// Safe wrapper for global localStorage to avoid crashes on native platforms
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage delete error:', e);
    }
  }
};

export function getSupabaseConfig() {
  const localUrl = safeStorage.getItem('alegra_supabase_url') || '';
  const localKey = safeStorage.getItem('alegra_supabase_key') || '';
  const localUse = safeStorage.getItem('alegra_supabase_use') !== 'false'; // default to true if we set URL/Key

  // Check possible process.env values in Expo (VITE_ or EXPO_PUBLIC_)
  const url = localUrl || 
              process.env.EXPO_PUBLIC_SUPABASE_URL || 
              process.env.VITE_SUPABASE_URL || 
              'https://placeholder.supabase.co';

  const key = localKey || 
              process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.VITE_SUPABASE_ANON_KEY || 
              'placeholder_key';
  
  const hasValidKeys = (url && url !== 'https://placeholder.supabase.co') && (key && key !== 'placeholder_key');
  
  const use = hasValidKeys && (localUrl && localKey ? localUse : true);

  return { url, key, use, hasValidKeys };
}

const initialConfig = getSupabaseConfig();
export let supabase = createClient(initialConfig.url, initialConfig.key);

// Call this when settings are updated to recreate the client instance
export function reinitializeSupabase() {
  const freshConfig = getSupabaseConfig();
  supabase = createClient(freshConfig.url, freshConfig.key);
}

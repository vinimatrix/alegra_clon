/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// If you choose to use Supabase instead of the NestJS backend, 
// this is the initialized client. 

import { createClient } from '@supabase/supabase-js';

// Dynamically fetch configurations from localStorage (overridden in settings) or import.meta.env
export function getSupabaseConfig() {
  const localUrl = localStorage.getItem('alegra_supabase_url') || '';
  const localKey = localStorage.getItem('alegra_supabase_key') || '';
  const localUse = localStorage.getItem('alegra_supabase_use') !== 'false'; // default to true if we set URL/Key

  const url = localUrl || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';
  
  const hasValidKeys = 
    url && 
    url !== 'https://placeholder.supabase.co' && 
    url.trim() !== '' &&
    key && 
    key !== 'placeholder_key' && 
    key.trim() !== '';

  // If we have custom local credentials, respect localUse state, otherwise default to VITE_USE_SUPABASE if keys are valid
  const use = hasValidKeys && (localUrl && localKey 
    ? localUse 
    : (import.meta.env.VITE_USE_SUPABASE === 'true' || import.meta.env.VITE_SUPABASE_URL !== undefined));

  return { url, key, use, hasValidKeys };
}

const initialConfig = getSupabaseConfig();
export let supabase = createClient(initialConfig.url, initialConfig.key);

// Call this when settings are updated to recreate the client instance
export function reinitializeSupabase() {
  const freshConfig = getSupabaseConfig();
  supabase = createClient(freshConfig.url, freshConfig.key);
}

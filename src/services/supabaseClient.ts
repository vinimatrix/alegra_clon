/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// If you choose to use Supabase instead of the NestJS backend, 
// this is the initialized client. 

import { createClient } from '@supabase/supabase-js';

// These should be set in .env of the React project
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

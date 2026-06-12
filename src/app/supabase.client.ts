import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!environment.supabaseUrl.startsWith('http')) {
    throw new Error(
      'Configura environment.supabaseUrl con la URL del proyecto, por ejemplo: https://abc123.supabase.co'
    );
  }

  if (!environment.supabaseAnonKey || environment.supabaseAnonKey.startsWith('TU_')) {
    throw new Error('Configura environment.supabaseAnonKey con la anon/public key de Supabase.');
  }

  supabaseClient ??= createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  return supabaseClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    return getSupabaseClient()[property as keyof SupabaseClient];
  }
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAuthToken = async () => {
  const session = await supabase.auth.getSession();
  if(session) {
    return session.data.session?.access_token;
  }

  return null;
}

export const getUserSession = async () => {
  const session = await supabase.auth.getSession();
  return session;
}
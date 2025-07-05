import { createClient } from '@supabase/supabase-js'
import { Context } from 'hono'

export const ALLOWED_USERS = ["justin.edward.hunter@gmail.com", "kaelynmhunter@gmail.com", "streamwithdean@gmail.com"]

export const getSupabase = () => {
  return createClient('https://nxfaqxoiqjubyfsdfzxy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
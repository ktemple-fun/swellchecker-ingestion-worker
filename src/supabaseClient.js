import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL loaded:", supabaseUrl);
console.log("Service Key loaded:", !!supabaseServiceKey);

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

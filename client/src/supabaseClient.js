
import { createClient } from '@supabase/supabase-js';
import { USE_LIVE_API } from './apiConfig';

const supabaseUrl = USE_LIVE_API
    ? process.env.SUPABASE_URL
    : 'https://mmfinfotech.website/bug_tracker/server/auth/supabase-mock-url';
const supabaseKey = USE_LIVE_API
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : 'local-dev-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL과 SUPABASE_SERVICE_KEY 환경변수가 필요합니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

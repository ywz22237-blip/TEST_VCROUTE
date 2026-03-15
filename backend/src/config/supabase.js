const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] SUPABASE_URL 또는 SUPABASE_SERVICE_KEY 환경변수가 없습니다. DB 기능이 제한됩니다.');
}

let supabase;
try {
  supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
} catch (e) {
  console.warn('[Supabase] 클라이언트 초기화 실패:', e.message);
  // 쿼리 시 에러를 반환하는 더미 객체
  supabase = new Proxy({}, {
    get() {
      return () => ({ data: null, error: new Error('Supabase not configured') });
    }
  });
}

module.exports = supabase;

/**
 * users 테이블 동기화 스크립트 (로그인 복구용)
 * 실행: node fix-user.js [userId]
 * 예시: node fix-user.js ywz22
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = 'https://kdfsselcksrnntarumdx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZnNzZWxja3Nybm50YXJ1bWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMjc4OSwiZXhwIjoyMDg4OTg4Nzg5fQ.9WhaTP9QjpwYLqkoZFQwzxIrIpHKQZ3aBk0U2hSVHzY';

const sb     = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const userId = process.argv[2] || 'ywz22';

async function main() {
  console.log(`\n===== "${userId}" 계정 복구 시작 =====\n`);

  // Supabase Auth에서 찾기
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.log('❌ Auth 조회 실패:', error.message); return; }

  const found = (data.users || []).find(u =>
    u.user_metadata?.username  === userId ||
    u.user_metadata?.full_name === userId
  );

  if (!found) {
    console.log('❌ Supabase Auth에서 "' + userId + '" 계정을 찾을 수 없습니다.');
    console.log('→ 새로 회원가입이 필요합니다.');
    return;
  }

  console.log('✅ Auth 계정 발견:', found.email);

  // 이메일 미확인 시 강제 확인
  if (!found.email_confirmed_at) {
    console.log('⚠️  이메일 미확인 → 강제 확인 처리 중...');
    const { error: updateErr } = await sb.auth.admin.updateUserById(found.id, {
      email_confirm: true
    });
    if (updateErr) {
      console.log('❌ 이메일 확인 실패:', updateErr.message);
    } else {
      console.log('✅ 이메일 확인 완료');
    }
  }

  // users 테이블에 없으면 추가
  const { data: existing } = await sb
    .from('users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    console.log('✅ users 테이블에 이미 존재합니다.');
  } else {
    console.log('users 테이블에 추가 중...');
    const { error: insertErr } = await sb.from('users').insert({
      user_id:    userId,
      email:      found.email,
      password:   '$2a$10$placeholder_not_used_supabase_auth_handles_this',
      name:       found.user_metadata?.full_name || userId,
      role:       'user',
      user_type:  found.user_metadata?.user_type || 'startup',
      phone:      found.user_metadata?.phone     || null,
      company:    found.user_metadata?.company   || null,
      created_at: new Date().toISOString().split('T')[0]
    });

    if (insertErr) {
      console.log('❌ users 테이블 추가 실패:', insertErr.message);
    } else {
      console.log('✅ users 테이블에 추가 완료');
    }
  }

  console.log('\n===== 완료 =====');
  console.log('이제 아래 정보로 로그인하세요:');
  console.log('  아이디:', userId);
  console.log('  (가입 시 사용한 비밀번호)');
}

main().catch(console.error);

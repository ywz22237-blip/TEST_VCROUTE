/**
 * 사용자 계정 진단 스크립트
 * 실행: node diagnose-user.js [userId]
 * 예시: node diagnose-user.js ywz22
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = 'https://kdfsselcksrnntarumdx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZnNzZWxja3Nybm50YXJ1bWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMjc4OSwiZXhwIjoyMDg4OTg4Nzg5fQ.9WhaTP9QjpwYLqkoZFQwzxIrIpHKQZ3aBk0U2hSVHzY';

const sb     = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const userId = process.argv[2] || 'ywz22';

async function main() {
  console.log(`\n===== 계정 진단: "${userId}" =====\n`);

  // 1. users 테이블 조회
  console.log('[1] users 테이블 조회...');
  const { data: tableUser, error: tableError } = await sb
    .from('users')
    .select('id, user_id, email, name, role')
    .or(`user_id.eq.${userId},email.eq.${userId}`)
    .maybeSingle();

  if (tableError) {
    console.log('  ❌ 오류:', tableError.message);
  } else if (tableUser) {
    console.log('  ✅ users 테이블에 존재:');
    console.log('     user_id:', tableUser.user_id);
    console.log('     email  :', tableUser.email);
    console.log('     name   :', tableUser.name);
  } else {
    console.log('  ⚠️  users 테이블에 없음');
  }

  // 2. Supabase Auth 조회
  console.log('\n[2] Supabase Auth 조회...');
  const { data, error: authError } = await sb.auth.admin.listUsers({ perPage: 1000 });

  if (authError) {
    console.log('  ❌ 오류:', authError.message);
    return;
  }

  const authUsers = data.users || [];
  console.log('  전체 Auth 사용자 수:', authUsers.length);

  // username 또는 full_name으로 검색
  const found = authUsers.find(u =>
    u.user_metadata?.username  === userId ||
    u.user_metadata?.full_name === userId
  );

  if (found) {
    console.log('  ✅ Supabase Auth에 존재:');
    console.log('     id            :', found.id);
    console.log('     email         :', found.email);
    console.log('     email_confirmed:', found.email_confirmed_at ? '✅ 확인됨' : '❌ 미확인');
    console.log('     metadata      :', JSON.stringify(found.user_metadata));
  } else {
    console.log('  ⚠️  Supabase Auth에서도 못 찾음 (username/full_name = "' + userId + '" 없음)');
    console.log('\n  --- 전체 사용자 목록 ---');
    authUsers.forEach(u => {
      console.log(`  email: ${u.email} | username: ${u.user_metadata?.username} | full_name: ${u.user_metadata?.full_name}`);
    });
  }

  // 3. 결론 및 해결책
  console.log('\n===== 결론 =====');

  if (!tableUser && !found) {
    console.log('❌ "' + userId + '" 계정이 어디에도 없습니다.');
    console.log('→ 새로 회원가입이 필요합니다.');
  } else if (!tableUser && found) {
    console.log('⚠️  Supabase Auth에는 있지만 users 테이블에 없습니다.');
    if (!found.email_confirmed_at) {
      console.log('⚠️  이메일 미확인 상태입니다.');
      console.log('→ Supabase Dashboard > Authentication > Users > 해당 계정 클릭 > Confirm email 클릭');
    }
    console.log('→ 아래 fix-user.js 스크립트로 users 테이블에 추가하세요.');
  } else if (tableUser && found) {
    if (!found.email_confirmed_at) {
      console.log('⚠️  양쪽에 존재하지만 이메일이 미확인 상태입니다.');
      console.log('→ Supabase Dashboard에서 이메일 확인 처리 필요');
    } else {
      console.log('✅ 계정이 정상적으로 존재합니다.');
      console.log('→ 로그인 API 코드 또는 Vercel 배포 상태를 확인하세요.');
    }
  }
}

main().catch(console.error);

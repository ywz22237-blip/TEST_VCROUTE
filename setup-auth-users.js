/**
 * Supabase Auth 관리자 계정 생성 스크립트
 * 실행: node setup-auth-users.js
 * 필요: npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kdfsselcksrnntarumdx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZnNzZWxja3Nybm50YXJ1bWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMjc4OSwiZXhwIjoyMDg4OTg4Nzg5fQ.9WhaTP9QjpwYLqkoZFQwzxIrIpHKQZ3aBk0U2hSVHzY';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ACCOUNTS = [
  {
    email: 'startup@vcroute.com',
    password: 'Startup2026!',
    label: '스타트업 관리자',
    user_metadata: { full_name: '스타트업 관리자', userType: 'startup', role: 'admin' },
  },
  {
    email: 'investor@vcroute.com',
    password: 'Investor2026!',
    label: '투자자 관리자',
    user_metadata: { full_name: '투자자 관리자', userType: 'investor', role: 'admin' },
  },
];

async function main() {
  console.log('=== Supabase Auth 계정 생성 시작 ===\n');

  for (const account of ACCOUNTS) {
    process.stdout.write(`[${account.label}] ${account.email} 생성 중... `);

    const { data, error } = await sb.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,          // 이메일 인증 없이 바로 로그인 가능
      user_metadata: account.user_metadata,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log('⚠️  이미 존재합니다 (패스워드 업데이트 시도)');
        // 기존 유저 패스워드 업데이트
        const { data: list } = await sb.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === account.email);
        if (existing) {
          const { error: upErr } = await sb.auth.admin.updateUserById(existing.id, {
            password: account.password,
            email_confirm: true,
            user_metadata: account.user_metadata,
          });
          console.log(upErr ? `❌ 업데이트 실패: ${upErr.message}` : '✅ 업데이트 완료');
        }
      } else {
        console.log(`❌ 실패: ${error.message}`);
      }
    } else {
      console.log(`✅ 생성 완료 (id: ${data.user.id})`);
    }
  }

  console.log('\n=== 완료 ===');
  console.log('이제 아래 계정으로 로그인하세요:');
  ACCOUNTS.forEach(a => console.log(`  ${a.label}: ${a.email} / ${a.password}`));
}

main().catch(console.error);

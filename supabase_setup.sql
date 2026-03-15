-- ============================================================
-- VC Route - Supabase 전체 설정 SQL
-- 배포 전 Supabase Dashboard > SQL Editor 에서 순서대로 실행
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. 기존 테이블 초기화 (재설정 시에만 사용, 주의)
-- ────────────────────────────────────────────────────────────
/*
DROP TABLE IF EXISTS public.verification_codes CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.funds CASCADE;
DROP TABLE IF EXISTS public.startups CASCADE;
DROP TABLE IF EXISTS public.investors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
*/

-- ────────────────────────────────────────────────────────────
-- 1. users 테이블 (회원 정보)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        UNIQUE,                        -- 아이디 (로그인용)
  email         TEXT        NOT NULL UNIQUE,
  password      TEXT,                                      -- bcrypt 해시 (백엔드용)
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'user',       -- 'user' | 'admin'
  user_type     TEXT,                                      -- 'startup' | 'investor'
  phone         TEXT,
  company       TEXT,
  portfolio     TEXT,                                      -- 홈페이지 URL
  bio           TEXT,
  marketing_agree BOOLEAN   NOT NULL DEFAULT false,
  verified      BOOLEAN     NOT NULL DEFAULT false,
  -- 스타트업 추가 정보
  su_name       TEXT,
  su_nationality TEXT,
  su_age        TEXT,
  su_gender     TEXT,
  su_job        TEXT,
  su_sns        TEXT,
  su_bio        TEXT,
  su_referral   TEXT,
  co_name       TEXT,
  co_founded    TEXT,
  co_homepage   TEXT,
  co_biz_type   TEXT,
  co_address    TEXT,
  co_stage      TEXT,
  co_keywords   TEXT,
  co_cofounder  TEXT,
  co_cur_invest_stage  TEXT,
  co_cur_invest_amt    TEXT,
  co_hope_invest_stage TEXT,
  co_hope_invest_amt   TEXT,
  -- 투자자 추가 정보
  inv_type      TEXT,
  inv_role      TEXT,
  inv_homepage  TEXT,
  inv_sns       TEXT,
  created_at    DATE        NOT NULL DEFAULT CURRENT_DATE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. investors 테이블 (투자자 목록)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.investors (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT    NOT NULL,
  company         TEXT    NOT NULL,
  position        TEXT    NOT NULL DEFAULT '',
  investments     INT     NOT NULL DEFAULT 0,
  success_rate    FLOAT   NOT NULL DEFAULT 0,
  portfolio       TEXT[]  NOT NULL DEFAULT '{}',
  focus_area      TEXT[]  NOT NULL DEFAULT '{}',
  min_investment  INT     NOT NULL DEFAULT 0,
  max_investment  INT     NOT NULL DEFAULT 0,
  stage           TEXT[]  NOT NULL DEFAULT '{}',
  bio             TEXT    NOT NULL DEFAULT '',
  contact         TEXT    NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. startups 테이블 (스타트업 목록)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.startups (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT    NOT NULL,
  industry        TEXT    NOT NULL DEFAULT 'other',
  industry_label  TEXT    NOT NULL DEFAULT '기타',
  founded_date    DATE,
  location        TEXT    NOT NULL DEFAULT '',
  employees       INT     NOT NULL DEFAULT 0,
  funding_stage   TEXT    NOT NULL DEFAULT '',
  funding_amount  INT     NOT NULL DEFAULT 0,
  description     TEXT    NOT NULL DEFAULT '',
  ceo             TEXT    NOT NULL DEFAULT '',
  website         TEXT    NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. funds 테이블 (투자 펀드)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funds (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_type         TEXT    NOT NULL DEFAULT '투자조합',
  company_name      TEXT    NOT NULL,
  fund_name         TEXT    NOT NULL,
  registered_at     DATE,
  expired_at        DATE,
  settlement_month  INT     NOT NULL DEFAULT 12,
  manager           TEXT    NOT NULL DEFAULT '',
  support           TEXT    NOT NULL DEFAULT '',
  purpose           TEXT    NOT NULL DEFAULT '',
  industry          TEXT    NOT NULL DEFAULT '',
  base_rate         FLOAT   NOT NULL DEFAULT 0,
  total_amount      INT     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 5. bookmarks 테이블 (즐겨찾기)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT    NOT NULL,   -- 'investors' | 'startups' | 'funds'
  target_id   UUID    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ────────────────────────────────────────────────────────────
-- 6. notices 테이블 (공지사항)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notices (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT    NOT NULL DEFAULT 'notice',  -- 'notice' | 'update' | 'event'
  tag         TEXT    NOT NULL DEFAULT '# 공지',
  title       TEXT    NOT NULL,
  summary     TEXT    NOT NULL DEFAULT '',
  author      TEXT    NOT NULL DEFAULT '',
  author_role TEXT    NOT NULL DEFAULT 'Admin',
  date        DATE    NOT NULL DEFAULT CURRENT_DATE,
  content     TEXT    NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 7. verification_codes 테이블 (이메일/연락처 인증코드)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT    NOT NULL,   -- 'email' | 'phone'
  target      TEXT    NOT NULL,   -- 이메일 주소 또는 전화번호
  code        TEXT    NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type, target)
);

-- ────────────────────────────────────────────────────────────
-- 8. 인덱스
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id    ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_user_type  ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user   ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_target ON public.bookmarks(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notices_category ON public.notices(category);
CREATE INDEX IF NOT EXISTS idx_investors_focus  ON public.investors USING GIN(focus_area);
CREATE INDEX IF NOT EXISTS idx_investors_stage  ON public.investors USING GIN(stage);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON public.startups(industry);
CREATE INDEX IF NOT EXISTS idx_verification_exp ON public.verification_codes(expires_at);

-- ────────────────────────────────────────────────────────────
-- 9. Supabase Auth → users 테이블 자동 동기화 트리거
--    회원가입(Supabase auth.signUp) 시 public.users에 자동 반영
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    user_type,
    phone,
    company,
    portfolio,
    bio,
    su_name, su_nationality, su_age, su_gender, su_job, su_sns, su_bio, su_referral,
    co_name, co_founded, co_homepage, co_biz_type, co_address, co_stage,
    co_keywords, co_cofounder, co_cur_invest_stage, co_cur_invest_amt,
    co_hope_invest_stage, co_hope_invest_amt,
    inv_type, inv_role, inv_homepage, inv_sns,
    marketing_agree,
    role,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'startup'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'portfolio',
    NEW.raw_user_meta_data->>'bio',
    -- 스타트업 개인정보
    NEW.raw_user_meta_data->>'su_name',
    NEW.raw_user_meta_data->>'su_nationality',
    NEW.raw_user_meta_data->>'su_age',
    NEW.raw_user_meta_data->>'su_gender',
    NEW.raw_user_meta_data->>'su_job',
    NEW.raw_user_meta_data->>'su_sns',
    NEW.raw_user_meta_data->>'su_bio',
    NEW.raw_user_meta_data->>'su_referral',
    -- 스타트업 회사정보
    NEW.raw_user_meta_data->>'co_name',
    NEW.raw_user_meta_data->>'co_founded',
    NEW.raw_user_meta_data->>'co_homepage',
    NEW.raw_user_meta_data->>'co_biz_type',
    NEW.raw_user_meta_data->>'co_address',
    NEW.raw_user_meta_data->>'co_stage',
    NEW.raw_user_meta_data->>'co_keywords',
    NEW.raw_user_meta_data->>'co_cofounder',
    NEW.raw_user_meta_data->>'co_cur_invest_stage',
    NEW.raw_user_meta_data->>'co_cur_invest_amt',
    NEW.raw_user_meta_data->>'co_hope_invest_stage',
    NEW.raw_user_meta_data->>'co_hope_invest_amt',
    -- 투자자 정보
    NEW.raw_user_meta_data->>'inv_type',
    NEW.raw_user_meta_data->>'inv_role',
    NEW.raw_user_meta_data->>'inv_homepage',
    NEW.raw_user_meta_data->>'inv_sns',
    false,
    'user',
    CURRENT_DATE
  )
  ON CONFLICT (email) DO UPDATE SET
    name          = COALESCE(EXCLUDED.name, public.users.name),
    user_type     = COALESCE(EXCLUDED.user_type, public.users.user_type),
    phone         = COALESCE(EXCLUDED.phone, public.users.phone),
    company       = COALESCE(EXCLUDED.company, public.users.company),
    portfolio     = COALESCE(EXCLUDED.portfolio, public.users.portfolio),
    bio           = COALESCE(EXCLUDED.bio, public.users.bio),
    updated_at    = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 트리거 실패 시 회원가입 자체는 유지 (로그만 남김)
    RAISE WARNING 'handle_new_auth_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 트리거 등록 (이미 있으면 덮어쓰기)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ────────────────────────────────────────────────────────────
-- 10. RLS (Row Level Security) 정책
-- ────────────────────────────────────────────────────────────

-- users 테이블
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 본인 정보 조회
CREATE POLICY "users: 본인 조회" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 본인 정보 수정
CREATE POLICY "users: 본인 수정" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 트리거(service role)에서 INSERT 허용
CREATE POLICY "users: service role insert" ON public.users
  FOR INSERT WITH CHECK (true);

-- bookmarks 테이블
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks: 본인 조회" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks: 본인 추가" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks: 본인 삭제" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- investors 테이블 (전체 공개 읽기)
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investors: 전체 공개 읽기" ON public.investors
  FOR SELECT USING (true);

CREATE POLICY "investors: service role 쓰기" ON public.investors
  FOR ALL USING (auth.role() = 'service_role');

-- startups 테이블 (전체 공개 읽기)
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "startups: 전체 공개 읽기" ON public.startups
  FOR SELECT USING (true);

CREATE POLICY "startups: service role 쓰기" ON public.startups
  FOR ALL USING (auth.role() = 'service_role');

-- funds 테이블 (전체 공개 읽기)
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funds: 전체 공개 읽기" ON public.funds
  FOR SELECT USING (true);

CREATE POLICY "funds: service role 쓰기" ON public.funds
  FOR ALL USING (auth.role() = 'service_role');

-- notices 테이블 (전체 공개 읽기)
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices: 전체 공개 읽기" ON public.notices
  FOR SELECT USING (true);

CREATE POLICY "notices: service role 쓰기" ON public.notices
  FOR ALL USING (auth.role() = 'service_role');

-- verification_codes 테이블
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_codes: service role 전용" ON public.verification_codes
  FOR ALL USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────
-- 11. 백엔드 서비스 롤 (anon key로 users 조회 허용)
--     프론트에서 중복 아이디 체크 시 profiles 테이블 사용
-- ────────────────────────────────────────────────────────────
-- 아이디 중복 확인용 profiles 뷰 (anon 읽기 허용)
CREATE OR REPLACE VIEW public.profiles AS
  SELECT id, user_id AS username, user_type, company, created_at
  FROM public.users;

GRANT SELECT ON public.profiles TO anon, authenticated;

-- 이메일 중복 확인용 RPC 함수 (anon에서 호출 가능, SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE email = check_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists TO anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- 12. Supabase Auth 설정 안내 (SQL Editor에서 직접 실행 불가)
-- ────────────────────────────────────────────────────────────
/*
  Supabase Dashboard에서 직접 설정 필요:

  [Authentication > Settings]
  - Site URL: 배포 도메인 (예: https://vcroute.com)
  - Redirect URLs: 배포 도메인 + /dashboard.html 등
  - Email Confirmations: 운영 환경에서 활성화 권장
  - JWT expiry: 604800 (7일)

  [Authentication > Email Templates]
  - 확인 이메일, 비밀번호 재설정 이메일 한국어 커스터마이징

  [API > Settings]
  - anon key → frontend/js/config.js 의 SUPABASE_ANON_KEY
  - service_role key → backend/.env 의 SUPABASE_SERVICE_KEY

  [Storage] (로고/이미지 업로드 사용 시)
  - avatars 버킷 생성 (Public)
  - documents 버킷 생성 (Private, 인증 후 접근)
*/

-- ────────────────────────────────────────────────────────────
-- 13. 사용자 데이터 테이블 (계정 기반 저장)
-- ────────────────────────────────────────────────────────────

-- AI 매칭 이력
CREATE TABLE IF NOT EXISTS public.user_ai_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text,
  match_score integer DEFAULT 0,
  fund_name text,
  company_name text,
  industry text,
  gp_name text,
  gp_company text,
  gp_email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_ai_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai history" ON public.user_ai_history
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_history_user ON public.user_ai_history(user_id);

-- 자료보관함
CREATE TABLE IF NOT EXISTS public.user_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT '기타',
  badge text DEFAULT 'IR',
  size text DEFAULT '',
  date text DEFAULT '',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own files" ON public.user_files
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_user ON public.user_files(user_id);

-- 지원사업 이벤트
CREATE TABLE IF NOT EXISTS public.user_support_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  org text DEFAULT '',
  color text DEFAULT '#2563eb',
  bg_color text DEFAULT '#dbeafe',
  start_date text DEFAULT '',
  end_date text DEFAULT '',
  category text DEFAULT '기타',
  apply boolean DEFAULT false,
  result text DEFAULT null,
  amount text DEFAULT '',
  description text DEFAULT '',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_support_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own support events" ON public.user_support_events
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_support_events_user ON public.user_support_events(user_id);

-- ────────────────────────────────────────────────────────────
-- 14. 완료 확인 쿼리
-- ────────────────────────────────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

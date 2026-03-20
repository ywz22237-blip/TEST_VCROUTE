-- user_credits 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  simple_cr integer NOT NULL DEFAULT 1,
  premium_cr integer NOT NULL DEFAULT 0,
  reanalysis_cr integer NOT NULL DEFAULT 0,
  reanalysis_expires_at timestamptz,
  last_simple_reset date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 본인 크레딧만 조회 가능
CREATE POLICY "Users can read own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- 신규 유저 가입 시 자동 크레딧 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 등록
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

// Supabase Edge Function: 네이버 OAuth 처리
// Deploy: supabase functions deploy naver-auth
//
// 필요한 Supabase Secrets (supabase secrets set 명령으로 등록):
//   NAVER_CLIENT_ID      — 네이버 개발자 센터에서 발급
//   NAVER_CLIENT_SECRET  — 네이버 개발자 센터에서 발급
//   SUPABASE_SERVICE_ROLE_KEY — Supabase Dashboard > Settings > API > service_role key

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NAVER_CLIENT_ID = Deno.env.get("NAVER_CLIENT_ID")!;
const NAVER_CLIENT_SECRET = Deno.env.get("NAVER_CLIENT_SECRET")!;

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const site = url.searchParams.get("site") || "https://your-site.com";

  if (!code) {
    return Response.redirect(`${site}/pages/auth-callback.html?error=no_code`, 302);
  }

  try {
    // 1. 네이버 액세스 토큰 교환
    const tokenRes = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code` +
      `&client_id=${NAVER_CLIENT_ID}` +
      `&client_secret=${NAVER_CLIENT_SECRET}` +
      `&code=${code}`,
      { method: "GET", headers: { "X-Naver-Client-Id": NAVER_CLIENT_ID, "X-Naver-Client-Secret": NAVER_CLIENT_SECRET } }
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("네이버 토큰 발급 실패: " + JSON.stringify(tokenData));
    }

    // 2. 네이버 유저 프로필 조회
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    const naver = profileData.response;

    if (!naver?.email) {
      throw new Error("네이버 이메일 정보를 가져올 수 없습니다.");
    }

    // 3. Supabase admin 클라이언트로 유저 생성/조회
    const adminSb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 기존 유저 조회
    const { data: existingUsers } = await adminSb.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === naver.email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // 네이버 메타데이터 업데이트
      await adminSb.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: naver.name || existingUser.user_metadata?.full_name,
          avatar_url: naver.profile_image || existingUser.user_metadata?.avatar_url,
          naver_id: naver.id,
          provider: "naver",
        },
      });
    } else {
      // 신규 유저 생성
      const { data: newUser, error: createError } = await adminSb.auth.admin.createUser({
        email: naver.email,
        email_confirm: true,
        user_metadata: {
          full_name: naver.name || "",
          avatar_url: naver.profile_image || "",
          naver_id: naver.id,
          provider: "naver",
        },
      });
      if (createError) throw createError;
      userId = newUser.user!.id;
    }

    // 4. 일회용 로그인 링크 생성 후 세션 발급
    const { data: linkData, error: linkError } = await adminSb.auth.admin.generateLink({
      type: "magiclink",
      email: naver.email,
    });
    if (linkError) throw linkError;

    // hashed_token에서 세션 교환
    const anonSb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = new URL(linkData.properties.action_link).searchParams.get("token");
    const { data: sessionData, error: sessionError } = await anonSb.auth.verifyOtp({
      type: "magiclink",
      token: token!,
      email: naver.email,
    });

    if (sessionError || !sessionData.session) {
      throw sessionError || new Error("세션 생성 실패");
    }

    const callbackUrl =
      `${site}/pages/auth-callback.html` +
      `?access_token=${encodeURIComponent(sessionData.session.access_token)}` +
      `&refresh_token=${encodeURIComponent(sessionData.session.refresh_token)}`;

    return Response.redirect(callbackUrl, 302);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("naver-auth error:", message);
    return Response.redirect(
      `${site}/pages/auth-callback.html?error=${encodeURIComponent(message)}`,
      302
    );
  }
});

// ====================================================
// Supabase 기반 인증 관리
// ====================================================

let _supabase = null;

function getSupabase() {
  if (!_supabase && typeof window !== "undefined" && window.supabase) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

function getBasePath() {
  return window.location.pathname.includes("/pages/") ? "" : "pages/";
}

function getHomePath() {
  return window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
}

// ── 유저 정보 변환 ─────────────────────────────────

function supabaseUserToLocal(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    name: meta.full_name || meta.name || meta.user_name || user.email,
    avatar: meta.avatar_url || meta.picture || "",
    provider: (user.app_metadata || {}).provider || "email",
    userType: meta.userType || meta.user_type || "startup",
    verified: !!user.email_confirmed_at,
    userId: meta.username || meta.full_name || "",
    company: meta.company || "",
    phone: meta.phone || "",
    portfolio: meta.portfolio || "",
    bio: meta.bio || "",
    logoUrl: meta.avatar_url || meta.picture || "",
    investTarget: meta.investTarget || "",
    ceoAge: meta.ceoAge || "",
    gender: meta.gender || "",
  };
}

// ── 세션 확인 ─────────────────────────────────────

async function isLoggedIn() {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session) return true;
  }
  return !!(localStorage.getItem(STORAGE_KEYS.TOKEN) && localStorage.getItem(STORAGE_KEYS.USER));
}

async function getUserInfo() {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getUser();
    if (data.user) return supabaseUserToLocal(data.user);
  }
  const cached = localStorage.getItem(STORAGE_KEYS.USER);
  return cached ? JSON.parse(cached) : null;
}

// ── 소셜 OAuth 로그인 ─────────────────────────────

async function socialLogin(provider) {
  const sb = getSupabase();
  if (!sb) {
    alert("인증 모듈 로드 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  if (provider === "naver") {
    // 네이버: Supabase Edge Function 경유
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem("naver_oauth_state", state);
    const redirectUri = encodeURIComponent(
      SUPABASE_URL + "/functions/v1/naver-auth?site=" + encodeURIComponent(window.location.origin)
    );
    window.location.href =
      `https://nid.naver.com/oauth2.0/authorize?response_type=code` +
      `&client_id=__NAVER_CLIENT_ID__` +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}`;
    return;
  }

  const callbackUrl = window.location.origin + "/pages/auth-callback.html";
  const { error } = await sb.auth.signInWithOAuth({
    provider: provider, // "google" | "kakao"
    options: { redirectTo: callbackUrl },
  });

  if (error) {
    alert("로그인 중 오류가 발생했습니다: " + error.message);
  }
}

// ── 아이디 로그인 ─────────────────────────────────

async function handleLogin(event) {
  event.preventDefault();
  const sb = getSupabase();
  if (!sb) return;

  const userId = document.getElementById("loginId").value.trim();
  const password = document.getElementById("password").value;
  const btn = event.target.querySelector('[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = "로그인 중..."; }

  const resetBtn = () => {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> 로그인'; }
  };

  // 아이디 → 이메일 변환 (백엔드 조회)
  let email;
  try {
    const res = await fetch("/api/auth/find-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (!json.success || !json.email) {
      resetBtn();
      alert("존재하지 않는 아이디입니다.");
      return;
    }
    email = json.email;
  } catch {
    resetBtn();
    alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // Supabase Auth 로그인
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  resetBtn();

  if (error) {
    const msg = error.message.includes("Invalid login credentials")
      ? "아이디 또는 비밀번호가 올바르지 않습니다."
      : error.message;
    alert(msg);
    return;
  }

  const userInfo = supabaseUserToLocal(data.user);
  localStorage.setItem(STORAGE_KEYS.TOKEN, data.session.access_token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
  window.location.href = getHomePath();
}

// ── 회원가입 ──────────────────────────────────────

async function handleRegister(event) {
  event.preventDefault();
  const sb = getSupabase();
  if (!sb) return;

  const name = (document.getElementById("name")?.value || "").trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword")?.value || password;

  if (password !== confirmPassword) { alert("비밀번호가 일치하지 않습니다."); return; }
  if (password.length < 6) { alert("비밀번호는 6자 이상이어야 합니다."); return; }

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) { alert(error.message); return; }

  if (data.session) {
    const userInfo = supabaseUserToLocal(data.user);
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.session.access_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
    window.location.href = getHomePath();
  } else {
    alert("이메일 인증 링크를 발송했습니다. 이메일을 확인해주세요.");
    window.location.href = getBasePath() + "login.html";
  }
}

// ── 로그아웃 ──────────────────────────────────────

async function logout() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  await updateAuthUI();
  window.location.href = getHomePath();
}

// ── Auth UI 업데이트 ──────────────────────────────

async function updateAuthUI() {
  const container = document.querySelector(".auth-buttons");
  if (!container) return;

  const langToggle = container.querySelector(".lang-toggle");
  const langHTML = langToggle ? langToggle.outerHTML : "";
  const base = getBasePath();

  const user = await getUserInfo();

  if (user) {
    container.innerHTML = `
      ${langHTML}
      <div class="user-menu">
        <span class="user-name">${user.name || user.email}님</span>
        <a href="${base}dashboard.html?tab=profile" class="btn-mypage">내정보</a>
        <button class="logout-btn" onclick="logout()">로그아웃</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      ${langHTML}
      <a href="${base}login.html" class="btn-login">로그인</a>
      <a href="${base}register.html" class="btn-register">회원가입</a>
    `;
  }
}

// ── Auth 상태 리스너 ──────────────────────────────

function initAuthListener() {
  const sb = getSupabase();
  if (!sb) return;

  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      const userInfo = supabaseUserToLocal(session.user);
      localStorage.setItem(STORAGE_KEYS.TOKEN, session.access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    updateAuthUI();
  });
}

// ── 데모 로그인 ───────────────────────────────────

function demoLogin() {
  const demoUser = {
    name: "박준호",
    email: "venture@ventureplatform.co.kr",
    company: "주식회사 벤처플랫폼",
    userType: "startup",
    verified: true,
  };
  localStorage.setItem(STORAGE_KEYS.TOKEN, "demo-token-" + Date.now());
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
  updateAuthUI();
  alert("데모 로그인 성공!");
}

// ── 초기화 ────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const tryInit = (attempts) => {
    if (window.supabase) {
      initAuthListener();
      updateAuthUI();
    } else if (attempts < 30) {
      setTimeout(() => tryInit(attempts + 1), 100);
    } else {
      updateAuthUI(); // localStorage fallback
    }
  };
  tryInit(0);
});

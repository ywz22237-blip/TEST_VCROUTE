// 인증 상태 관리 및 UI 업데이트

// 현재 페이지 위치에 따라 경로 접두사 결정
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes("/pages/")) {
    return ""; // pages/ 내부에서는 상대경로 사용
  }
  return "pages/"; // 루트에서는 pages/ 접두사
}

function getHomePath() {
  const path = window.location.pathname;
  if (path.includes("/pages/")) {
    return "../index.html";
  }
  return "index.html";
}

// 로그인 상태 확인
function isLoggedIn() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return !!(token && user);
}

// 사용자 정보 가져오기
function getUserInfo() {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
}

// 로그인 처리
function login(token, userInfo) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
  updateAuthUI();
}

// 로그아웃 처리
function logout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  updateAuthUI();
  window.location.href = getHomePath();
}

// 인증 UI 업데이트
function updateAuthUI() {
  const authButtonsContainer = document.querySelector(".auth-buttons");

  if (!authButtonsContainer) return;

  // Language 토글이 있는지 확인하고 보존
  const langToggle = authButtonsContainer.querySelector(".lang-toggle");
  const langToggleHTML = langToggle ? langToggle.outerHTML : "";

  const base = getBasePath();

  if (isLoggedIn()) {
    // 로그인 상태: Language 토글 + 내정보 + 로그아웃 버튼 표시
    const user = getUserInfo();
    authButtonsContainer.innerHTML = `
      ${langToggleHTML}
      <div class="user-menu">
        <span class="user-name">${user.name || user.email}님</span>
        <a href="${base}mypage.html" class="btn-mypage">내정보</a>
        <button class="logout-btn" onclick="logout()">로그아웃</button>
      </div>
    `;
  } else {
    // 비로그인 상태: Language 토글 + 로그인 + 회원가입 버튼 표시
    authButtonsContainer.innerHTML = `
      ${langToggleHTML}
      <a href="${base}login.html" class="btn-login">로그인</a>
      <a href="${base}register.html" class="btn-register">회원가입</a>
    `;
  }
}

// 페이지 로드 시 인증 상태 확인 및 UI 업데이트
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
});

// 로그인 폼 처리 (로그인 페이지용)
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(
      API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      // 로그인 성공
      login(data.token, data.user);
      alert("로그인 성공!");
      window.location.href = getHomePath();
    } else {
      // 로그인 실패
      alert(data.message || "로그인에 실패했습니다.");
    }
  } catch (error) {
    console.error("로그인 오류:", error);
    alert("서버 연결에 실패했습니다.");
  }
}

// 회원가입 폼 처리 (회원가입 페이지용) - 레거시 호환
async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  try {
    const response = await fetch(
      API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REGISTER,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      alert("회원가입이 완료되었습니다!");
      window.location.href = getBasePath() + "login.html";
    } else {
      alert(data.message || "회원가입에 실패했습니다.");
    }
  } catch (error) {
    console.error("회원가입 오류:", error);
    alert("서버 연결에 실패했습니다.");
  }
}

// 데모용: 임시 로그인 (백엔드 없이 테스트)
function demoLogin() {
  const demoUser = {
    name: "박준호",
    userId: "venture_platform",
    email: "venture@ventureplatform.co.kr",
    phone: "050219234562",
    company: "주식회사 벤처플랫폼",
    userType: "startup",
    createdAt: "2024-06-01",
    portfolio: "https://ventureplatform.biz/",
    bio: "스타트업과 투자자를 연결하는 VC 라우트 플랫폼 운영사입니다. AI 기반 매칭 시스템으로 최적의 투자 파트너를 찾아드립니다.",
    verified: true,
    investTarget: "5억 ~ 20억원",
    ceoAge: 35,
    gender: "남성",
  };
  const demoToken = "demo-token-" + Date.now();

  login(demoToken, demoUser);
  alert("데모 로그인 성공!");
}

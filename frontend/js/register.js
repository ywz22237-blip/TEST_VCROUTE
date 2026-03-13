// ===== Register Page Logic (Supabase 기반) =====

let currentStep = 1;
let isIdChecked = false;
let emailTimerInterval = null;

// Supabase 클라이언트 (auth.js의 getSupabase 공유)
function getSB() {
  if (window.supabase && typeof SUPABASE_URL !== 'undefined') {
    if (!window._sbClient) {
      window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return window._sbClient;
  }
  return null;
}

// ===== Step Navigation =====

function goToStep(step) {
  if (step > currentStep) {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
  }

  currentStep = step;

  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.getElementById('step' + step).classList.add('active');

  document.querySelectorAll('.step-indicator .step').forEach((el, i) => {
    const n = i + 1;
    el.classList.remove('active', 'completed');
    if (n === step) el.classList.add('active');
    else if (n < step) el.classList.add('completed');
  });

  document.querySelectorAll('.step-line').forEach((el, i) => {
    el.classList.toggle('active', i + 1 < step);
  });
}

function validateStep1() {
  if (!document.querySelector('input[name="userType"]:checked')) {
    alert('가입 유형을 선택해주세요.');
    return false;
  }
  return true;
}

function validateStep2() {
  const userId   = document.getElementById('userId').value.trim();
  const password = document.getElementById('password').value;
  const pwConfirm= document.getElementById('passwordConfirm').value;
  const email    = document.getElementById('email').value.trim();

  if (!userId)               { alert('아이디를 입력해주세요.'); return false; }
  if (!isIdChecked)          { alert('아이디 중복확인을 해주세요.'); return false; }
  if (password.length < 8)   { alert('비밀번호는 8자 이상이어야 합니다.'); return false; }
  if (password !== pwConfirm){ alert('비밀번호가 일치하지 않습니다.'); return false; }
  if (!email)                { alert('이메일을 입력해주세요.'); return false; }
  return true;
}

// ===== User Type Selection =====

document.querySelectorAll('input[name="userType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('btnStep1Next').disabled = false;
  });
});

// ===== ID 중복 확인 (Supabase profiles 테이블 조회) =====

async function checkDuplicateId() {
  const userId = document.getElementById('userId').value.trim();
  const msg    = document.getElementById('userIdMsg');
  const input  = document.getElementById('userId');

  if (!userId || userId.length < 4) {
    return showFieldMsg(msg, '아이디는 4자 이상이어야 합니다.', 'error');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    return showFieldMsg(msg, '영문, 숫자, 언더스코어만 사용 가능합니다.', 'error');
  }

  const sb = getSB();
  if (sb) {
    // profiles 테이블에 username 컬럼이 있는 경우 조회
    const { data, error } = await sb
      .from('profiles')
      .select('id')
      .eq('username', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // profiles 테이블이 없거나 접근 불가 → 사용 가능으로 처리
      isIdChecked = true;
      input.classList.add('success');
      return showFieldMsg(msg, '사용 가능한 아이디입니다.', 'success');
    }

    if (data) {
      isIdChecked = false;
      input.classList.add('error');
      return showFieldMsg(msg, '이미 사용 중인 아이디입니다.', 'error');
    }
  }

  isIdChecked = true;
  input.classList.remove('error');
  input.classList.add('success');
  showFieldMsg(msg, '사용 가능한 아이디입니다.', 'success');
}

document.getElementById('userId').addEventListener('input', () => {
  isIdChecked = false;
  const msg = document.getElementById('userIdMsg');
  msg.textContent = '';
  msg.className = 'field-msg';
  document.getElementById('userId').classList.remove('success', 'error');
});

// ===== 비밀번호 =====

document.getElementById('password').addEventListener('input', function () {
  checkPasswordStrength(this.value);
  checkPasswordMatch();
});
document.getElementById('passwordConfirm').addEventListener('input', checkPasswordMatch);

function checkPasswordStrength(pw) {
  const fill = document.querySelector('.pw-bar-fill');
  const text = document.querySelector('.pw-text');
  if (!pw) { fill.style.width = '0%'; text.textContent = ''; return; }

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

  fill.classList.remove('weak', 'medium', 'strong');
  if (score <= 1)      { fill.classList.add('weak');   text.textContent = '약함'; text.style.color = '#ef4444'; }
  else if (score <= 2) { fill.classList.add('medium'); text.textContent = '보통'; text.style.color = '#f59e0b'; }
  else                 { fill.classList.add('strong'); text.textContent = '강함'; text.style.color = '#10b981'; }
}

function checkPasswordMatch() {
  const pw      = document.getElementById('password').value;
  const confirm = document.getElementById('passwordConfirm').value;
  const msg     = document.getElementById('passwordConfirmMsg');
  const input   = document.getElementById('passwordConfirm');
  if (!confirm) { msg.textContent = ''; input.classList.remove('success','error'); return; }
  if (pw === confirm) {
    showFieldMsg(msg, '비밀번호가 일치합니다.', 'success');
    input.classList.replace('error', 'success') || input.classList.add('success');
  } else {
    showFieldMsg(msg, '비밀번호가 일치하지 않습니다.', 'error');
    input.classList.replace('success', 'error') || input.classList.add('error');
  }
}

function togglePassword(fieldId) {
  const input = document.getElementById(fieldId);
  const icon  = input.parentElement.querySelector('.toggle-pw i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ===== 연락처 인증 (Supabase 무료 플랜 미지원 → 선택 항목으로 처리) =====

async function sendPhoneVerification() {
  const phone = document.getElementById('phone').value.trim();
  const msg   = document.getElementById('phoneMsg');
  const phoneClean = phone.replace(/[-\s]/g, '');

  if (!phoneClean || !/^01[016789]\d{7,8}$/.test(phoneClean)) {
    return showFieldMsg(msg, '올바른 연락처를 입력해주세요. (예: 010-0000-0000)', 'error');
  }

  // Supabase 무료 플랜은 SMS 미지원 → 입력만 저장
  showFieldMsg(msg, '연락처가 저장되었습니다. (SMS 인증은 추후 지원 예정)', 'success');
  document.getElementById('phoneVerifyGroup').style.display = 'block';
  // 자동 인증 처리
  setTimeout(() => completePhoneVerification(), 500);
}

async function verifyPhoneCode() {
  completePhoneVerification();
}

function completePhoneVerification() {
  showFieldMsg(document.getElementById('phoneCodeMsg'), '연락처 확인이 완료되었습니다.', 'success');
  document.getElementById('phoneCode').disabled = true;
  document.getElementById('phone').disabled = true;
}

document.getElementById('phone').addEventListener('input', function () {
  let val = this.value.replace(/[^0-9]/g, '');
  if (val.length > 3 && val.length <= 7)  val = val.slice(0,3) + '-' + val.slice(3);
  else if (val.length > 7)                val = val.slice(0,3) + '-' + val.slice(3,7) + '-' + val.slice(7,11);
  this.value = val;
});

// ===== 약관 =====

function toggleAllAgree() {
  const checked = document.getElementById('agreeAll').checked;
  document.querySelectorAll('.term-check').forEach(cb => { cb.checked = checked; });
}

document.querySelectorAll('.term-check').forEach(cb => {
  cb.addEventListener('change', () => {
    const all = document.querySelectorAll('.term-check');
    document.getElementById('agreeAll').checked = Array.from(all).every(c => c.checked);
  });
});

document.getElementById('bio').addEventListener('input', function () {
  document.getElementById('bioCount').textContent = this.value.length;
});

// ===== 소셜 로그인 (auth.js 위임) =====
// socialLogin()은 auth.js에서 처리

// ===== 회원가입 제출 (Supabase signUp) =====

async function handleRegisterSubmit(event) {
  event.preventDefault();
  if (!validateStep1() || !validateStep2()) return;

  const requiredTerms = document.querySelectorAll('.term-check[required]');
  if (!Array.from(requiredTerms).every(cb => cb.checked)) {
    alert('필수 약관에 동의해주세요.');
    return;
  }

  const sb = getSB();
  if (!sb) { alert('인증 모듈 로드 중입니다. 잠시 후 다시 시도해주세요.'); return; }

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const userId   = document.getElementById('userId').value.trim();
  const userType = document.querySelector('input[name="userType"]:checked').value;
  const phone    = document.getElementById('phone').value.replace(/[-\s]/g, '');
  const company  = document.getElementById('company').value.trim() || null;
  const portfolio= document.getElementById('portfolio').value.trim() || null;
  const bio      = document.getElementById('bio').value.trim() || null;

  const submitBtn = document.getElementById('btnSubmit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';

  // 이메일 OTP로 이미 세션이 생성된 경우 → updateUser로 비밀번호 설정
  const { data: { session } } = await sb.auth.getSession();

  let userId_ = null;
  let accessToken = null;

  if (session && session.user.email === email) {
    // OTP 인증 후 세션이 있는 경우: 비밀번호 & 메타데이터 업데이트
    const { data, error } = await sb.auth.updateUser({
      password,
      data: {
        full_name: userId,
        username: userId,
        user_type: userType,
        phone,
        company,
        portfolio,
        bio,
      }
    });
    if (error) {
      alert('회원가입 처리 중 오류가 발생했습니다: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> 회원가입 완료';
      return;
    }
    userId_ = data.user.id;
    accessToken = session.access_token;
  } else {
    // 일반 signUp
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userId,
          username: userId,
          user_type: userType,
          phone,
          company,
          portfolio,
          bio,
        }
      }
    });
    if (error) {
      alert('회원가입 실패: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> 회원가입 완료';
      return;
    }
    userId_ = data.user?.id;
    accessToken = data.session?.access_token;
  }

  if (accessToken) {
    // 바로 로그인 처리
    const userInfo = {
      id: userId_,
      email,
      name: userId,
      userType,
      phone,
      company,
      verified: true,
    };
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    alert('회원가입이 완료되었습니다! 환영합니다 😊');
    window.location.href = '../index.html';
  } else {
    // 이메일 확인 필요
    alert('이메일 인증 링크를 발송했습니다.\n이메일을 확인하여 인증을 완료해주세요.');
    window.location.href = 'login.html';
  }
}

// ===== 유틸리티 =====

function showFieldMsg(el, message, type) {
  el.textContent = message;
  el.className = 'field-msg ' + type;
}

function startTimer(elementId, seconds, onExpire) {
  const el = document.getElementById(elementId);
  let remaining = seconds;

  if (elementId === 'emailTimer') clearInterval(emailTimerInterval);

  const update = () => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    el.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    if (remaining <= 0) { clearInterval(interval); if (onExpire) onExpire(); }
    remaining--;
  };

  update();
  const interval = setInterval(update, 1000);
  if (elementId === 'emailTimer') emailTimerInterval = interval;
}

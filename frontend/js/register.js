// ===== Register Page Logic (Supabase 기반) =====

let currentStep = 1;
let isIdChecked = false;
let emailTimerInterval = null;
let keywords = [];

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

// ===== 회원 유형 헬퍼 =====

function getSelectedUserType() {
  const radio = document.querySelector('input[name="userType"]:checked');
  return radio ? radio.value : null;
}

// ===== Step Indicator 동적 업데이트 =====

function updateStepIndicator(userType) {
  const step3Label = document.getElementById('step3Label');
  const step4Indicator = document.getElementById('step4Indicator');
  const stepLine3 = document.getElementById('stepLine3');
  if (userType === 'startup') {
    if (step3Label) step3Label.textContent = '개인 정보';
    if (step4Indicator) step4Indicator.style.display = '';
    if (stepLine3) stepLine3.style.display = '';
  } else {
    if (step3Label) step3Label.textContent = '추가 정보';
    if (step4Indicator) step4Indicator.style.display = 'none';
    if (stepLine3) stepLine3.style.display = 'none';
  }
}

// ===== Step Navigation =====

function goToStep(step) {
  if (step > currentStep) {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
  }

  currentStep = step;

  // 모든 form-step 숨기기
  document.querySelectorAll('.form-step').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  // 보여줄 step 결정
  const userType = getSelectedUserType();
  let targetId;
  if (step === 3) {
    targetId = userType === 'startup' ? 'step3startup' : 'step3investor';
  } else if (step === 4) {
    targetId = 'step4startup';
  } else {
    targetId = 'step' + step;
  }

  const target = document.getElementById(targetId);
  if (target) {
    target.style.display = '';
    target.classList.add('active');
  }

  // Step indicator 업데이트
  const totalSteps = userType === 'startup' ? 4 : 3;
  document.querySelectorAll('.step-indicator .step').forEach((el, i) => {
    const n = i + 1;
    if (n > totalSteps) return;
    el.classList.remove('active', 'completed');
    if (n === step) el.classList.add('active');
    else if (n < step) el.classList.add('completed');
  });

  document.querySelectorAll('.step-line').forEach((el, i) => {
    el.classList.toggle('active', i + 1 < step);
  });
}

function validateStep1() {
  if (!getSelectedUserType()) {
    alert('가입 유형을 선택해주세요.');
    return false;
  }
  return true;
}

function validateStep2() {
  const userId    = document.getElementById('userId').value.trim();
  const password  = document.getElementById('password').value;
  const pwConfirm = document.getElementById('passwordConfirm').value;
  const email     = document.getElementById('email').value.trim();

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
    updateStepIndicator(radio.value);
  });
});

// step1 초기 활성화
(function initStep1() {
  const s1 = document.getElementById('step1');
  if (s1) { s1.style.display = ''; s1.classList.add('active'); }
})();

// ===== ID 중복 확인 =====

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
    const { data, error } = await sb
      .from('profiles')
      .select('id')
      .eq('username', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
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

// ===== 연락처 인증 =====

async function sendPhoneVerification() {
  const phone = document.getElementById('phone').value.trim();
  const msg   = document.getElementById('phoneMsg');
  const phoneClean = phone.replace(/[-\s]/g, '');

  if (!phoneClean || !/^01[016789]\d{7,8}$/.test(phoneClean)) {
    return showFieldMsg(msg, '올바른 연락처를 입력해주세요. (예: 010-0000-0000)', 'error');
  }

  showFieldMsg(msg, '연락처가 저장되었습니다. (SMS 인증은 추후 지원 예정)', 'success');
  document.getElementById('phoneVerifyGroup').style.display = 'block';
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

// ===== 투자자 형태 기타 직접입력 =====

document.addEventListener('DOMContentLoaded', () => {
  const invType = document.getElementById('inv_type');
  const invTypeCustom = document.getElementById('inv_type_custom');
  if (invType) {
    invType.addEventListener('change', () => {
      invTypeCustom.style.display = invType.value === '기타' ? '' : 'none';
    });
  }

  // 소개 글자수
  const suBio = document.getElementById('su_bio');
  if (suBio) {
    suBio.addEventListener('input', function () {
      document.getElementById('suBioCount').textContent = this.value.length;
    });
  }

  // 키워드 뱃지 입력
  const kwInput = document.getElementById('co_keywords_input');
  if (kwInput) {
    kwInput.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const val = this.value.trim();
        if (val && keywords.length < 3 && !keywords.includes(val)) {
          keywords.push(val);
          renderKeywordBadges();
        }
        this.value = '';
      } else if (e.key === 'Backspace' && !this.value && keywords.length > 0) {
        keywords.pop();
        renderKeywordBadges();
      }
    });
  }

  // 약관4
  document.querySelectorAll('.term-check4').forEach(cb => {
    cb.addEventListener('change', () => {
      const all = document.querySelectorAll('.term-check4');
      document.getElementById('agreeAll4').checked = Array.from(all).every(c => c.checked);
    });
  });
});

function renderKeywordBadges() {
  const container = document.getElementById('keywordBadges');
  const hidden = document.getElementById('co_keywords');
  if (!container) return;
  container.innerHTML = keywords.map((kw, i) =>
    `<span class="keyword-badge">${kw}<button type="button" onclick="removeKeyword(${i})" class="kw-remove">×</button></span>`
  ).join('');
  if (hidden) hidden.value = keywords.join(',');
  // 3개 초과 시 입력 비활성화
  const inp = document.getElementById('co_keywords_input');
  if (inp) inp.disabled = keywords.length >= 3;
}

function removeKeyword(idx) {
  keywords.splice(idx, 1);
  renderKeywordBadges();
}

// ===== 파일 업로드 파일명 표시 =====

function handleFileSelect(input, labelId) {
  const label = document.getElementById(labelId);
  if (label && input.files && input.files[0]) {
    label.textContent = input.files[0].name;
  }
}

// ===== 약관 =====

function toggleAllAgree() {
  const checked = document.getElementById('agreeAll').checked;
  document.querySelectorAll('.term-check').forEach(cb => { cb.checked = checked; });
}

function toggleAllAgree4() {
  const checked = document.getElementById('agreeAll4').checked;
  document.querySelectorAll('.term-check4').forEach(cb => { cb.checked = checked; });
}

document.querySelectorAll('.term-check').forEach(cb => {
  cb.addEventListener('change', () => {
    const all = document.querySelectorAll('.term-check');
    const agreeAll = document.getElementById('agreeAll');
    if (agreeAll) agreeAll.checked = Array.from(all).every(c => c.checked);
  });
});

// ===== 회원가입 제출 =====

async function handleRegisterSubmit(event) {
  event.preventDefault();
  if (!validateStep1() || !validateStep2()) return;

  const userType = getSelectedUserType();

  // 약관 체크 (유형에 따라 다른 체크박스)
  const isStartup = userType === 'startup';
  const termChecks = isStartup
    ? document.querySelectorAll('.term-check4[required]')
    : document.querySelectorAll('.term-check[required]');
  if (!Array.from(termChecks).every(cb => cb.checked)) {
    alert('필수 약관에 동의해주세요.');
    return;
  }

  const sb = getSB();
  if (!sb) { alert('인증 모듈 로드 중입니다. 잠시 후 다시 시도해주세요.'); return; }

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const userId   = document.getElementById('userId').value.trim();
  const phone    = document.getElementById('phone').value.replace(/[-\s]/g, '');

  // 투자자 추가정보
  const inv_company  = document.getElementById('inv_company')?.value.trim() || null;
  const inv_typeVal  = document.getElementById('inv_type')?.value || null;
  const inv_typeCustom = document.getElementById('inv_type_custom')?.value.trim() || null;
  const invType      = inv_typeVal === '기타' ? inv_typeCustom : inv_typeVal;
  const inv_role     = document.getElementById('inv_role')?.value.trim() || null;
  const inv_homepage = document.getElementById('inv_homepage')?.value.trim() || null;
  const inv_sns      = document.getElementById('inv_sns')?.value.trim() || null;

  // 스타트업 개인정보
  const su_name        = document.getElementById('su_name')?.value.trim() || null;
  const su_nationality = document.getElementById('su_nationality')?.value.trim() || null;
  const su_age         = document.getElementById('su_age')?.value || null;
  const su_gender      = document.getElementById('su_gender')?.value || null;
  const su_job         = document.getElementById('su_job')?.value.trim() || null;
  const su_sns         = document.getElementById('su_sns')?.value.trim() || null;
  const su_bio         = document.getElementById('su_bio')?.value.trim() || null;
  const su_referral    = document.getElementById('su_referral')?.value || null;

  // 스타트업 회사정보
  const co_name            = document.getElementById('co_name')?.value.trim() || null;
  const co_founded         = document.getElementById('co_founded')?.value || null;
  const co_homepage        = document.getElementById('co_homepage')?.value.trim() || null;
  const co_biz_type        = document.getElementById('co_biz_type')?.value || null;
  const co_address         = document.getElementById('co_address')?.value.trim() || null;
  const co_stage           = document.getElementById('co_stage')?.value || null;
  const co_keywords_val    = document.getElementById('co_keywords')?.value || null;
  const co_cofounder       = document.getElementById('co_cofounder')?.value || null;
  const co_cur_invest_stage= document.getElementById('co_cur_invest_stage')?.value || null;
  const co_cur_invest_amt  = document.getElementById('co_cur_invest_amt')?.value || null;
  const co_hope_invest_stage = document.getElementById('co_hope_invest_stage')?.value || null;
  const co_hope_invest_amt = document.getElementById('co_hope_invest_amt')?.value || null;

  // company / portfolio / bio 공통 매핑
  const company   = isStartup ? (co_name || su_name) : inv_company;
  const portfolio = isStartup ? co_homepage : inv_homepage;
  const bio       = isStartup ? su_bio : null;

  const submitBtnId = isStartup ? 'btnSubmit' : 'btnSubmitInvestor';
  const submitBtn = document.getElementById(submitBtnId);
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';

  const { data: { session } } = await sb.auth.getSession();

  let userId_ = null;
  let accessToken = null;

  const extraMeta = isStartup ? {
    su_name, su_nationality, su_age, su_gender, su_job, su_sns, su_bio, su_referral,
    co_name, co_founded, co_homepage, co_biz_type, co_address, co_stage,
    co_keywords: co_keywords_val, co_cofounder, co_cur_invest_stage, co_cur_invest_amt,
    co_hope_invest_stage, co_hope_invest_amt,
  } : {
    inv_type: invType, inv_role, inv_homepage, inv_sns,
  };

  if (session && session.user.email === email) {
    const { data, error } = await sb.auth.updateUser({
      password,
      data: { full_name: userId, username: userId, user_type: userType, phone, company, portfolio, bio, ...extraMeta }
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
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: {
        data: { full_name: userId, username: userId, user_type: userType, phone, company, portfolio, bio, ...extraMeta }
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

  try {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId, email, password, name: userId, userType,
        phone: phone || null, company: company || null, portfolio: portfolio || null, bio: bio || null,
        marketingAgree: false, ...extraMeta,
      }),
    });
  } catch { /* 무시 */ }

  if (accessToken) {
    const userInfo = { id: userId_, email, name: userId, userType, phone, company, verified: true };
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    alert('회원가입이 완료되었습니다! 환영합니다 😊');
    window.location.href = '../index.html';
  } else {
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

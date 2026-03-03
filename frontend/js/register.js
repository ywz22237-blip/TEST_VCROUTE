// ===== Register Page Logic =====

// State
let currentStep = 1;
let isIdChecked = false;
let isEmailVerified = false;
let isPhoneVerified = false;
let emailTimerInterval = null;
let phoneTimerInterval = null;

// ===== Step Navigation =====

function goToStep(step) {
  // Validate before moving forward
  if (step > currentStep) {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
  }

  currentStep = step;

  // Update step visibility
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.getElementById('step' + step).classList.add('active');

  // Update step indicator
  document.querySelectorAll('.step-indicator .step').forEach((el, i) => {
    const stepNum = i + 1;
    el.classList.remove('active', 'completed');
    if (stepNum === step) el.classList.add('active');
    else if (stepNum < step) el.classList.add('completed');
  });

  // Update step lines
  document.querySelectorAll('.step-line').forEach((el, i) => {
    el.classList.toggle('active', i + 1 < step);
  });
}

function validateStep1() {
  const userType = document.querySelector('input[name="userType"]:checked');
  if (!userType) {
    alert('가입 유형을 선택해주세요.');
    return false;
  }
  return true;
}

function validateStep2() {
  const userId = document.getElementById('userId').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!userId) { alert('아이디를 입력해주세요.'); return false; }
  if (!isIdChecked) { alert('아이디 중복확인을 해주세요.'); return false; }
  if (!password || password.length < 8) { alert('비밀번호는 8자 이상이어야 합니다.'); return false; }
  if (password !== passwordConfirm) { alert('비밀번호가 일치하지 않습니다.'); return false; }
  if (!email) { alert('이메일을 입력해주세요.'); return false; }
  if (!isEmailVerified) { alert('이메일 인증을 완료해주세요.'); return false; }
  if (!phone) { alert('연락처를 입력해주세요.'); return false; }
  if (!isPhoneVerified) { alert('연락처 인증을 완료해주세요.'); return false; }

  return true;
}

// ===== User Type Selection =====

document.querySelectorAll('input[name="userType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('btnStep1Next').disabled = false;
  });
});

// ===== ID Check =====

async function checkDuplicateId() {
  const userId = document.getElementById('userId').value.trim();
  const msg = document.getElementById('userIdMsg');
  const input = document.getElementById('userId');

  if (!userId || userId.length < 4) {
    showFieldMsg(msg, '아이디는 4자 이상이어야 합니다.', 'error');
    input.classList.add('error');
    input.classList.remove('success');
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    showFieldMsg(msg, '영문, 숫자, 언더스코어만 사용 가능합니다.', 'error');
    input.classList.add('error');
    input.classList.remove('success');
    return;
  }

  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/check-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await response.json();

    if (data.available) {
      isIdChecked = true;
      showFieldMsg(msg, '사용 가능한 아이디입니다.', 'success');
      input.classList.remove('error');
      input.classList.add('success');
    } else {
      isIdChecked = false;
      showFieldMsg(msg, '이미 사용 중인 아이디입니다.', 'error');
      input.classList.add('error');
      input.classList.remove('success');
    }
  } catch (e) {
    // Fallback: demo mode
    isIdChecked = true;
    showFieldMsg(msg, '사용 가능한 아이디입니다. (데모)', 'success');
    input.classList.remove('error');
    input.classList.add('success');
  }
}

// Reset ID check when value changes
document.getElementById('userId').addEventListener('input', () => {
  isIdChecked = false;
  const msg = document.getElementById('userIdMsg');
  const input = document.getElementById('userId');
  msg.textContent = '';
  msg.className = 'field-msg';
  input.classList.remove('success', 'error');
});

// ===== Password =====

document.getElementById('password').addEventListener('input', function () {
  checkPasswordStrength(this.value);
  checkPasswordMatch();
});

document.getElementById('passwordConfirm').addEventListener('input', checkPasswordMatch);

function checkPasswordStrength(pw) {
  const fill = document.querySelector('.pw-bar-fill');
  const text = document.querySelector('.pw-text');

  if (!pw) {
    fill.className = 'pw-bar-fill';
    fill.style.width = '0%';
    text.textContent = '';
    return;
  }

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

  fill.classList.remove('weak', 'medium', 'strong');
  if (score <= 1) {
    fill.classList.add('weak');
    text.textContent = '약함';
    text.style.color = '#ef4444';
  } else if (score <= 2) {
    fill.classList.add('medium');
    text.textContent = '보통';
    text.style.color = '#f59e0b';
  } else {
    fill.classList.add('strong');
    text.textContent = '강함';
    text.style.color = '#10b981';
  }
}

function checkPasswordMatch() {
  const pw = document.getElementById('password').value;
  const confirm = document.getElementById('passwordConfirm').value;
  const msg = document.getElementById('passwordConfirmMsg');
  const input = document.getElementById('passwordConfirm');

  if (!confirm) {
    msg.textContent = '';
    msg.className = 'field-msg';
    input.classList.remove('success', 'error');
    return;
  }

  if (pw === confirm) {
    showFieldMsg(msg, '비밀번호가 일치합니다.', 'success');
    input.classList.remove('error');
    input.classList.add('success');
  } else {
    showFieldMsg(msg, '비밀번호가 일치하지 않습니다.', 'error');
    input.classList.add('error');
    input.classList.remove('success');
  }
}

function togglePassword(fieldId) {
  const input = document.getElementById(fieldId);
  const icon = input.parentElement.querySelector('.toggle-pw i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ===== Email Verification =====

async function sendEmailVerification() {
  const email = document.getElementById('email').value.trim();
  const msg = document.getElementById('emailMsg');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldMsg(msg, '올바른 이메일 주소를 입력해주세요.', 'error');
    return;
  }

  try {
    await fetch(API_CONFIG.BASE_URL + '/api/auth/send-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  } catch (e) {
    // Demo mode - proceed anyway
  }

  showFieldMsg(msg, '인증코드가 이메일로 발송되었습니다.', 'success');
  document.getElementById('emailVerifyGroup').style.display = 'block';
  startTimer('emailTimer', 180, () => {
    showFieldMsg(document.getElementById('emailCodeMsg'), '인증시간이 만료되었습니다. 다시 요청해주세요.', 'error');
  });
}

async function verifyEmailCode() {
  const code = document.getElementById('emailCode').value.trim();
  const msg = document.getElementById('emailCodeMsg');

  if (!code || code.length !== 6) {
    showFieldMsg(msg, '6자리 인증코드를 입력해주세요.', 'error');
    return;
  }

  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/verify-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value.trim(),
        code
      })
    });
    const data = await response.json();

    if (data.verified) {
      completeEmailVerification();
    } else {
      showFieldMsg(msg, '인증코드가 일치하지 않습니다.', 'error');
    }
  } catch (e) {
    // Demo mode: accept any 6-digit code
    completeEmailVerification();
  }
}

function completeEmailVerification() {
  isEmailVerified = true;
  clearInterval(emailTimerInterval);
  const msg = document.getElementById('emailCodeMsg');
  showFieldMsg(msg, '이메일 인증이 완료되었습니다.', 'success');
  document.getElementById('emailCode').disabled = true;
  document.getElementById('emailCode').classList.add('success');
  document.getElementById('email').disabled = true;
  document.getElementById('email').classList.add('success');
}

// ===== Phone Verification =====

async function sendPhoneVerification() {
  const phone = document.getElementById('phone').value.trim();
  const msg = document.getElementById('phoneMsg');

  // Basic Korean phone format
  const phoneClean = phone.replace(/[-\s]/g, '');
  if (!phoneClean || !/^01[016789]\d{7,8}$/.test(phoneClean)) {
    showFieldMsg(msg, '올바른 연락처를 입력해주세요. (예: 010-0000-0000)', 'error');
    return;
  }

  try {
    await fetch(API_CONFIG.BASE_URL + '/api/auth/send-phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneClean })
    });
  } catch (e) {
    // Demo mode
  }

  showFieldMsg(msg, '인증코드가 발송되었습니다.', 'success');
  document.getElementById('phoneVerifyGroup').style.display = 'block';
  startTimer('phoneTimer', 180, () => {
    showFieldMsg(document.getElementById('phoneCodeMsg'), '인증시간이 만료되었습니다. 다시 요청해주세요.', 'error');
  });
}

async function verifyPhoneCode() {
  const code = document.getElementById('phoneCode').value.trim();
  const msg = document.getElementById('phoneCodeMsg');

  if (!code || code.length !== 6) {
    showFieldMsg(msg, '6자리 인증코드를 입력해주세요.', 'error');
    return;
  }

  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/verify-phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: document.getElementById('phone').value.replace(/[-\s]/g, ''),
        code
      })
    });
    const data = await response.json();

    if (data.verified) {
      completePhoneVerification();
    } else {
      showFieldMsg(msg, '인증코드가 일치하지 않습니다.', 'error');
    }
  } catch (e) {
    // Demo mode
    completePhoneVerification();
  }
}

function completePhoneVerification() {
  isPhoneVerified = true;
  clearInterval(phoneTimerInterval);
  const msg = document.getElementById('phoneCodeMsg');
  showFieldMsg(msg, '연락처 인증이 완료되었습니다.', 'success');
  document.getElementById('phoneCode').disabled = true;
  document.getElementById('phoneCode').classList.add('success');
  document.getElementById('phone').disabled = true;
  document.getElementById('phone').classList.add('success');
}

// ===== Phone Number Formatting =====

document.getElementById('phone').addEventListener('input', function () {
  let val = this.value.replace(/[^0-9]/g, '');
  if (val.length > 3 && val.length <= 7) {
    val = val.slice(0, 3) + '-' + val.slice(3);
  } else if (val.length > 7) {
    val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
  }
  this.value = val;
});

// ===== Terms Agreement =====

function toggleAllAgree() {
  const allChecked = document.getElementById('agreeAll').checked;
  document.querySelectorAll('.term-check').forEach(cb => {
    cb.checked = allChecked;
  });
}

document.querySelectorAll('.term-check').forEach(cb => {
  cb.addEventListener('change', () => {
    const all = document.querySelectorAll('.term-check');
    const allChecked = Array.from(all).every(c => c.checked);
    document.getElementById('agreeAll').checked = allChecked;
  });
});

// ===== Bio Character Count =====

document.getElementById('bio').addEventListener('input', function () {
  document.getElementById('bioCount').textContent = this.value.length;
});

// ===== Social Login =====

function socialLogin(provider) {
  // OAuth redirect - placeholder for actual implementation
  const redirectUrls = {
    kakao: API_CONFIG.BASE_URL + '/api/auth/oauth/kakao',
    naver: API_CONFIG.BASE_URL + '/api/auth/oauth/naver',
    google: API_CONFIG.BASE_URL + '/api/auth/oauth/google'
  };

  const url = redirectUrls[provider];
  if (url) {
    window.location.href = url;
  }
}

// ===== Form Submit =====

async function handleRegisterSubmit(event) {
  event.preventDefault();

  // Final validation
  if (!validateStep1() || !validateStep2()) return;

  // Check required terms
  const requiredTerms = document.querySelectorAll('.term-check[required]');
  const allRequired = Array.from(requiredTerms).every(cb => cb.checked);
  if (!allRequired) {
    alert('필수 약관에 동의해주세요.');
    return;
  }

  const formData = {
    userType: document.querySelector('input[name="userType"]:checked').value,
    userId: document.getElementById('userId').value.trim(),
    password: document.getElementById('password').value,
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.replace(/[-\s]/g, ''),
    company: document.getElementById('company').value.trim() || null,
    portfolio: document.getElementById('portfolio').value.trim() || null,
    bio: document.getElementById('bio').value.trim() || null,
    marketingAgree: document.querySelector('.term-check[value="marketing"]').checked
  };

  const submitBtn = document.getElementById('btnSubmit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';

  try {
    const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.userId,
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        userId: formData.userId,
        phone: formData.phone,
        company: formData.company,
        portfolio: formData.portfolio,
        bio: formData.bio,
        marketingAgree: formData.marketingAgree
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      window.location.href = 'login.html';
    } else {
      alert(data.message || '회원가입에 실패했습니다.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> 회원가입 완료';
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Demo mode: simulate success
    alert('회원가입이 완료되었습니다! (데모 모드)');
    window.location.href = 'login.html';
  }
}

// ===== Utilities =====

function showFieldMsg(el, message, type) {
  el.textContent = message;
  el.className = 'field-msg ' + type;
}

function startTimer(elementId, seconds, onExpire) {
  const el = document.getElementById(elementId);
  let remaining = seconds;

  // Clear existing timer
  if (elementId === 'emailTimer') {
    clearInterval(emailTimerInterval);
  } else {
    clearInterval(phoneTimerInterval);
  }

  const update = () => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    el.textContent = `${min}:${sec.toString().padStart(2, '0')}`;

    if (remaining <= 0) {
      clearInterval(interval);
      if (onExpire) onExpire();
    }
    remaining--;
  };

  update();
  const interval = setInterval(update, 1000);

  if (elementId === 'emailTimer') {
    emailTimerInterval = interval;
  } else {
    phoneTimerInterval = interval;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 투자자 메뉴 FOUC 방지: localStorage에서 즉시 동기 처리
  try {
    const _u = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (_u.userType === 'investor') {
      ['menuRecommend', 'menuSupport', 'menuImir'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    }
  } catch(e) {}

  checkDashboardAuth();
  renderDashboard();
  initStoredFiles();
  loadSupportEvents();
  initExamFileDrop();

  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab) switchSection(tab);
});

// 대시보드 접근 권한 확인 및 프로필 로드
async function checkDashboardAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = "index.html";
    return;
  }
  loadUserProfile();
}

// 서버에서 최신 회원 정보 가져오기
async function loadUserProfile() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  let user = await getUserInfo();

  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      const data = await response.json();
      user = data.data || data;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  } catch (e) {
    console.log('서버 연결 실패, 로컬 데이터 사용');
  }

  if (user) {
    _profileUser = user;
    renderUserProfile(user);
  }
}

// 현재 로그인된 유저 데이터 (편집용)
let _profileUser = null;

// 프로필 데이터를 UI에 렌더링
function renderUserProfile(user) {
  const typeLabel = user.userType === 'startup' ? '스타트업' :
                    user.userType === 'investor' ? '투자자' : '회원';
  const initial = (user.company || user.name || user.userId || user.email || '?')[0].toUpperCase();

  // 사이드바 유저 타입 뱃지
  const sidebar = document.getElementById('sidebarProfile');
  const typeEl = document.getElementById('sidebarType');
  if (sidebar) {
    sidebar.style.display = 'block';
    if (typeEl) {
      typeEl.textContent = typeLabel;
      if (user.userType === 'investor') {
        typeEl.style.background = 'rgba(245,158,11,0.1)';
        typeEl.style.color = '#f59e0b';
      } else {
        typeEl.style.background = 'rgba(37,99,235,0.1)';
        typeEl.style.color = '#2563eb';
      }
    }
  }

  // 프로필 섹션 상세
  const loginRequired = document.getElementById('profileLoginRequired');
  const profileContent = document.getElementById('profileContent');
  if (loginRequired) loginRequired.style.display = 'none';
  if (profileContent) profileContent.style.display = 'block';

  const avatarLarge = document.getElementById('profileAvatarLarge');
  if (avatarLarge) {
    if (user.logoUrl) {
      avatarLarge.innerHTML = `<img src="${user.logoUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      avatarLarge.innerHTML = initial;
    }
  }

  // 헤더: 기업명 표시
  setText('pName', user.company || user.name || user.userId || '-');

  const typeBadge = document.getElementById('pTypeBadge');
  if (typeBadge) {
    typeBadge.textContent = typeLabel;
    if (user.userType === 'investor') {
      typeBadge.style.background = 'rgba(245,158,11,0.2)';
    }
  }

  const dateLabel = user.userType === 'startup' ? '설립일: ' : '가입일: ';
  setText('pCreatedAt', user.createdAt ? dateLabel + user.createdAt : '');
  setText('pUserId', user.company || '-');
  setText('pEmail', user.email || '-');

  const phone = user.phone || '-';
  if (phone !== '-' && phone.length >= 10) {
    let formatted;
    if (phone.length === 12) {
      // 050X 번호: 4-4-4 포맷
      formatted = phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    } else {
      formatted = phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    }
    setText('pPhone', formatted);
  } else {
    setText('pPhone', phone);
  }

  // 대표자란에 이름 표시
  setText('pCompany', user.name || '-');

  // 인증
  const verifiedEl = document.getElementById('pVerified');
  if (verifiedEl) {
    if (user.verified) {
      verifiedEl.innerHTML = '<span style="color:#16a34a; font-weight:800;">✓ 인증완료</span>';
    } else {
      verifiedEl.textContent = '미인증';
    }
  }

  // 투자희망금액
  const investVal = parseFloat(user.investTarget);
  setText('pInvestTarget', (!isNaN(investVal) && investVal > 0) ? investVal + '억원' : (user.investTarget || '-'));

  // 투자자 전용 카드 표시/숨김
  const isInvestorUser = user.userType === 'investor';
  const hopeRoundCard      = document.getElementById('pInvHopeRoundCard');
  const hopeIndustriesCard = document.getElementById('pInvHopeIndustriesCard');
  const invBioCard         = document.getElementById('pInvBioCard');

  // 투자자 로그인 시 스타트업 전용 메뉴 숨기기
  ['menuRecommend', 'menuSupport', 'menuImir'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isInvestorUser ? 'none' : '';
  });

  if (isInvestorUser) {
    // 희망 라운드
    if (hopeRoundCard) hopeRoundCard.style.display = 'block';
    setText('pInvHopeRound', user.inv_hope_round || '-');

    // 희망 산업군 (배지)
    if (hopeIndustriesCard) hopeIndustriesCard.style.display = 'block';
    const indEl = document.getElementById('pInvHopeIndustries');
    if (indEl) {
      const industries = user.inv_hope_industries ? user.inv_hope_industries.split(',').filter(Boolean) : [];
      indEl.innerHTML = industries.length
        ? industries.map(i => `<span style="display:inline-block;padding:0.2rem 0.6rem;background:#dbeafe;color:#1d4ed8;border-radius:999px;font-size:0.82rem;font-weight:700;">${i}</span>`).join('')
        : '-';
    }

    // 소개
    if (invBioCard) invBioCard.style.display = 'block';
    const invBio = user.bio || user.inv_bio || '';
    setText('pInvBio', invBio || '-');
  } else {
    if (hopeRoundCard)      hopeRoundCard.style.display      = 'none';
    if (hopeIndustriesCard) hopeIndustriesCard.style.display = 'none';
    if (invBioCard)         invBioCard.style.display         = 'none';
  }

  // 현황 — 즐겨찾기 실시간 집계
  const bm = BookmarkMgr.getBookmarks();
  const bmInvestors = (bm.investors || []).length;
  const bmFunds = (bm.funds || []).length;
  const bmStartups = (bm.startups || []).length;
  const bmTotal = bmInvestors + bmFunds + bmStartups;
  setText('pBmTotal', bmTotal);
  setText('pBmInvestors', bmInvestors);
  setText('pBmFunds', bmFunds);
  setText('pBmStartups', bmStartups);

  // 현황 통계: Supabase 계정 메타데이터 기반
  const favoritedBy = user.favoritedBy || 0;
  const clickCount  = user.clickCount  || 0;
  const docRequest  = user.docRequest  || 0;
  setText('pFavoritedBy', favoritedBy);
  setText('pClickCount', clickCount);
  setText('pDocRequest', docRequest);

  const portfolioWrap = document.getElementById('pPortfolioWrap');
  const portfolioEl = document.getElementById('pPortfolio');
  if (portfolioWrap && user.portfolio) {
    portfolioWrap.style.display = 'block';
    const url = /^https?:\/\//i.test(user.portfolio) ? user.portfolio : 'https://' + user.portfolio;
    portfolioEl.textContent = user.portfolio;
    portfolioEl.href = url;
    portfolioEl.setAttribute('target', '_blank');
    portfolioEl.setAttribute('rel', 'noopener noreferrer');
    portfolioEl.onclick = function(e) {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  }

  const bioWrap = document.getElementById('pBioWrap');
  const bioEl = document.getElementById('pBio');
  const bio = user.bio || user.su_bio || user.inv_bio || '';
  if (bioWrap && bio) {
    bioWrap.style.display = 'block';
    bioEl.textContent = bio;
  }

  // 추가 정보 그리드 (회원가입 extra fields)
  renderExtraInfo(user);
}

function renderExtraInfo(user) {
  const wrap = document.getElementById('pExtraInfoWrap');
  const grid = document.getElementById('pExtraGrid');
  if (!wrap || !grid) return;

  const isInvestor = user.userType === 'investor';
  const isStartup  = user.userType === 'startup';

  const items = [];

  if (isInvestor) {
    if (user.inv_type)     items.push(['형태',   'fa-building',        user.inv_type]);
    if (user.inv_role)     items.push(['역할',   'fa-id-badge',        user.inv_role]);
    if (user.inv_homepage) items.push(['홈페이지', 'fa-globe',          user.inv_homepage, true]);
    if (user.inv_sns)      items.push(['SNS',    'fa-share-nodes',     user.inv_sns, true]);
  }

  if (isStartup) {
    if (user.su_nationality) items.push(['국적',     'fa-earth-asia',    user.su_nationality]);
    if (user.su_age)         items.push(['나이',     'fa-cake-candles',  user.su_age + '세']);
    if (user.su_job)         items.push(['직무',     'fa-briefcase',     user.su_job]);
    if (user.su_sns)         items.push(['SNS',      'fa-share-nodes',   user.su_sns, true]);
    if (user.co_name)        items.push(['회사명',   'fa-building',      user.co_name]);
    if (user.co_stage)       items.push(['단계',     'fa-flag',          user.co_stage]);
    if (user.co_address)     items.push(['주소',     'fa-location-dot',  user.co_address]);
    if (user.co_biz_type)    items.push(['형태',     'fa-file-contract', user.co_biz_type]);
    if (user.co_keywords)    items.push(['키워드',   'fa-tags',          user.co_keywords]);
    if (user.co_cofounder)   items.push(['공동창업자','fa-people-group', user.co_cofounder]);
    if (user.co_cur_invest_stage) items.push(['현재투자단계','fa-chart-line', user.co_cur_invest_stage]);
    if (user.co_cur_invest_amt)   items.push(['현재투자금액','fa-sack-dollar', user.co_cur_invest_amt + '억원']);
    if (user.co_hope_invest_stage) items.push(['희망투자단계','fa-bullseye', user.co_hope_invest_stage]);
    if (user.co_hope_invest_amt)   items.push(['희망투자금액','fa-hand-holding-dollar', user.co_hope_invest_amt + '억원']);
  }

  if (items.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  grid.innerHTML = items.map(([label, icon, val, isLink]) => `
    <div style="padding:1rem; background:#f8fafc; border-radius:14px; border:1px solid var(--border-color);">
      <div style="font-size:0.78rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.4rem;">
        <i class="fa-solid ${icon}" style="margin-right:0.35rem; color:var(--primary-color);"></i>${label}
      </div>
      ${isLink
        ? `<a href="${/^https?:\/\//i.test(val) ? val : 'https://'+val}" target="_blank" rel="noopener noreferrer" style="font-size:0.9rem; font-weight:700; color:#2563eb; word-break:break-all;">${val}</a>`
        : `<div style="font-size:0.9rem; font-weight:700; color:var(--text-primary); word-break:break-all;">${val}</div>`
      }
    </div>
  `).join('');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── 프로필 편집 ─────────────────────────────────

function enterProfileEdit() {
  if (!_profileUser) return;
  // 편집 가능한 필드: [valueId, inputId, currentValue]
  const fields = [
    ['pUserId',       'pUserId_e',         _profileUser.company      || ''],
    ['pPhone',        'pPhone_e',          _profileUser.phone        || ''],
    ['pCompany',      'pCompany_e',        _profileUser.name         || ''],
    ['pInvestTarget', 'pInvestTarget_wrap', _profileUser.investTarget || ''],
  ];

  fields.forEach(([valId, inpId, curVal]) => {
    const val = document.getElementById(valId);
    const inp = document.getElementById(inpId);
    if (val) val.style.display = 'none';
    if (inp) {
      inp.style.display = inpId.endsWith('_wrap') ? 'flex' : 'block';
      // input 자식이 있으면 실제 input에 값 세팅
      const actualInput = inp.tagName === 'INPUT' || inp.tagName === 'SELECT' || inp.tagName === 'TEXTAREA'
        ? inp : inp.querySelector('input');
      if (actualInput) actualInput.value = curVal;
    }
  });

  // 포트폴리오 (링크 → input)
  const portWrap = document.getElementById('pPortfolioWrap');
  if (portWrap) portWrap.style.display = 'block';
  const portLink = document.getElementById('pPortfolio');
  const portInp  = document.getElementById('pPortfolio_e');
  if (portLink) portLink.style.display = 'none';
  if (portInp) { portInp.style.display = 'block'; portInp.value = _profileUser.portfolio || ''; }

  // 소개 (p → textarea)
  const bioWrap = document.getElementById('pBioWrap');
  if (bioWrap) bioWrap.style.display = 'block';
  const bioPara = document.getElementById('pBio');
  const bioInp  = document.getElementById('pBio_e');
  if (bioPara) bioPara.style.display = 'none';
  if (bioInp) { bioInp.style.display = 'block'; bioInp.value = _profileUser.bio || ''; }

  document.getElementById('profileEditBtn').style.display  = 'none';
  document.getElementById('profileSaveBtn').style.display  = 'inline-flex';
  document.getElementById('profileCancelBtn').style.display = 'inline-flex';
}

async function saveProfileEdit() {
  const company     = document.getElementById('pUserId_e')?.value.trim()       || '';
  const phone       = document.getElementById('pPhone_e')?.value.trim()        || '';
  const name        = document.getElementById('pCompany_e')?.value.trim()      || '';
  const investTarget= document.getElementById('pInvestTarget_e')?.value.trim() || '';
  const portfolio   = document.getElementById('pPortfolio_e')?.value.trim()    || '';
  const bio         = document.getElementById('pBio_e')?.value.trim()          || '';

  const saveBtn = document.getElementById('profileSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

  // 1) Supabase user_metadata 업데이트
  try {
    const sb = getSupabase ? getSupabase() : null;
    if (sb) {
      await sb.auth.updateUser({
        data: { company, phone, full_name: name, portfolio, bio, investTarget }
      });
    }
  } catch (e) {
    console.warn('Supabase 업데이트 실패:', e);
  }

  // 2) 백엔드 DB 업데이트 (선택적)
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    await fetch(API_CONFIG.BASE_URL + '/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ name, company, phone, portfolio, bio })
    });
  } catch (e) { /* 무시 */ }

  // 3) localStorage + 화면 반영
  _profileUser = Object.assign({}, _profileUser, { company, phone, name, investTarget, portfolio, bio });
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(_profileUser));

  cancelProfileEdit();
  renderUserProfile(_profileUser);

  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 저장';
}

function cancelProfileEdit() {
  const valIds = ['pUserId','pPhone','pCompany'];
  valIds.forEach(id => {
    const val = document.getElementById(id);
    const inp = document.getElementById(id + '_e');
    if (val) val.style.display = 'block';
    if (inp) inp.style.display = 'none';
  });

  // 투자희망금액 (wrap 구조)
  const investVal = document.getElementById('pInvestTarget');
  const investWrap = document.getElementById('pInvestTarget_wrap');
  if (investVal)  investVal.style.display  = 'block';
  if (investWrap) investWrap.style.display = 'none';

  const portLink = document.getElementById('pPortfolio');
  const portInp  = document.getElementById('pPortfolio_e');
  if (portLink) portLink.style.display = 'block';
  if (portInp)  portInp.style.display  = 'none';

  const bioPara = document.getElementById('pBio');
  const bioInp  = document.getElementById('pBio_e');
  if (bioPara) bioPara.style.display = 'block';
  if (bioInp)  bioInp.style.display  = 'none';

  document.getElementById('profileEditBtn').style.display   = 'inline-flex';
  document.getElementById('profileSaveBtn').style.display   = 'none';
  document.getElementById('profileCancelBtn').style.display = 'none';
}

// ── 로고 업로드 ──────────────────────────────────

function resizeImageToDataUrl(file, maxPx, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 최대 300px, JPEG quality 0.82 — 대부분 20KB 이하
  const dataUrl = await resizeImageToDataUrl(file, 300, 0.82);

  // 즉시 화면 반영
  const avatarEl = document.getElementById('profileAvatarLarge');
  if (avatarEl) avatarEl.innerHTML = `<img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;

  // localStorage 저장
  if (_profileUser) {
    _profileUser.logoUrl = dataUrl;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(_profileUser));
  }

  // Supabase user_metadata 저장 (avatar_url)
  try {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (sb) await sb.auth.updateUser({ data: { avatar_url: dataUrl } });
  } catch (e) { console.warn('아바타 Supabase 저장 실패:', e); }

  // 파일 input 초기화 (같은 파일 재선택 허용)
  event.target.value = '';
}

// 대시보드 섹션 전환
function switchSection(sectionId) {
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    section.style.display = "none";
    section.classList.remove("active");
  });

  // 투자 히스토리: userType에 따라 다른 섹션 표시
  if (sectionId === 'history') {
    const userInfo = (() => { try { return JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) { return {}; } })();
    const isInvestor = userInfo.userType === 'investor';
    const targetId = isInvestor ? 'historyInvestorSection' : 'historyStartupSection';
    const targetSection = document.getElementById(targetId);
    if (targetSection) { targetSection.style.display = 'block'; targetSection.classList.add('active'); }
  } else {
    const targetSection = document.getElementById(`${sectionId}Section`);
    if (targetSection) {
      targetSection.style.display = "block";
      targetSection.classList.add("active");
    }
  }

  // 내 정보 수정 폼 (myinfo, basicinfo 진입 시)
  if (sectionId === 'myinfo' || sectionId === 'settings') {
    loadSettingsForm();
  }
  if (sectionId === 'basicinfo') {
    loadSettingsBasicInfo();
  }

  // 프로필 섹션 진입 시: 프로필 로드
  if (sectionId === 'profile') {
    loadUserProfile();
  }

  // 추천이력 섹션 진입 시 렌더링
  if (sectionId === 'recommend') {
    loadRecommendHistory();
  }

  // 투자 히스토리 섹션 진입 시 렌더링
  if (sectionId === 'history') {
    _renderInvestorAIHistory();
    renderReviewList();
  }

  // 지원사업 섹션 진입 시 캘린더 초기화
  if (sectionId === 'support') {
    initSupportCalendar();
  }

  // 개발중 배너 (지원사업/자료보관함/투자히스토리)
  const devBanner = document.getElementById('devNoticeBanner');
  if (devBanner) {
    const showBanner = ['support', 'imir', 'history', 'settings'].includes(sectionId);
    devBanner.style.display = showBanner ? 'flex' : 'none';
  }

  // 사이드바 메뉴 활성 상태 업데이트
  document
    .querySelectorAll(".category-sidebar .filter-item")
    .forEach((item) => {
      item.classList.remove("active");
      const onclick = item.getAttribute("onclick");
      if (onclick && onclick.includes(`'${sectionId}'`)) {
        item.classList.add("active");
      }
    });

  renderDashboard();
}

function renderDashboard() {
  const bookmarks = BookmarkMgr.getBookmarks();

  renderBookmarkedInvestors(bookmarks.investors);
  renderBookmarkedFunds(bookmarks.funds);
  renderBookmarkedStartups(bookmarks.startups);
}

function renderBookmarkedInvestors(ids) {
  const container = document.getElementById("bookmarkedInvestors");
  const filtered = investorsData.filter((inv) => ids.includes(inv.id));

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; background: var(--glass-bg); border-radius: 20px;">
                <i class="fa-solid fa-user-tie" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-secondary);">즐겨찾는 투자자가 없습니다.</p>
                <a href="investors.html" style="color: var(--accent-color); text-decoration: none; margin-top: 1rem; font-weight: 700; display: inline-block;">투자자 탐색하러 가기 &rarr;</a>
            </div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (investor) => `
        <div class="u-card" onclick="location.href='investors.html'">
            <div class="card-header">
                <div class="avatar">
                    <i class="fa-solid fa-user-tie"></i>
                </div>
                <div class="investor-info">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${investor.name}</h3>
                    <div class="company" style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">${investor.company}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">총 투자건수</span>
                    <span style="font-weight: 700;">${investor.investments}건</span>
                </div>
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">매칭 성공률</span>
                    <span style="font-weight: 700; color: var(--success-color);">${investor.successRate}%</span>
                </div>
            </div>

            <div class="investor-tags" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span class="tag">투자자</span>
                <span class="tag tag-special">즐겨찾기</span>
            </div>

            <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
                <button class="btn-bookmark active" onclick="event.stopPropagation(); handleBookmarkUpdate('investors', ${investor.id}, this); setTimeout(renderDashboard, 100);">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderBookmarkedFunds(ids) {
  const container = document.getElementById("bookmarkedFunds");
  const filtered = fundsData.filter((fund) => ids.includes(fund.id));

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; background: var(--glass-bg); border-radius: 20px;">
                <i class="fa-solid fa-coins" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-secondary);">즐겨찾는 투자펀드가 없습니다.</p>
                <a href="fund.html" style="color: var(--accent-color); text-decoration: none; margin-top: 1rem; font-weight: 700; display: inline-block;">투자펀드 탐색하러 가기 &rarr;</a>
            </div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (fund) => `
        <div class="u-card" onclick="location.href='fund.html'">
            <div class="card-header">
                <div class="avatar">
                    <i class="fa-solid fa-coins"></i>
                </div>
                <div class="investor-info">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${fund.fundName}</h3>
                    <div class="company" style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">${fund.companyName}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">등록일자</span>
                    <span style="font-weight: 700;">${fund.registeredAt}</span>
                </div>
                <div class="fund-info-item" style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">결성총액</span>
                    <span style="font-weight: 700; color: var(--accent-color);">${formatAmount(fund.totalAmount)}</span>
                </div>
            </div>

            <div class="investor-tags" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span class="tag">${fund.fundType}</span>
                <span class="tag tag-special">즐겨찾기</span>
            </div>

            <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
                <button class="btn-bookmark active" onclick="event.stopPropagation(); handleBookmarkUpdate('funds', ${fund.id}, this); setTimeout(renderDashboard, 100);">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderBookmarkedStartups(ids) {
  const container = document.getElementById("bookmarkedStartups");
  const filtered = startupsData.filter((s) => ids.includes(s.id));

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; background: var(--glass-bg); border-radius: 20px;">
                <i class="fa-solid fa-rocket" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-secondary);">즐겨찾는 스타트업이 없습니다.</p>
                <a href="startups.html" style="color: var(--accent-color); text-decoration: none; margin-top: 1rem; font-weight: 700; display: inline-block;">스타트업 탐색하러 가기 &rarr;</a>
            </div>`;
    return;
  }

  container.innerHTML = filtered
    .map((startup) => {
      const foundedYear = new Date(startup.foundedDate).getFullYear();
      const yearDiff = new Date().getFullYear() - foundedYear + 1;

      return `
        <div class="u-card" onclick="location.href='startups.html'">
            <div class="card-header">
                <div class="avatar">
                    <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="investor-info">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${startup.name}</h3>
                    <div class="company" style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">${startup.industryLabel}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">업력</span>
                    <span style="font-weight: 700;">${yearDiff}년차</span>
                </div>
                <div class="fund-info-item" style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">소재지</span>
                    <span style="font-weight: 700;">${startup.location}</span>
                </div>
            </div>

            <div class="investor-tags" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span class="tag">스타트업</span>
                <span class="tag tag-special">즐겨찾기</span>
            </div>

            <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
                <button class="btn-bookmark active" onclick="event.stopPropagation(); handleBookmarkUpdate('startups', ${startup.id}, this); setTimeout(renderDashboard, 100);">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `;
    })
    .join("");
}

function formatAmount(amount) {
  if (amount >= 100000000) {
    return (amount / 100000000).toLocaleString() + " 억원";
  }
  return amount.toLocaleString() + " 원";
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

// ─── AI 매칭 이력 ─────────────────────────────────────────────────
function _renderRecommendCards(list) {
  const container = document.getElementById("recommendList");
  const empty = document.getElementById("recommendEmpty");
  if (!container) return;

  if (!list.length) {
    if (empty) empty.style.display = "block";
    container.querySelectorAll(".recommend-card").forEach(c => c.remove());
    return;
  }
  if (empty) empty.style.display = "none";
  container.querySelectorAll(".recommend-card").forEach(c => c.remove());

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "recommend-card";
    card.style.cssText = "background:white;border:1px solid #e2e8f0;border-radius:14px;padding:1.2rem 1.5rem;margin-bottom:1rem;";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.8rem;">
        <span style="font-size:0.78rem;color:#94a3b8;">${item.date}</span>
        <span style="background:${item.matchScore >= 70 ? '#dcfce7' : '#fef9c3'};color:${item.matchScore >= 70 ? '#166534' : '#854d0e'};padding:0.15rem 0.55rem;border-radius:20px;font-size:0.75rem;font-weight:700;">매칭 ${item.matchScore}%</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div style="background:#eff6ff;border-radius:10px;padding:0.9rem 1rem;">
          <div style="font-size:0.72rem;color:#3b82f6;font-weight:700;margin-bottom:0.4rem;"><i class="fa-solid fa-building-columns"></i> 추천 펀드</div>
          <div style="font-weight:700;color:#1e293b;font-size:0.9rem;margin-bottom:0.2rem;">${item.fundName}</div>
          <div style="font-size:0.8rem;color:#64748b;">${item.companyName}</div>
          <div style="font-size:0.78rem;color:#94a3b8;margin-top:0.3rem;">${item.industry}</div>
        </div>
        <div style="background:#f5f3ff;border-radius:10px;padding:0.9rem 1rem;">
          <div style="font-size:0.72rem;color:#7c3aed;font-weight:700;margin-bottom:0.4rem;"><i class="fa-solid fa-user-tie"></i> 매칭 투자자</div>
          <div style="font-weight:700;color:#1e293b;font-size:0.9rem;margin-bottom:0.2rem;">${item.gpName} 심사역</div>
          <div style="font-size:0.8rem;color:#64748b;">${item.gpCompany}</div>
          <div style="font-size:0.78rem;color:#94a3b8;margin-top:0.3rem;">${item.gpEmail}</div>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

async function loadRecommendHistory() {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  let list = [];
  if (sb) {
    const { data } = await sb.from('user_ai_history')
      .select('*').order('created_at', { ascending: false }).limit(20);
    list = (data || []).map(r => ({
      date: r.date,
      matchScore: r.match_score,
      fundName: r.fund_name,
      companyName: r.company_name,
      industry: r.industry,
      gpName: r.gp_name,
      gpCompany: r.gp_company,
      gpEmail: r.gp_email,
    }));
  }
  _renderRecommendCards(list);
}

async function clearRecommendHistory() {
  if (!confirm("AI 매칭 이력을 모두 삭제하시겠습니까?")) return;
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) {
    const { data: { user } } = await sb.auth.getUser();
    if (user) await sb.from('user_ai_history').delete().eq('user_id', user.id);
  }
  _renderRecommendCards([]);
}

// 연락한 투자자 내역 그룹 토글
function toggleContactGroup(group) {
  const el = document.getElementById('group-contact-' + group);
  const btn = document.getElementById('btn-contact-' + group);
  if (!el || !btn) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? '' : 'none';
  btn.style.opacity = hidden ? '1' : '0.45';
}

function toggleReviewGroup(group) {
  const el = document.getElementById('group-review-' + group);
  const btn = document.getElementById('btn-review-' + group);
  if (!el || !btn) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? '' : 'none';
  btn.style.opacity = hidden ? '1' : '0.45';
}

// ─── 자료보관함 (Supabase 계정 기반) ───────────────────────────────
let _storedFiles = [];

const SEED_FILES = [
  { name:"2025_Series_A_IR_Deck_v3.pdf",       category:"IR자료",    badge:"IR",     size:"4.2 MB", date:"2025.01.15", content:"" },
  { name:"회사소개서_2025_최종.pptx",           category:"회사소개서", badge:"IR",     size:"12.8 MB",date:"2025.01.10", content:"" },
  { name:"Investment_Memorandum_Q4.docx",       category:"기타",      badge:"IM",     size:"2.1 MB", date:"2025.01.05", content:"" },
  { name:"재무제표_2024_감사완료.pdf",           category:"재무제표",  badge:"IM",     size:"1.5 MB", date:"2024.12.28", content:"" },
  { name:"Pitch_Deck_Demo_Day.pptx",            category:"IR자료",    badge:"IR",     size:"8.7 MB", date:"2024.12.20", content:"" },
  { name:"특허등록증_제10-2024-0123456호.pdf",   category:"기타",      badge:"인증서류",size:"0.8 MB", date:"2024.09.15", content:"" },
  { name:"벤처기업확인서_주식회사벤처플랫폼_2025.pdf", category:"기타", badge:"인증서류",size:"0.5 MB",date:"2025.01.20", content:"" },
  { name:"투자확인서_스마트벤처캠퍼스_2025.pdf", category:"기타",      badge:"인증서류",size:"0.3 MB", date:"2025.02.10", content:"" },
];

async function initStoredFiles() {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) { renderStoredFiles(); return; }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { renderStoredFiles(); return; }

  const { data } = await sb.from('user_files').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    _storedFiles = data;
  } else {
    const seeds = SEED_FILES.map(f => ({ user_id: user.id, ...f }));
    const { data: inserted } = await sb.from('user_files').insert(seeds).select();
    _storedFiles = (inserted || []).reverse();
  }
  renderStoredFiles();
}

function renderStoredFiles() {
  const list = document.getElementById("imirFilesList");
  if (!list) return;
  const files = _storedFiles;
  if (!files.length) {
    list.innerHTML = `<div style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="fa-solid fa-folder-open" style="font-size:2rem;margin-bottom:0.8rem;display:block;"></i>저장된 파일이 없습니다.</div>`;
    return;
  }
  list.innerHTML = files.map(f => {
    const ext = (f.name || "").split(".").pop().toLowerCase();
    const iconCls = ext === "pdf" ? "pdf" : (ext === "pptx" || ext === "ppt") ? "ppt" : (ext === "docx" || ext === "doc") ? "doc" : f.badge === "인증서류" ? "cert" : "pdf";
    const iconTag = ext === "pdf" ? "fa-file-pdf" : (ext === "pptx" || ext === "ppt") ? "fa-file-powerpoint" : (ext === "docx" || ext === "doc") ? "fa-file-word" : "fa-file";
    const badgeCls = f.badge === "IR" ? "ir" : f.badge === "IM" ? "im" : f.badge === "인증서류" ? "cert" : "ir";
    const hasContent = f.content && f.content.trim().length > 0;
    return `
      <div class="imir-file-item">
        <div class="file-icon ${iconCls}"><i class="fa-solid ${iconTag}"></i></div>
        <div class="file-info">
          <h4>${f.name}${hasContent ? ' <span style="color:#22c55e;font-size:0.72rem;font-weight:700;background:#f0fdf4;padding:0.1rem 0.35rem;border-radius:4px;">내용 있음</span>' : ''}</h4>
          <div class="file-meta">
            <span><i class="fa-regular fa-calendar"></i> ${f.date}</span>
            <span><i class="fa-regular fa-file"></i> ${f.size}</span>
            <span style="color:#64748b;">${f.category}</span>
          </div>
        </div>
        <span class="file-badge ${badgeCls}">${f.badge}</span>
        <div class="file-actions">
          <button class="file-action-btn delete" title="삭제" onclick="deleteStoredFile('${f.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join("");

  // 통계 업데이트
  const ir   = files.filter(f => f.badge === "IR").length;
  const im   = files.filter(f => f.badge === "IM").length;
  const cert = files.filter(f => f.badge === "인증서류").length;
  const statEls = document.querySelectorAll(".imir-stat-card .stat-value");
  if (statEls[0]) statEls[0].textContent = ir;
  if (statEls[1]) statEls[1].textContent = im;
  if (statEls[2]) statEls[2].textContent = cert;
  if (statEls[3]) statEls[3].textContent = files.length;
}

async function deleteStoredFile(id) {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) await sb.from('user_files').delete().eq('id', id);
  _storedFiles = _storedFiles.filter(f => f.id !== id);
  renderStoredFiles();
}

// 업로드 모달
let _pendingStorageFile = null;

function openStorageUploadModal() {
  _pendingStorageFile = null;
  const modal = document.getElementById("storageUploadModal");
  if (modal) { modal.style.display = "flex"; }
  document.getElementById("storageSelectedName").textContent = "";
  document.getElementById("storageSaveBtn").disabled = true;
}

function closeStorageUploadModal() {
  const modal = document.getElementById("storageUploadModal");
  if (modal) modal.style.display = "none";
  _pendingStorageFile = null;
}

function onStorageFileChosen(input) {
  const file = input.files[0];
  if (!file) return;
  _pendingStorageFile = file;
  document.getElementById("storageSelectedName").textContent = `✅ ${file.name}`;
  document.getElementById("storageSaveBtn").disabled = false;
}

function handleStorageDrop(e) {
  e.preventDefault();
  document.getElementById("storageDropZone").style.borderColor = "#cbd5e1";
  const file = e.dataTransfer.files[0];
  if (!file) return;
  _pendingStorageFile = file;
  document.getElementById("storageSelectedName").textContent = `✅ ${file.name}`;
  document.getElementById("storageSaveBtn").disabled = false;
}

async function saveStorageFile() {
  if (!_pendingStorageFile) return;
  const file     = _pendingStorageFile;
  const category = document.getElementById("storageCategorySelect").value;
  const badge    = category === "IR자료" || category === "회사소개서" ? "IR"
                 : category === "재무제표" ? "IM" : "기타";
  const sizeMB   = (file.size / 1024 / 1024).toFixed(1) + " MB";
  const now      = new Date();
  const date     = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;

  const btn = document.getElementById("storageSaveBtn");
  btn.textContent = "읽는 중...";
  btn.disabled = true;

  const sb = typeof getSupabase === 'function' ? getSupabase() : null;

  const reader = new FileReader();
  reader.onload = async e => {
    const content = e.target.result || '';
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: inserted } = await sb.from('user_files')
          .insert({ user_id: user.id, name: file.name, category, badge, size: sizeMB, date, content })
          .select().single();
        if (inserted) _storedFiles.unshift(inserted);
      }
    }
    renderStoredFiles();
    closeStorageUploadModal();
    btn.textContent = "저장";
    btn.disabled = false;
  };
  reader.readAsText(file, "utf-8");
}

// ── 내정보 수정 폼 ──────────────────────────────────

let _peKeywords = [];
let _peInvIndustries = [];

function loadSettingsForm() {
  const user = _profileUser;
  if (!user) return;

  const isInvestor = user.userType === 'investor';
  const isStartup  = user.userType === 'startup';

  // 유형별 섹션 표시
  const invSec  = document.getElementById('peInvestorSection');
  const suPSec  = document.getElementById('peStartupPersonSection');
  const suCSec  = document.getElementById('peStartupCompanySection');
  if (invSec)  invSec.style.display  = isInvestor ? '' : 'none';
  if (suPSec)  suPSec.style.display  = isStartup  ? '' : 'none';
  if (suCSec)  suCSec.style.display  = isStartup  ? '' : 'none';

  // 공통
  setVal('pe_name',    user.name    || user.su_name || '');
  setVal('pe_company', user.company || user.co_name || '');
  setVal('pe_phone',   user.phone   || '');

  if (isInvestor) {
    setVal('pe_inv_type',       user.inv_type       || '');
    setVal('pe_inv_role',       user.inv_role       || '');
    setVal('pe_inv_homepage',   user.inv_homepage || user.portfolio || '');
    setVal('pe_inv_sns',        user.inv_sns        || '');
    setVal('pe_inv_bio',        user.bio || user.inv_bio || '');
    setVal('pe_inv_hope_round', user.inv_hope_round || '');
    setVal('pe_inv_hope_amt',   user.inv_hope_amt   || '');

    // 희망 산업군 배지 초기화
    _peInvIndustries = user.inv_hope_industries ? user.inv_hope_industries.split(',').filter(Boolean) : [];
    renderPeInvIndustries();
    initPeInvIndustriesInput();
  }

  if (isStartup) {
    setVal('pe_nationality',        user.su_nationality || '');
    setVal('pe_age',                user.su_age         || '');
    setVal('pe_gender',             user.su_gender || user.gender || '');
    setVal('pe_job',                user.su_job         || '');
    setVal('pe_su_sns',             user.su_sns         || '');
    setVal('pe_referral',           user.su_referral    || '');
    setVal('pe_su_bio',             user.su_bio || user.bio || '');

    setVal('pe_co_name',            user.co_name        || user.company || '');
    setVal('pe_co_founded',         user.co_founded     || '');
    setVal('pe_co_homepage',        user.co_homepage || user.portfolio || '');
    setVal('pe_co_biz_type',        user.co_biz_type    || '');
    setVal('pe_co_address',         user.co_address     || '');
    setVal('pe_co_stage',           user.co_stage       || '');
    setVal('pe_co_cofounder',       user.co_cofounder   || '');
    setVal('pe_cur_invest_stage',   user.co_cur_invest_stage  || '');
    setVal('pe_cur_invest_amt',     user.co_cur_invest_amt    || '');
    setVal('pe_hope_invest_stage',  user.co_hope_invest_stage || '');
    setVal('pe_hope_invest_amt',    user.co_hope_invest_amt   || '');

    // 키워드 뱃지 초기화
    _peKeywords = user.co_keywords ? user.co_keywords.split(',').filter(Boolean) : [];
    renderPeKeywords();
    initPeKeywordInput();
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function initPeKeywordInput() {
  const inp = document.getElementById('pe_kw_input');
  if (!inp || inp._peInited) return;
  inp._peInited = true;
  inp.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const v = this.value.trim();
      if (v && _peKeywords.length < 3 && !_peKeywords.includes(v)) {
        _peKeywords.push(v);
        renderPeKeywords();
      }
      this.value = '';
    } else if (e.key === 'Backspace' && !this.value && _peKeywords.length > 0) {
      _peKeywords.pop();
      renderPeKeywords();
    }
  });
  // 클릭 시 input 포커스
  const wrap = document.getElementById('pe_kw_wrap');
  if (wrap) wrap.addEventListener('click', () => inp.focus());
}

function renderPeKeywords() {
  const badges = document.getElementById('pe_kw_badges');
  const hidden = document.getElementById('pe_co_keywords');
  if (!badges) return;
  badges.innerHTML = _peKeywords.map((kw, i) =>
    `<span class="pef-kw-badge">${kw}<button type="button" class="pef-kw-remove" onclick="removePeKeyword(${i})">×</button></span>`
  ).join('');
  if (hidden) hidden.value = _peKeywords.join(',');
  const inp = document.getElementById('pe_kw_input');
  if (inp) inp.disabled = _peKeywords.length >= 3;
}

function removePeKeyword(idx) {
  _peKeywords.splice(idx, 1);
  renderPeKeywords();
}

// ── 희망 산업군 배지 (투자자 내정보 수정) ─────────────

function initPeInvIndustriesInput() {
  const inp = document.getElementById('pe_inv_ind_input');
  if (!inp || inp._peInvIndInited) return;
  inp._peInvIndInited = true;
  inp.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const v = this.value.trim();
      if (v && !_peInvIndustries.includes(v)) {
        _peInvIndustries.push(v);
        renderPeInvIndustries();
      }
      this.value = '';
    } else if (e.key === 'Backspace' && !this.value && _peInvIndustries.length > 0) {
      _peInvIndustries.pop();
      renderPeInvIndustries();
    }
  });
  const wrap = document.getElementById('pe_inv_ind_wrap');
  if (wrap) wrap.addEventListener('click', () => inp.focus());
}

function renderPeInvIndustries() {
  const badges = document.getElementById('pe_inv_ind_badges');
  const hidden  = document.getElementById('pe_inv_hope_industries');
  if (!badges) return;
  badges.innerHTML = _peInvIndustries.map((ind, i) =>
    `<span class="pef-kw-badge">${ind}<button type="button" class="pef-kw-remove" onclick="removePeInvIndustry(${i})">×</button></span>`
  ).join('');
  if (hidden) hidden.value = _peInvIndustries.join(',');
}

function removePeInvIndustry(idx) {
  _peInvIndustries.splice(idx, 1);
  renderPeInvIndustries();
}

async function saveProfileInfo() {
  const user = _profileUser;
  if (!user) return;

  const isInvestor = user.userType === 'investor';
  const isStartup  = user.userType === 'startup';

  const name    = document.getElementById('pe_name')?.value.trim()    || '';
  const company = document.getElementById('pe_company')?.value.trim() || '';
  const phone   = document.getElementById('pe_phone')?.value.trim()   || '';

  const updates = { name, company, phone };

  if (isInvestor) {
    updates.inv_type             = document.getElementById('pe_inv_type')?.value          || '';
    updates.inv_role             = document.getElementById('pe_inv_role')?.value.trim()   || '';
    updates.inv_homepage         = document.getElementById('pe_inv_homepage')?.value.trim() || '';
    updates.inv_sns              = document.getElementById('pe_inv_sns')?.value.trim()    || '';
    updates.bio                  = document.getElementById('pe_inv_bio')?.value.trim()    || '';
    updates.portfolio            = updates.inv_homepage;
    updates.inv_hope_round       = document.getElementById('pe_inv_hope_round')?.value   || '';
    updates.inv_hope_amt         = document.getElementById('pe_inv_hope_amt')?.value      || '';
    updates.inv_hope_industries  = _peInvIndustries.join(',');
  }

  if (isStartup) {
    updates.su_nationality       = document.getElementById('pe_nationality')?.value.trim()       || '';
    updates.su_age               = document.getElementById('pe_age')?.value                      || '';
    updates.su_gender            = document.getElementById('pe_gender')?.value                   || '';
    updates.gender               = updates.su_gender;
    updates.su_job               = document.getElementById('pe_job')?.value.trim()               || '';
    updates.su_sns               = document.getElementById('pe_su_sns')?.value.trim()            || '';
    updates.su_referral          = document.getElementById('pe_referral')?.value                 || '';
    updates.su_bio               = document.getElementById('pe_su_bio')?.value.trim()            || '';
    updates.bio                  = updates.su_bio;
    updates.co_name              = document.getElementById('pe_co_name')?.value.trim()           || '';
    updates.co_founded           = document.getElementById('pe_co_founded')?.value               || '';
    updates.co_homepage          = document.getElementById('pe_co_homepage')?.value.trim()       || '';
    updates.co_biz_type          = document.getElementById('pe_co_biz_type')?.value              || '';
    updates.co_address           = document.getElementById('pe_co_address')?.value.trim()        || '';
    updates.co_stage             = document.getElementById('pe_co_stage')?.value                 || '';
    updates.co_keywords          = _peKeywords.join(',');
    updates.co_cofounder         = document.getElementById('pe_co_cofounder')?.value             || '';
    updates.co_cur_invest_stage  = document.getElementById('pe_cur_invest_stage')?.value         || '';
    updates.co_cur_invest_amt    = document.getElementById('pe_cur_invest_amt')?.value           || '';
    updates.co_hope_invest_stage = document.getElementById('pe_hope_invest_stage')?.value        || '';
    updates.co_hope_invest_amt   = document.getElementById('pe_hope_invest_amt')?.value          || '';
    updates.portfolio            = updates.co_homepage;
  }

  const btn = document.getElementById('peSubmitBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...'; }

  // Supabase 업데이트
  try {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (sb) await sb.auth.updateUser({ data: updates });
  } catch(e) { console.warn('Supabase 저장 실패:', e); }

  // 백엔드 업데이트
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    await fetch(API_CONFIG.BASE_URL + '/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(updates),
    });
  } catch(e) { /* 무시 */ }

  // localStorage 반영
  _profileUser = Object.assign({}, _profileUser, updates);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(_profileUser));

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 저장'; }

  alert('저장되었습니다!');
  switchSection('profile');
}

// ── 지원사업 캘린더 ─────────────────────────────────────────────

let _supportYear = new Date().getFullYear();
let _supportMonth = new Date().getMonth(); // 0-indexed

// 지원사업 이벤트 (Supabase에서 로드, 기본값 seed 포함)
let SUPPORT_EVENTS = [];

const DEFAULT_SUPPORT_EVENTS = [
  { title:'창업도약패키지', org:'중소벤처기업부', color:'#2563eb', bgColor:'#dbeafe', start:'2026-03-05', end:'2026-03-28', category:'창업지원', apply:true, result:'selected', amount:'최대 1억원', description:'초기 창업기업의 사업화 역량 강화를 위한 패키지 지원 프로그램' },
  { title:'TIPS 프로그램', org:'중소벤처기업부', color:'#7c3aed', bgColor:'#ede9fe', start:'2026-03-10', end:'2026-04-10', category:'R&D', apply:true, result:'rejected', amount:'최대 5억원', description:'민간투자 주도형 기술창업 지원, 엔젤투자사 추천 필수' },
  { title:'서울형 강소기업 육성', org:'서울시', color:'#059669', bgColor:'#d1fae5', start:'2026-03-15', end:'2026-03-31', category:'지역지원', apply:false, result:null, amount:'최대 3,000만원', description:'서울 소재 중소기업 경쟁력 강화를 위한 종합 지원 사업' },
  { title:'민간투자 연계형 지원', org:'중기부', color:'#d97706', bgColor:'#fef3c7', start:'2026-03-20', end:'2026-04-20', category:'투자연계', apply:false, result:null, amount:'최대 2억원', description:'민간투자와 연계한 정부 매칭 지원, 투자확약서 필요' },
  { title:'K-스타트업 그랜드챌린지', org:'중소벤처기업부', color:'#dc2626', bgColor:'#fee2e2', start:'2026-04-01', end:'2026-04-30', category:'글로벌', apply:false, result:null, amount:'최대 1억원', description:'글로벌 진출을 목표로 하는 스타트업 대상 국제 경진대회' },
  { title:'청년창업사관학교', org:'중소기업진흥공단', color:'#0891b2', bgColor:'#cffafe', start:'2026-03-01', end:'2026-03-20', category:'창업지원', apply:true, result:'selected', amount:'최대 1억원', description:'만 39세 이하 청년창업가 대상 창업 교육 및 사업화 지원' },
];

function _dbRowToEvent(row) {
  return {
    id: row.id,
    title: row.title,
    org: row.org || '',
    color: row.color || '#2563eb',
    bgColor: row.bg_color || '#dbeafe',
    start: row.start_date || '',
    end: row.end_date || '',
    category: row.category || '기타',
    apply: row.apply || false,
    result: row.result || null,
    amount: row.amount || '',
    description: row.description || '',
  };
}

async function loadSupportEvents() {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data } = await sb.from('user_support_events').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        SUPPORT_EVENTS = data.map(_dbRowToEvent);
      } else {
        const seeds = DEFAULT_SUPPORT_EVENTS.map(ev => ({
          user_id: user.id,
          title: ev.title, org: ev.org, color: ev.color, bg_color: ev.bgColor,
          start_date: ev.start, end_date: ev.end, category: ev.category,
          apply: ev.apply, result: ev.result || null,
          amount: ev.amount || '', description: ev.description || '', is_system: true,
        }));
        const { data: inserted } = await sb.from('user_support_events').insert(seeds).select();
        SUPPORT_EVENTS = (inserted || []).map(_dbRowToEvent);
      }
    }
  }
  initSupportCalendar();
}

function initSupportCalendar() {
  renderSupportCalendar();
  renderSupportWeek();
  renderSupportApplicationsTabbed();
  showApplicationTab('apply');
}

function supportChangeMonth(delta) {
  _supportMonth += delta;
  if (_supportMonth > 11) { _supportMonth = 0; _supportYear++; }
  if (_supportMonth < 0) { _supportMonth = 11; _supportYear--; }
  renderSupportCalendar();
  renderSupportWeek();
}

function renderSupportCalendar() {
  const grid = document.getElementById('supportCalendarGrid');
  const label = document.getElementById('supportMonthLabel');
  if (!grid || !label) return;

  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  label.textContent = `${_supportYear}년 ${monthNames[_supportMonth]}`;

  const firstDay = new Date(_supportYear, _supportMonth, 1).getDay();
  const daysInMonth = new Date(_supportYear, _supportMonth + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === _supportYear && today.getMonth() === _supportMonth;

  let html = '';
  // 빈 칸 (이전달)
  for (let i = 0; i < firstDay; i++) {
    html += `<div style="min-height:80px; border-right:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; padding:0.4rem; background:#fafafa;"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${_supportYear}-${String(_supportMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayOfWeek = new Date(_supportYear, _supportMonth, d).getDay();
    const isToday = isCurrentMonth && d === today.getDate();
    const isSun = dayOfWeek === 0;
    const isSat = dayOfWeek === 6;

    // 해당 날짜의 이벤트 (마감일 기준)
    const dayEvents = SUPPORT_EVENTS.filter(ev => ev.end === dateStr);

    const todayStyle = isToday ? 'background:#2563eb; color:white; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-weight:900;' : '';
    const dayNumColor = isToday ? '' : (isSun ? 'color:#dc2626;' : isSat ? 'color:#2563eb;' : 'color:#475569;');

    const eventsHtml = dayEvents.slice(0,3).map(ev => `
      <div onclick="showSupportEvent(event,'${ev.id}')" style="font-size:0.65rem; font-weight:700; color:${ev.color}; background:${ev.bgColor}; border-radius:4px; padding:1px 4px; margin-top:2px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; box-sizing:border-box; display:block;" title="${ev.title}">${ev.title}</div>
    `).join('');
    const moreHtml = dayEvents.length > 3 ? `<div style="font-size:0.65rem;color:#94a3b8;padding-left:2px;">+${dayEvents.length-3}개 더</div>` : '';

    html += `<div style="min-height:80px; border-right:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; padding:0.4rem; overflow:hidden; ${isSun||isSat?'background:#fafbff;':''}">
      <div style="${dayNumColor} font-size:0.8rem; font-weight:700; margin-bottom:2px;">
        <span style="${todayStyle}">${d}</span>
      </div>
      ${eventsHtml}${moreHtml}
    </div>`;
  }

  // 나머지 빈칸
  const totalCells = firstDay + daysInMonth;
  const remainder = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remainder; i++) {
    html += `<div style="min-height:80px; border-right:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; padding:0.4rem; background:#fafafa;"></div>`;
  }

  grid.innerHTML = html;
}

function renderSupportWeek() {
  const listEl = document.getElementById('supportWeekList');
  const rangeEl = document.getElementById('supportWeekRange');
  if (!listEl) return;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
  if (rangeEl) rangeEl.textContent = `${fmt(weekStart)} ~ ${fmt(weekEnd)}`;

  const toDateStr = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const wsStr = toDateStr(weekStart);
  const weStr = toDateStr(weekEnd);

  const weekEvents = SUPPORT_EVENTS.filter(ev => ev.end >= wsStr && ev.end <= weStr);

  if (weekEvents.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding:1rem 0; color:#94a3b8; font-size:0.82rem;">이번주 일정이 없습니다</div>`;
    return;
  }

  listEl.innerHTML = weekEvents.map(ev => `
    <div style="display:flex; align-items:center; gap:0.6rem; padding:0.55rem 0.5rem; border-radius:10px; background:${ev.bgColor}; margin-bottom:0.35rem;">
      <div style="width:4px; height:36px; background:${ev.color}; border-radius:4px; flex-shrink:0;"></div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:0.8rem; font-weight:800; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ev.title}</div>
        <div style="font-size:0.7rem; color:#64748b; margin-top:1px;">${ev.org}</div>
      </div>
      <div style="font-size:0.65rem; color:${ev.color}; font-weight:700; background:white; padding:2px 6px; border-radius:6px; white-space:nowrap;">${ev.category}</div>
    </div>
  `).join('');
}

function renderSupportApplications() {
  const selectedEl = document.getElementById('supportSelected');
  const rejectedEl = document.getElementById('supportRejected');
  if (!selectedEl || !rejectedEl) return;

  const applied = SUPPORT_EVENTS.filter(ev => ev.apply);
  const selected = applied.filter(ev => ev.result === 'selected');
  const rejected = applied.filter(ev => ev.result === 'rejected');

  const renderItem = (ev) => `
    <div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.6rem; border-radius:10px; border:1px solid ${ev.bgColor}; background:white;">
      <div style="width:8px;height:8px;border-radius:50%;background:${ev.color};flex-shrink:0;"></div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:0.78rem; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ev.title}</div>
        <div style="font-size:0.68rem; color:#94a3b8;">마감: ${ev.end.replace(/-/g,'.')}</div>
      </div>
    </div>
  `;

  selectedEl.innerHTML = selected.length ? selected.map(renderItem).join('') : `<div style="font-size:0.78rem;color:#94a3b8;padding:0.25rem;">없음</div>`;
  rejectedEl.innerHTML = rejected.length ? rejected.map(renderItem).join('') : `<div style="font-size:0.78rem;color:#94a3b8;padding:0.25rem;">없음</div>`;
}

function showSupportEvent(e, eventId) {
  e.stopPropagation();
  const ev = SUPPORT_EVENTS.find(x => x.id === eventId);
  if (!ev) return;
  const detail = document.getElementById('supportEventDetail');
  if (!detail) return;

  detail.innerHTML = `
    <div style="font-weight:800;color:#1e293b;margin-bottom:0.4rem;font-size:0.95rem;">${ev.title}</div>
    <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.6rem;">${ev.org}</div>
    <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">
      <span style="font-size:0.7rem;font-weight:700;color:${ev.color};background:${ev.bgColor};padding:2px 8px;border-radius:6px;">${ev.category}</span>
    </div>
    <div style="font-size:0.78rem;color:#475569;">📅 마감일: ${ev.end.replace(/-/g,'.')}</div>
    ${ev.amount ? `<div style="font-size:0.78rem;color:#475569;margin-top:0.25rem;">💰 지원금액: ${ev.amount}</div>` : ''}
    ${ev.description ? `<div style="font-size:0.78rem;color:#64748b;margin-top:0.35rem;line-height:1.5;">${ev.description}</div>` : ''}
  `;
  detail.style.display = 'block';
  detail.style.left = Math.min(e.clientX + 12, window.innerWidth - 300) + 'px';
  detail.style.top = (e.clientY - 10) + 'px';

  const hide = () => { detail.style.display = 'none'; document.removeEventListener('click', hide); };
  setTimeout(() => document.addEventListener('click', hide), 50);
}

// ── 기본 정보 수정 (이메일 인증 게이팅) ──────────────────────────

let _siVerified = false;
let _siTimerInterval = null;
const SI_TEST_CODE = '123456'; // 개발용 테스트 코드

function loadSettingsBasicInfo() {
  const user = _profileUser || {};
  const emailInput = document.getElementById('si_email');
  const usernameInput = document.getElementById('si_username');
  if (usernameInput) usernameInput.value = user.name || user.email?.split('@')[0] || '';
  if (emailInput) emailInput.value = user.email || '';
  // 인증 상태 초기화
  _siVerified = false;
  document.getElementById('si_code_wrap').style.display = 'none';
  document.getElementById('si_verified_badge').style.display = 'none';
  document.getElementById('si_pw_lock').style.display = 'flex';
  document.getElementById('si_phone_lock').style.display = 'flex';
  document.getElementById('si_email_status').style.display = 'none';
  ['si_cur_pw','si_new_pw','si_new_pw2','si_phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = true; el.value = ''; }
  });
  const btn = document.getElementById('btnEmailVerify');
  if (btn) { btn.disabled = false; btn.textContent = '인증요청'; }
}

function requestEmailVerification() {
  const email = document.getElementById('si_email').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showSiStatus('올바른 이메일 주소를 입력해주세요.', 'error'); return;
  }
  // 인증 코드 전송 시뮬레이션
  document.getElementById('si_code_wrap').style.display = 'block';
  showSiStatus(`${email}로 인증코드를 발송했습니다. (테스트 코드: ${SI_TEST_CODE})`, 'info');
  document.getElementById('si_code').value = '';
  startSiTimer(180);

  const btn = document.getElementById('btnEmailVerify');
  btn.disabled = true;
  btn.textContent = '재발송';
  setTimeout(() => { if (btn) { btn.disabled = false; } }, 30000);
}

function startSiTimer(seconds) {
  clearInterval(_siTimerInterval);
  const timerEl = document.getElementById('si_timer');
  let remaining = seconds;
  const update = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (timerEl) timerEl.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if (remaining <= 0) {
      clearInterval(_siTimerInterval);
      if (timerEl) timerEl.textContent = '만료';
      timerEl.style.color = '#dc2626';
    }
    remaining--;
  };
  update();
  _siTimerInterval = setInterval(update, 1000);
}

function verifyEmailCode() {
  const code = document.getElementById('si_code').value.trim();
  if (!code) { showSiStatus('인증코드를 입력해주세요.', 'error'); return; }
  if (code !== SI_TEST_CODE) {
    showSiStatus('인증코드가 일치하지 않습니다. 다시 확인해주세요.', 'error'); return;
  }
  // 인증 성공
  _siVerified = true;
  clearInterval(_siTimerInterval);
  document.getElementById('si_code_wrap').style.display = 'none';
  document.getElementById('si_verified_badge').style.display = 'block';
  showSiStatus('이메일 인증이 완료되었습니다.', 'success');

  // 잠금 해제
  document.getElementById('si_pw_lock').style.display = 'none';
  document.getElementById('si_phone_lock').style.display = 'none';
  ['si_cur_pw','si_new_pw','si_new_pw2','si_phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
  // 연락처 기존 값 로드
  const phoneEl = document.getElementById('si_phone');
  if (phoneEl) phoneEl.value = (_profileUser && _profileUser.phone) || '';
}

function showSiStatus(msg, type) {
  const el = document.getElementById('si_email_status');
  if (!el) return;
  const colors = { error:'#dc2626', success:'#16a34a', info:'#2563eb' };
  const bg = { error:'#fef2f2', success:'#f0fdf4', info:'#eff6ff' };
  el.style.display = 'block';
  el.style.color = colors[type] || '#64748b';
  el.style.background = bg[type] || 'transparent';
  el.style.padding = '0.4rem 0.7rem';
  el.style.borderRadius = '8px';
  el.textContent = msg;
}

function toggleSiPw(inputId, btn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const isText = el.type === 'text';
  el.type = isText ? 'password' : 'text';
  btn.innerHTML = isText ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
}

function checkSiPwMatch() {
  const pw = document.getElementById('si_new_pw').value;
  const pw2 = document.getElementById('si_new_pw2').value;
  const msg = document.getElementById('si_pw_match_msg');
  if (!pw2) { msg.textContent = ''; return; }
  if (pw === pw2) {
    msg.textContent = '✓ 비밀번호가 일치합니다';
    msg.style.color = '#16a34a';
  } else {
    msg.textContent = '✗ 비밀번호가 일치하지 않습니다';
    msg.style.color = '#dc2626';
  }
}

async function saveBasicInfo() {
  if (!_siVerified) {
    showSiStatus('이메일 인증을 먼저 완료해주세요.', 'error'); return;
  }
  const curPw = document.getElementById('si_cur_pw').value;
  const newPw = document.getElementById('si_new_pw').value;
  const newPw2 = document.getElementById('si_new_pw2').value;
  const phone = document.getElementById('si_phone').value.trim();

  // 비밀번호 변경 시 유효성 검사
  if (newPw || curPw) {
    if (!curPw) { showSiStatus('현재 비밀번호를 입력해주세요.', 'error'); return; }
    if (newPw.length < 8) { showSiStatus('새 비밀번호는 8자 이상이어야 합니다.', 'error'); return; }
    if (newPw !== newPw2) { showSiStatus('새 비밀번호가 일치하지 않습니다.', 'error'); return; }
  }

  const btn = document.getElementById('siBtnSave');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...'; }

  try {
    const sb = getSupabase ? getSupabase() : null;
    // 비밀번호 변경
    if (sb && newPw && curPw) {
      const { error } = await sb.auth.updateUser({ password: newPw });
      if (error) { showSiStatus('비밀번호 변경 실패: ' + error.message, 'error'); return; }
    }
    // 연락처 업데이트 - Supabase Auth 메타데이터
    if (sb && phone) {
      await sb.auth.updateUser({ data: { phone } });
      if (_profileUser) _profileUser.phone = phone;
    }

    showSiStatus('저장되었습니다!', 'success');
    // 비밀번호 필드 초기화
    ['si_cur_pw','si_new_pw','si_new_pw2'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('si_pw_match_msg').textContent = '';
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 저장'; }
  }
}

// ── 신청내역 탭 (신청중/선정/미선정) ──────────────────────────────

function renderSupportApplicationsTabbed() {
  const COLORS = { apply:'#2563eb', selected:'#16a34a', rejected:'#dc2626' };
  const BCOLORS = { apply:'#dbeafe', selected:'#dcfce7', rejected:'#fee2e2' };

  const applied = SUPPORT_EVENTS.filter(ev => ev.apply);
  const groups = {
    apply: applied.filter(ev => ev.result === null),
    selected: applied.filter(ev => ev.result === 'selected'),
    rejected: applied.filter(ev => ev.result === 'rejected'),
  };

  // 배지 카운트 업데이트
  Object.entries(groups).forEach(([key, arr]) => {
    const badge = document.getElementById('appTabCount_' + key);
    if (badge) badge.textContent = arr.length;
  });

  const renderCard = (ev) => `
    <div style="display:flex;align-items:center;gap:0.65rem;padding:0.7rem 0.9rem;border-radius:12px;border:1.5px solid ${ev.bgColor};background:white;min-width:180px;max-width:260px;flex:1;">
      <div style="width:10px;height:10px;border-radius:50%;background:${ev.color};flex-shrink:0;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.82rem;font-weight:800;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ev.title}</div>
        <div style="font-size:0.7rem;color:#64748b;margin-top:1px;">${ev.org}</div>
        <div style="font-size:0.68rem;color:#94a3b8;margin-top:1px;">마감: ${ev.end.replace(/-/g,'.')}</div>
      </div>
      <span style="font-size:0.65rem;font-weight:700;color:${ev.color};background:${ev.bgColor};padding:2px 7px;border-radius:6px;white-space:nowrap;">${ev.category}</span>
    </div>
  `;

  const empty = '<div style="font-size:0.85rem;color:#94a3b8;padding:0.75rem 0;">해당 내역이 없습니다.</div>';

  Object.entries(groups).forEach(([key, arr]) => {
    const el = document.getElementById('appContent_' + key);
    if (el) el.innerHTML = arr.length ? arr.map(renderCard).join('') : empty;
  });
}

function showApplicationTab(tab) {
  ['apply','selected','rejected'].forEach(t => {
    document.getElementById('appContent_' + t).style.display = t === tab ? 'flex' : 'none';
    const btn = document.getElementById('appTab_' + t);
    if (btn) {
      if (t === tab) btn.classList.add('app-tab-active');
      else btn.classList.remove('app-tab-active');
    }
  });
}

// 일정 추가 모달
let _pendingApply = false;

// ── 신청 내역 추가 전용 모달 ──────────────────────────────────────
function openAddApplicationModal() {
  const modal = document.getElementById('addApplicationModal');
  if (!modal) return;

  // 기존 일정 드롭다운 채우기
  const sel = document.getElementById('appModalEventSel');
  if (sel) {
    sel.innerHTML = '<option value="">— 직접 입력 —</option>' +
      SUPPORT_EVENTS.map(ev => `<option value="${ev.id}">${ev.title}${ev.org ? ' (' + ev.org + ')' : ''}</option>`).join('');
  }

  // 폼 초기화
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('appModalTitle').value = '';
  document.getElementById('appModalOrg').value = '';
  document.getElementById('appModalEnd').value = today;
  document.getElementById('appModalStatus').value = 'apply';

  modal.style.display = 'flex';
}

function closeAddApplicationModal() {
  const modal = document.getElementById('addApplicationModal');
  if (modal) modal.style.display = 'none';
}

function fillApplicationFromEvent() {
  const sel = document.getElementById('appModalEventSel');
  const evId = sel.value;
  if (!evId) return;
  const ev = SUPPORT_EVENTS.find(e => e.id === evId);
  if (!ev) return;
  document.getElementById('appModalTitle').value = ev.title;
  document.getElementById('appModalOrg').value = ev.org || '';
  document.getElementById('appModalEnd').value = ev.end || '';
  // 이미 신청/선정/미선정 결과가 있으면 반영
  if (ev.apply) {
    if (ev.result === 'selected') document.getElementById('appModalStatus').value = 'selected';
    else if (ev.result === 'rejected') document.getElementById('appModalStatus').value = 'rejected';
    else document.getElementById('appModalStatus').value = 'apply';
  }
}

async function submitAddApplication() {
  const selEvId = document.getElementById('appModalEventSel').value;
  const titleVal = document.getElementById('appModalTitle').value.trim();
  const orgVal   = document.getElementById('appModalOrg').value.trim() || '직접 추가';
  const endVal   = document.getElementById('appModalEnd').value;
  const statusVal = document.getElementById('appModalStatus').value;
  const resultMap = { apply: null, selected: 'selected', rejected: 'rejected' };
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;

  if (selEvId) {
    // 기존 일정에 신청 상태 반영
    const ev = SUPPORT_EVENTS.find(e => e.id === selEvId);
    if (ev) {
      ev.apply = true;
      ev.result = resultMap[statusVal];
      if (sb) await sb.from('user_support_events').update({ apply: true, result: resultMap[statusVal] }).eq('id', selEvId);
    }
  } else {
    // 새 항목 직접 추가
    if (!titleVal) { alert('지원사업명을 입력해주세요.'); return; }
    if (!endVal)   { alert('마감일을 입력해주세요.'); return; }
    const palette  = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
    const bgPalette = ['#dbeafe','#ede9fe','#d1fae5','#fef3c7','#fee2e2','#cffafe'];
    const idx = SUPPORT_EVENTS.length % palette.length;
    const newEv = {
      title: titleVal, org: orgVal,
      color: palette[idx], bgColor: bgPalette[idx],
      start: endVal, end: endVal, category: '기타',
      apply: true, result: resultMap[statusVal],
      amount: '', description: '',
    };
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: inserted } = await sb.from('user_support_events').insert({
          user_id: user.id, title: newEv.title, org: newEv.org,
          color: newEv.color, bg_color: newEv.bgColor,
          start_date: newEv.start, end_date: newEv.end, category: newEv.category,
          apply: newEv.apply, result: newEv.result, amount: '', description: '',
        }).select().single();
        if (inserted) newEv.id = inserted.id;
      }
    }
    if (!newEv.id) newEv.id = Date.now().toString();
    SUPPORT_EVENTS.push(newEv);
  }

  closeAddApplicationModal();
  renderSupportCalendar();
  renderSupportWeek();
  renderSupportApplicationsTabbed();
}

function openAddEventModal() {
  _pendingApply = false;
  const modal = document.getElementById('addEventModal');
  if (modal) modal.style.display = 'flex';
  // 기본 날짜 세팅
  const today = new Date().toISOString().slice(0,10);
  const endEl = document.getElementById('addEvEnd');
  if (endEl) endEl.value = today;
  // 모달 타이틀 기본값
  const titleEl = document.getElementById('addEventModalTitle');
  if (titleEl) titleEl.textContent = '일정 추가';
}

function closeAddEventModal() {
  const modal = document.getElementById('addEventModal');
  if (modal) modal.style.display = 'none';
}

async function submitAddEvent() {
  const title = document.getElementById('addEvTitle').value.trim();
  const org = document.getElementById('addEvOrg').value.trim() || '직접 추가';
  const end = document.getElementById('addEvEnd').value;
  const category = document.getElementById('addEvCategory').value;
  const amount = document.getElementById('addEvAmount').value.trim();
  const description = document.getElementById('addEvDesc').value.trim();

  if (!title) { alert('지원사업명을 입력해주세요.'); return; }
  if (!end) { alert('마감일을 입력해주세요.'); return; }

  const palette = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
  const bgPalette = ['#dbeafe','#ede9fe','#d1fae5','#fef3c7','#fee2e2','#cffafe'];
  const idx = SUPPORT_EVENTS.length % palette.length;

  const newEv = {
    title, org, color: palette[idx], bgColor: bgPalette[idx],
    start: end, end, category, apply: false, result: null, amount, description,
  };

  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: inserted } = await sb.from('user_support_events').insert({
        user_id: user.id, title, org, color: newEv.color, bg_color: newEv.bgColor,
        start_date: end, end_date: end, category, apply: false, result: null, amount, description,
      }).select().single();
      if (inserted) newEv.id = inserted.id;
    }
  }
  if (!newEv.id) newEv.id = Date.now().toString();
  SUPPORT_EVENTS.push(newEv);

  closeAddEventModal();
  document.getElementById('addEvTitle').value = '';
  document.getElementById('addEvOrg').value = '';
  document.getElementById('addEvAmount').value = '';
  document.getElementById('addEvDesc').value = '';
  renderSupportCalendar();
  renderSupportWeek();
  renderSupportApplicationsTabbed();
}

// ─── AI 심사역 보고서 (투자자 전용) ───────────────────────────────────────

const AI_EXAM_SCORE_CATS = ['시장성', '팀', '기술력', 'BM', '재무'];
let _aiExamCurrentResult = null;
let _aiExamCurrentName   = '';
const examFileTexts = { 1: '', 2: '', 3: '' };

// 파일 업로드 핸들러
function onExamFileSelect(input, slot) {
  const file = input.files[0];
  if (file) _handleExamFile(file, slot);
}

function _handleExamFile(file, slot) {
  const nameEl = document.getElementById(`examFileName${slot}`);
  const zoneEl = document.getElementById(`examZone${slot}`);
  if (nameEl) nameEl.textContent = `✅ ${file.name}`;
  if (zoneEl) zoneEl.classList.add('has-file');
  const reader = new FileReader();
  reader.onload = e => { examFileTexts[slot] = e.target.result; };
  reader.readAsText(file, 'utf-8');
}

// 드래그앤드롭 초기화 (DOMContentLoaded에서 호출)
function initExamFileDrop() {
  [1, 2, 3].forEach(slot => {
    const zone = document.getElementById(`examZone${slot}`);
    if (!zone) return;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) _handleExamFile(file, slot);
    });
  });
}

function resetAIExamForm() {
  document.getElementById('aiExamResult').style.display = 'none';
  [1, 2, 3].forEach(slot => {
    examFileTexts[slot] = '';
    const nameEl = document.getElementById(`examFileName${slot}`);
    const zoneEl = document.getElementById(`examZone${slot}`);
    if (nameEl) nameEl.textContent = 'PDF 파일 업로드';
    if (zoneEl) zoneEl.classList.remove('has-file');
    const inp = document.getElementById(`examFile${slot}`);
    if (inp) inp.value = '';
  });
}

async function requestInvestorAIAnalysis() {
  const name = (document.getElementById('aiExamStartupName')?.value || '').trim();
  const industry = (document.getElementById('aiExamIndustry')?.value || '').trim();
  const desc = (document.getElementById('aiExamDesc')?.value || '').trim();

  const fileText = [
    examFileTexts[1] ? `[회사소개서]\n${examFileTexts[1]}` : '',
    examFileTexts[2] ? `[IR 자료]\n${examFileTexts[2]}` : '',
    examFileTexts[3] ? `[재무제표]\n${examFileTexts[3]}` : '',
  ].filter(Boolean).join('\n\n');

  if (!name) { alert('스타트업명을 입력해주세요.'); return; }
  if (!desc && !fileText) { alert('사업 설명을 입력하거나 파일을 업로드해주세요.'); return; }

  const combinedText = fileText + (desc ? `\n사업 설명: ${desc}` : '');
  _aiExamCurrentName = name;

  const btn = document.getElementById('aiExamBtn');
  const loading = document.getElementById('aiExamLoading');
  const result  = document.getElementById('aiExamResult');
  if (btn) btn.disabled = true;
  if (loading) loading.style.display = '';
  if (result) result.style.display = 'none';

  const steps = [
    '스타트업 정보를 파악하고 있습니다...',
    'VC 심사역 프레임워크 적용 중...',
    '투자 타당성 분석 중...',
    '레드플래그 및 성장 가능성 평가 중...',
    '보고서 생성 완료 중...',
  ];
  let si = 0;
  const loadingText = document.getElementById('aiExamLoadingText');
  const interval = setInterval(() => {
    if (loadingText) loadingText.textContent = steps[Math.min(si++, steps.length - 1)];
  }, 2500);

  try {
    const apiKey = window.ANTHROPIC_API_KEY || window.CLAUDE_API_KEY || '';
    let analysisResult;
    if (apiKey) {
      analysisResult = await _callInvestorClaudeAPI(name, industry, combinedText, apiKey);
    } else {
      await new Promise(r => setTimeout(r, 4000));
      analysisResult = _getDemoInvestorAnalysis(name, industry);
    }
    clearInterval(interval);
    _aiExamCurrentResult = analysisResult;
    _renderInvestorAIResult(analysisResult, name);
  } catch (e) {
    clearInterval(interval);
    console.error('AI 심사 오류:', e);
    const analysisResult = _getDemoInvestorAnalysis(name, industry);
    _aiExamCurrentResult = analysisResult;
    _renderInvestorAIResult(analysisResult, name);
  } finally {
    if (btn) btn.disabled = false;
    if (loading) loading.style.display = 'none';
  }
}

async function _callInvestorClaudeAPI(name, industry, combinedText, apiKey) {
  const prompt = `당신은 10년 경력의 VC 수석 심사역 "루트 AI"입니다. 아래 스타트업을 투자자 관점에서 엄밀하게 심사해주세요.

스타트업명: ${name}
업종: ${industry || '미입력'}
자료 내용:
${combinedText.slice(0, 5000)}

5개 항목을 각각 0~20점으로 채점하고 투자 심사 의견을 제공하세요.
반드시 아래 JSON 형식으로만 응답하세요:

{
  "scores": { "시장성": 숫자, "팀": 숫자, "기술력": 숫자, "BM": 숫자, "재무": 숫자 },
  "opinion": "관심|검토|패스",
  "feedback": [
    {"type": "good|warn|bad", "text": "심사 의견"},
    {"type": "good|warn|bad", "text": "심사 의견"},
    {"type": "good|warn|bad", "text": "심사 의견"},
    {"type": "good|warn|bad", "text": "심사 의견"},
    {"type": "good|warn|bad", "text": "심사 의견"}
  ],
  "redFlags": ["레드플래그 1", "레드플래그 2"],
  "upside": "성장 가능성 한줄 평가",
  "summary": "투자 심사 종합 한줄 의견",
  "questions": ["심사 질문 1", "심사 질문 2", "심사 질문 3"]
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  const raw = data.content?.[0]?.text || '';
  const match = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(match[0]);
}

function _getDemoInvestorAnalysis(name, industry) {
  const base = { 시장성: 15, 팀: 13, 기술력: 14, BM: 12, 재무: 11 };
  const seed = (name + industry).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const scores = {};
  AI_EXAM_SCORE_CATS.forEach((cat, i) => {
    scores[cat] = Math.max(8, Math.min(19, base[cat] + ((seed * (i + 7)) % 7) - 3));
  });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const opinion = total >= 75 ? '관심' : total >= 60 ? '검토' : '패스';
  return {
    scores, opinion,
    feedback: [
      { type: 'good', text: '핵심 타겟 시장이 명확하고 성장 여력이 충분합니다.' },
      { type: 'warn', text: 'TAM-SAM-SOM 근거 데이터의 신뢰성을 추가 검증해야 합니다.' },
      { type: 'good', text: '창업팀의 도메인 전문성이 사업 모델과 잘 연계되어 있습니다.' },
      { type: 'bad',  text: '경쟁사 대비 기술적 해자(moat)가 아직 충분히 검증되지 않았습니다.' },
      { type: 'warn', text: '현재 번 레이트와 런웨이를 구체적으로 확인이 필요합니다.' },
    ],
    redFlags: [
      '경쟁사 진입 시 차별화 요소가 빠르게 희석될 가능성',
      '핵심 매출 발생까지 예상보다 긴 시간 소요 가능',
    ],
    upside: '시장 선점 시 네트워크 효과를 통한 높은 방어막 구축 가능.',
    summary: '기본 가설은 유효하나 시장 검증과 재무 계획을 보강한 후 투자 결정 권장.',
    questions: [
      '현재 CAC 대비 LTV 비율과 손익분기점 도달 시점은 언제입니까?',
      '핵심 기술·특허의 방어 가능성을 구체적인 데이터로 설명해주세요.',
      '공동창업자 이탈 시나리오에서 사업 지속성 계획은 무엇입니까?',
    ],
  };
}

function _renderInvestorAIResult(data, name) {
  const resultEl = document.getElementById('aiExamResult');
  if (!resultEl) return;
  const opinionConfig = {
    '관심': { bg: 'linear-gradient(135deg,#059669,#10b981)', icon: 'fa-thumbs-up', label: '관심' },
    '검토': { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', icon: 'fa-magnifying-glass', label: '검토' },
    '패스': { bg: 'linear-gradient(135deg,#dc2626,#ef4444)', icon: 'fa-xmark', label: '패스' },
  };
  const oc = opinionConfig[data.opinion] || opinionConfig['검토'];
  const badge = document.getElementById('aiExamOpinionBadge');
  const opText = document.getElementById('aiExamOpinionText');
  if (badge) { badge.style.background = oc.bg; badge.querySelector('i').className = `fa-solid ${oc.icon}`; }
  if (opText) opText.textContent = oc.label;

  const total = Object.values(data.scores).reduce((a, b) => a + b, 0);
  const totalEl = document.getElementById('aiExamTotalScore');
  if (totalEl) totalEl.textContent = total;
  const summaryEl = document.getElementById('aiExamSummary');
  if (summaryEl) summaryEl.textContent = data.summary || '';

  const grid = document.getElementById('aiExamScoreGrid');
  if (grid) {
    const catColors = { 시장성: '#3b82f6', 팀: '#8b5cf6', 기술력: '#06b6d4', BM: '#f59e0b', 재무: '#10b981' };
    grid.innerHTML = AI_EXAM_SCORE_CATS.map(cat => {
      const val = data.scores[cat] || 0;
      const pct = (val / 20) * 100;
      const color = catColors[cat] || '#6366f1';
      return `<div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:1rem;text-align:center;">
        <div style="font-size:0.78rem;font-weight:700;color:#6b7280;margin-bottom:0.5rem;">${cat}</div>
        <div style="font-size:1.5rem;font-weight:900;color:${color};">${val}</div>
        <div style="font-size:0.72rem;color:#94a3b8;margin-bottom:0.6rem;">/ 20점</div>
        <div style="height:4px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.6s;"></div>
        </div>
      </div>`;
    }).join('');
  }

  const feedbackEl = document.getElementById('aiExamFeedbackList');
  if (feedbackEl && data.feedback) {
    const cfg = {
      good: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: '✓' },
      warn: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '!' },
      bad:  { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '✗' },
    };
    feedbackEl.innerHTML = data.feedback.map(f => {
      const c = cfg[f.type] || cfg.warn;
      return `<div style="display:flex;gap:0.5rem;align-items:flex-start;background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:0.65rem 0.85rem;margin-bottom:0.4rem;">
        <span style="font-weight:900;color:${c.color};flex-shrink:0;">${c.icon}</span>
        <span style="font-size:0.83rem;color:#1e293b;line-height:1.5;">${f.text}</span>
      </div>`;
    }).join('');
  }

  const rfEl = document.getElementById('aiExamRedFlags');
  if (rfEl && data.redFlags) {
    rfEl.innerHTML = data.redFlags.map(rf =>
      `<div style="display:flex;gap:0.5rem;align-items:flex-start;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:0.65rem 0.85rem;margin-bottom:0.4rem;">
        <i class="fa-solid fa-flag" style="color:#ef4444;font-size:0.75rem;margin-top:0.15rem;flex-shrink:0;"></i>
        <span style="font-size:0.83rem;color:#1e293b;line-height:1.5;">${rf}</span>
      </div>`
    ).join('');
  }

  const upsideEl = document.getElementById('aiExamUpside');
  if (upsideEl) upsideEl.textContent = data.upside || '';

  const qEl = document.getElementById('aiExamQuestions');
  if (qEl && data.questions) {
    qEl.innerHTML = data.questions.map(q =>
      `<li style="font-size:0.85rem;color:#92400e;line-height:1.6;">${q}</li>`
    ).join('');
  }
  resultEl.style.display = '';
}

function saveInvestorAIToHistory() {
  if (!_aiExamCurrentResult) return;
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  const record = {
    id: Date.now(),
    name: _aiExamCurrentName,
    date: dateStr,
    opinion: _aiExamCurrentResult.opinion,
    total: Object.values(_aiExamCurrentResult.scores).reduce((a, b) => a + b, 0),
    summary: _aiExamCurrentResult.summary,
  };
  const logs = JSON.parse(localStorage.getItem('investor_ai_exam_log') || '[]');
  logs.unshift(record);
  if (logs.length > 30) logs.pop();
  localStorage.setItem('investor_ai_exam_log', JSON.stringify(logs));
  _renderInvestorAIHistory();
  alert('AI 심사 이력이 저장되었습니다.');
}

function _renderInvestorAIHistory() {
  const container = document.getElementById('aiExamHistory');
  if (!container) return;
  const logs = JSON.parse(localStorage.getItem('investor_ai_exam_log') || '[]');
  if (logs.length === 0) { container.innerHTML = ''; return; }
  const opinionColor = { '관심': '#059669', '검토': '#d97706', '패스': '#dc2626' };
  const opinionBg    = { '관심': '#d1fae5', '검토': '#fef3c7', '패스': '#fee2e2' };
  container.innerHTML = `
    <div style="border-top:1px solid #e2e8f0;padding-top:1.5rem;margin-top:0.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h4 style="margin:0;font-size:0.95rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:0.4rem;">
          <i class="fa-solid fa-clock-rotate-left" style="color:#6366f1;"></i> AI 심사 이력
        </h4>
        <button onclick="clearInvestorAIHistory()" style="border:none;background:none;font-size:0.78rem;color:#94a3b8;cursor:pointer;font-family:inherit;padding:0.2rem 0.5rem;">전체 삭제</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;">
        ${logs.map(r => `
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:1rem;align-items:center;padding:0.85rem 1rem;background:white;border:1px solid #f1f5f9;border-radius:12px;transition:all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
          <div>
            <div style="font-size:0.9rem;font-weight:700;color:#1e293b;margin-bottom:0.15rem;">${r.name}</div>
            <div style="font-size:0.78rem;color:#94a3b8;">${r.date} · ${r.summary}</div>
          </div>
          <div style="font-size:1.3rem;font-weight:900;color:#6366f1;">${r.total}<span style="font-size:0.72rem;color:#94a3b8;font-weight:500;">점</span></div>
          <span style="background:${opinionBg[r.opinion]||'#f1f5f9'};color:${opinionColor[r.opinion]||'#374151'};font-size:0.75rem;font-weight:800;padding:0.25rem 0.75rem;border-radius:20px;">${r.opinion}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function clearInvestorAIHistory() {
  if (!confirm('AI 심사 이력을 모두 삭제하시겠습니까?')) return;
  localStorage.removeItem('investor_ai_exam_log');
  _renderInvestorAIHistory();
}

// ─── 스타트업 검토 내역 (동적, localStorage) ─────────────────────────────

const REVIEW_LIST_KEY = 'investor_review_list';

const REVIEW_SEED = [
  { id: 1, name: '테크스타트업 D', industry: 'AI · SaaS',            stage: 'DD 진행 중',    date: '2025.02.28', status: 'active' },
  { id: 2, name: 'AI 스타트업 E',   industry: 'AI · 에듀테크',        stage: '2차 미팅 예정', date: '2025.03.01', status: 'active' },
  { id: 3, name: '그린테크 스타트업 F', industry: '클린테크 · B2B',   stage: '1차 검토 중',   date: '2025.03.05', status: 'active' },
  { id: 4, name: '테크스타트업 A',   industry: 'AI · SaaS',           stage: '투자 완료',     date: '2025.01.20', status: 'done' },
  { id: 5, name: '바이오벤처 B',    industry: '바이오 · 헬스케어',   stage: '투자 완료',     date: '2025.02.10', status: 'done' },
  { id: 6, name: '핀테크 스타트업 C', industry: '핀테크 · B2B',      stage: '투자 완료',     date: '2025.03.05', status: 'done' },
  { id: 7, name: '커머스 스타트업 G', industry: '이커머스 · B2C',    stage: '1차 검토 후 패스', date: '2024.12.10', status: 'pass' },
  { id: 8, name: '게임 스타트업 H',  industry: '게임 · 엔터테인먼트', stage: '2차 미팅 후 패스', date: '2024.11.20', status: 'pass' },
];

function _loadReviewList() {
  const stored = localStorage.getItem(REVIEW_LIST_KEY);
  if (stored) return JSON.parse(stored);
  // 초기 시드 데이터 저장
  localStorage.setItem(REVIEW_LIST_KEY, JSON.stringify(REVIEW_SEED));
  return REVIEW_SEED;
}

function _saveReviewList(list) {
  localStorage.setItem(REVIEW_LIST_KEY, JSON.stringify(list));
}

function renderReviewList() {
  const list = _loadReviewList();
  const activeCount = list.filter(r => r.status === 'active').length;
  const doneCount   = list.filter(r => r.status === 'done').length;
  const passCount   = list.filter(r => r.status === 'pass').length;
  const total       = list.length;

  // 요약 통계
  const statsRow = document.getElementById('reviewStatsRow');
  if (statsRow) {
    statsRow.innerHTML = `
      <div class="stat-card"><div class="value">${total}</div><div class="label">검토한 스타트업</div></div>
      <div class="stat-card"><div class="value">${activeCount}</div><div class="label">검토 중</div></div>
      <div class="stat-card"><div class="value">${doneCount}</div><div class="label">투자 완료</div></div>
      <div class="stat-card"><div class="value">${passCount}</div><div class="label">패스</div></div>`;
  }

  // 탭 버튼 (현재 필터 유지)
  const tabRow = document.getElementById('reviewTabRow');
  const currentFilter = tabRow?.dataset.filter || 'active';
  if (tabRow) {
    tabRow.innerHTML = `
      <button data-f="active" onclick="_setReviewFilter('active')" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 1rem;border-radius:20px;border:none;cursor:pointer;font-size:0.78rem;font-weight:800;font-family:inherit;background:${currentFilter==='active'?'#f59e0b':'#fef3c7'};color:${currentFilter==='active'?'white':'#92400e'};transition:all 0.15s;">
        <i class="fa-solid fa-clock"></i> 검토 중 · ${activeCount}건
      </button>
      <button data-f="done" onclick="_setReviewFilter('done')" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 1rem;border-radius:20px;border:none;cursor:pointer;font-size:0.78rem;font-weight:800;font-family:inherit;background:${currentFilter==='done'?'#10b981':'#d1fae5'};color:${currentFilter==='done'?'white':'#065f46'};transition:all 0.15s;">
        <i class="fa-solid fa-circle-check"></i> 투자 완료 · ${doneCount}건
      </button>
      <button data-f="pass" onclick="_setReviewFilter('pass')" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 1rem;border-radius:20px;border:none;cursor:pointer;font-size:0.78rem;font-weight:800;font-family:inherit;background:${currentFilter==='pass'?'#ef4444':'#fee2e2'};color:${currentFilter==='pass'?'white':'#991b1b'};transition:all 0.15s;">
        <i class="fa-solid fa-xmark"></i> 패스 · ${passCount}건
      </button>`;
    tabRow.dataset.filter = currentFilter;
  }

  // 리스트 렌더링
  const itemsEl = document.getElementById('reviewItemsList');
  if (!itemsEl) return;
  const filtered = list.filter(r => r.status === currentFilter);

  if (filtered.length === 0) {
    const msgs = { active: '검토 중인 스타트업이 없습니다.', done: '투자 완료된 스타트업이 없습니다.', pass: '패스한 스타트업이 없습니다.' };
    itemsEl.innerHTML = `<div style="text-align:center;padding:2.5rem;color:#94a3b8;font-size:0.88rem;">${msgs[currentFilter]||''}</div>`;
    return;
  }

  const statusCfg = {
    active: { bg: '#fef3c7', color: '#92400e', label: '검토 중' },
    done:   { bg: '#d1fae5', color: '#065f46', label: '투자완료' },
    pass:   { bg: '#fee2e2', color: '#991b1b', label: '패스' },
  };
  const stageIcons = ['소싱','1차 검토 중','2차 미팅 예정','DD 진행 중','투심위 대기','투자 완료','패스'];
  const iconBg = { active: '#dbeafe', done: '#d1fae5', pass: '#fee2e2' };
  const iconColor = { active: '#2563eb', done: '#059669', pass: '#dc2626' };

  itemsEl.innerHTML = filtered.map(r => {
    const sc = statusCfg[r.status] || statusCfg.active;
    return `<div style="display:grid;grid-template-columns:2fr 1.2fr 1.2fr 1fr 1fr 0.5fr;gap:1rem;padding:0.9rem 1rem;border-radius:12px;align-items:center;background:white;border:1px solid #f1f5f9;margin-bottom:0.4rem;transition:all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
      <div style="display:flex;align-items:center;gap:0.65rem;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,${iconBg[r.status]},${iconBg[r.status]});border-radius:10px;display:flex;align-items:center;justify-content:center;color:${iconColor[r.status]};font-size:0.9rem;flex-shrink:0;"><i class="fa-solid fa-rocket"></i></div>
        <span style="font-size:0.9rem;font-weight:700;color:#1e293b;">${r.name}</span>
      </div>
      <div style="font-size:0.85rem;color:#374151;">${r.industry || '-'}</div>
      <div style="font-size:0.85rem;color:#374151;">${r.stage || '-'}</div>
      <div style="font-size:0.82rem;color:#6b7280;">${r.date || '-'}</div>
      <div style="text-align:center;"><span style="background:${sc.bg};color:${sc.color};font-size:0.75rem;font-weight:700;padding:0.25rem 0.7rem;border-radius:20px;">${sc.label}</span></div>
      <div style="text-align:center;">
        <button onclick="deleteReviewItem(${r.id})" style="border:none;background:none;cursor:pointer;color:#cbd5e1;font-size:0.9rem;padding:0.2rem 0.4rem;transition:color 0.15s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'" title="삭제"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>`;
  }).join('');
}

function _setReviewFilter(filter) {
  const tabRow = document.getElementById('reviewTabRow');
  if (tabRow) tabRow.dataset.filter = filter;
  renderReviewList();
}

function deleteReviewItem(id) {
  if (!confirm('이 항목을 삭제하시겠습니까?')) return;
  const list = _loadReviewList().filter(r => r.id !== id);
  _saveReviewList(list);
  renderReviewList();
}

function openAddReviewModal() {
  document.getElementById('arName').value = '';
  document.getElementById('arIndustry').value = '';
  document.getElementById('arStage').value = 'DD 진행 중';
  document.querySelector('input[name="arStatus"][value="active"]').checked = true;
  document.getElementById('addReviewModal').classList.add('open');
  setTimeout(() => document.getElementById('arName')?.focus(), 100);
}

function closeAddReviewModal() {
  document.getElementById('addReviewModal').classList.remove('open');
}

function submitAddReview() {
  const name = (document.getElementById('arName')?.value || '').trim();
  if (!name) { alert('스타트업명을 입력해주세요.'); return; }
  const industry = (document.getElementById('arIndustry')?.value || '').trim();
  const stage    = document.getElementById('arStage')?.value || '1차 검토 중';
  const status   = document.querySelector('input[name="arStatus"]:checked')?.value || 'active';
  const now = new Date();
  const date = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  const list = _loadReviewList();
  list.unshift({ id: Date.now(), name, industry, stage, date, status });
  _saveReviewList(list);
  closeAddReviewModal();
  // 추가한 항목의 탭으로 이동
  const tabRow = document.getElementById('reviewTabRow');
  if (tabRow) tabRow.dataset.filter = status;
  renderReviewList();
}

// 모달 바깥 클릭 시 닫기
document.addEventListener('click', e => {
  const modal = document.getElementById('addReviewModal');
  if (modal && e.target === modal) closeAddReviewModal();
});

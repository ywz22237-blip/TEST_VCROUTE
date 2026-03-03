// Notice Data (API에서 로드)
let noticesData = [];
let currentCategory = "all";
let searchQuery = "";

// 샘플 공지사항 데이터 (백엔드 미연결 시 표시)
const SAMPLE_NOTICES = [
  // ── 공지사항 ───────────────────────────────────────────────
  {
    id: 1,
    category: "notice",
    tag: "# 공지",
    title: "VC route 플랫폼 정식 오픈 안내",
    summary: "스타트업과 투자자를 연결하는 VC route가 공식 서비스를 시작합니다. 주요 기능 및 이용 방법을 안내드립니다.",
    author: "VC route 운영팀",
    authorRole: "플랫폼 운영",
    date: "2025-11-05",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1470&auto=format&fit=crop",
    content: "VC route 플랫폼이 2025년 11월부터 정식 서비스를 시작합니다. 스타트업은 투자자 검색 및 매칭 신청 기능을, 투자자는 유망 스타트업 발굴 및 IR 자료 열람 기능을 이용하실 수 있습니다.",
  },
  {
    id: 2,
    category: "notice",
    tag: "# 공지",
    title: "투자 매칭 서비스 이용 가이드 업데이트",
    summary: "더욱 정교해진 매칭 알고리즘 적용 및 이용 가이드가 업데이트되었습니다. 변경된 사항을 확인해 주세요.",
    author: "VC route 운영팀",
    authorRole: "플랫폼 운영",
    date: "2025-11-18",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1470&auto=format&fit=crop",
    content: "투자 매칭 서비스 이용 가이드가 업데이트되었습니다. 산업 분류 체계 개편, 투자 단계별 필터 추가, 관심 분야 기반 맞춤 추천 기능이 강화되었습니다.",
  },
  {
    id: 3,
    category: "notice",
    tag: "# 공지",
    title: "기업 인증 절차 및 서류 안내",
    summary: "VC route에서 기업 회원으로 활동하기 위한 인증 절차와 제출 서류를 안내드립니다.",
    author: "VC route 운영팀",
    authorRole: "회원 관리",
    date: "2025-12-02",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop",
    content: "기업 인증을 위해 사업자등록증, 벤처기업확인서(해당 시), IR 자료 등 필수 서류를 준비해 주세요. 인증 완료 후 투자자 매칭 기능이 활성화됩니다.",
  },
  {
    id: 4,
    category: "notice",
    tag: "# 공지",
    title: "시스템 점검 및 신기능 출시 안내 (12월)",
    summary: "2025년 12월 15일 오전 2시~6시 시스템 점검이 진행됩니다. 점검 후 DCF 계산기, 비교 분석 기능이 출시됩니다.",
    author: "VC route 개발팀",
    authorRole: "기술 운영",
    date: "2025-12-10",
    thumbnail: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=1374&auto=format&fit=crop",
    content: "12월 15일 새벽 점검을 통해 기업가치 평가 도구(DCF 계산기), 투자사 비교 분석 대시보드, 알림 센터 기능이 추가됩니다. 이용에 불편을 드려 죄송합니다.",
  },
  {
    id: 5,
    category: "notice",
    tag: "# 공지",
    title: "2026년 플랫폼 운영 정책 변경 안내",
    summary: "2026년 1월부터 변경되는 서비스 약관 및 운영 정책에 대해 안내드립니다. 주요 변경 사항을 꼭 확인해 주세요.",
    author: "VC route 운영팀",
    authorRole: "플랫폼 운영",
    date: "2025-12-26",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1470&auto=format&fit=crop",
    content: "2026년 1월 1일부터 유료 매칭 서비스 도입, 프리미엄 회원제 운영, 투자 성사 수수료 정책이 적용됩니다. 기존 무료 기능은 계속 제공됩니다.",
  },
  {
    id: 6,
    category: "notice",
    tag: "# 공지",
    title: "개인정보 처리방침 개정 안내",
    summary: "개인정보 보호법 개정에 따른 처리방침 변경 사항을 안내드립니다. 2026년 1월 20일부터 적용됩니다.",
    author: "VC route 운영팀",
    authorRole: "법무 · 컴플라이언스",
    date: "2026-01-08",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop",
    content: "개인정보 수집 항목 최소화, 제3자 제공 동의 절차 강화, 데이터 보관 기간 단축 등의 내용이 개정되었습니다. 서비스 이용 전 반드시 확인해 주세요.",
  },
  {
    id: 7,
    category: "notice",
    tag: "# 공지",
    title: "모바일 앱 출시 사전 등록 안내",
    summary: "VC route 모바일 앱이 2026년 2월 출시 예정입니다. 사전 등록 시 3개월 프리미엄 멤버십이 무료로 제공됩니다.",
    author: "VC route 개발팀",
    authorRole: "기술 운영",
    date: "2026-01-20",
    thumbnail: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=1374&auto=format&fit=crop",
    content: "iOS 및 Android 앱을 통해 언제 어디서나 투자자 탐색, 알림 수신, IR 자료 열람이 가능해집니다. 사전 등록은 공식 홈페이지에서 가능합니다.",
  },

  // ── 투자 리포트 ────────────────────────────────────────────
  {
    id: 8,
    category: "report",
    tag: "# 투자리포트",
    title: "2025년 4분기 국내 벤처투자 동향 분석",
    summary: "2025년 4분기 국내 VC 투자 집행 현황과 주목할 섹터, 투자 단계별 변화 추이를 분석한 리포트입니다.",
    author: "리서치팀",
    authorRole: "Market Intelligence",
    date: "2025-11-10",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    content: "2025년 4분기 국내 벤처투자 총액은 전분기 대비 약 8% 증가한 1조 2,400억원으로 집계되었습니다. AI, 바이오, 소재·부품·장비 분야에 투자가 집중되었으며, Pre-A~Series A 단계 투자 비중이 확대되었습니다.",
  },
  {
    id: 9,
    category: "report",
    tag: "# 투자리포트",
    title: "AI·딥테크 분야 투자 트렌드 및 전망 보고서",
    summary: "생성형 AI, 로보틱스, 양자컴퓨팅 등 딥테크 분야의 국내외 투자 트렌드와 주요 투자사 동향을 정리했습니다.",
    author: "리서치팀",
    authorRole: "Market Intelligence",
    date: "2025-11-25",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1365&auto=format&fit=crop",
    content: "글로벌 AI 투자 규모는 2025년 전년 대비 34% 성장이 예상되며, 국내에서도 카카오벤처스·네이버 D2SF 등 주요 CVC를 중심으로 생성형 AI 스타트업 투자가 급증하고 있습니다.",
  },
  {
    id: 10,
    category: "report",
    tag: "# 투자리포트",
    title: "2025 하반기 VC 펀드 결성 현황 리포트",
    summary: "2025년 하반기 신규 결성된 VC 펀드 현황, 모태펀드 자펀드 출자 현황 및 주요 LP 동향을 분석합니다.",
    author: "리서치팀",
    authorRole: "Fund Analytics",
    date: "2025-12-05",
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1470&auto=format&fit=crop",
    content: "2025년 하반기 신규 VC 펀드 결성 총액은 약 3조 8,000억원으로 역대 최고 수준을 기록했습니다. 기후테크, 바이오, 방산 테크 분야의 정책펀드 출자가 대폭 확대된 영향입니다.",
  },
  {
    id: 11,
    category: "report",
    tag: "# 투자리포트",
    title: "바이오·헬스케어 스타트업 투자 시장 전망",
    summary: "국내외 바이오 투자 회복세와 디지털헬스, AI 신약개발 분야의 유망 투자 기회를 심층 분석합니다.",
    author: "리서치팀",
    authorRole: "Sector Analysis",
    date: "2025-12-18",
    thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1374&auto=format&fit=crop",
    content: "2025년 하반기 바이오·헬스케어 분야 투자가 회복세로 전환되었습니다. AI 신약개발 플랫폼, 디지털치료기기(DTx), 정밀의료 분야에 대한 투자 수요가 높아지고 있습니다.",
  },
  {
    id: 12,
    category: "report",
    tag: "# 투자리포트",
    title: "글로벌 스타트업 생태계 대비 국내 경쟁력 분석",
    summary: "실리콘밸리·이스라엘·싱가포르 등 글로벌 스타트업 허브와 국내 생태계를 비교 분석한 심층 리포트입니다.",
    author: "리서치팀",
    authorRole: "Global Research",
    date: "2025-12-30",
    thumbnail: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=1374&auto=format&fit=crop",
    content: "국내 스타트업 생태계는 반도체, 배터리, 콘텐츠 분야에서 글로벌 경쟁력을 갖추고 있으나, 딥테크 원천기술 기반 창업과 글로벌 시장 진출 비중은 아직 낮은 편입니다.",
  },
  {
    id: 13,
    category: "report",
    tag: "# 투자리포트",
    title: "2025년 연간 스타트업 투자 결산 리포트",
    summary: "2025년 한 해 국내 스타트업 투자 흐름을 총정리했습니다. 유니콘 탄생 현황, 대형 투자 딜, 주목받은 팀들을 소개합니다.",
    author: "리서치팀",
    authorRole: "Market Intelligence",
    date: "2026-01-08",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    content: "2025년 국내 스타트업 투자 총액은 약 14조원으로 전년 대비 12% 성장했습니다. 신규 유니콘 기업 5개사가 탄생했으며, AI·기후테크·방산 분야의 메가딜이 두드러졌습니다.",
  },
  {
    id: 14,
    category: "report",
    tag: "# 투자리포트",
    title: "2026년 유망 투자 섹터 전망 및 추천 테마",
    summary: "VC route 리서치팀이 선정한 2026년 주목할 투자 테마 7가지와 각 분야 유망 스타트업 사례를 소개합니다.",
    author: "리서치팀",
    authorRole: "Sector Analysis",
    date: "2026-01-22",
    thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1471&auto=format&fit=crop",
    content: "2026년 주목 테마: ①생성형 AI 인프라 ②기후테크·탄소중립 ③방산 테크 ④디지털헬스 ⑤공간 컴퓨팅 ⑥푸드테크 ⑦K-콘텐츠 IP 비즈니스. 각 분야별 유망 스타트업과 투자 타이밍 분석을 담았습니다.",
  },

  // ── 이벤트 ─────────────────────────────────────────────────
  {
    id: 15,
    category: "event",
    tag: "# 이벤트",
    title: "스타트업 × 투자사 1:1 매칭 IR Day (11월)",
    summary: "검증된 초기 스타트업 20팀과 주요 VC·CVC 투자심사역이 1:1로 만나는 집중 IR 매칭 행사입니다. 사전 신청 필수.",
    author: "VC route 이벤트팀",
    authorRole: "Event Management",
    date: "2025-11-14",
    thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1470&auto=format&fit=crop",
    content: "11월 14일(목) 서울 강남구 소재 이벤트 홀에서 진행됩니다. 참가 스타트업은 20분 피칭과 15분 Q&A를 통해 최대 5개 투자사와 만남의 기회를 갖습니다. 11월 10일까지 사전 신청 바랍니다.",
  },
  {
    id: 16,
    category: "event",
    tag: "# 이벤트",
    title: "모태펀드 자조합 운용사 설명회",
    summary: "한국벤처투자 주관 모태펀드 자조합 신규 출자사업 설명회가 개최됩니다. 자조합 결성 계획이 있는 VC 필참.",
    author: "VC route 운영팀",
    authorRole: "Partnership",
    date: "2025-11-27",
    thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1469&auto=format&fit=crop",
    content: "한국벤처투자의 2026년 모태펀드 출자사업 설명회입니다. 출자 분야, 신청 자격, 일정 등 상세 내용이 안내될 예정입니다. 사전 등록 후 참석 가능합니다.",
  },
  {
    id: 17,
    category: "event",
    tag: "# 이벤트",
    title: "2025 Winter VC route 데모데이",
    summary: "2025년 겨울 데모데이에서 선발된 스타트업 15팀이 50명의 투자자 앞에서 피칭합니다. 투자자 참관 신청을 받습니다.",
    author: "VC route 이벤트팀",
    authorRole: "Event Management",
    date: "2025-12-11",
    thumbnail: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop",
    content: "AI, 바이오, 클라이밋테크, 핀테크 4개 트랙으로 구성된 데모데이입니다. 피칭 후 현장 투자 의향서(LOI) 작성 및 네트워킹 시간이 제공됩니다. 투자사 사전 등록 시 부스 배정 우선 제공.",
  },
  {
    id: 18,
    category: "event",
    tag: "# 이벤트",
    title: "신규 가입 스타트업 무료 기업가치 진단 이벤트",
    summary: "12월 한 달간 VC route에 신규 가입하는 스타트업에게 전문가의 기업가치 진단 리포트를 무료로 제공합니다.",
    author: "VC route 운영팀",
    authorRole: "Growth",
    date: "2025-12-01",
    thumbnail: "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1374&auto=format&fit=crop",
    content: "DCF 기반 기업가치 평가, 투자 매력도 점수, 경쟁사 비교 분석 리포트를 무료로 제공합니다. 12월 31일까지 가입 완료한 기업에 한해 적용됩니다.",
  },
  {
    id: 19,
    category: "event",
    tag: "# 이벤트",
    title: "VC route 신년 투자자 네트워킹 파티 2026",
    summary: "2026년 새해를 맞아 투자자·창업가·VC 심사역이 한자리에 모이는 연례 네트워킹 행사를 개최합니다.",
    author: "VC route 이벤트팀",
    authorRole: "Event Management",
    date: "2026-01-09",
    thumbnail: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1470&auto=format&fit=crop",
    content: "100명 규모의 소규모 네트워킹 파티로 진행됩니다. 투자자 스피치, 스타트업 피칭 쇼케이스, 자유 네트워킹 순서로 진행되며 1월 7일까지 RSVP 신청 바랍니다.",
  },
  {
    id: 20,
    category: "event",
    tag: "# 이벤트",
    title: "투자 피칭 클리닉 — 현직 VC 심사역 멘토링 세션",
    summary: "현직 VC 파트너 및 심사역 10명이 직접 피드백을 제공하는 피칭 클리닉입니다. 팀당 30분 1:1 집중 코칭.",
    author: "VC route 이벤트팀",
    authorRole: "Event Management",
    date: "2026-01-23",
    thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1470&auto=format&fit=crop",
    content: "Seed~Series A 단계의 스타트업을 대상으로 하는 피칭 클리닉입니다. IR 덱 리뷰, 비즈니스 모델 피드백, 투자 유치 전략 조언이 제공됩니다. 사전 IR 자료 제출 필수.",
  },
];

// 샘플 데이터 사용 함수
function useSampleNotices() {
  noticesData = SAMPLE_NOTICES;
  renderNotices();
  updateCount(noticesData.length);
}

// API에서 공지사항 데이터 로드
async function loadNoticesFromAPI() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/notices`);
    if (response.ok) {
      noticesData = await response.json();
      renderNotices();
      updateCount(noticesData.length);
    } else {
      console.warn("공지사항 데이터 로드 실패:", response.status, "→ 샘플 데이터 사용");
      useSampleNotices();
    }
  } catch (error) {
    console.warn("공지사항 API 연결 오류:", error, "→ 샘플 데이터 사용");
    useSampleNotices();
  }
}

function showNoNoticesMessage() {
  const noticeList = document.getElementById("noticeList");
  const noResults = document.getElementById("noResults");
  if (noticeList) noticeList.innerHTML = "";
  if (noResults) noResults.style.display = "block";
  updateCount(0);
}

// 날짜를 상대적 시간으로 변환
function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "1일 전";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 14) return "1주일 전";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주일 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // URL 파라미터 확인 (카테고리 필터링 지원)
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  if (
    categoryParam &&
    ["notice", "update", "event", "report", "demoday"].includes(categoryParam)
  ) {
    currentCategory = categoryParam;

    // UI 업데이트
    document.querySelectorAll(".filter-item").forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.category === categoryParam) {
        item.classList.add("active");
      }
    });

    const categoryLabels = {
      notice: "공지사항",
      update: "데모데이",
      demoday: "데모데이",
      event: "이벤트",
      report: "투자 리포트",
    };
    const labelEl = document.getElementById("categoryLabel");
    if (labelEl) {
      labelEl.textContent = categoryLabels[categoryParam] || "전체";
    }
  }

  loadNoticesFromAPI();
});

// 카테고리별 태그 매핑
function getCategoryTag(category) {
  const tags = {
    notice: "# 공지",
    update: "# 업데이트",
    demoday: "# 데모데이",
    event: "# 이벤트",
    report: "# 투자리포트",
  };
  return tags[category] || "# 공지";
}

// 기본 썸네일
function getDefaultThumbnail(category) {
  const thumbnails = {
    notice: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1470&auto=format&fit=crop",
    update: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=1374&auto=format&fit=crop",
    demoday: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1470&auto=format&fit=crop",
    event: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1470&auto=format&fit=crop",
    report: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
  };
  return thumbnails[category] || thumbnails.notice;
}

// Render Notices
function renderNotices() {
  const noticeList = document.getElementById("noticeList");
  const noResults = document.getElementById("noResults");

  if (!noticeList) return;

  const filtered = noticesData
    .filter((notice) => {
      const matchesCategory =
        currentCategory === "all" || notice.category === currentCategory;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (notice.title || "").toLowerCase().includes(query) ||
        (notice.summary || "").toLowerCase().includes(query) ||
        (notice.author || "").toLowerCase().includes(query) ||
        (notice.tag || "").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신순 정렬

  if (filtered.length === 0) {
    noticeList.innerHTML = "";
    noResults.style.display = "block";
  } else {
    noResults.style.display = "none";
    noticeList.innerHTML = filtered
      .map(
        (notice) => `
      <article class="notice-card" onclick="openNoticeDetail(${notice.id})">
        <div class="notice-card-content">
          <span class="notice-tag">${notice.tag || getCategoryTag(notice.category)}</span>
          <h2 class="notice-title">${notice.title}</h2>
          <p class="notice-summary">${notice.summary || ""}</p>
          <div class="notice-footer">
            <div class="author-img"></div>
            <div class="author-info">
              <span class="author-name">${notice.author || "관리자"}</span>
              <span class="author-divider">|</span>
              <span class="author-role" style="color: var(--eopla-text-secondary);">${notice.authorRole || "VC route Team"}</span>
              <span class="author-divider">|</span>
              <span class="notice-date">${formatRelativeDate(notice.date)}</span>
            </div>
          </div>
        </div>
        <div class="notice-thumbnail">
          <img src="${notice.thumbnail || getDefaultThumbnail(notice.category)}" alt="thumbnail" onerror="this.src='https://via.placeholder.com/140x140/252529/B6B7BC?text=VCroute'">
        </div>
      </article>
    `,
      )
      .join("");
  }

  updateCount(filtered.length);
}

// Category Filter
function filterCategory(category) {
  currentCategory = category;

  // Update UI (filter-item active class)
  document.querySelectorAll(".filter-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.category === category) {
      item.classList.add("active");
    }
  });

  const categoryLabels = {
    all: "전체",
    notice: "공지사항",
    update: "데모데이",
    event: "이벤트",
    report: "투자 리포트",
  };
  const labelEl = document.getElementById("categoryLabel");
  if (labelEl) {
    labelEl.textContent = categoryLabels[category] || "전체";
  }

  handleSearch(); // Re-render with new filter
}

// Reset Filters
function resetFilters() {
  currentCategory = "all";
  clearNoticeSearch();
  filterCategory("all");
}

// 검색 초기화 함수
function clearNoticeSearch() {
  const input = document.getElementById("noticeSearch");
  const clearBtn = document.getElementById("searchClear");
  const searchStats = document.getElementById("searchStats");

  input.value = "";
  searchQuery = "";
  clearBtn.classList.remove("visible");
  searchStats.style.display = "none";

  renderNotices();
}

// Search Handler
function handleSearch() {
  const input = document.getElementById("noticeSearch");
  const clearBtn = document.getElementById("searchClear");
  const searchStats = document.getElementById("searchStats");
  const searchKeyword = document.getElementById("searchKeyword");

  searchQuery = input.value.trim();

  // Clear 버튼 및 검색 통계 표시
  if (searchQuery.length > 0) {
    clearBtn.classList.add("visible");
    searchStats.style.display = "flex";
    searchKeyword.textContent = searchQuery;
  } else {
    clearBtn.classList.remove("visible");
    searchStats.style.display = "none";
  }

  renderNotices();
}

// Update Count
function updateCount(count = 0) {
  const countEl = document.getElementById("noticeCount");
  if (countEl) countEl.textContent = count;
}

// Modal Interaction (Mock)
function openNoticeDetail(id) {
  const notice = noticesData.find((n) => n.id === id);
  if (!notice) return;

  alert(`${notice.title} 상세 내용을 표시합니다. (준비 중)`);
}

function closeNoticeModal() {
  document.getElementById("noticeModal").style.display = "none";
  document.body.style.overflow = "auto";
}

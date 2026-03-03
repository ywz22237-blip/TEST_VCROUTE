// 투자펀드 데이터 (API에서 로드)
let fundsData = [];
let filteredFunds = [];

// 샘플 데이터 (한국벤처투자 모태펀드 자조합 운용사정보 기반)
const SAMPLE_FUNDS = [
  { id: 1,  fundType: "투자조합", companyName: "스틱벤처스",            fundName: "스틱벤처스 제1호 혁신성장 모태자조합",        registeredAt: "2015-06-10", expiredAt: "2022-06-10", settlementMonth: 12, manager: "정재훈", support: "모태펀드", purpose: "혁신 ICT 및 AI 기반 초기기업 발굴·투자 및 글로벌 경쟁력 강화",          industry: "ICT, AI, 빅데이터",       baseRate: 8.0,  totalAmount: 33400000000 },
  { id: 2,  fundType: "투자조합", companyName: "엘비인베스트먼트",        fundName: "엘비 창업기업 지원 모태자조합",                registeredAt: "2016-03-15", expiredAt: "2023-03-15", settlementMonth: 12, manager: "이병철", support: "모태펀드", purpose: "창업초기기업 발굴 및 집중 육성, 바이오·헬스케어 분야 특화 투자",       industry: "바이오, 헬스케어, ICT",   baseRate: 7.0,  totalAmount: 25000000000 },
  { id: 3,  fundType: "투자조합", companyName: "에스엘인베스트먼트",      fundName: "에스엘 기술혁신 모태자조합",                   registeredAt: "2016-08-20", expiredAt: "2023-08-20", settlementMonth: 12, manager: "손민호", support: "모태펀드", purpose: "소재·부품·장비 및 딥테크 기술기업 초기 투자",                          industry: "소부장, 딥테크, 제조",    baseRate: 7.5,  totalAmount: 26904000000 },
  { id: 4,  fundType: "투자조합", companyName: "에스제이벤처인베스트먼트", fundName: "에스제이 시드앤그로스 모태자조합",              registeredAt: "2017-01-05", expiredAt: "2024-01-05", settlementMonth: 12, manager: "서준혁", support: "모태펀드", purpose: "시드·Pre-A 단계 스타트업 발굴 및 창업 생태계 활성화 지원",             industry: "ICT, 콘텐츠, 커머스",    baseRate: 7.0,  totalAmount: 20000000000 },
  { id: 5,  fundType: "투자조합", companyName: "한화투자증권",            fundName: "한화 신기술 성장 모태자조합",                  registeredAt: "2015-11-30", expiredAt: "2022-11-30", settlementMonth:  6, manager: "김준영", support: "모태펀드", purpose: "신기술 기반 성장기업 투자 및 기업가치 제고",                          industry: "신기술, 에너지, 제조",    baseRate: 8.5,  totalAmount: 20000000000 },
  { id: 6,  fundType: "투자조합", companyName: "일신창업투자",            fundName: "일신 혁신창업 모태자조합",                     registeredAt: "2013-04-15", expiredAt: "2020-04-15", settlementMonth: 12, manager: "박일신", support: "모태펀드", purpose: "창업초기 혁신기업 발굴 및 성장 단계별 후속 투자 지원",                 industry: "ICT, AI, 바이오",         baseRate: 8.0,  totalAmount: 95236000000 },
  { id: 7,  fundType: "투자조합", companyName: "스톤브릿지벤처스",        fundName: "스톤브릿지 디지털트랜스포메이션 모태자조합",    registeredAt: "2018-07-10", expiredAt: "2025-07-10", settlementMonth: 12, manager: "석준혁", support: "모태펀드", purpose: "디지털 전환(DX) 핵심 기술 및 플랫폼 기업 집중 투자",                  industry: "플랫폼, DX, 클라우드",    baseRate: 7.5,  totalAmount: 51500000000 },
  { id: 8,  fundType: "투자조합", companyName: "센츄리온기술투자",        fundName: "센츄리온 기술특화 모태자조합",                 registeredAt: "2017-09-01", expiredAt: "2024-09-01", settlementMonth: 12, manager: "최기원", support: "모태펀드", purpose: "국방·우주·보안 등 특수목적 기술 분야 초기기업 투자",                  industry: "방산, 우주, 보안",        baseRate: 8.0,  totalAmount: 25250000000 },
  { id: 9,  fundType: "투자조합", companyName: "스마일게이트인베스트먼트", fundName: "스마일게이트 게임&콘텐츠 모태자조합",           registeredAt: "2019-03-22", expiredAt: "2026-03-22", settlementMonth: 12, manager: "권혁진", support: "모태펀드", purpose: "게임·엔터테인먼트·콘텐츠 분야 창의적 스타트업 투자 및 육성",          industry: "게임, 콘텐츠, 엔터",     baseRate: 7.0,  totalAmount: 12000000000 },
  { id: 10, fundType: "투자조합", companyName: "원익투자파트너스",        fundName: "원익 소부장 전문 모태자조합",                  registeredAt: "2020-05-20", expiredAt: "2027-05-20", settlementMonth: 12, manager: "이원익", support: "모태펀드", purpose: "소재·부품·장비 국산화 및 공급망 안정화를 위한 기술기업 집중 투자",    industry: "소부장, 반도체, 제조",    baseRate: 7.0,  totalAmount:  5000000000 },
  { id: 11, fundType: "투자조합", companyName: "인터베스트",              fundName: "인터베스트 글로벌 모태자조합",                 registeredAt: "2016-10-10", expiredAt: "2023-10-10", settlementMonth: 12, manager: "남인철", support: "모태펀드", purpose: "글로벌 진출 가능성이 높은 기술기업 투자 및 해외 네트워크 연계 지원",  industry: "ICT, AI, SaaS",          baseRate: 8.0,  totalAmount: 28000000000 },
  { id: 12, fundType: "투자조합", companyName: "에스유앤피",              fundName: "에스유앤피 융합기술 모태자조합",               registeredAt: "2018-02-14", expiredAt: "2025-02-14", settlementMonth: 12, manager: "유성필", support: "모태펀드", purpose: "ICT 융합 기술 및 서비스 모델 혁신 창업기업 투자",                     industry: "ICT, 핀테크, 커머스",    baseRate: 7.5,  totalAmount: 15000000000 },
  { id: 13, fundType: "투자조합", companyName: "화이텍인베스트먼트",      fundName: "화이텍 하드웨어 혁신 모태자조합",              registeredAt: "2019-08-08", expiredAt: "2026-08-08", settlementMonth: 12, manager: "황재민", support: "모태펀드", purpose: "하드웨어 및 제조 기반 딥테크 스타트업 발굴·투자",                     industry: "하드웨어, 로봇, 제조",   baseRate: 7.0,  totalAmount: 10000000000 },
  { id: 14, fundType: "투자조합", companyName: "프리미어파트너스",        fundName: "프리미어 글로벌임팩트 모태자조합",             registeredAt: "2017-06-01", expiredAt: "2024-06-01", settlementMonth:  6, manager: "방성훈", support: "모태펀드", purpose: "임팩트·ESG 및 글로벌 진출 역량 보유 스타트업 투자",                   industry: "임팩트, ESG, 글로벌",    baseRate: 7.0,  totalAmount: 50000000000 },
  { id: 15, fundType: "투자조합", companyName: "유안타인베스트먼트",      fundName: "유안타 핀테크&플랫폼 모태자조합",             registeredAt: "2020-01-15", expiredAt: "2027-01-15", settlementMonth: 12, manager: "안준호", support: "모태펀드", purpose: "핀테크·디지털금융 및 플랫폼 서비스 기업 초기 투자 및 성장 지원",      industry: "핀테크, 플랫폼, SaaS",   baseRate: 7.5,  totalAmount: 10500000000 },
  { id: 16, fundType: "투자조합", companyName: "에이티넘인베스트먼트",    fundName: "에이티넘 바이오&헬스 모태자조합",             registeredAt: "2015-03-20", expiredAt: "2022-03-20", settlementMonth: 12, manager: "엄태준", support: "모태펀드", purpose: "바이오·의료기기 및 디지털헬스 분야 기술기업 발굴 및 글로벌 임상 지원", industry: "바이오, 의료기기, 헬스케어", baseRate: 8.0, totalAmount: 11000000000 },
  { id: 17, fundType: "투자조합", companyName: "신한캐피탈",              fundName: "신한 그린에너지 모태자조합",                  registeredAt: "2016-07-20", expiredAt: "2023-07-20", settlementMonth:  6, manager: "신현우", support: "모태펀드", purpose: "그린에너지·친환경·탄소중립 관련 신기술 기업 투자 및 ESG 가치 실현",  industry: "그린에너지, 환경, ESG",  baseRate: 8.5,  totalAmount: 10000000000 },
  { id: 18, fundType: "투자조합", companyName: "케이디파트너스",          fundName: "케이디 문화콘텐츠 모태자조합",                registeredAt: "2019-11-11", expiredAt: "2026-11-11", settlementMonth: 12, manager: "김도훈", support: "모태펀드", purpose: "K-콘텐츠·문화·한류 기반 글로벌 확장 가능 기업 투자",                  industry: "콘텐츠, 미디어, 한류",   baseRate: 6.5,  totalAmount: 10000000000 },
  { id: 19, fundType: "투자조합", companyName: "마이벤처파트너스",        fundName: "마이벤처 딥테크 시드 모태자조합",             registeredAt: "2021-02-01", expiredAt: "2028-02-01", settlementMonth: 12, manager: "박마루", support: "모태펀드", purpose: "딥테크·R&D 기반 초기 창업기업 발굴 및 기술 상용화 지원",             industry: "딥테크, AI, 반도체",     baseRate: 7.0,  totalAmount: 11100000000 },
  { id: 20, fundType: "투자조합", companyName: "대성창업투자",            fundName: "대성 에너지&소재 모태자조합",                 registeredAt: "2014-09-25", expiredAt: "2021-09-25", settlementMonth: 12, manager: "대성근", support: "모태펀드", purpose: "에너지·신소재 분야 원천기술 보유 창업기업 집중 투자 및 사업화 지원",  industry: "에너지, 신소재, 화학",   baseRate: 8.0,  totalAmount: 17000000000 },
  { id: 21, fundType: "투자조합", companyName: "아이비케이캐피탈",        fundName: "IBK 중소벤처 성장 모태자조합",                registeredAt: "2016-05-09", expiredAt: "2023-05-09", settlementMonth:  6, manager: "임병국", support: "모태펀드", purpose: "중소·벤처기업의 스케일업 및 IPO 준비 지원을 위한 성장 투자",         industry: "제조, ICT, 바이오",      baseRate: 8.5,  totalAmount: 13000000000 },
  { id: 22, fundType: "투자조합", companyName: "아주아이비투자",          fundName: "아주 신기술 인프라 모태자조합",               registeredAt: "2015-12-01", expiredAt: "2022-12-01", settlementMonth: 12, manager: "아준성", support: "모태펀드", purpose: "스마트시티·인프라·신기술 융합 기업 투자 및 공공 솔루션 상용화 지원",  industry: "스마트시티, 인프라, ICT", baseRate: 8.0, totalAmount: 16000000000 },
  { id: 23, fundType: "투자조합", companyName: "파트너스인베스트먼트",    fundName: "파트너스 중기도약 모태자조합",                registeredAt: "2018-04-30", expiredAt: "2025-04-30", settlementMonth: 12, manager: "파동현", support: "모태펀드", purpose: "중기 도약 단계 기업 후속 투자 및 M&A·전략적 제휴 연계 지원",         industry: "제조, 유통, 서비스",     baseRate: 7.5,  totalAmount: 15000000000 },
  { id: 24, fundType: "투자조합", companyName: "케이비인베스트먼트",      fundName: "KB 혁신금융 모태자조합",                      registeredAt: "2017-08-22", expiredAt: "2024-08-22", settlementMonth:  6, manager: "권병철", support: "모태펀드", purpose: "금융혁신 및 핀테크 기반 디지털 전환 스타트업 집중 투자",              industry: "핀테크, 보험테크, SaaS", baseRate: 8.0,  totalAmount: 20000000000 },
  { id: 25, fundType: "투자조합", companyName: "에이치비인베스트먼트",    fundName: "에이치비 시드브릿지 모태자조합",              registeredAt: "2020-09-10", expiredAt: "2027-09-10", settlementMonth: 12, manager: "황병찬", support: "모태펀드", purpose: "Pre-Seed~Seed 단계 초기 스타트업 Bridge 투자 및 TIPS 연계 지원",    industry: "AI, 커머스, 헬스케어",   baseRate: 6.5,  totalAmount:  5000000000 },
  { id: 26, fundType: "투자조합", companyName: "이노폴리스파트너스",      fundName: "이노폴리스 지역혁신 모태자조합",              registeredAt: "2013-10-14", expiredAt: "2020-10-14", settlementMonth: 12, manager: "이혁수", support: "모태펀드", purpose: "지방 혁신거점(대덕·판교·광교) 소재 딥테크 기업 투자 및 클러스터 연계", industry: "딥테크, 반도체, 소부장",  baseRate: 8.0, totalAmount: 80000000000 },
  { id: 27, fundType: "투자조합", companyName: "우리인베스트먼트",        fundName: "우리 벤처스타트업 모태자조합",                registeredAt: "2019-06-17", expiredAt: "2026-06-17", settlementMonth: 12, manager: "우성진", support: "모태펀드", purpose: "벤처·스타트업 생태계 강화를 위한 초기·성장 단계 전방위 투자",         industry: "ICT, 바이오, 모빌리티",  baseRate: 7.5,  totalAmount: 18700000000 },
  { id: 28, fundType: "투자조합", companyName: "씨제이인베스트먼트",      fundName: "CJ 콘텐츠&라이프스타일 모태자조합",           registeredAt: "2020-03-05", expiredAt: "2027-03-05", settlementMonth: 12, manager: "최재훈", support: "모태펀드", purpose: "K-콘텐츠·라이프스타일·푸드테크 분야 혁신 창업기업 투자 및 CJ 생태계 연계", industry: "콘텐츠, 푸드테크, 라이프", baseRate: 7.0, totalAmount: 10000000000 },
  { id: 29, fundType: "투자조합", companyName: "플래티넘기술투자",        fundName: "플래티넘 딥사이언스 모태자조합",              registeredAt: "2021-07-19", expiredAt: "2028-07-19", settlementMonth: 12, manager: "백진우", support: "모태펀드", purpose: "대학·연구소 스핀오프 딥사이언스 기업 초기 투자 및 기술 상용화 연계",  industry: "딥사이언스, 바이오, AI",  baseRate: 7.0, totalAmount: 10000000000 },
  { id: 30, fundType: "투자조합", companyName: "신한벤처투자",            fundName: "신한 ESG임팩트 모태자조합",                   registeredAt: "2021-01-04", expiredAt: "2028-01-04", settlementMonth: 12, manager: "신준혁", support: "모태펀드", purpose: "ESG·임팩트 투자 원칙에 기반한 사회·환경적 가치 창출 기업 집중 투자",  industry: "ESG, 그린테크, 사회적기업", baseRate: 7.0, totalAmount: 20000000000 },
];

// API에서 펀드 데이터 로드
async function loadFundsFromAPI() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/funds`);
    if (response.ok) {
      const raw = await response.json();
      fundsData = raw.sort(
        (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
      );
      filteredFunds = [...fundsData];
      renderFunds(fundsData);
      updateResultsCount(fundsData.length);
    } else {
      console.error("펀드 데이터 로드 실패:", response.status);
      useSampleFunds();
    }
  } catch (error) {
    console.error("펀드 API 연결 오류:", error);
    useSampleFunds();
  }
}

function useSampleFunds() {
  fundsData = [...SAMPLE_FUNDS].sort(
    (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
  );
  filteredFunds = [...fundsData];
  renderFunds(fundsData);
  updateResultsCount(fundsData.length);
}

function showNoDataMessage() {
  const grid = document.getElementById("fundsGrid");
  const noResults = document.getElementById("noResults");
  if (grid) grid.style.display = "none";
  if (noResults) noResults.style.display = "block";
  updateResultsCount(0);
}

// 페이지 로직
document.addEventListener("DOMContentLoaded", () => {
  loadFundsFromAPI();
});

// 펀드 카드 렌더링
function renderFunds(funds) {
  const grid = document.getElementById("fundsGrid");
  const noResults = document.getElementById("noResults");

  if (funds.length === 0) {
    grid.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  noResults.style.display = "none";

  grid.innerHTML = funds
    .map(
      (fund) => `
    <div class="u-card" data-id="${fund.id}" onclick="openFundModal(${fund.id})">
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
        <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
          <span style="color: var(--text-secondary);">만기일자</span>
          <span style="font-weight: 700;">${fund.expiredAt}</span>
        </div>
        <div class="fund-info-item" style="display: flex; justify-content: space-between; font-size: 0.9rem;">
          <span style="color: var(--text-secondary);">결성총액</span>
          <span style="font-weight: 700; color: var(--accent-color);">${formatAmount(fund.totalAmount)}</span>
        </div>
      </div>

      <div class="investor-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
        <span class="tag">${fund.fundType}</span>
        <span class="tag">${fund.industry.split(",")[0]}</span>
      </div>

      <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
        <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
        <button class="btn-bookmark ${BookmarkMgr.isBookmarked("funds", fund.id) ? "active" : ""}"
                onclick="event.stopPropagation(); handleBookmarkUpdate('funds', ${fund.id}, this)">
          <i class="fa-${BookmarkMgr.isBookmarked("funds", fund.id) ? "solid" : "regular"} fa-star"></i>
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

// 특수 필터 토글
function toggleSpecialFilter(value) {
  const items = document.querySelectorAll(".special-tag");
  const clickedItem = document.querySelector(
    `.special-tag[data-special="${value}"]`,
  );

  if (value === "all") {
    items.forEach((item) => item.classList.remove("active"));
    clickedItem.classList.add("active");
  } else {
    clickedItem.classList.toggle("active");
    const specialItems = Array.from(items).filter(
      (item) => item.dataset.special !== "all",
    );
    const anyActive = specialItems.some((item) =>
      item.classList.contains("active"),
    );
    const allItem = document.querySelector('.special-tag[data-special="all"]');

    if (anyActive) {
      allItem.classList.remove("active");
    } else {
      allItem.classList.add("active");
    }
  }
  filterFunds();
}

// 필터 초기화
function resetFilters() {
  // 검색어 초기화
  clearFundSearch();

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    cb.checked = cb.name === "fundType" && cb.value === "all";
  });

  const tags = document.querySelectorAll(".special-tag");
  tags.forEach((t) => t.classList.remove("active"));
  document
    .querySelector('.special-tag[data-special="all"]')
    .classList.add("active");

  filterFunds();
}

// 검색 초기화 함수
function clearFundSearch() {
  const input = document.getElementById("fundSearch");
  const clearBtn = document.getElementById("searchClear");
  const searchStats = document.getElementById("searchStats");

  input.value = "";
  clearBtn.classList.remove("visible");
  searchStats.style.display = "none";

  filterFunds();
}

// 검색 및 사이드바 필터링
function filterFunds() {
  const input = document.getElementById("fundSearch");
  const query = input.value.toLowerCase();
  const clearBtn = document.getElementById("searchClear");
  const searchStats = document.getElementById("searchStats");
  const searchKeyword = document.getElementById("searchKeyword");
  const specialFilters = getCheckedValues("special");
  const typeFilters = getCheckedValues("fundType");

  // Clear 버튼 및 검색 통계 표시
  if (query.length > 0) {
    clearBtn.classList.add("visible");
    searchStats.style.display = "flex";
    searchKeyword.textContent = query;
  } else {
    clearBtn.classList.remove("visible");
    searchStats.style.display = "none";
  }

  filteredFunds = fundsData.filter((fund) => {
    // 0. 특수 필터
    let matchSpecial = true;
    if (specialFilters.length > 0 && !specialFilters.includes("all")) {
      matchSpecial = specialFilters.every((filter) => {
        if (filter === "bookmarked")
          return BookmarkMgr.isBookmarked("funds", fund.id);
        return false;
      });
    }

    // 1. 유형 필터
    const matchType =
      typeFilters.length === 0 ||
      typeFilters.includes("all") ||
      typeFilters.includes(fund.fundType);

    // 2. 검색 필터 (펀드명, 운용사, 투자분야, 목적, 매니저)
    const matchSearch =
      fund.fundName.toLowerCase().includes(query) ||
      fund.companyName.toLowerCase().includes(query) ||
      fund.industry.toLowerCase().includes(query) ||
      fund.purpose.toLowerCase().includes(query) ||
      fund.manager.toLowerCase().includes(query);

    return matchSpecial && matchType && matchSearch;
  });

  sortFunds(); // 필터링 후 정렬 유지
}

// 체크된 값 가져오기
function getCheckedValues(name) {
  if (name === "special") {
    const activeTags = document.querySelectorAll(".special-tag.active");
    return Array.from(activeTags).map((tag) => tag.dataset.special);
  }
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map((cb) => cb.value);
}

// 정렬
function sortFunds() {
  const sortValue = document.getElementById("sortSelect").value;
  let sorted = [...filteredFunds];

  switch (sortValue) {
    case "name":
      sorted.sort((a, b) => a.fundName.localeCompare(b.fundName));
      break;
    case "regDate":
      sorted.sort(
        (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
      );
      break;
    case "expDate":
      sorted.sort(
        (a, b) => new Date(a.expiredAt) - new Date(b.expiredAt),
      );
      break;
    case "amount":
      sorted.sort((a, b) => b.totalAmount - a.totalAmount);
      break;
  }

  renderFunds(sorted);
  updateResultsCount(sorted.length);
}

// 모달 열기
function openFundModal(id) {
  const fund = fundsData.find((f) => f.id === id);
  if (!fund) return;

  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = `
    <div class="modal-header">
      <div style="display: flex; align-items: center; gap: 2rem;">
        <div class="avatar avatar-lg" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);">
          <i class="fa-solid fa-coins"></i>
        </div>
        <div>
          <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem; letter-spacing: -0.01em;">${fund.fundName}</h2>
          <p style="color: var(--primary-color); font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem;">${fund.companyName}</p>
          <div style="display: flex; gap: 0.5rem;">
            <span class="tag" style="background: #eef2ff; color: #4f46e5; border: 1px solid #dbeafe;">${fund.fundType}</span>
            <span class="tag" style="background: #f0fdf4; color: #166534; border: 1px solid #dcfce7;">${fund.industry.split(",")[0]}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-body">
      <div class="u-section">
        <h3>펀드 핵심 지표</h3>
        <div class="u-grid-2">
          <div class="u-card" style="padding: 1.5rem; background: linear-gradient(to bottom right, #ffffff, #f8fafc); border: 1px solid #e2e8f0; box-shadow: none;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">결성 약정총액</div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">${formatAmount(fund.totalAmount)}</div>
          </div>
          <div class="u-card" style="padding: 1.5rem; background: linear-gradient(to bottom right, #ffffff, #f8fafc); border: 1px solid #e2e8f0; box-shadow: none;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">기준 수익률 (Hurdle Rate)</div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #2563eb; letter-spacing: -0.02em;">${fund.baseRate}%</div>
          </div>
        </div>
      </div>

      <div class="u-section">
        <h3>상세 운용 정보</h3>
        <div class="u-card" style="padding: 0; background: white; border: 1px solid #e2e8f0; box-shadow: none; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 1.25rem; color: var(--text-secondary); width: 140px; background: #f8fafc; font-weight: 600;">등록 및 만기</td>
              <td style="padding: 1.25rem; font-weight: 600; color: var(--text-primary);">${fund.registeredAt} ~ ${fund.expiredAt}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 1.25rem; color: var(--text-secondary); background: #f8fafc; font-weight: 600;">결산월 / 매니저</td>
              <td style="padding: 1.25rem; font-weight: 600; color: var(--text-primary);">${fund.settlementMonth}월 / ${fund.manager} 매니저</td>
            </tr>
            <tr>
              <td style="padding: 1.25rem; color: var(--text-secondary); background: #f8fafc; font-weight: 600;">주요 출자자(LP)</td>
              <td style="padding: 1.25rem; font-weight: 700; color: var(--primary-color);">${fund.support}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="u-section">
        <h3>결성 목적 및 투자 전략</h3>
        <div style="padding: 1.5rem; border-radius: 20px; background: #f8fafc; border: 1px solid #e2e8f0; line-height: 1.7; color: #475569; font-size: 1rem;">
          <i class="fa-solid fa-quote-left" style="color: #cbd5e1; margin-bottom: 1rem; display: block; font-size: 1.2rem;"></i>
          ${fund.purpose}
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <button class="btn-primary" style="width: 100%; padding: 1.1rem; font-size: 1.1rem; border-radius: 16px;">IR 피칭 자료 접수하기</button>
      </div>
    </div>
  `;

  document.getElementById("fundModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeFundModal() {
  document.getElementById("fundModal").style.display = "none";
  document.body.style.overflow = "auto";
}

// 외부 클릭 닫기
window.addEventListener("click", (e) => {
  const modal = document.getElementById("fundModal");
  if (e.target === modal) {
    closeFundModal();
  }
});

// 결과 수 업데이트
function updateResultsCount(count) {
  document.getElementById("totalCount").textContent = count;
}

// 금액 포맷
function formatAmount(amount) {
  if (amount >= 100000000) {
    return (amount / 100000000).toLocaleString() + " 억원";
  }
  return amount.toLocaleString() + " 원";
}

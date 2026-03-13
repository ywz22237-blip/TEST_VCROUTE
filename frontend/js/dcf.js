document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".dcf-menu-item");
  const sections = document.querySelectorAll(".dcf-section");

  window.switchTab = function (targetId) {
    // Menu Active State
    menuItems.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.tab === targetId) {
        btn.classList.add("active");
      }
    });

    // Content Switching
    sections.forEach((section) => {
      section.classList.remove("active");
      if (section.id === targetId) {
        section.classList.add("active");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (item.hasAttribute("disabled")) return;
      const targetId = item.dataset.tab;
      window.switchTab(targetId);
    });
  });
});

// FCF 자동 계산
function updateFCF() {
  const opProfit =
    parseFloat(document.getElementById("operatingProfit").value) || 0;
  const dep = parseFloat(document.getElementById("depreciation").value) || 0;
  const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;

  // FCF = 영업이익 + 감가상각비 - 세금(영업이익 * 세율)
  const tax = opProfit * (taxRate / 100);
  const currentFCF = opProfit + dep - tax;

  const fcfDisplay = document.getElementById("calculatedFCF");
  if (fcfDisplay) {
    fcfDisplay.textContent = currentFCF.toLocaleString("ko-KR");
    fcfDisplay.dataset.value = currentFCF; // 계산 시 참조용
  }
}

function calculateDCF() {
  // 1. 입력값 가져오기
  const fcfDisplay = document.getElementById("calculatedFCF");
  const initialFCF = parseFloat(fcfDisplay ? fcfDisplay.dataset.value : 0);

  const growthRate =
    parseFloat(document.getElementById("growthRate").value) / 100;
  const termGrowthRate =
    parseFloat(document.getElementById("terminalGrowthRate").value) / 100;
  const discountRate =
    parseFloat(document.getElementById("discountRate").value) / 100;
  const totalShares =
    parseFloat(document.getElementById("totalShares").value) || 1; // 0으로 나누기 방지

  // 유효성 검사
  if (isNaN(initialFCF)) {
    alert("FCF 산출을 위해 영업이익, 감가상각비, 세율을 입력해주세요.");
    return;
  }

  if (initialFCF <= 0) {
    if (!confirm("초기 FCF가 0 이하입니다. 계속 계산하시겠습니까?")) return;
  }

  if (isNaN(growthRate) || isNaN(termGrowthRate) || isNaN(discountRate)) {
    alert("성장률과 할인율을 올바르게 입력해주세요.");
    return;
  }

  if (discountRate <= termGrowthRate) {
    alert("할인율은 영구 성장률보다 커야 합니다. (WACC > g)");
    return;
  }

  // 2. 계산 변수 초기화
  let pvSum = 0; // 향후 5년 현금흐름의 현재가치 합
  let currentFCF = initialFCF;
  let forecastData = []; // 테이블용 데이터

  // 3. 향후 5년 추정 (Explicit Forecast Period)
  for (let t = 1; t <= 5; t++) {
    currentFCF = currentFCF * (1 + growthRate); // 성장 적용
    const pv = currentFCF / Math.pow(1 + discountRate, t); // 할인 적용
    pvSum += pv;

    forecastData.push({
      year: t,
      fcf: currentFCF,
      pv: pv,
    });
  }

  // 4. 영구 가치 (Terminal Value) 계산
  // TV = FCF_last * (1 + g) / (WACC - g)
  const lastFCF = forecastData[4].fcf;
  const terminalValue =
    (lastFCF * (1 + termGrowthRate)) / (discountRate - termGrowthRate);

  // 영구가치의 현재 가치 (PV of TV)
  const pvTV = terminalValue / Math.pow(1 + discountRate, 5);

  // 5. 기업가치 합산 (Enterprise Value)
  const totalEV = pvSum + pvTV;

  // 6. 주당 가치 계산
  const sharePrice = totalEV / totalShares;

  // 7. 결과 표시 (원 단위, 소수점 없음)
  document.getElementById("finalEV").textContent =
    formatNumber(totalEV) + " 원";
  document.getElementById("pvSum").textContent = formatNumber(pvSum) + " 원";
  document.getElementById("pvTV").textContent = formatNumber(pvTV) + " 원";

  const sharePriceEl = document.getElementById("perShareValue");
  if (sharePriceEl) {
    sharePriceEl.textContent = formatNumber(sharePrice) + " 원";
  }

  // 8. 테이블 렌더링
  const tableBody = document.getElementById("forecastTableBody");
  tableBody.innerHTML = `
    <tr>
      ${forecastData.map((d) => `<td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${formatNumber(d.fcf)}</td>`).join("")}
    </tr>
    <tr style="color: #64748b; font-size: 0.8rem;">
      ${forecastData.map((d) => `<td style="padding: 5px;">(현가: ${formatNumber(d.pv)})</td>`).join("")}
    </tr>
  `;

  // 결과 섹션에 강조 효과
  const resultSection = document.querySelector(".calc-result-section");
  resultSection.style.animation = "none";
  resultSection.offsetHeight; /* trigger reflow */
  resultSection.style.animation = "pulse 0.5s ease";
}

function formatNumber(num) {
  // 원 단위이므로 소수점 제거
  return Math.round(num).toLocaleString("ko-KR");
}

// LTV/CAC 계산기
function calcLtvCac() {
  const marketingCost = parseFloat(document.getElementById("ltv-marketing-cost")?.value) || 0;
  const newCustomers  = parseFloat(document.getElementById("ltv-new-customers")?.value)  || 0;
  const arpu          = parseFloat(document.getElementById("ltv-arpu")?.value)           || 0;
  const duration      = parseFloat(document.getElementById("ltv-duration")?.value)       || 0;
  const margin        = parseFloat(document.getElementById("ltv-margin")?.value)         || 0;

  const cac = newCustomers > 0 ? marketingCost / newCustomers : 0;
  const ltv = arpu * duration * (margin / 100);
  const ratio = cac > 0 ? ltv / cac : 0;
  const monthlyProfit = arpu * (margin / 100);
  const payback = monthlyProfit > 0 ? cac / monthlyProfit : 0;

  document.getElementById("ltv-result-cac").textContent = cac > 0 ? formatNumber(cac) + "원" : "-";
  document.getElementById("ltv-result-ltv").textContent = ltv > 0 ? formatNumber(ltv) + "원" : "-";
  document.getElementById("ltv-monthly-profit").textContent = monthlyProfit > 0 ? formatNumber(monthlyProfit) + "원" : "-";
  document.getElementById("ltv-payback").textContent = payback > 0 ? payback.toFixed(1) + "개월" : "-";

  const ratioEl = document.getElementById("ltv-ratio");
  const gradeEl = document.getElementById("ltv-grade");
  const boxEl   = document.getElementById("ltv-ratio-box");

  if (ratio > 0) {
    ratioEl.textContent = ratio.toFixed(2);
    if (ratio < 1) {
      gradeEl.textContent = "❌ 위험 — 비즈니스 지속 불가";
      gradeEl.style.color = "#ef4444";
      boxEl.style.borderColor = "#fca5a5";
      boxEl.style.background = "#fff1f2";
    } else if (ratio < 3) {
      gradeEl.textContent = "⚠️ 주의 — 추가 개선 필요";
      gradeEl.style.color = "#f59e0b";
      boxEl.style.borderColor = "#fcd34d";
      boxEl.style.background = "#fffbeb";
    } else {
      gradeEl.textContent = "✅ 우수 — VC가 선호하는 구조";
      gradeEl.style.color = "#22c55e";
      boxEl.style.borderColor = "#86efac";
      boxEl.style.background = "#f0fdf4";
    }
    ratioEl.style.color = ratio < 1 ? "#ef4444" : ratio < 3 ? "#f59e0b" : "#22c55e";
  } else {
    ratioEl.textContent = "-";
    gradeEl.textContent = "-";
    boxEl.style.borderColor = "#e2e8f0";
    boxEl.style.background = "#f8fafc";
    ratioEl.style.color = "#1e293b";
  }
}

// 간단한 애니메이션 추가
const style = document.createElement("style");
style.innerHTML = `
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    50% { transform: scale(1.02); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
    100% { transform: scale(1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  }
`;
document.head.appendChild(style);

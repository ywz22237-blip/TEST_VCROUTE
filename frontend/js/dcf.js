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

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

  // URL 해시로 진입 시 해당 탭 자동 활성화 (#cap-table 등)
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const target = document.getElementById(hash);
    if (target && target.classList.contains('dcf-section')) {
      window.switchTab(hash);
    }
  }
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

// ─── Burn-rate 시뮬레이터 ───────────────────────────────────────
let burnChart = null;

function addBurnItem() {
  const container = document.getElementById("burn-items");
  const div = document.createElement("div");
  div.className = "burn-item";
  div.style.cssText = "display:flex;gap:0.5rem;margin-bottom:0.5rem;";
  div.innerHTML = `
    <input type="text" placeholder="항목명" style="flex:1;padding:0.5rem;border:1px solid #e2e8f0;border-radius:6px;font-size:0.85rem;" oninput="calcBurnRate()" />
    <input type="number" placeholder="금액" style="width:130px;padding:0.5rem;border:1px solid #e2e8f0;border-radius:6px;font-size:0.85rem;" oninput="calcBurnRate()" />
    <button onclick="removeBurnItem(this)" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:0.5rem 0.7rem;cursor:pointer;font-size:0.85rem;">✕</button>
  `;
  container.appendChild(div);
  calcBurnRate();
}

function removeBurnItem(btn) {
  btn.parentElement.remove();
  calcBurnRate();
}

function calcBurnRate() {
  const cash    = parseFloat(document.getElementById("br-cash")?.value)    || 0;
  const revenue = parseFloat(document.getElementById("br-revenue")?.value) || 0;

  let grossBurn = 0;
  document.querySelectorAll(".burn-item").forEach(item => {
    const amt = parseFloat(item.querySelectorAll("input")[1]?.value) || 0;
    grossBurn += amt;
  });

  const netBurn = Math.max(0, grossBurn - revenue);

  document.getElementById("br-gross").textContent = grossBurn > 0 ? formatNumber(grossBurn) + "원" : "-";
  document.getElementById("br-net").textContent   = netBurn  > 0 ? formatNumber(netBurn)  + "원" : "-";

  if (cash > 0 && netBurn > 0) {
    const runway = cash / netBurn;
    const runwayMonths = Math.floor(runway);
    const deadlineMonths = Math.max(0, runwayMonths - 6);

    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + runwayMonths, now.getDate());
    const deadlineDate = new Date(now.getFullYear(), now.getMonth() + deadlineMonths, now.getDate());

    const diffDays = Math.round((endDate - now) / (1000*60*60*24));

    document.getElementById("br-dday").textContent  = `D-${diffDays.toLocaleString()}`;
    document.getElementById("br-date").textContent  = `${endDate.getFullYear()}년 ${endDate.getMonth()+1}월 ${endDate.getDate()}일 소진 예상`;
    document.getElementById("br-runway").textContent   = `${runwayMonths}개월 (${runway.toFixed(1)}개월)`;
    document.getElementById("br-deadline").textContent = `${deadlineDate.getFullYear()}년 ${deadlineDate.getMonth()+1}월까지 펀딩 필요`;

    // D-Day 색상
    const box = document.getElementById("br-dday-box");
    if (runwayMonths < 6)       { box.style.background = "#7f1d1d"; }
    else if (runwayMonths < 12) { box.style.background = "#78350f"; }
    else                        { box.style.background = "#1e293b"; }

    // 차트 데이터
    const labels = [], data = [];
    for (let i = 0; i <= Math.min(runwayMonths + 2, 36); i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      labels.push(`${d.getMonth()+1}월`);
      data.push(Math.max(0, cash - netBurn * i));
    }

    renderBurnChart(labels, data, runwayMonths, deadlineMonths, cash);
  } else {
    document.getElementById("br-dday").textContent    = "-";
    document.getElementById("br-date").textContent    = "-";
    document.getElementById("br-runway").textContent  = "-";
    document.getElementById("br-deadline").textContent = "-";
  }
}

function renderBurnChart(labels, data, runwayMonths, deadlineMonths, cash) {
  const ctx = document.getElementById("burnChart");
  if (!ctx) return;

  if (burnChart) burnChart.destroy();

  const pointColors = data.map((v, i) => {
    if (i === runwayMonths) return "#ef4444";
    if (i === deadlineMonths) return "#f59e0b";
    return "#2563eb";
  });

  burnChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "현금 잔액",
        data,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.08)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pointColors,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `잔액: ${Math.round(ctx.raw).toLocaleString("ko-KR")}원`
          }
        },
        annotation: {
          annotations: {
            deadline: {
              type: "line",
              xMin: deadlineMonths, xMax: deadlineMonths,
              borderColor: "#f59e0b", borderWidth: 2, borderDash: [5,5],
              label: { content: "⚠️ 펀딩 데드라인", enabled: true, position: "start", color: "#f59e0b", font: { size: 11 } }
            }
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => (v/100000000).toFixed(1) + "억" },
          grid: { color: "#f1f5f9" }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ─── Cap Table 시뮬레이터 ───────────────────────────────────────
let capChart = null;

function calcCapTable() {
  const founderA = parseFloat(document.getElementById("ct-founder-a")?.value) || 0;
  const founderB = parseFloat(document.getElementById("ct-founder-b")?.value) || 0;
  const esop     = parseFloat(document.getElementById("ct-esop")?.value)      || 0;

  const total = founderA + founderB + esop;
  if (total > 100) {
    document.getElementById("ct-tbody").innerHTML =
      `<tr><td colspan="5" style="text-align:center;padding:1rem;color:#ef4444;">창업자 지분 합계가 100%를 초과합니다</td></tr>`;
    return;
  }

  // 라운드별 입력
  const rounds = [
    { label: "시드",    pre: parseFloat(document.getElementById("ct-seed-pre")?.value)    || 0, inv: parseFloat(document.getElementById("ct-seed-inv")?.value)    || 0 },
    { label: "시리즈A", pre: parseFloat(document.getElementById("ct-seriesA-pre")?.value) || 0, inv: parseFloat(document.getElementById("ct-seriesA-inv")?.value) || 0 },
    { label: "시리즈B", pre: parseFloat(document.getElementById("ct-seriesB-pre")?.value) || 0, inv: parseFloat(document.getElementById("ct-seriesB-inv")?.value) || 0 },
  ];

  // 지분율 계산 (라운드별 희석)
  const shareholders = [
    { name: "창업자 A", pct: founderA },
    { name: "창업자 B", pct: founderB },
    { name: "ESOP",    pct: esop },
  ];

  const history = [ shareholders.map(s => ({ ...s })) ]; // [라운드0=초기, ...]
  const investors = [];
  let lastPostmoney = 0;

  rounds.forEach((r, idx) => {
    if (r.pre <= 0 || r.inv <= 0) { history.push(null); return; }
    const postmoney = r.pre + r.inv;
    const newPct = (r.inv / postmoney) * 100;
    const dilution = 1 - newPct / 100;
    lastPostmoney = postmoney;

    const prev = history[history.length - 1] || history[0];
    const next = prev.map(s => ({ ...s, pct: s.pct * dilution }));
    investors.push({ name: r.label + " 투자자", pct: newPct, roundIdx: idx });
    next.push({ name: r.label + " 투자자", pct: newPct });
    history.push(next);
  });

  // 테이블 렌더링
  const allNames = [...new Set(history.flat().filter(Boolean).map(s => s.name))];
  const cols = history.filter(Boolean);

  const getPct = (round, name) => {
    if (!round) return null;
    const s = round.find(x => x.name === name);
    return s ? s.pct : 0;
  };

  let rows = allNames.map(name => {
    const cells = [history[0], ...history.slice(1)].map(round => {
      if (round === null) return `<td style="padding:0.6rem;text-align:center;color:#cbd5e1;">-</td>`;
      const pct = getPct(round, name);
      if (pct === null || pct === undefined) {
        return `<td style="padding:0.6rem;text-align:center;color:#cbd5e1;">-</td>`;
      }
      const color = name.startsWith("창업자") ? "#6366f1" : name === "ESOP" ? "#f59e0b" : "#22c55e";
      return `<td style="padding:0.6rem;text-align:center;font-weight:600;color:${color};">${pct.toFixed(1)}%</td>`;
    });
    return `<tr><td style="padding:0.6rem;font-weight:500;color:#1e293b;">${name}</td>${cells.join("")}</tr>`;
  });

  document.getElementById("ct-tbody").innerHTML = rows.join("");

  // 요약
  const finalRound = history.filter(Boolean).pop();
  const founderAFinal = finalRound?.find(s => s.name === "창업자 A");
  document.getElementById("ct-postmoney").textContent = lastPostmoney > 0 ? lastPostmoney + "억원" : "-";
  document.getElementById("ct-founder-final").textContent = founderAFinal ? founderAFinal.pct.toFixed(1) + "%" : founderA.toFixed(1) + "%";

  // 차트
  renderCapChart(history);
}

function renderCapChart(history) {
  const ctx = document.getElementById("capChart");
  if (!ctx) return;
  if (capChart) capChart.destroy();

  const roundLabels = ["초기", "시드", "시리즈A", "시리즈B"].slice(0, history.length);
  const allNames = [...new Set(history.flat().filter(Boolean).map(s => s.name))];
  const colors = { "창업자 A": "#6366f1", "창업자 B": "#818cf8", "ESOP": "#f59e0b", "시드 투자자": "#34d399", "시리즈A 투자자": "#0ea5e9", "시리즈B 투자자": "#22c55e" };

  const datasets = allNames.map(name => ({
    label: name,
    data: history.map(round => round ? (round.find(s => s.name === name)?.pct || 0) : null),
    backgroundColor: colors[name] || "#94a3b8",
    borderRadius: 4,
  }));

  capChart = new Chart(ctx, {
    type: "bar",
    data: { labels: roundLabels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw?.toFixed(1)}%` } }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#f1f5f9" } }
      }
    }
  });
}

// ─── IR Score 탭 전환 ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ir-menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      switchIrTab(btn.dataset.tab);
    });
  });

  // 드래그앤드롭
  const zone = document.getElementById("uploadZone");
  if (zone) {
    zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }
});

function switchIrTab(tabId) {
  document.querySelectorAll(".ir-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".ir-menu-item").forEach(b => b.classList.remove("active"));
  document.getElementById(tabId)?.classList.add("active");
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");
}

// ─── 파일 처리 ────────────────────────────────────────────────
let irText = "";

function onFileSelect(input) {
  const file = input.files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  document.getElementById("fileName").textContent = `✅ ${file.name}`;
  document.getElementById("analyzeBtn").disabled = false;

  const reader = new FileReader();
  reader.onload = e => { irText = e.target.result; };
  reader.readAsText(file, "utf-8");
}

// ─── 분석 시작 ────────────────────────────────────────────────
const SCORE_CATEGORIES = ["시장성", "팀", "기술력", "BM", "재무"];
const SCORE_COLORS = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

let radarChart = null;
let irAnalysis = null;

async function startAnalysis() {
  const desc = document.getElementById("companyDesc").value.trim();
  const textToAnalyze = (irText || "") + (desc ? `\n회사 소개: ${desc}` : "");

  if (!textToAnalyze.trim()) {
    alert("파일을 업로드하거나 회사 소개를 입력해 주세요.");
    return;
  }

  document.getElementById("analyzeBtn").disabled = true;
  document.getElementById("analyzing").style.display = "block";

  const statusEl = document.getElementById("analyzeStatus");
  const steps = ["IR 덱을 분석하고 있습니다...", "VC 심사역 프레임워크 적용 중...", "스코어 산출 중...", "피드백 생성 중..."];
  let step = 0;
  const interval = setInterval(() => {
    statusEl.textContent = steps[Math.min(step++, steps.length - 1)];
  }, 3000);

  try {
    const apiKey = window.ANTHROPIC_API_KEY || window.CLAUDE_API_KEY || "";

    let result;
    if (apiKey) {
      result = await callClaudeAPI(textToAnalyze, apiKey);
    } else {
      // API 키 없으면 데모 분석
      await new Promise(r => setTimeout(r, 3000));
      result = getDemoAnalysis(textToAnalyze);
    }

    clearInterval(interval);
    irAnalysis = result;
    renderScore(result);

    document.getElementById("menu-score").disabled = false;
    document.getElementById("menu-qa").disabled = false;
    switchIrTab("score");
    initQA(result);
  } catch (err) {
    clearInterval(interval);
    console.error(err);
    // 에러 시 데모 결과 표시
    const result = getDemoAnalysis(textToAnalyze);
    irAnalysis = result;
    renderScore(result);
    document.getElementById("menu-score").disabled = false;
    document.getElementById("menu-qa").disabled = false;
    switchIrTab("score");
    initQA(result);
  } finally {
    document.getElementById("analyzing").style.display = "none";
    document.getElementById("analyzeBtn").disabled = false;
  }
}

async function callClaudeAPI(text, apiKey) {
  const prompt = `당신은 10년 차 수석 심사역입니다. 아래 IR 덱 내용을 분석하여 투자 매력도를 평가해주세요.

IR 내용:
${text.slice(0, 4000)}

다음 5개 항목을 각각 0~20점으로 채점하고 피드백을 제공하세요.
반드시 아래 JSON 형식으로만 응답하세요:

{
  "scores": {
    "시장성": 숫자,
    "팀": 숫자,
    "기술력": 숫자,
    "BM": 숫자,
    "재무": 숫자
  },
  "feedback": [
    {"type": "good|warn|bad", "text": "피드백 내용"},
    ...
  ],
  "summary": "전체 한 줄 평가",
  "questions": [
    "공격적 질문 1",
    "공격적 질문 2",
    "공격적 질문 3"
  ]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const raw = data.content?.[0]?.text || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

function getDemoAnalysis(text) {
  // 텍스트 기반 간단 휴리스틱 점수
  const keywords = {
    시장성: ["TAM", "SAM", "SOM", "시장", "규모", "성장", "market"],
    팀: ["대표", "CTO", "경력", "팀", "team", "창업자", "전문가"],
    기술력: ["기술", "특허", "AI", "알고리즘", "플랫폼", "tech", "개발"],
    BM: ["수익", "매출", "구독", "SaaS", "수수료", "비즈니스 모델", "BM"],
    재무: ["투자", "밸류", "ROI", "매출 계획", "손익", "재무"],
  };

  const scores = {};
  SCORE_CATEGORIES.forEach(cat => {
    const hits = keywords[cat].filter(k => text.toLowerCase().includes(k.toLowerCase())).length;
    scores[cat] = Math.min(20, 10 + hits * 2);
  });

  return {
    scores,
    feedback: [
      { type: "good", text: "사업 아이디어의 핵심 가치 제안이 명확합니다." },
      { type: "warn", text: "TAM-SAM-SOM 시장 규모의 논리적 근거가 더 구체적이면 좋겠습니다." },
      { type: "bad",  text: "경쟁사 대비 차별화 포인트(해자)가 충분히 강조되지 않았습니다." },
      { type: "warn", text: "팀 구성원의 도메인 전문성 증거(실적, 경력)를 추가하세요." },
      { type: "good", text: "수익 모델이 SaaS 구조로 반복 수익이 예상됩니다." },
    ],
    summary: "기본 구조는 갖췄으나 시장 검증 데이터와 경쟁 분석이 보강되면 투자 가능성이 높아집니다.",
    questions: [
      "경쟁사가 가격을 50% 인하한다면 어떻게 대응하시겠습니까?",
      "제시한 TAM 규모의 근거 데이터는 무엇인가요?",
      "현재 팀만으로 18개월 안에 목표 KPI를 달성할 수 있다고 확신하는 이유는?",
    ],
  };
}

// ─── 스코어 렌더링 ─────────────────────────────────────────────
function renderScore(result) {
  const total = Object.values(result.scores).reduce((a, b) => a + b, 0);
  document.getElementById("totalScore").textContent = total;

  let grade, gradeColor;
  if (total >= 85)      { grade = "🏆 투자 강력 추천"; gradeColor = "#22c55e"; }
  else if (total >= 70) { grade = "✅ 투자 검토 가능"; gradeColor = "#0ea5e9"; }
  else if (total >= 55) { grade = "⚠️ 보완 후 재검토"; gradeColor = "#f59e0b"; }
  else                  { grade = "❌ 추가 개선 필요"; gradeColor = "#ef4444"; }

  const gradeEl = document.getElementById("totalGrade");
  gradeEl.textContent = grade;
  gradeEl.style.color = gradeColor;

  // 점수 카드
  const grid = document.getElementById("scoreGrid");
  grid.innerHTML = SCORE_CATEGORIES.map((cat, i) => {
    const val = result.scores[cat] || 0;
    const pct = (val / 20) * 100;
    return `
      <div class="score-card">
        <div class="label">${cat}</div>
        <div class="value" style="color:${SCORE_COLORS[i]}">${val}</div>
        <div style="font-size:0.7rem;color:#94a3b8;">/ 20</div>
        <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${SCORE_COLORS[i]};"></div></div>
      </div>`;
  }).join("");

  // 레이더 차트
  if (radarChart) radarChart.destroy();
  const ctx = document.getElementById("radarChart");
  if (ctx) {
    radarChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: SCORE_CATEGORIES,
        datasets: [{
          label: "투자 매력도",
          data: SCORE_CATEGORIES.map(c => result.scores[c] || 0),
          backgroundColor: "rgba(37,99,235,0.15)",
          borderColor: "#2563eb",
          pointBackgroundColor: SCORE_COLORS,
          pointRadius: 5,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0, max: 20,
            ticks: { stepSize: 5, font: { size: 10 } },
            grid: { color: "#e2e8f0" },
            pointLabels: { font: { size: 13, weight: "600" } },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // 피드백
  const list = document.getElementById("feedbackList");
  list.innerHTML = result.feedback.map(f =>
    `<div class="feedback-item ${f.type}">
      <span>${f.type === "good" ? "✅" : f.type === "warn" ? "⚠️" : "❌"}</span>
      <span>${f.text}</span>
    </div>`
  ).join("");
}

// ─── 가상 Q&A ─────────────────────────────────────────────────
let qaQuestions = [];
let qaIndex = 0;

function initQA(result) {
  qaQuestions = result.questions || [];
  qaIndex = 0;
  const box = document.getElementById("qaMessages");
  box.innerHTML = "";

  addMsg("vc", `안녕하세요. IR 덱을 검토했습니다. 몇 가지 날카로운 질문을 드리겠습니다. 준비되셨나요?`);
  setTimeout(() => {
    if (qaQuestions.length > 0) addMsg("vc", `Q${qaIndex + 1}. ${qaQuestions[qaIndex]}`);
  }, 800);
}

function sendQaAnswer() {
  const input = document.getElementById("qaInput");
  const answer = input.value.trim();
  if (!answer) return;

  addMsg("user", answer);
  input.value = "";

  // 코칭 피드백
  setTimeout(() => {
    const coaching = getCoaching(answer);
    addMsg("guide", `💬 코칭: ${coaching}`);

    qaIndex++;
    if (qaIndex < qaQuestions.length) {
      setTimeout(() => addMsg("vc", `Q${qaIndex + 1}. ${qaQuestions[qaIndex]}`), 600);
    } else {
      setTimeout(() => addMsg("vc", "모든 질문이 완료되었습니다. 전반적으로 답변을 보완하여 실제 IR에 대비하세요. 수고하셨습니다!"), 600);
    }
  }, 500);
}

function getCoaching(answer) {
  const len = answer.length;
  if (len < 20) return "답변이 너무 짧습니다. 구체적인 데이터나 수치를 포함하여 자신감 있게 답변하세요.";
  if (answer.includes("잘 모르") || answer.includes("아직")) return "불확실한 표현은 투자자 신뢰를 낮춥니다. '현재 검토 중이며, X월까지 확정 예정입니다'처럼 구체적 일정으로 전환하세요.";
  if (!answer.match(/\d/)) return "숫자와 데이터를 포함하면 더 설득력 있습니다. 시장 점유율, 성장률, 고객 수 등의 수치를 활용해 보세요.";
  return "좋은 답변입니다! 실제 IR에서도 이 수준의 구체성을 유지하세요.";
}

function addMsg(type, text) {
  const box = document.getElementById("qaMessages");
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ─── 펀드 추천 ─────────────────────────────────────────────────
let selectedFund = null;
let selectedGP   = null;

function goToFundMatch() {
  document.getElementById("menu-fund").disabled = false;
  switchIrTab("fund-match");
  renderFundMatches();
}

function getStageFromScore(total) {
  if (total >= 76) return { label: "시리즈 B+", stages: ["series-b", "growth", "pre-ipo"] };
  if (total >= 56) return { label: "시리즈 A", stages: ["series-a", "series-b"] };
  return { label: "시드 / Pre-A", stages: ["seed", "series-a"] };
}

function getIndustryKeywords(text) {
  const map = {
    "ICT":    ["IT", "소프트웨어", "SaaS", "플랫폼", "앱", "tech", "디지털", "AI", "인공지능"],
    "바이오":  ["바이오", "헬스케어", "의료", "제약", "bio", "health"],
    "콘텐츠":  ["콘텐츠", "미디어", "게임", "엔터", "크리에이터"],
    "제조":   ["제조", "하드웨어", "소재", "부품"],
    "ESG":    ["ESG", "친환경", "탄소", "그린", "클린"],
  };
  const found = [];
  Object.entries(map).forEach(([cat, keywords]) => {
    if (keywords.some(k => text.toLowerCase().includes(k.toLowerCase()))) found.push(cat);
  });
  return found.length ? found : ["ICT", "플랫폼"];
}

function scoreFund(fund, stageObj, industryKeywords, irScores) {
  let score = 0;
  // 단계 매칭
  const fundIndustry = (fund.industry || "").toLowerCase();
  const fundPurpose  = (fund.purpose  || "").toLowerCase();
  // 산업 키워드 매칭
  industryKeywords.forEach(kw => {
    if (fundIndustry.includes(kw.toLowerCase()) || fundPurpose.includes(kw.toLowerCase())) score += 20;
  });
  // 펀드 규모 (큰 펀드 선호)
  if (fund.totalAmount >= 50000000000) score += 15;
  else if (fund.totalAmount >= 20000000000) score += 10;
  else score += 5;
  // baseRate 보정
  score += Math.min(10, Math.round(fund.baseRate));
  return Math.min(99, score);
}

function renderFundMatches() {
  if (!irAnalysis) return;
  const total = Object.values(irAnalysis.scores).reduce((a, b) => a + b, 0);
  const stageObj = getStageFromScore(total);
  const desc = (document.getElementById("companyDesc")?.value || "") + " " + (irText || "");
  const industryKeywords = getIndustryKeywords(desc);

  // 배지
  document.getElementById("fund-stage-badge").innerHTML =
    `<div style="display:inline-flex;align-items:center;gap:0.5rem;background:#eff6ff;border:1px solid #bfdbfe;padding:0.4rem 0.9rem;border-radius:20px;font-size:0.85rem;color:#1d4ed8;font-weight:600;margin-bottom:0.5rem;">
      <i class="fa-solid fa-layer-group"></i> 추천 투자 단계: ${stageObj.label}
      &nbsp;·&nbsp; <i class="fa-solid fa-tag"></i> 매칭 분야: ${industryKeywords.slice(0, 2).join(", ")}
    </div>`;

  const funds = (typeof SAMPLE_FUNDS !== "undefined" ? SAMPLE_FUNDS : []);
  const scored = funds
    .map(f => ({ ...f, matchScore: scoreFund(f, stageObj, industryKeywords, irAnalysis.scores) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  if (!scored.length) {
    document.getElementById("fundCards").innerHTML = "<p style='color:#94a3b8;'>매칭 가능한 펀드가 없습니다.</p>";
    return;
  }

  document.getElementById("fundCards").innerHTML = scored.map((f, i) => `
    <div class="fund-card" id="fund-card-${f.id}" onclick="selectFund(${f.id})">
      <div class="fund-header">
        <div class="fund-name">${f.fundName}</div>
        <div class="match-badge">매칭 ${f.matchScore}%</div>
      </div>
      <div class="fund-meta">
        <span>🏢 ${f.companyName}</span>
        <span>📊 ${f.industry}</span>
        <span>💰 ${Math.round(f.totalAmount / 100000000).toLocaleString()}억원</span>
        <span>👤 ${f.manager}</span>
      </div>
      <div class="match-reason">
        ${i === 0 ? "✅" : i === 1 ? "🔵" : "🟡"} ${f.purpose.slice(0, 60)}...
      </div>
      <button class="select-btn" type="button" onclick="event.stopPropagation(); selectFund(${f.id})">이 펀드 선택 → GP 매칭</button>
    </div>
  `).join("");
}

function selectFund(fundId) {
  const funds = (typeof SAMPLE_FUNDS !== "undefined" ? SAMPLE_FUNDS : []);
  selectedFund = funds.find(f => f.id === fundId);
  if (!selectedFund) return;

  // 선택 표시
  document.querySelectorAll(".fund-card").forEach(c => c.classList.remove("selected"));
  document.getElementById(`fund-card-${fundId}`)?.classList.add("selected");

  // 같은 탭 안에 투자자 렌더링
  renderInvestorInFundTab();
}

function renderInvestorInFundTab() {
  if (!selectedFund) return;

  // 섹션을 먼저 표시하고 버튼 활성화 — 이후 오류가 있어도 UI는 반드시 노출
  const section = document.getElementById("investor-section");
  if (section) section.style.display = "block";

  const investors = (typeof investorsData !== "undefined" ? investorsData : []);
  selectedGP = investors.find(inv => inv.name === selectedFund.manager);
  if (!selectedGP && investors.length > 0) {
    selectedGP = investors[Math.floor(Math.random() * Math.min(investors.length, 20))];
  }

  const infoEl = document.getElementById("selectedFundInfoInline");
  if (infoEl) {
    infoEl.innerHTML = `<i class="fa-solid fa-building-columns"></i>&nbsp; 선택 펀드: <strong>${selectedFund.fundName}</strong> · ${selectedFund.companyName}`;
  }

  const gpCardEl = document.getElementById("fundGpCard");
  if (gpCardEl) {
    if (!selectedGP) {
      gpCardEl.innerHTML = `<p style="color:#64748b;padding:1rem;">GP 정보를 불러올 수 없습니다.</p>`;
    } else {
      const stageLabels = { "seed": "시드", "series-a": "시리즈A", "series-b": "시리즈B", "growth": "성장", "pre-ipo": "Pre-IPO" };
      const stages = (selectedGP.stages || []).map(s => stageLabels[s] || s);
      gpCardEl.innerHTML = `
        <div class="gp-card">
          <div class="gp-header">
            <div class="gp-avatar">${selectedGP.avatar || selectedGP.name[0]}</div>
            <div class="gp-info">
              <h3>${selectedGP.name} 심사역</h3>
              <p>${selectedGP.company}</p>
            </div>
          </div>
          <div class="gp-tags">
            ${stages.map(s => `<span>${s}</span>`).join("")}
            ${selectedGP.tps ? '<span style="background:#fef9c3;color:#854d0e;">초기전문</span>' : ""}
          </div>
          <div class="gp-stats">
            <div class="gp-stat"><div class="val">${selectedGP.investments}</div><div class="lbl">투자 건수</div></div>
            <div class="gp-stat"><div class="val">${selectedGP.successRate}%</div><div class="lbl">성공률</div></div>
            <div class="gp-stat"><div class="val">${selectedGP.exitCount || "-"}</div><div class="lbl">엑싯</div></div>
          </div>
          <p style="font-size:0.85rem;color:#475569;line-height:1.6;margin-bottom:0.5rem;">${selectedGP.description}</p>
          <div style="font-size:0.82rem;color:#64748b;">
            <span><i class="fa-solid fa-envelope"></i> ${selectedGP.email}</span>
          </div>
        </div>`;
    }
  }

  const mailBtn = document.getElementById("fundGoMailBtn");
  if (mailBtn) mailBtn.disabled = false;

  setTimeout(() => section && section.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

  // localStorage에 추천 이력 저장
  saveRecommendHistory();
}

function saveRecommendHistory() {
  if (!selectedFund || !selectedGP) return;
  const history = JSON.parse(localStorage.getItem("vcroute_recommend_history") || "[]");
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // 동일 펀드+투자자 중복 저장 방지
  const isDup = history.some(h => h.fundName === selectedFund.fundName && h.gpName === selectedGP.name);
  if (isDup) return;

  history.push({
    date: dateStr,
    fundName: selectedFund.fundName,
    companyName: selectedFund.companyName,
    industry: selectedFund.industry,
    matchScore: selectedFund.matchScore || 0,
    gpName: selectedGP.name,
    gpCompany: selectedGP.company,
    gpEmail: selectedGP.email,
  });
  // 최대 20건 유지
  if (history.length > 20) history.splice(0, history.length - 20);
  localStorage.setItem("vcroute_recommend_history", JSON.stringify(history));
}

// ─── GP 매칭 (Option C: manager 이름으로 연결) ──────────────────
function renderGP() {
  if (!selectedFund) return;

  document.getElementById("selectedFundInfo").innerHTML =
    `<i class="fa-solid fa-building-columns"></i> &nbsp;선택 펀드: <strong>${selectedFund.fundName}</strong> · ${selectedFund.companyName}`;

  const investors = (typeof investorsData !== "undefined" ? investorsData : []);
  selectedGP = investors.find(inv => inv.name === selectedFund.manager);

  const gpEl = document.getElementById("gpCard");
  if (!selectedGP) {
    // fallback: stages 기반 임의 매칭
    selectedGP = investors[Math.floor(Math.random() * Math.min(investors.length, 20))];
  }

  const stageLabels = { "seed": "시드", "series-a": "시리즈A", "series-b": "시리즈B", "growth": "성장", "pre-ipo": "Pre-IPO" };
  const stages = (selectedGP.stages || []).map(s => stageLabels[s] || s);

  gpEl.innerHTML = `
    <div class="gp-card">
      <div class="gp-header">
        <div class="gp-avatar">${selectedGP.avatar || selectedGP.name[0]}</div>
        <div class="gp-info">
          <h3>${selectedGP.name} 심사역</h3>
          <p>${selectedGP.company}</p>
        </div>
      </div>
      <div class="gp-tags">
        ${stages.map(s => `<span>${s}</span>`).join("")}
        ${selectedGP.tps ? '<span style="background:#fef9c3;color:#854d0e;">초기전문</span>' : ""}
      </div>
      <div class="gp-stats">
        <div class="gp-stat"><div class="val">${selectedGP.investments}</div><div class="lbl">투자 건수</div></div>
        <div class="gp-stat"><div class="val">${selectedGP.successRate}%</div><div class="lbl">성공률</div></div>
        <div class="gp-stat"><div class="val">${selectedGP.exitCount || "-"}</div><div class="lbl">엑싯</div></div>
      </div>
      <p style="font-size:0.85rem;color:#475569;line-height:1.6;margin-bottom:0.5rem;">${selectedGP.description}</p>
      <div style="display:flex;gap:0.5rem;font-size:0.82rem;color:#64748b;">
        <span><i class="fa-solid fa-envelope"></i> ${selectedGP.email}</span>
      </div>
    </div>`;

  document.getElementById("goMailBtn").disabled = false;
}

// ─── 콜드 메일 생성 ────────────────────────────────────────────
function goToColdMail() {
  document.getElementById("menu-mail").disabled = false;
  switchIrTab("cold-mail");
  generateMail();
}

function generateMail() {
  document.getElementById("mailGenerating").style.display = "block";
  document.getElementById("mailContent").style.display = "none";

  setTimeout(() => {
    const mail = buildMailTemplate();
    document.getElementById("mailSubject").value = mail.subject;
    document.getElementById("mailBody").value    = mail.body;
    document.getElementById("mailGenerating").style.display = "none";
    document.getElementById("mailContent").style.display = "block";
  }, 1200);
}

function buildMailTemplate() {
  const gp   = selectedGP   || { name: "담당자", company: "귀사" };
  const fund = selectedFund || { fundName: "펀드", companyName: "운용사" };
  const desc = document.getElementById("companyDesc")?.value || "저희 스타트업";
  const total = irAnalysis ? Object.values(irAnalysis.scores).reduce((a, b) => a + b, 0) : 0;
  const stage = getStageFromScore(total).label;

  const subject = `[IR 제안] ${desc} — ${stage} 투자 검토 요청`;

  const body = `안녕하세요, ${gp.company} ${gp.name} 심사역님.

${fund.companyName}의 ${fund.fundName}을 통해 귀사의 투자 철학과 포트폴리오를 주의 깊게 살펴보았습니다.

저희는 ${desc}를 개발하고 있는 팀입니다. 현재 ${stage} 단계의 투자 유치를 진행 중이며, 심사역님의 투자 방향성과 저희 비즈니스 모델이 잘 부합한다고 판단하여 연락드립니다.

━━━━━━━━━━━━━━━━━━━━━━

📌 핵심 지표 요약
• 서비스: ${desc}
• 투자 단계: ${stage}
• 투자 유치 목표: [투자 금액 입력]
• 현재 MRR / 성장률: [수치 입력]
• 팀: [창업자 경력 한 줄 요약]

━━━━━━━━━━━━━━━━━━━━━━

첨부된 IR 덱을 검토해 주신다면 감사하겠습니다.
30분 내외의 미팅을 요청드리고 싶습니다.

편하신 일정을 알려주시면 맞추겠습니다.

감사합니다.

[이름]
[직함] | [회사명]
[연락처] | [이메일]
[웹사이트]`;

  return { subject, body };
}

function copyMail() {
  const subject = document.getElementById("mailSubject").value;
  const body    = document.getElementById("mailBody").value;
  navigator.clipboard.writeText(`제목: ${subject}\n\n${body}`).then(() => {
    const done = document.getElementById("copyDone");
    done.style.display = "inline";
    setTimeout(() => done.style.display = "none", 2000);
  });
}

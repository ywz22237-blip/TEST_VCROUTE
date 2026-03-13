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

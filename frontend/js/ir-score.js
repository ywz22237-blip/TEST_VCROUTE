// ─── 심사 모드 선택 ────────────────────────────────────────────

let selectedMode = null;

function selectMode(mode) {
  const cr = typeof getCredits === 'function' ? getCredits() : { simple: 0, premium: 0, reanalysis: 0 };
  const now = Date.now();
  const hasReanalysis = cr.reanalysis > 0 && cr.reanalysisExpires && new Date(cr.reanalysisExpires).getTime() > now;

  if (mode === 'reanalysis' && !hasReanalysis) return;

  selectedMode = mode;

  // 카드 선택 표시 (multi 포함)
  ['simple', 'premium', 'reanalysis', 'multi'].forEach(m => {
    const id = 'mode' + m.charAt(0).toUpperCase() + m.slice(1);
    const card = document.getElementById(id);
    if (card) card.classList.toggle('selected', m === mode);
  });

  // 분석 버튼 활성화 및 텍스트 변경
  const btn = document.getElementById('analyzeBtn');
  const btnText = document.getElementById('analyzeBtnText');
  const hasFile = Object.values(irTexts).some(t => t);
  btn.disabled = !hasFile;

  const labels = {
    simple: '간단심사 시작',
    premium: '정밀심사 시작',
    reanalysis: '재심사 시작',
    multi: '멀티에이전트 심사 시작',
  };
  if (btnText) btnText.textContent = labels[mode] || '분석 시작';
}

function initModeCards() {
  const cr = typeof getCredits === 'function' ? getCredits() : { simple: 1, premium: 0, reanalysis: 0 };
  const now = Date.now();
  const hasReanalysis = cr.reanalysis > 0 && cr.reanalysisExpires && new Date(cr.reanalysisExpires).getTime() > now;

  // 크레딧 잔량 표시
  const simpleEl = document.getElementById('modeCreditSimple');
  const premiumEl = document.getElementById('modeCreditPremium');
  const reanalysisEl = document.getElementById('modeCreditReanalysis');
  const multiEl = document.getElementById('modeCreditMulti');
  if (simpleEl) simpleEl.textContent = `잔여 ${cr.simple}회 · 매일 충전`;
  if (premiumEl) premiumEl.textContent = `잔여 ${cr.premium}개`;
  if (multiEl) multiEl.textContent = `잔여 ${Math.floor((cr.premium || 0) / 3)}회 가능`;
  if (reanalysisEl) {
    if (hasReanalysis) {
      const mins = Math.ceil((new Date(cr.reanalysisExpires).getTime() - now) / 60000);
      reanalysisEl.textContent = mins >= 60
        ? `잔여 ${cr.reanalysis}개 · ${Math.ceil(mins / 60)}시간 후 만료`
        : `잔여 ${cr.reanalysis}개 · ${mins}분 후 만료`;
    } else {
      reanalysisEl.textContent = '정밀심사 후 지급';
    }
  }

  // 재심사 카드 비활성화
  const reanalysisCard = document.getElementById('modeReanalysis');
  if (reanalysisCard) reanalysisCard.classList.toggle('disabled', !hasReanalysis);
}

// ─── VC 심사 질문 풀 (20개) ────────────────────────────────────
const VC_QUESTION_POOL = [
  "경쟁사가 가격을 50% 인하한다면 어떻게 대응하시겠습니까?",
  "제시한 TAM 규모의 근거 데이터는 무엇인가요?",
  "현재 팀만으로 18개월 안에 목표 KPI를 달성할 수 있다고 확신하는 이유는?",
  "현재 고객 획득 비용(CAC)과 생애 가치(LTV) 비율은 어떻게 되나요?",
  "3년 후 이 시장에서 가장 위협적인 경쟁자는 누구이고, 그 이유는 무엇입니까?",
  "지금 당장 투자 없이 6개월을 버틸 수 있는 플랜 B는 무엇인가요?",
  "핵심 기술 또는 특허의 방어 가능성(defensibility)은 어느 정도라고 생각하십니까?",
  "초기 고객 100명을 어떻게 확보하셨으며, 그 과정에서 배운 가장 중요한 교훈은?",
  "현재 번 레이트(Burn Rate)와 런웨이(Runway)는 얼마나 됩니까?",
  "이 문제를 해결하지 못하면 고객에게 어떤 결과가 발생합니까?",
  "팀 내 도메인 전문가가 부족한 영역은 어디이고, 어떻게 보완할 계획입니까?",
  "글로벌 시장 진출 시 현지화(Localization)에서 가장 큰 장벽은 무엇입니까?",
  "지금 당신의 제품을 사용하지 않는 잠재 고객의 가장 큰 이유는 무엇입니까?",
  "수익 모델을 지금과 다르게 가져간다면 어떤 방식이 가능하며 왜 현재 방식을 택했습니까?",
  "규제 리스크가 사업에 미치는 영향과 대응 방안은 무엇입니까?",
  "투자 후 12개월 이내에 반드시 달성해야 할 마일스톤 3가지는 무엇입니까?",
  "공동창업자 또는 핵심 팀원이 이탈할 경우 사업 지속성은 어떻게 확보합니까?",
  "현재 제품-시장 적합성(PMF)을 검증한 지표를 구체적으로 설명해주세요.",
  "경쟁사 대비 가장 취약한 부분은 무엇이고, 이를 어떻게 개선할 계획입니까?",
  "이 사업에서 당신만이 성공할 수 있는 고유한 이유(Unfair Advantage)는 무엇입니까?",
];

function pickRandomQuestions() {
  const count = Math.floor(Math.random() * 3) + 3; // 3~5개
  const shuffled = [...VC_QUESTION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── IR Score 탭 전환 ─────────────────────────────────────────
function showCreditModal(msg) {
  const modal = document.getElementById('creditModal');
  const msgEl = document.getElementById('creditModalMsg');
  if (msgEl) msgEl.textContent = msg;
  if (modal) modal.style.display = 'flex';
}

document.addEventListener("DOMContentLoaded", () => {
  initModeCards();

  document.querySelectorAll(".ir-menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      switchIrTab(btn.dataset.tab);
    });
  });

  // 드래그앤드롭 (3개 존)
  [1, 2, 3].forEach(slot => {
    const zone = document.getElementById(`uploadZone${slot}`);
    if (!zone) return;
    zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file, slot);
    });
  });
});

// 탭 → 단계 번호 매핑 (새 흐름)
const TAB_STEP = {
  'upload':       1,
  'multi-result': 2,
  'examiner':     3,
  'fund-match':   4,
  'cold-mail':    5,
};
// 단계 → 다음 탭
const NEXT_TAB = {
  'upload':       'multi-result',
  'multi-result': 'examiner',
  'examiner':     'fund-match',
  'fund-match':   'cold-mail',
};
// 각 단계의 버튼 메뉴 ID
const TAB_MENU_ID = {
  'upload':       null,
  'multi-result': 'menu-multi',
  'examiner':     'menu-examiner',
  'fund-match':   'menu-fund',
  'cold-mail':    'menu-mail',
};

let _completedSteps = new Set(['upload']); // 업로드는 항상 완료 상태

function switchIrTab(tabId) {
  document.querySelectorAll('.ir-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.ir-menu-item').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
}

/** 단계 완료 처리 — 메뉴 체크 표시 + 다음 단계 버튼 활성화 */
function completeStep(tabId) {
  _completedSteps.add(tabId);
  const menuEl = document.querySelector(`[data-tab="${tabId}"]`);
  if (menuEl) menuEl.classList.add('step-done');

  // 다음 탭 메뉴 활성화
  const nextTab = NEXT_TAB[tabId];
  if (nextTab) {
    const nextMenuId = TAB_MENU_ID[nextTab];
    if (nextMenuId) {
      const nextMenu = document.getElementById(nextMenuId);
      if (nextMenu) nextMenu.disabled = false;
    }
  }
}

/** 섹션 하단 "다음 단계" 버튼을 렌더링/업데이트합니다. */
function renderNextStepBtn(currentTabId) {
  const nextTabId = NEXT_TAB[currentTabId];
  if (!nextTabId) return;

  const sectionEl = document.getElementById(currentTabId);
  if (!sectionEl) return;

  const btnId = `nextStepBtn_${currentTabId}`;
  if (document.getElementById(btnId)) return; // 이미 있으면 스킵

  const nextMenuId  = TAB_MENU_ID[nextTabId];
  const isLocked    = nextMenuId && document.getElementById(nextMenuId)?.disabled;

  const NEXT_LABELS = {
    'multi-result': "3단계: AI심사역 '루트'의 피드백 시작",
    'examiner':     '4단계: 펀드 & 투자자 추천 보기',
    'fund-match':   '5단계: 콜드 메일 작성',
  };
  const label = NEXT_LABELS[nextTabId] || '다음 단계';

  const wrapper = document.createElement('div');
  wrapper.id = btnId;
  wrapper.style.cssText = 'margin-top:2rem;padding-top:1.5rem;border-top:1.5px solid #e2e8f0;text-align:right;';
  wrapper.innerHTML = `
    <button onclick="switchIrTab('${nextTabId}')"
      style="background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;border:none;
             border-radius:10px;padding:0.75rem 1.75rem;font-size:0.9rem;font-weight:700;
             cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(37,99,235,0.25);
             display:inline-flex;align-items:center;gap:0.5rem;">
      ${label} <i class="fa-solid fa-arrow-right"></i>
    </button>
  `;
  sectionEl.appendChild(wrapper);
}

// ─── 파일 처리 ────────────────────────────────────────────────
const irTexts = { 1: "", 2: "", 3: "" };
const irFiles = { 1: null, 2: null, 3: null }; // 실제 File 객체 보관 (PDF용)

function onFileSelect(input, slot) {
  const file = input.files[0];
  if (file) handleFile(file, slot);
}

function handleFile(file, slot) {
  const nameEl = document.getElementById(`fileName${slot}`);
  const zoneEl = document.getElementById(`uploadZone${slot}`);
  if (nameEl) nameEl.textContent = `✅ ${file.name}`;
  if (zoneEl) zoneEl.classList.add("has-file");

  // PDF는 File 객체 보관, 텍스트 파일은 기존대로 읽기
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    irFiles[slot] = file;
    irTexts[slot] = `[PDF: ${file.name}]`; // 표시용 더미 텍스트
    const hasAny = Object.values(irTexts).some(t => t.trim());
    document.getElementById("analyzeBtn").disabled = !(hasAny && selectedMode);
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      irTexts[slot] = e.target.result;
      const hasAny = Object.values(irTexts).some(t => t.trim());
      document.getElementById("analyzeBtn").disabled = !(hasAny && selectedMode);
    };
    reader.readAsText(file, "utf-8");
  }
}

// ─── PDF 병합 유틸 (pdf-lib 사용) ─────────────────────────────
async function mergePdfs(files) {
  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();
  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const indices = src.getPageIndices();
      const copied = await merged.copyPages(src, indices);
      copied.forEach(p => merged.addPage(p));
    } catch (e) {
      console.warn(`[mergePdfs] ${file.name} 병합 실패, 건너뜀:`, e);
    }
  }
  const mergedBytes = await merged.save();
  const names = files.map(f => f.name.replace('.pdf', '')).join('+');
  return new File([mergedBytes], `merged_${names}.pdf`, { type: 'application/pdf' });
}

// ─── 분석 시작 ────────────────────────────────────────────────
const SCORE_CATEGORIES = ["시장성", "팀", "기술력", "BM", "재무"];
const SCORE_COLORS = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

let radarChart = null;
let irAnalysis = null;

async function startAnalysis() {
  if (!selectedMode) {
    alert("심사 모드를 선택해주세요.");
    return;
  }

  // PDF 파일 확인 (슬롯 1~3 중 업로드된 모든 PDF 수집)
  const pdfFileList = [irFiles[1], irFiles[2], irFiles[3]].filter(Boolean);
  const desc = document.getElementById("companyDesc")?.value.trim() || "";

  if (!pdfFileList.length && !desc) {
    alert("PDF 파일을 업로드하거나 회사 소개를 입력해 주세요.");
    return;
  }

  // 크레딧 확인
  const cr = typeof getCredits === 'function' ? getCredits() : { simple: 1, premium: 0, reanalysis: 0 };
  const now = Date.now();
  const creditMap = { simple: cr.simple, premium: cr.premium, reanalysis: cr.reanalysis, multi: cr.premium };
  const modeLabel = { simple: '간단심사', premium: '정밀심사', reanalysis: '재심사', multi: '멀티에이전트 심사' };

  if (selectedMode === 'reanalysis') {
    const valid = cr.reanalysis > 0 && cr.reanalysisExpires && new Date(cr.reanalysisExpires).getTime() > now;
    if (!valid) {
      showCreditModal('재심사 크레딧이 없거나 만료되었습니다.\n정밀심사 완료 후 6시간 이내에 사용 가능합니다.');
      return;
    }
  } else if (selectedMode === 'multi' && (cr.premium || 0) < 3) {
    showCreditModal('멀티에이전트 심사는 정밀심사 크레딧 3개가 필요합니다.');
    return;
  } else if (selectedMode !== 'multi' && creditMap[selectedMode] <= 0) {
    showCreditModal(`${modeLabel[selectedMode]} 크레딧이 부족합니다.\n크레딧을 충전하고 심사를 진행하세요.`);
    return;
  }

  // 크레딧 차감
  const token = localStorage.getItem('auth_token') || localStorage.getItem('vc_token') || '';
  try {
    if (token) {
      await fetch('/api/credits/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ mode: selectedMode }),
      });
    }
    const cached = typeof getCredits === 'function' ? getCredits() : cr;
    if (selectedMode === 'simple')     cached.simple    = Math.max(0, (cached.simple    || 1) - 1);
    if (selectedMode === 'premium')    cached.premium   = Math.max(0, (cached.premium   || 0) - 1);
    if (selectedMode === 'reanalysis') cached.reanalysis = Math.max(0, (cached.reanalysis || 0) - 1);
    if (selectedMode === 'multi')      cached.premium   = Math.max(0, (cached.premium   || 0) - 3);
    const creditKey = typeof getCreditKey === 'function' ? getCreditKey() : 'vc_credits';
    localStorage.setItem(creditKey, JSON.stringify(cached));
    if (typeof renderIrCreditBar === 'function') renderIrCreditBar();
  } catch (_) { /* 차감 실패해도 분석은 계속 */ }

  document.getElementById("analyzeBtn").disabled = true;
  document.getElementById("analyzing").style.display = "block";

  const statusEl = document.getElementById("analyzeStatus");
  const stepsSimple  = ["IR 파일 전송 중...", "AI 심사 중...", "스코어 산출 중..."];
  const stepsPremium = ["IR 파일 전송 중...", "공공데이터 수집 중...", "AI 심사역 분석 중...", "레이더 차트 생성 중..."];
  const stepsMulti   = ["문서 전송 중...", "재무 심사역 분석 중...", "시장/BM 분석가 분석 중...", "운영/인력 평가자 분석 중...", "투자위원회 취합 중...", "최종 판정 산출 중..."];
  const steps = selectedMode === 'simple' ? stepsSimple
              : selectedMode === 'multi'  ? stepsMulti
              : stepsPremium;
  let step = 0;
  const interval = setInterval(() => {
    statusEl.textContent = steps[Math.min(step++, steps.length - 1)];
  }, 5000);

  try {
    const sector = document.getElementById("sectorSelect")?.value || "기타";
    const stage  = document.getElementById("stageSelect")?.value  || "Seed";
    const companyName = desc.slice(0, 50);

    // ── 멀티에이전트 모드 ────────────────────────────────────────
    if (selectedMode === 'multi') {
      if (!pdfFileList.length) {
        throw new Error('멀티에이전트 심사는 최소 1개의 PDF 파일이 필요합니다.');
      }

      // 슬롯별 파일을 각각 전송 (병합 안 함)
      // 슬롯1=회사소개서(ir_deck), 슬롯2=사업계획서(biz_plan), 슬롯3=재무제표(financials)
      const formData = new FormData();
      if (irFiles[1]) formData.append('ir_deck',    irFiles[1]);
      else if (irFiles[2]) formData.append('ir_deck', irFiles[2]); // fallback
      else if (irFiles[3]) formData.append('ir_deck', irFiles[3]);
      if (irFiles[2]) formData.append('biz_plan',   irFiles[2]);
      if (irFiles[3]) formData.append('financials',  irFiles[3]);
      formData.append('sector', sector);
      formData.append('stage', stage);
      if (companyName) formData.append('company_name', companyName);

      statusEl.textContent = "3개 문서 전송 중...";
      const startRes = await fetch('/api/analysis/start/multi', {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: formData,
      });

      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}));
        throw new Error(err.message || '멀티에이전트 분석 시작 실패');
      }

      const startData = await startRes.json();
      const taskId = startData.data?.task_id;
      if (!taskId) throw new Error('task_id를 받지 못했습니다.');
      window._lastAnalysisTaskId = taskId; // AI 심사역 채팅 연결용

      // 폴링 (최대 5분 — 3 에이전트 + Aggregator)
      statusEl.textContent = "3명의 AI 심사역이 독립 분석 중입니다...";
      const result = await pollAnalysisResult(taskId, 300000);

      clearInterval(interval);
      renderMultiAgentResult(result);
      return; // 멀티 결과 렌더 후 일반 score 탭은 건너뜀
    }

    // ── 단일 PDF 모드 (simple / premium / reanalysis) ────────────
    let pdfFile = null;
    if (pdfFileList.length === 1) {
      pdfFile = pdfFileList[0];
    } else if (pdfFileList.length > 1) {
      statusEl.textContent = `PDF ${pdfFileList.length}개 병합 중...`;
      pdfFile = await mergePdfs(pdfFileList);
    }

    if (pdfFile) {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('sector', sector);
      formData.append('stage', stage);
      formData.append('mode', selectedMode === 'reanalysis' ? 'premium' : selectedMode);
      if (companyName) formData.append('company_name', companyName);

      const startRes = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: formData,
      });

      if (!startRes.ok) {
        const rawText = await startRes.text().catch(() => '');
        let errMsg = '분석 시작 실패';
        try {
          const errJson = JSON.parse(rawText);
          errMsg = errJson.message || errJson.detail || errJson.error || rawText.slice(0, 200);
        } catch (_) {
          errMsg = rawText.slice(0, 200) || `HTTP ${startRes.status}`;
        }
        console.error('[startAnalysis] HTTP', startRes.status, rawText);
        throw new Error(errMsg);
      }

      const startData = await startRes.json();
      const taskId = startData.data?.task_id;
      if (!taskId) throw new Error('task_id를 받지 못했습니다.');
      window._lastAnalysisTaskId = taskId; // AI 심사역 채팅 연결용

      statusEl.textContent = "AI 심사역이 분석 중입니다...";
      const result = await pollAnalysisResult(taskId, 180000);

      clearInterval(interval);
      irAnalysis = convertAiRouteResult(result);
      renderScore(irAnalysis);

    } else {
      // PDF 없으면 텍스트 기반 데모
      await new Promise(r => setTimeout(r, 3000));
      const result = getDemoAnalysis(desc);
      clearInterval(interval);
      irAnalysis = result;
      renderScore(result);
    }

    // 단일 분석 완료 → 2단계(멀티에이전트 결과) 탭에 요약 표시 후 이동
    document.getElementById("menu-multi").disabled = false;
    completeStep('upload');
    renderSingleAnalysisSummary(irAnalysis);  // multi-result 탭에 단일 분석 요약 채우기
    if (window._lastAnalysisTaskId) enableExaminerTab(window._lastAnalysisTaskId);
    switchIrTab("multi-result");
    renderNextStepBtn('multi-result');

  } catch (err) {
    clearInterval(interval);
    console.error('[AI.ROUTE 연동 오류]', err);
    const result = getDemoAnalysis(desc || "분석 실패");
    irAnalysis = result;
    renderScore(result);
    document.getElementById("menu-multi").disabled = false;
    completeStep('upload');
    renderSingleAnalysisSummary(irAnalysis);
    switchIrTab("multi-result");
    alert(`심사 중 오류가 발생했습니다.\n\n${err.message}`);
  } finally {
    document.getElementById("analyzing").style.display = "none";
    document.getElementById("analyzeBtn").disabled = false;
  }
}

// ── AI.ROUTE 결과 폴링 ─────────────────────────────────────────
async function pollAnalysisResult(taskId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`/api/analysis/${taskId}`);
    if (!res.ok) continue;
    const data = await res.json();
    const report = data.data;
    if (report?.status === 'completed') return report;
    if (report?.status === 'failed') throw new Error(report.error_message || '분석 실패');
  }
  throw new Error('분석 시간 초과 (3분)');
}

// ── 단일 분석 결과를 multi-result 탭에 요약 표시 ─────────────
// single/premium/reanalysis 완료 후 multi-result 탭이 비어 있지 않도록 채워줌
function renderSingleAnalysisSummary(analysis) {
  if (!analysis) return;

  // 플레이스홀더 숨기기
  const ph = document.getElementById('multiResultPlaceholder');
  if (ph) ph.style.display = 'none';

  // 총점 계산 (5개 항목 × 0~20 → 0~100)
  const total = Object.values(analysis.scores || {}).reduce((a, b) => a + b, 0);
  const grade = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';
  const gradeColor = { S: '#6d28d9', A: '#1d4ed8', B: '#0369a1', C: '#b45309', D: '#b91c1c' }[grade] || '#b45309';
  const modeLabel = analysis.report_type === 'premium' ? '정밀심사' : '간단심사';

  const verdictBanner    = document.getElementById('verdictBanner');
  const verdictBadge     = document.getElementById('verdictBadge');
  const verdictRationale = document.getElementById('verdictRationale');

  if (verdictBanner && verdictBadge) {
    verdictBanner.style.display = 'block';
    verdictBanner.style.borderColor = gradeColor;
    verdictBadge.className = 'verdict-badge';
    verdictBadge.style.justifyContent = 'center';
    verdictBadge.innerHTML = `
      <span style="font-size:2rem;font-weight:900;color:${gradeColor};margin-right:0.5rem;">${total}<span style="font-size:1rem;color:#94a3b8;">/100</span></span>
      <span style="background:${gradeColor};color:#fff;padding:0.2rem 0.7rem;border-radius:6px;font-size:1rem;font-weight:700;margin-right:0.75rem;">${grade}등급</span>
      <span style="font-size:0.88rem;color:#64748b;">${modeLabel} 결과</span>
    `;
    if (verdictRationale) {
      const topFeedback = (analysis.feedback || []).slice(0, 3)
        .map(f => {
          const color = f.type === 'bad' ? '#dc2626' : f.type === 'warn' ? '#b45309' : '#16a34a';
          const icon  = f.type === 'bad' ? '🚩' : f.type === 'warn' ? '⚠️' : '✓';
          return `<div style="font-size:0.83rem;color:${color};margin-bottom:0.3rem;line-height:1.45;">${icon} ${f.text}</div>`;
        }).join('');
      verdictRationale.innerHTML = `
        <div style="margin-bottom:0.75rem;">${topFeedback || '<div style="font-size:0.83rem;color:#94a3b8;">피드백 정보 없음</div>'}</div>
        <div style="padding:0.7rem 1rem;background:#eff6ff;border-radius:8px;font-size:0.82rem;color:#1e40af;border:1px solid #bfdbfe;">
          💡 3인 AI 교차검증이 필요하시면 <strong>멀티에이전트 모드</strong>로 다시 심사하세요
        </div>
      `;
    }
  }

  // 5대 점수 도메인 요약도 채워줌 (간이 버전)
  const rubricSummaryWrap = document.getElementById('verdictBanner');
  if (rubricSummaryWrap && !rubricSummaryWrap.querySelector('.rubric-domain-summary')) {
    const summaryEl = document.createElement('div');
    summaryEl.className = 'rubric-domain-summary';
    summaryEl.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:0.4rem;margin-top:1rem;';
    const SCORE_COLORS_MAP = { '시장성': '#6366f1', '팀': '#0ea5e9', '기술력': '#22c55e', 'BM': '#f59e0b', '재무': '#ef4444' };
    summaryEl.innerHTML = Object.entries(analysis.scores || {}).map(([k, v]) => {
      const color = SCORE_COLORS_MAP[k] || '#2563eb';
      const pct = Math.round(v / 20 * 100);
      return `<div style="background:#f8fafc;border-radius:8px;padding:0.5rem;text-align:center;border:1px solid #e2e8f0;">
        <div style="font-size:0.7rem;color:#64748b;margin-bottom:0.2rem;">${k}</div>
        <div style="font-size:1.15rem;font-weight:800;color:${color};">${v}<span style="font-size:0.65rem;color:#94a3b8;">/20</span></div>
        <div style="height:3px;background:#f1f5f9;border-radius:2px;margin-top:0.25rem;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;"></div>
        </div>
      </div>`;
    }).join('');
    rubricSummaryWrap.appendChild(summaryEl);
  }
}

// ── 멀티에이전트 결과 렌더링 (루브릭 스코어링 체계 적용) ──────
// 배점: 재무(35) + 시장(40) + 운영(25) = 100점 / S~D 등급
function renderMultiAgentResult(report) {
  // 플레이스홀더 숨기기
  const ph = document.getElementById('multiResultPlaceholder');
  if (ph) ph.style.display = 'none';

  // ── 루브릭 총점 · 등급 · 판정 배너 ──────────────────────────
  const rubricTotal = report.rubric_total ?? 0;
  const grade       = report.grade ?? 'C';

  const gradeMap = {
    S: { color: '#6d28d9', label: 'S (탁월)', desc: '동종 업계 상위 10%' },
    A: { color: '#1d4ed8', label: 'A (우수)', desc: '상위 25%' },
    B: { color: '#0369a1', label: 'B (보통)', desc: '업계 평균 수준' },
    C: { color: '#b45309', label: 'C (미흡)', desc: '보완 필요' },
    D: { color: '#b91c1c', label: 'D (위험)', desc: '투자/거래 비추천' },
  };
  const gm = gradeMap[grade] || gradeMap.C;

  const verdictBanner    = document.getElementById('verdictBanner');
  const verdictBadge     = document.getElementById('verdictBadge');
  const verdictRationale = document.getElementById('verdictRationale');

  if (verdictBanner && verdictBadge) {
    verdictBanner.style.display = 'block';
    verdictBanner.style.borderColor = gm.color;

    const v = (report.investment_verdict || 'WATCH').toUpperCase();
    const verdictMap = {
      PASS:   { cls: 'verdict-pass',   icon: '✅', label: 'PASS — 투자 추천' },
      WATCH:  { cls: 'verdict-watch',  icon: '⚠️', label: 'WATCH — 조건부 검토' },
      REJECT: { cls: 'verdict-reject', icon: '❌', label: 'REJECT — 투자 불가' },
    };
    const vm = verdictMap[v] || verdictMap.WATCH;
    verdictBadge.className = `verdict-badge ${vm.cls}`;

    // 루브릭 총점 + 등급 + 판정을 한 줄에 표시
    verdictBadge.innerHTML = `
      <span style="font-size:2rem;font-weight:900;color:${gm.color};margin-right:0.5rem;">${rubricTotal.toFixed(0)}<span style="font-size:1rem;color:#94a3b8;">/100</span></span>
      <span style="background:${gm.color};color:#fff;padding:0.2rem 0.7rem;border-radius:6px;font-size:1rem;font-weight:700;margin-right:0.75rem;">${gm.label}</span>
      <span style="font-size:1.1rem;">${vm.icon} ${vm.label}</span>
    `;
    if (verdictRationale) verdictRationale.textContent = report.verdict_rationale || '';
  }

  // ── 루브릭 도메인 점수 요약 (배너 하단 3컬럼) ─────────────────
  const rubricScores = report.rubric_scores || {};
  const rubricSummaryWrap = document.getElementById('verdictBanner');
  if (rubricSummaryWrap) {
    const existing = rubricSummaryWrap.querySelector('.rubric-domain-summary');
    if (!existing) {
      const summaryEl = document.createElement('div');
      summaryEl.className = 'rubric-domain-summary';
      summaryEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-top:1rem;';

      const domainDefs = [
        { key: 'financial', label: '재무', max: 35, color: '#3b82f6' },
        { key: 'market',    label: '시장/BM', max: 40, color: '#22c55e' },
        { key: 'ops_hr',    label: '운영/인력', max: 25, color: '#f97316' },
      ];

      summaryEl.innerHTML = domainDefs.map(d => {
        const sc = rubricScores[d.key]?.score ?? 0;
        const mx = rubricScores[d.key]?.max  ?? d.max;
        const pct = mx > 0 ? Math.round(sc / mx * 100) : 0;
        return `<div style="background:#f8fafc;border-radius:8px;padding:0.6rem;text-align:center;border:1px solid #e2e8f0;">
          <div style="font-size:0.75rem;color:#64748b;margin-bottom:0.25rem;">${d.label}</div>
          <div style="font-size:1.3rem;font-weight:800;color:${d.color};">${sc}<span style="font-size:0.75rem;color:#94a3b8;">/${mx}</span></div>
          <div style="height:4px;background:#f1f5f9;border-radius:2px;margin-top:0.3rem;">
            <div style="height:100%;width:${pct}%;background:${d.color};border-radius:2px;transition:width 0.6s;"></div>
          </div>
        </div>`;
      }).join('');
      rubricSummaryWrap.appendChild(summaryEl);
    }
  }

  // ── 에이전트 카드 렌더링 헬퍼 (루브릭 실점수 표시) ───────────
  // 항목별 최대 배점 매핑 (루브릭 기준)
  const RUBRIC_ITEM_MAX = {
    financial_health: 10, runway: 15, unit_economics: 10,
    tam_sam_som: 10, pmf: 15, competitive_moat: 15,
    clevel_competency: 15, hiring_roadmap: 10,
  };
  const RUBRIC_ITEM_LABEL = {
    financial_health:  '재무 건전성 및 부채',
    runway:            '생존 기간 (Runway)',
    unit_economics:    '유닛 이코노믹스 (LTV/CAC)',
    tam_sam_som:       '타겟 시장 규모 (TAM/SAM/SOM)',
    pmf:               '제품-시장 적합성 (PMF)',
    competitive_moat:  '경쟁 우위 및 해자 (Moat)',
    clevel_competency: '창업진 및 C-Level 역량',
    hiring_roadmap:    '채용 및 조직 확장 로드맵',
  };

  function renderAgentCard(agentKey, cardId, scoreId, subScoresId, flagsId, barColor) {
    const agent = report.agent_reports?.[agentKey];
    if (!agent) return;
    const card = document.getElementById(cardId);
    if (card) card.style.display = 'block';

    // 도메인 실점수/최대 표시
    const scoreEl = document.getElementById(scoreId);
    if (scoreEl) {
      const dt  = agent.domain_total ?? agent.overall ?? 0;
      const dmx = agent.domain_max  ?? 100;
      scoreEl.textContent = `${dt}/${dmx}`;
    }

    // 세부 점수 바 (실점수/최대 표시)
    const subEl = document.getElementById(subScoresId);
    if (subEl && agent.sub_scores && Object.keys(agent.sub_scores).length > 0) {
      subEl.innerHTML = Object.entries(agent.sub_scores).map(([k, v]) => {
        const maxPts = RUBRIC_ITEM_MAX[k] || 15;
        const pct    = Math.round((v / maxPts) * 100);
        const label  = RUBRIC_ITEM_LABEL[k] || k;
        return `<div class="sub-score-row" style="margin-bottom:0.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
            <span style="font-size:0.78rem;color:#475569;">${label}</span>
            <span style="font-size:0.82rem;font-weight:700;color:#1e293b;">${v}<span style="font-size:0.7rem;color:#94a3b8;">/${maxPts}점</span></span>
          </div>
          <div style="height:6px;background:#f1f5f9;border-radius:3px;">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width 0.6s;"></div>
          </div>
        </div>`;
      }).join('');
    } else if (subEl) {
      subEl.innerHTML = '<div style="font-size:0.78rem;color:#94a3b8;">세부 점수 정보 없음</div>';
    }

    // RED FLAG / 긍정 신호
    const flagEl = document.getElementById(flagsId);
    if (flagEl) {
      const flags = (agent.red_flags || []).map(f =>
        `<div style="font-size:0.78rem;color:#dc2626;margin-bottom:3px;line-height:1.4;">🚩 ${f}</div>`).join('');
      const pos = (agent.positive_signals || []).slice(0, 2).map(f =>
        `<div style="font-size:0.78rem;color:#16a34a;margin-bottom:3px;line-height:1.4;">✓ ${f}</div>`).join('');
      flagEl.innerHTML = flags + pos;
    }
  }

  renderAgentCard('financial', 'agentFinancialCard', 'agentFinancialScore', 'agentFinancialSubScores', 'agentFinancialFlags', '#3b82f6');
  renderAgentCard('market',    'agentMarketCard',    'agentMarketScore',    'agentMarketSubScores',    'agentMarketFlags',    '#22c55e');
  renderAgentCard('ops_hr',    'agentOpsCard',       'agentOpsScore',       'agentOpsSubScores',       'agentOpsFlags',       '#f97316');

  // ── 교차 검증 ────────────────────────────────────────────────
  const cv = report.cross_validation || {};
  const cvGrid = document.getElementById('crossValidationGrid');
  if (cvGrid) cvGrid.removeAttribute('style');

  const contList = document.getElementById('contradictionsList');
  if (contList) {
    const items = cv.contradictions || [];
    contList.innerHTML = items.length
      ? items.map(c => `<div class="contradiction-item" style="font-size:0.82rem;color:#dc2626;margin-bottom:4px;line-height:1.5;">⚡ ${c.note || c.description || JSON.stringify(c)}</div>`).join('')
      : '<div style="font-size:0.82rem;color:#94a3b8;">감지된 모순 없음</div>';
  }

  const consList = document.getElementById('consensusList');
  if (consList) {
    const items = cv.consensus || [];
    consList.innerHTML = items.length
      ? items.map(c => `<div class="consensus-item" style="font-size:0.82rem;color:#16a34a;margin-bottom:4px;line-height:1.5;">✅ ${c}</div>`).join('')
      : '<div style="font-size:0.82rem;color:#94a3b8;">합의 사항 없음</div>';
  }

  // ── DD 체크리스트 ────────────────────────────────────────────
  const ddWrap = document.getElementById('ddChecklistWrap');
  const ddList = document.getElementById('ddChecklist');
  if (ddWrap && ddList) {
    const items = report.due_diligence_checklist || [];
    if (items.length) {
      ddWrap.style.display = 'block';
      ddList.innerHTML = items.map((i, idx) =>
        `<div class="dd-item" style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.83rem;">
          <span style="min-width:1.4rem;height:1.4rem;background:#e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;">${idx + 1}</span>
          <span style="color:#334155;line-height:1.5;">${i}</span>
        </div>`).join('');
    }
  }

  // ── 단계 완료 처리 ──────────────────────────────────────────
  completeStep('upload');
  completeStep('multi-result');

  // 3단계(AI 심사역) 활성화
  const menuExaminer = document.getElementById('menu-examiner');
  if (menuExaminer) menuExaminer.disabled = false;
  if (window._lastAnalysisTaskId) enableExaminerTab(window._lastAnalysisTaskId);

  // 멀티 결과 탭으로 이동 + 다음 단계 버튼
  switchIrTab('multi-result');
  renderNextStepBtn('multi-result');

  // 기존 score 탭도 채워두기 (5대 지표 공통 사용)
  if (report.scores) {
    irAnalysis = convertAiRouteResult(report);
    renderScore(irAnalysis);
    // 스코어링은 멀티에이전트 결과 탭에 통합 — 별도 탭 비활성 유지
  }
}

// ══════════════════════════════════════════════════════════════
// 대화형 AI 심사역 채팅
// ══════════════════════════════════════════════════════════════

let _examinerTaskId   = null;   // 현재 분석 task_id
let _examinerHistory  = [];     // [{role, content}, ...] 대화 히스토리
let _examinerStreaming = false;  // 스트리밍 중 여부

/** 심사역 채팅을 활성화합니다 (분석 완료 후 호출). */
function enableExaminerTab(taskId) {
  _examinerTaskId = taskId;
  const menuEl = document.getElementById('menu-examiner');
  if (menuEl) menuEl.disabled = false;
}

/** 심사역 메시지 버블을 채팅 영역에 추가합니다. */
function _appendExaminerBubble(content, role = 'assistant') {
  const container = document.getElementById('examinerMessages');
  if (!container) return null;

  const isAI = role === 'assistant';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;align-items:flex-start;gap:0.6rem;${isAI ? '' : 'flex-direction:row-reverse;'}`;

  const avatar = document.createElement('div');
  avatar.style.cssText = `
    width:2rem;height:2rem;border-radius:50%;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;font-size:0.9rem;
    ${isAI
      ? 'background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;'
      : 'background:#e2e8f0;color:#475569;'}
  `;
  avatar.innerHTML = isAI ? '<i class="fa-solid fa-user-tie"></i>' : '<i class="fa-solid fa-user"></i>';

  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width:82%;padding:0.85rem 1rem;border-radius:${isAI ? '4px 12px 12px 12px' : '12px 4px 12px 12px'};
    font-size:0.88rem;line-height:1.7;white-space:pre-wrap;word-break:break-word;
    ${isAI
      ? 'background:#fff;border:1.5px solid #e2e8f0;color:#1e293b;'
      : 'background:#1d4ed8;color:#fff;'}
  `;
  bubble.textContent = content;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;

  return bubble; // 스트리밍 업데이트용 참조 반환
}

/** SSE fetch 스트리밍을 받아 버블을 타이핑 효과로 채웁니다. */
async function _streamIntoBubble(url, body, bubble) {
  _examinerStreaming = true;
  const sendBtn = document.getElementById('examinerSendBtn');
  const input   = document.getElementById('examinerInput');
  if (sendBtn) sendBtn.disabled = true;
  if (input)   input.disabled   = true;

  const token = localStorage.getItem('auth_token') || localStorage.getItem('vc_token') || '';
  const fetchOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  };

  let fullText = '';
  try {
    const res = await fetch(url, fetchOpts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop(); // 마지막 불완전 줄은 다음 청크로

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') break;
        try {
          const { text, error } = JSON.parse(payload);
          if (error) throw new Error(error);
          if (text) {
            fullText += text;
            bubble.textContent = fullText;
            const container = document.getElementById('examinerMessages');
            if (container) container.scrollTop = container.scrollHeight;
          }
        } catch (_) { /* 파싱 실패 무시 */ }
      }
    }
  } catch (err) {
    bubble.textContent = `오류: ${err.message}`;
    bubble.style.color = '#dc2626';
  } finally {
    _examinerStreaming = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input)   { input.disabled = false; input.focus(); }
    // 히스토리에 완료된 AI 응답 저장
    if (fullText) _examinerHistory.push({ role: 'assistant', content: fullText });
  }
}

/** 심사역 첫 질문 시작 */
async function startExaminerChat() {
  if (!_examinerTaskId) {
    alert('분석 완료 후 심사 대화를 시작할 수 있습니다.');
    return;
  }

  // 인트로 숨기고 채팅창 표시
  const intro = document.getElementById('examinerIntro');
  const chatWrap = document.getElementById('examinerChatWrap');
  if (intro) intro.style.display = 'none';
  if (chatWrap) chatWrap.style.display = 'block';

  _examinerHistory = [];

  // 로딩 버블 생성 후 스트리밍
  const bubble = _appendExaminerBubble('루트가 정밀 심사 결과를 검토하고 있습니다...', 'assistant');
  if (bubble) bubble.textContent = '';

  await _streamIntoBubble(
    `/api/analysis/chat/start/${_examinerTaskId}`,
    {},
    bubble,
  );

  // Q1이 나오면 심사역 대화 단계 완료로 간주 (다음 단계 버튼 표시)
  completeStep('examiner');
  renderNextStepBtn('examiner');
}

/** 사용자 답변 전송 → 피드백 + 다음 질문 수신 */
async function sendExaminerMessage() {
  if (_examinerStreaming) return;

  const input = document.getElementById('examinerInput');
  const text = input?.value.trim();
  if (!text) return;

  // 사용자 버블 추가
  _appendExaminerBubble(text, 'user');
  _examinerHistory.push({ role: 'user', content: text });
  input.value = '';

  // AI 응답 버블 (빈 채 생성 → 스트리밍)
  const aiBubble = _appendExaminerBubble('', 'assistant');

  await _streamIntoBubble(
    '/api/analysis/chat/message',
    { task_id: _examinerTaskId, messages: [..._examinerHistory] },
    aiBubble,
  );
}

// ── AI.ROUTE 결과 → 기존 UI 포맷 변환 ──────────────────────────
// AI.ROUTE: 0~100점, 영어 키 → VC.ROUTE: 0~20점, 한국어 카테고리명
function convertAiRouteResult(report) {
  const s = report.scores || {};
  const toTwenty = (v) => Math.round((v ?? 60) / 5); // 100점 → 20점 환산

  return {
    scores: {
      "시장성": toTwenty(s.market),
      "팀":     toTwenty(s.team),
      "기술력": toTwenty(s.tech),
      "BM":     toTwenty(s.bm),
      "재무":   toTwenty(s.exit),
    },
    feedback: [
      report.critical_feedback ? { type: 'warn', text: report.critical_feedback } : null,
      ...(report.missing_items    || []).map(t => ({ type: 'bad',  text: `누락: ${t}` })),
      ...(report.suggested_actions|| []).map(t => ({ type: 'good', text: t })),
    ].filter(Boolean),
    rationale: report.score_rationale || {},
    benchmarks: report.benchmarks || null,
    radar_chart: report.radar_chart || null,
    report_type: report.report_type || 'simple',
    task_id: report.task_id,
    reanalysis_expires_at: report.reanalysis_expires_at,
  };
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
    questions: pickRandomQuestions(),
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

async function saveRecommendHistory() {
  if (!selectedFund || !selectedGP) return;
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  // 동일 펀드+투자자 중복 저장 방지
  const { data: existing } = await sb.from('user_ai_history')
    .select('id').eq('user_id', user.id)
    .eq('fund_name', selectedFund.fundName).eq('gp_name', selectedGP.name).limit(1);
  if (existing && existing.length > 0) return;

  await sb.from('user_ai_history').insert({
    user_id: user.id,
    date: dateStr,
    match_score: selectedFund.matchScore || 0,
    fund_name: selectedFund.fundName,
    company_name: selectedFund.companyName,
    industry: selectedFund.industry,
    gp_name: selectedGP.name,
    gp_company: selectedGP.company,
    gp_email: selectedGP.email,
  });

  // 최대 20건 유지 - 초과분 삭제
  const { data: all } = await sb.from('user_ai_history')
    .select('id').eq('user_id', user.id).order('created_at', { ascending: true });
  if (all && all.length > 20) {
    const toDelete = all.slice(0, all.length - 20).map(r => r.id);
    await sb.from('user_ai_history').delete().in('id', toDelete);
  }
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

// ─── 대시보드 자료보관함 가져오기 ─────────────────────────────────
let _importFiles = [];

const SLOT_LABELS = { 1: "회사소개서", 2: "IR 자료", 3: "재무제표" };

function guessSlot(category) {
  if (!category) return 2;
  const c = category.toLowerCase();
  if (c.includes("회사") || c.includes("소개")) return 1;
  if (c.includes("ir") || c.includes("자료") || c.includes("pitch") || c.includes("deck")) return 2;
  if (c.includes("재무") || c.includes("financial")) return 3;
  return 2;
}

function _renderImportModal(files) {
  const overlay = document.getElementById("importModalOverlay");
  const body    = document.getElementById("importModalBody");
  if (!overlay || !body) return;

  if (!files.length) {
    body.innerHTML = `<div class="import-empty"><i class="fa-solid fa-folder-open"></i>자료보관함에 저장된 파일이 없습니다.<br><small style="margin-top:0.4rem;display:block;">대시보드 → 자료보관함에서 파일을 먼저 업로드해 주세요.</small></div>`;
  } else {
    body.innerHTML = files.map(f => {
      const ext  = (f.name || "").split(".").pop().toLowerCase();
      const iconCls = ext === "pdf" ? "pdf" : (ext === "pptx" || ext === "ppt") ? "ppt" : (ext === "docx" || ext === "doc") ? "doc" : ext === "cert" ? "cert" : "other";
      const iconTag = ext === "pdf" ? "fa-file-pdf" : (ext === "pptx" || ext === "ppt") ? "fa-file-powerpoint" : (ext === "docx" || ext === "doc") ? "fa-file-word" : "fa-file";
      const badgeCls = f.badge === "IR" ? "ir" : f.badge === "IM" ? "im" : f.badge === "인증서류" ? "cert" : "other";
      const badgeLabel = f.badge || "기타";
      const slot = guessSlot(f.category);
      const hasContent = f.content && f.content.trim().length > 0;
      const btnLabel = hasContent ? `슬롯 ${slot}(${SLOT_LABELS[slot]})으로` : "내용 없음";
      const btnCls   = hasContent ? "import-btn" : "import-btn no-content";
      const btnAttr  = hasContent ? `onclick="importFileFromDashboard('${f.id}', ${slot})"` : "disabled title='대시보드에서 파일을 다시 업로드해 주세요'";
      return `
        <div class="import-file-item">
          <div class="import-file-icon ${iconCls}"><i class="fa-solid ${iconTag}"></i></div>
          <div class="import-file-info">
            <div class="fname">${f.name}</div>
            <div class="fmeta">${f.date || ""} · ${f.size || ""} ${hasContent ? "" : "· <span style=\'color:#ef4444\'>내용 미포함</span>"}</div>
          </div>
          <span class="import-file-badge ${badgeCls}">${badgeLabel}</span>
          <button class="${btnCls}" ${btnAttr}>${hasContent ? btnLabel : "내용 없음"}</button>
        </div>`;
    }).join("");
  }

  overlay.classList.add("open");
}

async function openImportModal() {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) {
    const { data } = await sb.from('user_files').select('*').order('created_at', { ascending: false });
    _importFiles = data || [];
  }
  _renderImportModal(_importFiles);
}

function closeImportModal() {
  document.getElementById("importModalOverlay")?.classList.remove("open");
}

function importFileFromDashboard(fileId, slot) {
  const file = _importFiles.find(f => f.id === fileId);
  if (!file || !file.content) return;

  irTexts[slot] = file.content;
  const nameEl = document.getElementById(`fileName${slot}`);
  const zoneEl = document.getElementById(`uploadZone${slot}`);
  if (nameEl) nameEl.textContent = `✅ ${file.name}`;
  if (zoneEl) zoneEl.classList.add("has-file");

  const hasAny = Object.values(irTexts).some(t => t.trim());
  const btn = document.getElementById("analyzeBtn");
  if (btn) btn.disabled = !hasAny;

  closeImportModal();
  // 가져온 슬롯 스크롤
  zoneEl?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ============================================================
 * MBTI 16 型人格测试 · 逻辑层
 * ============================================================ */

const STORE_KEY = 'mbti_records_v1';
const TOTAL = QUESTIONS.length; // 48

let order = [];       // 打乱后的题目下标
let flips = [];       // 每题是否交换了 A/B 显示顺序
let answers = [];     // 每题作答 'A' / 'B'
let cursor = 0;

const $ = (id) => document.getElementById(id);

/* ---------- 小工具 ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function otherPole(pole) {
  const map = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' };
  return map[pole];
}
function dimOf(key) { return DIMENSIONS.find((d) => d.key === key); }
function familyOf(f) { return FAMILIES.find((x) => x.key === f); }
function familyColor(type) { return familyOf(TYPES[type].family).color; }

/* ---------- 视图切换 ---------- */
function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'analysis') renderAnalysis();
}

/* ==========================================================
 * 首页渲染
 * ========================================================== */
function renderHome() {
  // 四个维度卡片
  $('home-dims').innerHTML = DIMENSIONS.map((d) => {
    const p1 = d.poles[d.key[0]];
    const p2 = d.poles[d.key[1]];
    return `
    <div class="type-card" style="--c:${d.color}">
      <div class="type-emoji">${d.emoji}</div>
      <h3>${d.name}</h3>
      <div class="type-card-title">${d.key} · ${d.tip}</div>
      <div class="pole-row">
        <div class="pole"><b>${p1.code} ${p1.name}</b><br/>${p1.desc}</div>
        <div class="pole"><b>${p2.code} ${p2.name}</b><br/>${p2.desc}</div>
      </div>
    </div>`;
  }).join('');

  // 四大族群切换
  $('tag-wall-switch').innerHTML = FAMILIES.map((f, i) =>
    `<button class="chip${i === 0 ? ' active' : ''}" data-f="${f.key}" onclick="switchTagWall('${f.key}')">${f.emoji} ${f.name} ${f.key}</button>`
  ).join('');
  switchTagWall('NT');
}

function switchTagWall(fk) {
  document.querySelectorAll('#tag-wall-switch .chip').forEach((b) => b.classList.toggle('active', b.dataset.f === fk));
  const f = familyOf(fk);
  const list = TYPE_ORDER.filter((t) => TYPES[t].family === fk);
  $('tag-wall').innerHTML = list.map((t) => {
    const info = TYPES[t];
    return `
    <div class="tag-chip" style="--c:${f.color}">
      <div class="tag-chip-name">${info.emoji} ${info.name}<span class="tag-chip-main">${t}</span></div>
      <div class="tag-chip-desc">${info.slogan} · ${info.desc.split('。')[0]}。</div>
    </div>`;
  }).join('');
}

/* ==========================================================
 * 测试流程
 * ========================================================== */
function startTest() {
  order = shuffle(QUESTIONS.map((_, i) => i));
  flips = order.map(() => Math.random() < 0.5);
  answers = new Array(TOTAL).fill(null);
  cursor = 0;
  showView('quiz');
  renderQuestion();
}

function currentQ() { return QUESTIONS[order[cursor]]; }

function renderQuestion() {
  const q = currentQ();
  const d = dimOf(q.dim);
  const flip = flips[cursor];

  // 选项 A 始终对应 q.first，flip 时显示顺序对调
  const aText = flip ? q.b : q.a;
  const bText = flip ? q.a : q.b;
  const aPole = flip ? otherPole(q.first) : q.first; // 显示为 A 的那一极

  $('quiz-progress-text').textContent = `第 ${cursor + 1} / ${TOTAL} 题 · 已完成 ${answers.filter((x) => x).length} 题`;
  $('quiz-progress-bar').style.width = ((cursor + 1) / TOTAL * 100) + '%';

  $('quiz-box').innerHTML = `
    <div class="q-tag" style="--c:${d.color}">维度 ${DIMENSIONS.indexOf(d) + 1} / 4 · ${d.emoji} ${d.name}（${d.key}）</div>
    <div class="q-title">${q.q}</div>
    <div class="options">
      <button class="option${answers[cursor] === 'A' ? ' selected' : ''}" onclick="pick('A')">
        <span class="opt-letter" style="background:${d.color}">A</span>
        <span>${aText}</span>
      </button>
      <button class="option${answers[cursor] === 'B' ? ' selected' : ''}" onclick="pick('B')">
        <span class="opt-letter" style="background:${d.color}">B</span>
        <span>${bText}</span>
      </button>
    </div>
    <div class="quiz-nav">
      <button class="btn btn-ghost" onclick="prevQ()" ${cursor === 0 ? 'disabled' : ''}>← 上一题</button>
      <button class="btn btn-primary" onclick="nextQ()">${cursor === TOTAL - 1 ? '提交并查看结果 🎉' : '下一题 →'}</button>
    </div>
  `;
  window.__aPole = aPole;
}

function pick(letter) {
  answers[cursor] = letter;
  renderQuestion();
  if (cursor < TOTAL - 1) setTimeout(nextQ, 260);
}

function prevQ() {
  if (cursor > 0) { cursor--; renderQuestion(); }
}
function nextQ() {
  if (!answers[cursor]) {
    alert('请选择一个选项再继续～');
    return;
  }
  if (cursor < TOTAL - 1) { cursor++; renderQuestion(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  else finish();
}

/* ---------- 计分 ---------- */
function score() {
  const cnt = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  order.forEach((qi, pos) => {
    const q = QUESTIONS[qi];
    const flip = flips[pos];
    const aPole = flip ? otherPole(q.first) : q.first;
    const chosen = answers[pos] === 'A' ? aPole : otherPole(aPole);
    cnt[chosen]++;
  });
  const pct = {};
  DIMENSIONS.forEach((d) => {
    const p1 = d.key[0], p2 = d.key[1];
    const total = cnt[p1] + cnt[p2];
    pct[p1] = Math.round(cnt[p1] / total * 1000) / 10;
    pct[p2] = Math.round(cnt[p2] / total * 1000) / 10;
  });
  const type = DIMENSIONS.map((d) => (cnt[d.key[0]] >= cnt[d.key[1]] ? d.key[0] : d.key[1])).join('');
  return { cnt, pct, type };
}

function finish() {
  const r = score();
  const record = {
    ts: new Date().toISOString(),
    type: r.type,
    pct: r.pct,
  };
  saveRecord(record);
  renderResult(r.type, r.pct);
  showView('result');
}

/* ---------- 结果渲染 ---------- */
function renderResult(type, pct) {
  const info = TYPES[type];
  const fam = familyOf(info.family);
  const c = fam.color;

  $('result-box').innerHTML = `
    <div class="result-card" style="--c:${c}">
      <div class="result-emoji">${info.emoji}</div>
      <div class="result-label">你的 MBTI 人格类型</div>
      <div class="result-name">${type}</div>
      <div class="result-sub">${info.name} · ${fam.emoji} ${fam.name} ${fam.key}</div>
      <div class="result-title">「${info.slogan}」</div>
      <div class="result-tags">${info.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      <div class="result-desc">${info.desc}</div>

      <div class="dim-bars">
        <h3>四个维度倾向</h3>
        ${DIMENSIONS.map((d) => {
          const p1 = d.key[0], p2 = d.key[1];
          return `
          <div class="dim-row">
            <div class="rank-row">
              <div class="rank-name"><b>${p1} ${d.poles[p1].name}</b></div>
              <div class="rank-bar"><i style="width:${pct[p1]}%;background:${d.color}"></i></div>
              <div class="rank-val">${pct[p1]}%</div>
            </div>
            <div class="rank-row">
              <div class="rank-name"><b>${p2} ${d.poles[p2].name}</b></div>
              <div class="rank-bar"><i style="width:${pct[p2]}%;background:${d.color};opacity:.45"></i></div>
              <div class="rank-val">${pct[p2]}%</div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <div class="pair-grid">
        <div class="pair-box" style="--c:${c}">
          <h4>优势</h4>
          <ul>${info.good.map((x) => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="pair-box" style="--c:${c}">
          <h4>可能踩的坑</h4>
          <ul>${info.bad.map((x) => `<li>${x}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="career-line">适合的方向：<span>${info.careers.join(' / ')}</span></div>

      <div class="result-actions">
        <button class="btn btn-primary" onclick="startTest()">再测一次</button>
        <button class="btn btn-ghost" onclick="copyResult('${type}')">复制我的结果</button>
        <button class="btn btn-ghost" onclick="showView('analysis')">查看数据分析</button>
      </div>
    </div>`;
}

function copyResult(type) {
  const info = TYPES[type];
  const text = `我是 MBTI 里的 ${type} · ${info.name}（${info.slogan}）— 来做 48 题测试看看你是哪一型：${location.href}`;
  navigator.clipboard.writeText(text).then(
    () => alert('结果已复制，去粘贴给朋友吧～'),
    () => alert(text)
  );
}

/* ==========================================================
 * 数据存储与数据分析
 * ========================================================== */
function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
}
function saveRecord(r) {
  const list = loadRecords();
  list.push(r);
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

function renderAnalysis() {
  const list = loadRecords();
  const kpis = $('kpi-row');
  if (!list.length) {
    kpis.innerHTML = `<div class="empty-tip">还没有测试数据。做完一次测试后，结果会自动存到这台手机的浏览器里（localStorage）。<br/>也可以点下面的「载入示例数据」先看效果。</div>`;
    $('type-rank').innerHTML = '<div class="empty-tip">暂无数据</div>';
    $('dim-stat').innerHTML = '<div class="empty-tip">暂无数据</div>';
    return;
  }

  const counts = {};
  TYPE_ORDER.forEach((t) => (counts[t] = 0));
  list.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++; });
  const total = list.length;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

  const avgPct = (pole) => {
    const sum = list.reduce((s, r) => s + (r.pct && r.pct[pole] !== undefined ? r.pct[pole] : 0), 0);
    return Math.round(sum / list.length * 10) / 10;
  };

  kpis.innerHTML = `
    <div class="kpi"><div class="kpi-num">${total}</div><div class="kpi-label">累计测试人次</div></div>
    <div class="kpi"><div class="kpi-num" style="color:${familyColor(top)}">${top}</div><div class="kpi-label">最常见的类型</div></div>
    <div class="kpi"><div class="kpi-num">${Math.round(avgPct('E'))}% <span style="font-size:16px;color:var(--muted)">E</span></div><div class="kpi-label">平均外倾倾向</div></div>
    <div class="kpi"><div class="kpi-num">${Math.round(avgPct('J'))}% <span style="font-size:16px;color:var(--muted)">J</span></div><div class="kpi-label">平均计划倾向</div></div>
  `;

  const max = Math.max(...Object.values(counts), 1);
  $('type-rank').innerHTML = Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .map((t) => `
      <div class="rank-row">
        <div class="rank-name"><b>${t}</b> ${TYPES[t].name}</div>
        <div class="rank-bar"><i style="width:${counts[t] / max * 100}%;background:${familyColor(t)}"></i></div>
        <div class="rank-val">${counts[t]}</div>
      </div>`).join('');

  $('dim-stat').innerHTML = DIMENSIONS.map((d) => {
    const p1 = d.key[0], p2 = d.key[1];
    const v1 = avgPct(p1), v2 = avgPct(p2);
    return `
      <div class="dim-row">
        <div class="rank-row">
          <div class="rank-name"><b>${p1} ${d.poles[p1].name}</b></div>
          <div class="rank-bar"><i style="width:${v1}%;background:${d.color}"></i></div>
          <div class="rank-val">${v1}%</div>
        </div>
        <div class="rank-row">
          <div class="rank-name"><b>${p2} ${d.poles[p2].name}</b></div>
          <div class="rank-bar"><i style="width:${v2}%;background:${d.color};opacity:.45"></i></div>
          <div class="rank-val">${v2}%</div>
        </div>
      </div>`;
  }).join('');
}

/* ---------- 示例数据 ---------- */
function loadDemoData() {
  if (!confirm('将写入 160 条随机示例数据用于演示，确定吗？')) return;
  const weights = { INFP: 12, INFJ: 8, ENFP: 11, INTP: 10, INTJ: 7, ENTP: 7, ISFJ: 7, ISFP: 7,
    ISTP: 5, ISTJ: 5, ENFJ: 5, ESTP: 4, ESFP: 5, ESFJ: 4, ESTJ: 4, ENTJ: 4 };
  const pool = [];
  Object.keys(weights).forEach((t) => { for (let i = 0; i < weights[t]; i++) pool.push(t); });
  const list = loadRecords();
  for (let i = 0; i < 160; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    const pct = {};
    for (let k = 0; k < 4; k++) {
      const d = DIMENSIONS[k];
      const win = type[k];
      const wv = 55 + Math.floor(Math.random() * 35);
      pct[win] = wv;
      pct[otherPole(win)] = 100 - wv;
    }
    list.push({ ts: new Date(Date.now() - Math.random() * 6e8).toISOString(), type, pct, demo: true });
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
  renderAnalysis();
}

function exportCSV() {
  const list = loadRecords();
  if (!list.length) { alert('当前没有可导出的数据'); return; }
  const head = ['时间', '类型', 'E%', 'I%', 'S%', 'N%', 'T%', 'F%', 'J%', 'P%'];
  const rows = list.map((r) => [r.ts, r.type, r.pct.E, r.pct.I, r.pct.S, r.pct.N, r.pct.T, r.pct.F, r.pct.J, r.pct.P].join(','));
  const csv = '\uFEFF' + [head.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mbti-records.csv';
  a.click();
}

function clearData() {
  if (!confirm('确定清空本机保存的全部测试数据？')) return;
  localStorage.removeItem(STORE_KEY);
  renderAnalysis();
}

/* ---------- 初始化 ---------- */
renderHome();

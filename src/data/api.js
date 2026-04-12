// Using relative path to utilize Vite proxy or final production host
// In production, set VITE_API_URL to the deployed backend URL (e.g. https://we-suki-api.onrender.com)
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';


/* ── Submit evaluation ──────────────────────────────────── */
export async function submitEvaluation(cocktailId, cocktailName, scores) {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cocktailId, cocktailName, scores }),
  });
  if (!res.ok) throw new Error('서버 오류');
  return res.json();
}

/* ── Cocktail API ───────────────────────────────────────── */
export async function fetchCocktails() {
  const res = await fetch(`${API_BASE}/cocktails`);
  if (!res.ok) throw new Error('서버에 연결할 수 없습니다.');
  const data = await res.json();
  return data.cocktails; // null if not set
}

export async function saveCocktails(cocktails) {
  const res = await fetch(`${API_BASE}/cocktails`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cocktails }),
  });
  if (!res.ok) throw new Error('저장 실패');
  return res.json();
}

/* ── Metrics API ───────────────────────────────────────── */
export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('서버 오류');
  const data = await res.json();
  return data.metrics; // returns null if not set
}

export async function saveMetrics(metrics) {
  const res = await fetch(`${API_BASE}/metrics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics }),
  });
  if (!res.ok) throw new Error('저장 실패');
  return res.json();
}

/* ── Fetch all submissions ──────────────────────────────── */
export async function fetchSubmissions() {
  const res = await fetch(`${API_BASE}/submissions`);
  if (!res.ok) throw new Error('데이터를 불러올 수 없습니다.');
  return res.json();
}

/* ── Delete one submission ──────────────────────────────── */
export async function removeSubmission(id) {
  await fetch(`${API_BASE}/submissions/${id}`, { method: 'DELETE' });
}

/* ── Clear all submissions ──────────────────────────────── */
export async function clearSubmissions() {
  await fetch(`${API_BASE}/submissions`, { method: 'DELETE' });
}

/* ── Average scores helper ──────────────────────────────── */
export function calcAvgScores(submissions, metrics) {
  if (!submissions.length) return null;
  const totals = {};
  metrics.forEach(m => { totals[m.id] = 0; });
  submissions.forEach(s => {
    metrics.forEach(m => { totals[m.id] += Number(s.scores?.[m.id] ?? 0); });
  });
  const avgs = {};
  metrics.forEach(m => { avgs[m.id] = (totals[m.id] / submissions.length).toFixed(1); });
  const overall = (
    Object.values(avgs).reduce((a, b) => a + Number(b), 0) / metrics.length
  ).toFixed(1);
  return { avgs, overall };
}

/* ── CSV Export ─────────────────────────────────────────── */
export async function downloadCSV(metrics) {
  let submissions, cocktails;
  try {
    [submissions, cocktails] = await Promise.all([fetchSubmissions(), fetchCocktails()]);
  } catch { alert('서버에 연결할 수 없습니다.'); return; }
  if (!cocktails || !cocktails.length) { alert('칵테일 데이터가 없습니다.'); return; }

  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  // Group submissions by cocktailId
  const grouped = {};
  submissions.forEach(s => {
    if (!grouped[s.cocktailId]) grouped[s.cocktailId] = [];
    grouped[s.cocktailId].push(s);
  });

  const headers = ['칵테일명', '응답수', ...metrics.map(m => m.label), '전체평균'];

  const rows = cocktails.map(c => {
    const entries = grouped[c.id] || [];
    if (!entries.length) {
      return [c.name, '0', ...metrics.map(() => '0'), '0'];
    }
    const n = entries.length;
    const metricAvgs = metrics.map(m => {
      const sum = entries.reduce((acc, s) => acc + Number(s.scores?.[m.id] ?? 0), 0);
      return (sum / n).toFixed(1);
    });
    const overall = (metricAvgs.reduce((a, b) => a + Number(b), 0) / metricAvgs.length).toFixed(1);
    return [c.name, String(n), ...metricAvgs, overall];
  });

  const csv = '\uFEFF' + [headers, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `we_suki_summary_${formatDate(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── JSON Export ─────────────────────────────────────────── */
export async function downloadJSON(metrics) {
  let submissions, cocktails;
  try {
    [submissions, cocktails] = await Promise.all([fetchSubmissions(), fetchCocktails()]);
  } catch { alert('서버에 연결할 수 없습니다.'); return; }
  if (!cocktails || !cocktails.length) { alert('칵테일 데이터가 없습니다.'); return; }

  // Group submissions by cocktailId
  const grouped = {};
  submissions.forEach(s => {
    if (!grouped[s.cocktailId]) grouped[s.cocktailId] = [];
    grouped[s.cocktailId].push(s);
  });

  const pretty = cocktails.map(c => {
    const entries = grouped[c.id] || [];
    if (!entries.length) {
      return {
        칵테일명: c.name,
        응답수: 0,
        평가점수: Object.fromEntries(metrics.map(m => [m.label, '0'])),
        전체평균: '0',
      };
    }
    const n = entries.length;
    const metricAvgs = Object.fromEntries(
      metrics.map(m => {
        const sum = entries.reduce((acc, s) => acc + Number(s.scores?.[m.id] ?? 0), 0);
        return [m.label, (sum / n).toFixed(1)];
      })
    );
    const overall = (
      Object.values(metricAvgs).reduce((a, b) => a + Number(b), 0) / metrics.length
    ).toFixed(1);
    return { 칵테일명: c.name, 응답수: n, 평가점수: metricAvgs, 전체평균: overall };
  });

  const blob = new Blob([JSON.stringify(pretty, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `we_suki_summary_${formatDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(d) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
}

import { evaluationMetrics } from './mock';

const STORAGE_KEY = 'we_suki_submissions';
const COCKTAIL_KEY = 'we_suki_cocktails';

// ── Submissions ──────────────────────────────────────────────

export function getSubmissions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function addSubmission(cocktailId, cocktailName, scores) {
  const submissions = getSubmissions();
  const entry = {
    id: Date.now(),
    cocktailId,
    cocktailName,
    scores,
    submittedAt: new Date().toISOString(),
  };
  submissions.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  return entry;
}

export function getSubmissionsForCocktail(cocktailId) {
  return getSubmissions().filter(s => s.cocktailId === cocktailId);
}

export function deleteSubmission(id) {
  const updated = getSubmissions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearAllSubmissions() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Cocktail DB (with localStorage override for added items) ──

export function getCustomCocktails() {
  try {
    const data = localStorage.getItem(COCKTAIL_KEY);
    return data ? JSON.parse(data) : null; // null = use mock
  } catch { return null; }
}

export function saveCustomCocktails(cocktails) {
  localStorage.setItem(COCKTAIL_KEY, JSON.stringify(cocktails));
}

// ── CSV Export ──────────────────────────────────────────────

export function downloadCSV() {
  const submissions = getSubmissions();
  if (submissions.length === 0) { alert('아직 수집된 데이터가 없습니다.'); return; }

  const headers = ['ID', '칵테일명', '제출일시', ...evaluationMetrics.map(m => m.label)];
  const rows = submissions.map(s => [
    s.id, s.cocktailName,
    new Date(s.submittedAt).toLocaleString('ko-KR'),
    ...evaluationMetrics.map(m => s.scores[m.id] ?? ''),
  ]);

  const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `we_suki_results_${Date.now()}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function downloadJSON() {
  const submissions = getSubmissions();
  if (submissions.length === 0) { alert('아직 수집된 데이터가 없습니다.'); return; }
  const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `we_suki_results_${Date.now()}.json`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Score avg helper ──────────────────────────────────────────

export function calcAvgScores(submissions) {
  if (!submissions.length) return null;
  const totals = {};
  evaluationMetrics.forEach(m => { totals[m.id] = 0; });
  submissions.forEach(s => evaluationMetrics.forEach(m => { totals[m.id] += s.scores[m.id] ?? 0; }));
  const avgs = {};
  evaluationMetrics.forEach(m => { avgs[m.id] = (totals[m.id] / submissions.length).toFixed(1); });
  const overall = (Object.values(avgs).reduce((a, b) => a + Number(b), 0) / evaluationMetrics.length).toFixed(1);
  return { avgs, overall };
}

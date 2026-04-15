import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  fetchSubmissions, removeSubmission, clearSubmissions,
  downloadCSV, downloadJSON, calcAvgScores,
} from '../../data/api';

const BRAND = '#A50034';
const SIDEBAR_BG = '#1A0008';
const CARD_B = '1px solid #EEEBE6';
const CARD_S = '0 2px 12px rgba(0,0,0,0.06)';

const btnStyle = (override = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 18px', borderRadius: 12,
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
  border: 'none', transition: 'opacity 0.15s',
  ...override,
});

/* ── Shared hook: fetch submissions from server ── */
function useSubmissions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await fetchSubmissions()); }
    catch { setError('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해주세요.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

/* ── Shared hook: fetch metrics from server ── */
function useMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const load = useCallback(() => {
    setLoading(true); setError('');
    import('../../data/api').then(({ fetchMetrics }) => {
      fetchMetrics().then(data => {
        if (!data) {
          setError('평가 문항 데이터를 불러올 수 없습니다.');
        } else {
          setMetrics(data);
        }
        setLoading(false);
      }).catch(() => {
        setError('서버에 연결할 수 없습니다.');
        setLoading(false);
      });
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  
  return { metrics, setMetrics, loading, error };
}

/* ── Page Header ─────────────────────────────────────────── */
function PageHeader({ tag, title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: BRAND, marginBottom: 6 }}>{tag}</p>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.03em', margin: 0 }}>{title}</h2>
        {sub && <p style={{ fontSize: 14, color: '#888', marginTop: 6, fontWeight: 500 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Error / Loading States ──────────────────────────────── */
function StatusBlock({ loading, error }) {
  if (loading) return (
    <div style={{ padding: '60px 24px', textAlign: 'center', color: '#AAA', fontSize: 15 }}>
      데이터를 불러오는 중...
    </div>
  );
  if (error) return (
    <div style={{ background: '#FFF5F5', border: '1px solid #FFCCCC', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
      <p style={{ fontWeight: 700, color: '#C00', margin: 0 }}>⚠ {error}</p>
      <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
        터미널에서 <code style={{ background: '#F5E8E8', padding: '2px 6px', borderRadius: 4 }}>npm run dev:server</code> 가 실행 중인지 확인해주세요.
      </p>
    </div>
  );
  return null;
}

/* ════════════════════════════════════════════════════════════
   COCKTAIL DB
════════════════════════════════════════════════════════════ */
function CocktailDB() {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;

  // Load from server
  useEffect(() => {
    import('../../data/api').then(({ fetchCocktails }) => {
      fetchCocktails().then(data => {
        if (!data) {
          setError('칵테일 목록을 불러올 수 없습니다.');
        } else {
          setCocktails(data);
        }
        setLoading(false);
      }).catch(() => {
        setError('서버에 연결할 수 없습니다.');
        setLoading(false);
      });
    });
  }, []);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editRecipeGlass, setEditRecipeGlass] = useState('');
  const [editRecipeGarnish, setEditRecipeGarnish] = useState('');
  const [editRecipeMethod, setEditRecipeMethod] = useState('');
  const [editRecipeMethodCat, setEditRecipeMethodCat] = useState('');
  const [editRecipeIngredients, setEditRecipeIngredients] = useState('');

  // Persist whenever cocktail list changes
  const persistSync = async (nextList) => {
    setCocktails(nextList);
    try {
      const { saveCocktails } = await import('../../data/api');
      await saveCocktails(nextList);
    } catch {
      alert('저장 실패. 서버가 꺼져 있을 수 있습니다.');
    }
  };

// Image upload removed, reverting to direct URL input

  const handleAdd = () => {
    if (!newName.trim()) return;
    persistSync([...cocktails, {
      id: Date.now(),
      name: newName.trim(),
      photo: newPhoto || 'https://images.unsplash.com/photo-1609345265499-2133bbeb6ce5?w=400&q=80',
    }]);
    setNewName(''); setNewPhoto(''); setShowAdd(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('이 칵테일을 삭제하시겠습니까?')) return;
    persistSync(cocktails.filter(c => c.id !== id));
  };

  const handleEditInit = (c) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditPhoto(c.photo || '');
    const r = c.recipe || {};
    setEditRecipeGlass(r.glass || '');
    setEditRecipeGarnish(r.garnish || '');
    setEditRecipeMethod(r.method || '');
    setEditRecipeMethodCat(r.method_category || '');
    // Serialize ingredients as simple text: "name, ml" per line
    setEditRecipeIngredients(
      Array.isArray(r.ingredients)
        ? r.ingredients.map(ing => `${ing.name}, ${ing.ml}`).join('\n')
        : ''
    );
  };

  const handleEditSave = (id) => {
    if (!editName.trim()) return;
    // Parse ingredients text back to array
    const ingredients = editRecipeIngredients
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const lastComma = line.lastIndexOf(',');
        if (lastComma === -1) return { name: line, ml: 0 };
        const name = line.slice(0, lastComma).trim();
        const ml = parseFloat(line.slice(lastComma + 1).trim()) || 0;
        return { name, ml };
      });
    const recipe = {
      glass: editRecipeGlass,
      garnish: editRecipeGarnish,
      method: editRecipeMethod,
      method_category: editRecipeMethodCat,
      ingredients,
    };
    persistSync(cocktails.map(c =>
      c.id === id ? { ...c, name: editName, photo: editPhoto, recipe } : c
    ));
    setEditId(null);
  };

  const filteredCocktails = search
    ? cocktails.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : cocktails;

  const totalPages = Math.ceil(filteredCocktails.length / PAGE_SIZE);
  const paginatedCocktails = filteredCocktails.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (loading || error) return <StatusBlock loading={loading} error={error} />;

  return (
    <div>
      <PageHeader
        tag="데이터베이스"
        title="칵테일 목록"
        sub="시스템에 등록된 칵테일을 관리합니다."
        action={
          <button style={btnStyle({ background: '#1A1A1A', color: 'white', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' })} onClick={() => setShowAdd(true)}>
            + 새 칵테일 추가
          </button>
        }
      />

      {showAdd && (
        <div style={{ background: 'white', borderRadius: 16, border: CARD_B, boxShadow: CARD_S, padding: 24, marginBottom: 20 }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>새 칵테일 추가</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="칵테일 이름 *" style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E1DA', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit' }} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              {newPhoto && (
                <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: '#FDFCFB', border: CARD_B, overflow: 'hidden' }}>
                  <img src={newPhoto} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} onLoad={e => { e.target.style.display = 'block'; }} />
                </div>
              )}
              <input value={newPhoto} onChange={e => setNewPhoto(e.target.value)} placeholder="이미지 URL (선택사항)" style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E1DA', fontSize: 15, fontWeight: 500, outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
               <button style={btnStyle({ background: BRAND, color: 'white' })} onClick={handleAdd}>추가하기</button>
               <button style={btnStyle({ background: 'white', border: '1.5px solid #E5E1DA', color: '#555' })} onClick={() => setShowAdd(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="칵테일 이름 검색 (수정/삭제용)..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '14px 20px', borderRadius: 14, border: '1.5px solid #E5E1DA', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: CARD_B, boxShadow: CARD_S, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr 110px', gap: 16, padding: '12px 24px', background: '#FDFCFB', borderBottom: '1px solid #F0EDE8', fontSize: 11, fontWeight: 800, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.08em', alignItems: 'center' }}>
          <span>#</span><span>사진</span><span>이름</span><span style={{ textAlign: 'right' }}>관리</span>
        </div>

        {paginatedCocktails.map((c, i) => {
          const globalIndex = (currentPage - 1) * PAGE_SIZE + i;
          return (
            <React.Fragment key={c.id}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr 110px', gap: 16, padding: '14px 24px', borderBottom: i < paginatedCocktails.length - 1 ? '1px solid #F5F2EE' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#C8C4BC' }}>{globalIndex + 1}</span>
              
              <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: '#FDFCFB', border: CARD_B, overflow: 'hidden' }}>
                {editId === c.id ? (
                  <img src={editPhoto} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} onLoad={e => { e.target.style.display = 'block'; }} />
                ) : (
                  <img src={c.photo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} onLoad={e => { e.target.style.display = 'block'; }} />
                )}
              </div>

              {editId === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus placeholder="이름" style={{ fontSize: 15, fontWeight: 700, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${BRAND}`, outline: 'none', fontFamily: 'inherit' }} />
                   <input value={editPhoto} onChange={e => setEditPhoto(e.target.value)} placeholder="이미지 URL" style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E1DA', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ) : (
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{c.name}</span>
              )}
              
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {editId === c.id ? (
                  <>
                    <button style={btnStyle({ background: BRAND, color: 'white', padding: '7px 14px', fontSize: 13 })} onClick={() => handleEditSave(c.id)}>저장</button>
                    <button style={btnStyle({ background: 'white', border: '1.5px solid #E5E1DA', color: '#555', padding: '7px 14px', fontSize: 13 })} onClick={() => setEditId(null)}>취소</button>
                  </>
                ) : (
                  <>
                    <button title="수정" onClick={() => handleEditInit(c)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E1DA', background: 'white', cursor: 'pointer', fontSize: 14 }}>✏️</button>
                    <button title="삭제" onClick={() => handleDelete(c.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E1DA', background: 'white', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                  </>
                )}
              </div>
            </div>

            {/* Recipe edit panel — shown below the row when editing */}
            {editId === c.id && (
              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#AAA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>레시피 수정</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={editRecipeMethodCat} onChange={e => setEditRecipeMethodCat(e.target.value)} placeholder="조주법 (Shake, Stir, Build...)" style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E1DA', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <input value={editRecipeGlass} onChange={e => setEditRecipeGlass(e.target.value)} placeholder="글라스" style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E1DA', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <textarea value={editRecipeIngredients} onChange={e => setEditRecipeIngredients(e.target.value)} placeholder={"재료 (한 줄에 하나씩, 형식: 재료명, 양(ml))\n예)\nGin, 45\nLemon juice, 22.5"} rows={5} style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E1DA', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
                <textarea value={editRecipeMethod} onChange={e => setEditRecipeMethod(e.target.value)} placeholder="조주 방법 설명" rows={3} style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E1DA', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
                <textarea value={editRecipeGarnish} onChange={e => setEditRecipeGarnish(e.target.value)} placeholder="가니쉬" rows={2} style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E1DA', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, padding: '0 20px' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E1DA', background: 'white', fontSize: 12, fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            처음
          </button>
          
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding window of 5 pages around current
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: pageNum === currentPage ? `2px solid ${BRAND}` : '1px solid #E5E1DA',
                    background: pageNum === currentPage ? BRAND : 'white',
                    color: pageNum === currentPage ? 'white' : '#555',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E1DA', background: 'white', fontSize: 12, fontWeight: 700, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            끝
          </button>
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#AAA', fontWeight: 600 }}>
        전체 {filteredCocktails.length}개 중 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredCocktails.length)} 표시
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SURVEY METRICS
════════════════════════════════════════════════════════════ */
function SurveyMetrics() {
  const { metrics, setMetrics, loading, error } = useMetrics();
  
  const handleSave = async () => {
    try {
      const { saveMetrics } = await import('../../data/api');
      await saveMetrics(metrics);
      alert('저장되었습니다! 이제 모든 사용자 화면에 이 문항 정보가 실시간으로 반영됩니다.');
    } catch {
      alert('저장 실패. 서버가 꺼져 있을 수 있습니다.');
    }
  };

  if (loading || error) return <StatusBlock loading={loading} error={error} />;

  return (
    <div>
      <PageHeader
        tag="설정"
        title="평가 문항 관리"
        sub="새로 저장하면 모든 클라이언트 사용자에게 동기화됩니다."
        action={
          <button onClick={handleSave} style={btnStyle({ background: BRAND, color: 'white', boxShadow: '0 4px 14px rgba(165,0,52,0.22)' })}>
            서버에 변경사항 저장
          </button>
        }
      />

      <div style={{ background: 'white', borderRadius: 20, border: CARD_B, boxShadow: CARD_S, overflow: 'hidden' }}>
        {metrics.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: i < metrics.length - 1 ? '1px solid #F5F2EE' : 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#C8C4BC', width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
            <input
              value={m.label}
              onChange={e => setMetrics(ms => ms.map(x => x.id === m.id ? { ...x, label: e.target.value } : x))}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 700, color: '#1A1A1A', background: 'transparent', borderBottom: '2px solid transparent', paddingBottom: 2, fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = BRAND}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
            <button onClick={() => setMetrics(ms => ms.filter(x => x.id !== m.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CCC', fontSize: 16, padding: '4px 6px' }}>✕</button>
          </div>
        ))}
        <button onClick={() => setMetrics(ms => [...ms, { id: `c_${Date.now()}`, label: '새 평가 항목' }])} style={{ width: '100%', padding: 16, border: 'none', borderTop: '2px dashed #EDE9E3', background: '#FDFCFB', fontSize: 14, fontWeight: 700, color: '#AAA', cursor: 'pointer', fontFamily: 'inherit' }}>
          + 새 문항 추가
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESULTS BY COCKTAIL (from server)
════════════════════════════════════════════════════════════ */
function ResultsByCocktail() {
  const { data: submissions, loading: subLoading, error, reload } = useSubmissions();
  const { metrics, loading: metLoading } = useMetrics();
  const loading = subLoading || metLoading;

  const [expanded, setExpanded] = useState(null);
  const [detailOpen, setDetailOpen] = useState(null);
  const [search, setSearch] = useState('');

  const handleDelete = async (id) => {
    if (!window.confirm('이 응답을 삭제하시겠습니까?')) return;
    await removeSubmission(id);
    reload();
  };

  const handleClearAll = async () => {
    if (!window.confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    await clearSubmissions();
    reload();
  };

  // Group by cocktailId
  const grouped = {};
  submissions.forEach(s => {
    if (!grouped[s.cocktailId]) grouped[s.cocktailId] = { name: s.cocktailName, entries: [] };
    grouped[s.cocktailId].entries.push(s);
  });

  const filteredGroups = Object.entries(grouped).filter(([cid, { name }]) => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        tag="칵테일별 결과"
        title="평가 결과"
        sub={loading ? '불러오는 중...' : `총 ${submissions.length}건의 응답이 수집되었습니다.`}
        action={submissions.length > 0 && (
          <button onClick={handleClearAll} style={btnStyle({ background: 'white', border: '1.5px solid #FFD6D6', color: '#E53E3E' })}>
            전체 초기화
          </button>
        )}
      />

      <StatusBlock loading={loading} error={error} />

      {!loading && !error && submissions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <input type="text" placeholder="칵테일 이름으로 결과 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '14px 20px', borderRadius: 14, border: '1.5px solid #E5E1DA', fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      )}

      {!loading && !error && submissions.length === 0 && (
        <div style={{ background: 'white', borderRadius: 20, border: CARD_B, padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📊</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#888' }}>아직 제출된 설문 데이터가 없습니다.</p>
          <p style={{ fontSize: 14, color: '#AAA', marginTop: 6 }}>설문 화면에서 칵테일을 평가하면 여기에 표시됩니다.</p>
          <Link to="/" style={{ display: 'inline-block', marginTop: 24, padding: '12px 28px', background: BRAND, color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>설문 시작하기</Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredGroups.map(([cid, { name, entries }]) => {
          const stats = calcAvgScores(entries, metrics);
          const isOpen = expanded === cid;

          return (
            <div key={cid} style={{ background: 'white', borderRadius: 20, border: CARD_B, boxShadow: CARD_S, overflow: 'hidden' }}>
              {/* Summary header */}
              <button onClick={() => setExpanded(isOpen ? null : cid)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Cocktail</p>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>{name}</h3>
                  <p style={{ fontSize: 13, color: '#888', marginTop: 4, fontWeight: 500 }}>응답 {entries.length}건</p>
                </div>
                {stats && (
                  <div style={{ textAlign: 'center', padding: '10px 20px', background: '#FFF0F4', borderRadius: 14 }}>
                    <p style={{ fontSize: 28, fontWeight: 900, color: BRAND, lineHeight: 1 }}>{stats.overall}</p>
                    <p style={{ fontSize: 10, color: '#CCA0AD', fontWeight: 700, marginTop: 2 }}>평균 / 10</p>
                  </div>
                )}
                <span style={{ fontSize: 18, color: '#CCC', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</span>
              </button>

              {/* Expanded detail */}
              {isOpen && stats && (
                <div style={{ borderTop: '1px solid #F5F2EE', padding: '20px 24px' }}>
                  {/* Per-metric averages */}
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#AAA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>항목별 평균 점수</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 28 }}>
                    {metrics.map(m => {
                      const v = Number(stats.avgs[m.id]);
                      const pct = (v / 10) * 100;
                      return (
                        <div key={m.id} style={{ background: '#FDFCFB', borderRadius: 12, border: '1px solid #F0EDE8', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{m.label}</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: BRAND }}>{stats.avgs[m.id]}</span>
                          </div>
                          <div style={{ height: 4, background: '#EDE9E3', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${BRAND}, #D4003F)`, borderRadius: 100, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Individual submissions */}
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#AAA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>개별 응답 ({entries.length}건)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...entries].sort((a, b) => b.id - a.id).map(s => {
                      const subAvg = (metrics.reduce((acc, m) => acc + Number(s.scores?.[m.id] ?? 0), 0) / metrics.length).toFixed(1);
                      return (
                        <div key={s.id} style={{ background: '#FDFCFB', borderRadius: 12, border: '1px solid #F0EDE8', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{new Date(s.submittedAt).toLocaleString('ko-KR', { hour12: false })}</p>
                              <p style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginTop: 2 }}>평균 {subAvg}점</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setDetailOpen(detailOpen === s.id ? null : s.id)} style={{ border: 'none', background: '#F0EDE8', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#666', padding: '6px 12px', borderRadius: 8 }}>
                                {detailOpen === s.id ? '닫기' : '상세 보기'}
                              </button>
                              <button onClick={() => handleDelete(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CCC', fontSize: 16 }}>🗑️</button>
                            </div>
                          </div>
                          {detailOpen === s.id && (
                            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                              {metrics.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
                                  <span>{m.label}</span>
                                  <strong style={{ color: '#1A1A1A' }}>{s.scores?.[m.id] ?? '-'}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESULTS EXPORT (from server)
════════════════════════════════════════════════════════════ */
function ResultsExport() {
  const { data: submissions, loading: subLoading, error } = useSubmissions();
  const { metrics, loading: metLoading } = useMetrics();
  const loading = subLoading || metLoading;

  const total = submissions.length;
  const thisWeek = submissions.filter(s => (new Date() - new Date(s.submittedAt)) / 86400000 < 7).length;
  const avgOverall = total
    ? (submissions.reduce((acc, s) => {
        return acc + metrics.reduce((a, m) => a + Number(s.scores?.[m.id] ?? 0), 0) / metrics.length;
      }, 0) / total).toFixed(1)
    : '—';

  return (
    <div>
      <PageHeader tag="리포트" title="결과 데이터" sub="수집된 응답 데이터를 확인하고 내보냅니다." />

      <StatusBlock loading={loading} error={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: '총 응답 수', val: loading ? '...' : total, unit: '건' },
          { label: '이번 주 응답', val: loading ? '...' : thisWeek, unit: '건' },
          { label: '전체 평균', val: loading ? '...' : avgOverall, unit: '/ 10' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 20, border: CARD_B, boxShadow: CARD_S, padding: '20px 24px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#AAA', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {s.val}<span style={{ fontSize: 13, color: '#AAA', fontWeight: 600, marginLeft: 4 }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: CARD_B, boxShadow: CARD_S, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', marginBottom: 6 }}>전체 데이터 다운로드</p>
          <p style={{ fontSize: 14, color: '#888' }}>모든 설문 응답 데이터를 파일로 추출합니다.</p>
          <p style={{ fontSize: 12, color: '#AAA', marginTop: 4 }}>
            CSV: Excel에서 열기 좋은 형식 &nbsp;·&nbsp; JSON: 개발자/시스템 연동용
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={btnStyle({ background: 'white', border: '1.5px solid #E5E1DA', color: '#1A1A1A' })} onClick={() => downloadJSON(metrics)}>
            ↓ JSON 다운로드
          </button>
          <button style={btnStyle({ background: BRAND, color: 'white', boxShadow: '0 4px 14px rgba(165,0,52,0.22)' })} onClick={() => downloadCSV(metrics)}>
            ↓ CSV 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ADMIN SHELL
════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuth') === 'true');
  const [pwdAuth, setPwdAuth] = useState('');

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location]);

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F4F0', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'white', padding: '40px 32px', borderRadius: 24, border: CARD_B, boxShadow: CARD_S, textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: BRAND, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Admin Console</p>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#1A1A1A', marginBottom: 16, letterSpacing: '-0.03em', margin: 0 }}><span style={{ color: '#FF4D7C' }}>we:</span>好き</h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 32, fontWeight: 500 }}>관리자 메뉴 접근 권한이 필요합니다.</p>
          
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={pwdAuth} 
            onChange={e => setPwdAuth(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (pwdAuth === '5633') { sessionStorage.setItem('adminAuth', 'true'); setIsAuthenticated(true); }
                else { alert('비밀번호가 일치하지 않습니다.'); setPwdAuth(''); }
              }
            }}
            style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: '2px solid #E5E1DA', fontSize: 18, outline: 'none', marginBottom: 12, boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'inherit', fontWeight: 700 }} 
            onFocus={e => e.target.style.borderColor = BRAND}
            onBlur={e => e.target.style.borderColor = '#E5E1DA'}
            autoFocus 
          />
          <button 
            onClick={() => {
              if (pwdAuth === '5633') { sessionStorage.setItem('adminAuth', 'true'); setIsAuthenticated(true); }
              else { alert('비밀번호가 일치하지 않습니다.'); setPwdAuth(''); }
            }}
            style={{ width: '100%', padding: '16px', borderRadius: 12, background: BRAND, color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(165,0,52,0.22)' }}
          >
            안전하게 접속하기
          </button>
          
          <div style={{ marginTop: 24 }}>
             <Link to="/" style={{ fontSize: 14, color: '#AAA', textDecoration: 'none', fontWeight: 700 }}>← 메인 화면으로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: '칵테일 DB', emoji: '🍹', exact: true },
    { path: '/admin/metrics', label: '평가 문항 관리', emoji: '📋' },
    { path: '/admin/results', label: '칵테일별 결과', emoji: '📊' },
    { path: '/admin/export', label: '전체 데이터 추출', emoji: '⬇️' },
  ];

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Admin Console</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', margin: 0 }}>
          <span style={{ color: '#FF4D7C' }}>we:</span>好き
        </h1>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 12px', marginBottom: 4 }}>메뉴</p>
        {navItems.map(({ path, label, emoji, exact }) => {
          const active = exact ? location.pathname === path : location.pathname.startsWith(path);
          return (
            <Link key={path} to={path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, marginBottom: 4, textDecoration: 'none', fontWeight: 700, fontSize: 14, background: active ? BRAND : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.45)' }}>
              <span style={{ fontSize: 16 }}>{emoji}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
          ← 설문 화면으로
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F4F0', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: 240, flexShrink: 0, backgroundColor: SIDEBAR_BG, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 56, backgroundColor: SIDEBAR_BG, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}><span style={{ color: '#FF4D7C' }}>we:</span>好き</span>
          <button onClick={() => setDrawerOpen(!drawerOpen)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 22, padding: 4 }}>
            {drawerOpen ? '✕' : '☰'}
          </button>
        </div>
      )}

      {/* Mobile overlay drawer */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, backgroundColor: SIDEBAR_BG, zIndex: 50 }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 32px', paddingTop: isMobile ? 80 : 48, overflowX: 'hidden' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<CocktailDB />} />
            <Route path="/metrics" element={<SurveyMetrics />} />
            <Route path="/results" element={<ResultsByCocktail />} />
            <Route path="/export" element={<ResultsExport />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

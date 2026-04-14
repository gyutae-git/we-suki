import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 60;
const LOAD_MORE = 40;

/* Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const S = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F7F4F0',
    fontFamily: 'Pretendard, -apple-system, sans-serif',
  },
  header: {
    backgroundColor: '#F7F4F0',
    padding: '52px 24px 0',
    maxWidth: 1000,
    margin: '0 auto',
  },
  logo: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#A50034',
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: '#1A1A1A',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    fontWeight: 500,
    marginBottom: 32,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 8,
    maxWidth: 480,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9E9E9E',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 46px',
    background: 'white',
    border: '1.5px solid #E5E1DA',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 500,
    color: '#1A1A1A',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  main: {
    padding: '32px 24px 80px',
    maxWidth: 1000,
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    maxWidth: 1000,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A1A1A',
  },
  count: {
    fontSize: 13,
    fontWeight: 600,
    color: '#9E9E9E',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
  },
};

export default function SurveyHome() {
  const [search, setSearch] = useState('');
  const [focusSearch, setFocusSearch] = useState(false);
  const navigate = useNavigate();

  const [allCocktails, setAllCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    import('../../data/api').then(({ fetchCocktails }) => {
      fetchCocktails()
        .then(data => {
          if (!data) {
            setError(true);
          } else {
            setAllCocktails(shuffle(data));
          }
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    });
  }, []);

  const filtered = allCocktails.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const displayItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount(n => n + LOAD_MORE);
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!sentinelRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadMore, displayItems.length]);

  return (
    <div style={S.page}>
      <header style={S.header}>
        <p style={S.logo}>we:好き · Cocktail Survey</p>
        <h1 style={S.title}>마신 칵테일을<br/>평가해보세요</h1>
        <p style={S.subtitle}>맛을 기록하고, 경험을 공유하세요.</p>

        <div style={S.searchWrap}>
          <svg style={S.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="칵테일 이름을 검색하세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocusSearch(true)}
            onBlur={() => setFocusSearch(false)}
            style={{
              ...S.searchInput,
              borderColor: focusSearch ? '#A50034' : '#E5E1DA',
            }}
          />
        </div>
      </header>

      <main style={S.main}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>{search ? '검색 결과' : '오늘의 칵테일'}</span>
          <span style={S.count}>{filtered.length}종</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9E9E9E', fontSize: 15 }}>
            불러오는 중...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '100px 24px', background: '#FFF5F5', borderRadius: 24, border: '1px solid #FFCCCC' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#C00', marginBottom: 8 }}>서버에 연결할 수 없습니다</p>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.5 }}>
              데이터를 불러오는 데 실패했습니다.<br/>
              시스템 관리자에게 문의하거나 잠시 후 다시 시도해주세요.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{ marginTop: 24, padding: '12px 24px', background: '#A50034', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              새로고침
            </button>
          </div>
        ) : displayItems.length > 0 ? (
          <>
            <div style={S.grid}>
              {displayItems.map(c => (
                <CocktailCard key={c.id} cocktail={c} onClick={() => navigate(`/evaluate/${c.id}`)} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {hasMore && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#C8C4BC', fontSize: 13, fontWeight: 600 }}>
                스크롤하면 더 불러옵니다...
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9E9E9E', fontSize: 15 }}>
            검색 결과가 없습니다.
          </div>
        )}
      </main>
    </div>
  );
}

function CocktailCard({ cocktail, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        borderRadius: 20,
        overflow: 'hidden',
        background: 'white',
        boxShadow: hover
          ? '0 8px 32px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.25s ease, transform 0.2s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        border: '1px solid #EEEBE6',
      }}
    >
      <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: '#F0EDE8' }}>
        <img
          src={cocktail.photo}
          alt={cocktail.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s ease',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
          }}
        />
      </div>
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{cocktail.name}</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#A50034', marginTop: 4 }}>
          평가하기 →
        </p>
      </div>
    </div>
  );
}

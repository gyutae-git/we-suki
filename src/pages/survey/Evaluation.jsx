import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCocktails, evaluationMetrics } from '../../data/mock';
import { submitEvaluation } from '../../data/api';

/* ── Fully-Custom Slider ────────────────────────────────── */
function CustomSlider({ value, onChange }) {
  const pct = ((value - 1) / 4) * 100;
  const D = 26; // thumb diameter

  return (
    <div style={{ position: 'relative', height: D, userSelect: 'none' }}>
      {/* Track background */}
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 0, right: 0, height: 6, background: '#EDE9E3',
        borderRadius: 100, pointerEvents: 'none',
      }}>
        {/* Filled portion */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #A50034, #D4003F)',
          borderRadius: 100, transition: 'width 0.1s ease',
        }} />
      </div>

      {/* Thumb */}
      <div style={{
        position: 'absolute', top: '50%',
        left: `calc(${pct}% - ${D / 2}px)`,
        transform: `translateY(-50%)`,
        width: D, height: D,
        background: 'white', border: '3px solid #A50034', borderRadius: '50%',
        boxShadow: '0 2px 10px rgba(165,0,52,0.30)',
        transition: 'left 0.1s ease',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Invisible native range (handles all interaction + keyboard) */}
      <input
        type="range" min="1" max="5" step="1" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer', zIndex: 3, margin: 0,
        }}
      />
    </div>
  );
}

const LEVEL = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'];

function SliderRow({ index, label, value, onChange, isLast }) {
  return (
    <div style={{ padding: '20px 24px', borderBottom: isLast ? 'none' : '1px solid #F5F2EE' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#CCC', width: 18, textAlign: 'right' }}>{index}.</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 48 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#A50034', lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 10, color: '#AAA', fontWeight: 600, marginTop: 2 }}>{LEVEL[value]}</span>
        </div>
      </div>

      <CustomSlider value={value} onChange={onChange} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} style={{
            fontSize: 11, fontWeight: 700,
            color: n <= value ? '#A50034' : '#D5D1CB',
            transition: 'color 0.12s',
          }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function Evaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cocktails, setCocktails] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from server or fallback to mock
  useEffect(() => {
    import('../../data/api').then(async ({ fetchCocktails, fetchMetrics }) => {
      try {
        const cData = await fetchCocktails();
        const mData = await fetchMetrics();
        
        setCocktails(cData || mockCocktails);
        const resolvedMetrics = (mData && mData.length > 0) ? mData : evaluationMetrics;
        setMetrics(resolvedMetrics);
        setScores(resolvedMetrics.reduce((acc, m) => ({ ...acc, [m.id]: 3 }), {}));
      } catch {
        setCocktails(mockCocktails); // Fallback on server error
        setMetrics(evaluationMetrics);
        setScores(evaluationMetrics.reduce((acc, m) => ({ ...acc, [m.id]: 3 }), {}));
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading || !scores) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>데이터를 불러오는 중...</div>;
  }

  const cocktail = cocktails.find(c => c.id === parseInt(id));

  if (!cocktail) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#888' }}>칵테일 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: '#A50034', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>돌아가기</button>
      </div>
    );
  }

  const avg = (Object.values(scores).reduce((a, b) => a + b, 0) / metrics.length).toFixed(1);

  const doSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await submitEvaluation(cocktail.id, cocktail.name, scores);
      navigate('/success', { state: { cocktailName: cocktail.name, avg } });
    } catch (e) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
    }
  };

  const doMore = async () => {
    setSubmitting(true);
    setError('');
    try {
      await submitEvaluation(cocktail.id, cocktail.name, scores);
      navigate('/');
    } catch {
      setError('서버에 연결할 수 없습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4F0', fontFamily: 'Pretendard, -apple-system, sans-serif', paddingBottom: 120 }}>

      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'rgba(247,244,240,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E1DA', height: 56,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E5E1DA', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>칵테일 평가</span>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px 0' }}>

        {/* Cocktail Card */}
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #EEEBE6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: '#F0EDE8' }}>
            <img src={cocktail.photo} alt={cocktail.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#A50034', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>평가 중</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', margin: 0 }}>{cocktail.name}</h1>
          </div>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#FFF0F4', border: '2px solid #FFDDE6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#A50034', lineHeight: 1 }}>{avg}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#CCA0AD', marginTop: 2 }}>평균</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#C00', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        {/* Sliders */}
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #EEEBE6', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {metrics.map((metric, idx) => (
            <SliderRow
              key={metric.id}
              index={idx + 1}
              label={metric.label}
              value={scores[metric.id]}
              onChange={(v) => setScores(p => ({ ...p, [metric.id]: v }))}
              isLast={idx === metrics.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Fixed bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        backgroundColor: 'rgba(247,244,240,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid #E5E1DA', padding: '16px 20px',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', gap: 12 }}>
          <button
            onClick={doMore}
            disabled={submitting}
            style={{ flex: 1, padding: '15px 0', borderRadius: 14, border: '1.5px solid #E5E1DA', background: 'white', fontSize: 15, fontWeight: 700, color: '#555', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            추가 평가하기
          </button>
          <button
            onClick={doSubmit}
            disabled={submitting}
            style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: '#A50034', fontSize: 15, fontWeight: 700, color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 16px rgba(165,0,52,0.28)', transition: 'opacity 0.2s' }}
          >
            {submitting ? '제출 중...' : '평가 완료 제출'}
          </button>
        </div>
      </div>
    </div>
  );
}

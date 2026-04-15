import { useLocation, useNavigate } from 'react-router-dom';

export default function Success() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const cocktailName = state?.cocktailName ?? '칵테일';
  const avg = state?.avg ?? '—';

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4F0',
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 28,
        background: 'linear-gradient(135deg, #A50034, #D4003F)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        boxShadow: '0 8px 24px rgba(165,0,52,0.3)',
        fontSize: 36,
      }}>
        🥂
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 8 }}>
        평가 완료!
      </h1>
      <p style={{ fontSize: 16, color: '#888', fontWeight: 500, textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
        <strong style={{ color: '#1A1A1A' }}>{cocktailName}</strong>에 대한<br />
        소중한 평가를 제출해 주셨습니다.
      </p>

      {/* Score Display */}
      <div style={{
        background: 'white', borderRadius: 20, border: '1px solid #EEEBE6',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '24px 40px', textAlign: 'center', marginBottom: 36,
        minWidth: 200,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#AAA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>평균 점수</p>
        <p style={{ fontSize: 48, fontWeight: 900, color: '#A50034', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {avg}
          <span style={{ fontSize: 18, color: '#CCC', fontWeight: 600 }}>/10</span>
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: '#A50034', color: 'white',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(165,0,52,0.28)',
          }}
        >
          다른 칵테일 평가하기
        </button>
      </div>
    </div>
  );
}

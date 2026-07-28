import { useState, useEffect, useCallback } from 'react';
import { predict, checkHealth } from './api';
import type { PassengerData, PredictionResult } from './types';
import './App.css';

const defaultData: PassengerData = {
  Pclass: 3,
  Sex: 'male',
  Age: 22,
  SibSp: 1,
  Parch: 0,
  Fare: 7.25,
  Embarked: 'S',
  Name: 'Braund, Mr. Owen Harris',
};

type Tab = 'predict' | 'info';

function App() {
  const [formData, setFormData] = useState<PassengerData>(defaultData);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ online: boolean; model: string }>({ online: false, model: '' });
  const [activeTab, setActiveTab] = useState<Tab>('predict');
  const [selectedTitle, setSelectedTitle] = useState(() => {
    const m = defaultData.Name.match(/ ([A-Za-z]+)\./);
    return m ? m[1] : 'Mr';
  });

  useEffect(() => {
    checkHealth()
      .then((h) => setApiStatus({ online: true, model: h.model }))
      .catch(() => setApiStatus({ online: false, model: '' }));
  }, []);

  const handleChange = useCallback((field: keyof PassengerData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    setSelectedTitle(value);
    setFormData((prev) => ({ ...prev, Name: `Sample, ${value}. Passenger` }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predict(formData);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Prediction failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const survived = result?.prediction === 'Survived';
  const survivedProb = result ? Math.round(result.probability_survived * 1000) / 10 : 0;
  const notSurvivedProb = result ? Math.round(result.probability_not_survived * 1000) / 10 : 0;

  return (
    <div className="gradio-app">
      {/* Header */}
      <header className="gradio-header">
        <div className="gradio-header-inner">
          <div>
            <h1 className="gradio-title">🚢 Titanic 倖存率預測平台</h1>
            <p className="gradio-subtitle">
              本系統使用 <strong>SVM</strong> 機器學習模型，預測鐵達尼號乘客的倖存機率。
              <span className="status-badge" data-online={apiStatus.online}>
                {apiStatus.online ? `🟢 Online · ${apiStatus.model}` : '🔴 Offline'}
              </span>
            </p>
          </div>
        </div>
      </header>

      <main className="gradio-main">
        {/* Tabs */}
        <div className="gradio-tabs">
          <button
            className={`gradio-tab ${activeTab === 'predict' ? 'active' : ''}`}
            onClick={() => setActiveTab('predict')}
          >
            🔮 即時模型預測
          </button>
          <button
            className={`gradio-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 模型資訊
          </button>
        </div>

        {activeTab === 'predict' && (
          <div className="gradio-content-grid">
            {/* Left: Input Form */}
            <div className="gradio-card">
              <h3 className="gradio-section-title">### 1. 輸入乘客特徵</h3>

              <div className="gradio-field">
                <label className="gradio-label">Title (稱謂)</label>
                <p className="gradio-hint">選擇乘客稱謂 (Mr, Miss, Mrs, Master...)</p>
                <select
                  value={selectedTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="gradio-input"
                >
                  <option value="Mr">Mr (先生)</option>
                  <option value="Miss">Miss (小姐)</option>
                  <option value="Mrs">Mrs (女士/太太)</option>
                  <option value="Master">Master (少年/兒童)</option>
                  <option value="Rare">Rare (稀有稱謂)</option>
                </select>
              </div>

              <div className="gradio-row-2">
                <div className="gradio-field">
                  <label className="gradio-label">Sex (性別)</label>
                  <select
                    value={formData.Sex}
                    onChange={(e) => handleChange('Sex', e.target.value)}
                    className="gradio-input"
                  >
                    <option value="male">Male (男性)</option>
                    <option value="female">Female (女性)</option>
                  </select>
                </div>
                <div className="gradio-field">
                  <label className="gradio-label">Embarked (登船港口)</label>
                  <select
                    value={formData.Embarked}
                    onChange={(e) => handleChange('Embarked', e.target.value)}
                    className="gradio-input"
                  >
                    <option value="S">S — Southampton (南安普頓)</option>
                    <option value="C">C — Cherbourg (瑟堡)</option>
                    <option value="Q">Q — Queenstown (皇后鎮)</option>
                  </select>
                </div>
              </div>

              <div className="gradio-row-2">
                <div className="gradio-field">
                  <label className="gradio-label">Ticket Class (艙等)</label>
                  <select
                    value={formData.Pclass}
                    onChange={(e) => handleChange('Pclass', Number(e.target.value))}
                    className="gradio-input"
                  >
                    <option value={1}>1st Class (頭等艙)</option>
                    <option value={2}>2nd Class (商務艙)</option>
                    <option value={3}>3rd Class (經濟艙)</option>
                  </select>
                </div>
                <div className="gradio-field">
                  <label className="gradio-label">Fare (票價 £)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.Fare}
                    onChange={(e) => handleChange('Fare', parseFloat(e.target.value) || 0)}
                    className="gradio-input"
                  />
                </div>
              </div>

              <div className="gradio-row-3">
                <div className="gradio-field">
                  <label className="gradio-label">Age (年齡)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    step={0.5}
                    value={formData.Age}
                    onChange={(e) => handleChange('Age', parseFloat(e.target.value) || 0)}
                    className="gradio-input"
                  />
                </div>
                <div className="gradio-field">
                  <label className="gradio-label">SibSp (兄弟姊妹/配偶)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.SibSp}
                    onChange={(e) => handleChange('SibSp', parseInt(e.target.value) || 0)}
                    className="gradio-input"
                  />
                </div>
                <div className="gradio-field">
                  <label className="gradio-label">Parch (父母/子女)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.Parch}
                    onChange={(e) => handleChange('Parch', parseInt(e.target.value) || 0)}
                    className="gradio-input"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="gradio-button primary"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> 預測中...
                  </span>
                ) : (
                  '🔮 開始預測'
                )}
              </button>
            </div>

            {/* Right: Results */}
            <div className="gradio-card">
              <h3 className="gradio-section-title">### 2. 預測結果與概率分析</h3>

              {error && (
                <div className="gradio-error">{error}</div>
              )}

              {!result && !error && (
                <div className="gradio-placeholder">
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚢</div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    請填寫乘客資料後點擊 <strong>開始預測</strong>
                  </p>
                </div>
              )}

              {result && (
                <>
                  {/* Prediction Card - Gradio style */}
                  <div
                    className="gradio-prediction-card"
                    data-survived={survived}
                  >
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      opacity: 0.85,
                      marginBottom: '4px',
                    }}>
                      預測分析結果
                    </div>
                    <h2 style={{
                      fontSize: '2rem',
                      margin: '6px 0',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                    }}>
                      {survived ? '✅ 倖存 (Survived)' : '❌ 遇難 (Not Survived)'}
                    </h2>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>
                      預測機率: <strong style={{ fontSize: '1.3rem' }}>
                        {survived ? `${survivedProb}%` : `${notSurvivedProb}%`}
                      </strong>
                    </span>
                  </div>

                  {/* Probability Bars - Gradio style */}
                  <div className="gradio-prob-bars">
                    <ProbBar label="倖存 (Survived)" pct={survivedProb} color="#137333" />
                    <ProbBar label="遇難 (Not Survived)" pct={notSurvivedProb} color="#c5221f" />
                  </div>

                  {/* Detail Grid */}
                  <div className="gradio-detail-grid">
                    <DetailItem label="艙等 (Class)" value={`${formData.Pclass} Class`} />
                    <DetailItem label="性別 (Sex)" value={formData.Sex === 'male' ? 'Male (男)' : 'Female (女)'} />
                    <DetailItem label="年齡 (Age)" value={`${formData.Age} yrs`} />
                    <DetailItem label="票價 (Fare)" value={`£${formData.Fare.toFixed(2)}`} />
                    <DetailItem label="港口 (Embarked)" value={formData.Embarked} />
                    <DetailItem label="家庭人數" value={String(formData.SibSp + formData.Parch + 1)} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="gradio-card">
            <h3 className="gradio-section-title">### 模型資訊</h3>
            <div className="gradio-info-grid">
              <InfoCard label="模型類型" value="SVM" color="#1a73e8" />
              <InfoCard label="特徵數量" value="15" color="#137333" />
              <InfoCard label="訓練資料" value="Titanic CSV" color="#ab47bc" />
              <InfoCard label="目標變數" value="Survived" color="#e37400" />
            </div>
            <div className="gradio-info-section">
              <h4>💡 特徵列表 (Feature Columns)</h4>
              <div className="gradio-feature-list">
                {['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Embarked', 'Title', 'FamilySize', 'IsAlone', 'AgeBand', 'IsChild', 'FareBand', 'FareLog', 'NameLength'].map((f) => (
                  <span key={f} className="gradio-feature-tag">{f}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="gradio-footer">
        <p>Titanic Survival Prediction — SVM Model · FastAPI Backend · React + TailwindCSS Frontend</p>
      </footer>
    </div>
  );
}

/* --- Sub-components --- */

function ProbBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between" style={{ marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>
        <span style={{ textTransform: 'capitalize' }}>{label}</span>
        <span>{pct}%</span>
      </div>
      <div style={{
        backgroundColor: '#f1f3f4',
        borderRadius: '8px',
        height: '12px',
        overflow: 'hidden',
        width: '100%',
      }}>
        <div style={{
          backgroundColor: color,
          width: `${pct}%`,
          height: '100%',
          borderRadius: '8px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #e0e0e0',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#5f6368', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#202124', marginTop: '4px' }}>
        {value}
      </div>
    </div>
  );
}

function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '18px 10px',
      borderRadius: '10px',
      textAlign: 'center',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    }}>
      <div style={{ fontSize: '0.8rem', color: '#5f6368', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, marginTop: '5px' }}>
        {value}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default App;

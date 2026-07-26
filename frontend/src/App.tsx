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

function App() {
  const [formData, setFormData] = useState<PassengerData>(defaultData);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ online: boolean; model: string }>({ online: false, model: '' });

  useEffect(() => {
    checkHealth()
      .then((h) => setApiStatus({ online: true, model: h.model }))
      .catch(() => setApiStatus({ online: false, model: '' }));
  }, []);

  const handleChange = useCallback((field: keyof PassengerData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  const survivedProb = result ? Math.round(result.probability_survived * 100) : 0;
  const notSurvivedProb = result ? Math.round(result.probability_not_survived * 100) : 0;

  return (
    <div className="relative min-h-screen text-white">
      {/* Background image */}
      <div className="fixed inset-0 z-0">
        <img src="/backpic.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/85 to-slate-900/90" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg font-bold">
              T
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Titanic Survival Prediction</h1>
              <p className="text-xs text-slate-400 hidden sm:block">SVM Machine Learning Model</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${apiStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-400">{apiStatus.online ? `Online · ${apiStatus.model}` : 'Offline'}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Left: Input Form */}
          <div className="space-y-5">
            <SectionTitle icon="🪪" title="Passenger Information" subtitle="請輸入乘客資訊" />

            {/* Name */}
            <InputField label="Full Name (姓名)" hint="Used to extract title (Mr, Miss, Mrs...)">
              <input
                type="text"
                value={formData.Name}
                onChange={(e) => handleChange('Name', e.target.value)}
                className="input-field"
                placeholder="e.g. Braund, Mr. Owen Harris"
              />
            </InputField>

            <div className="grid grid-cols-2 gap-4">
              {/* Sex */}
              <InputField label="Sex (性別)">
                <select
                  value={formData.Sex}
                  onChange={(e) => handleChange('Sex', e.target.value)}
                  className="input-field"
                >
                  <option value="male">Male (男性)</option>
                  <option value="female">Female (女性)</option>
                </select>
              </InputField>

              {/* Embarked */}
              <InputField label="Embarked (登船港口)">
                <select
                  value={formData.Embarked}
                  onChange={(e) => handleChange('Embarked', e.target.value)}
                  className="input-field"
                >
                  <option value="S">S — Southampton (南安普頓)</option>
                  <option value="C">C — Cherbourg (瑟堡)</option>
                  <option value="Q">Q — Queenstown (皇后鎮)</option>
                </select>
              </InputField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pclass */}
              <InputField label="Ticket Class (艙等)">
                <select
                  value={formData.Pclass}
                  onChange={(e) => handleChange('Pclass', Number(e.target.value))}
                  className="input-field"
                >
                  <option value={1}>1st Class (頭等艙)</option>
                  <option value={2}>2nd Class (商務艙)</option>
                  <option value={3}>3rd Class (經濟艙)</option>
                </select>
              </InputField>

              {/* Fare */}
              <InputField label="Fare (票價 £)" hint="Ticket price">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.Fare}
                  onChange={(e) => handleChange('Fare', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </InputField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Age */}
              <InputField label="Age (年齡)">
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={0.5}
                  value={formData.Age}
                  onChange={(e) => handleChange('Age', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </InputField>

              {/* SibSp */}
              <InputField label="SibSp (兄弟姊妹/配偶)">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.SibSp}
                  onChange={(e) => handleChange('SibSp', parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </InputField>

              {/* Parch */}
              <InputField label="Parch (父母/子女)">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.Parch}
                  onChange={(e) => handleChange('Parch', parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </InputField>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Predicting... (預測中...)
                </span>
              ) : (
                'Run Prediction (開始預測)'
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="space-y-5">
            <SectionTitle icon="📊" title="Prediction Result" subtitle="預測結果將顯示於此" />

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-500">
                <div className="text-4xl mb-3">🚢</div>
                <p className="text-sm">請填寫乘客資料後點擊 <strong>開始預測</strong></p>
              </div>
            )}

            {result && (
              <>
                {/* Prediction Card */}
                <div className={`rounded-2xl p-6 border transition-all duration-500 ${
                  survived
                    ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/30'
                    : 'bg-gradient-to-br from-rose-500/15 to-rose-600/5 border-rose-500/30'
                }`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      survived ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                    }`}>
                      {survived ? '✅' : '❌'}
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${survived ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {result.prediction === 'Survived' ? '生還 (Survived)' : '遇難 (Not Survived)'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">SVM Model Prediction</div>
                    </div>
                  </div>

                  {/* Probability Bars */}
                  <div className="space-y-3">
                    <ProbBar label="生還 (Survived)" pct={survivedProb} color="emerald" />
                    <ProbBar label="遇難 (Not Survived)" pct={notSurvivedProb} color="rose" />
                  </div>
                </div>

                {/* Detail Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <MiniCard label="艙等 (Class)" value={`${formData.Pclass} Class`} />
                  <MiniCard label="性別 (Sex)" value={formData.Sex === 'male' ? 'Male (男)' : 'Female (女)'} />
                  <MiniCard label="年齡 (Age)" value={`${formData.Age} yrs`} />
                  <MiniCard label="票價 (Fare)" value={`£${formData.Fare.toFixed(2)}`} />
                  <MiniCard label="港口 (Embarked)" value={formData.Embarked} />
                  <MiniCard label="家庭人數 (Family)" value={String(formData.SibSp + formData.Parch + 1)} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-600">
          Titanic Survival Prediction — SVM Model · FastAPI Backend · React + TailwindCSS Frontend
        </div>
      </footer>

      {/* Global style tag for input-field class */}
      <style>{`
        .input-field {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }
        .input-field:focus {
          border-color: rgba(34,211,238,0.5);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.1);
        }
        .input-field option {
          background: #1e293b;
          color: white;
        }
        select.input-field {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

/* --- Sub-components --- */

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="text-2xl">{icon}</span>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function InputField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

function ProbBar({ label, pct, color }: { label: string; pct: number; color: 'emerald' | 'rose' }) {
  const barColor = color === 'emerald'
    ? 'from-emerald-500 to-emerald-400'
    : 'from-rose-500 to-rose-400';
  const textColor = color === 'emerald' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-slate-200">{value}</div>
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

import { useState, useEffect, useRef } from 'react';
import './App.css';

type TimerKey = 'space' | 'mount' | 'bifrost' | 'skill' | 'skillLvl1' | 'smoke';

interface TimerState {
  timeRemaining: number; // in seconds
  isActive: boolean;
}

const initialTimers: Record<TimerKey, TimerState> = {
  space: { timeRemaining: 0, isActive: false },
  mount: { timeRemaining: 0, isActive: false },
  bifrost: { timeRemaining: 0, isActive: false },
  skill: { timeRemaining: 0, isActive: false },
  skillLvl1: { timeRemaining: 0, isActive: false },
  smoke: { timeRemaining: 0, isActive: false },
};

const TIMER_LABELS: Record<TimerKey, string> = {
  space: '스페 금지',
  mount: '탈것 금지',
  bifrost: '비프 금지',
  skill: '스킬 금지',
  skillLvl1: '스킬 all 1렙',
  smoke: '금연'
};

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Icons (SVG strings to avoid dependencies)
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const ResetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

function App() {
  const [timers, setTimers] = useState<Record<TimerKey, TimerState>>(() => {
    const saved = localStorage.getItem('broadcastingTimers');
    return saved ? JSON.parse(saved) : initialTimers;
  });
  const [linerBanCount, setLinerBanCount] = useState<number>(() => {
    const saved = localStorage.getItem('broadcastingCounter');
    return saved ? JSON.parse(saved) : 0;
  });
  const [editingTimerKey, setEditingTimerKey] = useState<TimerKey | null>(null);
  const [editHours, setEditHours] = useState<string>('');
  const [editMinutes, setEditMinutes] = useState<string>('');
  const [editSeconds, setEditSeconds] = useState<string>('');
  const editFormRef = useRef<HTMLFormElement | null>(null);

  // Click outside to submit
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editFormRef.current && !editFormRef.current.contains(event.target as Node)) {
        if (editingTimerKey) {
          // Manually trigger submit logic
          const h = parseInt(editHours) || 0;
          const m = parseInt(editMinutes) || 0;
          const s = parseInt(editSeconds) || 0;
          const newTotalSeconds = h * 3600 + m * 60 + s;
          
          setTimers(prev => ({
            ...prev,
            [editingTimerKey]: {
              ...prev[editingTimerKey],
              timeRemaining: Math.max(0, newTotalSeconds)
            }
          }));
          setEditingTimerKey(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingTimerKey, editHours, editMinutes, editSeconds]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('broadcastingTimers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    localStorage.setItem('broadcastingCounter', JSON.stringify(linerBanCount));
  }, [linerBanCount]);

  // Global Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        let hasChanges = false;
        const next = { ...prev };
        for (const key in next) {
          const k = key as TimerKey;
          if (next[k].isActive && next[k].timeRemaining > 0) {
            next[k] = { ...next[k], timeRemaining: next[k].timeRemaining - 1 };
            hasChanges = true;
            if (next[k].timeRemaining === 0) {
              next[k].isActive = false;
            }
          }
        }
        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const setTimerActive = (key: TimerKey, active: boolean) => {
    setTimers(prev => {
      if (prev[key].timeRemaining <= 0 && active) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], isActive: active }
      };
    });
  };

  const setAllTimersActive = (active: boolean) => {
    setTimers(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key in next) {
        const k = key as TimerKey;
        if (active) {
          if (next[k].timeRemaining > 0 && !next[k].isActive) {
            next[k] = { ...next[k], isActive: true };
            changed = true;
          }
        } else {
          if (next[k].isActive) {
            next[k] = { ...next[k], isActive: false };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  };

  const resetAllTimers = () => {
    if (confirm('모든 타이머와 카운터를 정말 초기화하시겠습니까?')) {
      setTimers(initialTimers);
      setLinerBanCount(0);
    }
  };

  const updateTimer = (key: TimerKey, addSeconds: number) => {
    setTimers(prev => {
      const newTime = Math.max(0, prev[key].timeRemaining + addSeconds);
      return {
        ...prev,
        [key]: {
          ...prev[key],
          timeRemaining: newTime,
          // Auto-start if time is added and it wasn't active (optional, let's keep it manual unless specified, wait - user said "자동 반영되도록 할거야", so let's auto-start if we add time from roulette, or just keep active state)
          // Let's auto-start if > 0
          isActive: newTime > 0 ? true : false
        }
      };
    });
  };

  const resetTimer = (key: TimerKey) => {
    setTimers(prev => ({
      ...prev,
      [key]: { timeRemaining: 0, isActive: false }
    }));
  };

  const handleRoulette = (action: string) => {
    switch (action) {
      case 'space10m': updateTimer('space', 10 * 60); break;
      case 'mount10m': updateTimer('mount', 10 * 60); break;
      case 'bifrost10m': updateTimer('bifrost', 10 * 60); break;
      case 'space30m': updateTimer('space', 30 * 60); break;
      case 'skill5m': updateTimer('skill', 5 * 60); break;
      case 'skillLvl1_30m': updateTimer('skillLvl1', 30 * 60); break;
      case 'mount30m': updateTimer('mount', 30 * 60); break;
      case 'liner3': setLinerBanCount(prev => prev + 3); break;
      case 'space1h': updateTimer('space', 60 * 60); break;
      case 'mount1h': updateTimer('mount', 60 * 60); break;
      case 'smoke3h': updateTimer('smoke', 3 * 60 * 60); break;
      case 'none':
      default:
        // No change
        break;
    }
  };

  const handleTimeClick = (key: TimerKey, currentSeconds: number) => {
    setEditingTimerKey(key);
    const h = Math.floor(currentSeconds / 3600);
    const m = Math.floor((currentSeconds % 3600) / 60);
    const s = currentSeconds % 60;
    setEditHours(h.toString().padStart(2, '0'));
    setEditMinutes(m.toString().padStart(2, '0'));
    setEditSeconds(s.toString().padStart(2, '0'));
  };

  const handleTimeSubmit = (e: React.FormEvent, key: TimerKey) => {
    e.preventDefault();
    const h = parseInt(editHours) || 0;
    const m = parseInt(editMinutes) || 0;
    const s = parseInt(editSeconds) || 0;
    const newTotalSeconds = h * 3600 + m * 60 + s;
    
    setTimers(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        timeRemaining: Math.max(0, newTotalSeconds)
      }
    }));
    setEditingTimerKey(null);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingTimerKey(null);
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <section className="dashboard-section">
          {/* Timers Grid */}
          <div className="timers-grid">
            {(Object.entries(timers) as [TimerKey, TimerState][]).map(([key, state]) => (
              <div key={key} className={`glass-card ${state.isActive ? 'active' : ''}`}>
                <div className="card-header">
                  <h3 className="card-title">
                    <span className="status-indicator"></span>
                    {TIMER_LABELS[key]}
                  </h3>
                </div>
                <div className="time-display title-font">
                  {editingTimerKey === key ? (
                    <form 
                      ref={editFormRef}
                      className="inline-edit-form"
                      onSubmit={(e) => handleTimeSubmit(e, key)}
                      onKeyDown={(e) => handleTimeKeyDown(e)}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={editHours}
                        onChange={(e) => setEditHours(e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={(e) => setEditHours(e.target.value.padStart(2, '0'))}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className="inline-time-input"
                      />
                      <span className="time-separator">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={(e) => setEditMinutes(e.target.value.padStart(2, '0'))}
                        onFocus={(e) => e.target.select()}
                        className="inline-time-input"
                      />
                      <span className="time-separator">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={editSeconds}
                        onChange={(e) => setEditSeconds(e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={(e) => setEditSeconds(e.target.value.padStart(2, '0'))}
                        onFocus={(e) => e.target.select()}
                        className="inline-time-input"
                      />
                      <button type="submit" style={{ display: 'none' }}>저장</button>
                    </form>
                  ) : (
                    <span 
                      onClick={() => handleTimeClick(key, state.timeRemaining)}
                      style={{ cursor: 'pointer' }}
                      title="클릭하여 시간 수정"
                    >
                      {formatTime(state.timeRemaining)}
                    </span>
                  )}
                </div>
                <div className="controls-row">
                  <button
                    className={`icon-btn ${state.isActive ? 'primary' : ''}`}
                    onClick={() => setTimerActive(key, true)}
                    disabled={state.timeRemaining <= 0 || state.isActive}
                    title="시작"
                  >
                    <PlayIcon />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => setTimerActive(key, false)}
                    disabled={!state.isActive}
                    title="일시정지"
                  >
                    <PauseIcon />
                  </button>
                  <button className="icon-btn danger" onClick={() => resetTimer(key)} title="초기화">
                    <ResetIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Counter Section moved to bottom */}
          <div className="glass-card active">
            <div className="card-header">
              <h3 className="card-title">대륙 이동 정기선 금지</h3>
            </div>
            <div className="controls-row" style={{ marginTop: 0, justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="counter-display title-font" style={{ margin: 0, fontSize: '3rem' }}>{linerBanCount}회</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={() => setLinerBanCount(Math.max(0, linerBanCount - 1))}>-1</button>
                <button className="icon-btn primary" onClick={() => setLinerBanCount(linerBanCount + 1)}>+1</button>
                <button className="icon-btn danger" onClick={() => setLinerBanCount(0)} title="Reset">
                  <ResetIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Global Controls */}
          <div className="glass-card active" style={{ marginTop: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '0.5rem' }}>
            <button
              className="action-btn time-add"
              style={{ flex: 1, justifyContent: 'center', fontSize: '1.25rem' }}
              onClick={() => setAllTimersActive(true)}
              title="모든 타이머 일괄 재생"
            >
              <PlayIcon /> <span style={{ marginLeft: '8px' }}>일괄 재생</span>
            </button>
            <button
              className="action-btn"
              style={{ flex: 1, justifyContent: 'center', fontSize: '1.25rem', borderColor: 'var(--text-muted)' }}
              onClick={() => setAllTimersActive(false)}
              title="모든 타이머 일시정지"
            >
              <PauseIcon /> <span style={{ marginLeft: '8px' }}>일괄 정지</span>
            </button>
            <button
              className="action-btn count-add"
              style={{ flex: 1, justifyContent: 'center', fontSize: '1.25rem' }}
              onClick={resetAllTimers}
              title="모든 타이머 및 카운터 초기화"
            >
              <ResetIcon /> <span style={{ marginLeft: '8px' }}>일괄 초기화</span>
            </button>
          </div>
        </section>

        <section className="roulette-section">
          <h2 className="title-font">룰렛 결과 적용</h2>
          <div className="actions-grouped-list">
            
            <div className="action-group">
              <div className="action-group-header">스페 금지</div>
              <div className="action-group-buttons">
                <button className="action-btn time-add" onClick={() => handleRoulette('space10m')}>+10분</button>
                <button className="action-btn time-add" onClick={() => handleRoulette('space30m')}>+30분</button>
                <button className="action-btn time-add" onClick={() => handleRoulette('space1h')}>+1시간</button>
              </div>
            </div>

            <div className="action-group">
              <div className="action-group-header">탈것 금지</div>
              <div className="action-group-buttons">
                <button className="action-btn time-add" onClick={() => handleRoulette('mount10m')}>+10분</button>
                <button className="action-btn time-add" onClick={() => handleRoulette('mount30m')}>+30분</button>
                <button className="action-btn time-add" onClick={() => handleRoulette('mount1h')}>+1시간</button>
              </div>
            </div>

            <div className="action-group">
              <div className="action-group-header">비프 금지</div>
              <div className="action-group-buttons">
                <button className="action-btn time-add" onClick={() => handleRoulette('bifrost10m')}>+10분</button>
              </div>
            </div>

            <div className="action-group">
              <div className="action-group-header">스킬 금지</div>
              <div className="action-group-buttons">
                <button className="action-btn time-add" onClick={() => handleRoulette('skill5m')}>+5분</button>
              </div>
            </div>

            <div className="action-group">
              <div className="action-group-header">스킬 all 1렙</div>
              <div className="action-group-buttons">
                <button className="action-btn time-add" onClick={() => handleRoulette('skillLvl1_30m')}>+30분</button>
              </div>
            </div>

            <div className="action-group">
              <div className="action-group-header">금연</div>
              <div className="action-group-buttons">
                <button className="action-btn time-add" onClick={() => handleRoulette('smoke3h')}>+3시간</button>
              </div>
            </div>

            <div className="action-group">
              <div className="action-group-header">대륙 이동 정기선 금지</div>
              <div className="action-group-buttons">
                <button className="action-btn count-add" onClick={() => handleRoulette('liner3')}>+3회</button>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

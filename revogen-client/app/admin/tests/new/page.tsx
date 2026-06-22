'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

const TEST_TEMPLATES = {
  'Frontend Developer': { React: 10, JavaScript: 10, DBMS: 5, Aptitude: 5 },
  'Backend Developer': { Java: 10, SQL: 10, DBMS: 5, 'Computer Networks': 5 },
  'Java Developer': { Java: 15, SQL: 5, DBMS: 5, DSA: 5 },
  'Python Developer': { Python: 15, SQL: 5, DBMS: 5, Aptitude: 5 },
  'Full Stack Developer': { React: 10, JavaScript: 5, Java: 10, SQL: 5, DBMS: 5 },
  'AI Engineer': { Python: 15, DSA: 10, SQL: 5, Aptitude: 5 },
};



const MODULE_ICONS: Record<string, string> = {
  Java: '☕',
  Python: '🐍',
  JavaScript: '⚡',
  React: '⚛️',
  DBMS: '🗄️',
  SQL: '📊',
  DSA: '🧩',
  'Operating Systems': '💻',
  'Computer Networks': '🌐',
  Aptitude: '🧠',
};

export default function CreateTestPage() {
  const router = useRouter();

  const [
  securityLevel,
  setSecurityLevel,
] = useState('BASIC');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([
    { module: 'Java', questionCount: 0 },
    { module: 'Python', questionCount: 0 },
    { module: 'JavaScript', questionCount: 0 },
    { module: 'React', questionCount: 0 },
    { module: 'DBMS', questionCount: 0 },
    { module: 'SQL', questionCount: 0 },
    { module: 'DSA', questionCount: 0 },
    { module: 'Operating Systems', questionCount: 0 },
    { module: 'Computer Networks', questionCount: 0 },
    { module: 'Aptitude', questionCount: 0 },
  ]);
  const [questionAvailability, setQuestionAvailability] = useState<Record<string, number>>({});

  const totalSelected = modules.reduce((sum, m) => sum + m.questionCount, 0);
  const totalAvailable = Object.values(questionAvailability).reduce((sum, c) => sum + c, 0);
  const hasError = modules.some(
    (m) => m.questionCount > (questionAvailability[m.module] ?? 0)
  );

  const applyTemplate = (templateName: string) => {
    const template = TEST_TEMPLATES[templateName as keyof typeof TEST_TEMPLATES];
    if (!template) return;
    setModules(modules.map((m) => ({
      ...m,
      questionCount: template[m.module as keyof typeof template] ?? 0,
    })));
    setSelectedTemplate(templateName);
    if (!title) setTitle(templateName);
  };

  const loadAvailability = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/question-bank/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

console.log("QUESTION STATS RESPONSE:", data);
console.log("IS ARRAY:", Array.isArray(data));
      const map: Record<string, number> = {};
      data.forEach((item: { category: string; count: number }) => {
        map[item.category] = item.count;
      });
      setQuestionAvailability(map);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { loadAvailability(); }, []);

  const updateQuestionCount = (index: number, value: number) => {
    const updated = [...modules];
    updated[index].questionCount = value;
    setModules(updated);
  };

  const createTest = async () => {
    const selectedModules = modules.filter((m) => m.questionCount > 0);
    if (!title || selectedModules.length === 0) {
      alert('Please enter title and select at least one module');
      return;
    }
    for (const module of modules) {
      const available = questionAvailability[module.module] ?? 0;
      if (module.questionCount > available) {
        alert(`${module.module} only has ${available} questions available`);
        return;
      }
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, duration, modules: selectedModules, securityLevel,autoGenerate }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || 'Failed to create test'); return; }
      alert('Test created successfully');
      router.push('/admin/tests');
    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-base:       #0d1117;
          --bg-surface:    #161b22;
          --bg-elevated:   #1c2330;
          --bg-card:       #21262d;
          --border:        #30363d;
          --border-focus:  #388bfd;
          --accent:        #388bfd;
          --accent-soft:   rgba(56,139,253,0.12);
          --accent-glow:   rgba(56,139,253,0.25);
          --success:       #3fb950;
          --success-soft:  rgba(63,185,80,0.12);
          --warning:       #d29922;
          --warning-soft:  rgba(210,153,34,0.12);
          --danger:        #f85149;
          --danger-soft:   rgba(248,81,73,0.12);
          --text-primary:  #e6edf3;
          --text-secondary:#8b949e;
          --text-muted:    #484f58;
          --radius-sm:     6px;
          --radius-md:     10px;
          --radius-lg:     14px;
          --shadow-sm:     0 1px 3px rgba(0,0,0,0.4);
          --shadow-md:     0 4px 12px rgba(0,0,0,0.5);
          --shadow-lg:     0 8px 24px rgba(0,0,0,0.6);
          --font-main:    'Sora', sans-serif;
          --font-mono:    'JetBrains Mono', monospace;
        }

        body { background: var(--bg-base); font-family: var(--font-main); color: var(--text-primary); }

        .page-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,139,253,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 90%, rgba(63,185,80,0.04) 0%, transparent 50%);
        }

        .page-container {
          max-width: 760px;
          margin: 0 auto;
          padding: 36px 24px 80px;
        }

        /* ── Page Header ── */
        .page-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 32px;
        }
        .page-header-icon {
          width: 44px; height: 44px;
          background: var(--accent-soft);
          border: 1px solid rgba(56,139,253,0.3);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 16px var(--accent-glow);
        }
        .page-title {
          font-size: 22px; font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }
        .page-subtitle {
          font-size: 13px; color: var(--text-secondary);
          margin-top: 2px;
        }

        /* ── Card ── */
        .card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s;
        }
        .card:hover { box-shadow: var(--shadow-md); }

        .section-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        /* ── Form Elements ── */
        .field-group { margin-bottom: 20px; }
        .field-group:last-child { margin-bottom: 0; }

        .field-label {
          display: block;
          font-size: 13px; font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .input-field {
          width: 100%;
          padding: 10px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-main);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder { color: var(--text-muted); }
        .input-field:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        select.input-field {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b949e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
        select.input-field option { background: var(--bg-card); }

        .inline-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ── Stats Bar ── */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-chip {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          text-align: center;
        }
        .stat-value {
          font-size: 22px; font-weight: 700;
          font-family: var(--font-mono);
          color: var(--accent);
          line-height: 1;
        }
        .stat-label {
          font-size: 11px; color: var(--text-muted);
          margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .stat-chip.success .stat-value { color: var(--success); }
        .stat-chip.warning .stat-value { color: var(--warning); }

        /* ── Module Row ── */
        .modules-list { display: flex; flex-direction: column; gap: 8px; }

        .module-row {
          display: grid;
          grid-template-columns: 36px 1fr auto 110px;
          align-items: center;
          gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          transition: border-color 0.2s, background 0.2s;
        }
        .module-row:hover { border-color: #3d444d; background: var(--bg-elevated); }
        .module-row.active {
          border-color: rgba(56,139,253,0.4);
          background: rgba(56,139,253,0.04);
        }
        .module-row.error {
          border-color: rgba(248,81,73,0.4);
          background: var(--danger-soft);
        }

        .module-emoji { font-size: 18px; text-align: center; }

        .module-info {}
        .module-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .module-avail {
          font-size: 11px; color: var(--success);
          font-family: var(--font-mono);
          margin-top: 1px;
        }
        .module-avail.zero { color: var(--text-muted); }

        .module-error-badge {
          font-size: 11px; color: var(--danger);
          font-family: var(--font-mono);
          white-space: nowrap;
          background: var(--danger-soft);
          border: 1px solid rgba(248,81,73,0.3);
          border-radius: 4px;
          padding: 2px 7px;
        }

        .module-input-wrap { position: relative; }
        .module-count-input {
          width: 100%;
          padding: 7px 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 14px; font-weight: 500;
          text-align: center;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .module-count-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.4; }

        /* ── Toggle ── */
        .toggle-row {
          display: flex; align-items: center; gap: 14px;
          cursor: pointer;
          user-select: none;
          padding: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: border-color 0.2s;
        }
        .toggle-row:hover { border-color: #3d444d; }

        .toggle-switch {
          position: relative; width: 40px; height: 22px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 100px;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .toggle-switch.on {
          background: var(--accent);
          border-color: var(--accent);
        }
        .toggle-knob {
          position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .toggle-switch.on .toggle-knob { transform: translateX(18px); }

        .toggle-label { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .toggle-desc { font-size: 12px; color: var(--text-secondary); margin-top: 1px; }

        /* ── Submit Button ── */
        .submit-btn {
          width: 100%; padding: 13px 24px;
          background: var(--accent);
          color: white;
          border: none; border-radius: var(--radius-md);
          font-family: var(--font-main);
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          box-shadow: 0 0 0 rgba(56,139,253,0);
          letter-spacing: 0.1px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #4493ff;
          box-shadow: 0 4px 16px var(--accent-glow);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          opacity: 0.55; cursor: not-allowed;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .divider {
          height: 1px; background: var(--border);
          margin: 24px 0;
        }
      `}</style>

      <AdminNavbar />

      <div className="page-wrapper">
        <div className="page-container">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-icon">📋</div>
            <div>
              <div className="page-title">Create New Test</div>
              <div className="page-subtitle">Configure modules and generate a test for candidates</div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="card">
            <div className="section-label">Test Details</div>
            <div className="field-group">
              <label className="field-label">Test Title</label>
              <input
                className="input-field"
                placeholder="e.g. Frontend Developer Round 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="inline-fields">
              <div className="field-group">
                <label className="field-label">Template</label>
                <select
                  className="input-field"
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  <option value="">Choose a template…</option>
                  {Object.keys(TEST_TEMPLATES).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Duration (minutes)</label>
                <input
                  className="input-field"
                  type="number"
                  min="5"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-chip">
              <div className="stat-value">{totalAvailable}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className={`stat-chip ${totalSelected > 0 ? 'success' : ''}`}>
              <div className="stat-value">{totalSelected}</div>
              <div className="stat-label">Selected</div>
            </div>
            <div className="stat-chip warning">
              <div className="stat-value">{duration}m</div>
              <div className="stat-label">Duration</div>
            </div>
          </div>

          {/* Modules */}
          <div className="card">
            <div className="section-label">Module Configuration</div>
            <div className="modules-list">
              {modules.map((module, index) => {
                const avail = questionAvailability[module.module] ?? 0;
                const isActive = module.questionCount > 0;
                const isError = module.questionCount > avail;
                return (
                  <div
                    key={module.module}
                    className={`module-row ${isActive ? 'active' : ''} ${isError ? 'error' : ''}`}
                  >
                    <div className="module-emoji">
                      {MODULE_ICONS[module.module] ?? '📌'}
                    </div>
                    <div className="module-info">
                      <div className="module-name">{module.module}</div>
                      <div className={`module-avail ${avail === 0 ? 'zero' : ''}`}>
                        {avail} available
                      </div>
                    </div>
                    {isError ? (
                      <div className="module-error-badge">
                        max {avail}
                      </div>
                    ) : <div />}
                    <div className="module-input-wrap">
                      <input
                        className="module-count-input"
                        type="number"
                        min="0"
                        value={module.questionCount}
                        onChange={(e) => updateQuestionCount(index, Number(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto Generate Toggle */}
          <div className="card">
            <div
              className="toggle-row"
              onClick={() => setAutoGenerate((v) => !v)}
            >
              <div className={`toggle-switch ${autoGenerate ? 'on' : ''}`}>
                <div className="toggle-knob" />
              </div>
              <div>
                <div className="toggle-label">Auto-Generate Questions</div>
                <div className="toggle-desc">
                  Randomly select questions from the question bank for each module
                </div>
              </div>
            </div>
          </div>

          <div
  style={{
    marginTop: '20px',
  }}
>
  <label>
    Security Level
  </label>

  <br />

  <select
    value={securityLevel}
    onChange={(e) =>
      setSecurityLevel(
        e.target.value,
      )
    }
    style={{
      padding: '10px',
      width: '250px',
      marginTop: '10px',
    }}
  >
    <option value="BASIC">
      Basic Assessment
    </option>

    <option value="PRO">
      Pro Assessment
    </option>
  </select>
</div>

          {/* Submit */}
          <button
            className="submit-btn"
            onClick={createTest}
            disabled={loading || hasError}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Creating Test…
              </>
              
            ) : (

              
              <>
                <span>✦</span>
                Create Test
              </>
            )}
          </button>

        </div>
      </div>
    </>
  );
}
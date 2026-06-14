'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: string;
  category: string;
}

export default function CreateCodingAssessmentPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState<number | ''>(60);
  
  // Data State
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch('http://localhost:3000/coding-questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Derived filter options
  const categories = useMemo(() => Array.from(new Set(questions.map(q => q.category).filter(Boolean))), [questions]);
  const difficulties = useMemo(() => Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean))), [questions]);

  // Filtered List
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory ? q.category === filterCategory : true;
      const matchDiff = filterDifficulty ? q.difficulty === filterDifficulty : true;
      return matchSearch && matchCat && matchDiff;
    });
  }, [questions, searchQuery, filterCategory, filterDifficulty]);

  // Handlers
  const toggleQuestion = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const getDifficultyBadgeClass = (diff: string) => {
    switch(diff?.toUpperCase()) {
      case 'EASY': return 'badge-green';
      case 'MEDIUM': return 'badge-yellow';
      case 'HARD': return 'badge-danger';
      default: return 'badge-blue';
    }
  };

const handleSubmit = async (
  e: React.FormEvent,
) => {
  e.preventDefault();

  setError('');

  if (!title.trim()) {
    return setError(
      'Title is required.',
    );
  }

  if (!duration) {
    return setError(
      'Duration is required.',
    );
  }

  if (
    selectedIds.length === 0
  ) {
    return setError(
      'Please select at least one question.',
    );
  }

  setSubmitting(true);

  try {
    const token =
      localStorage.getItem(
        'access_token',
      );

    const payload = {
      title,
      description,
      category,
      duration:
        Number(duration),
      questionIds:
        selectedIds,
    };

    const response =
      await fetch(
        'http://localhost:3000/coding-tests',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            payload,
          ),
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.log(
        'Create Error:',
        data,
      );

      throw new Error(
        data.message ||
          'Failed to create assessment.',
      );
    }

    router.push(
      '/admin/coding-tests',
    );
  } catch (err: any) {
    console.error(err);

    setError(
      err.message ||
        'An error occurred while creating the assessment.',
    );
  } finally {
    setSubmitting(false);
  }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-base:        #0d1117;
          --bg-surface:     #161b22;
          --bg-elevated:    #1c2330;
          --bg-card:        #21262d;
          --border:         #30363d;
          --border-hover:   #3d444d;
          --accent:         #388bfd;
          --accent-soft:    rgba(56,139,253,0.12);
          --accent-glow:    rgba(56,139,253,0.25);
          --success:        #3fb950;
          --success-soft:   rgba(63,185,80,0.12);
          --warning:        #d29922;
          --warning-soft:   rgba(210,153,34,0.12);
          --danger:         #f85149;
          --danger-soft:    rgba(248,81,73,0.12);
          --purple:         #bc8cff;
          --purple-soft:    rgba(188,140,255,0.12);
          --text-primary:   #e6edf3;
          --text-secondary: #8b949e;
          --text-muted:     #484f58;
          --radius-sm:      6px;
          --radius-md:      10px;
          --radius-lg:      14px;
          --shadow-sm:      0 1px 3px rgba(0,0,0,0.4);
          --shadow-md:      0 4px 12px rgba(0,0,0,0.5);
          --shadow-lg:      0 8px 24px rgba(0,0,0,0.6);
          --font-main:      'Sora', sans-serif;
          --font-mono:      'JetBrains Mono', monospace;
        }

        body { background: var(--bg-base); font-family: var(--font-main); color: var(--text-primary); }

        .page-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          background-image: radial-gradient(ellipse 80% 40% at 50% -5%, rgba(56,139,253,0.07) 0%, transparent 60%);
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 36px 24px 80px;
        }

        /* ── Header ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-header-left { display: flex; align-items: center; gap: 14px; }
        .page-header-icon {
          width: 44px; height: 44px;
          background: var(--accent-soft);
          border: 1px solid rgba(56,139,253,0.3);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 16px var(--accent-glow);
        }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

        /* ── Layout Grid ── */
        .create-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .create-grid { grid-template-columns: 1fr; }
        }

        /* ── Card Styles ── */
        .test-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 24px;
        }
        .card-title {
          font-size: 16px; font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        /* ── Form Styles ── */
        .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
        .form-row > * { flex: 1; min-width: 200px; }
        .form-group { margin-bottom: 16px; }
        .form-label {
          display: block; font-size: 12px; font-weight: 600;
          color: var(--text-secondary); margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%; padding: 10px 14px;
          background: var(--bg-base); border: 1px solid var(--border);
          color: var(--text-primary); border-radius: var(--radius-sm);
          font-family: var(--font-main); font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: var(--accent); outline: none;
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .form-textarea { resize: vertical; min-height: 80px; }

        /* ── Question List Styles ── */
        .filter-bar {
          display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 20px;
        }
        @media (max-width: 600px) {
          .filter-bar { grid-template-columns: 1fr; }
        }
        
        .question-card {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 16px; border: 1px solid var(--border);
          border-radius: var(--radius-md); background: var(--bg-card);
          margin-bottom: 12px; cursor: pointer; transition: all 0.2s;
        }
        .question-card:hover { border-color: var(--border-hover); background: var(--bg-elevated); }
        .question-card.selected { border-color: var(--accent); background: var(--accent-soft); }
        
        .question-checkbox {
          appearance: none; width: 18px; height: 18px;
          border: 2px solid var(--border-hover); border-radius: 4px;
          background: var(--bg-base); cursor: pointer;
          display: grid; place-content: center; margin-top: 2px;
        }
        .question-card.selected .question-checkbox {
          background: var(--accent); border-color: var(--accent);
        }
        .question-card.selected .question-checkbox::before {
          content: ""; width: 10px; height: 10px;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
          background: white; transform: scale(1);
        }

        .question-info { flex: 1; }
        .question-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
        
        /* ── Badges ── */
        .meta-badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .meta-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600; font-family: var(--font-mono);
          text-transform: uppercase;
        }
        .badge-blue { background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(56,139,253,0.2); }
        .badge-green { background: var(--success-soft); color: var(--success); border: 1px solid rgba(63,185,80,0.2); }
        .badge-yellow { background: var(--warning-soft); color: var(--warning); border: 1px solid rgba(210,153,34,0.2); }
        .badge-purple { background: var(--purple-soft); color: var(--purple); border: 1px solid rgba(188,140,255,0.2); }
        .badge-danger { background: var(--danger-soft); color: var(--danger); border: 1px solid rgba(248,81,73,0.2); }

        /* ── Sidebar ── */
        .sidebar-sticky { position: sticky; top: 24px; }
        .selected-list { max-height: 400px; overflow-y: auto; padding-right: 8px; margin-bottom: 20px; }
        .selected-list::-webkit-scrollbar { width: 6px; }
        .selected-list::-webkit-scrollbar-track { background: transparent; }
        .selected-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        
        .selected-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; background: var(--bg-card);
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          margin-bottom: 8px; font-size: 13px; font-weight: 500;
        }
        .remove-btn {
          margin-left: auto; background: none; border: none;
          color: var(--text-secondary); cursor: pointer; font-size: 16px;
        }
        .remove-btn:hover { color: var(--danger); }

        /* ── Buttons & Alerts ── */
        .submit-btn {
          width: 100%; display: flex; justify-content: center; align-items: center;
          padding: 14px; background: var(--accent); color: white;
          border: none; border-radius: var(--radius-md);
          font-family: var(--font-main); font-size: 14px; font-weight: 600;
          cursor: pointer; transition: background 0.2s, box-shadow 0.2s;
        }
        .submit-btn:hover:not(:disabled) { background: #4493ff; box-shadow: 0 4px 16px var(--accent-glow); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .alert-error {
          background: var(--danger-soft); border: 1px solid rgba(248,81,73,0.3);
          color: var(--danger); padding: 12px 16px; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 500; margin-bottom: 20px;
        }

        .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 14px; }
      `}</style>

      <AdminNavbar />

      <div className="page-wrapper">
        <div className="page-container">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-header-icon">💻</div>
              <div>
                <div className="page-title">Create Coding Assessment</div>
                <div className="page-subtitle">Create a coding assessment from the coding question bank.</div>
              </div>
            </div>
            <Link href="/admin/tests" className="form-label" style={{ display: 'inline-block', margin: 0 }}>
              ← Back to Tests
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="create-grid">
            
            {/* Main Content Column */}
            <div className="main-col">
              
              {/* Assessment Details Card */}
              <div className="test-card">
                <div className="card-title">1. Assessment Details</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., Java Coding Round"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="60"
                      value={duration}
                      onChange={e => setDuration(e.target.value ? Number(e.target.value) : '')}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g., Backend, DSA Screening"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Brief details about this assessment..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Question Bank Card */}
              <div className="test-card">
                <div className="card-title">2. Select Questions</div>
                
                {/* Filters */}
                <div className="filter-bar">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search questions..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <select 
                    className="form-select"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select 
                    className="form-select"
                    value={filterDifficulty}
                    onChange={e => setFilterDifficulty(e.target.value)}
                  >
                    <option value="">All Difficulties</option>
                    {difficulties.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                  </select>
                </div>

                {/* List */}
                {loading ? (
                  <div className="empty-state">Loading questions...</div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="empty-state">No questions match your filters.</div>
                ) : (
                  <div className="questions-list">
                    {filteredQuestions.map(q => {
                      const isSelected = selectedIds.includes(q.id);
                      return (
                        <div 
                          key={q.id} 
                          className={`question-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleQuestion(q.id)}
                        >
                          <div className="question-checkbox" />
                          <div className="question-info">
                            <div className="question-title">{q.title}</div>
                            <div className="meta-badges">
                              <span className={`meta-badge ${getDifficultyBadgeClass(q.difficulty)}`}>
                                {q.difficulty}
                              </span>
                              {q.category && (
                                <span className="meta-badge badge-blue">{q.category}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="sidebar-col">
              <div className="test-card sidebar-sticky">
                <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Selected</span>
                  <span className="meta-badge badge-blue">{selectedIds.length} Questions</span>
                </div>

                {error && <div className="alert-error">{error}</div>}

                {selectedIds.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    No questions selected yet.
                  </div>
                ) : (
                  <div className="selected-list">
                    {selectedIds.map(id => {
                      const q = questions.find(x => x.id === id);
                      if (!q) return null;
                      return (
                        <div key={q.id} className="selected-item">
                          <span style={{ fontSize: '16px' }}>📝</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {q.title}
                          </span>
                          <button 
                            type="button" 
                            className="remove-btn" 
                            onClick={() => toggleQuestion(q.id)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={submitting || selectedIds.length === 0}
                >
                  {submitting ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';

interface Question {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

const OPTS = ['A', 'B', 'C', 'D'] as const;

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch('http://localhost:3000/question-bank', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setQuestions(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = questions.filter(q =>
    !search.trim() ||
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.category.toLowerCase().includes(search.toLowerCase())
  );

  const optionMap: Record<string, string> = { A: 'optionA', B: 'optionB', C: 'optionC', D: 'optionD' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b0d14; font-family: 'Inter', sans-serif; color: #edeef3; }

        .qb-wrap { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; }

        .qb-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .qb-title { font-size: 24px; font-weight: 800; letter-spacing: -.4px; }
        .qb-sub { font-size: 13px; color: #8b8d9b; margin-top: 4px; }

        .qb-search {
          display: flex; align-items: center; gap: 8px;
          background: #13151f; border: 1px solid #252836;
          border-radius: 10px; padding: 10px 14px;
          width: 100%; max-width: 320px;
          transition: border-color .15s;
        }
        .qb-search:focus-within { border-color: #6366f1; }
        .qb-search input { background: none; border: none; outline: none; color: #edeef3; font-size: 13px; font-family: inherit; width: 100%; }
        .qb-search input::placeholder { color: #4b5468; }

        .qb-count { font-size: 12px; color: #8b8d9b; margin-bottom: 16px; }

        .qb-card {
          background: #13151f; border: 1px solid #252836;
          border-radius: 14px; margin-bottom: 10px;
          overflow: hidden; transition: border-color .15s;
        }
        .qb-card:hover { border-color: #3a3d52; }

        .qb-card-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 16px 20px; cursor: pointer;
        }
        .qb-card-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .qb-cat {
          font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
          background: rgba(99,102,241,.12); color: #a5b4fc;
          border: 1px solid rgba(99,102,241,.25); white-space: nowrap; flex-shrink: 0;
        }
        .qb-q { font-size: 14px; font-weight: 500; color: #edeef3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qb-toggle { font-size: 11px; color: #4b5468; flex-shrink: 0; }

        .qb-card-body { padding: 0 20px 18px; border-top: 1px solid #1e2132; }
        .qb-q-full { font-size: 14px; color: #edeef3; line-height: 1.6; padding: 14px 0 12px; font-weight: 500; }

        .qb-options { display: flex; flex-direction: column; gap: 8px; }
        .qb-option {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 9px;
          border: 1px solid #252836; font-size: 13px;
        }
        .qb-option.correct {
          background: rgba(34,197,94,.08);
          border-color: rgba(34,197,94,.3);
        }
        .qb-opt-letter {
          width: 24px; height: 24px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
          background: #1a1d29; color: #8b8d9b;
        }
        .qb-option.correct .qb-opt-letter { background: rgba(34,197,94,.2); color: #4ade80; }
        .qb-opt-text { color: #c8cad4; flex: 1; }
        .qb-option.correct .qb-opt-text { color: #edeef3; font-weight: 500; }
        .qb-correct-badge { font-size: 11px; font-weight: 700; color: #4ade80; margin-left: auto; }

        .qb-skeleton { height: 56px; border-radius: 14px; background: #13151f; margin-bottom: 10px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        .qb-empty { text-align: center; padding: 60px 24px; color: #4b5468; }
        .qb-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .qb-empty-text { font-size: 14px; }
      `}</style>

      <AdminNavbar />

      <div className="qb-wrap">
        <div className="qb-header">
          <div>
            <div className="qb-title">📚 Question Bank</div>
            <div className="qb-sub">Browse all MCQ questions — read only</div>
          </div>
          <div className="qb-search">
            <span style={{ fontSize: 14, color: '#4b5468' }}>🔍</span>
            <input
              placeholder="Search questions or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!loading && (
          <div className="qb-count">{filtered.length} question{filtered.length !== 1 ? 's' : ''}</div>
        )}

        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="qb-skeleton" />)
        ) : filtered.length === 0 ? (
          <div className="qb-empty">
            <div className="qb-empty-icon">📭</div>
            <div className="qb-empty-text">
              {search ? `No questions match "${search}"` : 'No questions in the bank yet.'}
            </div>
          </div>
        ) : (
          filtered.map(q => {
            const isOpen = expanded === q.id;
            return (
              <div key={q.id} className="qb-card">
                <div className="qb-card-header" onClick={() => setExpanded(isOpen ? null : q.id)}>
                  <div className="qb-card-left">
                    <span className="qb-cat">{q.category}</span>
                    <span className="qb-q">{q.question}</span>
                  </div>
                  <span className="qb-toggle">{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div className="qb-card-body">
                    <div className="qb-q-full">{q.question}</div>
                    <div className="qb-options">
                      {OPTS.map(letter => {
                        const text = q[optionMap[letter] as keyof Question] as string;
                        const isCorrect = q.correctAnswer === letter;
                        return (
                          <div key={letter} className={`qb-option${isCorrect ? ' correct' : ''}`}>
                            <div className="qb-opt-letter">{letter}</div>
                            <div className="qb-opt-text">{text}</div>
                            {isCorrect && <span className="qb-correct-badge">✓ Correct</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

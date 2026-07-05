'use client';

import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

export default function QuestionBankHubPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }

        .hub-shell {
          min-height: 100vh;
          background: linear-gradient(135deg, #030712 0%, #0a0f1e 100%);
          font-family: 'Inter', sans-serif;
          color: #e2e8f0;
        }

        .hub-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 56px 24px 80px;
        }

        /* Header */
        .hub-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .hub-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 20px;
          box-shadow: 0 8px 32px rgba(99,102,241,0.35);
        }
        .hub-title {
          font-size: 30px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }
        .hub-sub {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          max-width: 440px;
          margin: 0 auto;
        }

        /* Cards */
        .hub-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .hub-card {
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 32px 28px;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .hub-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .hub-card.mcq::after   { background: radial-gradient(circle at 80% 20%, rgba(99,102,241,0.08), transparent 60%); }
        .hub-card.coding::after { background: radial-gradient(circle at 80% 20%, rgba(139,92,246,0.08), transparent 60%); }
        .hub-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
        .hub-card.mcq:hover   { border-color: rgba(99,102,241,0.4); }
        .hub-card.coding:hover { border-color: rgba(139,92,246,0.4); }
        .hub-card:hover::after { opacity: 1; }

        .hub-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
          flex-shrink: 0;
        }
        .hub-card.mcq .hub-card-icon    { background: rgba(99,102,241,0.12);  border: 1px solid rgba(99,102,241,0.25); }
        .hub-card.coding .hub-card-icon { background: rgba(139,92,246,0.12);  border: 1px solid rgba(139,92,246,0.25); }

        .hub-card-title {
          font-size: 18px;
          font-weight: 800;
          color: #f1f5f9;
          margin-bottom: 8px;
          letter-spacing: -0.2px;
        }
        .hub-card-desc {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.65;
          flex: 1;
          margin-bottom: 24px;
        }

        .hub-card-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 24px;
        }
        .hub-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
        }
        .hub-card.mcq .hub-pill    { background: rgba(99,102,241,0.1);  color: #818cf8; border: 1px solid rgba(99,102,241,0.2); }
        .hub-card.coding .hub-pill { background: rgba(139,92,246,0.1);  color: #c4b5fd; border: 1px solid rgba(139,92,246,0.2); }

        .hub-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          align-self: flex-start;
          transition: all 0.15s;
        }
        .hub-card.mcq .hub-card-cta    { background: rgba(99,102,241,0.15);  color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
        .hub-card.coding .hub-card-cta { background: rgba(139,92,246,0.15);  color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
        .hub-card:hover .hub-card-cta  { filter: brightness(1.2); }

        /* Back link */
        .hub-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(30,41,59,0.8);
          border: 1px solid rgba(255,255,255,0.07);
          color: #94a3b8;
          border-radius: 9px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
          margin: 0 auto;
          display: flex;
          width: fit-content;
        }
        .hub-back:hover { background: rgba(30,41,59,1); color: #e2e8f0; }

        /* Divider */
        .hub-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin: 36px 0;
        }

        /* Tips row */
        .hub-tips {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .hub-tip {
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 18px 16px;
          text-align: center;
        }
        .hub-tip-icon { font-size: 22px; margin-bottom: 10px; }
        .hub-tip-title { font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
        .hub-tip-desc  { font-size: 12px; color: #475569; line-height: 1.6; }

        @media (max-width: 640px) {
          .hub-cards { grid-template-columns: 1fr; }
          .hub-tips  { grid-template-columns: 1fr; }
          .hub-title { font-size: 24px; }
        }
      `}</style>

      <AdminNavbar />

      <div className="hub-shell">
        <div className="hub-container">

          {/* Header */}
          <div className="hub-header">
            <div className="hub-icon-wrap">🗄️</div>
            <h1 className="hub-title">Question Bank</h1>
            <p className="hub-sub">
              Your central library of questions. Browse MCQ questions for written assessments or coding problems for technical challenges.
            </p>
          </div>

          {/* Cards */}
          <div className="hub-cards">

            {/* MCQ */}
            <Link href="/admin/mcq-question-bank" className="hub-card mcq">
              <div className="hub-card-icon">📝</div>
              <div className="hub-card-title">MCQ Questions</div>
              <div className="hub-card-desc">
                Browse multiple-choice questions organised by category. Each question includes four options with the correct answer highlighted.
              </div>
              <div className="hub-card-pills">
                <span className="hub-pill">📂 By Category</span>
                <span className="hub-pill">🔍 Search</span>
                <span className="hub-pill">✓ Answers</span>
                <span className="hub-pill">📋 4 Options</span>
              </div>
              <div className="hub-card-cta">
                Open MCQ Bank →
              </div>
            </Link>

            {/* Coding */}
            <Link href="/admin/coding-question-bank" className="hub-card coding">
              <div className="hub-card-icon">💻</div>
              <div className="hub-card-title">Coding Questions</div>
              <div className="hub-card-desc">
                Explore coding challenges with difficulty ratings, test cases, starter code in multiple languages, and full problem statements.
              </div>
              <div className="hub-card-pills">
                <span className="hub-pill">🟢 Easy / 🟡 Medium / 🔴 Hard</span>
                <span className="hub-pill">📋 Test Cases</span>
                <span className="hub-pill">💻 Multi-lang</span>
              </div>
              <div className="hub-card-cta">
                Open Coding Bank →
              </div>
            </Link>

          </div>

          {/* Tips */}
          <div className="hub-divider" />
          <div className="hub-tips">
            <div className="hub-tip">
              <div className="hub-tip-icon">🧩</div>
              <div className="hub-tip-title">Reuse Across Tests</div>
              <div className="hub-tip-desc">Questions from the bank can be added to any assessment, saving time and ensuring consistency.</div>
            </div>
            <div className="hub-tip">
              <div className="hub-tip-icon">🏷️</div>
              <div className="hub-tip-title">Category Filters</div>
              <div className="hub-tip-desc">Both banks support category-based filtering so you can find the right questions fast.</div>
            </div>
            <div className="hub-tip">
              <div className="hub-tip-icon">✅</div>
              <div className="hub-tip-title">Correct Answers Visible</div>
              <div className="hub-tip-desc">Admin view always shows the correct answer highlighted — only candidates see the neutral view.</div>
            </div>
          </div>

          <div className="hub-divider" />
          <Link href="/admin" className="hub-back">← Back to Dashboard</Link>

        </div>
      </div>
    </>
  );
}

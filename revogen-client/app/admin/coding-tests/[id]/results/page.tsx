'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

interface Result {
  id: string;
  candidateEmail: string;
  status: string;
  totalScore: number;
  percentage: number;
  completedQuestions: number;
  totalQuestions: number;
  submittedAt: string | null;
  riskScore: number;
}

type SortKey = 'rank' | 'percentage' | 'totalScore' | 'riskScore' | 'submittedAt';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';

const RISK_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Low',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  HIGH:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function getRiskBucket(score: number) {
  if (score <= 30) return RISK_LABELS.LOW;
  if (score <= 65) return RISK_LABELS.MEDIUM;
  return RISK_LABELS.HIGH;
}

function getRankMedal(rank: number) {
  if (rank === 1) return { emoji: '🥇', color: '#FFD700' };
  if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
  if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
  return null;
}

function PercentageBar({ value }: { value: number }) {
  const color =
    value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: '#1e293b',
          borderRadius: 99,
          overflow: 'hidden',
          minWidth: 80,
        }}
      >
        <div
          style={{
            width: `${Math.min(value, 100)}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 13, minWidth: 38 }}>
        {value}%
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      style={{
        background: '#1e293b',
        border: `1px solid #334155`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '18px 22px',
        minWidth: 140,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
    </div>
  );
}

export default function CodingTestResultsPage() {
  const params = useParams();
  const testId = params.id as string;

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('percentage');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [minPct, setMinPct] = useState(0);
  const [maxRisk, setMaxRisk] = useState(100);
  const [exportFlash, setExportFlash] = useState(false);

  useEffect(() => { loadResults(); }, []);

  const loadResults = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/coding-tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Ranked results (rank based on percentage desc)
  const rankedResults = useMemo(() => {
    const sorted = [...results]
      .filter((r) => r.status === 'COMPLETED')
      .sort((a, b) => b.percentage - a.percentage);
    const rankMap = new Map<string, number>();
    sorted.forEach((r, i) => rankMap.set(r.id, i + 1));
    return rankMap;
  }, [results]);

  const filtered = useMemo(() => {
    let data = [...results];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.candidateEmail.toLowerCase().includes(q));
    }

    // Status
    if (statusFilter !== 'ALL') {
      data = data.filter((r) => r.status === statusFilter);
    }

    // Min percentage
    data = data.filter((r) => r.percentage >= minPct);

    // Max risk
    data = data.filter((r) => r.riskScore <= maxRisk);

    // Sort
    data.sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortKey === 'rank') {
        aVal = rankedResults.get(a.id) ?? 9999;
        bVal = rankedResults.get(b.id) ?? 9999;
      } else if (sortKey === 'submittedAt') {
        aVal = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        bVal = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      } else {
        aVal = a[sortKey] as number;
        bVal = b[sortKey] as number;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [results, search, statusFilter, sortKey, sortDir, minPct, maxRisk, rankedResults]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = results.filter((r) => r.status === 'COMPLETED');
    const avgPct = completed.length
      ? Math.round(completed.reduce((s, r) => s + r.percentage, 0) / completed.length)
      : 0;
    const top = completed.length
      ? Math.max(...completed.map((r) => r.percentage))
      : 0;
    const highRisk = results.filter((r) => r.riskScore > 65).length;
    return { total: results.length, completed: completed.length, avgPct, top, highRisk };
  }, [results]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Candidate', 'Status', 'Score', 'Percentage', 'Solved', 'Risk Score', 'Submitted At'];
    const rows = filtered.map((r) => {
      const rank = rankedResults.get(r.id) ?? '-';
      return [
        rank,
        r.candidateEmail,
        r.status,
        r.totalScore,
        `${r.percentage}%`,
        `${r.completedQuestions}/${r.totalQuestions}`,
        r.riskScore,
        r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-',
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coding-test-results-${testId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 1800);
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span style={{ opacity: sortKey === col ? 1 : 0.3, fontSize: 11, marginLeft: 4 }}>
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const statusColors: Record<string, { bg: string; color: string }> = {
    COMPLETED:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
    IN_PROGRESS: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    PENDING:     { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  };

  return (
    <>
      <AdminNavbar />

      <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Top header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 60%, #1a1040)', borderBottom: '1px solid #1e293b', padding: '32px 36px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Assessment Dashboard
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: -0.5 }}>
                  Coding Test Results
                </h1>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
                  Test ID: <code style={{ color: '#818cf8', background: '#1e293b', padding: '2px 7px', borderRadius: 5, fontSize: 12 }}>{testId}</code>
                </p>
              </div>

              <button
                onClick={exportCSV}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: exportFlash ? '#22c55e' : '#6366f1',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '11px 20px', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', transition: 'background 0.3s',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                }}
              >
                <span>{exportFlash ? '✓ Exported!' : '⬇ Export CSV'}</span>
              </button>
            </div>

            {/* Stat cards */}
            {!loading && (
              <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
                <StatCard label="Total Candidates" value={stats.total} accent="#6366f1" />
                <StatCard label="Completed" value={stats.completed} accent="#22c55e" />
                <StatCard label="Avg Score" value={`${stats.avgPct}%`} accent="#38bdf8" />
               <StatCard label="Top Score" value={`${stats.top.toFixed(2)}%`} accent="#a78bfa" />
                <StatCard label="High Risk" value={stats.highRisk} accent="#ef4444" />
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 36px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 15 }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                style={{
                  width: '100%', background: '#1e293b', border: '1px solid #334155',
                  borderRadius: 8, color: '#f1f5f9', padding: '9px 12px 9px 36px',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: 6, background: '#1e293b', borderRadius: 9, padding: 4, border: '1px solid #334155' }}>
              {(['ALL', 'COMPLETED', 'IN_PROGRESS', 'PENDING'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '6px 13px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: statusFilter === s ? '#6366f1' : 'transparent',
                    color: statusFilter === s ? 'white' : '#64748b',
                    transition: 'all 0.2s',
                  }}
                >
                  {s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Min score filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '6px 14px' }}>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Min %</span>
              <input
                type="range" min={0} max={100} value={minPct}
                onChange={(e) => setMinPct(Number(e.target.value))}
                style={{ width: 80, accentColor: '#6366f1' }}
              />
              <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, minWidth: 28 }}>{minPct}</span>
            </div>

            {/* Max risk filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '6px 14px' }}>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Max Risk</span>
              <input
                type="range" min={0} max={100} value={maxRisk}
                onChange={(e) => setMaxRisk(Number(e.target.value))}
                style={{ width: 80, accentColor: '#ef4444' }}
              />
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700, minWidth: 28 }}>{maxRisk}</span>
            </div>

            {/* Result count */}
            <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
              Showing <strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> of {results.length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ maxWidth: 1200, margin: '28px auto', padding: '0 36px 60px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>⏳</div>
              <p style={{ fontSize: 16 }}>Loading results...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
              <p style={{ fontSize: 16, color: '#64748b' }}>No results match your filters.</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('ALL'); setMinPct(0); setMaxRisk(100); }}
                style={{ marginTop: 14, background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #1e293b', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0f172a' }}>
                <thead>
                  <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155' }}>
                    {([
                      { key: 'rank',        label: 'Rank' },
                      { key: null,          label: 'Candidate' },
                      { key: null,          label: 'Status' },
                      { key: 'totalScore',  label: 'Score' },
                      { key: 'percentage',  label: 'Percentage' },
                      { key: null,          label: 'Solved' },
                      { key: 'riskScore',   label: 'Risk' },
                      { key: 'submittedAt', label: 'Submitted' },
                    ] as { key: SortKey | null; label: string }[]).map(({ key, label }) => (
                      <th
                        key={label}
                        onClick={() => key && handleSort(key)}
                        style={{
                          padding: '13px 16px', textAlign: 'left', fontSize: 11,
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                          color: key ? '#94a3b8' : '#64748b',
                          cursor: key ? 'pointer' : 'default',
                          whiteSpace: 'nowrap',
                          userSelect: 'none',
                        }}
                      >
                        {label}{key && <SortIcon col={key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((result, idx) => {
                    const rank = rankedResults.get(result.id);
                    const medal = rank ? getRankMedal(rank) : null;
                    const risk = getRiskBucket(result.riskScore);
                    const sc = statusColors[result.status] ?? statusColors.PENDING;
                    const isTop = rank === 1;

                    return (
                      <tr
                        key={result.id}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          background: isTop ? 'rgba(99,102,241,0.04)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isTop ? 'rgba(99,102,241,0.04)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                      >
                        {/* Rank */}
                        <td style={td}>
                          {rank ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {medal ? (
                                <span style={{ fontSize: 18 }}>{medal.emoji}</span>
                              ) : (
                                <span style={{
                                  width: 26, height: 26, borderRadius: '50%', background: '#1e293b',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, color: '#64748b',
                                }}>
                                  {rank}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#334155', fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Candidate */}
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: `hsl(${result.candidateEmail.charCodeAt(0) * 15}, 60%, 28%)`,
                              border: `2px solid hsl(${result.candidateEmail.charCodeAt(0) * 15}, 60%, 38%)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, color: `hsl(${result.candidateEmail.charCodeAt(0) * 15}, 80%, 75%)`,
                              flexShrink: 0,
                            }}>
                              {result.candidateEmail[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                              {result.candidateEmail}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={td}>
                          <span style={{
                            background: sc.bg, color: sc.color,
                            padding: '4px 11px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                            border: `1px solid ${sc.color}33`,
                          }}>
                            {result.status === 'IN_PROGRESS' ? 'In Progress' : result.status.charAt(0) + result.status.slice(1).toLowerCase()}
                          </span>
                        </td>

                        {/* Score */}
                        <td style={td}>
                          <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>
                            {result.totalScore}
                          </span>
                          <span style={{ color: '#475569', fontSize: 12, marginLeft: 2 }}>pts</span>
                        </td>

                        {/* Percentage bar */}
                        <td style={{ ...td, minWidth: 160 }}>
                          <PercentageBar value={result.percentage} />
                        </td>

                        {/* Solved */}
                        <td style={td}>
                          <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: 13 }}>
                            <span style={{ color: '#38bdf8' }}>{result.completedQuestions}</span>
                            <span style={{ color: '#334155' }}>/{result.totalQuestions}</span>
                          </span>
                        </td>

                        {/* Risk */}
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: risk.bg,
                              border: `2px solid ${risk.color}55`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 800, color: risk.color,
                            }}>
                              {result.riskScore}
                            </div>
                            <span style={{ fontSize: 11, color: risk.color, fontWeight: 600 }}>
                              {risk.label}
                            </span>
                          </div>
                        </td>

                        {/* Submitted */}
                        <td style={td}>
                          {result.submittedAt ? (
                            <div>
                              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                                {new Date(result.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                                {new Date(result.submittedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#334155', fontSize: 12 }}>Not submitted</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer note */}
          {!loading && filtered.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right', fontSize: 11, color: '#334155' }}>
              Rank is assigned to completed submissions only, ordered by highest percentage.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const td: React.CSSProperties = {
  padding: '13px 16px',
  verticalAlign: 'middle',
};
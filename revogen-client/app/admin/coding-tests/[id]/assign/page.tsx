'use client';

import React, { useState, useEffect, useCallback, FormEvent, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
  Users,
  Search,
  Mail,
  Clock,
  Shield,
  Check,
  X,
  Send,
  Code,
  Sparkles,
  ChevronLeft,
  FileText,
  BarChart3,
  Loader2,
  AlertTriangle,
  Inbox,
  Trash2,
  CheckCircle2,
  CircleDashed,
  PlayCircle,
  UserCheck,
  UserPlus,
  Info,
  ArrowUpRight,
  Activity,
  Hash,
  Zap,
  Coins,
} from 'lucide-react';

// --- TypeScript Interfaces ---

export interface QuestionDetail {
  id: string;
  title: string;
  difficulty: string;
  category: string;
}

export interface QuestionInfo {
  id: string;
  codingTestId: string;
  questionId: string;
  order: number;
  scoreWeight: number;
  question: QuestionDetail;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  duration: number;
  securityLevel: string;
  createdById: string;
  isActive: boolean;
  questions: QuestionInfo[];
}

export interface Invitation {
  id: string;
  codingTestId: string;
  candidateEmail: string;
  userId: string | null;
  status: string;
  invitedAt: string;
  createdAt: string;
  attemptStatus?: string;
  attemptId?: string | null;
  attemptPercentage?: number | null;
  submittedAt?: string | null;
}

export default function AssignPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  // --- State ---
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [emails, setEmails] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  // Credit state
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [estimateResult, setEstimateResult] = useState<{ requiredCredits: number; currentBalance: number; remainingBalance: number; enoughCredits: boolean } | null>(null);

  // --- Constants ---
  const API_BASE_URL = 'http://localhost:3000';

  // Helper to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // --- API Calls ---

  const fetchAssessment = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch assessment');
      const data: Assessment = await res.json();
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the assessment.');
    }
  }, [assessmentId]);

  const fetchInvitations = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}/invitations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch invitations');
      const data: Invitation[] = await res.json();
      setInvitations(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading invitations.');
    }
  }, [assessmentId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchAssessment(), fetchInvitations()]);
    setLoading(false);
  }, [fetchAssessment, fetchInvitations]);

  // Fetch credit balance
  const fetchBalance = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setCreditBalance(d.balance ?? 0);
      }
    } catch { /* swallow */ }
  }, []);

  // Estimate cost whenever assessment loads or email list changes
  const runEstimate = useCallback(async (securityLevel: string, candidateCount: number) => {
    if (candidateCount < 1) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/credits/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ securityLevel, candidateCount }),
      });
      if (res.ok) setEstimateResult(await res.json());
    } catch { /* swallow */ }
  }, []);

  // Initial Load
  useEffect(() => {
    if (assessmentId) {
      loadData();
      fetchBalance();
    }
  }, [assessmentId, loadData, fetchBalance]);

  // Re-run estimate when assessment loads or email count changes
  const emailCount = useMemo(() =>
    emails.split(/[\s,]+/).filter(e => e.trim() !== '').length,
    [emails]);

  useEffect(() => {
    if (assessment && emailCount > 0) {
      runEstimate(assessment.securityLevel, emailCount);
    } else {
      setEstimateResult(null);
    }
  }, [assessment, emailCount, runEstimate]);

  // --- Handlers ---

  const handleBulkInvite = async (e: FormEvent) => {
    e.preventDefault();

    const emailList = emails.split(/[\s,]+/).filter((email) => email.trim() !== '');

    if (emailList.length === 0) {
      setError('Please enter at least one valid email address.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setInviteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();

      const invitePromises = emailList.map(async (candidateEmail) => {
        const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ candidateEmail }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to invite ${candidateEmail}`);
        }
        return res.json();
      });

      await Promise.all(invitePromises);

      await fetchInvitations();
      await fetchBalance(); // refresh wallet after deduction
      setEmails('');
      setSuccess(`Successfully invited ${emailList.length} candidate(s)!`);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send one or more invitations.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to remove this invitation?')) return;

    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}/coding-tests/${assessmentId}/invitations/${invitationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error('Failed to remove invitation');
      }

      await fetchInvitations();
      setSuccess('Invitation removed successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove invitation.');
    }
  };

  // --- Derived stats ---
  const stats = useMemo(() => {
    const total = invitations.length;
    let pending = 0,
      accepted = 0,
      completed = 0,
      inProgress = 0;
    invitations.forEach((i) => {
      const s = (i.status || '').toUpperCase();
      const a = (i.attemptStatus || '').toUpperCase();
      if (a === 'COMPLETED') completed++;
      else if (a === 'IN_PROGRESS') inProgress++;
      else if (s === 'ACCEPTED') accepted++;
      else pending++;
    });
    return { total, pending, accepted, completed, inProgress };
  }, [invitations]);

  const filteredInvitations = useMemo(() => {
    if (!search.trim()) return invitations;
    const q = search.toLowerCase();
    return invitations.filter(
      (i) =>
        i.candidateEmail.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q) ||
        (i.attemptStatus || '').toLowerCase().includes(q),
    );
  }, [invitations, search]);

  // --- Badge helpers ---
  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    const map: Record<string, string> = {
      PENDING: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
      ACCEPTED: 'bg-blue-500/10 text-blue-300 ring-blue-400/30',
      COMPLETED: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
      EXPIRED: 'bg-slate-500/10 text-slate-400 ring-slate-400/30',
      CANCELLED: 'bg-red-500/10 text-red-300 ring-red-400/30',
    };
    return map[s] || 'bg-slate-500/10 text-slate-300 ring-slate-400/30';
  };

  const securityBadge = (level?: string) => {
    const s = (level || '').toUpperCase();
    if (s.includes('HIGH')) return 'bg-red-500/10 text-red-300 ring-red-400/30';
    if (s.includes('MED')) return 'bg-amber-500/10 text-amber-300 ring-amber-400/30';
    return 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30';
  };

  // --- Render ---

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="h-4 w-40 rounded-md bg-slate-800/60 animate-pulse mb-4" />
            <div className="h-9 w-80 rounded-lg bg-slate-800/60 animate-pulse mb-3" />
            <div className="h-4 w-96 rounded-md bg-slate-800/40 animate-pulse mb-10" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/60 animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-72 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
                <div className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
              </div>
              <div className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!assessment && error) {
    return (
      <>
        <AdminNavbar />
        <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_60%)]" />
          <div className="relative max-w-md w-full text-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 ring-1 ring-red-400/30 flex items-center justify-center mb-5">
              <AlertTriangle className="h-7 w-7 text-red-300" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button
              onClick={() => router.push('/tests')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-blue-400 hover:to-blue-500 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Tests
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />

      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* Ambient backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Toasts */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-xl px-4 py-3 text-sm text-emerald-200 shadow-2xl shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-sm text-red-200 shadow-2xl shadow-red-500/10 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Page Header */}
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between pb-8 border-b border-slate-800/60">
            <div className="min-w-0">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                <button
                  onClick={() => router.push('/admin/tests')}
                  className="hover:text-slate-200 transition-colors"
                >
                  Tests
                </button>
                <span className="text-slate-700">/</span>
                <span className="text-slate-400 truncate max-w-[200px]">{assessment?.title}</span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-200 font-medium">Assign</span>
              </nav>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 ring-1 ring-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <Code className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white truncate">
                    {assessment?.title || 'Coding Assessment'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-400 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    Invite candidates and orchestrate assessment access.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/admin/tests')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-slate-700 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => router.push(`/admin/coding-tests/${assessmentId}`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-slate-700 transition-all"
              >
                <FileText className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => router.push(`/admin/coding-tests/${assessmentId}/results`)}
                className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-blue-400 hover:to-blue-500 transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                View Results
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </header>

          {/* Stat Cards */}
          <section className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              label="Total"
              value={stats.total}
              tone="slate"
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              tone="amber"
              icon={<CircleDashed className="h-4 w-4" />}
            />
            <StatCard
              label="Accepted"
              value={stats.accepted}
              tone="blue"
              icon={<UserCheck className="h-4 w-4" />}
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              tone="cyan"
              icon={<PlayCircle className="h-4 w-4" />}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              tone="emerald"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </section>

          {/* Main grid */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Invite + Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Invite Card */}
              <section className="group relative rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-900/30 backdrop-blur-xl p-6 shadow-2xl shadow-black/20 overflow-hidden">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 ring-1 ring-blue-400/30 flex items-center justify-center">
                      <UserPlus className="h-4.5 w-4.5 text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white tracking-tight">
                        Invite Candidates
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Paste one or more emails separated by commas, spaces, or new lines.
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-800/60 ring-1 ring-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    <Mail className="h-3 w-3" />
                    Bulk invite
                  </span>
                </div>

                <form onSubmit={handleBulkInvite} className="space-y-4">
                  <div className="relative">
                    <label
                      htmlFor="emails"
                      className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2"
                    >
                      Candidate emails
                    </label>
                    <div className="relative rounded-xl ring-1 ring-slate-800 bg-slate-950/60 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500/50 transition-all">
                      <textarea
                        id="emails"
                        placeholder={'candidate1@gmail.com, candidate2@gmail.com\ncandidate3@gmail.com'}
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        required
                        disabled={inviteLoading}
                        rows={5}
                        className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>
                  {/* Credit estimate panel */}
                  {creditBalance !== null && (
                    <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${
                      emails.trim() === ''
                        ? 'border-slate-700/60 bg-slate-900/40'
                        : estimateResult?.enoughCredits
                          ? 'border-emerald-400/30 bg-emerald-500/5'
                          : 'border-red-400/30 bg-red-500/8'
                    }`}>
                      <Coins className={`h-4 w-4 mt-0.5 shrink-0 ${
                        emails.trim() === '' ? 'text-slate-500'
                          : estimateResult?.enoughCredits ? 'text-emerald-400'
                          : 'text-red-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-slate-300 font-medium">
                            🪙 Available: <span className="text-white font-bold">{creditBalance} credits</span>
                          </span>
                          {estimateResult && emails.trim() && (
                            <span className={`font-semibold ${estimateResult.enoughCredits ? 'text-emerald-300' : 'text-red-300'}`}>
                              {estimateResult.enoughCredits ? '✓ Sufficient' : '✗ Insufficient'}
                            </span>
                          )}
                        </div>
                        {estimateResult && emails.trim() && (
                          <div className="mt-1 text-slate-400 text-xs">
                            This assignment will consume{' '}
                            <span className="text-white font-semibold">{estimateResult.requiredCredits} credits</span>
                            {' '}· Remaining: <span className={estimateResult.remainingBalance < 0 ? 'text-red-300 font-semibold' : 'text-slate-300'}>{estimateResult.remainingBalance}</span>
                            {!estimateResult.enoughCredits && (
                              <span className="block mt-1 text-red-300">
                                Need {estimateResult.requiredCredits - estimateResult.currentBalance} more credits.{' '}
                                <a href="/admin/credits/packs" className="underline text-red-200 hover:text-white">Buy Credits →</a>
                              </span>
                            )}
                          </div>
                        )}
                        {emails.trim() === '' && (
                          <div className="mt-0.5 text-slate-500 text-xs">Enter emails above to see credit estimate.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-blue-400" />
                      Each candidate receives an email with a unique access link.
                    </p>
                    <button
                      type="submit"
                      disabled={inviteLoading || !emails.trim() || (estimateResult !== null && !estimateResult.enoughCredits)}
                      className="group/btn relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                    >
                      {inviteLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                          Send invitations
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* Candidates Table */}
              <section className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-900/30 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-800/60 ring-1 ring-slate-700/60 flex items-center justify-center">
                      <Inbox className="h-4 w-4 text-slate-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                        Invited Candidates
                        <span className="inline-flex items-center rounded-md bg-slate-800/80 ring-1 ring-slate-700/60 px-1.5 py-0.5 text-[11px] font-medium text-slate-300">
                          {invitations.length}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">Manage candidate access and track progress.</p>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search candidates…"
                      className="w-full rounded-xl ring-1 ring-slate-800 bg-slate-950/60 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    />
                  </div>
                </div>

                {invitations.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/40 ring-1 ring-slate-700/40 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-slate-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">No candidates invited yet</h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                      Use the form above to invite your first candidate. They'll receive an email instantly.
                    </p>
                  </div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto h-10 w-10 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3">
                      <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-400">No candidates match your search.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/50 border-b border-slate-800/60">
                          <th className="px-5 py-3 font-medium">Candidate</th>
                          <th className="px-5 py-3 font-medium">Account</th>
                          <th className="px-5 py-3 font-medium">Invite</th>
                          <th className="px-5 py-3 font-medium">Attempt</th>
                          <th className="px-5 py-3 font-medium">Invited</th>
                          <th className="px-5 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredInvitations.map((inv) => {
                          const initial = (inv.candidateEmail || '?').charAt(0).toUpperCase();
                          return (
                            <tr
                              key={inv.id}
                              className="group hover:bg-slate-800/20 transition-colors"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500/20 via-slate-700 to-slate-900 ring-1 ring-slate-700/60 flex items-center justify-center text-xs font-semibold text-white shadow-inner">
                                    {initial}
                                  </div>
                                  <span className="truncate font-medium text-slate-100">
                                    {inv.candidateEmail}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
                                    inv.userId
                                      ? 'bg-blue-500/10 text-blue-300 ring-blue-400/30'
                                      : 'bg-slate-500/10 text-slate-400 ring-slate-500/30'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      inv.userId ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'
                                    }`}
                                  />
                                  {inv.userId ? 'Registered' : 'Guest'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${statusBadge(inv.status)}`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {inv.attemptStatus ? (
                                  <div className="flex flex-col gap-1">
                                    <span
                                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
                                        inv.attemptStatus === 'COMPLETED'
                                          ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30'
                                          : inv.attemptStatus === 'IN_PROGRESS'
                                            ? 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/30'
                                            : 'bg-slate-500/10 text-slate-400 ring-slate-500/30'
                                      }`}
                                    >
                                      {inv.attemptStatus === 'COMPLETED'
                                        ? 'Completed'
                                        : inv.attemptStatus === 'IN_PROGRESS'
                                          ? 'In Progress'
                                          : inv.attemptStatus}
                                    </span>
                                    {inv.attemptStatus === 'COMPLETED' &&
                                      inv.attemptPercentage !== null &&
                                      inv.attemptPercentage !== undefined && (
                                        <span
                                          className={`text-xs font-semibold tabular-nums ${
                                            inv.attemptPercentage >= 70
                                              ? 'text-emerald-400'
                                              : inv.attemptPercentage >= 40
                                                ? 'text-amber-400'
                                                : 'text-red-400'
                                          }`}
                                        >
                                          {inv.attemptPercentage.toFixed(1)}%
                                        </span>
                                      )}
                                    {inv.submittedAt && (
                                      <span className="text-[10px] text-slate-500">
                                        {new Date(inv.submittedAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-slate-500/30">
                                    Not started
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs tabular-nums">
                                {new Date(inv.invitedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                                <div className="text-[10px] text-slate-600">
                                  {new Date(inv.invitedAt).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                  {inv.attemptId && (
                                    <button
                                      onClick={() =>
                                        router.push(`/admin/coding-tests/${assessmentId}/results`)
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all"
                                    >
                                      <BarChart3 className="h-3 w-3" />
                                      Report
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemove(inv.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-[11px] font-medium text-red-300 hover:bg-red-500/15 hover:border-red-500/40 transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            {/* Right: Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-4">
                <div className="relative rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-900/30 backdrop-blur-xl p-6 shadow-2xl shadow-black/20 overflow-hidden">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-400/30 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-cyan-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      Assessment Summary
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 ml-10.5">Key information about this test.</p>

                  <dl className="mt-5 space-y-3">
                    <SummaryRow
                      icon={<Hash className="h-3.5 w-3.5" />}
                      label="Title"
                      value={assessment?.title || '—'}
                    />
                    <SummaryRow
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Duration"
                      value={`${assessment?.duration ?? 0} min`}
                    />
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <dt className="text-xs text-slate-400 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-slate-500" />
                        Security Level
                      </dt>
                      <dd>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${securityBadge(assessment?.securityLevel)}`}
                        >
                          {assessment?.securityLevel || '—'}
                        </span>
                      </dd>
                    </div>
                    <SummaryRow
                      icon={<Code className="h-3.5 w-3.5" />}
                      label="Questions"
                      value={`${assessment?.questions.length || 0}`}
                    />
                    <SummaryRow
                      icon={<Users className="h-3.5 w-3.5" />}
                      label="Invited"
                      value={`${invitations.length}`}
                    />
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <dt className="text-xs text-slate-400 flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-slate-500" />
                        Status
                      </dt>
                      <dd>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
                            assessment?.isActive
                              ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30'
                              : 'bg-slate-500/10 text-slate-400 ring-slate-500/30'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              assessment?.isActive
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-slate-500'
                            }`}
                          />
                          {assessment?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 pt-5 border-t border-slate-800/60 space-y-2">
                    <button
                      onClick={() => router.push(`/admin/coding-tests/${assessmentId}/results`)}
                      className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-blue-400 hover:to-blue-500 transition-all"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Results
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={() => router.push('/tests')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-slate-700 transition-all"
                    >
                      Continue
                    </button>
                  </div>
                </div>

                <div className="relative rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 via-slate-900/60 to-slate-900/20 backdrop-blur-xl p-5 overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="relative flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-500/15 ring-1 ring-blue-400/30 flex items-center justify-center">
                      <Info className="h-4.5 w-4.5 text-blue-300" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                        Pro tip
                        <Sparkles className="h-3 w-3 text-blue-300" />
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        Invite multiple candidates at once by pasting a list of emails — one per line
                        or separated by commas. Saves time on large hiring rounds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Local Presentational Components ---

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: 'slate' | 'amber' | 'blue' | 'cyan' | 'emerald';
}) {
  const tones: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
    slate: {
      ring: 'ring-slate-500/30',
      bg: 'bg-slate-500/10',
      text: 'text-slate-300',
      glow: 'from-slate-500/5',
    },
    amber: {
      ring: 'ring-amber-400/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      glow: 'from-amber-500/5',
    },
    blue: {
      ring: 'ring-blue-400/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      glow: 'from-blue-500/5',
    },
    cyan: {
      ring: 'ring-cyan-400/30',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-300',
      glow: 'from-cyan-500/5',
    },
    emerald: {
      ring: 'ring-emerald-400/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      glow: 'from-emerald-500/5',
    },
  };
  const t = tones[tone];
  return (
    <div
      className={`group relative rounded-2xl border border-slate-800/80 bg-gradient-to-br ${t.glow} via-slate-900/60 to-slate-900/30 backdrop-blur-xl p-4 shadow-lg shadow-black/10 hover:border-slate-700/80 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center ring-1 ring-inset ${t.ring} ${t.bg} ${t.text}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-xs text-slate-400 flex items-center gap-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        {label}
      </dt>
      <dd className="text-xs font-medium text-slate-100 text-right truncate max-w-[60%]">{value}</dd>
    </div>
  );
}

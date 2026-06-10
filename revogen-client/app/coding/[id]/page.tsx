"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <div className="flex items-center gap-3 text-[#858585]">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm font-mono">Loading editor…</span>
      </div>
    </div>
  ),
});

type Language = "java" | "python" | "javascript";

interface StarterCode {
  java?: string;
  python?: string;
  javascript?: string;
}

interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  starterCode: StarterCode;
}

interface Question {
  id: string;
  codingQuestion: CodingQuestion;
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
}

const LANGUAGE_LABELS: Record<Language, string> = {
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
};

const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  java: "java",
  python: "python",
  javascript: "javascript",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

const DEFAULT_PLACEHOLDER: Record<Language, string> = {
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `def solution():\n    # Write your solution here\n    pass`,
  javascript: `function solution() {\n    // Write your solution here\n}`,
};

export default function CodingAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [language, setLanguage] = useState<Language>("javascript");
  const [editorCode, setEditorCode] = useState<string>("");

  const getStarterCode = useCallback(
    (question: CodingQuestion, lang: Language): string => {
      const code = question.starterCode?.[lang];
      return code || DEFAULT_PLACEHOLDER[lang];
    },
    []
  );

  useEffect(() => {
    if (!id) return;
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:3000/coding-tests/${id}`);
        if (!res.ok) throw new Error(`Failed to load assessment (${res.status})`);
        const data: AssessmentData = await res.json();
        setAssessment(data);
        if (data.questions.length > 0) {
          setEditorCode(getStarterCode(data.questions[0].codingQuestion, language));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  useEffect(() => {
    if (!assessment) return;
    const q = assessment.questions[activeQuestionIndex];
    if (q) setEditorCode(getStarterCode(q.codingQuestion, language));
  }, [activeQuestionIndex, language, assessment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#2a2a2a]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
          </div>
          <p className="text-[#666] text-sm font-mono tracking-wider">Loading assessment…</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Failed to load assessment</p>
            <p className="text-[#666] text-sm">{error || "Assessment not found"}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[#ccc] text-sm rounded-lg hover:border-violet-500/50 hover:text-white transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const activeQuestion = assessment.questions[activeQuestionIndex];
  const cq = activeQuestion?.codingQuestion;

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[#1f1f1f] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-xs">{assessment.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#555] text-xs font-mono">{assessment.questions.length} question{assessment.questions.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* LEFT PANEL */}
          <Panel defaultSize={40} minSize={25} maxSize={55}>
            <div className="h-full bg-[#111] flex flex-col overflow-hidden border-r border-[#1f1f1f]">
              {/* Question navigator */}
              <div className="px-4 pt-4 pb-3 border-b border-[#1a1a1a] shrink-0">
                <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-3">Questions</p>
                <div className="flex flex-wrap gap-2">
                  {assessment.questions.map((q, idx) => {
                    const diff = q.codingQuestion.difficulty;
                    const isActive = idx === activeQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuestionIndex(idx)}
                        className={`
                          relative px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all duration-150
                          ${isActive
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                            : "bg-[#1a1a1a] text-[#777] border border-[#242424] hover:border-[#333] hover:text-[#aaa]"
                          }
                        `}
                      >
                        <span>Q{idx + 1}</span>
                        {!isActive && (
                          <span
                            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                              diff === "Easy" ? "bg-emerald-500" : diff === "Medium" ? "bg-amber-500" : "bg-rose-500"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question detail */}
              {cq && (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
                  {/* Title + badges */}
                  <div className="space-y-3">
                    <h2 className="text-white font-semibold text-base leading-snug">{cq.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${DIFFICULTY_STYLES[cq.difficulty] || DIFFICULTY_STYLES.Medium}`}>
                        {cq.difficulty}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/25">
                        {cq.category}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <Section label="Description">
                    <p className="text-[#c0c0c0] text-sm leading-relaxed whitespace-pre-wrap">{cq.description}</p>
                  </Section>

                  {/* Constraints */}
                  {cq.constraints && (
                    <Section label="Constraints">
                      <p className="text-[#c0c0c0] text-sm leading-relaxed font-mono whitespace-pre-wrap">{cq.constraints}</p>
                    </Section>
                  )}

                  {/* Input Format */}
                  {cq.inputFormat && (
                    <Section label="Input Format">
                      <p className="text-[#c0c0c0] text-sm leading-relaxed whitespace-pre-wrap">{cq.inputFormat}</p>
                    </Section>
                  )}

                  {/* Output Format */}
                  {cq.outputFormat && (
                    <Section label="Output Format">
                      <p className="text-[#c0c0c0] text-sm leading-relaxed whitespace-pre-wrap">{cq.outputFormat}</p>
                    </Section>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1 bg-[#1a1a1a] hover:bg-violet-600/60 transition-colors duration-150 cursor-col-resize group relative">
            <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-violet-600/20 transition-colors" />
          </PanelResizeHandle>

          {/* RIGHT PANEL */}
          <Panel defaultSize={60} minSize={35}>
            <div className="h-full bg-[#141414] flex flex-col overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-b border-[#1f1f1f] shrink-0">
                <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-0.5 border border-[#242424]">
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                        ${language === lang
                          ? "bg-[#2a2a2a] text-white shadow-sm"
                          : "text-[#666] hover:text-[#aaa]"
                        }
                      `}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  language={MONACO_LANGUAGE_MAP[language]}
                  value={editorCode}
                  onChange={(val) => setEditorCode(val ?? "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    lineHeight: 22,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 2,
                    insertSpaces: true,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: "gutter",
                    cursorBlinking: "smooth",
                    smoothScrolling: true,
                    contextmenu: true,
                    scrollbar: {
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                  }}
                />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[#444] text-[10px] font-mono uppercase tracking-widest">{label}</p>
      <div className="bg-[#161616] rounded-lg px-3.5 py-3 border border-[#1e1e1e]">
        {children}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const EVENT_LABELS: Record<string, string> = {
  TAB_SWITCH: "Tab Switch Detected",
  FULLSCREEN_EXIT: "Fullscreen Exited",
  DEVTOOLS_OPENED: "Developer Tools Opened",
  LARGE_PASTE: "Large Paste Detected",
  REFRESH_ATTEMPT: "Page Refresh Attempt",
};

export default function ResultPage() {
  const params = useParams();

const attemptId =
  params?.attemptId as string;

  const [summary, setSummary] =
  useState<any>(null);

  const [reportDetails, setReportDetails] =
  useState<any>(null);

const [questions, setQuestions] =
  useState<any[]>([]);

const [proctoring, setProctoring] =
  useState<any>(null);

const [securityEvents, setSecurityEvents] =
  useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
  const fetchResult = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      const res = await fetch(
        `http://localhost:3000/coding-tests/result/${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      console.log("Result API:", data);

      if (!res.ok) {
        console.error(data);
        return;
      }

      setSummary(data.summary);

      setReportDetails(
        data.reportDetails,
      );

      setQuestions(
        Array.isArray(data.questions)
          ? data.questions
          : [],
      );

      setProctoring(
        data.proctoring,
      );

      setSecurityEvents(
        Array.isArray(data.securityEvents)
          ? data.securityEvents
          : [],
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (attemptId) {
    fetchResult();
  }
}, [attemptId]);
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Result...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Result Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Coding Assessment Report
        </h1>

        {/* Summary */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <div className="text-gray-400 text-sm">
              Total Score
            </div>

            <div className="text-3xl font-bold mt-2">
              {summary.totalScore}
            </div>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <div className="text-gray-400 text-sm">
              Percentage
            </div>

            <div className="text-3xl font-bold mt-2">
              {summary.percentage}%
            </div>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <div className="text-gray-400 text-sm">
              Questions Solved
            </div>

            <div className="text-3xl font-bold mt-2">
              {summary.completedQuestions}/
              {summary.totalQuestions}
            </div>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <div className="text-gray-400 text-sm">
              Violations
            </div>

            <div className="text-3xl font-bold mt-2 text-amber-400">
              {summary.securityViolations}
            </div>
          </div>

        </div>

        {/* Assessment Details */}

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-8">

          <h2 className="text-xl font-semibold mb-4">
            Assessment Details
          </h2>

          <div className="space-y-3">

  <div className="flex justify-between">
    <span className="text-gray-400">
      Attempt ID
    </span>

    <span>{summary.id}</span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">
      Test Name
    </span>

    <span>
      {reportDetails?.testName}
    </span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">
      Duration
    </span>

    <span>
      {reportDetails?.duration} mins
    </span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">
      Status
    </span>

    <span className="text-green-400">
      {summary.status}
    </span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">
      Started At
    </span>

    <span>
      {reportDetails?.startedAt
        ? new Date(
            reportDetails.startedAt
          ).toLocaleString()
        : "-"}
    </span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">
      Submitted At
    </span>

    <span>
      {reportDetails?.submittedAt
        ? new Date(
            reportDetails.submittedAt
          ).toLocaleString()
        : "-"}
    </span>
  </div>

</div>

        </div>

        {/* Question Wise Results */}

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-8">

          <h2 className="text-xl font-semibold mb-6">
            Question Wise Results
          </h2>

          <div className="space-y-4">

            {questions.map((q) => (
  <div
    key={q.questionId}
    className="border border-[#2a2a2a] rounded-lg p-4"
  >
    <div className="flex justify-between items-center">

      <div>
        <h3 className="font-semibold text-lg">
          {q.title}
        </h3>

        <p className="text-sm text-gray-400">
          {q.difficulty}
        </p>
      </div>

      <div
        className={
          q.status === "PASSED"
            ? "text-green-400"
            : q.status === "FAILED"
            ? "text-red-400"
            : "text-gray-400"
        }
      >
        {q.status}
      </div>

    </div>

    <div className="grid grid-cols-4 gap-4 mt-4">

      <div>
        <div className="text-gray-400 text-sm">
          Score
        </div>

        <div>
          {q.score}
        </div>
      </div>

      <div>
        <div className="text-gray-400 text-sm">
          Cases
        </div>

        <div>
          {q.passedCases}/{q.totalCases}
        </div>
      </div>

      <div>
        <div className="text-gray-400 text-sm">
          Language
        </div>

        <div>
          {q.language ?? "-"}
        </div>
      </div>

      <div>
        <div className="text-gray-400 text-sm">
          Attempted
        </div>

        <div>
          {q.attempted ? "Yes" : "No"}
        </div>
      </div>

    </div>
  </div>
))}

          </div>

        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mb-8">

  <h2 className="text-xl font-semibold mb-6">
    Proctoring Summary
  </h2>

  <div className="grid grid-cols-3 gap-4">

    <div className="bg-[#0f0f0f] rounded-lg p-4">
      <div className="text-gray-400 text-sm">
        Risk Score
      </div>

      <div className="text-3xl font-bold">
        {proctoring?.riskScore ?? 0}
      </div>
    </div>

    <div className="bg-[#0f0f0f] rounded-lg p-4">
      <div className="text-gray-400 text-sm">
        Risk Level
      </div>

      <div className="text-2xl font-bold">
        {proctoring?.riskLevel}
      </div>
    </div>

    <div className="bg-[#0f0f0f] rounded-lg p-4">
      <div className="text-gray-400 text-sm">
        Total Events
      </div>

      <div className="text-3xl font-bold">
        {proctoring?.totalEvents ?? 0}
      </div>
    </div>

  </div>

</div>

        {/* Security Timeline */}

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-6">
            Security Timeline
          </h2>

          {securityEvents.length === 0 ? (
            <p className="text-gray-500">
              No security events found.
            </p>
          ) : (
            <div className="space-y-4">

              {securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-[#2a2a2a] rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">

                    <div className="font-semibold text-amber-400">
                      {EVENT_LABELS[
                        event.eventType
                      ] ?? event.eventType}
                    </div>

                    <div className="text-sm text-gray-500">
                      {new Date(
                        event.createdAt
                      ).toLocaleString()}
                    </div>

                  </div>

                  {event.details && (
                    <div className="text-sm text-gray-300">
                      {event.details}
                    </div>
                  )}
                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
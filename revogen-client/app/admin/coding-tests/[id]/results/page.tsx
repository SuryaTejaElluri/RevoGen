"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Attempt {
   
  id: string;
  candidateEmail?: string;
  candidateName?: string;
  totalScore: number;
  percentage: number;
  completedQuestions: number;
  totalQuestions: number;
  riskLevel: string;
  riskScore: number;
  submittedAt: string;
}

export default function CodingResultsPage() {
  const { id } = useParams();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadAttempts();
    }
  }, [id]);

  const loadAttempts = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token");

      const res = await fetch(
        `http://localhost:3000/coding-tests/${id}/attempts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      console.log("Attempts API Response:", data);

      if (!res.ok) {
        setError(
          data?.message ||
            `Request failed (${res.status})`
        );
        setAttempts([]);
        return;
      }

      setAttempts(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load attempts");
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="text-red-500 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Coding Assessment Results
      </h1>

      {attempts.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          No completed attempts found.
        </div>
      ) : (
        <div className="overflow-auto border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-black-100">

                
<th className="p-3">Email</th>
                <th className="p-3">
                  Attempt
                </th>

                <th className="p-3">
                  Score
                </th>

                <th className="p-3">
                  %
                </th>

                <th className="p-3">
                  Questions
                </th>

                <th className="p-3">
                  Risk
                </th>

                <th className="p-3">
                  Submitted
                </th>

                <th className="p-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {attempts.map(
                (attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-t"
                  >

                                    <td className="p-3">
  {attempt.candidateEmail || "-"}
</td>

                    <td className="p-3">
                      {attempt.id.slice(
                        0,
                        8
                      )}
                    </td>
    
                    

                    <td className="p-3">
                      {
                        attempt.totalScore
                      }
                    </td>

                    <td className="p-3">
                      {
                        attempt.percentage
                      }
                      %
                    </td>
                    

                    <td className="p-3">
                      {
                        attempt.completedQuestions
                      }
                      /
                      {
                        attempt.totalQuestions
                      }
                    </td>

                    <td className="p-3">
                      <span
                        className={
                          attempt.riskLevel ===
                          "HIGH"
                            ? "text-red-500"
                            : attempt.riskLevel ===
                              "MEDIUM"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }
                      >
                        {
                          attempt.riskLevel
                        }
                      </span>{" "}
                      (
                      {
                        attempt.riskScore
                      }
                      )
                    </td>

                    <td className="p-3">
                      {attempt.submittedAt
                        ? new Date(
                            attempt.submittedAt
                          ).toLocaleString()
                        : "-"}
                    </td>
                    

                    <td className="p-3">
                      <Link
                        href={`/coding/results/${attempt.id}`}
                        className="px-3 py-2 bg-blue-600 text-white rounded"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
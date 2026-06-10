'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResultsRouterPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          `http://localhost:3000/tests/${id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const test =
        await response.json();

      if (
        test.securityLevel ===
        'PRO'
      ) {
        router.replace(
          `/admin/tests/${id}/results/pro`,
        );
      } else {
        router.replace(
          `/admin/tests/${id}/results/basic`,
        );
      }
    } catch (error) {
      console.error(error);

      router.replace(
        `/admin/tests/${id}`,
      );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      Loading Results...
    </div>
  );
}
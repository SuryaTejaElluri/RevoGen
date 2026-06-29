'use client';
import { API_BASE_URL } from '@/lib/api';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResultsRouter() {
  const params = useParams();
  const router = useRouter();

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
          `${API_BASE_URL}/tests/${params.id}`,
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
          `/admin/tests/${params.id}/results/pro`,
        );
      } else {
        router.replace(
          `/admin/tests/${params.id}/results/basic`,
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        padding: '50px',
      }}
    >
      Loading Results...
    </div>
  );
}
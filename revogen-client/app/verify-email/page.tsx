'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${token}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        setSuccess(true);
        setMessage('Email verified successfully! Redirecting to login...');

        setTimeout(() => {
          router.push('/login');
        }, 3000);

      } catch (err: any) {
        setSuccess(false);
        setMessage(err.message || 'Verification failed.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-lg text-center">

        {loading ? (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Verifying Email...
            </h1>

            <p>Please wait...</p>
          </>
        ) : success ? (
          <>
            <div className="text-6xl mb-4">
              ✅
            </div>

            <h1 className="text-3xl font-bold text-green-600 mb-4">
              Email Verified
            </h1>

            <p>{message}</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">
              ❌
            </div>

            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Verification Failed
            </h1>

            <p className="mb-6">
              {message}
            </p>

            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Go to Login
            </button>
          </>
        )}

      </div>

    </div>
  );
}
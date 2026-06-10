'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const styles = `
:root {
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --accent-color: #2563eb;
  --accent-hover: #1d4ed8;
  --border-color: #e2e8f0;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

[data-theme='dark'] {
  --bg-color: #0f172a;
  --card-bg: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent-color: #3b82f6;
  --accent-hover: #60a5fa;
  --border-color: #334155;
  --shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--bg-color);
  color: var(--text-primary);
  transition: background 0.3s ease;
  font-family: Inter, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(320px,1fr));
  gap: 24px;
}

.test-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
  transition: all .25s ease;
}

.test-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent-color);
}

.test-card h2 {
  margin: 0 0 14px;
}

.metadata {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.metadata p {
  margin: 8px 0;
}

.btn-start {
  width: 100%;
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: .2s ease;
}

.btn-start:hover {
  background: var(--accent-hover);
}

.theme-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 60px;
}

@media (max-width:768px){
  .header-section{
    flex-direction:column;
    align-items:stretch;
  }

  .theme-toggle{
    width:100%;
  }
}
`;

interface Test {
  id: string;
  title: string;
  category: string;
  duration: number;
}

export default function AssignedTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadTests();

    const savedTheme =
      localStorage.getItem('theme') || 'light';

    setTheme(savedTheme);

    document.documentElement.setAttribute(
      'data-theme',
      savedTheme
    );
  }, []);

  const toggleTheme = () => {
    const newTheme =
      theme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);

    localStorage.setItem('theme', newTheme);

    document.documentElement.setAttribute(
      'data-theme',
      newTheme
    );
  };

  const loadTests = async () => {
    try {
      const token =
        localStorage.getItem('access_token');

      const response = await fetch(
        'http://localhost:3000/tests/assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setTests(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <Navbar />

      <div className="container">
        <div className="header-section">
          <h1 className="title">
            Assigned Tests
          </h1>

          <button
            onClick={toggleTheme}
            className="theme-toggle"
          >
            {theme === 'light'
              ? '🌙 Dark Mode'
              : '☀️ Light Mode'}
          </button>
        </div>

        {tests.length === 0 ? (
          <div className="empty-state">
            No assigned tests available.
          </div>
        ) : (
          <div className="test-grid">
            {tests.map((test) => (
              <div
                key={test.id}
                className="test-card"
              >
                <h2>{test.title}</h2>

                <div className="metadata">
                  <p>
                    📁 Category: {test.category}
                  </p>

                  <p>
                    ⏱️ Duration: {test.duration} mins
                  </p>
                </div>

                <Link href={`/tests/${test.id}`}>
                  <button className="btn-start">
                    Start Test
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
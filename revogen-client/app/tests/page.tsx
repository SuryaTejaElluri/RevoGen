'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Test {
  id: string;
  title: string;
  category: string;
  duration: number;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/tests')
      .then((res) => res.json())
      .then((data) => {
        setTests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h1>Loading tests...</h1>;
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1>Available Tests</h1>

      {tests.map((test) => (
        <div
          key={test.id}
          style={{
            border: '1px solid #ccc',
            padding: '20px',
            marginTop: '15px',
            borderRadius: '10px',
          }}
        >
          <h2>{test.title}</h2>

          <p>Category: {test.category}</p>

          <p>Duration: {test.duration} mins</p>

          <Link href={`/tests/${test.id}`}>
  <button>
    Start Test
  </button>
</Link>
        </div>
      ))}
    </div>
  );
}
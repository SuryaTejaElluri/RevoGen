'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
export default function ResumePage() {
  const [title, setTitle] =
    useState('');

  const [file, setFile] =
    useState<File | null>(null);

  const [resumes, setResumes] =
    useState<any[]>([]);
  const [analysis, setAnalysis] =
  useState<any>(null);

  const loadResumes = async () => {
    const token =
      localStorage.getItem(
        'access_token',
      );

    const response = await fetch(
      'http://localhost:3000/resumes',
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );

    const data =
      await response.json();

    setResumes(data);
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const uploadResume = async () => {
    if (!file || !title) {
      alert(
        'Title and Resume required',
      );
      return;
    }

    const token =
      localStorage.getItem(
        'access_token',
      );

    const formData =
      new FormData();

    formData.append(
      'title',
      title,
    );

    formData.append(
      'resume',
      file,
    );

    const response = await fetch(
      'http://localhost:3000/resumes/upload',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: formData,
      },
    );

    if (!response.ok) {
      alert(
        'Upload failed',
      );
      return;
    }

    alert(
      'Resume uploaded successfully',
    );

    setTitle('');
    setFile(null);

    loadResumes();
  };

  const analyzeResume =
    async (id: string) => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          `http://localhost:3000/resumes/${id}/analyze`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      console.log(data);

      setAnalysis(data);

      loadResumes();
    };

  return (
    <>
      <Navbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <h1>
          Resume Upload
        </h1>

        <br />

        <input
          placeholder="Resume Title"
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value,
            )
          }
        />

        <br />
        <br />

        <input
          type="file"
          onChange={(e) =>
            setFile(
              e.target.files?.[0] ||
                null,
            )
          }
        />

        <br />
        <br />

        <button
          onClick={uploadResume}
        >
          Upload Resume
        </button>

        <hr />

        <h2>
          My Resumes
        </h2>

        {analysis && (
  <div
    style={{
      marginTop: '30px',
      border: '2px solid green',
      padding: '20px',
    }}
  >
    <h2>
      ATS Score:
      {' '}
      {analysis.atsScore}
    </h2>

    <h3>Skills</h3>

    <ul>
      {analysis.skills?.map(
        (
          skill: string,
          index: number,
        ) => (
          <li key={index}>
            {skill}
          </li>
        ),
      )}
    </ul>

    <h3>
      Missing Skills
    </h3>

    <ul>
      {analysis.missingSkills?.map(
        (
          skill: string,
          index: number,
        ) => (
          <li key={index}>
            {skill}
          </li>
        ),
      )}
    </ul>
  </div>
)}

        {resumes.map(
          (resume) => (
            <div
              key={resume.id}
              style={{
                border:
                  '1px solid gray',
                padding: '15px',
                marginTop: '10px',
              }}
            >
              <h3>
                {resume.title}
              </h3>

              <p>
                {resume.fileType}
              </p>

              <button
                onClick={() =>
                  analyzeResume(
                    resume.id,
                  )
                }
              >
                Analyze Resume
              </button>
            </div>
          ),
        )}
      </div>
    </>
  );
}
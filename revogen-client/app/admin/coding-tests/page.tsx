"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function CodingTestsListPage() {
  const router = useRouter();
  const [tests, setTests] =
  useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] =
  useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const token =
  localStorage.getItem(
    'access_token',
  );

const response =
  await fetch(
    'http://localhost:3000/coding-tests',
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    },
  );

const data =
  await response.json();

setTests(
  Array.isArray(data)
    ? data
    : [],
);
    } catch (error) {
      console.error(error);
      alert('Failed to load coding tests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter(test => 
      test.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tests, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;
    setIsDeleting(true);
    try {
      const token =
  localStorage.getItem(
    'access_token',
  );

await fetch(
  `http://localhost:3000/coding-tests/${testToDelete.id}`,
  {
    method: 'DELETE',

    headers: {
      Authorization:
        `Bearer ${token}`,
    },
  },
);
      await loadTests();
      setIsDeleteModalOpen(false);
      setTestToDelete(null);
    } catch (error) {
      console.error(error);
      alert('Failed to delete test');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Coding Assessments</h1>
            <p className="text-sm text-gray-400 mt-1">Manage coding assessments and question assignments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadTests}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
            <Link 
              href="/admin/coding-tests/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create Coding Assessment
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <input 
            type="text"
            placeholder="Search by Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/3 bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Table/List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading tests...</div>
          ) : filteredTests.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-white">No Coding Assessments Found</h3>
              <p className="text-gray-400 text-sm">Create your first coding assessment to get started.</p>
              <Link 
                href="/admin/coding-tests/create"
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Assessment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-950/50 border-b border-gray-800 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium">Questions</th>
                    <th className="px-6 py-4 font-medium">Created Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTests.map(test => (
                    <tr key={test.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{test.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-medium">
                          {test.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">{test.duration} mins</td>
                      <td className="px-6 py-4">{test.questions?.length || test.questionIds?.length || 0}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button 
                          onClick={() => router.push(`/admin/coding-tests/${test.id}`)}
                          className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setTestToDelete(test);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Delete Assessment</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">"{testToDelete?.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-transparent border border-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
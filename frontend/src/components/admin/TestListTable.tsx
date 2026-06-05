"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Link from 'next/link';

interface ShortfallItem {
  subject: string;
  type: string;
  needed: number;
  available: number;
}

export default function TestListTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // NTA Mains Generator states
  const [ntaTitle, setNtaTitle] = useState('');
  const [ntaScheduledAt, setNtaScheduledAt] = useState('');
  const [ntaError, setNtaError] = useState<string | null>(null);
  const [ntaShortfall, setNtaShortfall] = useState<ShortfallItem[]>([]);
  const [ntaSuccess, setNtaSuccess] = useState<boolean>(false);

  // Fetch Tests list
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminTests', page, limit],
    queryFn: () => adminApi.getTests({ page, limit }),
  });

  // Publish toggle mutation
  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminApi.publishTest(id, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
    },
  });

  // NTA Generator mutation
  const ntaMutation = useMutation({
    mutationFn: ({ title, scheduledAt }: { title: string; scheduledAt?: string }) =>
      adminApi.createNtaMainsTest(title, scheduledAt || null),
    onSuccess: () => {
      setNtaTitle('');
      setNtaScheduledAt('');
      setNtaShortfall([]);
      setNtaError(null);
      setNtaSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
    },
    onError: (err: unknown) => {
      const errorWithResponse = err as { response?: { data?: { shortfall?: ShortfallItem[]; error?: string } }; message?: string };
      const respData = errorWithResponse.response?.data;
      if (respData && respData.shortfall) {
        setNtaShortfall(respData.shortfall);
        setNtaError(respData.error || 'NTA generation shortfall occurred.');
      } else {
        setNtaError(errorWithResponse.message || 'Failed to generate NTA test.');
        setNtaShortfall([]);
      }
      setNtaSuccess(false);
    }
  });

  const handlePublishToggle = (id: string, currentStatus: boolean) => {
    publishMutation.mutate({ id, isPublished: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to soft-delete this test? Attempts and relations will be preserved but test will be hidden.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateNta = (e: React.FormEvent) => {
    e.preventDefault();
    setNtaError(null);
    setNtaShortfall([]);
    setNtaSuccess(false);

    if (!ntaTitle.trim()) {
      setNtaError('Title is required to generate NTA Mains test.');
      return;
    }

    ntaMutation.mutate({
      title: ntaTitle,
      scheduledAt: ntaScheduledAt || undefined
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Test Administration</h2>
          <p className="text-xs text-slate-400 mt-1">Configure JEE mock tests, arrange sections, and publish them to students.</p>
        </div>
        <Link href="/admin/tests/new" passHref legacyBehavior>
          <Button className="bg-white text-slate-950 hover:bg-slate-100">
            Create Test Metadata
          </Button>
        </Link>
      </div>

      {/* Main Grid: List + NTA Generator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Test Table List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Active Test Inventories</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto dark:border-white"></div>
              <p className="text-sm text-slate-500">Loading tests...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-rose-500">
              Failed to load tests: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : !data?.data?.tests.length ? (
            <div className="p-12 text-center text-slate-500">
              No tests created yet. Use the generator or manual creation buttons.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950">
                      <th className="p-4">Title</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Duration & Marks</th>
                      <th className="p-4">Publishing Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.tests.map((test) => (
                      <tr key={test.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4 align-middle">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{test.title}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {test.scheduled_at ? `Scheduled: ${new Date(test.scheduled_at).toLocaleString()}` : 'No schedule (Always Available)'}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="inline-block px-2 py-0.5 border border-slate-200 rounded-md font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400">
                            {test.exam_type} • {test.type}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="font-bold text-slate-700 dark:text-slate-300">{test.duration_minutes} Minutes</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{test.total_marks} Marks</div>
                        </td>
                        <td className="p-4 align-middle">
                          <button
                            onClick={() => test.id && handlePublishToggle(test.id, !!test.is_published)}
                            disabled={publishMutation.isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold transition-all ${
                              test.is_published
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-slate-100 text-slate-600 border-slate-250 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${test.is_published ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            {test.is_published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/admin/tests/${test.id}/edit`} passHref legacyBehavior>
                              <a title="Edit Metadata" className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </a>
                            </Link>
                            <Link href={`/admin/tests/${test.id}/questions`} passHref legacyBehavior>
                              <a title="Manage Questions" className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 bg-indigo-50/10 hover:border-indigo-200 hover:text-indigo-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </a>
                            </Link>
                            <Link href={`/admin/tests/${test.id}/publish`} passHref legacyBehavior>
                              <a title="View Publish Summary" className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </a>
                            </Link>
                            <button
                              onClick={() => test.id && handleDelete(test.id)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/20"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Page <strong className="text-slate-850 dark:text-slate-200">{page}</strong> of <strong className="text-slate-850 dark:text-slate-200">{data.data.totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= data.data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: NTA Mains Random Generator */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
              </svg>
              NTA Mains Factory
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Generates a standard 75-question paper (25 questions each for Physics, Chemistry, Maths) randomly.</p>
          </div>

          {ntaSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-3 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Mock test successfully generated and saved as Draft! You can view it in the active list.
            </div>
          )}

          {ntaError && (
            <div className="rounded-lg bg-rose-50 border border-rose-250 dark:bg-rose-950/20 dark:border-rose-900/30 p-3 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              {ntaError}
            </div>
          )}

          {/* Shortfall inventory details */}
          {ntaShortfall.length > 0 && (
            <div className="p-3 border border-rose-100 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-950/10 rounded-xl space-y-2">
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Shortfall details:</span>
              <ul className="text-[10px] text-rose-600 dark:text-rose-400 space-y-1">
                {ntaShortfall.map((sf, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{sf.subject} ({sf.type}):</span>
                    <span className="font-bold">Missing {sf.needed - sf.available} (Available: {sf.available}, Need: {sf.needed})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleGenerateNta} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Test Title *</label>
              <Input
                type="text"
                placeholder="e.g. NTA Full Mock Test - 05"
                value={ntaTitle}
                onChange={(e) => setNtaTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Scheduled At (Optional)</label>
              <Input
                type="datetime-local"
                value={ntaScheduledAt}
                onChange={(e) => setNtaScheduledAt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              isLoading={ntaMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 mt-2"
            >
              Generate Mock Exam
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

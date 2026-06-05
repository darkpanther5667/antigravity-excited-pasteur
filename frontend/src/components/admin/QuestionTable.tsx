"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, QuestionData } from '../../lib/api/adminApi';
import { Button } from '../ui/Button';
import { MathText } from '../ui/MathText';
import Link from 'next/link';

export default function QuestionTable() {
  const queryClient = useQueryClient();
  
  // Filter states
  const [subject, setSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [examType, setExamType] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Preview state
  const [previewQuestion, setPreviewQuestion] = useState<QuestionData | null>(null);

  // Fetch chapters and topics dynamically
  const { data: chaptersData } = useQuery({
    queryKey: ['chapters', subject],
    queryFn: () => adminApi.getChapters(subject),
    enabled: !!subject,
  });

  const { data: topicsData } = useQuery({
    queryKey: ['topics', subject, chapter],
    queryFn: () => adminApi.getTopics(subject, chapter),
    enabled: !!subject && !!chapter,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [subject, difficulty, type, examType, year, chapter, topic]);

  // Reset chapter/topic if subject changes
  useEffect(() => {
    setChapter('');
    setTopic('');
  }, [subject]);

  // Reset topic if chapter changes
  useEffect(() => {
    setTopic('');
  }, [chapter]);

  // Fetch Questions
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminQuestions', { subject, difficulty, type, examType, year, chapter, topic, page, limit }],
    queryFn: () => adminApi.getQuestions({
      subject: subject || undefined,
      difficulty: difficulty || undefined,
      type: type || undefined,
      exam_type: examType || undefined,
      year: year ? parseInt(year) : undefined,
      chapter: chapter || undefined,
      topic: topic || undefined,
      page,
      limit,
    }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      if (previewQuestion) setPreviewQuestion(null);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to soft-delete this question?')) {
      deleteMutation.mutate(id);
    }
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'HARD': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeBadgeColor = (t: string) => {
    switch (t) {
      case 'SINGLE': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'MULTI': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'INTEGER': return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
      case 'MATRIX': return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Question Bank Management</h2>
          <p className="text-xs text-slate-400 mt-1">Manage, filter, create, and bulk upload question materials.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/questions/bulk-upload" passHref legacyBehavior>
            <Button variant="outline" className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800">
              Bulk Upload (CSV)
            </Button>
          </Link>
          <Link href="/admin/questions/new" passHref legacyBehavior>
            <Button className="bg-white text-slate-950 hover:bg-slate-100">
              Create Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Questions
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Subject */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">All Subjects</option>
              <option value="PHYSICS">Physics</option>
              <option value="CHEMISTRY">Chemistry</option>
              <option value="MATHS">Mathematics</option>
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chapter</label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              disabled={!subject}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">All Chapters</option>
              {chaptersData?.data?.chapters.map((chap) => (
                <option key={chap} value={chap}>{chap}</option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={!chapter}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">All Topics</option>
              {topicsData?.data?.topics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Question Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">All Types</option>
              <option value="SINGLE">Single Choice</option>
              <option value="MULTI">Multi Choice</option>
              <option value="INTEGER">Integer / Numerical</option>
              <option value="MATRIX">Matrix Matching</option>
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="">All Exams</option>
              <option value="MAINS">JEE Mains</option>
              <option value="ADVANCED">JEE Advanced</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year</label>
            <input
              type="number"
              placeholder="e.g. 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2000"
              max="2025"
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSubject('');
                setDifficulty('');
                setType('');
                setExamType('');
                setYear('');
                setChapter('');
                setTopic('');
              }}
              variant="outline"
              className="w-full text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main layout: Table + Preview panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto dark:border-white"></div>
              <p className="text-sm text-slate-500">Loading questions...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-rose-500">
              Failed to load questions: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : !data?.data?.questions.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-500">No questions found matching the criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950">
                      <th className="p-4">Subject</th>
                      <th className="p-4">Chapter & Topic</th>
                      <th className="p-4">Tags</th>
                      <th className="p-4">Question Text</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.questions.map((q) => (
                      <tr
                        key={q.id}
                        onClick={() => setPreviewQuestion(q)}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors dark:border-slate-850 dark:hover:bg-slate-800/40 ${
                          previewQuestion?.id === q.id ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                        }`}
                      >
                        <td className="p-4 align-top">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{q.subject}</span>
                        </td>
                        <td className="p-4 align-top max-w-[200px] truncate-2-lines">
                          <div className="font-bold text-xs text-slate-700 dark:text-slate-300">{q.chapter}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{q.topic}</div>
                        </td>
                        <td className="p-4 align-top space-y-1">
                          <div className="flex flex-wrap gap-1">
                            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${getDifficultyBadgeColor(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${getTypeBadgeColor(q.type)}`}>
                              {q.type}
                            </span>
                          </div>
                          <div className="text-[9px] font-medium text-slate-400">
                            {q.exam_type} {q.year ? `• ${q.year}` : ''}
                          </div>
                        </td>
                        <td className="p-4 align-top max-w-[250px]">
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                        </td>
                        <td className="p-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/admin/questions/${q.id}/edit`} passHref legacyBehavior>
                              <a className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </a>
                            </Link>
                            <button
                              onClick={() => q.id && handleDelete(q.id)}
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

              {/* Pagination controls */}
              <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Showing Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of <strong className="text-slate-800 dark:text-slate-200">{data.data.totalPages}</strong> ({data.data.total} total)
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

        {/* MathJax Preview Drawer/Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm sticky top-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Question Viewer
            </h3>
            {previewQuestion && (
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
              >
                Close
              </button>
            )}
          </div>

          {previewQuestion ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-250">{previewQuestion.subject} &gt; {previewQuestion.chapter}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Question Content</span>
                <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 overflow-auto max-h-[200px] text-slate-800 dark:text-slate-200">
                  <MathText content={previewQuestion.question_text} />
                </div>
              </div>

              {['SINGLE', 'MULTI', 'MATRIX'].includes(previewQuestion.type) && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Options</span>
                  <div className="space-y-2">
                    <div className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg flex items-start gap-2">
                      <span className="font-black text-indigo-500">A</span>
                      <MathText content={previewQuestion.option_a || ''} />
                    </div>
                    <div className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg flex items-start gap-2">
                      <span className="font-black text-indigo-500">B</span>
                      <MathText content={previewQuestion.option_b || ''} />
                    </div>
                    <div className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg flex items-start gap-2">
                      <span className="font-black text-indigo-500">C</span>
                      <MathText content={previewQuestion.option_c || ''} />
                    </div>
                    <div className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg flex items-start gap-2">
                      <span className="font-black text-indigo-500">D</span>
                      <MathText content={previewQuestion.option_d || ''} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Correct Answer</span>
                <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                  {previewQuestion.correct_answer}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Detailed Solution</span>
                <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 overflow-auto max-h-[150px] text-slate-600 dark:text-slate-400">
                  <MathText content={previewQuestion.solution} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <svg className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs font-semibold">Select a question from the list to display its typesetting preview here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

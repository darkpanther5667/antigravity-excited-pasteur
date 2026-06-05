"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, QuestionData, TestQuestionItem, TestQuestionRelation } from '../../lib/api/adminApi';
import { Button } from '../ui/Button';
import { MathText } from '../ui/MathText';
import { useRouter } from 'next/navigation';

interface TestBuilderProps {
  testId: string;
}

export default function TestBuilder({ testId }: TestBuilderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Search/Filter states for the Question Picker
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [chapterFilter, setChapterFilter] = useState<string>('');
  const [pickerPage, setPickerPage] = useState<number>(1);
  const [pickerLimit] = useState<number>(8);

  // Selected questions in local state
  const [selectedList, setSelectedList] = useState<TestQuestionRelation[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fetch chapters for picker filters
  const { data: chaptersData } = useQuery({
    queryKey: ['adminPickerChapters', subjectFilter],
    queryFn: () => adminApi.getChapters(subjectFilter),
    enabled: !!subjectFilter,
  });

  // Fetch Test Details (to get already added questions)
  const { data: testData, isLoading: testLoading } = useQuery({
    queryKey: ['adminTestDetails', testId],
    queryFn: () => adminApi.getTest(testId),
    enabled: !!testId,
  });

  // Populate selectedList when details load
  useEffect(() => {
    if (testData?.success && testData.data?.testQuestions) {
      setSelectedList(testData.data.testQuestions);
    }
  }, [testData]);

  // Fetch Question Bank questions for Picker
  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['adminPickerQuestions', { subjectFilter, difficultyFilter, typeFilter, chapterFilter, pickerPage, pickerLimit }],
    queryFn: () => adminApi.getQuestions({
      subject: subjectFilter || undefined,
      difficulty: difficultyFilter || undefined,
      type: typeFilter || undefined,
      chapter: chapterFilter || undefined,
      page: pickerPage,
      limit: pickerLimit,
    }),
  });

  // Save questions list mutation
  const saveMutation = useMutation({
    mutationFn: (questions: TestQuestionItem[]) => adminApi.setTestQuestions(testId, questions),
    onSuccess: () => {
      setSaveErrors([]);
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['adminTestDetails', testId] });
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
    },
    onError: (err: unknown) => {
      const errorWithResponse = err as { response?: { data?: { details?: string[] } }; message?: string };
      const respData = errorWithResponse.response?.data;
      setSaveErrors(respData?.details || [errorWithResponse.message || 'Failed to save question mappings.']);
      setSaveSuccess(false);
    }
  });

  const handleAddQuestion = (q: QuestionData) => {
    // Check if already selected
    if (selectedList.some(item => item.question.id === q.id)) return;

    // Create default mapping item
    const newItem: TestQuestionRelation = {
      question: q,
      questionOrder: selectedList.length + 1,
      section: q.subject,
      marksCorrect: 4,
      marksIncorrect: q.type === 'INTEGER' ? 0 : -1,
    };

    setSelectedList(prev => [...prev, newItem]);
    setSaveSuccess(false);
  };

  const handleRemoveQuestion = (idx: number) => {
    setSelectedList(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      // Re-index orders
      return updated.map((item, i) => ({
        ...item,
        questionOrder: i + 1,
      }));
    });
    setSaveSuccess(false);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedList(prev => {
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      
      // Update order indexes
      return copy.map((item, i) => ({
        ...item,
        questionOrder: i + 1
      }));
    });
    setSaveSuccess(false);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === selectedList.length - 1) return;
    setSelectedList(prev => {
      const copy = [...prev];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;

      // Update order indexes
      return copy.map((item, i) => ({
        ...item,
        questionOrder: i + 1
      }));
    });
    setSaveSuccess(false);
  };

  const handleMarksChange = (idx: number, field: 'marksCorrect' | 'marksIncorrect', val: number) => {
    setSelectedList(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: val
      };
      return copy;
    });
    setSaveSuccess(false);
  };

  const handleSave = () => {
    const payload: TestQuestionItem[] = selectedList.map(item => ({
      question_id: item.question.id!,
      section: item.section,
      marks_correct: item.marksCorrect,
      marks_incorrect: Number(item.marksIncorrect),
      question_order: item.questionOrder,
    }));

    saveMutation.mutate(payload);
  };

  // Summarize sections counts
  const physicsCount = selectedList.filter(i => i.section === 'PHYSICS').length;
  const chemistryCount = selectedList.filter(i => i.section === 'CHEMISTRY').length;
  const mathsCount = selectedList.filter(i => i.section === 'MATHS').length;
  const totalScore = selectedList.reduce((sum, i) => sum + i.marksCorrect, 0);

  if (testLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading test configuration details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-md">
            Test Composer
          </span>
          <h2 className="text-xl font-black mt-2">{testData?.data?.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Exam: {testData?.data?.exam_type} • Configured Marks: {testData?.data?.total_marks} • Added: {selectedList.length} Questions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tests')}
            className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Back to List
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            className="bg-white text-slate-950 hover:bg-slate-100 font-extrabold"
          >
            Save Questions ({selectedList.length})
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4 font-semibold text-xs text-center dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
          Question composition updated successfully and synced with the backend database!
        </div>
      )}

      {saveErrors.length > 0 && (
        <div className="rounded-xl border border-rose-250 bg-rose-50 p-4 space-y-1 dark:border-rose-900/30 dark:bg-rose-950/20">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Save failed with the following details:</p>
          <ul className="list-disc pl-4 text-xs text-rose-600 dark:text-rose-400">
            {saveErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Distribution Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/35 border border-slate-150 dark:border-slate-850 p-4 rounded-xl text-xs font-bold">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-slate-400 uppercase text-[9px] block">Physics Questions</span>
          <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">{physicsCount} / 25</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-slate-400 uppercase text-[9px] block">Chemistry Questions</span>
          <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">{chemistryCount} / 25</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-slate-400 uppercase text-[9px] block">Maths Questions</span>
          <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">{mathsCount} / 25</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-slate-400 uppercase text-[9px] block">Computed Max Marks</span>
          <span className={`text-lg font-black mt-1 block ${totalScore === testData?.data?.total_marks ? 'text-emerald-600' : 'text-amber-500'}`}>
            {totalScore} / {testData?.data?.total_marks || 0}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Selected Questions (Left 7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            Selected Questions ({selectedList.length})
          </h3>

          {!selectedList.length ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-slate-500">
              No questions selected. Use the Question Picker on the right to search and add questions.
            </div>
          ) : (
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2">
              {selectedList.map((item, idx) => (
                <div
                  key={`${item.question.id}-${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-colors"
                >
                  {/* Order indices and Move controls */}
                  <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850 shrink-0 self-center">
                    <span className="text-[10px] font-black text-slate-400">Q</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{item.questionOrder}</span>
                    
                    <div className="flex flex-col gap-1 mt-2">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Move Up"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === selectedList.length - 1}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Move Down"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Question body summary */}
                  <div className="flex-1 space-y-2 text-xs min-w-0">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase">{item.section}</span>
                      <span className="text-[10px] text-slate-400 font-bold border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full uppercase">{item.question.type}</span>
                      <span className="text-[10px] text-slate-400">{item.question.chapter}</span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 line-clamp-2 pr-2 font-medium">
                      <MathText content={item.question.question_text} />
                    </div>

                    {/* Marks Configuration Row */}
                    <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850 w-fit">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Correct:</span>
                        <input
                          type="number"
                          value={item.marksCorrect}
                          onChange={(e) => handleMarksChange(idx, 'marksCorrect', parseInt(e.target.value) || 0)}
                          className="w-10 text-center text-[10px] font-extrabold rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Penalty:</span>
                        <input
                          type="number"
                          value={item.marksIncorrect}
                          onChange={(e) => handleMarksChange(idx, 'marksIncorrect', parseInt(e.target.value) || 0)}
                          className="w-10 text-center text-[10px] font-extrabold rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveQuestion(idx)}
                    className="h-8 w-8 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:border-slate-800 dark:hover:bg-red-950/20 text-slate-400 shrink-0 self-center transition-colors"
                  >
                    <svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question Picker Drawer (Right 5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Question Catalog
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              Picker Mode
            </span>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <select
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setChapterFilter('');
                  setPickerPage(1);
                }}
                className="w-full text-[11px] rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">All Subjects</option>
                <option value="PHYSICS">Physics</option>
                <option value="CHEMISTRY">Chemistry</option>
                <option value="MATHS">Mathematics</option>
              </select>
            </div>
            <div>
              <select
                value={chapterFilter}
                onChange={(e) => {
                  setChapterFilter(e.target.value);
                  setPickerPage(1);
                }}
                disabled={!subjectFilter}
                className="w-full text-[11px] rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">All Chapters</option>
                {chaptersData?.data?.chapters.map((chap) => (
                  <option key={chap} value={chap}>{chap}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setPickerPage(1);
                }}
                className="w-full text-[11px] rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPickerPage(1);
                }}
                className="w-full text-[11px] rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">All Types</option>
                <option value="SINGLE">Single Choice</option>
                <option value="MULTI">Multi Choice</option>
                <option value="INTEGER">Integer / Numerical</option>
                <option value="MATRIX">Matrix Matching</option>
              </select>
            </div>
          </div>

          {/* Catalog Listing */}
          {bankLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : !bankData?.data?.questions?.length ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">No matching catalog items found.</div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {bankData.data.questions.map((q) => {
                const isAlreadySelected = selectedList.some(item => item.question.id === q.id);
                return (
                  <div
                    key={q.id}
                    className="p-3 border border-slate-100 dark:border-slate-850 rounded-lg flex justify-between items-center gap-3 bg-slate-50/45 text-xs hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                        <span className="text-indigo-600">{q.subject}</span>
                        <span>•</span>
                        <span>{q.type}</span>
                        <span>•</span>
                        <span>{q.difficulty}</span>
                      </div>
                      <div className="line-clamp-2 font-medium text-slate-700 dark:text-slate-350">
                        <MathText content={q.question_text} />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddQuestion(q)}
                      disabled={isAlreadySelected}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        isAlreadySelected
                          ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-500'
                          : 'bg-white border-indigo-200 hover:border-indigo-400 text-indigo-600 dark:bg-slate-900 dark:border-indigo-900 dark:text-indigo-400'
                      }`}
                    >
                      {isAlreadySelected ? 'Added' : 'Add to Test'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {bankData?.data && (bankData.data.totalPages || 0) > 1 && (
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-3 text-[10px] text-slate-500">
              <span>Page {pickerPage} of {bankData?.data?.totalPages}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPickerPage(p => Math.max(1, p - 1))}
                  disabled={pickerPage <= 1}
                  className="px-2 py-0.5 border border-slate-200 rounded disabled:opacity-30"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPickerPage(p => Math.min(bankData?.data?.totalPages || 1, p + 1))}
                  disabled={pickerPage >= (bankData?.data?.totalPages || 1)}
                  className="px-2 py-0.5 border border-slate-200 rounded disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

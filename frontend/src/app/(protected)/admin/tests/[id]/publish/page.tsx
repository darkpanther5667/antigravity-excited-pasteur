"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, TestQuestionRelation } from '@/lib/api/adminApi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PublishTestPageProps {
  params: {
    id: string;
  };
}

export default function PublishTestPage({ params }: PublishTestPageProps) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminTestDetails', id],
    queryFn: () => adminApi.getTest(id),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => adminApi.publishTest(id, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTestDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Generating publish summary analytics...</p>
      </div>
    );
  }

  if (isError || !data?.success || !data.data) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <ErrorState
          title="Failed to Load Test Summary"
          message={error instanceof Error ? error.message : (data?.error || 'Test not found.')}
          onRetry={refetch}
        />
      </div>
    );
  }

  const test = data.data;
  const questions = test.testQuestions || [];

  // Metrics
  const totalQuestions = questions.length;
  const physicsCount = questions.filter((q: TestQuestionRelation) => q.section === 'PHYSICS').length;
  const chemistryCount = questions.filter((q: TestQuestionRelation) => q.section === 'CHEMISTRY').length;
  const mathsCount = questions.filter((q: TestQuestionRelation) => q.section === 'MATHS').length;
  const computedMarks = questions.reduce((sum: number, q: TestQuestionRelation) => sum + q.marksCorrect, 0);

  // Status checks
  const isMarksMatching = computedMarks === test.total_marks;
  const hasQuestions = totalQuestions > 0;
  const canPublish = hasQuestions && isMarksMatching;

  const handlePublish = () => {
    publishMutation.mutate(!test.is_published);
  };

  return (
    <main className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md">
            Publish Console
          </span>
          <h2 className="text-lg font-black mt-2">Publish Verification Summary</h2>
          <p className="text-[10px] text-slate-400 mt-1">Review validation constraints before making the mock test visible to students.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/tests')}
          className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
        >
          Cancel
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 text-xs font-bold">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Test Title</span>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{test.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exam Type</span>
            <p className="text-slate-700 dark:text-slate-300">{test.exam_type} ({test.type})</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
            <p className="text-slate-700 dark:text-slate-300">{test.duration_minutes} Minutes</p>
          </div>
        </div>

        {/* Section counts */}
        <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
          <h4 className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider">Question Distributions</h4>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2.5 border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg">
              <span className="text-slate-400 block mb-0.5">Physics</span>
              <strong className="text-xs text-slate-800 dark:text-slate-200">{physicsCount} Questions</strong>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg">
              <span className="text-slate-400 block mb-0.5">Chemistry</span>
              <strong className="text-xs text-slate-800 dark:text-slate-200">{chemistryCount} Questions</strong>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg">
              <span className="text-slate-400 block mb-0.5">Maths</span>
              <strong className="text-xs text-slate-800 dark:text-slate-200">{mathsCount} Questions</strong>
            </div>
          </div>
        </div>

        {/* Validation Checklists */}
        <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
          <h4 className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider">Validation Criteria</h4>
          
          <div className="space-y-2">
            {/* Check 1: Has questions */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/20 dark:bg-slate-950/10 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${hasQuestions ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-slate-700 dark:text-slate-300">Contains at least 1 question</span>
              </div>
              <span className={`font-mono ${hasQuestions ? 'text-emerald-600' : 'text-red-500'}`}>
                {totalQuestions} Selected
              </span>
            </div>

            {/* Check 2: Score matching */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/20 dark:bg-slate-950/10 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isMarksMatching ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-slate-700 dark:text-slate-300">Assigned marks equal total test marks ({test.total_marks})</span>
              </div>
              <span className={`font-mono ${isMarksMatching ? 'text-emerald-600' : 'text-amber-500'}`}>
                {computedMarks} / {test.total_marks} Marks
              </span>
            </div>
          </div>
        </div>

        {/* Warning card if cannot publish */}
        {!canPublish && (
          <div className="p-3 border border-rose-250 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 rounded-xl font-semibold">
            Warning: This test cannot be published because it does not meet validation criteria. Please configure questions in the Test Composer or align total marks.
          </div>
        )}

        {/* Publish Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href={`/admin/tests/${id}/questions`} passHref legacyBehavior>
            <Button variant="outline" className="flex-1 border-slate-200">
              Edit Questions
            </Button>
          </Link>

          <Button
            onClick={handlePublish}
            disabled={!canPublish || publishMutation.isPending}
            isLoading={publishMutation.isPending}
            className={`flex-1 font-extrabold ${
              test.is_published
                ? 'bg-slate-200 text-slate-850 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {test.is_published ? 'Revert to Draft' : 'Publish Mock Test'}
          </Button>
        </div>
      </div>
    </main>
  );
}

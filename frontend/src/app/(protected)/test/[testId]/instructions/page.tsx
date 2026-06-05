'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchTestMetadata } from '@/lib/attemptApi';
import { Spinner } from '@/components/ui/Spinner';
import type { TestMetadata } from '@/lib/types/attempt';

export default function TestInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;

  const [agreed, setAgreed] = useState(false);

  const {
    data: test,
    isLoading,
    error,
  } = useQuery<TestMetadata>({
    queryKey: ['test-metadata', testId],
    queryFn: () => fetchTestMetadata(testId),
    enabled: Boolean(testId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const handleStart = () => {
    if (!agreed) return;
    router.push(`/test/${testId}/attempt`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !test) {
    const errMsg = error instanceof Error ? error.message : 'Test not found';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Test</h1>
          <p className="text-slate-500 text-sm mb-6">{errMsg}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions =
    (test.sections?.physics ?? 0) +
    (test.sections?.chemistry ?? 0) +
    (test.sections?.maths ?? 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="h-14 bg-slate-900 flex items-center px-6 shadow">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-xs font-bold text-white mr-3">
          JEE
        </div>
        <h1 className="text-white text-sm font-semibold truncate">{test.title}</h1>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Test Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h2 className="text-white text-xl font-bold">{test.title}</h2>
            <p className="text-blue-200 text-sm mt-1">
              {test.exam_type ?? 'JEE'} · {test.type}
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200">
            <Stat label="Duration" value={`${test.duration_minutes} min`} icon="⏱" />
            <Stat label="Total Marks" value={String(test.total_marks)} icon="🎯" />
            <Stat label="Questions" value={String(totalQuestions)} icon="📋" />
          </div>
        </div>

        {/* Section Breakdown */}
        {test.sections && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Section Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <SectionCard name="Physics" count={test.sections.physics} color="blue" />
              <SectionCard name="Chemistry" count={test.sections.chemistry} color="green" />
              <SectionCard name="Maths" count={test.sections.maths} color="orange" />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            General Instructions
          </h3>
          <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed">
            {test.instructions ? (
              <div
                dangerouslySetInnerHTML={{ __html: test.instructions.replace(/\n/g, '<br/>') }}
              />
            ) : (
              <DefaultInstructions totalMarks={test.total_marks} duration={test.duration_minutes} />
            )}
          </div>
        </div>

        {/* Palette Color Guide */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Question Status Colors
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <LegendItem color="bg-white border-2 border-slate-300" label="Not Visited — Haven't opened yet." />
            <LegendItem color="bg-red-100 border border-red-400" label="Not Answered — Opened, no answer given." />
            <LegendItem color="bg-green-500" label="Answered — Answer saved." />
            <LegendItem color="bg-violet-500" label="Marked for Review — Flagged, no answer." />
            <LegendItem color="bg-violet-500" label="Answered & Marked — Answer saved and flagged." extraDot />
          </div>
        </div>

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            id="instructions-agree"
            className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer"
          />
          <span className="text-slate-700 text-sm leading-relaxed">
            I have read and understood all the instructions. I agree to abide by the rules of the
            examination. I am aware that any violation may lead to disqualification.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
          <button
            id="start-test-btn"
            onClick={handleStart}
            disabled={!agreed}
            className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors"
          >
            {agreed ? 'Start Test →' : 'Accept Instructions to Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────────

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex flex-col items-center py-4 gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-bold text-slate-800">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function SectionCard({
  name,
  count,
  color,
}: {
  name: string;
  count: number;
  color: 'blue' | 'green' | 'orange';
}) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-semibold mt-0.5">{name}</div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  extraDot,
}: {
  color: string;
  label: string;
  extraDot?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative w-6 h-6 rounded shrink-0 ${color}`}>
        {extraDot && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
        )}
      </div>
      <span className="text-slate-600 text-xs leading-relaxed">{label}</span>
    </div>
  );
}

function DefaultInstructions({
  totalMarks,
  duration,
}: {
  totalMarks: number;
  duration: number;
}) {
  return (
    <ol className="space-y-2 text-slate-700 text-sm list-decimal pl-4">
      <li>The test has a duration of <strong>{duration} minutes</strong>. The test will be auto-submitted when time expires.</li>
      <li>Total marks for this test: <strong>{totalMarks}</strong>.</li>
      <li><strong>SINGLE CORRECT:</strong> Correct answer: +4 marks. Wrong answer: −1 mark.</li>
      <li><strong>MULTI CORRECT:</strong> Full marks only if all correct options are selected. Partial/wrong: −2 marks.</li>
      <li><strong>INTEGER TYPE:</strong> No negative marking. Correct answer: +4 marks.</li>
      <li>Use <strong>Save &amp; Next</strong> to save an answer and move to the next question.</li>
      <li>Use <strong>Mark for Review &amp; Next</strong> to flag a question for later review.</li>
      <li>Use <strong>Clear</strong> to clear your current response.</li>
      <li>Questions <strong>Answered and Marked</strong> for Review will be evaluated.</li>
      <li>Do NOT close or refresh the browser during the test. Your progress is auto-saved.</li>
    </ol>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, TestData } from '../../lib/api/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TestFormProps {
  initialData?: TestData;
  isEdit?: boolean;
}

export default function TestForm({ initialData, isEdit = false }: TestFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<'FULL_MOCK' | 'CHAPTER' | 'PYQ' | 'ADAPTIVE'>(initialData?.type || 'FULL_MOCK');
  const [examType, setExamType] = useState<'MAINS' | 'ADVANCED'>(initialData?.exam_type || 'MAINS');
  const [durationMinutes, setDurationMinutes] = useState<number>(initialData?.duration_minutes || 180);
  const [totalMarks, setTotalMarks] = useState<number>(initialData?.total_marks || 300);
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData?.scheduled_at) {
      // Format to datetime-local string (YYYY-MM-DDTHH:MM)
      const date = new Date(initialData.scheduled_at);
      const formatted = date.toISOString().substring(0, 16);
      setScheduledAt(formatted);
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (data: TestData) => {
      if (isEdit && initialData?.id) {
        return adminApi.updateTest(initialData.id, data);
      } else {
        return adminApi.createTest(data);
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
      // If creating a new test, redirect to its question builder page directly!
      if (!isEdit && res.data?.id) {
        router.push(`/admin/tests/${res.data.id}/questions`);
      } else {
        router.push('/admin/tests');
      }
    },
    onError: (err: unknown) => {
      const errorWithResponse = err as { response?: { data?: { error?: string } }; message?: string };
      const respData = errorWithResponse.response?.data;
      if (respData && respData.error) {
        setFormErrors([respData.error]);
      } else {
        setFormErrors([errorWithResponse.message || 'An error occurred while saving the test.']);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setValidationErrors({});

    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title is required';
    if (title.length < 3) errors.title = 'Title must be at least 3 characters';
    if (durationMinutes < 10 || durationMinutes > 360) errors.durationMinutes = 'Duration must be between 10 and 360 minutes';
    if (totalMarks < 10 || totalMarks > 400) errors.totalMarks = 'Total marks must be between 10 and 400';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload: TestData = {
      title,
      type,
      exam_type: examType,
      duration_minutes: durationMinutes,
      total_marks: totalMarks,
      instructions,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto pb-12">
      {/* Banner */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-lg font-black">{isEdit ? 'Edit Test Metadata' : 'Create New Mock Test'}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Configure mocked exam formats, scores, time limits, and instructions.</p>
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

      {formErrors.length > 0 && (
        <div className="rounded-xl border border-rose-250 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-450">
          {formErrors.join(', ')}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 text-xs font-bold">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-2">Test Title *</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. JEE Mains Full Length Mock 01"
            error={validationErrors.title}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-2">Test Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'FULL_MOCK' | 'CHAPTER' | 'PYQ' | 'ADAPTIVE')}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="FULL_MOCK">Full length mock</option>
              <option value="CHAPTER">Chapter practice</option>
              <option value="PYQ">Previous year paper</option>
              <option value="ADAPTIVE">Adaptive practice</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-2">Exam Format *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as 'MAINS' | 'ADVANCED')}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="MAINS">JEE Mains</option>
              <option value="ADVANCED">JEE Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-2">Duration (Minutes) *</label>
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              min="10"
              max="360"
              error={validationErrors.durationMinutes}
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-2">Total Marks *</label>
            <Input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)}
              min="10"
              max="400"
              error={validationErrors.totalMarks}
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-2">Scheduled At (Optional)</label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Leave empty to make the test instantly available to students forever.</p>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 mb-2">Instructions (Markdown / HTML Supported)</label>
          <textarea
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Standard JEE Mock Exam. Please read instructions carefully before starting..."
            className="w-full text-xs font-mono rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-950 dark:border-slate-800"
          />
        </div>

        <Button
          type="submit"
          isLoading={mutation.isPending}
          className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold h-11"
        >
          {isEdit ? 'Save Changes' : 'Create & Assemble Questions'}
        </Button>
      </div>
    </form>
  );
}

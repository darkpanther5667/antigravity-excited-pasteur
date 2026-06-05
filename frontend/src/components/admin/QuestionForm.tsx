"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, QuestionData } from '../../lib/api/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MathText } from '../ui/MathText';

interface QuestionFormProps {
  initialData?: QuestionData;
  isEdit?: boolean;
}

export default function QuestionForm({ initialData, isEdit = false }: QuestionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form states
  const [subject, setSubject] = useState<'PHYSICS' | 'CHEMISTRY' | 'MATHS'>(initialData?.subject || 'PHYSICS');
  const [chapter, setChapter] = useState(initialData?.chapter || '');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(initialData?.difficulty || 'EASY');
  const [type, setType] = useState<'SINGLE' | 'MULTI' | 'INTEGER' | 'MATRIX'>(initialData?.type || 'SINGLE');
  const [examType, setExamType] = useState<'MAINS' | 'ADVANCED'>(initialData?.exam_type || 'MAINS');
  const [year, setYear] = useState<string>(initialData?.year?.toString() || '');
  const [ntaWeightage, setNtaWeightage] = useState<number>(initialData?.nta_weightage || 5);
  const [questionText, setQuestionText] = useState(initialData?.question_text || '');
  const [optionA, setOptionA] = useState(initialData?.option_a || '');
  const [optionB, setOptionB] = useState(initialData?.option_b || '');
  const [optionC, setOptionC] = useState(initialData?.option_c || '');
  const [optionD, setOptionD] = useState(initialData?.option_d || '');
  const [solution, setSolution] = useState(initialData?.solution || '');

  // Tab preview states
  const [activeQuestionTab, setActiveQuestionTab] = useState<'write' | 'preview'>('write');
  const [activeSolutionTab, setActiveSolutionTab] = useState<'write' | 'preview'>('write');

  // Custom correct answer states based on type
  const [singleCorrect, setSingleCorrect] = useState<string>('a');
  const [multiCorrect, setMultiCorrect] = useState<Record<string, boolean>>({ a: false, b: false, c: false, d: false });
  const [integerCorrect, setIntegerCorrect] = useState<string>('');
  const [matrixCorrect, setMatrixCorrect] = useState<Record<string, boolean>>({});

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize correct answer states when editing
  useEffect(() => {
    if (initialData) {
      if (initialData.type === 'SINGLE') {
        setSingleCorrect(initialData.correct_answer.toLowerCase());
      } else if (initialData.type === 'MULTI') {
        const parts = initialData.correct_answer.toLowerCase().split(',').map(s => s.trim());
        const temp: Record<string, boolean> = { a: false, b: false, c: false, d: false };
        parts.forEach(p => {
          if (p in temp) temp[p] = true;
        });
        setMultiCorrect(temp);
      } else if (initialData.type === 'INTEGER') {
        setIntegerCorrect(initialData.correct_answer);
      } else if (initialData.type === 'MATRIX') {
        try {
          const parsed = JSON.parse(initialData.correct_answer);
          setMatrixCorrect(parsed);
        } catch {
          setMatrixCorrect({});
        }
      }
    }
  }, [initialData]);

  // Handle matrix match checkbox toggle
  const handleMatrixChange = (row: string, col: string) => {
    const key = `${row}_${col}`;
    setMatrixCorrect(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Mutating API Calls
  const mutation = useMutation({
    mutationFn: (data: QuestionData) => {
      if (isEdit && initialData?.id) {
        return adminApi.updateQuestion(initialData.id, data);
      } else {
        return adminApi.createQuestion(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      router.push('/admin/questions');
    },
    onError: (err: unknown) => {
      const errorWithResponse = err as { response?: { data?: { details?: string[] } }; message?: string };
      const respData = errorWithResponse.response?.data;
      if (respData && respData.details) {
        setFormErrors(respData.details);
      } else {
        setFormErrors([errorWithResponse.message || 'An error occurred while saving the question.']);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setValidationErrors({});

    // Local validation
    const errors: Record<string, string> = {};
    if (!chapter.trim()) errors.chapter = 'Chapter is required';
    if (!topic.trim()) errors.topic = 'Topic is required';
    if (questionText.length < 10) errors.questionText = 'Question text must be at least 10 characters';
    if (solution.length < 10) errors.solution = 'Detailed solution must be at least 10 characters';

    if (['SINGLE', 'MULTI', 'MATRIX'].includes(type)) {
      if (!optionA.trim()) errors.optionA = 'Option A is required';
      if (!optionB.trim()) errors.optionB = 'Option B is required';
      if (!optionC.trim()) errors.optionC = 'Option C is required';
      if (!optionD.trim()) errors.optionD = 'Option D is required';
    }

    let correctAnswerStr = '';
    if (type === 'SINGLE') {
      correctAnswerStr = singleCorrect;
    } else if (type === 'MULTI') {
      const selected = Object.keys(multiCorrect).filter(key => multiCorrect[key]);
      if (selected.length === 0) {
        errors.correctAnswer = 'Select at least one correct option';
      }
      correctAnswerStr = selected.join(',');
    } else if (type === 'INTEGER') {
      if (!integerCorrect.trim()) {
        errors.correctAnswer = 'Integer correct answer is required';
      }
      const num = Number(integerCorrect);
      if (isNaN(num)) {
        errors.correctAnswer = 'Must be a valid integer or decimal';
      }
      correctAnswerStr = integerCorrect;
    } else if (type === 'MATRIX') {
      // Clean up false keys to keep payload concise
      const cleanedMatrix: Record<string, boolean> = {};
      Object.keys(matrixCorrect).forEach(key => {
        if (matrixCorrect[key]) {
          cleanedMatrix[key] = true;
        }
      });
      correctAnswerStr = JSON.stringify(cleanedMatrix);
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload: QuestionData = {
      subject,
      chapter,
      topic,
      difficulty,
      type,
      exam_type: examType,
      year: year ? parseInt(year) : null,
      nta_weightage: ntaWeightage,
      question_text: questionText,
      option_a: ['SINGLE', 'MULTI', 'MATRIX'].includes(type) ? optionA : null,
      option_b: ['SINGLE', 'MULTI', 'MATRIX'].includes(type) ? optionB : null,
      option_c: ['SINGLE', 'MULTI', 'MATRIX'].includes(type) ? optionC : null,
      option_d: ['SINGLE', 'MULTI', 'MATRIX'].includes(type) ? optionD : null,
      correct_answer: correctAnswerStr,
      solution,
    };

    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-black">{isEdit ? 'Edit Question' : 'Create Question'}</h2>
          <p className="text-xs text-slate-400 mt-1">Configure metadata, options, answers, and detailed MathJax explanations.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/questions')}
          className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>

      {formErrors.length > 0 && (
        <div className="rounded-xl border border-rose-250 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20 p-4 space-y-1">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Please fix the following validation errors:</p>
          <ul className="list-disc pl-4 text-xs text-rose-600 dark:text-rose-400">
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          Question Details & Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Subject *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as 'PHYSICS' | 'CHEMISTRY' | 'MATHS')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="PHYSICS">Physics</option>
              <option value="CHEMISTRY">Chemistry</option>
              <option value="MATHS">Mathematics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Chapter *</label>
            <Input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Electrostatics"
              error={validationErrors.chapter}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Topic *</label>
            <Input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Gauss's Law"
              error={validationErrors.topic}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Difficulty *</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Question Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'SINGLE' | 'MULTI' | 'INTEGER' | 'MATRIX')}
              disabled={isEdit}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="SINGLE">Single Choice</option>
              <option value="MULTI">Multi Choice</option>
              <option value="INTEGER">Integer / Numerical</option>
              <option value="MATRIX">Matrix Matching</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Exam Type *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as 'MAINS' | 'ADVANCED')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="MAINS">JEE Mains</option>
              <option value="ADVANCED">JEE Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Year (Optional)</label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2024"
              min="2000"
              max="2025"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">NTA Weightage (1-10) *</label>
            <Input
              type="number"
              value={ntaWeightage}
              onChange={(e) => setNtaWeightage(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>

      {/* Question Text Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Question Text *
          </h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveQuestionTab('write')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeQuestionTab === 'write' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveQuestionTab('preview')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeQuestionTab === 'preview' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500'
              }`}
            >
              MathJax Preview
            </button>
          </div>
        </div>

        {activeQuestionTab === 'write' ? (
          <div>
            <textarea
              rows={6}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter question content. You can include HTML tags and MathJax inline equations like \( x^2 + y^2 = r^2 \) or block formulas like $$ \int_{a}^{b} f(x)dx $$."
              className={`w-full text-sm font-mono rounded-lg border p-3 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:border-slate-800 ${
                validationErrors.questionText ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-slate-200'
              }`}
            />
            {validationErrors.questionText && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.questionText}</p>
            )}
          </div>
        ) : (
          <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-lg min-h-[140px] bg-slate-50/50 dark:bg-slate-950/30 overflow-auto">
            {questionText ? (
              <MathText content={questionText} />
            ) : (
              <p className="text-slate-400 italic">No question content written yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Options Panel (Only for SINGLE, MULTI, MATRIX) */}
      {['SINGLE', 'MULTI', 'MATRIX'].includes(type) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            {type === 'MATRIX' ? 'Matrix Match Rows (List-I labels)' : 'Options (HTML / MathJax Supported)'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {type === 'MATRIX' ? 'Row A label *' : 'Option A *'}
              </label>
              <Input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder={type === 'MATRIX' ? 'Statement A' : 'Option A content'}
                error={validationErrors.optionA}
              />
              {optionA && <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-md text-xs"><MathText content={optionA} /></div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {type === 'MATRIX' ? 'Row B label *' : 'Option B *'}
              </label>
              <Input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder={type === 'MATRIX' ? 'Statement B' : 'Option B content'}
                error={validationErrors.optionB}
              />
              {optionB && <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-md text-xs"><MathText content={optionB} /></div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {type === 'MATRIX' ? 'Row C label *' : 'Option C *'}
              </label>
              <Input
                type="text"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder={type === 'MATRIX' ? 'Statement C' : 'Option C content'}
                error={validationErrors.optionC}
              />
              {optionC && <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-md text-xs"><MathText content={optionC} /></div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {type === 'MATRIX' ? 'Row D label *' : 'Option D *'}
              </label>
              <Input
                type="text"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder={type === 'MATRIX' ? 'Statement D' : 'Option D content'}
                error={validationErrors.optionD}
              />
              {optionD && <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-md text-xs"><MathText content={optionD} /></div>}
            </div>
          </div>
        </div>
      )}

      {/* Correct Answer Selector Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          Correct Answer Definition *
        </h3>

        {/* SINGLE CHOICE */}
        {type === 'SINGLE' && (
          <div className="flex gap-4">
            {['a', 'b', 'c', 'd'].map((option) => (
              <label
                key={option}
                className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all font-bold uppercase text-sm ${
                  singleCorrect === option
                    ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="single-correct"
                  checked={singleCorrect === option}
                  onChange={() => setSingleCorrect(option)}
                  className="sr-only"
                />
                Option {option}
              </label>
            ))}
          </div>
        )}

        {/* MULTI CHOICE */}
        {type === 'MULTI' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Select one or more correct choices. Comma-separated string will be generated.</p>
            <div className="flex gap-4">
              {['a', 'b', 'c', 'd'].map((option) => (
                <label
                  key={option}
                  className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all font-bold uppercase text-sm ${
                    multiCorrect[option]
                      ? 'border-purple-600 bg-purple-50/20 text-purple-700 dark:border-purple-500 dark:bg-purple-950/20 dark:text-purple-400'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={multiCorrect[option]}
                    onChange={() => setMultiCorrect(prev => ({ ...prev, [option]: !prev[option] }))}
                    className="sr-only"
                  />
                  Option {option}
                </label>
              ))}
            </div>
            {validationErrors.correctAnswer && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.correctAnswer}</p>
            )}
          </div>
        )}

        {/* INTEGER / NUMERICAL */}
        {type === 'INTEGER' && (
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">Numerical Value</label>
            <Input
              type="text"
              value={integerCorrect}
              onChange={(e) => setIntegerCorrect(e.target.value)}
              placeholder="e.g. 24 or -1.5"
              error={validationErrors.correctAnswer}
            />
          </div>
        )}

        {/* MATRIX MATCH */}
        {type === 'MATRIX' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Construct the matching links between List-I (A, B, C, D) and List-II (P, Q, R, S). Matches will be saved as stringified JSON.</p>
            
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-55 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                    <th className="p-3 text-left">List-I \ List-II</th>
                    {['P', 'Q', 'R', 'S'].map(col => (
                      <th key={col} className="p-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['A', 'B', 'C', 'D'].map(row => (
                    <tr key={row} className="border-b border-slate-100 dark:border-slate-850">
                      <td className="p-3 text-left font-black bg-slate-50 dark:bg-slate-900/50">{row}</td>
                      {['P', 'Q', 'R', 'S'].map(col => {
                        const key = `${row}_${col}`;
                        const isChecked = !!matrixCorrect[key];
                        return (
                          <td key={col} className="p-3">
                            <label className="flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMatrixChange(row, col)}
                                className="h-4 w-4 text-indigo-600 border-slate-350 focus:ring-indigo-500 rounded"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">Generated JSON Output:</span>
              <code className="text-xs font-mono break-all text-slate-800 dark:text-slate-200">
                {JSON.stringify(Object.keys(matrixCorrect).filter(k => matrixCorrect[k]).reduce((obj, key) => ({ ...obj, [key]: true }), {}))}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Solution Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Detailed Solution *
          </h3>
          <div className="flex bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSolutionTab('write')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeSolutionTab === 'write' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveSolutionTab('preview')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeSolutionTab === 'preview' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500'
              }`}
            >
              MathJax Preview
            </button>
          </div>
        </div>

        {activeSolutionTab === 'write' ? (
          <div>
            <textarea
              rows={6}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Explain the step-by-step mathematical logic used to solve this question. You can use MathJax equations."
              className={`w-full text-sm font-mono rounded-lg border p-3 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:border-slate-800 ${
                validationErrors.solution ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-slate-200'
              }`}
            />
            {validationErrors.solution && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.solution}</p>
            )}
          </div>
        ) : (
          <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-lg min-h-[140px] bg-slate-50/50 dark:bg-slate-950/30 overflow-auto">
            {solution ? (
              <MathText content={solution} />
            ) : (
              <p className="text-slate-400 italic">No solution explanation written yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          isLoading={mutation.isPending}
          className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-extrabold h-12"
        >
          {isEdit ? 'Save Changes' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}

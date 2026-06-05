"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, BulkUploadDetails } from '../../lib/api/adminApi';
import { Button } from '../ui/Button';

export default function BulkUploadPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<BulkUploadDetails[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (f: File) => adminApi.bulkUploadQuestions(f),
    onSuccess: (res) => {
      setProgressMsg(null);
      if (res.success && res.data) {
        setSuccessCount(res.data.inserted);
        queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      } else {
        setGeneralError(res.error || 'Bulk upload completed but returned an unsuccessful status.');
      }
    },
    onError: (err: unknown) => {
      setProgressMsg(null);
      const errorWithResponse = err as { response?: { data?: { details?: BulkUploadDetails[]; error?: string } }; message?: string };
      const respData = errorWithResponse.response?.data;
      if (respData && respData.details) {
        setRowErrors(respData.details);
        setGeneralError(respData.error || 'CSV validation failed on some rows.');
      } else {
        setGeneralError(errorWithResponse.message || 'Network error occurred during upload.');
      }
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        resetState();
      } else {
        setGeneralError('Please select a valid CSV file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      resetState();
    }
  };

  const resetState = () => {
    setSuccessCount(null);
    setRowErrors([]);
    setGeneralError(null);
  };

  const handleUpload = () => {
    if (!file) return;
    resetState();
    setProgressMsg('Uploading file and validating records against database schemas...');
    mutation.mutate(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-black">Bulk CSV Upload</h2>
          <p className="text-xs text-slate-400 mt-1">Upload batches of questions instantly. Format should strictly align with Zod schema fields.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/questions')}
          className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          View Questions
        </Button>
      </div>

      {/* Upload Box Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm text-center space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[200px] ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/10'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/20'
          }`}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={mutation.isPending}
          />
          
          <svg className="h-12 w-12 text-slate-350 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>

          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB • Ready to upload</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Drag and drop your CSV file here</p>
              <p className="text-xs text-slate-400">or click to browse local files</p>
            </div>
          )}
        </div>

        {/* Progress or Actions */}
        {progressMsg ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
            <p className="text-xs font-semibold text-slate-500">{progressMsg}</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={!file || mutation.isPending}
              className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-extrabold h-11"
            >
              Upload & Parse Questions
            </Button>
            {file && (
              <Button
                variant="outline"
                onClick={() => setFile(null)}
                disabled={mutation.isPending}
                className="font-bold border-slate-200"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Success Banner */}
      {successCount !== null && (
        <div className="bg-emerald-50 border border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-2xl p-6 text-center shadow-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">Bulk Upload Successful!</h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
            Successfully parsed and saved <strong className="text-emerald-800 dark:text-emerald-350">{successCount}</strong> questions into the database.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => router.push('/admin/questions')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2"
            >
              Go to Question Bank
            </Button>
          </div>
        </div>
      )}

      {/* Errors Banner */}
      {generalError && (
        <div className="bg-rose-50 border border-rose-250 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-rose-800 dark:text-rose-400">Upload Validation Failed</h3>
              <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{generalError}</p>
            </div>
          </div>

          {rowErrors.length > 0 && (
            <div className="border border-rose-100 dark:border-rose-900/30 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-rose-100/50 dark:bg-rose-950/40 text-[10px] uppercase font-bold text-rose-800 dark:text-rose-400 border-b border-rose-100 dark:border-rose-900/30">
                    <th className="p-3 w-20">Row</th>
                    <th className="p-3">Zod Validation Discrepancy Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {rowErrors.map((err) => (
                    <tr key={err.row} className="border-b border-rose-100/40 dark:border-rose-900/10 hover:bg-rose-100/10">
                      <td className="p-3 font-bold text-rose-700 dark:text-rose-400 align-top">Row {err.row}</td>
                      <td className="p-3 text-rose-600 dark:text-rose-450 align-top space-y-1">
                        {err.errors.map((msg, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className="text-[10px] mt-0.5">•</span>
                            <span>{msg}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

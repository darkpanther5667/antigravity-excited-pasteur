import React from 'react';
import QuestionTable from '../../../../components/admin/QuestionTable';

export const metadata = {
  title: 'Question Bank - Admin Console',
  description: 'Search, filter, view, and delete questions from the JEE Mock Test platform question bank.',
};

export default function AdminQuestionsPage() {
  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto">
      <QuestionTable />
    </main>
  );
}

import React from 'react';
import QuestionForm from '../../../../../components/admin/QuestionForm';

export const metadata = {
  title: 'Create Question - Admin Console',
  description: 'Add a new Physics, Chemistry, or Mathematics question to the JEE Question Bank.',
};

export default function NewQuestionPage() {
  return (
    <main className="p-6 md:p-8">
      <QuestionForm />
    </main>
  );
}

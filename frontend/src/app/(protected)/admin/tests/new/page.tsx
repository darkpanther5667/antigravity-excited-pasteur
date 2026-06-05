import React from 'react';
import TestForm from '../../../../../components/admin/TestForm';

export const metadata = {
  title: 'Create Test - Admin Console',
  description: 'Setup new JEE mock exam metadata, scheduled durations, and test formats.',
};

export default function NewTestPage() {
  return (
    <main className="p-6 md:p-8">
      <TestForm />
    </main>
  );
}

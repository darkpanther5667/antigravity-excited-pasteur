import React from 'react';
import TestListTable from '../../../../components/admin/TestListTable';

export const metadata = {
  title: 'Mock Tests - Admin Console',
  description: 'Manage mock tests, trigger NTA generation, check status and arrange questions.',
};

export default function AdminTestsPage() {
  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto">
      <TestListTable />
    </main>
  );
}

import React from 'react';
import BulkUploadPanel from '../../../../../components/admin/BulkUploadPanel';

export const metadata = {
  title: 'Bulk Upload Questions - Admin Console',
  description: 'Upload questions in batch to the JEE Question Bank using a CSV template.',
};

export default function BulkUploadPage() {
  return (
    <main className="p-6 md:p-8">
      <BulkUploadPanel />
    </main>
  );
}

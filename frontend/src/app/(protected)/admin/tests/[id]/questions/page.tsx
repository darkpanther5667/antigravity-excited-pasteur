import TestBuilder from '@/components/admin/TestBuilder';

export const metadata = {
  title: 'Test Question Assembly - Admin Console',
  description: 'Add, remove, and reorder questions inside the mock test.',
};

interface TestQuestionsPageProps {
  params: {
    id: string;
  };
}

export default function TestQuestionsPage({ params }: TestQuestionsPageProps) {
  const { id } = params;
  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto">
      <TestBuilder testId={id} />
    </main>
  );
}

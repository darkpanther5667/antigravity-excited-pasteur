import React from 'react';
import { OverviewData } from '../../lib/types/analytics';
import StatCard from '../ui/StatCard';

interface OverviewCardsProps {
  data: OverviewData;
}

export default function OverviewCards({ data }: OverviewCardsProps) {
  const trendLabel = data.recent_trend === 'improving'
    ? 'Improving'
    : data.recent_trend === 'declining'
    ? 'Declining'
    : 'Stable';

  const trendIsPositive = data.recent_trend !== 'declining';

  const testTakenIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const avgPercentileIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const avgScoreIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );

  const timeIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Tests Taken"
        value={data.total_tests_taken}
        description="Across all mock test papers"
        icon={testTakenIcon}
      />
      <StatCard
        title="Average Percentile"
        value={`${data.average_percentile.toFixed(1)}%`}
        trend={{
          value: trendLabel,
          isPositive: trendIsPositive,
          label: 'recent trend',
        }}
        icon={avgPercentileIcon}
      />
      <StatCard
        title="Average Score"
        value={data.average_score.toFixed(0)}
        description="Out of 300 marks"
        icon={avgScoreIcon}
      />
      <StatCard
        title="Study Time Spent"
        value={`${data.total_time_spent_hours.toFixed(1)}h`}
        description="Active test taking duration"
        icon={timeIcon}
      />
    </div>
  );
}

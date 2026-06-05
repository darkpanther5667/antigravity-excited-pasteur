// ─── Analytics API Types ─────────────────────────────────────────────────────

export interface OverviewData {
  total_tests_taken: number;
  average_score: number;
  average_percentile: number;
  best_rank: number | null;
  best_score: number;
  best_test: {
    id: string;
    title: string;
    score: number;
    percentile: number;
    date: string;
  } | null;
  recent_trend: 'improving' | 'stable' | 'declining';
  subject_averages: {
    physics: { avg_score: number; avg_accuracy: number };
    chemistry: { avg_score: number; avg_accuracy: number };
    maths: { avg_score: number; avg_accuracy: number };
  };
  total_time_spent_hours: number;
  strongest_subject: string;
  weakest_subject: string;
}

export interface ChapterBreakdown {
  chapter: string;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  avg_time_seconds: number;
  trend: 'improving' | 'stable' | 'declining';
  difficulty_breakdown: {
    easy: { attempted: number; correct: number; accuracy: number };
    medium: { attempted: number; correct: number; accuracy: number };
    hard: { attempted: number; correct: number; accuracy: number };
  };
}

export interface TopicBreakdown {
  topic: string | null;
  chapter: string;
  attempted: number;
  correct: number;
  accuracy: number;
  avg_time_seconds: number;
}

export interface SubjectBreakdownData {
  subject: string;
  total_questions_attempted: number;
  overall_accuracy: number;
  avg_score_per_test: number;
  chapter_breakdown: ChapterBreakdown[];
  topic_breakdown: TopicBreakdown[];
  weak_chapters: ChapterBreakdown[];
  strong_chapters: ChapterBreakdown[];
}

export interface HeatmapEntry {
  subject: string;
  chapter: string;
  accuracy: number;
  attempted: number;
  heat_level: 1 | 2 | 3 | 4 | 5;
  insufficient_data?: boolean;
}

export interface ChapterHeatmapData {
  heatmap: HeatmapEntry[];
}

export interface SubjectTimeStats {
  avg_time: number;
  fastest_chapter: string | null;
  slowest_chapter: string | null;
}

export interface TimeAnalysisData {
  avg_time_per_question_seconds: number;
  by_subject: {
    physics: SubjectTimeStats;
    chemistry: SubjectTimeStats;
    maths: SubjectTimeStats;
  };
  by_difficulty: {
    easy: { avg_time: number };
    medium: { avg_time: number };
    hard: { avg_time: number };
  };
  time_distribution: Array<{ bucket: string; count: number }>;
  slow_chapters: string[];
  fast_chapters: string[];
}

export interface ProgressAttempt {
  attempt_id: string;
  test_id: string;
  test_title: string;
  test_type: string;
  submitted_at: string;
  total_score: number;
  max_possible: number;
  percentile: number;
  rank: number;
  physics_score: number;
  chemistry_score: number;
  maths_score: number;
  accuracy: number;
}

export interface ProgressData {
  tests: ProgressAttempt[];
  score_trend: Array<{ date: string; score: number }>;
  percentile_trend: Array<{ date: string; percentile: number }>;
}

export interface SWOTItem {
  type: 'chapter' | 'pattern';
  label: string;
  subject?: string;
  accuracy?: number;
  attempted?: number;
  insight: string;
}

export interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  priority_action: string;
}

export interface SectionCompareStats {
  score: number;
  accuracy: number;
  time_spent_seconds: number;
}

export interface CompareAttemptStats {
  total_score: number;
  percentile: number;
  physics_score: number;
  chemistry_score: number;
  maths_score: number;
  accuracy: number;
  time_taken_seconds: number;
  section_stats: {
    physics: SectionCompareStats;
    chemistry: SectionCompareStats;
    maths: SectionCompareStats;
  };
  name?: string;
  rank?: number;
}

export interface ChapterGap {
  chapter: string;
  student_accuracy: number;
  topper_accuracy: number;
  gap: number;
}

export interface CompareData {
  student: CompareAttemptStats;
  topper: CompareAttemptStats;
  gap_analysis: {
    score_gap: number;
    physics_gap: number;
    chemistry_gap: number;
    maths_gap: number;
    time_gap_seconds: number;
    weak_vs_topper: ChapterGap[];
  };
}

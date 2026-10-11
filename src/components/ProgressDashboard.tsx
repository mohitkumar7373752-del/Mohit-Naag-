import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookOpen,
  HelpCircle,
  BarChart3,
  Flame,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { QuizAttempt } from '../types/study';

interface ProgressDashboardProps {
  attempts: QuizAttempt[];
  onClearHistory: () => void;
  onRetakeQuiz: (attempt: QuizAttempt) => void;
  onNavigateToNotes: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  attempts,
  onClearHistory,
  onRetakeQuiz,
  onNavigateToNotes,
}) => {
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Overall metrics
  const totalAttempts = attempts.length;
  const totalQuestionsAnswered = attempts.reduce((acc, curr) => acc + curr.total, 0);
  const totalCorrect = attempts.reduce((acc, curr) => acc + curr.score, 0);
  const overallAvgScore =
    totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
  const perfectScores = attempts.filter((a) => a.percentage === 100).length;
  const totalTimeSeconds = attempts.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);

  // Group performance by subject
  const subjectBreakdown = attempts.reduce((acc, curr) => {
    const sub = curr.subject || 'General';
    if (!acc[sub]) {
      acc[sub] = { attempts: 0, score: 0, total: 0 };
    }
    acc[sub].attempts += 1;
    acc[sub].score += curr.score;
    acc[sub].total += curr.total;
    return acc;
  }, {} as Record<string, { attempts: number; score: number; total: number }>);

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Learning Analytics</span>
            </span>
            <span className="text-xs text-slate-400">{totalAttempts} Recorded Attempts</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            User Study Progress & Quiz History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track test scores, review previous quiz attempts, and measure retention across subjects.
          </p>
        </div>

        {totalAttempts > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all quiz attempt history? This cannot be undone.')) {
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Average Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Score</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{overallAvgScore}%</p>
          <span className="text-[11px] text-emerald-400 font-semibold">
            {totalCorrect} / {totalQuestionsAnswered} Correct
          </span>
        </div>

        {/* Metric 2: Total Quizzes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quizzes Taken</span>
            <HelpCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalAttempts}</p>
          <span className="text-[11px] text-slate-400 font-medium">Completed tests</span>
        </div>

        {/* Metric 3: Perfect Scores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Perfect Scores</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{perfectScores}</p>
          <span className="text-[11px] text-amber-400 font-semibold">100% Accuracy</span>
        </div>

        {/* Metric 4: Total Study Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quiz Time</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatDuration(totalTimeSeconds)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Active test time</span>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      {Object.keys(subjectBreakdown).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            Performance by Subject
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(subjectBreakdown).map(([subject, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.score / stats.total) * 100) : 0;
              return (
                <div
                  key={subject}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{subject}</span>
                    <span
                      className={`text-xs font-bold ${
                        pct >= 80
                          ? 'text-emerald-400'
                          : pct >= 60
                          ? 'text-indigo-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{stats.attempts} Quizzes taken</span>
                    <span>
                      {stats.score}/{stats.total} Correct
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attempt History List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          Quiz Attempt History ({totalAttempts})
        </h3>

        {attempts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-3">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">No quiz attempts yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Open any note in your Notes tab and click 'Start Quiz' to begin your first test attempt!
            </p>
            <button
              onClick={onNavigateToNotes}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              Go to Study Notes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => {
              const isExpanded = expandedAttemptId === attempt.id;
              const dateStr = new Date(attempt.date).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={attempt.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  {/* Summary Bar */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Percentage Badge */}
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-sm shrink-0 border ${
                          attempt.percentage >= 80
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : attempt.percentage >= 60
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <span>{attempt.percentage}%</span>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {attempt.subject}
                          </span>
                          <span className="text-xs text-slate-500">{dateStr}</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                          {attempt.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>
                            Score: <strong className="text-white">{attempt.score}</strong> /{' '}
                            {attempt.total}
                          </span>
                          <span>•</span>
                          <span>Duration: {formatDuration(attempt.timeSpentSeconds)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Retake & Expand Review */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => onRetakeQuiz(attempt)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        title="Retake this quiz"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-400" />
                        <span>Retake</span>
                      </button>

                      <button
                        onClick={() =>
                          setExpandedAttemptId(isExpanded ? null : attempt.id)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Answers'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Answers & Explanations Breakdown */}
                  {isExpanded && attempt.questionsReview && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Attempt Breakdown ({attempt.questionsReview.length} Questions)
                      </h5>

                      <div className="space-y-3">
                        {attempt.questionsReview.map((rev, qIdx) => (
                          <div
                            key={qIdx}
                            className={`p-4 rounded-xl border text-xs space-y-2 ${
                              rev.isCorrect
                                ? 'bg-emerald-950/10 border-emerald-500/25'
                                : 'bg-rose-950/10 border-rose-500/25'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white">
                                Q{qIdx + 1}: {rev.question}
                              </span>
                              {rev.isCorrect ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 shrink-0">
                                  <XCircle className="w-3.5 h-3.5" /> Missed
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                              <div>
                                <span className="text-slate-400">Your Answer: </span>
                                <span
                                  className={`font-semibold ${
                                    rev.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {rev.userAnswerIndex !== null
                                    ? rev.options[rev.userAnswerIndex]
                                    : 'Not answered'}
                                </span>
                              </div>
                              {!rev.isCorrect && (
                                <div>
                                  <span className="text-slate-400">Correct Answer: </span>
                                  <span className="font-semibold text-emerald-400">
                                    {rev.options[rev.correctAnswerIndex]}
                                  </span>
                                </div>
                              )}
                            </div>

                            {rev.explanation && (
                              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                                💡 {rev.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

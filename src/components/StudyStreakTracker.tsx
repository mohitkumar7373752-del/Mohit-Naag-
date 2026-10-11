import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Calendar,
  Trophy,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  BookOpen,
  HelpCircle,
  FileEdit,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useStreak } from '../context/StreakContext';
import { getLocalDateString, getPastDateString } from '../utils/streakUtils';

interface StudyStreakTrackerProps {
  onOpenNotes?: () => void;
  onOpenQuizzes?: () => void;
  className?: string;
}

export const StudyStreakTracker: React.FC<StudyStreakTrackerProps> = ({
  onOpenNotes,
  onOpenQuizzes,
  className = '',
}) => {
  const { streakData, recordInteraction, isStreakModalOpen, setIsStreakModalOpen } = useStreak();
  const [showTooltip, setShowTooltip] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const { currentStreak, longestStreak, isActiveToday, activeDates, recentInteractions } =
    streakData;

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStreakModalOpen) {
        setIsStreakModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreakModalOpen, setIsStreakModalOpen]);

  // Compute last 7 days visual tracking
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    const dateStr = getPastDateString(daysAgo);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - daysAgo);
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'narrow' }); // M, T, W...
    const isCompleted = activeDates.includes(dateStr);
    const isToday = daysAgo === 0;

    return {
      dateStr,
      dayName,
      isCompleted,
      isToday,
      daysAgo,
    };
  });

  const handleSimulateLogToday = () => {
    recordInteraction('note_view', 'Logged study session today');
  };

  return (
    <>
      {/* Top Header Streak Badge / Button */}
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          onClick={() => setIsStreakModalOpen(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-semibold ${
            isActiveToday
              ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-300 hover:border-amber-500/50 shadow-sm shadow-amber-500/10'
              : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
          aria-label={`Study streak: ${currentStreak} consecutive days. Click to view streak details.`}
          title="Daily Study Streak"
        >
          {/* Small Flame Icon with Animated Warmth */}
          <div className="relative flex items-center justify-center">
            <Flame
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isActiveToday
                  ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'text-amber-400/80 fill-amber-400/40'
              }`}
            />
            {isActiveToday && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping opacity-75" />
            )}
          </div>

          <span className="font-bold tracking-tight text-amber-200 group-hover:text-amber-100">
            {currentStreak}
          </span>
          <span className="hidden sm:inline text-[11px] font-medium text-amber-300/80">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </button>

        {/* Hover Tooltip on Desktop */}
        {showTooltip && !isStreakModalOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none hidden md:block w-48 p-2 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-slate-200 shadow-xl backdrop-blur-md text-center">
            <div className="font-semibold text-amber-300 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{currentStreak} Day Study Streak</span>
            </div>
            <p className="text-slate-400 text-[10px] mt-0.5">
              {isActiveToday
                ? 'Studied today! Streak maintained'
                : 'Study notes or quizzes today to keep streak!'}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Streak Details Modal */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            ref={modalRef}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsStreakModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close streak details"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Streak Hero Section */}
            <div className="text-center pt-2 pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600/30 via-orange-500/20 to-amber-400/30 border border-amber-500/40 mb-3 shadow-lg shadow-amber-500/20">
                <Flame className="w-9 h-9 text-amber-400 fill-amber-400 animate-pulse drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span>{currentStreak} Consecutive {currentStreak === 1 ? 'Day' : 'Days'}</span>
              </h3>

              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {isActiveToday ? (
                  <span className="text-emerald-400 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    You’ve logged study activity today!
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium">
                    Study your notes or take a quiz to keep this streak alive today!
                  </span>
                )}
              </p>
            </div>

            {/* 7-Day Visual Activity Calendar */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 my-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Past 7 Days
                </span>
                <span className="text-[11px] text-amber-400">
                  {past7Days.filter((d) => d.isCompleted).length} / 7 active
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {past7Days.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {day.dayName}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        day.isCompleted
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                          : day.isToday
                          ? 'bg-slate-800 border border-dashed border-amber-500/40 text-slate-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-600'
                      }`}
                      title={`${day.dateStr}${day.isCompleted ? ' (Studied)' : ''}`}
                    >
                      {day.isCompleted ? (
                        <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <span className="text-[10px]">•</span>
                      )}
                    </div>
                    {day.isToday && (
                      <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Metrics Cards */}
            <div className="grid grid-cols-2 gap-2.5 my-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Personal Best</div>
                  <div className="text-sm font-bold text-white">{longestStreak} Days</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Total Days Active</div>
                  <div className="text-sm font-bold text-white">{activeDates.length} Days</div>
                </div>
              </div>
            </div>

            {/* What Counts & Recent Activity */}
            <div className="my-3">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Recent Study Activity</span>
                <span className="text-[10px] font-normal text-slate-400">Notes & Quizzes</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentInteractions.length > 0 ? (
                  recentInteractions.slice(0, 4).map((interaction) => (
                    <div
                      key={interaction.id}
                      className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {interaction.type.startsWith('quiz') ? (
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : (
                          <FileEdit className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate text-slate-200 text-[11px]">
                          {interaction.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {interaction.date === getLocalDateString() ? 'Today' : interaction.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Start a quiz or edit your notes to log today's study activity!
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setIsStreakModalOpen(false);
                  onOpenNotes?.();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                <span>Browse Notes</span>
              </button>

              <button
                onClick={() => {
                  setIsStreakModalOpen(false);
                  onOpenQuizzes?.();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Start Study Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React from 'react';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Layers,
  Plus,
  CheckCircle2,
  GraduationCap,
  StickyNote,
  TrendingUp,
} from 'lucide-react';
import { StudyDeck } from '../types/study';
import { ThemeSwitcher } from './ThemeSwitcher';
import { StudyStreakTracker } from './StudyStreakTracker';

export type AppTab = 'notes' | 'flashcards' | 'quiz' | 'summary' | 'library' | 'progress';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  activeDeck: StudyDeck | null;
  onOpenGenerator: () => void;
  totalDecksCount: number;
  totalNotesCount: number;
  totalAttemptsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeDeck,
  onOpenGenerator,
  totalDecksCount,
  totalNotesCount,
  totalAttemptsCount = 0,
}) => {
  const masteredCount = activeDeck
    ? activeDeck.flashcards.filter((c) => c.masteryStatus === 'mastered').length
    : 0;
  const totalCards = activeDeck ? activeDeck.flashcards.length : 0;
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Workspace Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onSelectTab('notes')}
              className="flex items-center gap-2.5 focus:outline-none group text-left cursor-pointer"
              title="Return to Notes"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600/90 group-hover:bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30 transition-all">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">
                    StudyPulse
                  </span>
                  <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-xs font-normal">
                  {currentTab === 'notes'
                    ? `${totalNotesCount} Study Notes`
                    : currentTab === 'progress'
                    ? `${totalAttemptsCount} Quiz Attempts`
                    : activeDeck
                    ? activeDeck.title
                    : 'Study Workspace'}
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
            {/* Notes Tab */}
            <button
              onClick={() => onSelectTab('notes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5 text-indigo-300" />
              <span>Notes</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  currentTab === 'notes'
                    ? 'bg-indigo-700/60 text-indigo-100'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {totalNotesCount}
              </span>
            </button>

            {/* Flashcards Tab */}
            <button
              onClick={() => onSelectTab('flashcards')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Flashcards</span>
              {activeDeck && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    currentTab === 'flashcards'
                      ? 'bg-indigo-700/60 text-indigo-100'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {activeDeck.flashcards.length}
                </span>
              )}
            </button>

            {/* Quiz Tab */}
            <button
              onClick={() => onSelectTab('quiz')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz Mode</span>
              {activeDeck && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    currentTab === 'quiz'
                      ? 'bg-indigo-700/60 text-indigo-100'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {activeDeck.quizzes.length}
                </span>
              )}
            </button>

            {/* Summary Tab */}
            <button
              onClick={() => onSelectTab('summary')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>

            {/* Decks Tab */}
            <button
              onClick={() => onSelectTab('library')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'library'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Decks</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  currentTab === 'library'
                    ? 'bg-indigo-700/60 text-indigo-100'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {totalDecksCount}
              </span>
            </button>

            {/* Progress Tab */}
            <button
              onClick={() => onSelectTab('progress')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'progress'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Progress</span>
              {totalAttemptsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    currentTab === 'progress'
                      ? 'bg-indigo-700/60 text-indigo-100'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {totalAttemptsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Daily Study Streak Tracker with Flame Icon */}
            <StudyStreakTracker
              onOpenNotes={() => onSelectTab('notes')}
              onOpenQuizzes={() => onSelectTab('quiz')}
            />

            {/* Theme Mode Switcher (Dark, Light, High-Contrast) */}
            <ThemeSwitcher variant="segmented" className="hidden lg:inline-flex" />
            <ThemeSwitcher variant="dropdown" className="lg:hidden" />

            {activeDeck && currentTab !== 'notes' && currentTab !== 'progress' && (
              <div className="hidden xl:flex items-center gap-2 bg-slate-800/50 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Mastery:</span>
                <span className="font-semibold text-slate-200">{masteryPercentage}%</span>
              </div>
            )}

            <button
              onClick={onOpenGenerator}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">AI Study Set</span>
              <span className="sm:hidden">Create</span>
              <Plus className="w-3.5 h-3.5 sm:hidden" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-[11px] overflow-x-auto">
          <button
            onClick={() => onSelectTab('notes')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium shrink-0 ${
              currentTab === 'notes' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            <span>Notes ({totalNotesCount})</span>
          </button>
          <button
            onClick={() => onSelectTab('flashcards')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium shrink-0 ${
              currentTab === 'flashcards' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => onSelectTab('quiz')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium shrink-0 ${
              currentTab === 'quiz' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz</span>
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium shrink-0 ${
              currentTab === 'progress' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Progress ({totalAttemptsCount})</span>
          </button>
          <button
            onClick={() => onSelectTab('library')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-medium shrink-0 ${
              currentTab === 'library' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Decks</span>
          </button>
        </div>
      </div>
    </header>
  );
};

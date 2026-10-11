import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Flag,
  RotateCcw,
  Sparkles,
  Timer,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  ArrowRight,
  Play,
  Pause,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { StudyDeck, QuizQuestion, Flashcard } from '../types/study';
import { AIExplanationModal } from './AIExplanationModal';
import { VoiceAnswerWidget } from './VoiceAnswerWidget';
import { useStreak } from '../context/StreakContext';

interface QuizRunnerProps {
  deck: StudyDeck;
  onUpdateDeck: (updated: StudyDeck) => void;
  onSwitchToFlashcards: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  deck,
  onUpdateDeck,
  onSwitchToFlashcards,
}) => {
  const { recordInteraction } = useStreak();
  const [questions, setQuestions] = useState<QuizQuestion[]>(deck.quizzes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [quizMode, setQuizMode] = useState<'immediate' | 'exam'>('immediate');
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // AI Tutor Modal state
  const [aiModalQuestion, setAiModalQuestion] = useState<QuizQuestion | null>(null);

  // Flashcards added notification
  const [addedCardsCount, setAddedCardsCount] = useState<number | null>(null);

  // Sync questions when deck updates
  useEffect(() => {
    setQuestions(deck.quizzes);
  }, [deck.quizzes]);

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && !isCompleted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted) return;
    // If in immediate mode and already answered, allow changing only before moving on or keep locked
    if (quizMode === 'immediate' && userAnswers[currentQ.id] !== undefined) {
      return; // locked for active test
    }
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleFinishQuiz = () => {
    setIsCompleted(true);
    setIsTimerRunning(false);

    // Compute score
    let correctCount = 0;
    const missedIds: string[] = [];
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      } else {
        missedIds.push(q.id);
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    // Fire celebratory confetti if >= 75%
    if (percentage >= 75) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // confetti fallback
      }
    }

    // Save history in deck
    const historyItem = {
      id: `history-${Date.now()}`,
      date: new Date().toISOString(),
      score: correctCount,
      total: questions.length,
      percentage,
      timeSpentSeconds: secondsElapsed,
      missedQuestionIds: missedIds,
    };

    onUpdateDeck({
      ...deck,
      quizHistory: [...(deck.quizHistory || []), historyItem],
      updatedAt: new Date().toISOString(),
    });

    recordInteraction('quiz_complete', `Completed quiz: "${deck.title}" (${percentage}%)`);
  };

  const handleRetakeAll = () => {
    setUserAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setAddedCardsCount(null);
  };

  const handleRetakeMissed = () => {
    const missedQuestions = deck.quizzes.filter(
      (q) => userAnswers[q.id] !== q.correctIndex
    );
    if (missedQuestions.length === 0) {
      alert('You answered all questions correctly! Great job!');
      return;
    }
    setQuestions(missedQuestions);
    setUserAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setAddedCardsCount(null);
  };

  // Convert missed questions directly into smart flashcards!
  const handleConvertMissedToCards = () => {
    const missed = questions.filter((q) => userAnswers[q.id] !== q.correctIndex);
    if (missed.length === 0) return;

    const newCards: Flashcard[] = missed.map((q, idx) => ({
      id: `card-from-quiz-${Date.now()}-${idx}`,
      front: q.question,
      back: `Correct Answer: ${q.options[q.correctIndex]}.\n\nExplanation: ${q.explanation}`,
      hint: `Target Concept: ${q.conceptTested}`,
      category: 'Quiz Review',
      masteryStatus: 'learning',
      reviewCount: 0,
      isStarred: true,
    }));

    onUpdateDeck({
      ...deck,
      flashcards: [...deck.flashcards, ...newCards],
      updatedAt: new Date().toISOString(),
    });

    setAddedCardsCount(newCards.length);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
        <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No quiz questions available</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          This deck does not contain multiple-choice questions yet.
        </p>
      </div>
    );
  }

  // Calculate score if completed
  const totalCount = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = questions.filter((q) => userAnswers[q.id] === q.correctIndex).length;
  const scorePercent = Math.round((correctCount / totalCount) * 100);

  const getGrade = (pct: number) => {
    if (pct >= 95) return { grade: 'A+', label: 'Mastery Level!', color: 'text-emerald-400' };
    if (pct >= 85) return { grade: 'A', label: 'Excellent Comprehension', color: 'text-emerald-400' };
    if (pct >= 75) return { grade: 'B', label: 'Good Understanding', color: 'text-indigo-400' };
    if (pct >= 60) return { grade: 'C', label: 'Foundational Knowledge', color: 'text-amber-400' };
    return { grade: 'Review', label: 'Needs Active Revision', color: 'text-rose-400' };
  };

  return (
    <div className="space-y-6">
      {/* Quiz Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Self-Test Quiz
              </span>
              <span className="text-xs text-slate-400">
                {deck.title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isCompleted ? 'Quiz Results & Score Breakdown' : 'Interactive Multiple-Choice Test'}
            </h2>
          </div>

          {/* Right Toolbar: Timer & Mode */}
          <div className="flex items-center gap-3">
            {!isCompleted && (
              <>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-slate-200">{formatTime(secondsElapsed)}</span>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="text-slate-400 hover:text-slate-200"
                    title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                  >
                    {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setQuizMode('immediate')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      quizMode === 'immediate'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Get instant explanations after each click"
                  >
                    Learn Mode
                  </button>
                  <button
                    onClick={() => setQuizMode('exam')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      quizMode === 'exam'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Simulate exam without revealing answers until done"
                  >
                    Exam Mode
                  </button>
                </div>
              </>
            )}

            {isCompleted && (
              <button
                onClick={handleRetakeAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Progress Bar */}
        {!isCompleted && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>
                Answered: {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!isCompleted ? (
        /* Active Question Runner View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Card (3 columns on large screens) */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    {currentQ.conceptTested || 'Knowledge Check'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white pt-2 leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                <button
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`p-2 rounded-xl border transition-colors shrink-0 ${
                    flagged[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-500 border-slate-700/80 hover:text-slate-300'
                  }`}
                  title={flagged[currentQ.id] ? 'Unflag question' : 'Flag question for review'}
                >
                  <Flag className={`w-4 h-4 ${flagged[currentQ.id] ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Voice Answer Microphone Tool */}
              <VoiceAnswerWidget
                options={currentQ.options}
                currentSelectedIdx={userAnswers[currentQ.id]}
                onSelectOption={(idx) => handleSelectOption(idx)}
                isAnswerLocked={quizMode === 'immediate' && userAnswers[currentQ.id] !== undefined}
                questionText={currentQ.question}
              />

              {/* Options List */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = userAnswers[currentQ.id] === idx;
                  const isAnswered = userAnswers[currentQ.id] !== undefined;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle =
                    'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/40';

                  if (quizMode === 'immediate' && isAnswered) {
                    if (isCorrect) {
                      optionStyle =
                        'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-sm shadow-emerald-500/20';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'bg-rose-500/15 border-rose-500/50 text-rose-200 shadow-sm shadow-rose-500/20';
                    } else {
                      optionStyle = 'bg-slate-950/40 border-slate-800/50 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle =
                      'bg-indigo-600/20 border-indigo-500 text-indigo-100 shadow-sm shadow-indigo-500/20';
                  }

                  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={quizMode === 'immediate' && isAnswered}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group cursor-pointer ${optionStyle}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          quizMode === 'immediate' && isAnswered && isCorrect
                            ? 'bg-emerald-500 text-slate-950 font-extrabold'
                            : quizMode === 'immediate' && isAnswered && isSelected && !isCorrect
                            ? 'bg-rose-500 text-white font-extrabold'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        }`}
                      >
                        {optionLetters[idx]}
                      </span>
                      <span className="text-sm font-medium pt-0.5 leading-relaxed flex-1">
                        {option}
                      </span>
                      {quizMode === 'immediate' && isAnswered && (
                        <span className="shrink-0 pt-0.5">
                          {isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-fadeIn" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-400 animate-fadeIn" />
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Mode Explanation & AI Breakdown Drawer */}
              {quizMode === 'immediate' && userAnswers[currentQ.id] !== undefined && (
                <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-indigo-400" />
                      Detailed Explanation
                    </span>
                    <button
                      onClick={() => setAiModalQuestion(currentQ)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI Tutor Deeper Breakdown</span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Question Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishQuiz}
                    disabled={answeredCount === 0}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <span>Submit & Finish Quiz</span>
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Side Question Navigator Palette */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Palette
              </h4>

              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlag = !!flagged[q.id];

                  let pillColor = 'bg-slate-950 text-slate-400 border-slate-800';
                  if (quizMode === 'immediate' && isAnswered) {
                    pillColor =
                      userAnswers[q.id] === q.correctIndex
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  } else if (isAnswered) {
                    pillColor = 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative py-2 rounded-xl text-xs font-bold border transition-all ${pillColor} ${
                        isCurrent ? 'ring-2 ring-indigo-400 font-extrabold scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                      {isFlag && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                  <span>Flagged for review ({Object.values(flagged).filter(Boolean).length})</span>
                </div>
              </div>

              {/* Quick Submit button */}
              <button
                onClick={handleFinishQuiz}
                disabled={answeredCount === 0}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-40"
              >
                Submit Early ({answeredCount}/{questions.length})
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Completed & Results Breakdown Screen */
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {/* Radial Score Gauge */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <div className="w-28 h-28 rounded-full border-8 border-slate-800 flex items-center justify-center bg-slate-950 shadow-inner">
                    <div className="text-center">
                      <span className="text-2xl font-black text-white">{scorePercent}%</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Performance Grade
                    </span>
                    <span className={`text-xl font-black ${getGrade(scorePercent).color}`}>
                      {getGrade(scorePercent).grade}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    {getGrade(scorePercent).label}
                  </h3>
                  <p className="text-xs text-slate-300">
                    You answered <strong className="text-emerald-400">{correctCount}</strong> out of{' '}
                    <strong className="text-white">{totalCount}</strong> questions correctly in{' '}
                    <strong className="text-slate-200">{formatTime(secondsElapsed)}</strong>.
                  </p>
                </div>
              </div>

              {/* Action Buttons on Result screen */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {totalCount - correctCount > 0 && (
                  <button
                    onClick={handleConvertMissedToCards}
                    disabled={addedCardsCount !== null}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {addedCardsCount !== null
                        ? `Added ${addedCardsCount} Flashcards!`
                        : `Turn ${totalCount - correctCount} Missed into Flashcards`}
                    </span>
                  </button>
                )}

                {totalCount - correctCount > 0 && (
                  <button
                    onClick={handleRetakeMissed}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retake Missed Only</span>
                  </button>
                )}

                <button
                  onClick={handleRetakeAll}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Full Quiz</span>
                </button>
              </div>
            </div>

            {/* Success notification banner when cards are added */}
            {addedCardsCount !== null && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Successfully created {addedCardsCount} targeted flashcards with full explanations
                  and mnemonics in this deck!
                </span>
                <button
                  onClick={onSwitchToFlashcards}
                  className="underline font-bold text-emerald-200 hover:text-white"
                >
                  Practice them now →
                </button>
              </div>
            )}
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Comprehensive Question Review & Explanations
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userPick = userAnswers[q.id];
                const isCorrect = userPick === q.correctIndex;
                const wasAnswered = userPick !== undefined;

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900 border rounded-2xl p-6 transition-all ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : 'border-rose-500/30 bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {q.conceptTested}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Missed
                          </span>
                        )}

                        <button
                          onClick={() => setAiModalQuestion(q)}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Breakdown</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white mb-4">{q.question}</h4>

                    {/* Options list showing what was picked and what was correct */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
                      {q.options.map((opt, optIdx) => {
                        const isOptionCorrect = optIdx === q.correctIndex;
                        const isUserChoice = optIdx === userPick;

                        let optClass = 'bg-slate-950/60 border-slate-800/80 text-slate-400';
                        if (isOptionCorrect) {
                          optClass =
                            'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold';
                        } else if (isUserChoice && !isOptionCorrect) {
                          optClass = 'bg-rose-500/15 border-rose-500/50 text-rose-200 font-medium';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${optClass}`}
                          >
                            <span>{opt}</span>
                            {isOptionCorrect && (
                              <span className="text-[10px] uppercase font-bold text-emerald-400">
                                ✓ Correct Answer
                              </span>
                            )}
                            {isUserChoice && !isOptionCorrect && (
                              <span className="text-[10px] uppercase font-bold text-rose-400">
                                ✗ Your Pick
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-indigo-300 block mb-1">
                        Why this is correct:
                      </strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Tutor Deep Explanation Modal */}
      {aiModalQuestion && (
        <AIExplanationModal
          isOpen={true}
          onClose={() => setAiModalQuestion(null)}
          topic={deck.topic}
          question={aiModalQuestion.question}
          selectedAnswer={
            userAnswers[aiModalQuestion.id] !== undefined
              ? aiModalQuestion.options[userAnswers[aiModalQuestion.id]]
              : undefined
          }
          correctAnswer={aiModalQuestion.options[aiModalQuestion.correctIndex]}
          baseExplanation={aiModalQuestion.explanation}
        />
      )}
    </div>
  );
};

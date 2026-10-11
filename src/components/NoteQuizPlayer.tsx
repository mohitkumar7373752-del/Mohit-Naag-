import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  X,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { QuizQuestion, QuizAttempt } from '../types/study';
import { VoiceAnswerWidget } from './VoiceAnswerWidget';

interface NoteQuizPlayerProps {
  noteId: string;
  noteTitle: string;
  noteSubject: string;
  questions: QuizQuestion[];
  onClose: () => void;
  onSaveAttempt: (attempt: QuizAttempt) => void;
  onViewProgress: () => void;
}

export const NoteQuizPlayer: React.FC<NoteQuizPlayerProps> = ({
  noteId,
  noteTitle,
  noteSubject,
  questions,
  onClose,
  onSaveAttempt,
  onViewProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (isTimerActive && !isSubmitted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isSubmitted]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setIsTimerActive(false);

    // Compute score
    let correctCount = 0;
    const questionsReview = questions.map((q) => {
      const picked = userAnswers[q.id] !== undefined ? userAnswers[q.id] : null;
      const isCorrect = picked === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        options: q.options,
        userAnswerIndex: picked,
        correctAnswerIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    // Confetti celebration if passing
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // fallback
      }
    }

    const attemptRecord: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      sourceType: 'note',
      sourceId: noteId,
      title: noteTitle,
      subject: noteSubject,
      date: new Date().toISOString(),
      score: correctCount,
      total: questions.length,
      percentage,
      timeSpentSeconds: secondsElapsed,
      questionsReview,
    };

    // Save to user progress history
    onSaveAttempt(attemptRecord);
  };

  const handleRetake = () => {
    setUserAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setSecondsElapsed(0);
    setIsTimerActive(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalAnswered = Object.keys(userAnswers).length;
  const isAllAnswered = totalAnswered === questions.length;

  // Score metrics
  const correctCount = questions.filter(
    (q) => userAnswers[q.id] === q.correctIndex
  ).length;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  const getGradeInfo = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', text: 'Outstanding Mastery!', color: 'text-emerald-400' };
    if (pct >= 80) return { grade: 'A', text: 'Great Performance!', color: 'text-emerald-400' };
    if (pct >= 70) return { grade: 'B', text: 'Good Comprehension', color: 'text-indigo-400' };
    if (pct >= 50) return { grade: 'C', text: 'Needs Some Review', color: 'text-amber-400' };
    return { grade: 'Review', text: 'Keep Practicing', color: 'text-rose-400' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Header: Note Title, Timer, Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                {noteSubject}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {noteTitle}
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
              {isSubmitted ? 'Quiz Results' : 'Interactive Quiz Player'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Stopwatch Timer */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-200">
              <Timer className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar (During Quiz) */}
        {!isSubmitted && (
          <div className="w-full bg-slate-950 px-6 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Question <strong className="text-white">{currentIndex + 1}</strong> of{' '}
              <strong className="text-white">{questions.length}</strong>
            </span>
            <span>
              Answered: {totalAnswered} / {questions.length}
            </span>
          </div>
        )}

        {/* Active Question View (One by One) */}
        {!isSubmitted ? (
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {currentQ.conceptTested || `Question ${currentIndex + 1}`}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed pt-2">
                {currentQ.question}
              </h3>
            </div>

            {/* Voice Answer Microphone Tool */}
            <VoiceAnswerWidget
              options={currentQ.options}
              currentSelectedIdx={userAnswers[currentQ.id]}
              onSelectOption={(idx) => handleSelectOption(idx)}
              isAnswerLocked={isSubmitted}
              questionText={currentQ.question}
            />

            {/* Radio Button Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = userAnswers[currentQ.id] === idx;
                const optionLetters = ['A', 'B', 'C', 'D'];

                return (
                  <label
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    {/* Radio Button Input */}
                    <div className="pt-0.5 shrink-0 flex items-center">
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(idx)}
                        className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Option Letter Tag */}
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {optionLetters[idx]}
                    </span>

                    {/* Option Text */}
                    <span className="text-sm font-medium leading-relaxed flex-1">
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Question Quick Navigator Palette */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Jump to Question:
              </span>
              <div className="flex gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = userAnswers[q.id] !== undefined;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                        isCurrent
                          ? 'ring-2 ring-indigo-400 bg-indigo-600 text-white border-transparent'
                          : isAnswered
                          ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* INSTANT RESULTS SCREEN AFTER SUBMISSION */
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {/* Score Summary Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Radial percentage gauge */}
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/40 flex items-center justify-center bg-slate-950 shadow-inner shrink-0">
                  <div className="text-center">
                    <span className="text-2xl font-black text-white">{scorePercent}%</span>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      Score
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      Attempt Recorded
                    </span>
                    <span className={`text-lg font-black ${getGradeInfo(scorePercent).color}`}>
                      Grade: {getGradeInfo(scorePercent).grade}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {getGradeInfo(scorePercent).text}
                  </h3>
                  <p className="text-xs text-slate-300">
                    You answered <strong className="text-emerald-400">{correctCount}</strong> of{' '}
                    <strong className="text-white">{questions.length}</strong> questions correctly in{' '}
                    <strong className="text-slate-200">{formatTime(secondsElapsed)}</strong>. Saved to your Progress tab!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                <button
                  onClick={handleRetake}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Retake Quiz</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onViewProgress();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>View in Progress Tab</span>
                </button>
              </div>
            </div>

            {/* Questions Detailed Review List */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Detailed Question & Answer Review
              </h4>

              <div className="space-y-4">
                {questions.map((q, qIdx) => {
                  const userPick = userAnswers[q.id];
                  const isCorrect = userPick === q.correctIndex;
                  const letters = ['A', 'B', 'C', 'D'];

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-950/10 border-emerald-500/30'
                          : 'bg-rose-950/10 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Q{qIdx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>

                      <h5 className="text-sm sm:text-base font-bold text-white mb-3">
                        {q.question}
                      </h5>

                      {/* 4 Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                        {q.options.map((opt, optIdx) => {
                          const isOptionCorrect = optIdx === q.correctIndex;
                          const wasSelected = userPick === optIdx;

                          let style = 'bg-slate-950/60 border-slate-800/80 text-slate-400';
                          if (isOptionCorrect) {
                            style =
                              'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                          } else if (wasSelected && !isOptionCorrect) {
                            style = 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${style}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold opacity-75">{letters[optIdx]}:</span>
                                <span>{opt}</span>
                              </div>
                              {isOptionCorrect && (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">
                                  ✓ Correct
                                </span>
                              )}
                              {wasSelected && !isOptionCorrect && (
                                <span className="text-[10px] font-bold text-rose-400 uppercase">
                                  ✗ Your Pick
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Rationale explanation */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-indigo-300 block mb-0.5">
                          Explanation:
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

        {/* Footer Navigation (Previous, Next, Submit) */}
        {!isSubmitted && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}

              {/* Exact 'Submit' Button */}
              <button
                onClick={handleSubmit}
                disabled={totalAnswered === 0}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span>Submit</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

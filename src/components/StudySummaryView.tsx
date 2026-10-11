import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Printer,
  Sparkles,
  BookOpen,
  HelpCircle,
  Check,
} from 'lucide-react';
import { StudyDeck } from '../types/study';

interface StudySummaryViewProps {
  deck: StudyDeck;
  onSwitchToFlashcards: () => void;
  onSwitchToQuiz: () => void;
}

export const StudySummaryView: React.FC<StudySummaryViewProps> = ({
  deck,
  onSwitchToFlashcards,
  onSwitchToQuiz,
}) => {
  const [checkedTakeaways, setCheckedTakeaways] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleTakeaway = (index: number) => {
    setCheckedTakeaways((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyMarkdown = () => {
    const md = `# ${deck.title}
**Topic:** ${deck.topic} | **Difficulty:** ${deck.difficulty}

## Overview
${deck.summary.overview}

## Key Takeaways
${(deck.summary.keyTakeaways || []).map((t) => `- ${t}`).join('\n')}

${
  deck.summary.essentialFormulasOrTheories && deck.summary.essentialFormulasOrTheories.length > 0
    ? `## Essential Principles & Formulas\n${deck.summary.essentialFormulasOrTheories
        .map((f) => `- ${f}`)
        .join('\n')}\n`
    : ''
}
## Common Pitfalls & Traps to Avoid
${(deck.summary.commonPitfalls || []).map((p) => `- ⚠️ ${p}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Study Guide & Summary
              </span>
              <span className="text-xs text-slate-400">{deck.topic}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{deck.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copyMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>

            <button
              onClick={printSheet}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Study Sheet</span>
            </button>

            <button
              onClick={onSwitchToFlashcards}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study Flashcards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overview and Essential Principles (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conceptual Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                Core Conceptual Overview
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal whitespace-pre-line">
              {deck.summary.overview}
            </p>
          </div>

          {/* Interactive Key Takeaways Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                  Key Takeaways (Active Checkoff)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {Object.values(checkedTakeaways).filter(Boolean).length} /{' '}
                {deck.summary.keyTakeaways?.length || 0} checked
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Check off each concept as you review and understand it:
            </p>

            <div className="space-y-2.5">
              {(deck.summary.keyTakeaways || []).map((point, idx) => {
                const isChecked = !!checkedTakeaways[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleTakeaway(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
                      {point}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Formulas & Traps (1 col) */}
        <div className="space-y-6">
          {/* Formulas / Theories / Frameworks */}
          {deck.summary.essentialFormulasOrTheories &&
            deck.summary.essentialFormulasOrTheories.length > 0 && (
              <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Essential Theories & Formulas
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {deck.summary.essentialFormulasOrTheories.map((formula, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 leading-relaxed"
                    >
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Common Pitfalls & Traps to Avoid */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Exam Traps & Common Pitfalls
              </h3>
            </div>
            <div className="space-y-2.5">
              {(deck.summary.commonPitfalls || []).map((pitfall, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100/90 leading-relaxed space-y-1"
                >
                  <span className="font-bold text-amber-300 block">Trap #{idx + 1}:</span>
                  <p>{pitfall}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Quiz CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-indigo-900/60 to-violet-900/40 border border-indigo-500/40 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-300 mx-auto" />
            <h4 className="text-base font-bold text-white">Ready for Self-Testing?</h4>
            <p className="text-xs text-indigo-200">
              Put your knowledge to the test with {deck.quizzes.length} interactive questions with
              real-time explanations.
            </p>
            <button
              onClick={onSwitchToQuiz}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-white text-indigo-950 hover:bg-indigo-50 shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
            >
              Start Quiz Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

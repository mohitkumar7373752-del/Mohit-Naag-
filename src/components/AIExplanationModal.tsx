import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Send,
  Zap,
} from 'lucide-react';
import { ExplainConceptResponse, explainConceptAPI } from '../services/api';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  question: string;
  selectedAnswer?: string;
  correctAnswer: string;
  baseExplanation: string;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  topic,
  question,
  selectedAnswer,
  correctAnswer,
  baseExplanation,
}) => {
  const [data, setData] = useState<ExplainConceptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentDoubt, setStudentDoubt] = useState('');

  // Fetch initial AI explanation when modal opens
  React.useEffect(() => {
    if (isOpen && !data && !loading) {
      loadExplanation();
    }
  }, [isOpen]);

  const loadExplanation = async (customQuestion?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await explainConceptAPI({
        topic,
        question,
        selectedAnswer,
        correctAnswer,
        explanation: baseExplanation,
        studentDoubt: customQuestion,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI tutor breakdown.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentDoubt.trim()) return;
    loadExplanation(studentDoubt.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Tutor Deep Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                Cognitive explanation, memory hooks, and exam intuition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Question context card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Exam Question
            </span>
            <p className="text-sm font-semibold text-white">{question}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct: {correctAnswer}
              </span>
              {selectedAnswer && selectedAnswer !== correctAnswer && (
                <span className="flex items-center gap-1.5 text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Your Pick: {selectedAnswer}
                </span>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                AI Tutor is formulating an intuitive conceptual breakdown...
              </p>
              <p className="text-xs text-slate-500">
                Deconstructing core mechanisms and drafting memory hooks
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <p className="font-semibold mb-1">Failed to generate breakdown</p>
              <p>{error}</p>
              <button
                onClick={() => loadExplanation()}
                className="mt-3 px-3 py-1.5 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-400"
              >
                Retry
              </button>
            </div>
          )}

          {/* Explanation sections */}
          {data && !loading && (
            <div className="space-y-4 animate-fadeIn">
              {/* Step-by-step breakdown */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Intuitive Mechanism Breakdown
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {data.breakdown}
                </p>
              </div>

              {/* Memory hook & analogy */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Visual Analogy & Mnemonic Hook
                </h4>
                <p className="text-sm text-amber-100/90 leading-relaxed font-normal">
                  {data.analogyOrMnemonic}
                </p>
              </div>

              {/* Concrete real-world example */}
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/20 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  Real-World Example in Action
                </h4>
                <p className="text-sm text-teal-100/90 leading-relaxed font-normal">
                  {data.concreteExample}
                </p>
              </div>

              {/* Exam pro-tip */}
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-500/20 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  Exam Day Strategy & Distractor Alert
                </h4>
                <p className="text-sm text-violet-100/90 leading-relaxed font-normal">
                  {data.proTip}
                </p>
              </div>

              {/* Ask Follow-up Query */}
              <form onSubmit={handleCustomQuery} className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Still have a specific doubt about this question?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentDoubt}
                    onChange={(e) => setStudentDoubt(e.target.value)}
                    placeholder="e.g. Why isn't option C possible in anaerobic conditions?"
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!studentDoubt.trim() || loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Got it, back to quiz
          </button>
        </div>
      </div>
    </div>
  );
};

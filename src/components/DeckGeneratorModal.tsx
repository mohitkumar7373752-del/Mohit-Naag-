import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  FileText,
  Sliders,
  Check,
  AlertCircle,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { DifficultyLevel, DeckMode, StudyDeck } from '../types/study';
import { generateDeckAPI } from '../services/api';

interface DeckGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckGenerated: (newDeck: StudyDeck) => void;
  initialInput?: string;
  initialMode?: DeckMode;
}

const SAMPLE_TOPICS = [
  { label: 'Photosynthesis & Light Reactions', mode: 'topic' as DeckMode },
  { label: 'ML: Overfitting, Bias & Variance', mode: 'topic' as DeckMode },
  { label: 'Newtonian Gravitation & Kepler Laws', mode: 'topic' as DeckMode },
  { label: 'Synaptic Transmission & Action Potential', mode: 'topic' as DeckMode },
  { label: 'The French Revolution & Reign of Terror', mode: 'topic' as DeckMode },
  { label: 'Supply & Demand Price Elasticity', mode: 'topic' as DeckMode },
];

const SAMPLE_RAW_NOTES = `Cellular Mitosis Stages and Regulation:
Mitosis is somatic nuclear division yielding two genetically identical diploid daughter cells.
Key stages:
1. Prophase: Chromatin condenses into visible chromosomes with sister chromatids joined at centromeres. Centrosomes move to opposite poles and mitotic spindle begins forming.
2. Prometaphase: Nuclear envelope fragments, allowing spindle microtubules to attach to kinetochores located on centromeres.
3. Metaphase: Chromosomes align along the equatorial metaphase plate under reciprocal tension from polar spindle fibers. Spindle assembly checkpoint (SAC) verifies tension before anaphase.
4. Anaphase: Separase cleaves cohesin complexes. Sister chromatids synchronously separate and are pulled toward opposite spindle poles by dynein/kinesin motors.
5. Telophase: Nuclear envelopes reform around separated chromatin. Chromosomes decondense, nucleoli reappear, and spindle disassembles.
Cytokinesis: Animal cells form an actin-myosin contractile ring causing a cleavage furrow; plant cells synthesize a cell plate from Golgi vesicles.`;

export const DeckGeneratorModal: React.FC<DeckGeneratorModalProps> = ({
  isOpen,
  onClose,
  onDeckGenerated,
  initialInput,
  initialMode,
}) => {
  const [mode, setMode] = useState<DeckMode>(initialMode || 'topic');
  const [input, setInput] = useState(initialInput || '');
  const [cardCount, setCardCount] = useState<number>(8);
  const [quizCount, setQuizCount] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [customFocus, setCustomFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialInput !== undefined) {
        setInput(initialInput);
      }
      if (initialMode !== undefined) {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialInput, initialMode]);

  const loadingMessages = [
    'Synthesizing core concepts and subject taxonomy...',
    'Extracting high-yield flashcard questions and mnemonics...',
    'Generating interactive multiple-choice questions & plausible distractors...',
    'Formulating comprehensive study summary and exam pitfalls...',
    'Polishing your study deck...',
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setErrorMessage(
        mode === 'topic'
          ? 'Please enter a study topic or concept name.'
          : 'Please paste your study notes or textbook text.'
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const generated = await generateDeckAPI({
        input: input.trim(),
        mode,
        cardCount,
        quizCount,
        difficulty,
        customFocus: customFocus.trim() || undefined,
      });

      const now = new Date().toISOString();
      const newDeck: StudyDeck = {
        id: `deck-${Date.now()}`,
        title: generated.title || 'Untitled Study Deck',
        topic: generated.topic || (mode === 'topic' ? input.trim() : 'General Science'),
        sourceText: mode === 'notes' ? input.trim() : undefined,
        difficulty,
        mode,
        createdAt: now,
        updatedAt: now,
        tags: generated.tags || ['Study', 'AI Generated'],
        summary: generated.summary || {
          overview: 'AI-generated study overview',
          keyTakeaways: [],
          essentialFormulasOrTheories: [],
          commonPitfalls: [],
        },
        flashcards: (generated.flashcards || []).map((card, idx) => ({
          ...card,
          id: `card-${Date.now()}-${idx}`,
          masteryStatus: 'new',
          reviewCount: 0,
        })),
        quizzes: (generated.quizzes || []).map((quiz, idx) => ({
          ...quiz,
          id: `quiz-${Date.now()}-${idx}`,
          userAnswer: null,
          isFlagged: false,
        })),
      };

      onDeckGenerated(newDeck);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Something went wrong while generating the study deck. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleNotes = () => {
    setMode('notes');
    setInput(SAMPLE_RAW_NOTES);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Generate Smart Study Deck
              </h2>
              <p className="text-xs text-slate-400">
                AI converts your topics or lecture notes into instant flashcards and quizzes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Input Mode
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('topic')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  mode === 'topic'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Topic / Subject Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('notes')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  mode === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Paste Study Notes / Text</span>
              </button>
            </div>
          </div>

          {/* Quick inspiration chips */}
          {mode === 'topic' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">Quick Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TOPICS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInput(item.label);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Paste textbook sections, lecture transcripts, or bullet notes.
              </span>
              <button
                type="button"
                onClick={loadSampleNotes}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
              >
                Fill with sample mitosis notes
              </button>
            </div>
          )}

          {/* Main Input Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {mode === 'topic' ? 'Topic or Concept' : 'Your Notes or Study Text'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              rows={mode === 'topic' ? 3 : 6}
              placeholder={
                mode === 'topic'
                  ? 'e.g. CRISPR-Cas9 Gene Editing, Game Theory & Nash Equilibrium, Supply Side Economics, The Peloponnesian War...'
                  : 'Paste your raw lecture notes, chapter summary, or study guide text here...'
              }
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-y font-normal"
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                disabled={isLoading}
                aria-label="Difficulty Level"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Foundational (High School / Intro)</option>
                <option value="intermediate">Standard (Undergraduate)</option>
                <option value="advanced">Advanced (Exam / Master Level)</option>
              </select>
            </div>

            {/* Flashcard Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Flashcards Count
              </label>
              <select
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                disabled={isLoading}
                aria-label="Flashcards Count"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 Flashcards (Quick drill)</option>
                <option value={8}>8 Flashcards (Recommended)</option>
                <option value={12}>12 Flashcards (Comprehensive)</option>
                <option value={16}>16 Flashcards (Deep mastery)</option>
              </select>
            </div>

            {/* Quiz Questions Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Quiz Questions
              </label>
              <select
                value={quizCount}
                onChange={(e) => setQuizCount(Number(e.target.value))}
                disabled={isLoading}
                aria-label="Quiz Questions Count"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={4}>4 Questions (Fast test)</option>
                <option value={6}>6 Questions (Recommended)</option>
                <option value={8}>8 Questions (Standard exam)</option>
                <option value={10}>10 Questions (Full exam simulation)</option>
              </select>
            </div>
          </div>

          {/* Custom Focus (Optional) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Special Focus or Requirements (Optional)
              </label>
            </div>
            <input
              type="text"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Include clinical case studies, emphasize mathematical proofs, or focus on common exam traps"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="text-rose-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Loading Animation Box */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Generating Study Deck with Gemini AI...
                </span>
                <span className="text-indigo-400 font-mono">
                  Step {loadingStep + 1} of {loadingMessages.length}
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium">
                {loadingMessages[loadingStep]}
              </p>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                  style={{
                    width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>{isLoading ? 'Generating Materials...' : 'Generate Flashcards & Quiz'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

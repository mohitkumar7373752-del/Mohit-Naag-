import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  CheckCircle2,
  HelpCircle,
  Volume2,
  Star,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Plus,
  Trash2,
  Edit2,
  List,
  Layers,
  Sparkles,
  Info,
  BookOpen,
  Download,
  Mic,
} from 'lucide-react';
import { Flashcard, MasteryStatus, StudyDeck, VerbalExplanation } from '../types/study';
import { ExportDeckModal } from './ExportDeckModal';
import { CardAudioRecorderModal } from './CardAudioRecorderModal';
import { CardAudioPlayer } from './CardAudioPlayer';

interface FlashcardViewerProps {
  deck: StudyDeck;
  onUpdateDeck: (updated: StudyDeck) => void;
  onOpenGenerator: () => void;
  onSwitchToQuiz: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  deck,
  onUpdateDeck,
  onOpenGenerator,
  onSwitchToQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState<'flip' | 'grid'>('flip');
  const [filter, setFilter] = useState<'all' | 'starred' | 'learning' | 'mastered'>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [recordingCard, setRecordingCard] = useState<Flashcard | null>(null);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newCategory, setNewCategory] = useState('Key Concept');

  // Filtered cards list
  const filteredCards = deck.flashcards.filter((card) => {
    if (filter === 'starred') return !!card.isStarred;
    if (filter === 'learning') return card.masteryStatus === 'learning';
    if (filter === 'mastered') return card.masteryStatus === 'mastered';
    return true;
  });

  // Keep index within bounds when filter changes
  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
    }
    setIsFlipped(false);
    setShowHint(false);
  }, [filter, filteredCards.length]);

  const currentCard = filteredCards[currentIndex];

  // Flip card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Next & Previous
  const handleNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  // Set mastery status
  const handleSetMastery = useCallback(
    (status: MasteryStatus) => {
      if (!currentCard) return;
      const updatedCards = deck.flashcards.map((c) =>
        c.id === currentCard.id
          ? {
              ...c,
              masteryStatus: status,
              reviewCount: (c.reviewCount || 0) + 1,
              lastReviewed: new Date().toISOString(),
            }
          : c
      );
      onUpdateDeck({ ...deck, flashcards: updatedCards, updatedAt: new Date().toISOString() });

      // Automatically advance to next card after marking
      if (currentIndex < filteredCards.length - 1) {
        handleNext();
      }
    },
    [currentCard, deck, onUpdateDeck, currentIndex, filteredCards.length, handleNext]
  );

  // Toggle Star
  const handleToggleStar = (cardId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updatedCards = deck.flashcards.map((c) =>
      c.id === cardId ? { ...c, isStarred: !c.isStarred } : c
    );
    onUpdateDeck({ ...deck, flashcards: updatedCards });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (viewMode !== 'flip') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleSetMastery('learning');
      } else if (e.key === '2') {
        e.preventDefault();
        handleSetMastery('mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleSetMastery, viewMode]);

  // Speech TTS
  const speakText = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Shuffle
  const handleShuffle = () => {
    const shuffled = [...deck.flashcards].sort(() => Math.random() - 0.5);
    onUpdateDeck({ ...deck, flashcards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Reset all mastery
  const handleResetMastery = () => {
    if (window.confirm('Reset learning progress on this deck back to new?')) {
      const resetCards = deck.flashcards.map((c) => ({
        ...c,
        masteryStatus: 'new' as MasteryStatus,
      }));
      onUpdateDeck({ ...deck, flashcards: resetCards });
    }
  };

  // Add custom card
  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      hint: newHint.trim(),
      category: newCategory.trim() || 'General',
      masteryStatus: 'new',
      reviewCount: 0,
    };

    onUpdateDeck({
      ...deck,
      flashcards: [...deck.flashcards, newCard],
      updatedAt: new Date().toISOString(),
    });

    setNewFront('');
    setNewBack('');
    setNewHint('');
    setIsAddingCard(false);
  };

  // Delete card
  const handleDeleteCard = (cardId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (deck.flashcards.length <= 1) {
      alert('Deck must contain at least one card.');
      return;
    }
    const updated = deck.flashcards.filter((c) => c.id !== cardId);
    onUpdateDeck({ ...deck, flashcards: updated });
  };

  // Save verbal explanation to card
  const handleSaveExplanation = (cardId: string, explanation: VerbalExplanation) => {
    const updatedCards = deck.flashcards.map((c) =>
      c.id === cardId ? { ...c, verbalExplanation: explanation } : c
    );
    onUpdateDeck({
      ...deck,
      flashcards: updatedCards,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete verbal explanation from card
  const handleDeleteExplanation = (cardId: string) => {
    const updatedCards = deck.flashcards.map((c) => {
      if (c.id === cardId) {
        const copy = { ...c };
        delete copy.verbalExplanation;
        return copy;
      }
      return c;
    });
    onUpdateDeck({
      ...deck,
      flashcards: updatedCards,
      updatedAt: new Date().toISOString(),
    });
  };

  // Metrics
  const masteredCount = deck.flashcards.filter((c) => c.masteryStatus === 'mastered').length;
  const learningCount = deck.flashcards.filter((c) => c.masteryStatus === 'learning').length;
  const newCount = deck.flashcards.filter((c) => c.masteryStatus === 'new').length;
  const starredCount = deck.flashcards.filter((c) => c.isStarred).length;
  const total = deck.flashcards.length;

  return (
    <div className="space-y-6">
      {/* Top Deck Info & Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {deck.topic}
              </span>
              <span className="px-2 py-0.5 rounded text-xs uppercase tracking-wider bg-slate-800 text-slate-400 font-medium">
                {deck.difficulty}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {deck.title}
            </h1>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddingCard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Card</span>
            </button>

            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
              title="Shuffle card order"
            >
              <Shuffle className="w-3.5 h-3.5 text-sky-400" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
              title="Export flashcards as CSV or printable PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export & Print</span>
            </button>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('flip')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'flip' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Single Card Flip View"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Full Cards Grid View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onSwitchToQuiz}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quiz This Deck</span>
            </button>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Mastered: {masteredCount} ({total > 0 ? Math.round((masteredCount / total) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Learning: {learningCount}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                New: {newCount}
              </span>
            </div>
            {masteredCount > 0 && (
              <button
                onClick={handleResetMastery}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                Reset Progress
              </button>
            )}
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${total > 0 ? (masteredCount / total) * 100 : 0}%` }}
              title={`Mastered: ${masteredCount}`}
            />
            <div
              className="bg-amber-500 transition-all duration-300"
              style={{ width: `${total > 0 ? (learningCount / total) * 100 : 0}%` }}
              title={`Learning: ${learningCount}`}
            />
            <div
              className="bg-slate-700 transition-all duration-300"
              style={{ width: `${total > 0 ? (newCount / total) * 100 : 0}%` }}
              title={`New: ${newCount}`}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          All Cards ({total})
        </button>
        <button
          onClick={() => setFilter('starred')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filter === 'starred'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Starred ({starredCount})</span>
        </button>
        <button
          onClick={() => setFilter('learning')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filter === 'learning'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          Still Learning ({learningCount})
        </button>
        <button
          onClick={() => setFilter('mastered')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filter === 'mastered'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          Mastered ({masteredCount})
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No flashcards found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            No cards match the active filter "{filter}". Try switching back to "All Cards" or add a new card.
          </p>
          <button
            onClick={() => setFilter('all')}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Show All Cards
          </button>
        </div>
      ) : viewMode === 'flip' && currentCard ? (
        /* Single Card 3D Flip Viewer */
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Top Card Bar (Counter, Category, Star, Speech) */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="font-semibold text-slate-300">
              Card {currentIndex + 1} of {filteredCards.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
                {currentCard.category}
              </span>
              <button
                onClick={(e) => handleToggleStar(currentCard.id, e)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  currentCard.isStarred
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Star this card for quick review"
              >
                <Star
                  className={`w-4 h-4 ${currentCard.isStarred ? 'fill-amber-400 text-amber-400' : ''}`}
                />
              </button>
              <button
                onClick={(e) => speakText(isFlipped ? currentCard.back : currentCard.front, e)}
                className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Read aloud (Audio TTS)"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-indigo-400 animate-pulse' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRecordingCard(currentCard);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
                  currentCard.verbalExplanation
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
                title={
                  currentCard.verbalExplanation
                    ? 'Re-record or manage verbal explanation'
                    : 'Record verbal explanation with microphone'
                }
              >
                <Mic className={`w-3.5 h-3.5 ${currentCard.verbalExplanation ? 'text-indigo-400 animate-pulse' : ''}`} />
                <span className="hidden sm:inline">
                  {currentCard.verbalExplanation ? 'Voice Note' : 'Record Voice'}
                </span>
              </button>
            </div>
          </div>

          {/* 3D Flip Container */}
          <div
            onClick={handleFlip}
            className="perspective-1000 w-full min-h-[340px] cursor-pointer group"
          >
            <div
              className={`relative w-full min-h-[340px] rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-2xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-indigo-500/30 group-hover:border-indigo-500/50 rounded-3xl p-8 flex flex-col justify-between text-left transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Prompt / Question
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    Click to flip
                  </span>
                </div>

                <div className="my-auto py-6">
                  <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                  {currentCard.hint ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
                    </button>
                  ) : (
                    <span className="text-slate-500">Active recall mode</span>
                  )}
                  <span className="text-slate-500 font-mono text-[11px]">
                    Status:{' '}
                    <span
                      className={`font-semibold capitalize ${
                        currentCard.masteryStatus === 'mastered'
                          ? 'text-emerald-400'
                          : currentCard.masteryStatus === 'learning'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {currentCard.masteryStatus}
                    </span>
                  </span>
                </div>

                {/* Hint popup inside front */}
                {showHint && currentCard.hint && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-fadeIn"
                  >
                    <p className="font-semibold flex items-center gap-1.5 text-amber-300 mb-0.5">
                      <Lightbulb className="w-3.5 h-3.5" /> Mnemonic / Memory Clue:
                    </p>
                    <p>{currentCard.hint}</p>
                  </div>
                )}
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-2 border-emerald-500/30 group-hover:border-emerald-500/50 rounded-3xl p-8 flex flex-col justify-between text-left transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Explanation / Answer
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    Click to flip
                  </span>
                </div>

                <div className="my-auto py-6">
                  <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                  {currentCard.hint && (
                    <span className="text-slate-400 italic">💡 {currentCard.hint}</span>
                  )}
                  <span className="text-slate-500 font-mono">Reviewed {currentCard.reviewCount || 0} times</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verbal Explanation Audio Player */}
          {currentCard.verbalExplanation ? (
            <CardAudioPlayer
              explanation={currentCard.verbalExplanation}
              onDelete={() => handleDeleteExplanation(currentCard.id)}
              onRerecord={() => setRecordingCard(currentCard)}
            />
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Mic className="w-4 h-4 text-indigo-400" />
                <span>Explain this concept in your own words</span>
              </div>
              <button
                onClick={() => setRecordingCard(currentCard)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Record Voice Note</span>
              </button>
            </div>
          )}

          {/* Action Buttons: Still Learning vs Mastered */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleSetMastery('learning')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>Still Learning</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 rounded font-mono border border-amber-500/30">
                1
              </kbd>
            </button>

            <button
              onClick={() => handleSetMastery('mastered')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mastered!</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/20 rounded font-mono border border-emerald-500/30">
                2
              </kbd>
            </button>
          </div>

          {/* Bottom Card Controls (Prev, Flip, Next, Shortcuts Guide) */}
          <div className="flex items-center justify-between pt-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip Card</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-indigo-950 rounded font-mono border border-indigo-500/30">
                Space
              </kbd>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === filteredCards.length - 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-500 pt-1">
            Shortcuts: <kbd className="px-1 bg-slate-800 rounded font-mono">Space</kbd> Flip •{' '}
            <kbd className="px-1 bg-slate-800 rounded font-mono">← / →</kbd> Prev / Next •{' '}
            <kbd className="px-1 bg-slate-800 rounded font-mono">1</kbd> Learning •{' '}
            <kbd className="px-1 bg-slate-800 rounded font-mono">2</kbd> Mastered
          </p>
        </div>
      ) : (
        /* Full Cards Grid Table View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card, idx) => (
            <div
              key={card.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {card.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStar(card.id)}
                      className={`p-1 rounded ${card.isStarred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${card.isStarred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => speakText(card.front + '. ' + card.back)}
                      className="p-1 text-slate-600 hover:text-slate-400 rounded"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRecordingCard(card)}
                      className={`p-1 rounded transition-colors ${
                        card.verbalExplanation
                          ? 'text-indigo-400 bg-indigo-500/20'
                          : 'text-slate-600 hover:text-indigo-400'
                      }`}
                      title={card.verbalExplanation ? 'Manage verbal explanation' : 'Record verbal explanation'}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 rounded"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Q:
                    </span>
                    <p className="text-sm font-semibold text-white">{card.front}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      A:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{card.back}</p>
                  </div>
                  {card.hint && (
                    <p className="text-[11px] text-amber-300/80 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      💡 {card.hint}
                    </p>
                  )}

                  {card.verbalExplanation && (
                    <div className="pt-2">
                      <CardAudioPlayer
                        explanation={card.verbalExplanation}
                        compact={true}
                        onDelete={() => handleDeleteExplanation(card.id)}
                        onRerecord={() => setRecordingCard(card)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-500">
                  Status:{' '}
                  <span
                    className={`font-semibold capitalize ${
                      card.masteryStatus === 'mastered'
                        ? 'text-emerald-400'
                        : card.masteryStatus === 'learning'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {card.masteryStatus}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const updated = deck.flashcards.map((c) =>
                        c.id === card.id
                          ? {
                              ...c,
                              masteryStatus:
                                c.masteryStatus === 'mastered'
                                  ? ('learning' as MasteryStatus)
                                  : ('mastered' as MasteryStatus),
                            }
                          : c
                      );
                      onUpdateDeck({ ...deck, flashcards: updated });
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-medium border ${
                      card.masteryStatus === 'mastered'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {card.masteryStatus === 'mastered' ? 'Mastered' : 'Mark Mastered'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Add Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Custom Flashcard
              </h3>
              <button
                onClick={() => setIsAddingCard(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Card Front (Question / Prompt)
                </label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  required
                  rows={2}
                  placeholder="e.g. What is the difference between active and passive transport?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Card Back (Explanation / Answer)
                </label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Active transport requires ATP energy to pump molecules against concentration gradient; passive transport occurs spontaneously down gradient."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Hint / Mnemonic (Optional)
                  </label>
                  <input
                    type="text"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    placeholder="e.g. Active = ATP"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Mechanism"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Add Card to Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export & Printable PDF Modal */}
      <ExportDeckModal
        deck={deck}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Verbal Explanation Recording Modal */}
      <CardAudioRecorderModal
        card={recordingCard}
        isOpen={Boolean(recordingCard)}
        onClose={() => setRecordingCard(null)}
        onSaveExplanation={handleSaveExplanation}
      />
    </div>
  );
};

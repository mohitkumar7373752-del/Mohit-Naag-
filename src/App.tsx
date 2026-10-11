import React, { useState, useEffect } from 'react';
import { DEFAULT_DECKS } from './data/defaultDecks';
import { DEFAULT_NOTES, DEFAULT_QUIZ_ATTEMPTS } from './data/defaultNotes';
import { StudyDeck, StudyNote, QuizAttempt } from './types/study';
import { Header, AppTab } from './components/Header';
import { NotesManager } from './components/NotesManager';
import { NoteQuizPlayer } from './components/NoteQuizPlayer';
import { ProgressDashboard } from './components/ProgressDashboard';
import { FlashcardViewer } from './components/FlashcardViewer';
import { QuizRunner } from './components/QuizRunner';
import { StudySummaryView } from './components/StudySummaryView';
import { DeckLibrary } from './components/DeckLibrary';
import { DeckGeneratorModal } from './components/DeckGeneratorModal';
import { useStreak } from './context/StreakContext';
import { Sparkles, Layers, BookOpen, HelpCircle, StickyNote, TrendingUp } from 'lucide-react';

const STORAGE_KEY = 'studypulse_decks_v1';
const ACTIVE_DECK_KEY = 'studypulse_active_deck_id_v1';
const NOTES_STORAGE_KEY = 'studypulse_notes_v1';
const PROGRESS_STORAGE_KEY = 'studypulse_progress_history_v1';

export default function App() {
  const { recordInteraction } = useStreak();

  // Decks State
  const [decks, setDecks] = useState<StudyDeck[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load decks from localStorage', e);
    }
    return DEFAULT_DECKS;
  });

  const [activeDeckId, setActiveDeckId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_DECK_KEY);
      if (savedId) return savedId;
    } catch (e) {
      // fallback
    }
    return DEFAULT_DECKS[0]?.id || null;
  });

  // Notes State
  const [notes, setNotes] = useState<StudyNote[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
    }
    return DEFAULT_NOTES;
  });

  // Quiz Attempt History State (for Progress tab)
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load quiz attempts', e);
    }
    return DEFAULT_QUIZ_ATTEMPTS;
  });

  // Active Quiz Player State
  const [activeQuizPlayer, setActiveQuizPlayer] = useState<{
    noteId: string;
    noteTitle: string;
    noteSubject: string;
    questions: any[];
  } | null>(null);

  const [currentTab, setCurrentTab] = useState<AppTab>('notes');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorInitialInput, setGeneratorInitialInput] = useState<string | undefined>(undefined);
  const [generatorInitialMode, setGeneratorInitialMode] = useState<'topic' | 'notes'>('topic');

  // Sync decks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error('Failed to persist decks', e);
    }
  }, [decks]);

  // Sync notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to persist notes', e);
    }
  }, [notes]);

  // Sync quiz attempts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(quizAttempts));
    } catch (e) {
      console.error('Failed to persist progress attempts', e);
    }
  }, [quizAttempts]);

  // Sync active deck ID to localStorage
  useEffect(() => {
    if (activeDeckId) {
      localStorage.setItem(ACTIVE_DECK_KEY, activeDeckId);
    }
  }, [activeDeckId]);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || null;

  // Deck generation callback
  const handleDeckGenerated = (newDeck: StudyDeck) => {
    setDecks((prev) => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    setCurrentTab('flashcards');
    recordInteraction('ai_generate', `Generated AI study set: "${newDeck.title}"`);
  };

  // Open generator with pre-filled note content
  const handleGenerateFromNote = (note: StudyNote) => {
    setGeneratorInitialInput(note.content);
    setGeneratorInitialMode('notes');
    setIsGeneratorOpen(true);
    recordInteraction('note_view', `Opened AI generator for note: "${note.title}"`);
  };

  const handleOpenNormalGenerator = () => {
    setGeneratorInitialInput(undefined);
    setGeneratorInitialMode('topic');
    setIsGeneratorOpen(true);
  };

  // Notes CRUD Handlers
  const handleCreateNote = (newNote: StudyNote) => {
    setNotes((prev) => [newNote, ...prev]);
    recordInteraction('note_create', `Created study note: "${newNote.title}"`);
  };

  const handleUpdateNote = (updatedNote: StudyNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    recordInteraction('note_edit', `Updated study note: "${updatedNote.title}"`);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Start Note Quiz in Player
  const handleStartNoteQuiz = (note: StudyNote) => {
    if (note.generatedQuiz && note.generatedQuiz.quizzes.length > 0) {
      setActiveQuizPlayer({
        noteId: note.id,
        noteTitle: note.title,
        noteSubject: note.subject,
        questions: note.generatedQuiz.quizzes,
      });
      recordInteraction('quiz_start', `Started interactive quiz: "${note.title}"`);
    }
  };

  // Save Quiz Attempt to Progress History
  const handleSaveQuizAttempt = (attempt: QuizAttempt) => {
    setQuizAttempts((prev) => [attempt, ...prev]);
    recordInteraction(
      'quiz_complete',
      `Completed quiz: "${attempt.title}" (${attempt.percentage}%)`
    );
  };

  const handleClearHistory = () => {
    setQuizAttempts([]);
  };

  const handleRetakeQuizFromHistory = (attempt: QuizAttempt) => {
    recordInteraction('quiz_retake', `Retook quiz: "${attempt.title}"`);
    const note = notes.find((n) => n.id === attempt.sourceId);
    if (note && note.generatedQuiz && note.generatedQuiz.quizzes.length > 0) {
      setActiveQuizPlayer({
        noteId: note.id,
        noteTitle: note.title,
        noteSubject: note.subject,
        questions: note.generatedQuiz.quizzes,
      });
    } else {
      const reconstructed = attempt.questionsReview.map((rev, i) => ({
        id: `reconstructed-${attempt.id}-${i}`,
        question: rev.question,
        options: rev.options,
        correctIndex: rev.correctAnswerIndex,
        explanation: rev.explanation,
        conceptTested: attempt.subject,
      }));
      setActiveQuizPlayer({
        noteId: attempt.sourceId,
        noteTitle: attempt.title,
        noteSubject: attempt.subject,
        questions: reconstructed,
      });
    }
  };

  // Update deck state (e.g. flashcard status, quiz history, edits)
  const handleUpdateDeck = (updatedDeck: StudyDeck) => {
    setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
  };

  // Delete deck
  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => {
      const remaining = prev.filter((d) => d.id !== deckId);
      if (activeDeckId === deckId) {
        setActiveDeckId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  // Duplicate deck
  const handleDuplicateDeck = (deckToCopy: StudyDeck) => {
    const copy: StudyDeck = {
      ...deckToCopy,
      id: `deck-${Date.now()}`,
      title: `${deckToCopy.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      flashcards: deckToCopy.flashcards.map((c, i) => ({
        ...c,
        id: `card-${Date.now()}-${i}`,
        masteryStatus: 'new',
        reviewCount: 0,
      })),
      quizzes: deckToCopy.quizzes.map((q, i) => ({
        ...q,
        id: `quiz-${Date.now()}-${i}`,
        userAnswer: null,
      })),
      quizHistory: [],
    };
    setDecks((prev) => [copy, ...prev]);
    setActiveDeckId(copy.id);
  };

  // Import deck
  const handleImportDeck = (importedDeck: StudyDeck) => {
    setDecks((prev) => [importedDeck, ...prev]);
    setActiveDeckId(importedDeck.id);
    setCurrentTab('flashcards');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeDeck={activeDeck}
        onOpenGenerator={handleOpenNormalGenerator}
        totalDecksCount={decks.length}
        totalNotesCount={notes.length}
        totalAttemptsCount={quizAttempts.length}
      />

      {/* Main Study Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'notes' ? (
          <NotesManager
            notes={notes}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onGenerateFromNote={handleGenerateFromNote}
            onStartNoteQuiz={handleStartNoteQuiz}
          />
        ) : currentTab === 'progress' ? (
          <ProgressDashboard
            attempts={quizAttempts}
            onClearHistory={handleClearHistory}
            onRetakeQuiz={handleRetakeQuizFromHistory}
            onNavigateToNotes={() => setCurrentTab('notes')}
          />
        ) : currentTab === 'library' ? (
          <DeckLibrary
            decks={decks}
            activeDeckId={activeDeckId}
            onSelectDeck={(deck) => {
              setActiveDeckId(deck.id);
              setCurrentTab('flashcards');
            }}
            onOpenGenerator={handleOpenNormalGenerator}
            onDeleteDeck={handleDeleteDeck}
            onImportDeck={handleImportDeck}
            onDuplicateDeck={handleDuplicateDeck}
          />
        ) : !activeDeck ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
            <Layers className="w-16 h-16 text-indigo-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">No active study deck selected</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Select an existing study deck, open your notes, or generate a new set with AI.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('notes')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Browse Study Notes
              </button>
              <button
                onClick={() => setCurrentTab('progress')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                View Progress
              </button>
              <button
                onClick={handleOpenNormalGenerator}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30"
              >
                Create with AI
              </button>
            </div>
          </div>
        ) : currentTab === 'flashcards' ? (
          <FlashcardViewer
            deck={activeDeck}
            onUpdateDeck={handleUpdateDeck}
            onOpenGenerator={handleOpenNormalGenerator}
            onSwitchToQuiz={() => setCurrentTab('quiz')}
          />
        ) : currentTab === 'quiz' ? (
          <QuizRunner
            deck={activeDeck}
            onUpdateDeck={handleUpdateDeck}
            onSwitchToFlashcards={() => setCurrentTab('flashcards')}
          />
        ) : currentTab === 'summary' ? (
          <StudySummaryView
            deck={activeDeck}
            onSwitchToFlashcards={() => setCurrentTab('flashcards')}
            onSwitchToQuiz={() => setCurrentTab('quiz')}
          />
        ) : null}
      </main>

      {/* Interactive Quiz Player Interface Modal */}
      {activeQuizPlayer && (
        <NoteQuizPlayer
          noteId={activeQuizPlayer.noteId}
          noteTitle={activeQuizPlayer.noteTitle}
          noteSubject={activeQuizPlayer.noteSubject}
          questions={activeQuizPlayer.questions}
          onClose={() => setActiveQuizPlayer(null)}
          onSaveAttempt={handleSaveQuizAttempt}
          onViewProgress={() => setCurrentTab('progress')}
        />
      )}

      {/* AI Deck Generator Modal */}
      <DeckGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onDeckGenerated={handleDeckGenerated}
        initialInput={generatorInitialInput}
        initialMode={generatorInitialMode}
      />
    </div>
  );
}

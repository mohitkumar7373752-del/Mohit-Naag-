import React, { useState, useRef } from 'react';
import {
  Layers,
  Search,
  Plus,
  BookOpen,
  HelpCircle,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Copy,
  Calendar,
  CheckCircle2,
  Award,
  MoreVertical,
  FileCode,
  Printer,
} from 'lucide-react';
import { StudyDeck } from '../types/study';
import { ExportDeckModal } from './ExportDeckModal';

interface DeckLibraryProps {
  decks: StudyDeck[];
  activeDeckId: string | null;
  onSelectDeck: (deck: StudyDeck) => void;
  onOpenGenerator: () => void;
  onDeleteDeck: (deckId: string) => void;
  onImportDeck: (imported: StudyDeck) => void;
  onDuplicateDeck: (deck: StudyDeck) => void;
}

export const DeckLibrary: React.FC<DeckLibraryProps> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  onOpenGenerator,
  onDeleteDeck,
  onImportDeck,
  onDuplicateDeck,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [exportingDeck, setExportingDeck] = useState<StudyDeck | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collect all unique tags
  const allTags = Array.from(
    new Set(decks.flatMap((d) => d.tags || []).filter(Boolean))
  );

  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(search.toLowerCase()) ||
      deck.topic.toLowerCase().includes(search.toLowerCase()) ||
      (deck.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesTag = selectedTag === 'all' || (deck.tags || []).includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const exportDeckJSON = (deck: StudyDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${deck.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-study-deck.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportDeckAnki = (deck: StudyDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simple tab-separated format for Anki import: Front \t Back \t Tags
    const lines = deck.flashcards.map(
      (c) => `${c.front.replace(/\t/g, ' ')}\t${c.back.replace(/\t/g, ' ')}\t${deck.topic}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-anki.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.title || !json.flashcards || !json.quizzes) {
          throw new Error('Invalid StudyPulse deck JSON format.');
        }
        const imported: StudyDeck = {
          ...json,
          id: `deck-${Date.now()}`,
          title: `${json.title} (Imported)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onImportDeck(imported);
        alert(`Successfully imported "${imported.title}"!`);
      } catch (err: any) {
        alert(err.message || 'Failed to read file as JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Library Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Personal Study Library
            </span>
            <span className="text-xs text-slate-400">{decks.length} Decks</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Your Study Sets & Subjects
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Import deck from JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import Deck</span>
          </button>

          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Generate New Deck</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decks by title, topic, or tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-2 rounded-xl font-medium shrink-0 transition-colors ${
              selectedTag === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Subjects
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-2 rounded-xl font-medium shrink-0 transition-colors ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* "+ Create New Deck Card" */}
        <div
          onClick={onOpenGenerator}
          className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300">
            Create / Generate Deck
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
            Input notes or any topic to generate AI flashcards and quiz questions
          </p>
        </div>

        {filteredDecks.map((deck) => {
          const isActive = deck.id === activeDeckId;
          const totalCards = deck.flashcards.length;
          const masteredCards = deck.flashcards.filter((c) => c.masteryStatus === 'mastered').length;
          const masteryPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
          const lastQuiz = deck.quizHistory?.[deck.quizHistory.length - 1];

          return (
            <div
              key={deck.id}
              onClick={() => onSelectDeck(deck)}
              className={`relative bg-slate-900 border rounded-3xl p-6 shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col justify-between group ${
                isActive
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header tags and active indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {deck.topic}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {deck.difficulty}
                    </span>
                  </div>

                  {isActive && (
                    <span className="text-[10px] uppercase font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Active
                    </span>
                  )}
                </div>

                {/* Deck Title */}
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2">
                  {deck.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(deck.tags || []).slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress and Stats */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                {/* Card and Quiz Counts */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{totalCards} Flashcards</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                    <span>{deck.quizzes.length} Questions</span>
                  </span>
                </div>

                {/* Mastery Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Card Mastery</span>
                    <span className="font-semibold text-emerald-400">{masteryPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${masteryPct}%` }}
                    />
                  </div>
                </div>

                {/* Last quiz score if available */}
                {lastQuiz && (
                  <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      Last Quiz:
                    </span>
                    <span className="font-bold text-white">
                      {lastQuiz.score}/{lastQuiz.total} ({lastQuiz.percentage}%)
                    </span>
                  </div>
                )}

                {/* Footer deck actions */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between pt-2 text-xs text-slate-500"
                >
                  <span className="text-[10px]">
                    {new Date(deck.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportingDeck(deck);
                      }}
                      className="p-1.5 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                      title="Export Flashcards (CSV or Printable PDF)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => exportDeckAnki(deck, e)}
                      className="p-1.5 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Export to Anki TXT"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => exportDeckJSON(deck, e)}
                      className="p-1.5 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Export to JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateDeck(deck);
                      }}
                      className="p-1.5 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Duplicate deck"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete deck "${deck.title}"?`)) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                      className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export & Printable PDF Modal */}
      {exportingDeck && (
        <ExportDeckModal
          deck={exportingDeck}
          isOpen={!!exportingDeck}
          onClose={() => setExportingDeck(null)}
        />
      )}
    </div>
  );
};

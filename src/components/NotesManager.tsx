import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Tag,
  Clock,
  BookOpen,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  X,
  RotateCw,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Lightbulb,
  Award,
  Layers,
  Play,
} from 'lucide-react';
import { StudyNote, StudyDeck, QuizQuestion, Flashcard } from '../types/study';
import { generateNoteQuizAPI } from '../services/api';
import { useStreak } from '../context/StreakContext';

interface NotesManagerProps {
  notes: StudyNote[];
  onCreateNote: (note: StudyNote) => void;
  onUpdateNote: (note: StudyNote) => void;
  onDeleteNote: (noteId: string) => void;
  onGenerateFromNote: (note: StudyNote) => void;
  onStartNoteQuiz: (note: StudyNote) => void;
  onOpenDeck?: (deck: StudyDeck) => void;
}

const COMMON_SUBJECTS = [
  'Physics',
  'History',
  'Programming',
  'Biology',
  'Chemistry',
  'Mathematics',
  'Literature',
  'Economics',
  'Psychology',
  'Medicine',
];

// Soothing, restrained student subject palette in cohesive slate/indigo tones
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Physics: { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/20' },
  History: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/20' },
  Programming: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  Biology: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/20' },
  Chemistry: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/20' },
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/20' },
  Literature: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/20' },
  Economics: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700/60' },
  Psychology: { bg: 'bg-indigo-500/10', text: 'text-indigo-200', border: 'border-indigo-500/20' },
  Medicine: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
};

function getSubjectBadge(subject: string) {
  const normalized = Object.keys(SUBJECT_COLORS).find(
    (k) => k.toLowerCase() === subject.toLowerCase()
  );
  if (normalized && SUBJECT_COLORS[normalized]) {
    return SUBJECT_COLORS[normalized];
  }
  return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
}

// Clean markdown-like renderer with modern editorial typography
function renderRichText(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-sm font-bold text-slate-100 mt-4 mb-1.5 tracking-tight">
          {line.replace('### ', '')}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-base font-bold text-indigo-300 mt-5 mb-2 tracking-tight">
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-lg font-bold text-white mt-6 mb-2.5">
          {line.replace('# ', '')}
        </h1>
      );
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote
          key={idx}
          className="border-l-2 border-indigo-500/80 pl-3.5 py-1 my-2 bg-indigo-950/20 text-indigo-200/90 text-xs italic rounded-r-lg"
        >
          {line.replace('> ', '')}
        </blockquote>
      );
    }
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const text = line.replace(/^[\*\-]\s+/, '');
      return (
        <li key={idx} className="text-xs sm:text-sm text-slate-300 list-disc list-inside my-0.5 leading-relaxed">
          {renderInlineFormatting(text)}
        </li>
      );
    }
    if (/^\d+\.\s+/.test(line)) {
      const text = line.replace(/^\d+\.\s+/, '');
      return (
        <li key={idx} className="text-xs sm:text-sm text-slate-300 list-decimal list-inside my-0.5 leading-relaxed">
          {renderInlineFormatting(text)}
        </li>
      );
    }
    if (line.startsWith('```')) {
      return (
        <div key={idx} className="text-[11px] font-mono text-slate-500 py-0.5">
          {line}
        </div>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed my-1">
        {renderInlineFormatting(line)}
      </p>
    );
  });
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[11px] border border-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onGenerateFromNote,
  onStartNoteQuiz,
  onOpenDeck,
}) => {
  const { recordInteraction } = useStreak();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Modal states
  const [viewingNote, setViewingNote] = useState<StudyNote | null>(null);
  const [viewTab, setViewTab] = useState<'note' | 'quiz' | 'flashcards'>('note');
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Note Quiz generation state
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenError, setQuizGenError] = useState<string | null>(null);
  const [noteUserAnswers, setNoteUserAnswers] = useState<Record<string, number>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Editor form state
  const [editorTitle, setEditorTitle] = useState('');
  const [editorSubject, setEditorSubject] = useState('Physics');
  const [editorCustomSubject, setEditorCustomSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Unique subjects for filter tabs
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.subject) set.add(n.subject);
    });
    return Array.from(set);
  }, [notes]);

  // Filtered & sorted notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.subject.toLowerCase().includes(search.toLowerCase()) ||
          note.content.toLowerCase().includes(search.toLowerCase()) ||
          (note.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));

        const matchesSubject =
          selectedSubject === 'all' ||
          note.subject.toLowerCase() === selectedSubject.toLowerCase();

        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [notes, search, selectedSubject, sortBy]);

  // Handle Generate AI Quiz (5 MCQs and 3 Flashcards linked to note)
  const handleGenerateAIQuiz = async (note: StudyNote, autoStartQuiz = false) => {
    setIsGeneratingQuiz(true);
    setQuizGenError(null);

    try {
      const result = await generateNoteQuizAPI(
        note.id,
        note.title,
        note.subject,
        note.content
      );

      const updatedNote: StudyNote = {
        ...note,
        generatedQuiz: result,
        updatedAt: new Date().toISOString(),
      };

      onUpdateNote(updatedNote);
      setViewingNote(updatedNote);
      setNoteUserAnswers({});
      setFlippedCards({});
      recordInteraction('ai_generate', `Generated AI Quiz: "${note.title}"`);

      if (autoStartQuiz) {
        onStartNoteQuiz(updatedNote);
      } else {
        setViewTab('quiz');
      }
    } catch (err: any) {
      console.error('Error generating AI quiz for note:', err);
      setQuizGenError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Start Quiz handler: if quiz exists, launches player; otherwise generates & launches
  const handleStartQuizClick = (note: StudyNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (note.generatedQuiz && note.generatedQuiz.quizzes.length > 0) {
      onStartNoteQuiz(note);
    } else {
      handleGenerateAIQuiz(note, true);
    }
  };

  // Open editor for creating
  const handleStartCreate = () => {
    setEditorTitle('');
    setEditorSubject('Physics');
    setEditorCustomSubject('');
    setEditorContent('');
    setEditorTags('');
    setEditorTab('write');
    setIsCreating(true);
    setEditingNote(null);
  };

  // Open editor for editing
  const handleStartEdit = (note: StudyNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditorTitle(note.title);
    setEditorSubject(COMMON_SUBJECTS.includes(note.subject) ? note.subject : 'Other');
    setEditorCustomSubject(COMMON_SUBJECTS.includes(note.subject) ? '' : note.subject);
    setEditorContent(note.content);
    setEditorTags((note.tags || []).join(', '));
    setEditorTab('write');
    setEditingNote(note);
    setIsCreating(false);
  };

  // Save note (create or edit)
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle.trim() || !editorContent.trim()) {
      alert('Please provide both a note title and content.');
      return;
    }

    const finalSubject =
      editorSubject === 'Other' && editorCustomSubject.trim()
        ? editorCustomSubject.trim()
        : editorSubject;

    const tagsArray = editorTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    if (editingNote) {
      const updated: StudyNote = {
        ...editingNote,
        title: editorTitle.trim(),
        subject: finalSubject,
        content: editorContent.trim(),
        tags: tagsArray,
        updatedAt: now,
      };
      onUpdateNote(updated);
      setEditingNote(null);
    } else {
      const newNote: StudyNote = {
        id: `note-${Date.now()}`,
        title: editorTitle.trim(),
        subject: finalSubject,
        content: editorContent.trim(),
        tags: tagsArray,
        createdAt: now,
        updatedAt: now,
      };
      onCreateNote(newNote);
      setIsCreating(false);
    }
  };

  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setEditorContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 0);
  };

  const copyNoteContent = (note: StudyNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\nSubject: ${note.subject}\n\n${note.content}`);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Clean, Minimalist & Modern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Study Notes Hub
            </span>
            <span className="text-xs text-slate-400 font-normal">{notes.length} Total Notes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Notes & Syllabus Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl font-normal">
            Organize lectures, textbooks, and key concepts. Generate 5 targeted MCQs & 3 active-recall flashcards directly linked to any note.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create Note</span>
        </button>
      </div>

      {/* Search, Filter by Subject, and Sorting Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by title, subject, content, or tags..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter by Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedSubject === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            All Subjects ({notes.length})
          </button>
          {allSubjects.map((sub) => {
            const count = notes.filter((n) => n.subject.toLowerCase() === sub.toLowerCase()).length;
            const isSelected = selectedSubject.toLowerCase() === sub.toLowerCase();
            const badge = getSubjectBadge(sub);
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800/80'
                }`}
              >
                <span>{sub}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No notes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedSubject !== 'all'
              ? 'No notes match your current search and subject filters.'
              : 'You haven’t created any study notes yet. Create your first note to begin!'}
          </p>
          <button
            onClick={handleStartCreate}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            Create a Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredNotes.map((note) => {
            const badge = getSubjectBadge(note.subject);
            const wordCount = note.content.trim().split(/\s+/).length;
            const estReadTime = Math.max(1, Math.ceil(wordCount / 180));
            const hasQuiz = !!note.generatedQuiz;

            return (
              <div
                key={note.id}
                onClick={() => {
                  setViewingNote(note);
                  setViewTab('note');
                  setNoteUserAnswers({});
                  recordInteraction('note_view', `Reviewed note: "${note.title}"`);
                }}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Subject Badge & Reading Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {note.subject}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {estReadTime} min read
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2">
                    {note.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 font-normal">
                    {note.content.replace(/[#*`>]/g, '')}
                  </p>

                  {/* Linked Quiz Indicator Badge */}
                  {hasQuiz && (
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>5 MCQs • 3 Flashcards</span>
                    </div>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {note.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <span className="text-[10px] text-slate-500">
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Start Quiz button directly on note card */}
                    <button
                      onClick={(e) => handleStartQuizClick(note, e)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
                      title="Start interactive quiz with timer & radio buttons"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Quiz</span>
                    </button>

                    {/* Direct Button: Generate AI Quiz */}
                    <button
                      onClick={() => {
                        setViewingNote(note);
                        handleGenerateAIQuiz(note);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                      title="Generate 5 MCQs and 3 Flashcards linked to this note"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>{hasQuiz ? 'Regenerate' : 'AI Quiz'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewingNote(note);
                        setViewTab('note');
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="View full note"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleStartEdit(note, e)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete note "${note.title}"?`)) {
                          onDeleteNote(note.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NOTE READER / VIEWER MODAL WITH 'Generate AI Quiz' FEATURE */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    getSubjectBadge(viewingNote.subject).bg
                  } ${getSubjectBadge(viewingNote.subject).text} ${
                    getSubjectBadge(viewingNote.subject).border
                  }`}
                >
                  {viewingNote.subject}
                </span>

                {/* Sub-view navigation tabs */}
                <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs shrink-0">
                  <button
                    onClick={() => setViewTab('note')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      viewTab === 'note' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Note Text
                  </button>
                  <button
                    onClick={() => setViewTab('quiz')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      viewTab === 'quiz' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Quiz (5 MCQs)</span>
                    {viewingNote.generatedQuiz && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setViewTab('flashcards')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      viewTab === 'flashcards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Flashcards (3)</span>
                    {viewingNote.generatedQuiz && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setViewingNote(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Content Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
              {/* Title & Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {viewingNote.title}
                  </h1>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Updated {new Date(viewingNote.updatedAt || viewingNote.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Start Quiz Button */}
                  <button
                    onClick={() => handleStartQuizClick(viewingNote)}
                    disabled={isGeneratingQuiz}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Quiz</span>
                  </button>

                  {/* THE CORE BUTTON: 'Generate AI Quiz' */}
                  <button
                    onClick={() => handleGenerateAIQuiz(viewingNote)}
                    disabled={isGeneratingQuiz}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isGeneratingQuiz ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingQuiz
                        ? 'Generating...'
                        : viewingNote.generatedQuiz
                        ? 'Regenerate AI Quiz'
                        : 'Generate AI Quiz'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error banner if quiz generation fails */}
              {quizGenError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span>{quizGenError}</span>
                  <button
                    onClick={() => handleGenerateAIQuiz(viewingNote)}
                    className="underline font-bold text-rose-200 hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Generating Animation Banner */}
              {isGeneratingQuiz && (
                <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2.5 text-center">
                  <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                  <h4 className="text-sm font-semibold text-white">
                    Reading Note Content & Generating AI Quiz...
                  </h4>
                  <p className="text-xs text-indigo-200/80 max-w-md mx-auto">
                    Analyzing key definitions, crafting 5 realistic multiple-choice questions with 4 options and explanations, plus 3 active-recall flashcards.
                  </p>
                </div>
              )}

              {/* TAB 1: Note Text */}
              {viewTab === 'note' && (
                <div className="space-y-4">
                  {/* Tags */}
                  {viewingNote.tags && viewingNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {viewingNote.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Formatted body */}
                  <div className="pt-2 leading-relaxed">
                    {renderRichText(viewingNote.content)}
                  </div>
                </div>
              )}

              {/* TAB 2: AI Quiz (5 MCQs) */}
              {viewTab === 'quiz' && (
                <div className="space-y-4">
                  {!viewingNote.generatedQuiz ? (
                    <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
                      <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
                      <h3 className="text-sm font-semibold text-slate-200">No AI Quiz Generated Yet</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Click the button below to generate 5 multiple-choice questions with 4 options and explanations from this note.
                      </p>
                      <button
                        onClick={() => handleGenerateAIQuiz(viewingNote)}
                        disabled={isGeneratingQuiz}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      >
                        Generate AI Quiz
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Quiz Header & Live Score */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-semibold text-white">
                            Linked 5-Question Quiz
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({viewingNote.generatedQuiz.quizzes.length} MCQs)
                          </span>
                        </div>

                        {/* Reset Answers */}
                        {Object.keys(noteUserAnswers).length > 0 && (
                          <button
                            onClick={() => setNoteUserAnswers({})}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Answers</span>
                          </button>
                        )}
                      </div>

                      {/* Render the 5 MCQs */}
                      <div className="space-y-4">
                        {viewingNote.generatedQuiz.quizzes.map((quiz, qIdx) => {
                          const userChoice = noteUserAnswers[quiz.id];
                          const hasAnswered = userChoice !== undefined;
                          const isCorrect = userChoice === quiz.correctIndex;

                          return (
                            <div
                              key={quiz.id}
                              className={`p-5 rounded-xl border transition-all ${
                                hasAnswered
                                  ? isCorrect
                                    ? 'bg-emerald-950/10 border-emerald-500/30'
                                    : 'bg-rose-950/10 border-rose-500/30'
                                  : 'bg-slate-950/70 border-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                                  Q{qIdx + 1}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                  {quiz.conceptTested}
                                </span>
                              </div>

                              <h4 className="text-sm font-semibold text-white mb-3.5">
                                {quiz.question}
                              </h4>

                              {/* 4 Options */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {quiz.options.map((option, optIdx) => {
                                  const isOptionCorrect = optIdx === quiz.correctIndex;
                                  const isSelected = userChoice === optIdx;

                                  let optClass =
                                    'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40';

                                  if (hasAnswered) {
                                    if (isOptionCorrect) {
                                      optClass =
                                        'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-medium';
                                    } else if (isSelected && !isOptionCorrect) {
                                      optClass =
                                        'bg-rose-500/15 border-rose-500/50 text-rose-200 font-medium';
                                    } else {
                                      optClass = 'bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-60';
                                    }
                                  }

                                  const letters = ['A', 'B', 'C', 'D'];

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => {
                                        if (!hasAnswered) {
                                          setNoteUserAnswers((prev) => ({
                                            ...prev,
                                            [quiz.id]: optIdx,
                                          }));
                                        }
                                      }}
                                      disabled={hasAnswered}
                                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer ${optClass}`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                          hasAnswered && isOptionCorrect
                                            ? 'bg-emerald-500 text-slate-950'
                                            : hasAnswered && isSelected && !isOptionCorrect
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                        }`}
                                      >
                                        {letters[optIdx]}
                                      </span>
                                      <span className="flex-1 leading-relaxed">{option}</span>
                                      {hasAnswered && isOptionCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                      )}
                                      {hasAnswered && isSelected && !isOptionCorrect && (
                                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation once answered */}
                              {hasAnswered && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
                                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                    Rationale:
                                  </span>
                                  <p>{quiz.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Flashcards (3 Cards) */}
              {viewTab === 'flashcards' && (
                <div className="space-y-4">
                  {!viewingNote.generatedQuiz ? (
                    <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
                      <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                      <h3 className="text-sm font-semibold text-slate-200">No Flashcards Generated Yet</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Click 'Generate AI Quiz' to automatically produce 3 high-yield active-recall flashcards from this note.
                      </p>
                      <button
                        onClick={() => handleGenerateAIQuiz(viewingNote)}
                        disabled={isGeneratingQuiz}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      >
                        Generate AI Quiz
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span>3 Active-Recall Flashcards</span>
                        <span className="italic text-slate-500">Click card to flip</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {viewingNote.generatedQuiz.flashcards.map((card, cIdx) => {
                          const isFlipped = !!flippedCards[card.id];

                          return (
                            <div
                              key={card.id}
                              onClick={() =>
                                setFlippedCards((prev) => ({
                                  ...prev,
                                  [card.id]: !prev[card.id],
                                }))
                              }
                              className="perspective-1000 min-h-[250px] cursor-pointer group"
                            >
                              <div
                                className={`relative w-full h-full min-h-[250px] rounded-2xl transition-transform duration-500 transform-style-preserve-3d shadow-sm ${
                                  isFlipped ? 'rotate-y-180' : ''
                                }`}
                              >
                                {/* FRONT */}
                                <div className="absolute inset-0 backface-hidden bg-slate-950 border border-slate-800 group-hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between text-left">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                      Card #{cIdx + 1}
                                    </span>
                                    <RotateCw className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400" />
                                  </div>

                                  <div className="my-auto py-2">
                                    <p className="text-sm font-semibold text-white leading-relaxed">
                                      {card.front}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300">
                                    {card.hint && <span>💡 {card.hint}</span>}
                                  </div>
                                </div>

                                {/* BACK */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between text-left">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      Answer
                                    </span>
                                    <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                                  </div>

                                  <div className="my-auto py-2">
                                    <p className="text-xs sm:text-sm font-normal text-slate-200 leading-relaxed">
                                      {card.back}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                                    {card.category}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyNoteContent(viewingNote)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
                >
                  {copiedId === viewingNote.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    handleStartEdit(viewingNote);
                    setViewingNote(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Note</span>
                </button>
              </div>

              {/* Action Buttons: Start Quiz & Generate AI Quiz */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartQuizClick(viewingNote)}
                  disabled={isGeneratingQuiz}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Quiz</span>
                </button>

                <button
                  onClick={() => handleGenerateAIQuiz(viewingNote)}
                  disabled={isGeneratingQuiz}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>
                    {isGeneratingQuiz
                      ? 'Generating...'
                      : viewingNote.generatedQuiz
                      ? 'Regenerate AI Quiz'
                      : 'Generate AI Quiz'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTE EDITOR MODAL (CREATE / EDIT) */}
      {(isCreating || editingNote) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {editingNote ? 'Edit Study Note' : 'Create New Study Note'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingNote(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Form */}
            <form onSubmit={handleSaveNote} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Note Title
                </label>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  required
                  placeholder="e.g. Thermodynamics Laws, European History 1848, Graph Traversal Algorithms..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Subject Category Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject Category
                  </label>
                  <select
                    value={editorSubject}
                    onChange={(e) => setEditorSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {COMMON_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Subject)</option>
                  </select>
                </div>

                {editorSubject === 'Other' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Specify Subject Name
                    </label>
                    <input
                      type="text"
                      value={editorCustomSubject}
                      onChange={(e) => setEditorCustomSubject(e.target.value)}
                      required
                      placeholder="e.g. Astronomy, Linguistics, Law..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={editorTags}
                      onChange={(e) => setEditorTags(e.target.value)}
                      placeholder="e.g. Midterm, Chapter 4, Formulas"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Rich Content Editor Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Rich Text Note Content
                  </label>
                  <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        editorTab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        editorTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Formatting Toolbar */}
                {editorTab === 'write' && (
                  <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-800 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('## ')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Section Heading (## )"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('### ')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Subheading (### )"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-800 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('* ')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Bullet List (* )"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('1. ')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Numbered List (1. )"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('`', '`')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Inline Code (`code`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Quote Block (> )"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Textarea or Preview */}
                {editorTab === 'write' ? (
                  <textarea
                    ref={textareaRef}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    required
                    rows={11}
                    placeholder={`Write or paste your study notes here...\n\nUse ### for subheadings\n* for bullet points\n**text** for bold\n> for quotes or theorems`}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                  />
                ) : (
                  <div className="w-full min-h-[260px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm overflow-y-auto">
                    {editorContent ? (
                      renderRichText(editorContent)
                    ) : (
                      <p className="text-slate-500 italic">No content to preview.</p>
                    )}
                  </div>
                )}

                {/* Char and Word Counter */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    {editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0} words •{' '}
                    {editorContent.length} characters
                  </span>
                  <span>Markdown supported</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer"
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export type MasteryStatus = 'new' | 'learning' | 'mastered';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type DeckMode = 'topic' | 'notes';

export interface VerbalExplanation {
  id: string;
  audioUrl?: string;
  transcript?: string;
  recordedAt: string;
  durationSeconds: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string;
  category: string;
  masteryStatus: MasteryStatus;
  isStarred?: boolean;
  reviewCount?: number;
  lastReviewed?: string;
  verbalExplanation?: VerbalExplanation;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTested: string;
  userAnswer?: number | null;
  isFlagged?: boolean;
}

export interface StudySummary {
  overview: string;
  keyTakeaways: string[];
  essentialFormulasOrTheories?: string[];
  commonPitfalls?: string[];
}

export interface QuizResultHistory {
  id: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  timeSpentSeconds: number;
  missedQuestionIds: string[];
}

export interface StudyDeck {
  id: string;
  title: string;
  topic: string;
  sourceText?: string;
  difficulty: DifficultyLevel;
  mode: DeckMode;
  createdAt: string;
  updatedAt: string;
  summary: StudySummary;
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  tags: string[];
  quizHistory?: QuizResultHistory[];
}

export interface GenerateDeckPayload {
  input: string;
  mode: DeckMode;
  cardCount: number;
  quizCount: number;
  difficulty: DifficultyLevel;
  customFocus?: string;
}

export interface ExplainConceptPayload {
  topic: string;
  question: string;
  selectedAnswer?: string;
  correctAnswer: string;
  explanation: string;
  studentDoubt?: string;
}

export interface NoteGeneratedQuiz {
  generatedAt: string;
  provider?: string;
  quizzes: QuizQuestion[];
  flashcards: Flashcard[];
}

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  color?: string;
  generatedQuiz?: NoteGeneratedQuiz;
}

export interface QuizAttemptQuestionReview {
  question: string;
  options: string[];
  userAnswerIndex: number | null;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  sourceType: 'note' | 'deck';
  sourceId: string;
  title: string;
  subject: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  timeSpentSeconds: number;
  questionsReview: QuizAttemptQuestionReview[];
}




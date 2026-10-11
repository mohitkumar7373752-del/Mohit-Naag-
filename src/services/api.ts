import { GenerateDeckPayload, ExplainConceptPayload, StudyDeck } from '../types/study';

export async function generateDeckAPI(payload: GenerateDeckPayload): Promise<Partial<StudyDeck>> {
  const response = await fetch('/api/generate-study-deck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate study materials.');
  }

  return json.data;
}

export interface ExplainConceptResponse {
  breakdown: string;
  analogyOrMnemonic: string;
  concreteExample: string;
  proTip: string;
}

export async function explainConceptAPI(payload: ExplainConceptPayload): Promise<ExplainConceptResponse> {
  const response = await fetch('/api/explain-concept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch concept explanation.');
  }

  return json.data;
}

export async function generateNoteQuizAPI(
  noteId: string,
  noteTitle: string,
  noteSubject: string,
  noteContent: string
) {
  const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}/generate-quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      noteId,
      noteTitle,
      noteSubject,
      noteContent,
    }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate quiz and flashcards.');
  }

  return json.data;
}

export async function getNoteQuizAPI(noteId: string) {
  try {
    const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}/quiz`);
    const json = await response.json();
    if (response.ok && json.success) {
      return json.data;
    }
  } catch (e) {
    // ignore
  }
  return null;
}


import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Generate Study Material (Summary, Flashcards, and Quizzes)
app.post('/api/generate-study-deck', async (req, res) => {
  try {
    const {
      input,
      mode = 'notes',
      cardCount = 8,
      quizCount = 6,
      difficulty = 'intermediate',
      customFocus = '',
    } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide notes text or a topic to study.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check environment variables.',
      });
    }

    const prompt = `You are a master educator, cognitive learning specialist, and study coach.
Analyze the following student ${mode === 'topic' ? 'study topic' : 'study notes'} and produce a comprehensive, high-retention study set.

Difficulty Level: ${difficulty} (Adjust depth, technical rigor, and vocabulary accordingly).
Desired Flashcard Count: ${cardCount}
Desired Multiple Choice Quiz Questions Count: ${quizCount}
${customFocus ? `Special Focus / Emphasis: ${customFocus}` : ''}

STUDENT INPUT:
"""
${input.trim()}
"""

Requirements:
1. TITLE: Create a catchy, academic, and clear deck title (under 8 words).
2. TOPIC: Primary subject category (e.g. "Cellular Biology", "Macroeconomics", "Organic Chemistry", "Modern History", "Data Structures").
3. TAGS: 3 to 5 concise taxonomy keywords/tags.
4. SUMMARY:
   - overview: 2 to 3 well-written paragraphs summarizing key principles, relationships, and significance.
   - keyTakeaways: 4 to 6 punchy, high-value bullet points essential for revision.
   - essentialFormulasOrTheories: key formulas, laws, theorems, or named frameworks (if applicable to the subject, else key definitions).
   - commonPitfalls: 3 to 4 common student misconceptions or traps to avoid in exams.
5. FLASHCARDS:
   - Generate exactly ${cardCount} high-yield flashcards.
   - Front: Precise prompt, concept inquiry, "What happens when...", or term to define.
   - Back: Accurate, clear, digestible explanation (not overly verbose, easy for active recall).
   - Hint: A clever mnemonic, keyword clue, or memory hook to help recall if stuck.
   - Category: Tag like "Definition", "Mechanism", "Application", "Comparison", or "Key Fact".
6. QUIZZES:
   - Generate exactly ${quizCount} multiple-choice self-test questions.
   - Question: Clear question testing real understanding, not just trivial memorization.
   - Options: Array of exactly 4 plausible options.
   - CorrectIndex: Integer 0 to 3 denoting the correct option index.
   - Explanation: Detailed breakdown explaining WHY the correct option is right, and specifically WHY the distractors are incorrect or common pitfalls.
   - ConceptTested: Short label of the specific subconcept tested.

Ensure all outputs strictly conform to the JSON schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                essentialFormulasOrTheories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                commonPitfalls: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['overview', 'keyTakeaways', 'commonPitfalls'],
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['front', 'back', 'hint', 'category'],
              },
            },
            quizzes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  conceptTested: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation', 'conceptTested'],
              },
            },
          },
          required: ['title', 'topic', 'summary', 'flashcards', 'quizzes', 'tags'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error generating study deck:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate study materials with AI.',
    });
  }
});

// Endpoint: Instant AI Concept Breakdown (for when a student is stuck on a quiz or card)
app.post('/api/explain-concept', async (req, res) => {
  try {
    const {
      topic,
      question,
      selectedAnswer,
      correctAnswer,
      explanation,
      studentDoubt,
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const prompt = `You are a warm, patient, brilliant tutor.
A student was quizzed on:
Topic: ${topic || 'General Science / Humanities'}
Question: "${question}"
Correct Answer: "${correctAnswer}"
${selectedAnswer ? `Student Selected: "${selectedAnswer}" (Incorrect or confusing)` : ''}
Base Explanation: "${explanation}"
${studentDoubt ? `Student's specific question or confusion: "${studentDoubt}"` : ''}

Provide a deep, intuitive conceptual explanation to make this stick forever:
1. breakdown: Step-by-step intuitive walk-through. Avoid dry jargon; explain the underlying "why".
2. analogyOrMnemonic: A memorable visual analogy or mnemonic device that makes it effortless to remember.
3. concreteExample: A real-world scenario or mini case study demonstrating the principle in action.
4. proTip: An exam-day tip to never fall for distractors related to this topic again.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakdown: { type: Type.STRING },
            analogyOrMnemonic: { type: Type.STRING },
            concreteExample: { type: Type.STRING },
            proTip: { type: Type.STRING },
          },
          required: ['breakdown', 'analogyOrMnemonic', 'concreteExample', 'proTip'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from model.');
    }

    const result = JSON.parse(text);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in explain-concept:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate concept explanation.',
    });
  }
});

// In-Memory Database store for note quizzes linked to specific noteId
const noteQuizzesDatabase = new Map<string, any>();

// Endpoint: Generate 5 MCQs and 3 Flashcards for a Note
app.post('/api/notes/:id/generate-quiz', async (req, res) => {
  try {
    const noteId = req.params.id || req.body.noteId;
    const { noteTitle = 'Untitled Note', noteSubject = 'General', noteContent = '' } = req.body;

    if (!noteContent || typeof noteContent !== 'string' || noteContent.trim().length === 0) {
      return res.status(400).json({ error: 'Note content is required to generate quiz.' });
    }

    let parsedResult: any = null;
    let providerUsed = 'gemini';

    // 1. Check if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an educational assessment expert. Read the note content and automatically generate:
1. Exactly 5 multiple-choice questions (MCQs). Each question must have exactly 4 options, a correctIndex (integer 0 to 3), a thorough explanation, and conceptTested.
2. Exactly 3 high-yield flashcards with front (prompt), back (answer), hint (mnemonic), and category.
Output strictly valid JSON:
{
  "quizzes": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string",
      "conceptTested": "string"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "hint": "string",
      "category": "string"
    }
  ]
}`,
              },
              {
                role: 'user',
                content: `Note Title: ${noteTitle}\nSubject: ${noteSubject}\n\nNote Content:\n"""\n${noteContent.trim()}\n"""`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (openaiResponse.ok) {
          const openAiData = await openaiResponse.json();
          const content = openAiData.choices?.[0]?.message?.content;
          if (content) {
            parsedResult = JSON.parse(content);
            providerUsed = 'openai';
          }
        } else {
          console.warn('OpenAI request failed, falling back to Gemini:', await openaiResponse.text());
        }
      } catch (openAiErr) {
        console.warn('Error calling OpenAI API, falling back to Gemini:', openAiErr);
      }
    }

    // 2. If OpenAI was not configured or failed, use Gemini AI
    if (!parsedResult && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an educational assessment expert.
Read the student study note below and automatically generate:
1. Exactly 5 multiple-choice questions (MCQs). Each question must have exactly 4 options, a correctIndex (integer 0 to 3), a thorough explanation, and conceptTested.
2. Exactly 3 high-yield flashcards with front (prompt), back (answer), hint (mnemonic), and category.

Note Title: ${noteTitle}
Subject: ${noteSubject}

Note Content:
"""
${noteContent.trim()}
"""`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                quizzes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      conceptTested: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctIndex', 'explanation', 'conceptTested'],
                  },
                },
                flashcards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      front: { type: Type.STRING },
                      back: { type: Type.STRING },
                      hint: { type: Type.STRING },
                      category: { type: Type.STRING },
                    },
                    required: ['front', 'back', 'hint', 'category'],
                  },
                },
              },
              required: ['quizzes', 'flashcards'],
            },
          },
        });

        const text = response.text;
        if (text) {
          parsedResult = JSON.parse(text);
          providerUsed = 'gemini';
        }
      } catch (geminiError) {
        console.warn('Gemini generation error, using fallback extractor:', geminiError);
      }
    }

    // 3. Fallback extractor if neither OpenAI nor Gemini succeeded
    if (!parsedResult) {
      providerUsed = 'fallback';
      const cleanLines = noteContent
        .split('\n')
        .map((l: string) => l.replace(/^[#*>\-\d.]+\s*/, '').trim())
        .filter((l: string) => l.length > 25);

      const q1Target = cleanLines[0] || `${noteTitle} core concepts`;
      const q2Target = cleanLines[1] || `${noteTitle} methodology`;
      const q3Target = cleanLines[2] || `${noteTitle} principles`;
      const q4Target = cleanLines[3] || `${noteTitle} applications`;
      const q5Target = cleanLines[4] || `${noteTitle} exam review`;

      parsedResult = {
        quizzes: [
          {
            question: `What is the primary thesis or principle highlighted in the study note on "${noteTitle}"?`,
            options: [
              q1Target.length > 90 ? q1Target.substring(0, 90) + '...' : q1Target,
              `The opposite claim where ${noteSubject} principles are inverted.`,
              `A secondary unrelated theory not supported by the note text.`,
              `A common distractor assumption often tested on standard exams.`
            ],
            correctIndex: 0,
            explanation: `Based on the study note text: ${q1Target}`,
            conceptTested: `${noteSubject} Fundamental Concept`,
          },
          {
            question: `Which of the following best characterizes the key mechanism detailed in "${noteTitle}"?`,
            options: [
              `It operates independently of any underlying ${noteSubject} rules.`,
              q2Target.length > 90 ? q2Target.substring(0, 90) + '...' : q2Target,
              `It is strictly theoretical with no observed empirical evidence.`,
              `It was disproven in contemporary ${noteSubject} research.`
            ],
            correctIndex: 1,
            explanation: `The note explains: ${q2Target}`,
            conceptTested: 'Mechanism & Implementation',
          },
          {
            question: `When analyzing the framework described in these notes, what critical relationship is established?`,
            options: [
              `An arbitrary correlation with no functional causality.`,
              `Complete symmetry across all tested scenarios.`,
              q3Target.length > 90 ? q3Target.substring(0, 90) + '...' : q3Target,
              `A contradiction between earlier and later experimental findings.`
            ],
            correctIndex: 2,
            explanation: `According to the note: ${q3Target}`,
            conceptTested: 'Relationships & Principles',
          },
          {
            question: `In practical ${noteSubject} applications, what is an essential consideration noted in the material?`,
            options: [
              q4Target.length > 90 ? q4Target.substring(0, 90) + '...' : q4Target,
              `Application rules never vary regardless of operating conditions.`,
              `The framework only applies under zero-gravity conditions.`,
              `No quantitative metrics can be derived from this principle.`
            ],
            correctIndex: 0,
            explanation: `The application insight from the note is: ${q4Target}`,
            conceptTested: 'Practical Application',
          },
          {
            question: `What is the main takeaway regarding "${noteTitle}" for upcoming examinations or revision?`,
            options: [
              `This topic is purely optional and rarely tested.`,
              `Students should only memorize dates without understanding the theory.`,
              `All previous equations can be disregarded in this context.`,
              q5Target.length > 90 ? q5Target.substring(0, 90) + '...' : q5Target,
            ],
            correctIndex: 3,
            explanation: `Review takeaway from the note: ${q5Target}`,
            conceptTested: 'Exam Takeaway & Synthesis',
          },
        ],
        flashcards: [
          {
            front: `What is the core premise of "${noteTitle}"?`,
            back: cleanLines[0] || `Key conceptual framework in ${noteSubject}.`,
            hint: `Focus on the opening principle described in your note`,
            category: 'Core Concept',
          },
          {
            front: `What key mechanism is described in these ${noteSubject} notes?`,
            back: cleanLines[1] || `The operational dynamics of ${noteTitle}.`,
            hint: `Recall the second major section of your notes`,
            category: 'Mechanism',
          },
          {
            front: `What is the primary examination takeaway for "${noteTitle}"?`,
            back: cleanLines[2] || `Essential formula or theory to remember for exams.`,
            hint: `Think about active recall questions for tests`,
            category: 'Key Fact',
          },
        ],
      };
    }

    // Format quizzes and flashcards with IDs
    const formattedQuizzes = (parsedResult.quizzes || []).slice(0, 5).map((q: any, idx: number) => ({
      ...q,
      id: `note-quiz-${noteId}-${idx}`,
      userAnswer: null,
      isFlagged: false,
    }));

    const formattedFlashcards = (parsedResult.flashcards || []).slice(0, 3).map((c: any, idx: number) => ({
      ...c,
      id: `note-card-${noteId}-${idx}`,
      masteryStatus: 'new',
      reviewCount: 0,
    }));

    const generatedRecord = {
      noteId,
      generatedAt: new Date().toISOString(),
      provider: providerUsed,
      quizzes: formattedQuizzes,
      flashcards: formattedFlashcards,
    };

    // Store in database linked to this specific note
    noteQuizzesDatabase.set(noteId, generatedRecord);

    return res.json({
      success: true,
      data: generatedRecord,
    });
  } catch (error: any) {
    console.error('Error generating note quiz:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate quiz for note.',
    });
  }
});

// Endpoint: Get stored quiz for a specific note
app.get('/api/notes/:id/quiz', (req, res) => {
  const noteId = req.params.id;
  const stored = noteQuizzesDatabase.get(noteId);
  if (!stored) {
    return res.status(404).json({ success: false, error: 'No quiz found for this note.' });
  }
  return res.json({ success: true, data: stored });
});


// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

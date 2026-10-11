// Voice and Speech Recognition Utilities

// Web Speech API interface declarations for TypeScript
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function createSpeechRecognition(): ISpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SpeechRecognitionConstructor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) return null;
  return new SpeechRecognitionConstructor() as ISpeechRecognition;
}

export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof window.MediaRecorder === 'function'
  );
}

/**
 * Fuzzy matches spoken speech to one of the multiple-choice options.
 * Detects:
 * - Option letters: "A", "B", "C", "D" (e.g., "Option A", "Choice B", "Letter C")
 * - Option numbers: "1", "2", "3", "4" (e.g., "Option 1", "The first one", "Second")
 * - Direct phrase/word matching against option texts
 */
export interface VoiceMatchResult {
  matchedIndex: number;
  matchType: 'letter' | 'number' | 'text' | 'exact';
  confidence: number;
  matchedOptionText: string;
}

export function matchSpokenTextToOption(
  spokenText: string,
  options: string[]
): VoiceMatchResult | null {
  if (!spokenText || !options || options.length === 0) return null;

  const cleanSpoken = spokenText.trim().toLowerCase();
  const letterMap: Record<string, number> = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    alpha: 0,
    bravo: 1,
    charlie: 2,
    delta: 3,
  };

  const numberWords: Record<string, number> = {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    one: 0,
    two: 1,
    three: 2,
    four: 3,
    five: 4,
    first: 0,
    second: 1,
    third: 2,
    fourth: 3,
    fifth: 4,
  };

  // 1. Direct check for option letters like "option a", "choice b", "answer c", or just "A"
  for (const [key, idx] of Object.entries(letterMap)) {
    if (idx >= options.length) continue;
    // Regex matching: isolated letter or preceded by option/choice/letter/answer
    const regex = new RegExp(`\\b(option|choice|letter|answer|select)?\\s*${key}\\b`, 'i');
    if (regex.test(cleanSpoken)) {
      // Check that it's a deliberate match, e.g. "a" alone or "option a"
      const tokens = cleanSpoken.split(/\s+/);
      const isIsolatedLetter = tokens.includes(key);
      const hasPrefix = /(option|choice|letter|answer)\s+[a-e]/i.test(cleanSpoken);
      
      if (hasPrefix || isIsolatedLetter || ['alpha', 'bravo', 'charlie', 'delta'].includes(key)) {
        return {
          matchedIndex: idx,
          matchType: 'letter',
          confidence: 0.95,
          matchedOptionText: options[idx],
        };
      }
    }
  }

  // 2. Direct check for option numbers: "option 1", "choice 2", "the first one", "number 3"
  for (const [key, idx] of Object.entries(numberWords)) {
    if (idx >= options.length) continue;
    const regex = new RegExp(`\\b(option|choice|number|the)?\\s*${key}\\s*(one)?\\b`, 'i');
    if (regex.test(cleanSpoken)) {
      return {
        matchedIndex: idx,
        matchType: 'number',
        confidence: 0.9,
        matchedOptionText: options[idx],
      };
    }
  }

  // 3. Match spoken words against option content
  // Remove punctuation from spoken string and option text
  const cleanString = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const spokenCleaned = cleanString(cleanSpoken);
  const spokenTokens = spokenCleaned.split(' ').filter((w) => w.length > 2);

  let bestMatchIdx = -1;
  let bestScore = 0;

  options.forEach((opt, idx) => {
    const optCleaned = cleanString(opt);

    // Exact inclusion: spoken clean string contains option clean string, or vice versa
    if (optCleaned.length > 3 && spokenCleaned.includes(optCleaned)) {
      if (optCleaned.length > bestScore) {
        bestScore = 100 + optCleaned.length;
        bestMatchIdx = idx;
      }
      return;
    }

    if (spokenTokens.length >= 2 && optCleaned.includes(spokenCleaned)) {
      if (spokenCleaned.length > bestScore) {
        bestScore = 80 + spokenCleaned.length;
        bestMatchIdx = idx;
      }
      return;
    }

    // Keyword overlap count
    const optTokens = optCleaned.split(' ').filter((w) => w.length > 2);
    let matchedKeywords = 0;
    spokenTokens.forEach((st) => {
      if (optTokens.includes(st)) {
        matchedKeywords++;
      }
    });

    if (matchedKeywords > 0) {
      const score = matchedKeywords / Math.max(optTokens.length, 1);
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestMatchIdx = idx;
      }
    }
  });

  if (bestMatchIdx !== -1) {
    return {
      matchedIndex: bestMatchIdx,
      matchType: 'text',
      confidence: Math.min(0.85, 0.5 + bestScore * 0.1),
      matchedOptionText: options[bestMatchIdx],
    };
  }

  return null;
}

// Convert audio blob to Base64 Data URL for persistent storage
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Format seconds into MM:SS
export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

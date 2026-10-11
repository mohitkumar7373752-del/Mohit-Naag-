import { QuizAttempt, StudyNote } from '../types/study';

export interface StudyInteraction {
  id: string;
  timestamp: string; // ISO date string
  date: string; // YYYY-MM-DD
  type: 'note_create' | 'note_edit' | 'note_view' | 'quiz_start' | 'quiz_complete' | 'quiz_retake' | 'ai_generate';
  title: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  isActiveToday: boolean;
  activeDates: string[]; // Sorted unique YYYY-MM-DD strings
  recentInteractions: StudyInteraction[];
}

export const STREAK_STORAGE_KEY = 'studypulse_study_streak_v2';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPastDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateString(d);
};

// Calculate consecutive days streak
export const calculateStreakFromDates = (
  dateStrings: string[]
): { currentStreak: number; longestStreak: number; isActiveToday: boolean; lastActiveDate: string } => {
  if (!dateStrings || dateStrings.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isActiveToday: false, lastActiveDate: '' };
  }

  const uniqueSortedDates = Array.from(new Set(dateStrings)).sort().reverse();
  const todayStr = getLocalDateString();
  const yesterdayStr = getPastDateString(1);

  const isActiveToday = uniqueSortedDates.includes(todayStr);
  const lastActiveDate = uniqueSortedDates[0] || '';

  // Determine starting point for current streak
  let currentStreak = 0;
  let checkDate = new Date();

  if (isActiveToday) {
    // Streak started/continued today
    currentStreak = 1;
    let daysBack = 1;
    while (true) {
      const prevDateStr = getPastDateString(daysBack);
      if (uniqueSortedDates.includes(prevDateStr)) {
        currentStreak++;
        daysBack++;
      } else {
        break;
      }
    }
  } else if (uniqueSortedDates.includes(yesterdayStr)) {
    // User hasn't studied today yet, but streak is still intact from yesterday
    currentStreak = 1;
    let daysBack = 2;
    while (true) {
      const prevDateStr = getPastDateString(daysBack);
      if (uniqueSortedDates.includes(prevDateStr)) {
        currentStreak++;
        daysBack++;
      } else {
        break;
      }
    }
  } else {
    // Neither today nor yesterday had study activity
    currentStreak = 0;
  }

  // Calculate longest streak across history
  let longestStreak = 0;
  if (uniqueSortedDates.length > 0) {
    // Convert sorted dates to timestamp ms to test 1-day gaps
    const parsedDates = uniqueSortedDates
      .map((d) => new Date(`${d}T00:00:00`).getTime())
      .sort((a, b) => a - b); // ascending

    let tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < parsedDates.length; i++) {
      const diffDays = Math.round((parsedDates[i] - parsedDates[i - 1]) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    lastActiveDate,
  };
};

// Initial default streak seeded for an exciting and realistic student experience
export const getDefaultStreakData = (): StreakData => {
  const today = getLocalDateString();
  const yesterday = getPastDateString(1);
  const twoDaysAgo = getPastDateString(2);
  const threeDaysAgo = getPastDateString(3);

  const initialDates = [threeDaysAgo, twoDaysAgo, yesterday, today];
  const { currentStreak, longestStreak, isActiveToday, lastActiveDate } =
    calculateStreakFromDates(initialDates);

  return {
    currentStreak: Math.max(currentStreak, 4),
    longestStreak: Math.max(longestStreak, 7),
    lastActiveDate: today,
    isActiveToday: true,
    activeDates: initialDates,
    recentInteractions: [
      {
        id: 'init-1',
        timestamp: new Date().toISOString(),
        date: today,
        type: 'quiz_complete',
        title: 'Completed Quantum Mechanics Quiz (80%)',
      },
      {
        id: 'init-2',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        date: today,
        type: 'note_view',
        title: 'Reviewed JavaScript Event Loop note',
      },
      {
        id: 'init-3',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        date: yesterday,
        type: 'note_edit',
        title: 'Updated Molecular Biology Notes',
      },
    ],
  };
};

export const loadStoredStreakData = (): StreakData => {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Recalculate streak in case a calendar day has passed
      const { currentStreak, longestStreak, isActiveToday, lastActiveDate } =
        calculateStreakFromDates(parsed.activeDates || []);

      return {
        ...parsed,
        currentStreak,
        longestStreak: Math.max(parsed.longestStreak || 0, longestStreak),
        isActiveToday,
        lastActiveDate: lastActiveDate || parsed.lastActiveDate,
      };
    }
  } catch (e) {
    console.error('Failed to load streak data from storage', e);
  }
  return getDefaultStreakData();
};

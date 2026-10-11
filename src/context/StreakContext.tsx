import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StreakData,
  StudyInteraction,
  STREAK_STORAGE_KEY,
  getLocalDateString,
  calculateStreakFromDates,
  loadStoredStreakData,
} from '../utils/streakUtils';

interface StreakContextType {
  streakData: StreakData;
  recordInteraction: (type: StudyInteraction['type'], title: string) => void;
  isStreakModalOpen: boolean;
  setIsStreakModalOpen: (open: boolean) => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streakData, setStreakData] = useState<StreakData>(() => loadStoredStreakData());
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakData));
    } catch (e) {
      console.error('Failed to persist streak data', e);
    }
  }, [streakData]);

  const recordInteraction = useCallback(
    (type: StudyInteraction['type'], title: string) => {
      setStreakData((prev) => {
        const todayStr = getLocalDateString();
        const updatedDates = Array.from(new Set([todayStr, ...prev.activeDates])).sort().reverse();
        const { currentStreak, longestStreak } = calculateStreakFromDates(updatedDates);

        const newInteraction: StudyInteraction = {
          id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          date: todayStr,
          type,
          title,
        };

        const updatedInteractions = [
          newInteraction,
          ...prev.recentInteractions.filter((i) => i.title !== title || i.date !== todayStr),
        ].slice(0, 15);

        return {
          currentStreak,
          longestStreak: Math.max(prev.longestStreak, longestStreak),
          lastActiveDate: todayStr,
          isActiveToday: true,
          activeDates: updatedDates,
          recentInteractions: updatedInteractions,
        };
      });
    },
    []
  );

  return (
    <StreakContext.Provider
      value={{
        streakData,
        recordInteraction,
        isStreakModalOpen,
        setIsStreakModalOpen,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = (): StreakContextType => {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};

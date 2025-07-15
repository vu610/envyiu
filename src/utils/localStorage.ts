// Utility functions for localStorage management

export interface SavedProgress {
  testId: string;
  currentTranscriptIndex: number;
  userAnswers: Record<string, string>;
  stats: {
    total: number;
    correct: number;
    attempted: number;
  };
  blanksState: Record<string, {
    id: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    hasBeenChecked: boolean;
  }>;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'toeic_practice_';

export const saveProgress = (testId: string, progress: Omit<SavedProgress, 'testId' | 'timestamp'>) => {
  try {
    const savedData: SavedProgress = {
      ...progress,
      testId,
      timestamp: Date.now()
    };
    
    const key = `${STORAGE_KEY_PREFIX}${testId}`;
    localStorage.setItem(key, JSON.stringify(savedData));
    
    console.log('Progress saved for test:', testId);
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

export const loadProgress = (testId: string): SavedProgress | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${testId}`;
    const saved = localStorage.getItem(key);
    
    if (!saved) return null;
    
    const data = JSON.parse(saved) as SavedProgress;
    
    // Validate data structure
    if (data.testId !== testId) return null;
    
    console.log('Progress loaded for test:', testId);
    return data;
  } catch (error) {
    console.error('Failed to load progress:', error);
    return null;
  }
};

export const clearProgress = (testId: string) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${testId}`;
    localStorage.removeItem(key);
    console.log('Progress cleared for test:', testId);
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
};

export const getAllSavedTests = (): string[] => {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_KEY_PREFIX))
      .map(key => key.replace(STORAGE_KEY_PREFIX, ''));
  } catch (error) {
    console.error('Failed to get saved tests:', error);
    return [];
  }
};

export const getProgressSummary = (testId: string): { completed: number; total: number; accuracy: number } | null => {
  const progress = loadProgress(testId);
  if (!progress) return null;

  const { stats } = progress;
  console.log('Progress summary for test', testId, ':', stats);

  const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;

  return {
    completed: stats.attempted,
    total: stats.total,
    accuracy: Math.round(accuracy)
  };
};

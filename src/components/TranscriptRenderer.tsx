import React, { useState, useEffect } from 'react';
import './TranscriptRenderer.css';

interface TranscriptRendererProps {
  transcript: string;
  transcriptId: string;
  practiceMode: 'practice' | 'answer';
  onAnswerChange?: (answers: Record<string, string>) => void;
  onIncorrectAnswer?: () => void;
  onBlanksStateChange?: (blanks: Record<string, BlankAnswer>) => void;
  initialBlanksState?: Record<string, BlankAnswer>;
  onTranscriptComplete?: () => void;
}

interface BlankAnswer {
  id: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  hasBeenChecked: boolean;
}

const TranscriptRenderer: React.FC<TranscriptRendererProps> = ({
  transcript,
  transcriptId,
  practiceMode: _practiceMode, // Unused but keeping for API compatibility
  onAnswerChange,
  onIncorrectAnswer,
  onBlanksStateChange,
  initialBlanksState,
  onTranscriptComplete
}) => {
  const [blanks, setBlanks] = useState<Record<string, BlankAnswer>>({});

  // Parse transcript và extract các từ trong []
  const parseTranscript = (text: string) => {
    const parts: Array<{ type: 'text' | 'blank'; content: string; id?: string }> = [];
    let currentIndex = 0;
    let blankIndex = 0;

    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Thêm text trước blank
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          content: text.slice(currentIndex, match.index)
        });
      }

      // Thêm blank với unique ID
      const blankId = `${transcriptId}_blank_${blankIndex}`;
      const correctAnswer = match[1];
      
      parts.push({
        type: 'blank',
        content: correctAnswer,
        id: blankId
      });

      // Initialize blank state nếu chưa có
      if (!blanks[blankId]) {
        setBlanks(prev => ({
          ...prev,
          [blankId]: {
            id: blankId,
            correctAnswer,
            userAnswer: '',
            isCorrect: false,
            hasBeenChecked: false
          }
        }));
      }

      currentIndex = regex.lastIndex;
      blankIndex++;
    }

    // Thêm text còn lại
    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(currentIndex)
      });
    }

    return parts;
  };

  // Improved answer checking function
  const normalizeAnswer = (answer: string): string => {
    return answer
      .trim() // Remove leading/trailing whitespace
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };

  const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);

    // Exact match
    if (normalizedUser === normalizedCorrect) {
      return true;
    }

    // Check for common variations (optional - can be expanded)
    const variations = [
      normalizedCorrect,
      normalizedCorrect.replace(/'/g, "'"), // Handle different apostrophe types
      normalizedCorrect.replace(/'/g, ""), // Remove apostrophes
    ];

    return variations.includes(normalizedUser);
  };

  const handleInputChange = (blankId: string, value: string) => {
    const blank = blanks[blankId];
    if (!blank) return;

    // Reset hasBeenChecked when user types
    const updatedBlanks = {
      ...blanks,
      [blankId]: {
        ...blank,
        userAnswer: value,
        isCorrect: false,
        hasBeenChecked: false
      }
    };

    setBlanks(updatedBlanks);

    // Notify parent for answer tracking
    if (onAnswerChange) {
      const answers: Record<string, string> = {};
      Object.values(updatedBlanks).forEach(blank => {
        answers[blank.id] = blank.userAnswer;
      });
      onAnswerChange(answers);
    }
  };



  const focusInput = (direction: 'next' | 'prev', currentBlankId: string): boolean => {
    const inputs = document.querySelectorAll('.transcript-input');
    const currentIndex = Array.from(inputs).findIndex(
      input => (input as HTMLInputElement).dataset.blankId === currentBlankId
    );

    if (currentIndex >= 0) {
      let targetIndex = -1;

      if (direction === 'next' && currentIndex < inputs.length - 1) {
        targetIndex = currentIndex + 1;
      } else if (direction === 'prev' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      }

      if (targetIndex >= 0) {
        (inputs[targetIndex] as HTMLInputElement).focus();
        return true; // Successfully moved
      }
    }

    return false; // Could not move (reached end or beginning)
  };

  const handleKeyDown = (e: React.KeyboardEvent, blankId: string) => {
    // Prevent number input (for audio controls)
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const blank = blanks[blankId];

      if (!blank || !blank.userAnswer.trim()) {
        return; // Don't do anything if empty
      }

      // Check the answer
      const isCorrect = checkAnswer(blank.userAnswer, blank.correctAnswer);

      // Update the blank state
      const updatedBlanks = {
        ...blanks,
        [blankId]: {
          ...blank,
          isCorrect,
          hasBeenChecked: true
        }
      };

      setBlanks(updatedBlanks);

      // Send blanks state to parent
      if (onBlanksStateChange) {
        onBlanksStateChange(updatedBlanks);
      }

      // Send answers to parent
      if (onAnswerChange) {
        const answers: Record<string, string> = {};
        Object.values(updatedBlanks).forEach(blank => {
          answers[blank.id] = blank.userAnswer;
        });
        onAnswerChange(answers);
      }

      // Only move to next input if answer is correct
      if (isCorrect) {
        const moved = focusInput('next', blankId);

        // If couldn't move to next (last input) and all blanks are correct, complete transcript
        if (!moved && onTranscriptComplete) {
          const allBlanks = Object.values(updatedBlanks);
          const allCorrect = allBlanks.every(b => b.isCorrect && b.hasBeenChecked);

          if (allCorrect) {
            // Delay to show the correct answer briefly before moving
            setTimeout(() => {
              onTranscriptComplete();
            }, 500);
          }
        }
      } else {
        // If incorrect, trigger audio replay and stay in the same input
        if (onIncorrectAnswer) {
          onIncorrectAnswer();
        }
      }
    }
  };

  // Global keyboard navigation
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const inputs = document.querySelectorAll('.transcript-input');
        if (inputs.length > 0) {
          (inputs[0] as HTMLInputElement).focus();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const inputs = document.querySelectorAll('.transcript-input');
        if (inputs.length > 0) {
          (inputs[inputs.length - 1] as HTMLInputElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, []);

  // Initialize blanks when transcript changes
  useEffect(() => {
    if (initialBlanksState && Object.keys(initialBlanksState).length > 0) {
      // Filter blanks for current transcript only
      const currentTranscriptBlanks = Object.keys(initialBlanksState)
        .filter(key => key.startsWith(transcriptId))
        .reduce((acc, key) => {
          acc[key] = initialBlanksState[key];
          return acc;
        }, {} as Record<string, BlankAnswer>);

      setBlanks(currentTranscriptBlanks);
    } else {
      // Reset to empty state
      setBlanks({});
    }
  }, [transcript, transcriptId, initialBlanksState]);

  const parts = parseTranscript(transcript);

  return (
    <div className="transcript-renderer">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else {
          const blank = blanks[part.id!];
          const showError = blank && blank.hasBeenChecked && !blank.isCorrect;
          const showCorrect = blank && blank.hasBeenChecked && blank.isCorrect;

          return (
            <span key={index} className="blank-container">
              <input
                type="text"
                className={`transcript-input ${showError ? 'error' : ''} ${showCorrect ? 'correct' : ''}`}
                value={blank?.userAnswer || ''}
                onChange={(e) => handleInputChange(part.id!, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, part.id!)}
                data-blank-id={part.id}
                placeholder="___"
                style={{
                  width: `${Math.max(part.content.length * 0.8 + 2, 4)}em`,
                  minWidth: '4em',
                  maxWidth: '12em'
                }}
              />
              {showError && (
                <span className="correct-answer">({part.content})</span>
              )}
            </span>
          );
        }
      })}
    </div>
  );
};

export default TranscriptRenderer;

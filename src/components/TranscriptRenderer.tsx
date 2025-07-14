import React, { useState, useEffect } from 'react';
import './TranscriptRenderer.css';

interface TranscriptRendererProps {
  transcript: string;
  practiceMode: 'practice' | 'answer';
  onAnswerChange?: (answers: Record<string, string>) => void;
  onStatsChange?: (stats: { total: number; correct: number; attempted: number }) => void;
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
  practiceMode,
  onAnswerChange,
  onStatsChange
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

      // Thêm blank
      const blankId = `blank_${blankIndex}`;
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



  const focusInput = (direction: 'next' | 'prev', currentBlankId: string) => {
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
      }
    }
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

      // Calculate and update stats
      const allBlanks = Object.values(updatedBlanks);
      const total = allBlanks.length;
      const attempted = allBlanks.filter(b => b.hasBeenChecked).length;
      const correct = allBlanks.filter(b => b.isCorrect).length;

      if (onAnswerChange) {
        const answers: Record<string, string> = {};
        allBlanks.forEach(blank => {
          answers[blank.id] = blank.userAnswer;
        });
        onAnswerChange(answers);
      }

      if (onStatsChange) {
        onStatsChange({ total, correct, attempted });
      }

      // Only move to next input if answer is correct
      if (isCorrect) {
        focusInput('next', blankId);
      }
      // If incorrect, stay in the same input (user can try again or move manually)
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

  // Reset blanks when transcript changes
  useEffect(() => {
    setBlanks({});
  }, [transcript]);

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

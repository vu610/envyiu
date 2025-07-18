import React, { useState, useEffect, useRef } from 'react';
import TranscriptRenderer from './TranscriptRenderer';
import AudioPlayer from './AudioPlayer';
import type { AudioPlayerRef } from './AudioPlayer';
import HelpModal from './HelpModal';
import ThemeToggle from './ThemeToggle';
import { saveProgress, loadProgress, clearProgress } from '../utils/localStorage';
import './PracticePage.css';

interface TranscriptItem {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  transcript: string;
}

interface PracticePageProps {
  testId: string;
  onBackToHome: () => void;
}

const PracticePage: React.FC<PracticePageProps> = ({ testId, onBackToHome }) => {
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed practiceMode - now always in practice mode with Enter to check
  // @ts-ignore - userAnswers is needed for setUserAnswers usage
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, correct: 0, attempted: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [blanksState, setBlanksState] = useState<Record<string, any>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const response = await fetch(`/transcripts/Test_${testId}.json`);
        if (!response.ok) {
          throw new Error('Failed to fetch transcripts');
        }
        const data = await response.json();
        setTranscripts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscripts();
  }, [testId]);

  // Load saved progress when transcripts are loaded
  useEffect(() => {
    if (transcripts.length > 0) {
      const savedProgress = loadProgress(testId);
      if (savedProgress) {
        console.log('Loading saved progress:', savedProgress);
        setCurrentTranscriptIndex(savedProgress.currentTranscriptIndex);
        setUserAnswers(savedProgress.userAnswers);
        setStats(savedProgress.stats);
        setBlanksState(savedProgress.blanksState);
      }
    }
  }, [testId, transcripts.length]);

  const currentTranscript = transcripts[currentTranscriptIndex];

  const handleAnswerChange = (answers: Record<string, string>) => {
    setUserAnswers(answers);
  };

  // Removed handleStatsChange - stats now calculated from blanksState

  const handleIncorrectAnswer = () => {
    // Trigger audio replay when user enters incorrect answer
    if (audioPlayerRef.current) {
      audioPlayerRef.current.replayAroundCurrentTime();
    }
  };

  const handleBlanksStateChange = (newBlanksState: Record<string, any>) => {
    // Merge with existing blanksState instead of replacing
    setBlanksState(prevState => ({
      ...prevState,
      ...newBlanksState
    }));
  };

  // Calculate stats from all blanksState (across all transcripts)
  const calculateTotalStats = (allBlanksState: Record<string, any>) => {
    const allBlanks = Object.values(allBlanksState);
    const total = allBlanks.length;
    const attempted = allBlanks.filter((b: any) => b.hasBeenChecked).length;
    const correct = allBlanks.filter((b: any) => b.isCorrect).length;

    return { total, correct, attempted };
  };

  // Update stats whenever blanksState changes
  useEffect(() => {
    const newStats = calculateTotalStats(blanksState);
    console.log('Calculated total stats:', newStats);
    setStats(newStats);
  }, [blanksState]);

  const handleResetProgress = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ tiến trình làm bài? Hành động này không thể hoàn tác.')) {
      clearProgress(testId);
      // Reset all states
      setCurrentTranscriptIndex(0);
      setUserAnswers({});
      setStats({ total: 0, correct: 0, attempted: 0 });
      setBlanksState({});
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTranscriptComplete = () => {
    // Auto-advance to next transcript if not the last one
    if (currentTranscriptIndex < transcripts.length - 1) {
      console.log('Auto-advancing to next transcript');
      setCurrentTranscriptIndex(currentTranscriptIndex + 1);
    } else {
      console.log('All transcripts completed!');
      // Could show completion message or redirect
    }
  };

  // Save progress to localStorage
  const saveCurrentProgress = () => {
    console.log('Saving progress:', { currentTranscriptIndex, userAnswers, stats, blanksState });
    saveProgress(testId, {
      currentTranscriptIndex,
      userAnswers,
      stats,
      blanksState
    });
  };

  // Auto-save when important state changes
  useEffect(() => {
    if (transcripts.length > 0) {
      saveCurrentProgress();
    }
  }, [currentTranscriptIndex, userAnswers, stats, blanksState]);

  // Reset stats when transcript changes
  useEffect(() => {
    setStats({ total: 0, correct: 0, attempted: 0 });
    setUserAnswers({});
  }, [currentTranscriptIndex]);

  // Keyboard navigation for sidebar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        setCurrentTranscriptIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        setCurrentTranscriptIndex(prev => Math.min(transcripts.length - 1, prev + 1));
      } else if (e.key === 'F1' || (e.key === '?' && e.shiftKey)) {
        e.preventDefault();
        setShowHelp(true);
      } else if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [transcripts.length]);

  if (loading) {
    return (
      <div className="practice-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu bài test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-page">
        <div className="error">
          <h3>⚠️ Có lỗi xảy ra</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()}>Thử lại</button>
            <button onClick={onBackToHome}>Về trang chủ</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-page">
      <header className="practice-header">
        <div className="left-section">
          <button className="back-button" onClick={onBackToHome}>
            ← Về trang chủ
          </button>
          <h1>Test {testId} - Luyện tập</h1>
          <button
            className="help-button"
            onClick={() => setShowHelp(true)}
            title="Xem phím tắt (F1 hoặc Shift + ?)"
          >
            ? Trợ giúp
          </button>
          <button
            className="help-button reset-button"
            onClick={handleResetProgress}
            title="Xóa tiến trình đã lưu"
          >
            🔄 Reset
          </button>
        </div>

        <div className="practice-controls">
          <span className="mode-info">
            Nhấn <kbd>Enter</kbd> để kiểm tra đáp án
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="practice-content">


        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-title">
              <h3>Danh sách câu hỏi</h3>
              <button
                className="sidebar-toggle"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
              >
                {sidebarCollapsed ? '▶' : '◀'}
              </button>
            </div>
            {!sidebarCollapsed && (
              <div className="progress-summary">
                {transcripts.length > 0 && (
                  <span className="progress-text">
                    {currentTranscriptIndex + 1} / {transcripts.length}
                  </span>
                )}
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="question-list">
              {transcripts.map((item, index) => {
              const isActive = index === currentTranscriptIndex;
              const isPrevious = index < currentTranscriptIndex;

              return (
                <div
                  key={item.id}
                  className={`question-item ${isActive ? 'active' : ''} ${isPrevious ? 'completed' : ''}`}
                  onClick={() => setCurrentTranscriptIndex(index)}
                  title={`Click để chuyển đến ${item.label}`}
                >
                  <div className="question-header">
                    <div className="question-label">{item.label}</div>
                    <div className="question-status">
                      {isPrevious && <span className="status-icon completed">✓</span>}
                      {isActive && <span className="status-icon current">▶</span>}
                    </div>
                  </div>
                  <div className="question-time">
                    {Math.floor(item.startTime / 60)}:{(item.startTime % 60).toFixed(0).padStart(2, '0')} -
                    {Math.floor(item.endTime / 60)}:{(item.endTime % 60).toFixed(0).padStart(2, '0')}
                  </div>
                  <div className="question-duration">
                    Thời lượng: {Math.round(item.endTime - item.startTime)}s
                  </div>
                </div>
              );
              })}
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="sidebar-footer">
            <div className="quick-nav">
              <button
                className="quick-nav-btn"
                onClick={() => setCurrentTranscriptIndex(0)}
                disabled={currentTranscriptIndex === 0}
                title="Về câu đầu tiên"
              >
                ⏮ Đầu
              </button>
              <button
                className="quick-nav-btn"
                onClick={() => setCurrentTranscriptIndex(transcripts.length - 1)}
                disabled={currentTranscriptIndex === transcripts.length - 1}
                title="Đến câu cuối cùng"
              >
                Cuối ⏭
              </button>
            </div>
          </div>
          )}
        </div>

        <div className="main-content">
          {currentTranscript && (
            <>
              <div className="transcript-header">
                <div className="transcript-title">
                  <h3>{currentTranscript.label}</h3>
                  {stats.total > 0 && (
                    <div className="stats-display">
                      <span className="stat-item">
                        Đúng: <strong className="correct">{stats.correct}</strong>
                      </span>
                      <span className="stat-item">
                        Đã làm: <strong>{stats.attempted}</strong>
                      </span>
                      <span className="stat-item">
                        Tổng: <strong>{stats.total}</strong>
                      </span>
                      <span className="stat-item accuracy">
                        Độ chính xác: <strong>
                          {stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0}%
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
                <AudioPlayer
                  ref={audioPlayerRef}
                  testId={testId}
                  currentSegment={{
                    startTime: currentTranscript.startTime,
                    endTime: currentTranscript.endTime
                  }}
                />
              </div>

              <div className="transcript-content">
                <TranscriptRenderer
                  transcript={currentTranscript.transcript}
                  transcriptId={currentTranscript.id}
                  practiceMode="practice"
                  onAnswerChange={handleAnswerChange}
                  onIncorrectAnswer={handleIncorrectAnswer}
                  onBlanksStateChange={handleBlanksStateChange}
                  initialBlanksState={blanksState}
                  onTranscriptComplete={handleTranscriptComplete}
                />
              </div>

              <div className="navigation-controls">
                <button
                  className="nav-btn"
                  disabled={currentTranscriptIndex === 0}
                  onClick={() => setCurrentTranscriptIndex(currentTranscriptIndex - 1)}
                >
                  ← Câu trước
                </button>
                <button
                  className="nav-btn"
                  disabled={currentTranscriptIndex === transcripts.length - 1}
                  onClick={() => setCurrentTranscriptIndex(currentTranscriptIndex + 1)}
                >
                  Câu tiếp theo →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default PracticePage;

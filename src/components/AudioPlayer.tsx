import React, { useRef, useEffect, useState } from 'react';

interface AudioPlayerProps {
  testId: string;
  currentSegment: {
    startTime: number;
    endTime: number;
  } | null;
  onTimeUpdate?: (currentTime: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  testId,
  currentSegment,
  onTimeUpdate
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load audio file
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const handleLoadedData = () => {
        console.log('Audio loaded successfully:', audio.src);
        console.log('Audio duration:', audio.duration);
        setIsLoading(false);
        setError(null);
      };

      const handleCanPlay = () => {
        console.log('Audio can play');
        setIsLoading(false);
        setError(null);
      };

      const handleError = (e: Event) => {
        console.error('Audio loading error:', e);
        console.error('Audio src:', audio.src);
        console.error('Audio error code:', audio.error?.code);
        console.error('Audio error message:', audio.error?.message);
        console.error('Audio readyState:', audio.readyState);
        console.error('Audio networkState:', audio.networkState);
        setIsLoading(false);
        setError(`Lỗi load audio: ${audio.error?.message || 'Unknown error'}`);
      };

      const handleLoadStart = () => {
        console.log('Audio load started');
        setIsLoading(true);
        setError(null);
      };

      const handleTimeUpdate = () => {
        const time = audio.currentTime;
        setCurrentTime(time);
        if (onTimeUpdate) {
          onTimeUpdate(time);
        }

        // Auto stop when reaching end time
        if (currentSegment && time >= currentSegment.endTime) {
          handlePause();
        }
      };

      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      audio.addEventListener('timeupdate', handleTimeUpdate);

      // Force load
      audio.load();

      return () => {
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [testId, currentSegment, onTimeUpdate]);

  // Handle play/pause
  const handlePlay = async () => {
    if (!audioRef.current || !currentSegment) return;

    try {
      const audio = audioRef.current;
      
      // Set to start time if not already there
      if (Math.abs(audio.currentTime - currentSegment.startTime) > 1) {
        audio.currentTime = currentSegment.startTime;
      }

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Không thể phát audio');
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  // Skip functions
  const handleSkipBackward = () => {
    if (audioRef.current && currentSegment) {
      const newTime = Math.max(
        audioRef.current.currentTime - 3,
        currentSegment.startTime
      );
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current && currentSegment) {
      const newTime = Math.min(
        audioRef.current.currentTime + 3,
        currentSegment.endTime
      );
      audioRef.current.currentTime = newTime;
    }
  };

  // Reset when segment changes
  useEffect(() => {
    if (audioRef.current && currentSegment) {
      handlePause();
      audioRef.current.currentTime = currentSegment.startTime;
    }
  }, [currentSegment]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle audio controls even when typing in input
      if (e.code === 'Digit2') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        handleSkipBackward();
      } else if (e.code === 'Digit3') {
        e.preventDefault();
        handleSkipForward();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentSegment]);

  if (error) {
    return (
      <div className="audio-error">
        <span>⚠️ {error}</span>
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
          <p>Đường dẫn audio: <code>/audios/Test_{testId}.mp3</code></p>
          <button
            onClick={() => window.open(`/audios/Test_${testId}.mp3`, '_blank')}
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
          >
            Test đường dẫn
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        src={`/audios/Test_${testId}.mp3`}
        style={{ display: 'none' }}
      >
        <source src={`/audios/Test_${testId}.mp3`} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Audio controls */}
      <div className="audio-controls">
        <button 
          className="control-btn"
          onClick={handleSkipBackward}
          disabled={!currentSegment || isLoading}
          title="Lùi 3 giây (phím 1)"
        >
          ⏮ -3s
        </button>
        
        <button
          className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handleTogglePlay}
          disabled={!currentSegment || isLoading}
          title="Play/Pause (phím 2)"
        >
          {isLoading ? '⏳' : isPlaying ? '⏸' : '▶'} 
          {isLoading ? 'Đang tải...' : isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button 
          className="control-btn"
          onClick={handleSkipForward}
          disabled={!currentSegment || isLoading}
          title="Tiến 3 giây (phím 3)"
        >
          +3s ⏭
        </button>
      </div>

      {/* Progress indicator */}
      {currentSegment && (
        <div className="audio-progress">
          <span className="time-display">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / 
            {Math.floor(currentSegment.endTime / 60)}:{(currentSegment.endTime % 60).toFixed(0).padStart(2, '0')}
          </span>
        </div>
      )}
    </>
  );
};

export default AudioPlayer;

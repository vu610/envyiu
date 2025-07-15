import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { getProgressSummary } from '../utils/localStorage';
import './HomePage.css';

interface Test {
  id: string;
  name: string;
}

interface HomePageProps {
  onSelectTest: (testId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectTest }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/index.json');
        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }
        const data = await response.json();
        setTests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">Đang tải danh sách bài test...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-top-bar">
        <ThemeToggle />
      </div>

      <header className="home-header">
        <h1>TOEIC Listening Practice</h1>
        <p>Luyện nghe TOEIC Part 3 & 4 - Phương pháp điền vào chỗ trống</p>
      </header>

      <main className="test-list-container">
        <h2>Chọn bài test để bắt đầu luyện tập</h2>
        <div className="test-grid">
          {tests.map((test) => {
            const progress = getProgressSummary(test.id);
            return (
              <div
                key={test.id}
                className="test-card"
                onClick={() => onSelectTest(test.id)}
              >
                <div className="test-number">Test {test.id}</div>
                <div className="test-name">{test.name}</div>
                {progress && (
                  <div className="test-progress">
                    <div className="progress-stats">
                      {progress.completed}/{progress.total} câu • {progress.accuracy}% đúng
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <div className="test-action">
                  {progress ? 'Tiếp tục luyện tập →' : 'Bắt đầu luyện tập →'}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default HomePage;

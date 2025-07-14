import { useState } from 'react'
import HomePage from './components/HomePage'
import PracticePage from './components/PracticePage'
import { ThemeProvider } from './contexts/ThemeContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'practice'>('home')
  const [selectedTestId, setSelectedTestId] = useState<string>('')

  const handleSelectTest = (testId: string) => {
    setSelectedTestId(testId)
    setCurrentPage('practice')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setSelectedTestId('')
  }

  return (
    <ThemeProvider>
      <div className="app">
        {currentPage === 'home' ? (
          <HomePage onSelectTest={handleSelectTest} />
        ) : (
          <PracticePage
            testId={selectedTestId}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>
    </ThemeProvider>
  )
}

export default App

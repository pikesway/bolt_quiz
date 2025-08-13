import React, { useState } from 'react';
import { Quiz, PersonalityType } from './types/quiz';
import { useQuizzes } from './hooks/useQuizzes';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { QuizBuilder } from './components/QuizBuilder';
import { QuizTaker } from './components/QuizTaker';
import { QuizResult } from './components/QuizResult';

type AppView = 'dashboard' | 'builder' | 'taker' | 'result';

function App() {
  const { loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<PersonalityType | null>(null);
  
  const { createQuiz, updateQuiz } = useQuizzes();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setCurrentView('builder');
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setCurrentView('builder');
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentView('taker');
  };

  const handleSaveQuiz = (quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>, coverImageFile?: File) => {
    if (editingQuiz) {
      updateQuiz(editingQuiz.id, quizData, coverImageFile);
    } else {
      createQuiz(quizData, coverImageFile);
    }
    setCurrentView('dashboard');
  };

  const handleQuizComplete = (result: PersonalityType) => {
    setQuizResult(result);
    setCurrentView('result');
  };

  const handleRetakeQuiz = () => {
    if (selectedQuiz) {
      setCurrentView('taker');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedQuiz(null);
    setEditingQuiz(null);
    setQuizResult(null);
  };

  switch (currentView) {
    case 'builder':
      return (
        <QuizBuilder
          quiz={editingQuiz || undefined}
          onSave={handleSaveQuiz}
          onClose={handleBackToDashboard}
        />
      );
      
    case 'taker':
      return selectedQuiz ? (
        <QuizTaker
          quiz={selectedQuiz}
          onComplete={handleQuizComplete}
          onBack={handleBackToDashboard}
        />
      ) : null;
      
    case 'result':
      return selectedQuiz && quizResult ? (
        <QuizResult
          quiz={selectedQuiz}
          result={quizResult}
          onBack={handleBackToDashboard}
          onRetake={handleRetakeQuiz}
        />
      ) : null;
      
    default:
      return (
        <Dashboard
          onCreateQuiz={handleCreateQuiz}
          onEditQuiz={handleEditQuiz}
          onTakeQuiz={handleTakeQuiz}
        />
      );
  }
}

export default App;
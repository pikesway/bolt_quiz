import { useState } from 'react';
import { Quiz, PersonalityType } from './types/quiz';
import { useQuizzes } from './hooks/useQuizzes';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { Dashboard } from './components/Dashboard';
import { QuizBuilder } from './components/QuizBuilder';
import { QuizTaker } from './components/QuizTaker';
import { QuizResult } from './components/QuizResult';

type AppView = 'dashboard' | 'builder' | 'taker' | 'result';

function AppContent() {
  const { loading: authLoading } = useAuth();
  const { createQuiz, loading: quizLoading } = useQuizzes();

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<PersonalityType | null>(null);

  if (authLoading || quizLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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

  const handleSaveQuiz = async (quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>, coverImageFile?: File) => {
    try {
      if (editingQuiz) {
        const { error } = await updateQuiz(editingQuiz.id, quizData, coverImageFile);
        if (error) {
          console.error('Error updating quiz:', error);
          return;
        }
      } else {
        const { error } = await createQuiz(quizData as Quiz, coverImageFile);
        if (error) {
          console.error('Error creating quiz:', error);
          return;
        }
      }
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
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

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <AppContent />
      </div>
    </ThemeProvider>
  );
}

export default App;

function updateQuiz(_id: string, _quizData: Omit<Quiz, "id" | "createdAt" | "updatedAt" | "totalTakes">, _coverImageFile: File | undefined): { error: any; } | PromiseLike<{ error: any; }> {
  throw new Error('Function not implemented.');
}

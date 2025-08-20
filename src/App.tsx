import { useState, useEffect } from 'react';
import { Quiz, PersonalityType } from './types/quiz';
import { useQuizzes } from './hooks/useQuizzes';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { Dashboard } from './components/Dashboard';
import { QuizBuilder } from './components/QuizBuilder';
import { QuizTaker } from './components/QuizTaker';
import { QuizResult } from './components/QuizResult';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';

type AppView = 'dashboard' | 'builder' | 'taker' | 'result';

function AppContent() {
  const { loading: authLoading, user } = useAuth();
  const { createQuiz, updateQuiz, loading: quizLoading, quizzes } = useQuizzes();

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<PersonalityType | null>(null);

  // Show loading spinner only during initial load or when auth state is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If not logged in and not loading, show dashboard (which will show auth modal)
  if (!user && currentView !== 'dashboard') {
    setCurrentView('dashboard');
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

  const handleSaveQuiz = async (quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>, coverImageFile?: File): Promise<{ error?: Error }> => {
    try {
      const result = editingQuiz
        ? await updateQuiz(editingQuiz.id, quizData, coverImageFile)
        : await createQuiz(quizData as Quiz, coverImageFile);
      
      return result;
    } catch (error) {
      console.error('Error saving quiz:', error);
      return { error: error instanceof Error ? error : new Error('Failed to save quiz') };
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

function QuizTakerWrapper() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { quizzes } = useQuizzes();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<PersonalityType | null>(null);

  useEffect(() => {
    if (slug && quizzes.length > 0) {
      const foundQuiz = quizzes.find(q => q.slug === slug);
      if (foundQuiz && foundQuiz.isPublished) {
        setQuiz(foundQuiz);
      } else {
        navigate('/');
      }
    }
  }, [slug, quizzes, navigate]);

  if (!quiz) return null;

  return result ? (
    <QuizResult
      quiz={quiz}
      result={result}
      onBack={() => navigate('/')}
      onRetake={() => setResult(null)}
    />
  ) : (
    <QuizTaker
      quiz={quiz}
      onComplete={setResult}
      onBack={() => navigate('/')}
    />
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Routes>
            <Route path="/quiz/:slug" element={<QuizTakerWrapper />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;

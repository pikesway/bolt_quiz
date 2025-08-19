import React from 'react';
import { useState } from 'react';
import { Quiz } from '../types/quiz';
import { useQuizzes } from '../hooks/useQuizzes';
import { useAuth } from '../hooks/useAuth';
import { QuizCard } from './QuizCard';
import { Header } from './Header';
import { AuthModal } from './AuthModal';
import { Plus, TrendingUp, Users, Eye } from 'lucide-react';

interface DashboardProps {
  onCreateQuiz: () => void;
  onEditQuiz: (quiz: Quiz) => void;
  onTakeQuiz: (quiz: Quiz) => void;
}

export function Dashboard({ onCreateQuiz, onEditQuiz, onTakeQuiz }: DashboardProps) {
  const { user } = useAuth();
  const { quizzes, loading } = useQuizzes();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onCreateQuiz={onCreateQuiz} onAuthClick={() => setShowAuthModal(true)} />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalTakes = quizzes.reduce((sum, quiz) => sum + quiz.totalTakes, 0);
  const publishedQuizzes = quizzes.filter(quiz => quiz.isPublished).length;

  const handleCreateQuiz = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    onCreateQuiz();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header onCreateQuiz={handleCreateQuiz} onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizzes.length}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{publishedQuizzes}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Takes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTakes.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. per Quiz</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {quizzes.length > 0 ? Math.round(totalTakes / quizzes.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Quizzes</h2>
            <button
              onClick={handleCreateQuiz}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Quiz
            </button>
          </div>
          
          {quizzes.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first personality quiz to get started</p>
              <button
                onClick={handleCreateQuiz}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onEdit={onEditQuiz}
                  onTake={onTakeQuiz}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
import React from 'react';
import { Quiz } from '../types/quiz';
import { useQuizzes } from '../hooks/useQuizzes';
import { QuizCard } from './QuizCard';
import { Header } from './Header';
import { Plus, TrendingUp, Users, Eye } from 'lucide-react';

interface DashboardProps {
  onCreateQuiz: () => void;
  onEditQuiz: (quiz: Quiz) => void;
  onTakeQuiz: (quiz: Quiz) => void;
}

export function Dashboard({ onCreateQuiz, onEditQuiz, onTakeQuiz }: DashboardProps) {
  const { quizzes, loading } = useQuizzes();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCreateQuiz={onCreateQuiz} />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateQuiz={onCreateQuiz} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{publishedQuizzes}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Takes</p>
                <p className="text-2xl font-bold text-gray-900">{totalTakes.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. per Quiz</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.length > 0 ? Math.round(totalTakes / quizzes.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Quizzes</h2>
            <button
              onClick={onCreateQuiz}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Quiz
            </button>
          </div>
          
          {quizzes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-6">Create your first personality quiz to get started</p>
              <button
                onClick={onCreateQuiz}
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
    </div>
  );
}
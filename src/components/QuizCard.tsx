import React, { useState } from 'react';
import { Quiz } from '../types/quiz';
import { Play, Edit, Eye, BarChart, Trash2 } from 'lucide-react';
import { useQuizzes } from '../hooks/useQuizzes';
import { useNavigate } from 'react-router-dom';

interface QuizCardProps {
  quiz: Quiz;
  onEdit: (quiz: Quiz) => void;
  onTake: (quiz: Quiz) => void;
}

export function QuizCard({ quiz, onEdit, onTake }: QuizCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteQuiz } = useQuizzes();
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {quiz.coverImageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={quiz.coverImageUrl}
            alt={quiz.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{quiz.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {quiz.totalTakes.toLocaleString()} takes
            </div>
            <div className="flex items-center gap-1">
              <BarChart className="w-4 h-4" />
              {quiz.questions.length} questions
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${quiz.isPublished 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
          }`}>
            {quiz.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => quiz.isPublished ? navigate(`/quiz/${quiz.slug}`) : onTake(quiz)}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <Play className="w-4 h-4" />
          Take Quiz
        </button>
        <button
          onClick={() => onEdit(quiz)}
          className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Quiz?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { error } = await deleteQuiz(quiz.id);
                  if (!error) {
                    setShowDeleteConfirm(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}